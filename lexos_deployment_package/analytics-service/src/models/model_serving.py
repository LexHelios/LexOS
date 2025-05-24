import logging
import numpy as np
import pandas as pd
from typing import Dict, List, Union, Optional
import torch
import torch.nn as nn
import joblib
import os
import structlog
from datetime import datetime

logger = structlog.get_logger()

class ModelServing:
    def __init__(self, config: Dict):
        self.config = config
        self.loaded_models = {}
        self.model_metadata = {}
        
    async def load_model(self, model_id: str) -> None:
        """
        Load a trained model from disk.
        
        Args:
            model_id: Unique identifier for the model
        """
        try:
            model_dir = os.path.join(self.config['model_storage']['path'], model_id)
            
            # Load model metadata
            metadata_path = os.path.join(model_dir, 'metadata.joblib')
            if os.path.exists(metadata_path):
                self.model_metadata[model_id] = joblib.load(metadata_path)
            
            # Load model based on type
            model_path = os.path.join(model_dir, 'model.pth')
            if os.path.exists(model_path):
                # Load PyTorch model
                model = await self._load_pytorch_model(model_path)
            else:
                # Load scikit-learn model
                model_path = os.path.join(model_dir, 'model.joblib')
                model = joblib.load(model_path)
                
            self.loaded_models[model_id] = model
            logger.info("model_loaded", model_id=model_id)
            
        except Exception as e:
            logger.error("model_loading_error", error=str(e), model_id=model_id)
            raise
            
    async def _load_pytorch_model(self, model_path: str) -> nn.Module:
        """Load a PyTorch model from disk."""
        try:
            # Define model architecture (should match training)
            model = nn.Sequential(
                nn.Linear(self.config['model_params']['input_size'], 64),
                nn.ReLU(),
                nn.Dropout(0.2),
                nn.Linear(64, 64),
                nn.ReLU(),
                nn.Dropout(0.2),
                nn.Linear(64, 1),
                nn.Sigmoid()
            )
            
            # Load state dict
            model.load_state_dict(torch.load(model_path))
            model.eval()
            return model
            
        except Exception as e:
            logger.error("pytorch_model_loading_error", error=str(e))
            raise
            
    async def predict(self,
                     model_id: str,
                     data: pd.DataFrame,
                     batch_size: int = 32) -> np.ndarray:
        """
        Make predictions using a loaded model.
        
        Args:
            model_id: Unique identifier for the model
            data: Input data for prediction
            batch_size: Batch size for prediction (for neural networks)
            
        Returns:
            Array of predictions
        """
        try:
            if model_id not in self.loaded_models:
                await self.load_model(model_id)
                
            model = self.loaded_models[model_id]
            
            if isinstance(model, nn.Module):
                predictions = await self._predict_neural_network(model, data, batch_size)
            else:
                predictions = await self._predict_sklearn_model(model, data)
                
            # Log prediction request
            logger.info("prediction_made",
                       model_id=model_id,
                       num_samples=len(data),
                       timestamp=datetime.now().isoformat())
                       
            return predictions
            
        except Exception as e:
            logger.error("prediction_error", error=str(e), model_id=model_id)
            raise
            
    async def _predict_neural_network(self,
                                    model: nn.Module,
                                    data: pd.DataFrame,
                                    batch_size: int) -> np.ndarray:
        """Make predictions using a neural network model."""
        try:
            device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
            model = model.to(device)
            
            # Convert data to tensor
            data_tensor = torch.FloatTensor(data.values)
            dataset = torch.utils.data.TensorDataset(data_tensor)
            dataloader = torch.utils.data.DataLoader(dataset, batch_size=batch_size)
            
            predictions = []
            with torch.no_grad():
                for batch in dataloader:
                    batch = batch[0].to(device)
                    outputs = model(batch)
                    predictions.extend(outputs.cpu().numpy())
                    
            return np.array(predictions)
            
        except Exception as e:
            logger.error("neural_network_prediction_error", error=str(e))
            raise
            
    async def _predict_sklearn_model(self,
                                   model: object,
                                   data: pd.DataFrame) -> np.ndarray:
        """Make predictions using a scikit-learn model."""
        try:
            return model.predict(data)
            
        except Exception as e:
            logger.error("sklearn_model_prediction_error", error=str(e))
            raise
            
    async def get_model_info(self, model_id: str) -> Dict:
        """
        Get information about a loaded model.
        
        Args:
            model_id: Unique identifier for the model
            
        Returns:
            Dictionary containing model information
        """
        try:
            if model_id not in self.loaded_models:
                await self.load_model(model_id)
                
            model = self.loaded_models[model_id]
            metadata = self.model_metadata.get(model_id, {})
            
            info = {
                'model_id': model_id,
                'model_type': 'neural_network' if isinstance(model, nn.Module) else 'sklearn',
                'loaded_at': datetime.now().isoformat(),
                'metadata': metadata
            }
            
            return info
            
        except Exception as e:
            logger.error("model_info_error", error=str(e), model_id=model_id)
            raise
            
    async def unload_model(self, model_id: str) -> None:
        """
        Unload a model from memory.
        
        Args:
            model_id: Unique identifier for the model
        """
        try:
            if model_id in self.loaded_models:
                del self.loaded_models[model_id]
                logger.info("model_unloaded", model_id=model_id)
                
        except Exception as e:
            logger.error("model_unload_error", error=str(e), model_id=model_id)
            raise 