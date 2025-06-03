import logging
import numpy as np
import pandas as pd
from typing import Dict, List, Union, Optional
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.decomposition import PCA
from sklearn.feature_selection import SelectKBest, f_classif
import structlog

logger = structlog.get_logger()

class DataProcessor:
    def __init__(self, config: Dict):
        self.config = config
        self.scalers = {}
        self.feature_selectors = {}
        
    async def preprocess_data(self, data: pd.DataFrame, 
                            target_column: Optional[str] = None,
                            preprocessing_steps: List[str] = None) -> pd.DataFrame:
        """
        Preprocess the input data according to specified steps.
        
        Args:
            data: Input DataFrame
            target_column: Optional target column for supervised learning
            preprocessing_steps: List of preprocessing steps to apply
            
        Returns:
            Preprocessed DataFrame
        """
        try:
            df = data.copy()
            
            if preprocessing_steps is None:
                preprocessing_steps = ['handle_missing', 'encode_categorical', 'scale_numerical']
                
            for step in preprocessing_steps:
                if step == 'handle_missing':
                    df = await self._handle_missing_values(df)
                elif step == 'encode_categorical':
                    df = await self._encode_categorical_variables(df)
                elif step == 'scale_numerical':
                    df = await self._scale_numerical_variables(df)
                elif step == 'feature_selection' and target_column:
                    df = await self._select_features(df, target_column)
                    
            return df
            
        except Exception as e:
            logger.error("data_preprocessing_error", error=str(e))
            raise
            
    async def _handle_missing_values(self, df: pd.DataFrame) -> pd.DataFrame:
        """Handle missing values in the dataset."""
        try:
            # For numerical columns, fill with median
            numerical_cols = df.select_dtypes(include=[np.number]).columns
            df[numerical_cols] = df[numerical_cols].fillna(df[numerical_cols].median())
            
            # For categorical columns, fill with mode
            categorical_cols = df.select_dtypes(include=['object']).columns
            df[categorical_cols] = df[categorical_cols].fillna(df[categorical_cols].mode().iloc[0])
            
            return df
            
        except Exception as e:
            logger.error("missing_value_handling_error", error=str(e))
            raise
            
    async def _encode_categorical_variables(self, df: pd.DataFrame) -> pd.DataFrame:
        """Encode categorical variables using one-hot encoding."""
        try:
            categorical_cols = df.select_dtypes(include=['object']).columns
            df = pd.get_dummies(df, columns=categorical_cols, drop_first=True)
            return df
            
        except Exception as e:
            logger.error("categorical_encoding_error", error=str(e))
            raise
            
    async def _scale_numerical_variables(self, df: pd.DataFrame) -> pd.DataFrame:
        """Scale numerical variables using StandardScaler."""
        try:
            numerical_cols = df.select_dtypes(include=[np.number]).columns
            
            for col in numerical_cols:
                if col not in self.scalers:
                    self.scalers[col] = StandardScaler()
                    df[col] = self.scalers[col].fit_transform(df[[col]])
                else:
                    df[col] = self.scalers[col].transform(df[[col]])
                    
            return df
            
        except Exception as e:
            logger.error("numerical_scaling_error", error=str(e))
            raise
            
    async def _select_features(self, df: pd.DataFrame, target_column: str) -> pd.DataFrame:
        """Select the most important features using SelectKBest."""
        try:
            X = df.drop(columns=[target_column])
            y = df[target_column]
            
            if target_column not in self.feature_selectors:
                self.feature_selectors[target_column] = SelectKBest(f_classif, k='all')
                self.feature_selectors[target_column].fit(X, y)
                
            selected_features = X.columns[self.feature_selectors[target_column].get_support()]
            return df[selected_features.tolist() + [target_column]]
            
        except Exception as e:
            logger.error("feature_selection_error", error=str(e))
            raise
            
    async def perform_pca(self, df: pd.DataFrame, n_components: int = 2) -> pd.DataFrame:
        """Perform Principal Component Analysis on the dataset."""
        try:
            numerical_cols = df.select_dtypes(include=[np.number]).columns
            pca = PCA(n_components=n_components)
            pca_result = pca.fit_transform(df[numerical_cols])
            
            # Create DataFrame with PCA results
            pca_df = pd.DataFrame(
                data=pca_result,
                columns=[f'PC{i+1}' for i in range(n_components)]
            )
            
            return pca_df
            
        except Exception as e:
            logger.error("pca_error", error=str(e))
            raise
            
    async def calculate_statistics(self, df: pd.DataFrame) -> Dict:
        """Calculate basic statistics for the dataset."""
        try:
            stats = {
                'summary': df.describe().to_dict(),
                'correlation': df.corr().to_dict(),
                'missing_values': df.isnull().sum().to_dict(),
                'data_types': df.dtypes.astype(str).to_dict()
            }
            return stats
            
        except Exception as e:
            logger.error("statistics_calculation_error", error=str(e))
            raise 