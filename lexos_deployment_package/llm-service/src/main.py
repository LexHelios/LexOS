import asyncio
import logging
from typing import Dict, List, Optional, Union
import structlog
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import openai
import anthropic
import cohere
import google.generativeai as genai
import replicate
import huggingface_hub
from transformers import pipeline
import torch
import redis
import json
from datetime import datetime
import os
import aiohttp
import yaml

# Configure structured logging
structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer()
    ]
)
logger = structlog.get_logger()

# Initialize FastAPI app
app = FastAPI(title="LexOS LLM Service", version="1.0.0")

# Initialize LLM clients
class LLMClients:
    def __init__(self):
        # OpenAI
        self.openai_client = openai.Client(api_key=os.getenv("OPENAI_API_KEY"))
        
        # Anthropic
        self.anthropic_client = anthropic.Client(api_key=os.getenv("ANTHROPIC_API_KEY"))
        
        # Cohere
        self.cohere_client = cohere.Client(api_key=os.getenv("COHERE_API_KEY"))
        
        # Google AI
        genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
        self.google_model = genai.GenerativeModel('gemini-pro')
        
        # Replicate
        self.replicate_client = replicate.Client(api_token=os.getenv("REPLICATE_API_KEY"))
        
        # Hugging Face
        self.hf_token = os.getenv("HF_API_KEY")
        huggingface_hub.login(token=self.hf_token)
        
        # Load local models
        self.local_models = {}
        
    async def initialize_local_models(self):
        """Initialize local models from Hugging Face."""
        try:
            # Load models based on configuration
            model_configs = self._load_model_configs()
            
            for model_id, config in model_configs.items():
                if config["type"] == "local":
                    self.local_models[model_id] = pipeline(
                        task=config["task"],
                        model=config["model_name"],
                        device=0 if torch.cuda.is_available() else -1
                    )
                    
        except Exception as e:
            logger.error("local_model_initialization_error", error=str(e))
            raise
            
    def _load_model_configs(self) -> Dict:
        """Load model configurations from YAML file."""
        try:
            with open("config/models.yaml", "r") as f:
                return yaml.safe_load(f)
        except Exception as e:
            logger.error("model_config_load_error", error=str(e))
            return {}

# Initialize Redis
redis_client = redis.Redis(
    host="redis",
    port=6379,
    password=os.getenv("REDIS_PASSWORD"),
    decode_responses=True
)

class LLMRequest(BaseModel):
    provider: str
    model: str
    prompt: str
    parameters: Optional[Dict] = None
    context: Optional[Dict] = None

class LLMResponse(BaseModel):
    task_id: str
    status: str
    response: Optional[str] = None
    metadata: Dict

