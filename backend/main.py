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

# Ollama API URL (TensorDock public IP and external port)
# IMPORTANT: Using port 8336 (not 8335) as shown in TensorDock dashboard
OLLAMA_URL = "http://206.168.80.2:8336/api/generate"

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
    
    # Call Ollama API with dolphin-llama3 model
    try:
        response = requests.post(
            OLLAMA_URL,
            json={"model": "dolphin-llama3:latest", "prompt": message},  # Changed to dolphin model
            timeout=60
        )
        response.raise_for_status()
        reply = response.json().get("response", "")
    except Exception as e:
        logger.error(f"Ollama API error: {e}")
        reply = "Error contacting LLM backend."
    
    return {"reply": reply}

@app.on_event("startup")
async def startup_event():
    logger.info("Starting up LexCommand API")
    logger.info(f"Ollama endpoint: {OLLAMA_URL}")
    
    # Quick test to verify Ollama connection
    try:
        test_response = requests.get("http://206.168.80.2:8336/api/tags", timeout=5)
        if test_response.status_code == 200:
            logger.info("✅ Ollama connection verified")
        else:
            logger.warning("⚠️ Ollama responded but with unexpected status")
    except Exception as e:
        logger.error(f"❌ Cannot connect to Ollama: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=os.getenv("ENVIRONMENT") != "production"
    )
