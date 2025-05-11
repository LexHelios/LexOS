import os
from fastapi import FastAPI, Depends, HTTPException, Request, status, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, BaseSettings, SecretStr, validator
import jwt
import redis.asyncio as redis
import time
import uuid
import datetime
from typing import Optional, Dict, Any, List, Set
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
import json
import asyncio
from passlib.hash import pbkdf2_sha256
import secrets
import pathlib
from .websocket_handlers import ConnectionManager

# ... existing code ...

class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: SecretStr
    JWT_PRIVATE_KEY_PATH: str = "/etc/lexcommand/keys/jwt-private.pem"
    JWT_PUBLIC_KEY_PATH: str = "/etc/lexcommand/keys/jwt-public.pem"
    TOKEN_LIFETIME: int = 3600
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: SecretStr = None
    REDIS_SSL: bool = False
    ALLOWED_ORIGINS: str = "http://localhost:3000"
    OTLP_ENDPOINT: str = "localhost:4317"
    
    @validator("JWT_PRIVATE_KEY_PATH", "JWT_PUBLIC_KEY_PATH")
    def validate_key_paths(cls, v):
        path = pathlib.Path(v)
        if not path.exists():
            raise ValueError(f"Key file not found: {v}")
        return str(path)
    
    class Config:
        env_file = ".env"

settings = Settings()

# Update Redis connection to use settings
@asynccontextmanager
async def get_redis():
    redis_client = redis.Redis(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        password=settings.REDIS_PASSWORD.get_secret_value() if settings.REDIS_PASSWORD else None,
        decode_responses=True,
        ssl=settings.REDIS_SSL
    )
    try:
        yield redis_client
    finally:
        await redis_client.close()

# Update app initialization
app = FastAPI(
    title="LexCommand API",
    version="12.0.0",
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None,
    openapi_url="/openapi.json" if settings.ENVIRONMENT != "production" else None
)

# Update CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-CSRF-Token"],
    expose_headers=["X-Total-Count"],
    max_age=3600
)

# Create manager instance
manager = ConnectionManager()

@app.on_event("startup")
async def startup_event():
    await manager.start_broadcasting()

@app.on_event("shutdown")
async def shutdown_event():
    if manager._broadcast_task:
        manager._broadcast_task.cancel()
    if manager._cleanup_task:
        manager._cleanup_task.cancel()
    # Close all active connections
    for connection in manager.active_connections.copy():
        try:
            await connection.close()
        except Exception as e:
            logger.error(f"Error closing connection during shutdown: {e}")
    manager.active_connections.clear()
    manager.connection_info.clear()

@app.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = None
):
    if not token:
        await websocket.close(code=4001, reason="Missing authentication token")
        return
    
    try:
        with open("/etc/lexcommand/keys/jwt-public.pem", "rb") as f:
            public_key = f.read()
        payload = jwt.decode(token, public_key, algorithms=["RS256"])
        
        async with get_redis() as redis_client:
            if not await redis_client.exists(f"token:{payload['jti']}"):
                await websocket.close(code=4002, reason="Invalid or expired token")
                return
        
        await manager.connect(websocket)
        try:
            while True:
                message = await websocket.receive_text()
                await manager.handle_message(websocket, message)
        except WebSocketDisconnect:
            manager.disconnect(websocket)
        except Exception as e:
            logger.error(f"WebSocket error: {str(e)}")
            manager.disconnect(websocket)
            
    except jwt.InvalidTokenError:
        await websocket.close(code=4003, reason="Invalid token")
    except Exception as e:
        logger.error(f"WebSocket authentication error: {str(e)}")
        await websocket.close(code=4000, reason="Authentication failed")

# Helper functions for system metrics
def get_cpu_usage() -> float:
    try:
        import psutil
        return psutil.cpu_percent()
    except ImportError:
        return 0.0

def get_memory_usage() -> float:
    try:
        import psutil
        return psutil.virtual_memory().percent
    except ImportError:
        return 0.0

# Models
class Token(BaseModel):
    access_token: str
    token_type: str
    expires_at: int

class LoginRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8)

class User(BaseModel):
    username: str
    hashed_password: str
    role: str

# Initialize metrics
request_counter = Counter(
    'api_requests_total',
    'Total API requests',
    ['endpoint', 'method', 'status']
)

error_counter = Counter(
    'api_errors_total',
    'Total API errors',
    ['endpoint', 'error_type']
)

active_sessions = Gauge(
    'active_sessions',
    'Number of active JWT sessions'
)

# Initialize tracing
trace.set_tracer_provider(TracerProvider())
tracer = trace.get_tracer(__name__)

# Configure OpenTelemetry exporter
otlp_exporter = OTLPSpanExporter(endpoint=settings.OTLP_ENDPOINT)
span_processor = BatchSpanProcessor(otlp_exporter)
trace.get_tracer_provider().add_span_processor(span_processor)

# Configure logging
logging.basicConfig(
    level=logging.INFO if settings.ENVIRONMENT != "production" else logging.WARNING,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Rate limiting
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["100/minute"]
)

# Initialize FastAPI
app = FastAPI(
    title="LexCommand API",
    version="12.0.0",
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None,
    openapi_url="/openapi.json" if settings.ENVIRONMENT != "production" else None
)

# Add rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Add CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-CSRF-Token"],
    expose_headers=["X-Total-Count"],
    max_age=3600
)

# Initialize OpenTelemetry instrumentation
FastAPIInstrumentor.instrument_app(app)

async def get_user(username: str, redis_client: redis.Redis) -> Optional[User]:
    user_data = await redis_client.get(f"user:{username}")
    if user_data:
        user_dict = json.loads(user_data)
        return User(**user_dict)
    return None

async def create_user(username: str, password: str, role: str, redis_client: redis.Redis):
    hashed_password = pbkdf2_sha256.hash(password)
    user = User(username=username, hashed_password=hashed_password, role=role)
    await redis_client.set(f"user:{username}", json.dumps(user.dict()))
    return user

@app.post("/login", response_model=Token)
@limiter.limit("5/minute")
async def login(request: Request, req: LoginRequest, redis_client: redis.Redis = Depends(get_redis)):
    with tracer.start_as_current_span("login") as span:
        span.set_attribute("username", req.username)
        
        user = await get_user(req.username, redis_client)
        if not user:
            # During first run, create admin user if it doesn't exist
            if req.username == os.getenv("ADMIN_USERNAME", "admin"):
                admin_password = os.getenv("ADMIN_PASSWORD")
                if not admin_password:
                    error_counter.labels(endpoint="/login", error_type="missing_admin_password").inc()
                    raise HTTPException(
                        status_code=500,
                        detail="Admin password not configured"
                    )
                user = await create_user(req.username, admin_password, "admin", redis_client)
            else:
                request_counter.labels(endpoint="/login", method="POST", status=401).inc()
                error_counter.labels(endpoint="/login", error_type="invalid_credentials").inc()
                raise HTTPException(
                    status_code=401,
                    detail="Invalid credentials"
                )
        
        if not pbkdf2_sha256.verify(req.password, user.hashed_password):
            request_counter.labels(endpoint="/login", method="POST", status=401).inc()
            error_counter.labels(endpoint="/login", error_type="invalid_credentials").inc()
            raise HTTPException(
                status_code=401,
                detail="Invalid credentials"
            )
        
        token = await create_token(user.username, user.role, redis_client)
        request_counter.labels(endpoint="/login", method="POST", status=200).inc()
        return token

# ... rest of the existing code ... 