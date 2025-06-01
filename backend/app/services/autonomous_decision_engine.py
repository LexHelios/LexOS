from sqlalchemy.orm import Session
from ..services.intelligence_service import IntelligenceEngine
from ..services.memory_service import Memory, get_db
from datetime import datetime
import logging
from typing import Dict, List, Any, Optional
import json
import asyncio

logger = logging.getLogger(__name__)

class AutonomousDecisionEngine:
    def __init__(self):
        self.intelligence_engine = IntelligenceEngine()
        self.confidence_threshold = 0.8
        self.risk_threshold = 0.7
        self.max_position_size = 0.1  # 10% of portfolio
        self.paper_trading_enabled = True
        self.learning_rate = 0.01
        
    async def evaluate_market_opportunities(self, symbol: str, db: Session) -> Dict[str, Any]:
        """Evaluate market opportunities and make autonomous decisions."""
        try:
            # Get market analysis
            market_data = self.intelligence_engine.analyze_market_trends(symbol)
            reasoning = self.intelligence_engine.reason_about_market(market_data)
            
            # Retrieve historical analyses for context
            historical_analyses = self.intelligence_engine.retrieve_relevant_analyses(symbol, db)
            
            # Make decision based on analysis
            decision = await self._make_decision(market_data, reasoning, historical_analyses)
            
            # Store decision in memory
            self._store_decision(decision, db)
            
            return decision
        except Exception as e:
            logger.error(f"Error evaluating market opportunities: {str(e)}")
            raise

    async def _make_decision(self, market_data: Dict[str, Any], reasoning: Dict[str, Any], 
                           historical_analyses: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Make autonomous trading decision based on analysis and historical context."""
        confidence = reasoning['confidence']
        
        if confidence < self.confidence_threshold:
            return {
                'action': 'hold',
                'confidence': confidence,
                'reasoning': 'Insufficient confidence for action',
                'risk_level': 'low',
                'timestamp': datetime.utcnow().isoformat()
            }
            
        # Analyze market conditions
        sentiment = market_data['sentiment']
        rsi = market_data['rsi']
        volume_trend = market_data['volume_trend']
        
        # Calculate risk level
        risk_level = self._calculate_risk_level(market_data, historical_analyses)
        
        if risk_level > self.risk_threshold:
            return {
                'action': 'hold',
                'confidence': confidence,
                'reasoning': 'Risk level too high for action',
                'risk_level': risk_level,
                'timestamp': datetime.utcnow().isoformat()
            }
            
        # Generate trading signal
        if sentiment == 'bullish' and rsi < 30 and volume_trend == 'increasing':
            return {
                'action': 'buy_signal',
                'confidence': confidence,
                'reasoning': 'Oversold condition with bullish sentiment and increasing volume',
                'risk_level': risk_level,
                'position_size': self._calculate_position_size(risk_level),
                'timestamp': datetime.utcnow().isoformat()
            }
        elif sentiment == 'bearish' and rsi > 70 and volume_trend == 'increasing':
            return {
                'action': 'sell_signal',
                'confidence': confidence,
                'reasoning': 'Overbought condition with bearish sentiment and increasing volume',
                'risk_level': risk_level,
                'position_size': self._calculate_position_size(risk_level),
                'timestamp': datetime.utcnow().isoformat()
            }
        else:
            return {
                'action': 'hold',
                'confidence': confidence,
                'reasoning': 'Market conditions unclear',
                'risk_level': risk_level,
                'timestamp': datetime.utcnow().isoformat()
            }

    def _calculate_risk_level(self, market_data: Dict[str, Any], 
                            historical_analyses: List[Dict[str, Any]]) -> float:
        """Calculate risk level based on market data and historical context."""
        risk_factors = []
        
        # Volatility risk
        price_change = abs(market_data['price_change'])
        if price_change > 0.1:  # 10% price change
            risk_factors.append(0.8)
        else:
            risk_factors.append(0.4)
            
        # Volume risk
        if market_data['volume_trend'] == 'increasing':
            risk_factors.append(0.6)
        else:
            risk_factors.append(0.3)
            
        # RSI risk
        rsi = market_data['rsi']
        if rsi > 70 or rsi < 30:
            risk_factors.append(0.7)
        else:
            risk_factors.append(0.4)
            
        # Historical consistency risk
        if historical_analyses:
            consistent_trend = all(
                analysis['metadata']['details']['price_action']['trend'] == 
                market_data['sentiment']
                for analysis in historical_analyses[:3]
            )
            risk_factors.append(0.3 if consistent_trend else 0.7)
            
        return sum(risk_factors) / len(risk_factors)

    def _calculate_position_size(self, risk_level: float) -> float:
        """Calculate position size based on risk level."""
        return self.max_position_size * (1 - risk_level)

    def _store_decision(self, decision: Dict[str, Any], db: Session) -> None:
        """Store decision in memory system."""
        memory = Memory(
            content=f"Autonomous Decision: {decision['action']} - {decision['reasoning']}",
            metadata={
                'type': 'autonomous_decision',
                'confidence': decision['confidence'],
                'risk_level': decision['risk_level'],
                'timestamp': decision['timestamp'],
                'details': decision
            }
        )
        db.add(memory)
        db.commit()

    async def execute_paper_trades(self, decisions: List[Dict[str, Any]], db: Session) -> List[Dict[str, Any]]:
        """Execute paper trades based on autonomous decisions."""
        if not self.paper_trading_enabled:
            return []
            
        results = []
        for decision in decisions:
            if decision['action'] in ['buy_signal', 'sell_signal']:
                # Simulate trade execution
                trade_result = await self._simulate_trade(decision)
                results.append(trade_result)
                
                # Store trade result
                self._store_trade_result(trade_result, db)
                
        return results

    async def _simulate_trade(self, decision: Dict[str, Any]) -> Dict[str, Any]:
        """Simulate a trade execution."""
        # Simulate execution price with small slippage
        execution_price = decision.get('price', 0) * (1 + (0.001 if decision['action'] == 'buy_signal' else -0.001))
        
        return {
            'decision_id': decision.get('id'),
            'action': decision['action'],
            'execution_price': execution_price,
            'position_size': decision.get('position_size', 0),
            'timestamp': datetime.utcnow().isoformat(),
            'status': 'executed'
        }

    def _store_trade_result(self, trade_result: Dict[str, Any], db: Session) -> None:
        """Store trade result in memory system."""
        memory = Memory(
            content=f"Paper Trade Execution: {trade_result['action']} at {trade_result['execution_price']}",
            metadata={
                'type': 'paper_trade',
                'timestamp': trade_result['timestamp'],
                'details': trade_result
            }
        )
        db.add(memory)
        db.commit()

    async def learn_from_outcomes(self, trade_results: List[Dict[str, Any]], db: Session) -> None:
        """Learn from trade outcomes to improve decision making."""
        for result in trade_results:
            # Calculate outcome metrics
            outcome_metrics = self._calculate_outcome_metrics(result)
            
            # Adjust confidence threshold based on outcomes
            if outcome_metrics['success']:
                self.confidence_threshold = max(0.7, self.confidence_threshold - self.learning_rate)
            else:
                self.confidence_threshold = min(0.9, self.confidence_threshold + self.learning_rate)
                
            # Store learning outcome
            self._store_learning_outcome(outcome_metrics, db)

    def _calculate_outcome_metrics(self, trade_result: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate success metrics for a trade outcome."""
        # This is a simplified version - in reality, you'd want to compare
        # the execution price with subsequent price movements
        return {
            'success': True,  # Simplified for example
            'profit_loss': 0.0,  # Simplified for example
            'timestamp': datetime.utcnow().isoformat()
        }

    def _store_learning_outcome(self, outcome_metrics: Dict[str, Any], db: Session) -> None:
        """Store learning outcome in memory system."""
        memory = Memory(
            content=f"Learning Outcome: Success={outcome_metrics['success']}, P/L={outcome_metrics['profit_loss']}",
            metadata={
                'type': 'learning_outcome',
                'timestamp': outcome_metrics['timestamp'],
                'details': outcome_metrics
            }
        )
        db.add(memory)
        db.commit() 