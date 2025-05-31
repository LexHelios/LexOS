from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
import logging
from typing import Optional
import httpx
from datetime import datetime, timedelta

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="LexOS API Gateway")

# Security
security = HTTPBearer()
JWT_SECRET = "your-secret-key"  # Should be loaded from environment variables
JWT_ALGORITHM = "HS256"

# Service URLs
SERVICES = {
    "consciousness-memory": "http://localhost:8001",
    "autonomous-reasoning": "http://localhost:8002",
    "financial-intelligence": "http://localhost:8003",
    "self-modification": "http://localhost:8004",
    "environmental-interaction": "http://localhost:8005",
    "creative-expression": "http://localhost:8006"
}

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify JWT token."""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def forward_request(service: str, request: Request, token: Optional[str] = None):
    """Forward request to appropriate service."""
    if service not in SERVICES:
        raise HTTPException(status_code=404, detail=f"Service {service} not found")

    service_url = SERVICES[service]
    path = request.url.path.replace(f"/api/{service}", "")
    url = f"{service_url}{path}"

    headers = dict(request.headers)
    if token:
        headers["Authorization"] = f"Bearer {token}"

    async with httpx.AsyncClient() as client:
        try:
            response = await client.request(
                method=request.method,
                url=url,
                headers=headers,
                params=request.query_params,
                content=await request.body()
            )
            return response
        except httpx.RequestError as e:
            logger.error(f"Error forwarding request to {service}: {str(e)}")
            raise HTTPException(status_code=503, detail=f"Service {service} unavailable")

@app.post("/api/auth/login")
async def login(username: str, password: str):
    """Login endpoint."""
    # In a real application, verify credentials against database
    if username == "admin" and password == "password":
        token = jwt.encode(
            {
                "sub": username,
                "exp": datetime.utcnow() + timedelta(hours=24)
            },
            JWT_SECRET,
            algorithm=JWT_ALGORITHM
        )
        return {"access_token": token, "token_type": "bearer"}
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.api_route("/api/{service}/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def service_router(
    service: str,
    path: str,
    request: Request,
    token: dict = Depends(verify_token)
):
    """Route requests to appropriate service."""
    response = await forward_request(service, request, token.get("sub"))
    return response

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 