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

# Ollama API URL - Uses environment variable, fallback to localhost for development
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:8336/api/generate")

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
    """Health check endpoint"""
    return {
        "status": "healthy",
        "ollama_url": OLLAMA_URL,
        "environment": os.getenv("ENVIRONMENT", "development")
    }

@app.get("/")
async def root():
    return {"message": "Welcome to LexCommand API"}

@app.post("/api/agent")
async def agent_endpoint(request: Request):
    """Main agent endpoint that communicates with Ollama"""
    data = await request.json()
    message = data.get("message")
    
    if not message:
        return {"error": "No message provided"}
    
    # Call Ollama API with dolphin-llama3 model
    try:
        logger.info(f"Sending request to Ollama at: {OLLAMA_URL}")
        
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": "dolphin-llama3:latest",
                "prompt": message,
                "stream": False
            },
            timeout=60
        )
        
        response.raise_for_status()
        result = response.json()
        reply = result.get("response", "")
        
        logger.info("Ollama responded successfully")
        return {"reply": reply}
        
    except requests.exceptions.ConnectionError as e:
        logger.error(f"Connection error: {e}")
        return {"error": "Cannot connect to Ollama. Please check if the service is running."}
        
    except requests.exceptions.Timeout as e:
        logger.error(f"Timeout error: {e}")
        return {"error": "Ollama request timed out. The model might be loading."}
        
    except requests.exceptions.HTTPError as e:
        logger.error(f"HTTP error: {e}")
        return {"error": f"Ollama returned an error: {e}"}
        
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return {"error": f"An unexpected error occurred: {str(e)}"}

@app.on_event("startup")
async def startup_event():
    """Run on application startup"""
    logger.info("Starting up LexCommand API")
    logger.info(f"Ollama endpoint configured as: {OLLAMA_URL}")
    logger.info(f"Environment: {os.getenv('ENVIRONMENT', 'development')}")
    
    # Quick test to verify Ollama connection (non-blocking)
    try:
        test_response = requests.get(OLLAMA_URL.replace("/api/generate", "/api/tags"), timeout=2)
        if test_response.status_code == 200:
            logger.info("✅ Ollama connection verified")
            models = test_response.json().get("models", [])
            logger.info(f"Available models: {[m['name'] for m in models]}")
        else:
            logger.warning("⚠️ Ollama responded but with unexpected status")
    except Exception as e:
        logger.warning(f"⚠️ Cannot connect to Ollama on startup (non-critical): {e}")

@app.on_event("shutdown")
async def shutdown_event():
    """Run on application shutdown"""
    logger.info("Shutting down LexCommand API")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("ENVIRONMENT") != "production"
    )
