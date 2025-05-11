# backend/main.py
import os
from fastapi import FastAPI, Depends, HTTPException, Request, status, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
import jwt
import redis.asyncio as redis
import time
import uuid
import datetime
from typing import Optional, Dict, Any, List
from prometheus_client import Counter, Gauge, generate_latest
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import logging
from contextlib import asynccontextmanager
import asyncio
from .websocket_handlers import ConnectionManager
import numpy as np
from scipy import signal

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Setup tracing
trace.set_tracer_provider(TracerProvider())
tracer = trace.get_tracer(__name__)
span_processor = BatchSpanProcessor(OTLPSpanExporter(endpoint=os.getenv("OTLP_ENDPOINT", "localhost:4317")))
trace.get_tracer_provider().add_span_processor(span_processor)

# Metrics
request_counter = Counter('api_requests_total', 'API requests', ['endpoint', 'method', 'status'])
active_sessions = Gauge('active_sessions', 'Active JWT sessions')
error_counter = Counter('api_errors_total', 'API errors', ['endpoint', 'error_type'])

# Rate limiting
limiter = Limiter(key_func=get_remote_address)

# Models
class LoginRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8)

class ReasonRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=1000)
    context: Optional[Dict[str, Any]] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    expires_at: int

class ErrorResponse(BaseModel):
    detail: str
    code: str
    timestamp: float

class VocalAnalysisRequest(BaseModel):
    pitch: Optional[float] = None
    effects: List[Dict[str, Any]] = Field(default_factory=list)

class VocalAnalysisResponse(BaseModel):
    effects: Dict[str, float]
    suggestions: List[str]
    confidence: float

# Redis connection
@asynccontextmanager
async def get_redis():
    redis_client = redis.Redis(
        host=os.getenv("REDIS_HOST", "localhost"),
        port=int(os.getenv("REDIS_PORT", "6379")),
        password=os.getenv("REDIS_PASSWORD", None),
        decode_responses=True,
        ssl=os.getenv("REDIS_SSL", "false").lower() == "true"
    )
    try:
        yield redis_client
    finally:
        await redis_client.close()

# App init
app = FastAPI(
    title="LexCommand API",
    version="12.0.0",
    docs_url="/docs" if os.getenv("ENVIRONMENT") != "production" else None,
    redoc_url="/redoc" if os.getenv("ENVIRONMENT") != "production" else None
)

# Add rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Add CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Security
security = HTTPBearer()

# Auth utils
async def create_token(user_id: str, role: str, redis_client: redis.Redis) -> Token:
    with tracer.start_as_current_span("create_token") as span:
        span.set_attribute("user_id", user_id)
        span.set_attribute("role", role)
        
        now = datetime.datetime.utcnow()
        lifetime = int(os.getenv("TOKEN_LIFETIME", "3600"))
        jti = str(uuid.uuid4())
        
        payload = {
            "sub": user_id,
            "role": role,
            "iat": now,
            "exp": now + datetime.timedelta(seconds=lifetime),
            "jti": jti,
            "iss": "lexcommand.ai"
        }
        
        try:
            with open("/etc/lexcommand/keys/jwt-private.pem", "rb") as f:
                private_key = f.read()
            token = jwt.encode(payload, private_key, algorithm="RS256")
            await redis_client.setex(f"token:{jti}", lifetime, user_id)
            active_sessions.inc()
            return Token(access_token=token, token_type="bearer", expires_at=int(payload["exp"].timestamp()))
        except Exception as e:
            logger.error(f"Error creating token: {str(e)}")
            error_counter.labels(endpoint="/login", error_type="token_creation").inc()
            raise HTTPException(status_code=500, detail="Error creating token")

async def validate_token(credentials: HTTPAuthorizationCredentials = Depends(security), redis_client: redis.Redis = Depends(get_redis)):
    with tracer.start_as_current_span("validate_token") as span:
        try:
            with open("/etc/lexcommand/keys/jwt-public.pem", "rb") as f:
                public_key = f.read()
            payload = jwt.decode(credentials.credentials, public_key, algorithms=["RS256"])
            
            if not await redis_client.exists(f"token:{payload['jti']}"):
                error_counter.labels(endpoint="auth", error_type="token_revoked").inc()
                raise HTTPException(status_code=401, detail="Token revoked")
            
            span.set_attribute("user_id", payload["sub"])
            return payload
        except jwt.ExpiredSignatureError:
            active_sessions.dec()
            error_counter.labels(endpoint="auth", error_type="token_expired").inc()
            raise HTTPException(status_code=401, detail="Token expired")
        except jwt.InvalidTokenError as e:
            error_counter.labels(endpoint="auth", error_type="invalid_token").inc()
            raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

# Error handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_counter.labels(endpoint=request.url.path, error_type=type(exc).__name__).inc()
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            detail="Internal server error",
            code="INTERNAL_ERROR",
            timestamp=time.time()
        ).dict()
    )

