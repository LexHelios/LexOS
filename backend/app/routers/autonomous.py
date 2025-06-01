from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..services.autonomous_decision_engine import AutonomousDecisionEngine
from ..services.memory_service import get_db
from pydantic import BaseModel
from typing import Dict, List, Any, Optional

router = APIRouter(prefix="/autonomous")
autonomous_engine = AutonomousDecisionEngine()

class MarketOpportunityRequest(BaseModel):
    symbol: str

class DecisionResponse(BaseModel):
    action: str
    confidence: float
    reasoning: str
    risk_level: float
    position_size: Optional[float] = None
    timestamp: str

class PaperTradeRequest(BaseModel):
    decisions: List[Dict[str, Any]]

class PaperTradeResponse(BaseModel):
    results: List[Dict[str, Any]]

@router.post("/evaluate-opportunity", response_model=DecisionResponse)
async def evaluate_opportunity(request: MarketOpportunityRequest, db: Session = Depends(get_db)):
    """Evaluate market opportunity and make autonomous decision."""
    try:
        decision = await autonomous_engine.evaluate_market_opportunities(request.symbol, db)
        return DecisionResponse(**decision)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/execute-paper-trades", response_model=PaperTradeResponse)
async def execute_paper_trades(request: PaperTradeRequest, db: Session = Depends(get_db)):
    """Execute paper trades based on autonomous decisions."""
    try:
        results = await autonomous_engine.execute_paper_trades(request.decisions, db)
        return PaperTradeResponse(results=results)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/learn-from-outcomes")
async def learn_from_outcomes(trade_results: List[Dict[str, Any]], db: Session = Depends(get_db)):
    """Learn from trade outcomes to improve decision making."""
    try:
        await autonomous_engine.learn_from_outcomes(trade_results, db)
        return {"status": "success", "message": "Learning process completed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 