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
        temperature=request.te