# Endpoints
@app.post("/login", response_model=Token)
@limiter.limit("5/minute")
async def login(request: Request, req: LoginRequest, redis_client: redis.Redis = Depends(get_redis)):
    with tracer.start_as_current_span("login") as span:
        span.set_attribute("username", req.username)
        
        if req.username == "admin" and req.password == "secure_password":
            token = await create_token(req.username, "Overlord", redis_client)
            request_counter.labels(endpoint="/login", method="POST", status=200).inc()
            return token
        else:
            request_counter.labels(endpoint="/login", method="POST", status=401).inc()
            error_counter.labels(endpoint="/login", error_type="invalid_credentials").inc()
            raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/reason")
@limiter.limit("10/minute")
async def reason(
    request: Request,
    req: ReasonRequest,
    token: dict = Depends(validate_token),
    redis_client: redis.Redis = Depends(get_redis)
):
    with tracer.start_as_current_span("reason") as span:
        span.set_attribute("user_id", token["sub"])
        span.set_attribute("prompt_length", len(req.prompt))
        
        try:
            # TODO: Implement actual reasoning logic here
            result = {
                "response": f"Reasoned response to: {req.prompt}",
                "user": token["sub"],
                "time": time.time()
            }
            request_counter.labels(endpoint="/reason", method="POST", status=200).inc()
            return result
        except Exception as e:
            error_counter.labels(endpoint="/reason", error_type="processing_error").inc()
            logger.error(f"Error processing reason request: {str(e)}")
            raise HTTPException(status_code=500, detail="Error processing request")

@app.get("/health")
async def health():
    with tracer.start_as_current_span("health_check") as span:
        try:
            redis_client = await get_redis().__aenter__()
            await redis_client.ping()
            status = {
                "status": "healthy",
                "timestamp": time.time(),
                "services": {
                    "redis": "up",
                    "tracing": "up"
                }
            }
            request_counter.labels(endpoint="/health", method="GET", status=200).inc()
            return status
        except Exception as e:
            error_counter.labels(endpoint="/health", error_type="health_check_failed").inc()
            logger.error(f"Health check failed: {str(e)}")
            raise HTTPException(status_code=503, detail="Service unhealthy")

@app.get("/metrics")
async def metrics():
    return generate_latest()

@app.post("/api/analyze-vocals", response_model=VocalAnalysisResponse)
@limiter.limit("10/minute")
async def analyze_vocals(
    request: Request,
    req: VocalAnalysisRequest,
    token: dict = Depends(validate_token),
    redis_client: redis.Redis = Depends(get_redis)
):
    with tracer.start_as_current_span("analyze_vocals") as span:
        span.set_attribute("user_id", token["sub"])
        
        try:
            # Analyze pitch and suggest effects
            effects = {}
            suggestions = []
            confidence = 0.8

            if req.pitch:
                # Pitch-based effect suggestions
                if req.pitch < 200:
                    effects["pitch"] = 12  # Shift up one octave
                    suggestions.append("Pitch shift up for better clarity")
                elif req.pitch > 800:
                    effects["pitch"] = -12  # Shift down one octave
                    suggestions.append("Pitch shift down for better warmth")

            # Analyze current effects and suggest improvements
            current_effects = {e["type"]: e["value"] for e in req.effects}
            
            # Reverb suggestions
            if current_effects.get("reverb", 0) < 30:
                effects["reverb"] = 40
                suggestions.append("Add reverb for more presence")
            
            # Delay suggestions
            if current_effects.get("delay", 0) < 20:
                effects["delay"] = 30
                suggestions.append("Add delay for more depth")
            
            # Filter suggestions
            if not current_effects.get("filter"):
                effects["filter"] = 2000
                suggestions.append("Apply high-pass filter to reduce muddiness")

            # Auto-tune suggestions
            if req.pitch and abs(req.pitch - 440) > 10:  # If not close to A4
                effects["autotune"] = 50
                suggestions.append("Apply auto-tune for pitch correction")

            request_counter.labels(endpoint="/api/analyze-vocals", method="POST", status=200).inc()
            return VocalAnalysisResponse(
                effects=effects,
                suggestions=suggestions,
                confidence=confidence
            )
        except Exception as e:
            error_counter.labels(endpoint="/api/analyze-vocals", error_type="processing_error").inc()
            logger.error(f"Error analyzing vocals: {str(e)}")
            raise HTTPException(status_code=500, detail="Error analyzing vocals")

# Instrument FastAPI with OpenTelemetry
FastAPIInstrumentor.instrument_app(app)

# Create connection manager instance
manager = ConnectionManager()

@app.on_event("startup")
async def startup_event():
    # Start broadcasting in the background
    asyncio.create_task(manager.start_broadcasting())

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep the connection alive and handle incoming messages
            data = await websocket.receive_text()
            # You can handle incoming messages here if needed
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket)
