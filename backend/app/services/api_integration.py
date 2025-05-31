from typing import Dict, List, Any, Optional
from datetime import datetime
import logging
import json
import asyncio
import aiohttp
import requests
from sqlalchemy.orm import Session
from ..services.memory_service import Memory, get_db
from ..services.intelligence_service import IntelligenceEngine
from .api_keys import (
    OPENAI_API_KEY,
    ANTHROPIC_API_KEY,
    COHERE_API_KEY,
    PERPLEXITY_API_KEY,
    REPLICATE_API_KEY,
    HUGGINGFACE_API_KEY,
    GOOGLE_API_KEY,
    FIGMA_API_KEY
)

logger = logging.getLogger(__name__)

class APIIntegrationService:
    def __init__(self):
        self.intelligence_engine = IntelligenceEngine()
        self.confidence_threshold = 0.85
        self.max_concurrent_requests = 5
        self.request_timeout = 30
        self.retry_attempts = 3
        
        # API configurations with keys
        self.api_configs = {
            'scholar': {
                'base_url': 'https://scholar.google.com',
                'endpoints': {
                    'search': '/scholar',
                    'citations': '/citations'
                }
            },
            'financial': {
                'base_url': 'https://api.financial.com',
                'endpoints': {
                    'market_data': '/market',
                    'company_info': '/company',
                    'news': '/news'
                }
            },
            'news': {
                'base_url': 'https://api.news.com',
                'endpoints': {
                    'headlines': '/headlines',
                    'search': '/search',
                    'trending': '/trending'
                }
            },
            'technical': {
                'base_url': 'https://api.technical.com',
                'endpoints': {
                    'analysis': '/analysis',
                    'indicators': '/indicators',
                    'patterns': '/patterns'
                }
            },
            'ai': {
                'openai': OPENAI_API_KEY,
                'anthropic': ANTHROPIC_API_KEY,
                'cohere': COHERE_API_KEY,
                'perplexity': PERPLEXITY_API_KEY,
                'replicate': REPLICATE_API_KEY,
                'huggingface': HUGGINGFACE_API_KEY,
                'google': GOOGLE_API_KEY
            },
            'design': {
                'figma': FIGMA_API_KEY
            }
        }
        
    async def search_scholar(self, query: str, db: Session = None) -> Dict[str, Any]:
        """Search academic papers and research."""
        try:
            results = await self._make_api_request(
                'scholar',
                'search',
                {'q': query},
                db
            )
            return self._process_scholar_results(results)
        except Exception as e:
            logger.error(f"Error searching scholar: {str(e)}")
            raise

    async def get_market_data(self, symbol: str, db: Session = None) -> Dict[str, Any]:
        """Get financial market data."""
        try:
            results = await self._make_api_request(
                'financial',
                'market_data',
                {'symbol': symbol},
                db
            )
            return self._process_market_data(results)
        except Exception as e:
            logger.error(f"Error getting market data: {str(e)}")
            raise

    async def get_news(self, topic: str, db: Session = None) -> Dict[str, Any]:
        """Get news articles related to a topic."""
        try:
            results = await self._make_api_request(
                'news',
                'search',
                {'topic': topic},
                db
            )
            return self._process_news_results(results)
        except Exception as e:
            logger.error(f"Error getting news: {str(e)}")
            raise

    async def get_technical_analysis(self, symbol: str, db: Session = None) -> Dict[str, Any]:
        """Get technical analysis data."""
        try:
            results = await self._make_api_request(
                'technical',
                'analysis',
                {'symbol': symbol},
                db
            )
            return self._process_technical_analysis(results)
        except Exception as e:
            logger.error(f"Error getting technical analysis: {str(e)}")
            raise

    async def _make_api_request(self, api_name: str, endpoint: str, params: Dict[str, Any], db: Session = None) -> Dict[str, Any]:
        """Make an API request with retry logic."""
        api_config = self.api_configs.get(api_name)
        if not api_config:
            raise ValueError(f"Unknown API: {api_name}")
            
        url = f"{api_config['base_url']}{api_config['endpoints'][endpoint]}"
        
        for attempt in range(self.retry_attempts):
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.get(url, params=params, timeout=self.request_timeout) as response:
                        if response.status == 200:
                            result = await response.json()
                            
                            # Store API interaction
                            if db:
                                self._store_api_interaction(api_name, endpoint, params, result, db)
                                
                            return result
                        else:
                            logger.warning(f"API request failed (attempt {attempt + 1}): {response.status}")
                            
            except Exception as e:
                logger.error(f"API request error (attempt {attempt + 1}): {str(e)}")
                if attempt == self.retry_attempts - 1:
                    raise
                    
            await asyncio.sleep(1)  # Wait before retry
            
        raise Exception("All API request attempts failed")

    def _process_scholar_results(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """Process and structure scholar search results."""
        processed = {
            'papers': [],
            'citations': [],
            'confidence': 0.0,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        # Process results and calculate confidence
        if 'papers' in results:
            for paper in results['papers']:
                processed['papers'].append({
                    'title': paper.get('title', ''),
                    'authors': paper.get('authors', []),
                    'abstract': paper.get('abstract', ''),
                    'citations': paper.get('citations', 0),
                    'year': paper.get('year', '')
                })
                
        processed['confidence'] = self._calculate_confidence(processed['papers'])
        return processed

    def _process_market_data(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """Process and structure market data results."""
        processed = {
            'price_data': {},
            'indicators': {},
            'confidence': 0.0,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        # Process price data
        if 'prices' in results:
            processed['price_data'] = {
                'current': results['prices'].get('current', 0),
                'change': results['prices'].get('change', 0),
                'volume': results['prices'].get('volume', 0)
            }
            
        # Process technical indicators
        if 'indicators' in results:
            processed['indicators'] = results['indicators']
            
        processed['confidence'] = self._calculate_confidence(processed['price_data'])
        return processed

    def _process_news_results(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """Process and structure news results."""
        processed = {
            'articles': [],
            'sentiment': {},
            'confidence': 0.0,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        # Process articles
        if 'articles' in results:
            for article in results['articles']:
                processed['articles'].append({
                    'title': article.get('title', ''),
                    'source': article.get('source', ''),
                    'url': article.get('url', ''),
                    'published_at': article.get('published_at', ''),
                    'summary': article.get('summary', '')
                })
                
        # Process sentiment
        if 'sentiment' in results:
            processed['sentiment'] = results['sentiment']
            
        processed['confidence'] = self._calculate_confidence(processed['articles'])
        return processed

    def _process_technical_analysis(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """Process and structure technical analysis results."""
        processed = {
            'patterns': [],
            'indicators': {},
            'signals': [],
            'confidence': 0.0,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        # Process patterns
        if 'patterns' in results:
            processed['patterns'] = results['patterns']
            
        # Process indicators
        if 'indicators' in results:
            processed['indicators'] = results['indicators']
            
        # Process signals
        if 'signals' in results:
            processed['signals'] = results['signals']
            
        processed['confidence'] = self._calculate_confidence(processed['patterns'])
        return processed

    def _calculate_confidence(self, data: Any) -> float:
        """Calculate confidence level based on data quality and completeness."""
        if not data:
            return 0.0
            
        # This is a simplified confidence calculation
        # In practice, you'd want more sophisticated metrics
        return min(0.95, 0.7 + (len(str(data)) / 1000))

    def _store_api_interaction(self, api_name: str, endpoint: str, params: Dict[str, Any], result: Dict[str, Any], db: Session) -> None:
        """Store API interaction in memory."""
        memory = Memory(
            content=f"API Interaction: {api_name}/{endpoint}",
            metadata={
                'type': 'api_interaction',
                'api': api_name,
                'endpoint': endpoint,
                'params': params,
                'result': result,
                'timestamp': datetime.utcnow().isoformat()
            }
        )
        db.add(memory)
        db.commit() 