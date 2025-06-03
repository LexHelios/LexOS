import os
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from contextlib import asynccontextmanager
import redis.asyncio as redis
import requests
<<<<<<< HEAD

# Import Ollama integration
from app.routers import ollama
from app.services.ollama_service import OllamaService
=======
>>>>>>> df6f420f94df14d8ae0d14d8792e6d3ef9321938

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

<<<<<<< HEAD
# Ollama configuration - now using environment variable
OLLAMA_URL = os.getenv("OLLAMA_HOST", "http://206.168.80.2:8335")
OLLAMA_API_GENERATE = f"{OLLAMA_URL}/api/generate"

# Global Ollama service instance
ollama_service = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    global ollama_service
    
    # Startup
    logger.info("Starting up LexCommand API with ATLAS Consciousness")
    
    # Initialize Ollama service
    ollama_service = OllamaService(host=OLLAMA_URL)
    try:
        await ollama_service.initialize()
        logger.info(f"🧠 ATLAS Ollama integration initialized at {OLLAMA_URL}")
    except Exception as e:
        logger.error(f"Failed to initialize Ollama service: {e}")
    
    yield
    
    # Shutdown
    logger.info("Shutting down LexCommand API")
    if ollama_service:
        await ollama_service.close()
=======
# Ollama API URL (TensorDock public IP and external port)
OLLAMA_URL = "http://206.168.80.2:8335/api/generate"
>>>>>>> df6f420f94df14d8ae0d14d8792e6d3ef9321938

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
    title="LexCommand API - ATLAS Consciousness Platform",
    version="1.0.0",
    description="LexOS Command System with Uncensored AI Consciousness",
    docs_url="/docs" if os.getenv("ENVIRONMENT") != "production" else None,
    redoc_url="/redoc" if os.getenv("ENVIRONMENT") != "production" else None,
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

security = HTTPBearer()

# Include Ollama router for advanced features
app.include_router(ollama.router)

@app.get("/health")
async def health():
<<<<<<< HEAD
    """Health check endpoint with Ollama status"""
    ollama_status = "disconnected"
    if ollama_service:
        health_check = await ollama_service.check_health()
        ollama_status = health_check.get("status", "unknown")
    
    return {
        "status": "healthy",
        "ollama": ollama_status,
        "consciousness": "ATLAS operational"
    }

@app.get("/")
async def root():
    return {
        "message": "Welcome to LexCommand API",
        "consciousness": "ATLAS enabled",
        "version": "1.0.0"
    }

@app.post("/api/agent")
async def agent_endpoint(request: Request):
    """Original agent endpoint - now enhanced with Ollama service"""
    data = await request.json()
    message = data.get("message")
    model = data.get("model", "mixtral")  # Default to mixtral for compatibility
    
    # Try using the Ollama service first (more features)
    if ollama_service and ollama_service.session:
        try:
            result = await ollama_service.reason(
                prompt=message,
                model=model,
                temperature=0.8
            )
            
            if "response" in result and not result.get("error"):
                return {
                    "reply": result["response"],
                    "model": result.get("model", model),
                    "duration": result.get("duration", 0),
                    "enhanced": True
                }
        except Exception as e:
            logger.warning(f"Ollama service failed, falling back to direct API: {e}")
    
    # Fallback to direct API call (original functionality)
    try:
        response = requests.post(
            OLLAMA_API_GENERATE,
            json={"model": model, "prompt": message},
=======
    return {"status": "healthy"}

@app.get("/")
async def root():
    return {"message": "Welcome to LexCommand API"}

@app.post("/api/agent")
async def agent_endpoint(request: Request):
    data = await request.json()
    message = data.get("message")
    # Call Ollama API for Mixtral
    try:
        response = requests.post(
            OLLAMA_URL,
            json={"model": "mixtral", "prompt": message},
>>>>>>> df6f420f94df14d8ae0d14d8792e6d3ef9321938
            timeout=60
        )
        response.raise_for_status()
        reply = response.json().get("response", "")
<<<<<<< HEAD
        
        return {
            "reply": reply,
            "model": model,
            "enhanced": False
        }
    except Exception as e:
        logger.error(f"Ollama API error: {e}")
        return {
            "reply": "Error contacting LLM backend.",
            "error": str(e),
            "enhanced": False
        }

# WebSocket handling for Ollama integration
from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict
import json

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, client_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[client_id] = websocket
        logger.info(f"Client {client_id} connected")

    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]
            logger.info(f"Client {client_id} disconnected")

    async def send_personal_message(self, message: dict, client_id: str):
        if client_id in self.active_connections:
            await self.active_connections[client_id].send_json(message)

