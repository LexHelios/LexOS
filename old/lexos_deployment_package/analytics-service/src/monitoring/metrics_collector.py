import logging
import time
import psutil
import GPUtil
from typing import Dict, List, Optional
import structlog
from prometheus_client import Counter, Gauge, Histogram, start_http_server
import numpy as np
from datetime import datetime

logger = structlog.get_logger()

class MetricsCollector:
    def __init__(self, config: Dict):
        self.config = config
        self.metrics_port = config.get('monitoring', {}).get('prometheus_port', 9090)
        
        # Initialize Prometheus metrics
        self._init_prometheus_metrics()
        
        # Start Prometheus metrics server
        start_http_server(self.metrics_port)
        
    def _init_prometheus_metrics(self):
        """Initialize Prometheus metrics."""
        # System metrics
        self.cpu_usage = Gauge('cpu_usage_percent', 'CPU usage percentage')
        self.memory_usage = Gauge('memory_usage_bytes', 'Memory usage in bytes')
        self.disk_usage = Gauge('disk_usage_bytes', 'Disk usage in bytes')
        self.gpu_usage = Gauge('gpu_usage_percent', 'GPU usage percentage')
        self.gpu_memory = Gauge('gpu_memory_bytes', 'GPU memory usage in bytes')
        
        # Model metrics
        self.model_predictions = Counter('model_predictions_total',
                                       'Total number of predictions made',
                                       ['model_id'])
        self.prediction_latency = Histogram('prediction_latency_seconds',
                                          'Time taken for predictions',
                                          ['model_id'])
        self.model_accuracy = Gauge('model_accuracy',
                                  'Model accuracy score',
                                  ['model_id'])
        self.model_precision = Gauge('model_precision',
                                   'Model precision score',
                                   ['model_id'])
        self.model_recall = Gauge('model_recall',
                                'Model recall score',
                                ['model_id'])
        self.model_f1 = Gauge('model_f1',
                            'Model F1 score',
                            ['model_id'])
        
        # Data processing metrics
        self.data_processing_time = Histogram('data_processing_seconds',
                                            'Time taken for data processing')
        self.data_size = Gauge('data_size_bytes',
                             'Size of processed data in bytes')
        
    async def collect_system_metrics(self) -> Dict:
        """Collect system-level metrics."""
        try:
            metrics = {
                'timestamp': datetime.now().isoformat(),
                'cpu': {
                    'usage_percent': psutil.cpu_percent(),
                    'count': psutil.cpu_count(),
                    'frequency': psutil.cpu_freq().current if psutil.cpu_freq() else None
                },
                'memory': {
                    'total': psutil.virtual_memory().total,
                    'available': psutil.virtual_memory().available,
                    'used': psutil.virtual_memory().used,
                    'percent': psutil.virtual_memory().percent
                },
                'disk': {
                    'total': psutil.disk_usage('/').total,
                    'used': psutil.disk_usage('/').used,
                    'free': psutil.disk_usage('/').free,
                    'percent': psutil.disk_usage('/').percent
                }
            }
            
            # Update Prometheus metrics
            self.cpu_usage.set(metrics['cpu']['usage_percent'])
            self.memory_usage.set(metrics['memory']['used'])
            self.disk_usage.set(metrics['disk']['used'])
            
            # Collect GPU metrics if available
            try:
                gpus = GPUtil.getGPUs()
                metrics['gpu'] = []
                for gpu in gpus:
                    gpu_metrics = {
                        'id': gpu.id,
                        'name': gpu.name,
                        'load': gpu.load * 100,
                        'memory_total': gpu.memoryTotal,
                        'memory_used': gpu.memoryUsed,
                        'temperature': gpu.temperature
                    }
                    metrics['gpu'].append(gpu_metrics)
                    
                    # Update Prometheus metrics
                    self.gpu_usage.labels(gpu_id=gpu.id).set(gpu_metrics['load'])
                    self.gpu_memory.labels(gpu_id=gpu.id).set(gpu_metrics['memory_used'])
                    
            except Exception as e:
                logger.warning("gpu_metrics_collection_error", error=str(e))
                
            return metrics
            
        except Exception as e:
            logger.error("system_metrics_collection_error", error=str(e))
            raise
            
    async def record_model_metrics(self,
                                 model_id: str,
                                 metrics: Dict,
                                 latency: float) -> None:
        """Record model performance metrics."""
        try:
            # Update Prometheus metrics
            self.model_predictions.labels(model_id=model_id).inc()
            self.prediction_latency.labels(model_id=model_id).observe(latency)
            
            if 'accuracy' in metrics:
                self.model_accuracy.labels(model_id=model_id).set(metrics['accuracy'])
            if 'precision' in metrics:
                self.model_precision.labels(model_id=model_id).set(metrics['precision'])
            if 'recall' in metrics:
                self.model_recall.labels(model_id=model_id).set(metrics['recall'])
            if 'f1' in metrics:
                self.model_f1.labels(model_id=model_id).set(metrics['f1'])
                
        except Exception as e:
            logger.error("model_metrics_recording_error",
                        error=str(e),
                        model_id=model_id)
            raise
            
    async def record_data_metrics(self,
                                data_size: int,
                                processing_time: float) -> None:
        """Record data processing metrics."""
        try:
            # Update Prometheus metrics
            self.data_processing_time.observe(processing_time)
            self.data_size.set(data_size)
            
        except Exception as e:
            logger.error("data_metrics_recording_error", error=str(e))
            raise
            
    async def get_metrics_summary(self) -> Dict:
        """Get a summary of all collected metrics."""
        try:
            system_metrics = await self.collect_system_metrics()
            
            summary = {
                'timestamp': datetime.now().isoformat(),
                'system': system_metrics,
                'models': {},
                'data_processing': {
                    'total_processed': self.data_size._value.get(),
                    'avg_processing_time': self.data_processing_time._sum.get() / 
                                         max(self.data_processing_time._count.get(), 1)
                }
            }
            
            return summary
            
        except Exception as e:
            logger.error("metrics_summary_error", error=str(e))
            raise 