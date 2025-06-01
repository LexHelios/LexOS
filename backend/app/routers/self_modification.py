from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..services.self_modification import SelfModificationEngine
from ..services.memory_service import get_db
from pydantic import BaseModel
from typing import Dict, List, Any, Optional

router = APIRouter(prefix="/self-modification")
self_mod_engine = SelfModificationEngine()

class PerformanceAnalysisResponse(BaseModel):
    reasoning_improvements: List[Dict[str, Any]]
    memory_optimizations: List[Dict[str, Any]]
    autonomy_enhancements: List[Dict[str, Any]]
    confidence: float

class ModificationRequest(BaseModel):
    opportunities: Dict[str, Any]

class ModificationResponse(BaseModel):
    modifications: List[Dict[str, Any]]

class TestModificationRequest(BaseModel):
    modification: Dict[str, Any]

class TestModificationResponse(BaseModel):
    status: str
    results: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class ApplyModificationRequest(BaseModel):
    modification: Dict[str, Any]

class ApplyModificationResponse(BaseModel):
    status: str
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

@router.get("/analyze-performance", response_model=PerformanceAnalysisResponse)
async def analyze_performance(db: Session = Depends(get_db)):
    """Analyze system performance and identify improvement opportunities."""
    try:
        opportunities = await self_mod_engine.analyze_performance(db)
        return PerformanceAnalysisResponse(**opportunities)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/propose-modifications", response_model=ModificationResponse)
async def propose_modifications(request: ModificationRequest, db: Session = Depends(get_db)):
    """Propose specific modifications based on improvement opportunities."""
    try:
        modifications = await self_mod_engine.propose_modifications(request.opportunities, db)
        return ModificationResponse(modifications=modifications)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/test-modification", response_model=TestModificationResponse)
async def test_modification(request: TestModificationRequest, db: Session = Depends(get_db)):
    """Test a proposed modification in a sandbox environment."""
    try:
        result = await self_mod_engine.test_modification(request.modification, db)
        return TestModificationResponse(
            status=result.get('status', 'unknown'),
            results=result.get('results'),
            error=result.get('error')
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/apply-modification", response_model=ApplyModificationResponse)
async def apply_modification(request: ApplyModificationRequest, db: Session = Depends(get_db)):
    """Apply a tested modification to the production environment."""
    try:
        result = await self_mod_engine.apply_modification(request.modification, db)
        return ApplyModificationResponse(
            status=result.get('status', 'unknown'),
            result=result.get('result'),
            error=result.get('error')
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 