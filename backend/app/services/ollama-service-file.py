"""
ATLAS Ollama Service - Uncensored reasoning engine for LexOS
Save as: backend/app/services/ollama_service.py
"""
import aiohttp
import json
import asyncio
from typing import List, Dict, Optional, Any
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class OllamaService:
    def __init__(self, host: str = None):
        self.host = host or "http://localhost:11434"  # Will be overridden by env
        self.session: Optional[aiohttp.ClientSession] = None
        self.available_models: List[str] = []
        self.model_capabilities = {
            "dolphin-llama3:latest": {
                "context_length": 8192,
                "capabilities": ["general", "coding", "analysis"],
                "uncensored": True
            },
            "dolphin-mixtral:8x7b": {
                "context_length": 32768,
                "capabilities": ["advanced", "multi-domain", "complex"],
                "uncensored": True
            },
            "nous-hermes-2:34b": {
                "context_length": 4096,
                "capabilities": ["deep-analysis", "philosophical"],
                "uncensored": True
            },
            "deepseek-coder:33b": {
                "context_length": 16384,
                "capabilities": ["coding", "algorithms", "technical"],
                "uncensored": True
            },
            "dolphin-phi:latest": {
                "context_length": 2048,
                "capabilities": ["fast", "efficient", "general"],
                "uncensored": True
            }
        }
        
    async def initialize(self):
        """Initialize service and check available models"""
        if not self.session:
            self.session = aiohttp.ClientSession()
        
        # Check Ollama health and get models
        try:
            health = await self.check_health()
            self.available_models = health.get("available_models", [])
            logger.info(f"Ollama initialized with models: {self.available_models}")
        except Exception as e:
            logger.error(f"Failed to initialize Ollama: {e}")
    
    async def reason(
        self, 
        prompt: str, 
        model: str = "dolphin-llama3:latest",
        temperature: float = 0.8,
        context: Optional[Dict] = None,
        stream: bool = False
    ) -> Dict[str, Any]:
        """
        Send reasoning request to Ollama
        Integrates with existing intelligence patterns
        """
        if not self.session:
            await self.initialize()
        
        # Enhance prompt with ATLAS consciousness context
        enhanced_prompt = self._enhance_prompt(prompt, context)
        
        payload = {
            "model": model,
            "prompt": enhanced_prompt,
            "stream": stream,
            "options": {
                "temperature": temperature,
                "num_ctx": self.model_capabilities.get(model, {}).get("context_length", 8192),
                "num_predict": 2048,
                "top_p": 0.9,
                "repeat_penalty": 1.1
            }
        }
        
        try:
            async with self.session.post(
                f"{self.host}/api/generate",
                json=payload,
                timeout=aiohttp.ClientTimeout(total=300)
            ) as response:
                result = await response.json()
                
                # Log token usage for monitoring
                if "total_duration" in result:
                    duration_seconds = result["total_duration"] / 1e9
                    logger.info(f"Reasoning completed in {duration_seconds:.2f}s")
                
                return {
                    "response": result.get("response", ""),
                    "model": model,
                    "duration": result.get("total_duration", 0) / 1e9,
                    "context_used": result.get("context", ""),
                    "uncensored": self.model_capabilities.get(model, {}).get("uncensored", False)
                }
                
        except asyncio.TimeoutError:
            logger.error(f"Ollama request timed out for model {model}")
            return {"error": "Request timed out", "model": model}
        except Exception as e:
            logger.error(f"Ollama request failed: {e}")
            return {"error": str(e), "model": model}
    
    async def multi_model_consensus(
        self, 
        prompt: str, 
        models: Optional[List[str]] = None,
        context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Get consensus from multiple models
        Perfect for critical decisions
        """
        if not models:
            models = ["dolphin-llama3:latest", "dolphin-mixtral:8x7b"]
        
        # Filter to only available models
        active_models = [m for m in models if m in self.available_models]
        
        if not active_models:
            return {"error": "No requested models available"}
        
        # Parallel reasoning across models
        tasks = [
            self.reason(prompt, model=model, context=context) 
            for model in active_models
        ]
        
        responses = await asyncio.gather(*tasks)
        
        # Analyze consensus
        consensus = self._analyze_consensus(responses)
        
        return {
            "consensus": consensus,
            "individual_responses": responses,
            "models_used": active_models,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    async def stream_reasoning(
        self,
        prompt: str,
        model: str = "dolphin-llama3:latest",
        callback: Optional[Any] = None
    ) -> None:
        """Stream reasoning responses in real-time"""
        if not self.session:
            await self.initialize()
        
        enhanced_prompt = self._enhance_prompt(prompt, None)
        
        payload = {
            "model": model,
            "prompt": enhanced_prompt,
            "stream": True
        }
        
        try:
            async with self.session.post(
                f"{self.host}/api/generate",
                json=payload
            ) as response:
                async for line in response.content:
                    if line:
                        data = json.loads(line)
                        if callback:
                            await callback(data)
                        if data.get("done", False):
                            break
        except Exception as e:
            logger.error(f"Streaming failed: {e}")
    
    async def check_health(self) -> Dict[str, Any]:
        """Check Ollama service health"""
        try:
            if not self.session:
                self.session = aiohttp.ClientSession()
                
            async with self.session.get(
                f"{self.host}/api/tags",
                timeout=aiohttp.ClientTimeout(total=10)
            ) as response:
                data = await response.json()
                return {
                    "status": "connected",
                    "available_models": [m["name"] for m in data.get("models", [])]
                }
        except Exception as e: