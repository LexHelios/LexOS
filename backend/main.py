import os
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from contextlib import asynccontextmanager
import redis.asyncio as redis
import requests

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def get_redis():
    redis_client = redis.Redis(
        host=os.getenv("REDIS_HOST", "redis"),
        port=int(os.getenv("REDIS_PORT", "6379")),
        password=os.getenv("REDIS_PASSWORD", None),
        decode_responses=True,
        ssl=os.getenv("REDIS_SSL", "false").lower() == "true"
    )
    try:
        yield redis_client
    finally:
        await redis_client.close()

app = FastAPI(
    title="LexCommand API",
    version="1.0.0",
    docs_url="/docs" if os.getenv("ENVIRONMENT") != "production" else None,
    redoc_url="/redoc" if os.getenv("ENVIRONMENT") != "production" else None
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

security = HTTPBearer()

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.get("/")
async def root():
    return {"message": "Welcome to LexCommand API"}

@app.post("/api/agent")
async def agent_endpoint(request: Request):
    data = await request.json()
    message = data.get("message")
    # Call Ollama API for Mixtral
    response = requests.post(
        "http://localhost:11434/api/generate",
        json={"model": "mixtral", "prompt": message}
    )
    reply = response.json().get("response", "")
    return {"reply": reply}

@app.on_event("startup")
async def startup_event():
    logger.info("Starting up LexCommand API")
