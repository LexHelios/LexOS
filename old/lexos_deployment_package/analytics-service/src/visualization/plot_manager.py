import logging
import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Union
import matplotlib.pyplot as plt
import seaborn as sns
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import structlog
import io
import base64
from datetime import datetime

logger = structlog.get_logger()

class PlotManager:
    def __init__(self, config: Dict):
        self.config = config
        self.style_config = config.get('visualization', {}).get('style', {})
        self._set_style()
        
    def _set_style(self):
        """Set the visualization style based on configuration."""
        try:
            # Set matplotlib style
            plt.style.use(self.style_config.get('matplotlib_style', 'seaborn'))
            
            # Set seaborn style
            sns.set_style(self.style_config.get('seaborn_style', 'whitegrid'))
            
            # Set color palette
            self.color_palette = self.style_config.get('color_palette', 'viridis')
            sns.set_palette(self.color_palette)
            
        except Exception as e:
            logger.error("style_setting_error", error=str(e))
            raise
            
    async def create_data_visualization(self,
                                      data: pd.DataFrame,
                                      plot_type: str,
                                      **kwargs) -> Dict:
        """
        Create a data visualization.
        
        Args:
            data: Input DataFrame
            plot_type: Type of plot to create
            **kwargs: Additional plot parameters
            
        Returns:
            Dictionary containing plot data and metadata
        """
        try:
            if plot_type == 'scatter':
                plot_data = await self._create_scatter_plot(data, **kwargs)
            elif plot_type == 'line':
                plot_data = await self._create_line_plot(data, **kwargs)
            elif plot_type == 'bar':
                plot_data = await self._create_bar_plot(data, **kwargs)
            elif plot_type == 'histogram':
                plot_data = await self._create_histogram(data, **kwargs)
            elif plot_type == 'box':
                plot_data = await self._create_box_plot(data, **kwargs)
            elif plot_type == 'correlation':
                plot_data = await self._create_correlation_plot(data, **kwargs)
            else:
                raise ValueError(f"Unsupported plot type: {plot_type}")
                
            return plot_data
            
        except Exception as e:
            logger.error("visualization_creation_error",
                        error=str(e),
                        plot_type=plot_type)
            raise
            
    async def _create_scatter_plot(self,
                                 data: pd.DataFrame,
                                 x: str,
                                 y: str,
                                 color: Optional[str] = None,
                                 size: Optional[str] = None,
                                 title: Optional[str] = None) -> Dict:
        """Create a scatter plot."""
        try:
            fig = px.scatter(data,
                           x=x,
                           y=y,
                           color=color,
                           size=size,
                           title=title or f"{y} vs {x}")
                           
            return await self._process_plotly_figure(fig)
            
        except Exception as e:
            logger.error("scatter_plot_error", error=str(e))
            raise
            
    async def _create_line_plot(self,
                              data: pd.DataFrame,
                              x: str,
                              y: str,
                              color: Optional[str] = None,
                              title: Optional[str] = None) -> Dict:
        """Create a line plot."""
        try:
            fig = px.line(data,
                         x=x,
                         y=y,
                         color=color,
                         title=title or f"{y} over {x}")
                         
            return await self._process_plotly_figure(fig)
            
        except Exception as e:
            logger.error("line_plot_error", error=str(e))
            raise
            
    async def _create_bar_plot(self,
                             data: pd.DataFrame,
                             x: str,
                             y: str,
                             color: Optional[str] = None,
                             title: Optional[str] = None) -> Dict:
        """Create a bar plot."""
        try:
            fig = px.bar(data,
                        x=x,
                        y=y,
                        color=color,
                        title=title or f"{y} by {x}")
                        
            return await self._process_plotly_figure(fig)
            
        except Exception as e:
            logger.error("bar_plot_error", error=str(e))
            raise
            
    async def _create_histogram(self,
                              data: pd.DataFrame,
                              column: str,
                              bins: int = 30,
                              title: Optional[str] = None) -> Dict:
        """Create a histogram."""
        try:
            fig = px.histogram(data,
                             x=column,
                             nbins=bins,
                             title=title or f"Distribution of {column}")
                             
            return await self._process_plotly_figure(fig)
            
        except Exception as e:
            logger.error("histogram_error", error=str(e))
            raise
            
    async def _create_box_plot(self,
                             data: pd.DataFrame,
                             x: str,
                             y: str,
                             color: Optional[str] = None,
                             title: Optional[str] = None) -> Dict:
        """Create a box plot."""
        try:
            fig = px.box(data,
                        x=x,
                        y=y,
                        color=color,
                        title=title or f"Box plot of {y} by {x}")
                        
            return await self._process_plotly_figure(fig)
            
        except Exception as e:
            logger.error("box_plot_error", error=str(e))
            raise
            
    async def _create_correlation_plot(self,
                                     data: pd.DataFrame,
                                     title: Optional[str] = None) -> Dict:
        """Create a correlation heatmap."""
        try:
            corr_matrix = data.corr()
            
            fig = px.imshow(corr_matrix,
                          title=title or "Correlation Matrix",
                          color_continuous_scale='RdBu')
                          
            return await self._process_plotly_figure(fig)
            
        except Exception as e:
            logger.error("correlation_plot_error", error=str(e))
            raise
            
    async def _process_plotly_figure(self, fig: go.Figure) -> Dict:
        """Process a Plotly figure and convert it to a format suitable for storage/transmission."""
        try:
            # Update layout
            fig.update_layout(
                template=self.style_config.get('plotly_template', 'plotly_white'),
                font=dict(
                    family=self.style_config.get('font_family', 'Arial'),
                    size=self.style_config.get('font_size', 12)
                )
            )
            
            # Convert to JSON
            plot_json = fig.to_json()
            
            # Create thumbnail
            img_bytes = fig.to_image(format="png")
            thumbnail = base64.b64encode(img_bytes).decode()
            
            return {
                'plot_data': plot_json,
                'thumbnail': thumbnail,
                'created_at': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error("plot_processing_error", error=str(e))
            raise
            
    async def create_model_visualization(self,
                                       model_results: Dict,
                                       plot_type: str,
                                       **kwargs) -> Dict:
        """
        Create a visualization of model results.
        
        Args:
            model_results: Dictionary containing model results
            plot_type: Type of plot to create
            **kwargs: Additional plot parameters
            
        Returns:
            Dictionary containing plot data and metadata
        """
        try:
            if plot_type == 'confusion_matrix':
                plot_data = await self._create_confusion_matrix(model_results, **kwargs)
            elif plot_type == 'roc_curve':
                plot_data = await self._create_roc_curve(model_results, **kwargs)
            elif plot_type == 'feature_importance':
                plot_data = await self._create_feature_importance_plot(model_results, **kwargs)
            elif plot_type == 'learning_curve':
                plot_data = await self._create_learning_curve(model_results, **kwargs)
            else:
                raise ValueError(f"Unsupported model plot type: {plot_type}")
                
            return plot_data
            
        except Exception as e:
            logger.error("model_visualization_error",
                        error=str(e),
                        plot_type=plot_type)
            raise
            
    async def _create_confusion_matrix(self,
                                     model_results: Dict,
                                     title: Optional[str] = None) -> Dict:
        """Create a confusion matrix plot."""
        try:
            cm = model_results['confusion_matrix']
            fig = px.imshow(cm,
                          labels=dict(x="Predicted", y="Actual"),
                          title=title or "Confusion Matrix",
                          color_continuous_scale='Blues')
                          
            return await self._process_plotly_figure(fig)
            
        except Exception as e:
            logger.error("confusion_matrix_error", error=str(e))
            raise
            
    async def _create_roc_curve(self,
                              model_results: Dict,
                              title: Optional[str] = None) -> Dict:
        """Create an ROC curve plot."""
        try:
            fpr = model_results['fpr']
            tpr = model_results['tpr']
            auc = model_results['auc']
            
            fig = go.Figure()
            fig.add_trace(go.Scatter(x=fpr, y=tpr,
                                   name=f'ROC curve (AUC = {auc:.2f})'))
            fig.add_trace(go.Scatter(x=[0, 1], y=[0, 1],
                                   name='Random',
                                   line=dict(dash='dash')))
                                   
            fig.update_layout(
                title=title or "ROC Curve",
                xaxis_title="False Positive Rate",
                yaxis_title="True Positive Rate"
            )
            
            return await self._process_plotly_figure(fig)
            
        except Exception as e:
            logger.error("roc_curve_error", error=str(e))
            raise
            
    async def _create_feature_importance_plot(self,
                                            model_results: Dict,
                                            title: Optional[str] = None) -> Dict:
        """Create a feature importance plot."""
        try:
            importance = model_results['feature_importance']
            features = list(importance.keys())
            values = list(importance.values())
            
            fig = px.bar(x=values,
                        y=features,
                        orientation='h',
                        title=title or "Feature Importance")
                        
            return await self._process_plotly_figure(fig)
            
        except Exception as e:
            logger.error("feature_importance_plot_error", error=str(e))
            raise
            
    async def _create_learning_curve(self,
                                   model_results: Dict,
                                   title: Optional[str] = None) -> Dict:
        """Create a learning curve plot."""
        try:
            train_sizes = model_results['train_sizes']
            train_scores = model_results['train_scores']
            test_scores = model_results['test_scores']
            
            fig = go.Figure()
            fig.add_trace(go.Scatter(x=train_sizes,
                                   y=train_scores,
                                   name='Training score'))
            fig.add_trace(go.Scatter(x=train_sizes,
                                   y=test_scores,
                                   name='Cross-validation score'))
                                   
            fig.update_layout(
                title=title or "Learning Curve",
                xaxis_title="Training examples",
                yaxis_title="Score"
            )
            
            return await self._process_plotly_figure(fig)
            
        except Exception as e:
            logger.error("learning_curve_error", error=str(e))
            raise 