import asyncio
import logging
from typing import Dict, List, Optional, Union
import structlog
from fastapi import FastAPI, HTTPException, WebSocket
from pydantic import BaseModel
import numpy as np
import torch
from datetime import datetime
import json
import redis
import yaml
import aiohttp
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import uuid
import pandas as pd
from analytics.predictive_engine import PredictiveEngine

# Configure structured logging
structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer()
    ]
)
logger = structlog.get_logger()

# Initialize FastAPI app
app = FastAPI(title="LexOS Digital Twin Service", version="1.0.0")

# Initialize Redis
redis_client = redis.Redis(
    host="redis",
    port=6379,
    password=os.getenv("REDIS_PASSWORD"),
    decode_responses=True
)

# Database connection
DATABASE_URL = f"postgresql://{os.getenv('POSTGRES_USER')}:{os.getenv('DB_PASSWORD')}@postgres:5432/{os.getenv('POSTGRES_DB')}"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class BuildingSystem(BaseModel):
    system_id: str
    system_type: str
    status: str
    metrics: Dict
    last_updated: datetime

class DigitalTwin(BaseModel):
    twin_id: str
    building_id: str
    systems: List[BuildingSystem]
    metadata: Dict
    last_sync: datetime

class TwinService:
    def __init__(self):
        self.active_twins = {}
        self.system_models = {}
        self.initialize_models()
        
    def initialize_models(self):
        """Initialize ML models for system monitoring and prediction."""
        try:
            # Load model configurations
            with open("config/models.yaml", "r") as f:
                model_configs = yaml.safe_load(f)
                
            # Initialize models for different systems
            for system_type, config in model_configs["systems"].items():
                self.system_models[system_type] = self._load_model(config)
                
        except Exception as e:
            logger.error("model_initialization_error", error=str(e))
            raise
            
    def _load_model(self, config: Dict):
        """Load ML model based on configuration."""
        try:
            if config["type"] == "pytorch":
                return torch.load(config["path"])
            elif config["type"] == "tensorflow":
                import tensorflow as tf
                return tf.keras.models.load_model(config["path"])
            else:
                raise ValueError(f"Unsupported model type: {config['type']}")
                
        except Exception as e:
            logger.error("model_loading_error", error=str(e))
            raise
            
    async def create_twin(self, building_id: str, metadata: Dict) -> DigitalTwin:
        """Create a new digital twin for a building."""
        try:
            twin_id = str(uuid.uuid4())
            twin = DigitalTwin(
                twin_id=twin_id,
                building_id=building_id,
                systems=[],
                metadata=metadata,
                last_sync=datetime.now()
            )
            
            # Store in Redis for quick access
            await redis_client.set(
                f"twin:{twin_id}",
                json.dumps(twin.dict()),
                ex=3600  # 1 hour expiry
            )
            
            self.active_twins[twin_id] = twin
            return twin
            
        except Exception as e:
            logger.error("twin_creation_error", error=str(e))
            raise
            
    async def update_system(self, twin_id: str, system_data: BuildingSystem):
        """Update a building system's data in the digital twin."""
        try:
            if twin_id not in self.active_twins:
                raise ValueError(f"Digital twin not found: {twin_id}")
                
            twin = self.active_twins[twin_id]
            
            # Update system data
            for i, system in enumerate(twin.systems):
                if system.system_id == system_data.system_id:
                    twin.systems[i] = system_data
                    break
            else:
                twin.systems.append(system_data)
                
            # Update last sync time
            twin.last_sync = datetime.now()
            
            # Store updated twin
            await redis_client.set(
                f"twin:{twin_id}",
                json.dumps(twin.dict()),
                ex=3600
            )
            
            # Run predictive analysis
            await self._analyze_system(twin_id, system_data)
            
            return twin
            
        except Exception as e:
            logger.error("system_update_error", error=str(e))
            raise
            
    async def _analyze_system(self, twin_id: str, system: BuildingSystem):
        """Analyze system data and predict potential issues."""
        try:
            if system.system_type in self.system_models:
                model = self.system_models[system.system_type]
                
                # Prepare input data
                input_data = self._prepare_system_data(system)
                
                # Get predictions
                predictions = model(input_data)
                
                # Store predictions
                await redis_client.set(
                    f"predictions:{twin_id}:{system.system_id}",
                    json.dumps(predictions),
                    ex=3600
                )
                
                # Check for anomalies
                if self._detect_anomaly(predictions):
                    await self._trigger_alert(twin_id, system, predictions)
                    
        except Exception as e:
            logger.error("system_analysis_error", error=str(e))
            raise
            
    def _prepare_system_data(self, system: BuildingSystem) -> np.ndarray:
        """Prepare system data for model input."""
        try:
            # Convert metrics to numpy array
            metrics = np.array(list(system.metrics.values()))
            return metrics.reshape(1, -1)
            
        except Exception as e:
            logger.error("data_preparation_error", error=str(e))
            raise
            
    def _detect_anomaly(self, predictions: np.ndarray) -> bool:
        """Detect anomalies in system predictions."""
        try:
            # Implement anomaly detection logic
            threshold = 0.95
            return np.any(predictions > threshold)
            
        except Exception as e:
            logger.error("anomaly_detection_error", error=str(e))
            raise
            
    async def _trigger_alert(self, twin_id: str, system: BuildingSystem, predictions: Dict):
        """Trigger alerts for detected anomalies."""
        try:
            alert = {
                "twin_id": twin_id,
                "system_id": system.system_id,
                "system_type": system.system_type,
                "predictions": predictions,
                "timestamp": datetime.now().isoformat()
            }
            
            # Publish alert to Redis channel
            await redis_client.publish("alerts", json.dumps(alert))
            
        except Exception as e:
            logger.error("alert_trigger_error", error=str(e))
            raise

