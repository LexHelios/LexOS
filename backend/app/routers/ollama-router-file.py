"""
Ollama router for direct reasoning endpoints
Save as: backend/app/routers/ollama.py
"""
from fastapi import APIRouter, HTTPException, Depends, WebSocket
from typing import Dict, List, Optional
from pydantic import BaseModel
import os
import json

from app.services.ollama_service import OllamaService

router = APIRouter(prefix="/api/ollama", tags=["ollama"])

# Initialize service
ollama_service = OllamaService(host=os.getenv("OLLAMA_HOST", "http://localhost:11434"))

class ReasoningRequest(BaseModel):
    prompt: str
    model: Optional[str] = "dolphin-llama3:latest"
    temperature: Optional[float] = 0.8
    context: Optional[Dict] = None

class ConsensusRequest(BaseModel):
    prompt: str
    models: Optional[List[str]] = None
    context: Optional[Dict] = None

class ModelPullRequest(BaseModel):
    model_name: str

@router.on_event("startup")
async def startup():
    """Initialize Ollama service on startup"""
    await ollama_service.initialize()

@router.on_event("shutdown")
async def shutdown():
    """Cleanup on shutdown"""
    await ollama_service.close()

@router.get("/health")
async def health_check():
    """Check Ollama service health"""
    return await ollama_service.check_health()

@router.get("/models")
async def list_models():
    """List available Ollama models with capabilities"""
    health = await ollama_service.check_health()
    return {
        "models": health.get("available_models", []),
        "capabilities": ollama_service.model_capabilities,
        "recommended": {
            "fast": "dolphin-phi:latest",
            "balanced": "dolphin-llama3:latest",
            "powerful": "dolphin-mixtral:8x7b",
            "coding": "deepseek-coder:33b"
        }
    }

@router.post("/reason")
async def reason(request: ReasoningRequest):
    """Single model reasoning endpoint"""
    result = await ollama_service.reason(
        prompt=request.prompt,
        model=request.model,
<<<<<<< HEAD
        temperature=request.te
=======
        temperature=request.temperature,
        context=request.context
    )
    
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    
    return result

@router.post("/consensus")
async def consensus(request: ConsensusRequest):
    """Multi-model consensus endpoint"""
    result = await ollama_service.multi_model_consensus(
        prompt=request.prompt,
        models=request.models,
        context=request.context
    )
    
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    
    return result

@router.post("/pull")
async def pull_model(request: ModelPullRequest):
    """Pull a new model from Ollama registry"""
    success = await ollama_service.pull_model(request.model_name)
    
    if not success:
        raise HTTPException(status_code=500, detail=f"Failed to pull model {request.model_name}")
    
    return {"message": f"Successfully pulled {request.model_name}", "success": True}

@router.websocket("/stream")
async def websocket_stream(websocket: WebSocket):
    """WebSocket endpoint for streaming responses"""
    await websocket.accept()
    
    try:
        while True:
            # Receive prompt from client
            data = await websocket.receive_text()
            request = json.loads(data)
            
            prompt = request.get("prompt", "")
            model = request.get("model", "dolphin-llama3:latest")
            
            # Stream response back
            full_response = ""
            async def stream_callback(chunk):
                nonlocal full_response
                if "response" in chunk:
                    full_response += chunk["response"]
                    await websocket.send_json({
                        "type": "stream",
                        "content": chunk["response"],
                        "done": chunk.get("done", False)
                    })
            
            await ollama_service.stream_reasoning(
                prompt=prompt,
                model=model,
                callback=stream_callback
            )
            
            # Send final message
            await websocket.send_json({
                "type": "complete",
                "full_response": full_response,
                "model": model
            })
            
    except Exception as e:
        await websocket.send_json({
            "type": "error",
            "message": str(e)
        })
    finally:
        await websocket.close()
>>>>>>> df6f420f94df14d8ae0d14d8792e6d3ef9321938