class LLMService:
    def __init__(self):
        self.clients = LLMClients()
        self.response_cache = {}
        
    async def process_request(self, request: LLMRequest) -> LLMResponse:
        """Process an LLM request."""
        try:
            # Generate task ID
            task_id = f"llm_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            
            # Check cache
            cache_key = f"{request.provider}:{request.model}:{request.prompt}"
            if cache_key in self.response_cache:
                return LLMResponse(
                    task_id=task_id,
                    status="completed",
                    response=self.response_cache[cache_key],
                    metadata={"source": "cache"}
                )
            
            # Process request based on provider
            if request.provider == "openai":
                response = await self._process_openai(request)
            elif request.provider == "anthropic":
                response = await self._process_anthropic(request)
            elif request.provider == "cohere":
                response = await self._process_cohere(request)
            elif request.provider == "google":
                response = await self._process_google(request)
            elif request.provider == "replicate":
                response = await self._process_replicate(request)
            elif request.provider == "huggingface":
                response = await self._process_huggingface(request)
            elif request.provider == "local":
                response = await self._process_local(request)
            else:
                raise ValueError(f"Unknown provider: {request.provider}")
                
            # Cache response
            self.response_cache[cache_key] = response
            
            return LLMResponse(
                task_id=task_id,
                status="completed",
                response=response,
                metadata={
                    "provider": request.provider,
                    "model": request.model,
                    "timestamp": datetime.now().isoformat()
                }
            )
            
        except Exception as e:
            logger.error("llm_processing_error", error=str(e))
            raise
            
    async def _process_openai(self, request: LLMRequest) -> str:
        """Process request using OpenAI."""
        try:
            response = await self.clients.openai_client.chat.completions.create(
                model=request.model,
                messages=[{"role": "user", "content": request.prompt}],
                **request.parameters or {}
            )
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error("openai_processing_error", error=str(e))
            raise
            
    async def _process_anthropic(self, request: LLMRequest) -> str:
        """Process request using Anthropic."""
        try:
            response = await self.clients.anthropic_client.messages.create(
                model=request.model,
                messages=[{"role": "user", "content": request.prompt}],
                **request.parameters or {}
            )
            return response.content[0].text
            
        except Exception as e:
            logger.error("anthropic_processing_error", error=str(e))
            raise
            
    async def _process_cohere(self, request: LLMRequest) -> str:
        """Process request using Cohere."""
        try:
            response = await self.clients.cohere_client.generate(
                prompt=request.prompt,
                model=request.model,
                **request.parameters or {}
            )
            return response.generations[0].text
            
        except Exception as e:
            logger.error("cohere_processing_error", error=str(e))
            raise
            
    async def _process_google(self, request: LLMRequest) -> str:
        """Process request using Google AI."""
        try:
            response = await self.clients.google_model.generate_content(
                request.prompt,
                **request.parameters or {}
            )
            return response.text
            
        except Exception as e:
            logger.error("google_processing_error", error=str(e))
            raise
            
    async def _process_replicate(self, request: LLMRequest) -> str:
        """Process request using Replicate."""
        try:
            response = await self.clients.replicate_client.run(
                request.model,
                input={"prompt": request.prompt, **(request.parameters or {})}
            )
            return str(response)
            
        except Exception as e:
            logger.error("replicate_processing_error", error=str(e))
            raise
            
    async def _process_huggingface(self, request: LLMRequest) -> str:
        """Process request using Hugging Face."""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"https://api-inference.huggingface.co/models/{request.model}",
                    headers={"Authorization": f"Bearer {self.clients.hf_token}"},
                    json={"inputs": request.prompt, **(request.parameters or {})}
                ) as response:
                    result = await response.json()
                    return str(result)
                    
        except Exception as e:
            logger.error("huggingface_processing_error", error=str(e))
            raise
            
    async def _process_local(self, request: LLMRequest) -> str:
        """Process request using local model."""
        try:
            if request.model not in self.clients.local_models:
                raise ValueError(f"Local model not found: {request.model}")
                
            result = self.clients.local_models[request.model](
                request.prompt,
                **request.parameters or {}
            )
            return str(result)
            
        except Exception as e:
            logger.error("local_processing_error", error=str(e))
            raise

# Initialize LLM service
llm_service = LLMService()

@app.post("/generate")
async def generate_text(request: LLMRequest) -> LLMResponse:
    """Generate text using specified LLM."""
    try:
        return await llm_service.process_request(request)
    except Exception as e:
        logger.error("text_generation_error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/models")
async def list_models():
    """List available models and their capabilities."""
    try:
        return {
            "openai": ["gpt-4", "gpt-3.5-turbo"],
            "anthropic": ["claude-3-opus", "claude-3-sonnet"],
            "cohere": ["command", "command-light"],
            "google": ["gemini-pro"],
            "replicate": ["llama-2-70b", "mistral-7b"],
            "huggingface": ["meta-llama/Llama-2-70b", "mistralai/Mistral-7B"],
            "local": list(llm_service.clients.local_models.keys())
        }
    except Exception as e:
        logger.error("model_listing_error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Check the health of the LLM service."""
    try:
        return {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "providers": {
                "openai": True,
                "anthropic": True,
                "cohere": True,
                "google": True,
                "replicate": True,
                "huggingface": True,
                "local": len(llm_service.clients.local_models) > 0
            }
        }
    except Exception as e:
        logger.error("health_check_error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 