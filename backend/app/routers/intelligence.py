from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..services.intelligence_service import IntelligenceEngine
from ..services.memory_service import get_db
from pydantic import BaseModel
from typing import Dict, List, Any, Optional

router = APIRouter(prefix="/intelligence")
intelligence_engine = IntelligenceEngine()

class MarketAnalysisRequest(BaseModel):
    symbol: str
    timeframe: Optional[str] = "1mo"

class MarketAnalysisResponse(BaseModel):
    symbol: str
    current_price: float
    price_change: float
    volume_trend: str
    rsi: float
    sma_20: float
    sma_50: float
    sentiment: str
    timestamp: str

class MarketReasoningResponse(BaseModel):
    analysis: Dict[str, Any]
    confidence: float
    timestamp: str

@router.post("/analyze-market", response_model=MarketAnalysisResponse)
def analyze_market(request: MarketAnalysisRequest, db: Session = Depends(get_db)):
    """Analyze market trends for a given symbol."""
    try:
        market_data = intelligence_engine.analyze_market_trends(request.symbol, request.timeframe)
        return MarketAnalysisResponse(**market_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reason-about-market", response_model=MarketReasoningResponse)
def reason_about_market(request: MarketAnalysisRequest, db: Session = Depends(get_db)):
    """Apply advanced reasoning to market data."""
    try:
        # First get market data
        market_data = intelligence_engine.analyze_market_trends(request.symbol, request.timeframe)
        
        # Then apply reasoning
        reasoning = intelligence_engine.reason_about_market(market_data)
        
        # Store the analysis in memory
        intelligence_engine.store_analysis(reasoning, db)
        
        return MarketReasoningResponse(**reasoning)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/retrieve-analyses/{symbol}", response_model=List[Dict[str, Any]])
def retrieve_analyses(symbol: str, limit: int = 5, db: Session = Depends(get_db)):
    """Retrieve relevant market analyses from memory."""
    try:
        return intelligence_engine.retrieve_relevant_analyses(symbol, db, limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 