from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..services.api_integration import APIIntegrationService
from ..services.memory_service import get_db
from pydantic import BaseModel
from typing import Dict, List, Any, Optional

router = APIRouter(prefix="/api-integration")
api_service = APIIntegrationService()

class ScholarSearchRequest(BaseModel):
    query: str

class ScholarSearchResponse(BaseModel):
    papers: List[Dict[str, Any]]
    citations: List[Dict[str, Any]]
    confidence: float
    timestamp: str

class MarketDataRequest(BaseModel):
    symbol: str

class MarketDataResponse(BaseModel):
    price_data: Dict[str, Any]
    indicators: Dict[str, Any]
    confidence: float
    timestamp: str

class NewsRequest(BaseModel):
    topic: str

class NewsResponse(BaseModel):
    articles: List[Dict[str, Any]]
    sentiment: Dict[str, Any]
    confidence: float
    timestamp: str

class TechnicalAnalysisRequest(BaseModel):
    symbol: str

class TechnicalAnalysisResponse(BaseModel):
    patterns: List[Dict[str, Any]]
    indicators: Dict[str, Any]
    signals: List[Dict[str, Any]]
    confidence: float
    timestamp: str

@router.post("/scholar/search", response_model=ScholarSearchResponse)
async def search_scholar(request: ScholarSearchRequest, db: Session = Depends(get_db)):
    """Search academic papers and research."""
    try:
        results = await api_service.search_scholar(request.query, db)
        return ScholarSearchResponse(**results)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/market/data", response_model=MarketDataResponse)
async def get_market_data(request: MarketDataRequest, db: Session = Depends(get_db)):
    """Get financial market data."""
    try:
        results = await api_service.get_market_data(request.symbol, db)
        return MarketDataResponse(**results)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/news/search", response_model=NewsResponse)
async def get_news(request: NewsRequest, db: Session = Depends(get_db)):
    """Get news articles related to a topic."""
    try:
        results = await api_service.get_news(request.topic, db)
        return NewsResponse(**results)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/technical/analysis", response_model=TechnicalAnalysisResponse)
async def get_technical_analysis(request: TechnicalAnalysisRequest, db: Session = Depends(get_db)):
    """Get technical analysis data."""
    try:
        results = await api_service.get_technical_analysis(request.symbol, db)
        return TechnicalAnalysisResponse(**results)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 