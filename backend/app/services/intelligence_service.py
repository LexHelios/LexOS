from sqlalchemy.orm import Session
from ..services.memory_service import Memory, get_db
import numpy as np
from datetime import datetime, timedelta
import yfinance as yf
import pandas as pd
from typing import Dict, List, Any, Optional
import logging

logger = logging.getLogger(__name__)

class IntelligenceEngine:
    def __init__(self):
        self.reasoning_threshold = 0.85
        self.confidence_threshold = 0.75
        
    def analyze_market_trends(self, symbol: str, timeframe: str = "1mo") -> Dict[str, Any]:
        """Analyze market trends and patterns for a given symbol."""
        try:
            stock = yf.Ticker(symbol)
            hist = stock.history(period=timeframe)
            
            # Calculate key metrics
            sma_20 = hist['Close'].rolling(window=20).mean()
            sma_50 = hist['Close'].rolling(window=50).mean()
            rsi = self._calculate_rsi(hist['Close'])
            
            # Analyze volume trends
            volume_sma = hist['Volume'].rolling(window=20).mean()
            volume_trend = "increasing" if hist['Volume'].iloc[-1] > volume_sma.iloc[-1] else "decreasing"
            
            # Determine market sentiment
            sentiment = self._analyze_sentiment(hist)
            
            return {
                "symbol": symbol,
                "current_price": hist['Close'].iloc[-1],
                "price_change": hist['Close'].iloc[-1] - hist['Close'].iloc[0],
                "volume_trend": volume_trend,
                "rsi": rsi.iloc[-1],
                "sma_20": sma_20.iloc[-1],
                "sma_50": sma_50.iloc[-1],
                "sentiment": sentiment,
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"Error analyzing market trends: {str(e)}")
            raise

    def _calculate_rsi(self, prices: pd.Series, period: int = 14) -> pd.Series:
        """Calculate Relative Strength Index."""
        delta = prices.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain / loss
        return 100 - (100 / (1 + rs))

    def _analyze_sentiment(self, hist: pd.DataFrame) -> str:
        """Analyze market sentiment based on price action and volume."""
        price_change = (hist['Close'].iloc[-1] - hist['Close'].iloc[0]) / hist['Close'].iloc[0]
        volume_change = (hist['Volume'].iloc[-1] - hist['Volume'].iloc[0]) / hist['Volume'].iloc[0]
        
        if price_change > 0.05 and volume_change > 0.1:
            return "bullish"
        elif price_change < -0.05 and volume_change > 0.1:
            return "bearish"
        else:
            return "neutral"

    def reason_about_market(self, market_data: Dict[str, Any]) -> Dict[str, Any]:
        """Apply advanced reasoning to market data."""
        try:
            # Analyze price action
            price_action = self._analyze_price_action(market_data)
            
            # Evaluate market conditions
            market_conditions = self._evaluate_market_conditions(market_data)
            
            # Generate insights
            insights = self._generate_insights(price_action, market_conditions)
            
            return {
                "analysis": {
                    "price_action": price_action,
                    "market_conditions": market_conditions,
                    "insights": insights
                },
                "confidence": self._calculate_confidence(price_action, market_conditions),
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"Error in market reasoning: {str(e)}")
            raise

    def _analyze_price_action(self, market_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze price action patterns."""
        return {
            "trend": "bullish" if market_data["price_change"] > 0 else "bearish",
            "strength": abs(market_data["price_change"]),
            "momentum": "strong" if abs(market_data["price_change"]) > 0.1 else "weak"
        }

    def _evaluate_market_conditions(self, market_data: Dict[str, Any]) -> Dict[str, Any]:
        """Evaluate overall market conditions."""
        return {
            "volume_health": "healthy" if market_data["volume_trend"] == "increasing" else "concerning",
            "rsi_condition": "overbought" if market_data["rsi"] > 70 else "oversold" if market_data["rsi"] < 30 else "neutral",
            "trend_alignment": "aligned" if (market_data["sma_20"] > market_data["sma_50"]) == (market_data["price_change"] > 0) else "diverging"
        }

    def _generate_insights(self, price_action: Dict[str, Any], market_conditions: Dict[str, Any]) -> List[str]:
        """Generate market insights based on analysis."""
        insights = []
        
        if price_action["trend"] == "bullish" and market_conditions["volume_health"] == "healthy":
            insights.append("Strong bullish momentum with healthy volume support")
        elif price_action["trend"] == "bearish" and market_conditions["volume_health"] == "healthy":
            insights.append("Strong bearish momentum with increasing selling pressure")
            
        if market_conditions["rsi_condition"] == "overbought":
            insights.append("Market showing signs of overbought conditions")
        elif market_conditions["rsi_condition"] == "oversold":
            insights.append("Market showing signs of oversold conditions")
            
        if market_conditions["trend_alignment"] == "diverging":
            insights.append("Price action diverging from moving averages, potential trend change")
            
        return insights

    def _calculate_confidence(self, price_action: Dict[str, Any], market_conditions: Dict[str, Any]) -> float:
        """Calculate confidence level in the analysis."""
        confidence_factors = []
        
        # Price action confidence
        if price_action["strength"] > 0.1:
            confidence_factors.append(0.9)
        else:
            confidence_factors.append(0.7)
            
        # Volume health confidence
        if market_conditions["volume_health"] == "healthy":
            confidence_factors.append(0.8)
        else:
            confidence_factors.append(0.6)
            
        # Trend alignment confidence
        if market_conditions["trend_alignment"] == "aligned":
            confidence_factors.append(0.85)
        else:
            confidence_factors.append(0.65)
            
        return sum(confidence_factors) / len(confidence_factors)

    def store_analysis(self, analysis: Dict[str, Any], db: Session) -> None:
        """Store market analysis in the memory system."""
        memory = Memory(
            content=f"Market Analysis: {analysis['analysis']['insights']}",
            metadata={
                "type": "market_analysis",
                "confidence": analysis["confidence"],
                "timestamp": analysis["timestamp"],
                "details": analysis["analysis"]
            }
        )
        db.add(memory)
        db.commit()

    def retrieve_relevant_analyses(self, symbol: str, db: Session, limit: int = 5) -> List[Dict[str, Any]]:
        """Retrieve relevant market analyses from memory."""
        memories = db.query(Memory).filter(
            Memory.metadata['type'].astext == 'market_analysis'
        ).order_by(Memory.timestamp.desc()).limit(limit).all()
        
        return [
            {
                "content": memory.content,
                "metadata": memory.metadata,
                "timestamp": memory.timestamp.isoformat()
            }
            for memory in memories
        ] 