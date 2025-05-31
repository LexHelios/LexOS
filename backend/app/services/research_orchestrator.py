from typing import Dict, List, Any, Optional
from datetime import datetime
import logging
import asyncio
from sqlalchemy.orm import Session
from ..services.api_integration import APIIntegrationService
from ..services.intelligence_service import IntelligenceEngine
from ..services.memory_service import Memory, get_db

logger = logging.getLogger(__name__)

class ResearchOrchestrator:
    def __init__(self):
        self.api_service = APIIntegrationService()
        self.intelligence_engine = IntelligenceEngine()
        self.confidence_threshold = 0.85
        self.max_concurrent_research = 3
        
    async def conduct_research(self, topic: str, depth: str = "medium", db: Session = None) -> Dict[str, Any]:
        """Conduct comprehensive research on a topic using multiple sources."""
        try:
            # Initialize research results
            research_results = {
                'topic': topic,
                'timestamp': datetime.utcnow().isoformat(),
                'sources': {},
                'analysis': {},
                'confidence': 0.0
            }
            
            # Gather data from multiple sources concurrently
            tasks = [
                self._gather_academic_research(topic, db),
                self._gather_market_data(topic, db),
                self._gather_news_analysis(topic, db)
            ]
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Process results from each source
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    logger.error(f"Error in research source {i}: {str(result)}")
                    continue
                    
                source_name = list(result.keys())[0]
                research_results['sources'][source_name] = result[source_name]
            
            # Analyze gathered information
            analysis = await self._analyze_research(research_results['sources'])
            research_results['analysis'] = analysis
            
            # Calculate overall confidence
            research_results['confidence'] = self._calculate_confidence(research_results)
            
            # Store research results in memory
            if db:
                self._store_research_results(research_results, db)
            
            return research_results
            
        except Exception as e:
            logger.error(f"Error conducting research: {str(e)}")
            raise
            
    async def _gather_academic_research(self, topic: str, db: Session) -> Dict[str, Any]:
        """Gather academic research on the topic."""
        try:
            results = await self.api_service.search_scholar(topic, db)
            return {'academic': results}
        except Exception as e:
            logger.error(f"Error gathering academic research: {str(e)}")
            return {'academic': {}}
            
    async def _gather_market_data(self, topic: str, db: Session) -> Dict[str, Any]:
        """Gather market data related to the topic."""
        try:
            # Extract potential market symbols from topic
            symbols = await self._extract_market_symbols(topic)
            market_data = {}
            
            for symbol in symbols:
                data = await self.api_service.get_market_data(symbol, db)
                market_data[symbol] = data
                
            return {'market': market_data}
        except Exception as e:
            logger.error(f"Error gathering market data: {str(e)}")
            return {'market': {}}
            
    async def _gather_news_analysis(self, topic: str, db: Session) -> Dict[str, Any]:
        """Gather and analyze news related to the topic."""
        try:
            news = await self.api_service.get_news(topic, db)
            return {'news': news}
        except Exception as e:
            logger.error(f"Error gathering news: {str(e)}")
            return {'news': {}}
            
    async def _analyze_research(self, sources: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze research results using the intelligence engine."""
        try:
            analysis = {
                'summary': '',
                'key_findings': [],
                'trends': [],
                'recommendations': []
            }
            
            # Generate summary
            summary_prompt = f"Analyze the following research sources and provide a comprehensive summary: {sources}"
            summary = await self.intelligence_engine.analyze(summary_prompt)
            analysis['summary'] = summary
            
            # Extract key findings
            findings_prompt = f"Based on the research, identify key findings: {sources}"
            findings = await self.intelligence_engine.analyze(findings_prompt)
            analysis['key_findings'] = findings.split('\n')
            
            # Identify trends
            trends_prompt = f"Identify emerging trends from the research: {sources}"
            trends = await self.intelligence_engine.analyze(trends_prompt)
            analysis['trends'] = trends.split('\n')
            
            # Generate recommendations
            recs_prompt = f"Based on the research, provide actionable recommendations: {sources}"
            recommendations = await self.intelligence_engine.analyze(recs_prompt)
            analysis['recommendations'] = recommendations.split('\n')
            
            return analysis
            
        except Exception as e:
            logger.error(f"Error analyzing research: {str(e)}")
            return {}
            
    async def _extract_market_symbols(self, topic: str) -> List[str]:
        """Extract potential market symbols from the topic."""
        try:
            prompt = f"Extract potential market symbols from this topic: {topic}"
            symbols = await self.intelligence_engine.analyze(prompt)
            return [s.strip() for s in symbols.split('\n') if s.strip()]
        except Exception as e:
            logger.error(f"Error extracting market symbols: {str(e)}")
            return []
            
    def _calculate_confidence(self, research_results: Dict[str, Any]) -> float:
        """Calculate confidence level based on research quality and completeness."""
        try:
            confidence_scores = []
            
            # Check academic research quality
            if 'academic' in research_results['sources']:
                academic = research_results['sources']['academic']
                if academic.get('papers'):
                    confidence_scores.append(0.9)
                    
            # Check market data quality
            if 'market' in research_results['sources']:
                market = research_results['sources']['market']
                if market:
                    confidence_scores.append(0.85)
                    
            # Check news analysis quality
            if 'news' in research_results['sources']:
                news = research_results['sources']['news']
                if news.get('articles'):
                    confidence_scores.append(0.8)
                    
            # Check analysis quality
            if research_results['analysis']:
                if research_results['analysis'].get('summary'):
                    confidence_scores.append(0.85)
                    
            return min(0.95, sum(confidence_scores) / len(confidence_scores)) if confidence_scores else 0.0
            
        except Exception as e:
            logger.error(f"Error calculating confidence: {str(e)}")
            return 0.0
            
    def _store_research_results(self, results: Dict[str, Any], db: Session) -> None:
        """Store research results in memory."""
        try:
            memory = Memory(
                content=f"Research Results: {results['topic']}",
                metadata={
                    'type': 'research',
                    'topic': results['topic'],
                    'sources': list(results['sources'].keys()),
                    'confidence': results['confidence'],
                    'timestamp': results['timestamp']
                }
            )
            db.add(memory)
            db.commit()
        except Exception as e:
            logger.error(f"Error storing research results: {str(e)}")
            db.rollback() 