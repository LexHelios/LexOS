from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..services.environmental_interaction import EnvironmentalInteractionEngine
from ..services.memory_service import get_db
from pydantic import BaseModel
from typing import Dict, List, Any, Optional

router = APIRouter(prefix="/environmental")
env_engine = EnvironmentalInteractionEngine()

class ResearchRequest(BaseModel):
    topic: str
    depth: Optional[int] = 3

class ResearchResponse(BaseModel):
    title: str
    timestamp: str
    analysis: Dict[str, Any]
    recommendations: List[Dict[str, Any]]
    confidence: float

class APIInteractionRequest(BaseModel):
    api_name: str
    action: str
    params: Dict[str, Any]

class APIInteractionResponse(BaseModel):
    api: str
    action: str
    result: str
    timestamp: str

class DocumentGenerationRequest(BaseModel):
    document_type: str
    content: Dict[str, Any]

class DocumentGenerationResponse(BaseModel):
    type: str
    content: Dict[str, Any]
    timestamp: str
    format: str

@router.post("/research", response_model=ResearchResponse)
async def conduct_research(request: ResearchRequest, db: Session = Depends(get_db)):
    """Conduct autonomous research on a given topic."""
    try:
        report = await env_engine.research_topic(request.topic, request.depth, db)
        return ResearchResponse(**report)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api-interaction", response_model=APIInteractionResponse)
async def interact_with_api(request: APIInteractionRequest, db: Session = Depends(get_db)):
    """Interact with external APIs."""
    try:
        result = await env_engine.interact_with_api(
            request.api_name,
            request.action,
            request.params,
            db
        )
        return APIInteractionResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-document", response_model=DocumentGenerationResponse)
async def generate_document(request: DocumentGenerationRequest, db: Session = Depends(get_db)):
    """Generate a document based on provided content."""
    try:
        document = await env_engine.generate_document(request.document_type, request.content, db)
        return DocumentGenerationResponse(**document)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 