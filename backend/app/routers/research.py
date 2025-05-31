from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..services.research_orchestrator import ResearchOrchestrator
from ..services.memory_service import get_db
from pydantic import BaseModel
from typing import Dict, List, Any, Optional

router = APIRouter(prefix="/research")
research_orchestrator = ResearchOrchestrator()

class ResearchRequest(BaseModel):
    topic: str
    depth: str = "medium"

class ResearchResponse(BaseModel):
    topic: str
    timestamp: str
    sources: Dict[str, Any]
    analysis: Dict[str, Any]
    confidence: float

@router.post("/conduct", response_model=ResearchResponse)
async def conduct_research(request: ResearchRequest, db: Session = Depends(get_db)):
    """Conduct comprehensive research on a topic."""
    try:
        results = await research_orchestrator.conduct_research(request.topic, request.depth, db)
        return ResearchResponse(**results)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 