# Initialize twin service
twin_service = TwinService()

# Initialize predictive engine
predictive_engine = PredictiveEngine()

@app.post("/twins")
async def create_digital_twin(building_id: str, metadata: Dict) -> DigitalTwin:
    """Create a new digital twin."""
    try:
        return await twin_service.create_twin(building_id, metadata)
    except Exception as e:
        logger.error("twin_creation_endpoint_error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/twins/{twin_id}/systems")
async def update_system(twin_id: str, system: BuildingSystem) -> DigitalTwin:
    """Update a building system in the digital twin."""
    try:
        return await twin_service.update_system(twin_id, system)
    except Exception as e:
        logger.error("system_update_endpoint_error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/twins/{twin_id}/stream")
async def stream_twin_data(websocket: WebSocket, twin_id: str):
    """Stream real-time digital twin data."""
    try:
        await websocket.accept()
        
        while True:
            # Get latest twin data
            twin_data = await redis_client.get(f"twin:{twin_id}")
            if twin_data:
                await websocket.send_text(twin_data)
                
            # Get latest predictions
            for system in twin_service.active_twins[twin_id].systems:
                predictions = await redis_client.get(f"predictions:{twin_id}:{system.system_id}")
                if predictions:
                    await websocket.send_text(predictions)
                    
            await asyncio.sleep(1)  # Update every second
            
    except Exception as e:
        logger.error("twin_streaming_error", error=str(e))
        await websocket.close()

@app.get("/health")
async def health_check():
    """Check the health of the Digital Twin service."""
    try:
        return {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "active_twins": len(twin_service.active_twins),
            "system_models": list(twin_service.system_models.keys())
        }
    except Exception as e:
        logger.error("health_check_error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/twins/{twin_id}/analyze")
async def analyze_twin_data(
    twin_id: str,
    target_metrics: List[str],
    forecast_horizon: int = 24
) -> Dict:
    """Analyze digital twin data with predictive analytics."""
    try:
        # Get twin data
        twin_data = await redis_client.get(f"twin:{twin_id}")
        if not twin_data:
            raise HTTPException(status_code=404, detail="Digital twin not found")
            
        # Convert to DataFrame
        data = pd.DataFrame(json.loads(twin_data))
        
        # Perform analysis
        analysis = await predictive_engine.predict_system_behavior(
            data,
            target_metrics,
            prediction_horizon=forecast_horizon
        )
        
        return analysis
        
    except Exception as e:
        logger.error("twin_analysis_error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/twins/{twin_id}/correlations")
async def analyze_correlations(
    twin_id: str,
    target_metric: str,
    threshold: float = 0.7
) -> Dict:
    """Analyze correlations between metrics."""
    try:
        # Get twin data
        twin_data = await redis_client.get(f"twin:{twin_id}")
        if not twin_data:
            raise HTTPException(status_code=404, detail="Digital twin not found")
            
        # Convert to DataFrame
        data = pd.DataFrame(json.loads(twin_data))
        
        # Analyze correlations
        correlations = await predictive_engine.detect_correlations(
            data,
            target_metric,
            threshold=threshold
        )
        
        return correlations
        
    except Exception as e:
        logger.error("correlation_analysis_error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/twins/{twin_id}/health")
async def analyze_system_health(
    twin_id: str,
    metrics: List[str]
) -> Dict:
    """Analyze system health metrics."""
    try:
        # Get twin data
        twin_data = await redis_client.get(f"twin:{twin_id}")
        if not twin_data:
            raise HTTPException(status_code=404, detail="Digital twin not found")
            
        # Convert to DataFrame
        data = pd.DataFrame(json.loads(twin_data))
        
        # Analyze health
        health_analysis = await predictive_engine.analyze_system_health(
            data,
            metrics
        )
        
        return health_analysis
        
    except Exception as e:
        logger.error("health_analysis_error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/twins/{twin_id}/forecast")
async def forecast_metrics(
    twin_id: str,
    target_metrics: List[str],
    forecast_horizon: int = 24,
    confidence_interval: float = 0.95
) -> Dict:
    """Generate forecasts for specified metrics."""
    try:
        # Get twin data
        twin_data = await redis_client.get(f"twin:{twin_id}")
        if not twin_data:
            raise HTTPException(status_code=404, detail="Digital twin not found")
            
        # Convert to DataFrame
        data = pd.DataFrame(json.loads(twin_data))
        
        forecasts = {}
        for metric in target_metrics:
            # Generate forecast
            forecast = await predictive_engine.analyze_timeseries(
                data,
                metric,
                forecast_horizon=forecast_horizon,
                confidence_interval=confidence_interval
            )
            
            forecasts[metric] = forecast
            
        return forecasts
        
    except Exception as e:
        logger.error("forecast_generation_error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 