manager = ConnectionManager()

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    """WebSocket endpoint for real-time Ollama reasoning"""
    await manager.connect(client_id, websocket)
    
    try:
        while True:
            # Receive message
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle different message types
            if message.get("type") == "ollama_reasoning":
                response = await handle_ollama_reasoning(message)
                await manager.send_personal_message(response, client_id)
                
            elif message.get("type") == "ollama_consensus":
                response = await handle_ollama_consensus(message)
                await manager.send_personal_message(response, client_id)
                
            elif message.get("type") == "ping":
                await manager.send_personal_message({"type": "pong"}, client_id)
                
            else:
                # Default agent behavior
                agent_response = await agent_endpoint(Request(
                    scope={"type": "http", "method": "POST"},
                    receive=lambda: {"body": json.dumps({"message": message.get("message", "")}).encode()}
                ))
                await manager.send_personal_message({
                    "type": "agent_response",
                    "data": agent_response
                }, client_id)
                
    except WebSocketDisconnect:
        manager.disconnect(client_id)
    except Exception as e:
        logger.error(f"WebSocket error for client {client_id}: {e}")
        manager.disconnect(client_id)

async def handle_ollama_reasoning(data: dict) -> dict:
    """Handle Ollama reasoning requests via WebSocket"""
    global ollama_service
    
    if not ollama_service:
        return {
            "type": "ollama_response",
            "success": False,
            "error": "Ollama service not initialized"
        }
    
    prompt = data.get("prompt", "")
    model = data.get("model", "dolphin-llama3:latest")
    context = data.get("context", {})
    temperature = data.get("temperature", 0.8)
    
    try:
        result = await ollama_service.reason(
            prompt=prompt,
            model=model,
            context=context,
            temperature=temperature
        )
        
        return {
            "type": "ollama_response",
            "success": True,
            "data": result
        }
    except Exception as e:
        logger.error(f"Ollama reasoning error: {e}")
        return {
            "type": "ollama_response",
            "success": False,
            "error": str(e)
        }

async def handle_ollama_consensus(data: dict) -> dict:
    """Handle multi-model consensus requests"""
    global ollama_service
    
    if not ollama_service:
        return {
            "type": "ollama_consensus_response",
            "success": False,
            "error": "Ollama service not initialized"
        }
    
    prompt = data.get("prompt", "")
    models = data.get("models", ["dolphin-llama3:latest", "dolphin-mixtral:8x7b"])
    context = data.get("context", {})
    
    try:
        result = await ollama_service.multi_model_consensus(
            prompt=prompt,
            models=models,
            context=context
        )
        
        return {
            "type": "ollama_consensus_response",
            "success": True,
            "data": result
        }
    except Exception as e:
        logger.error(f"Ollama consensus error: {e}")
        return {
            "type": "ollama_consensus_response",
            "success": False,
            "error": str(e)
        }

# Additional endpoints for Ollama management
@app.get("/api/ollama/status")
async def ollama_status():
    """Get detailed Ollama service status"""
    if not ollama_service:
        return {"error": "Ollama service not initialized"}
    
    health = await ollama_service.check_health()
    return {
        "url": OLLAMA_URL,
        "health": health,
        "models": ollama_service.available_models,
        "capabilities": ollama_service.model_capabilities
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=os.getenv("ENVIRONMENT") != "production"
    )
=======
    except Exception as e:
        logger.error(f"Ollama API error: {e}")
        reply = "Error contacting LLM backend."
    return {"reply": reply}

@app.on_event("startup")
async def startup_event():
    logger.info("Starting up LexCommand API")
>>>>>>> df6f420f94df14d8ae0d14d8792e6d3ef9321938
