import logging
import numpy as np
import pandas as pd
from typing import Dict, List, Union, Optional, Tuple
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from sklearn.metrics import mean_squared_error, r2_score
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset
import structlog
import joblib
import os

logger = structlog.get_logger()

class ModelTrainer:
    def __init__(self, config: Dict):
        self.config = config
        self.models = {}
        self.model_metrics = {}
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        
    async def train_model(self, 
                         data: pd.DataFrame,
                         target_column: str,
                         model_type: str,
                         model_params: Dict = None) -> Dict:
        """
        Train a machine learning model on the provided data.
        
        Args:
            data: Input DataFrame
            target_column: Target variable column name
            model_type: Type of model to train
            model_params: Optional model parameters
            
        Returns:
            Dictionary containing model metrics and metadata
        """
        try:
            # Split data into features and target
            X = data.drop(columns=[target_column])
            y = data[target_column]
            
            # Split into train and test sets
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42
            )
            
            # Train model based on type
            if model_type == 'neural_network':
                model, metrics = await self._train_neural_network(
                    X_train, y_train, X_test, y_test, model_params
                )
            else:
                model, metrics = await self._train_sklearn_model(
                    X_train, y_train, X_test, y_test, model_type, model_params
                )
                
            # Store model and metrics
            model_id = f"{model_type}_{len(self.models)}"
            self.models[model_id] = model
            self.model_metrics[model_id] = metrics
            
            # Save model
            await self._save_model(model, model_id)
            
            return {
                'model_id': model_id,
                'metrics': metrics,
                'model_type': model_type,
                'feature_importance': await self._get_feature_importance(model, X.columns)
            }
            
        except Exception as e:
            logger.error("model_training_error", error=str(e))
            raise
            
    async def _train_sklearn_model(self,
                                  X_train: pd.DataFrame,
                                  y_train: pd.Series,
                                  X_test: pd.DataFrame,
                                  y_test: pd.Series,
                                  model_type: str,
                                  model_params: Dict = None) -> Tuple[object, Dict]:
        """Train a scikit-learn model."""
        try:
            if model_type == 'random_forest':
                from sklearn.ensemble import RandomForestClassifier
                model = RandomForestClassifier(**(model_params or {}))
            elif model_type == 'gradient_boosting':
                from sklearn.ensemble import GradientBoostingClassifier
                model = GradientBoostingClassifier(**(model_params or {}))
            elif model_type == 'svm':
                from sklearn.svm import SVC
                model = SVC(**(model_params or {}))
            else:
                raise ValueError(f"Unsupported model type: {model_type}")
                
            # Train model
            model.fit(X_train, y_train)
            
            # Make predictions
            y_pred = model.predict(X_test)
            
            # Calculate metrics
            metrics = {
                'accuracy': accuracy_score(y_test, y_pred),
                'precision': precision_score(y_test, y_pred, average='weighted'),
                'recall': recall_score(y_test, y_pred, average='weighted'),
                'f1': f1_score(y_test, y_pred, average='weighted')
            }
            
            return model, metrics
            
        except Exception as e:
            logger.error("sklearn_model_training_error", error=str(e))
            raise
            
    async def _train_neural_network(self,
                                   X_train: pd.DataFrame,
                                   y_train: pd.Series,
                                   X_test: pd.DataFrame,
                                   y_test: pd.Series,
                                   model_params: Dict = None) -> Tuple[nn.Module, Dict]:
        """Train a neural network model."""
        try:
            # Convert data to PyTorch tensors
            X_train_tensor = torch.FloatTensor(X_train.values)
            y_train_tensor = torch.FloatTensor(y_train.values)
            X_test_tensor = torch.FloatTensor(X_test.values)
            y_test_tensor = torch.FloatTensor(y_test.values)
            
            # Create datasets and dataloaders
            train_dataset = TensorDataset(X_train_tensor, y_train_tensor)
            test_dataset = TensorDataset(X_test_tensor, y_test_tensor)
            
            train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)
            test_loader = DataLoader(test_dataset, batch_size=32)
            
            # Define model architecture
            input_size = X_train.shape[1]
            hidden_size = model_params.get('hidden_size', 64)
            output_size = 1  # Binary classification
            
            model = nn.Sequential(
                nn.Linear(input_size, hidden_size),
                nn.ReLU(),
                nn.Dropout(0.2),
                nn.Linear(hidden_size, hidden_size),
                nn.ReLU(),
                nn.Dropout(0.2),
                nn.Linear(hidden_size, output_size),
                nn.Sigmoid()
            ).to(self.device)
            
            # Define loss function and optimizer
            criterion = nn.BCELoss()
            optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
            
            # Training loop
            epochs = model_params.get('epochs', 100)
            for epoch in range(epochs):
                model.train()
                for batch_X, batch_y in train_loader:
                    batch_X, batch_y = batch_X.to(self.device), batch_y.to(self.device)
                    
                    optimizer.zero_grad()
                    outputs = model(batch_X)
                    loss = criterion(outputs, batch_y.unsqueeze(1))
                    loss.backward()
                    optimizer.step()
                    
            # Evaluate model
            model.eval()
            y_pred = []
            with torch.no_grad():
                for batch_X, _ in test_loader:
                    batch_X = batch_X.to(self.device)
                    outputs = model(batch_X)
                    y_pred.extend((outputs.cpu().numpy() > 0.5).astype(int))
                    
            # Calculate metrics
            metrics = {
                'accuracy': accuracy_score(y_test, y_pred),
                'precision': precision_score(y_test, y_pred, average='weighted'),
                'recall': recall_score(y_test, y_pred, average='weighted'),
                'f1': f1_score(y_test, y_pred, average='weighted')
            }
            
            return model, metrics
            
        except Exception as e:
            logger.error("neural_network_training_error", error=str(e))
            raise
            
    async def _save_model(self, model: object, model_id: str) -> None:
        """Save the trained model to disk."""
        try:
            model_dir = os.path.join(self.config['model_storage']['path'], model_id)
            os.makedirs(model_dir, exist_ok=True)
            
            if isinstance(model, nn.Module):
                torch.save(model.state_dict(), os.path.join(model_dir, 'model.pth'))
            else:
                joblib.dump(model, os.path.join(model_dir, 'model.joblib'))
                
            # Save model metadata
            metadata = {
                'model_id': model_id,
                'metrics': self.model_metrics[model_id],
                'timestamp': pd.Timestamp.now().isoformat()
            }
            
            joblib.dump(metadata, os.path.join(model_dir, 'metadata.joblib'))
            
        except Exception as e:
            logger.error("model_save_error", error=str(e))
            raise
            
    async def _get_feature_importance(self, model: object, feature_names: List[str]) -> Dict:
        """Get feature importance scores from the trained model."""
        try:
            if hasattr(model, 'feature_importances_'):
                importance = model.feature_importances_
            elif hasattr(model, 'coef_'):
                importance = np.abs(model.coef_[0])
            else:
                return {}
                
            return dict(zip(feature_names, importance))
            
        except Exception as e:
            logger.error("feature_importance_error", error=str(e))
            return {} 