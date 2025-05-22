#!/usr/bin/env python3
import os
import sys
import json
import logging
import asyncio
import aiohttp
import psutil
import pynvml
from datetime import datetime
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from prometheus_client import Counter, Gauge, Histogram, start_http_server

# Configure logging
logging.basicConfig(
    level=os.getenv('LOG_LEVEL', 'INFO'),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@dataclass
class AgentMetrics:
    """Base metrics for all agents"""
    # System metrics
    cpu_usage = Gauge('agent_cpu_usage', 'CPU usage percentage')
    memory_usage = Gauge('agent_memory_usage', 'Memory usage in bytes')
    disk_usage = Gauge('agent_disk_usage', 'Disk usage in bytes')
    
    # GPU metrics
    gpu_utilization = Gauge('agent_gpu_utilization', 'GPU utilization percentage', ['device_id'])
    gpu_memory_used = Gauge('agent_gpu_memory_used', 'GPU memory used in bytes', ['device_id'])
    gpu_temperature = Gauge('agent_gpu_temperature', 'GPU temperature in Celsius', ['device_id'])
    
    # Performance metrics
    task_duration = Histogram('agent_task_duration', 'Task duration in seconds', ['task_type'])
    task_errors = Counter('agent_task_errors', 'Number of task errors', ['task_type'])
    task_success = Counter('agent_task_success', 'Number of successful tasks', ['task_type'])
    
    # API metrics
    api_latency = Histogram('agent_api_latency', 'API request latency in seconds', ['endpoint'])
    api_errors = Counter('agent_api_errors', 'Number of API errors', ['endpoint'])
    api_requests = Counter('agent_api_requests', 'Number of API requests', ['endpoint', 'method'])

class BaseAgent:
    def __init__(self, agent_type: str):
        self.agent_type = agent_type
        self.metrics = AgentMetrics()
        self.session: Optional[aiohttp.ClientSession] = None
        self.is_running = False
        self.tasks: List[asyncio.Task] = []
        
        # Initialize NVIDIA management library
        try:
            pynvml.nvmlInit()
            self.has_gpu = True
        except:
            self.has_gpu = False
            logger.warning("No NVIDIA GPU detected")

    async def start(self):
        """Start the agent and its monitoring"""
        self.is_running = True
        self.session = aiohttp.ClientSession()
        
        # Start Prometheus metrics server
        if os.getenv('PROMETHEUS_METRICS', 'false').lower() == 'true':
            start_http_server(8000)
        
        # Start monitoring tasks
        self.tasks.extend([
            asyncio.create_task(self._monitor_system()),
            asyncio.create_task(self._monitor_gpu()),
            asyncio.create_task(self._heartbeat())
        ])
        
        logger.info(f"{self.agent_type} agent started")

    async def stop(self):
        """Stop the agent and cleanup resources"""
        self.is_running = False
        
        # Cancel all tasks
        for task in self.tasks:
            task.cancel()
        
        # Close HTTP session
        if self.session:
            await self.session.close()
        
        logger.info(f"{self.agent_type} agent stopped")

    async def _monitor_system(self):
        """Monitor system resources"""
        while self.is_running:
            try:
                # CPU usage
                cpu_percent = psutil.cpu_percent(interval=1)
                self.metrics.cpu_usage.set(cpu_percent)
                
                # Memory usage
                memory = psutil.virtual_memory()
                self.metrics.memory_usage.set(memory.used)
                
                # Disk usage
                disk = psutil.disk_usage('/')
                self.metrics.disk_usage.set(disk.used)
                
                await asyncio.sleep(15)  # Update every 15 seconds
            except Exception as e:
                logger.error(f"Error monitoring system: {str(e)}")
                await asyncio.sleep(60)  # Wait longer on error

    async def _monitor_gpu(self):
        """Monitor GPU resources"""
        if not self.has_gpu:
            return
            
        while self.is_running:
            try:
                device_count = pynvml.nvmlDeviceGetCount()
                for i in range(device_count):
                    handle = pynvml.nvmlDeviceGetHandleByIndex(i)
                    
                    # GPU utilization
                    utilization = pynvml.nvmlDeviceGetUtilizationRates(handle)
                    self.metrics.gpu_utilization.labels(device_id=i).set(utilization.gpu)
                    
                    # GPU memory
                    memory = pynvml.nvmlDeviceGetMemoryInfo(handle)
                    self.metrics.gpu_memory_used.labels(device_id=i).set(memory.used)
                    
                    # GPU temperature
                    temp = pynvml.nvmlDeviceGetTemperature(handle, pynvml.NVML_TEMPERATURE_GPU)
                    self.metrics.gpu_temperature.labels(device_id=i).set(temp)
                
                await asyncio.sleep(15)  # Update every 15 seconds
            except Exception as e:
                logger.error(f"Error monitoring GPU: {str(e)}")
                await asyncio.sleep(60)  # Wait longer on error

    async def _heartbeat(self):
        """Send heartbeat to monitoring system"""
        while self.is_running:
            try:
                if self.session:
                    async with self.session.post(
                        f"{os.getenv('API_HOST')}/api/v1/agents/heartbeat",
                        json={
                            "agent_type": self.agent_type,
                            "timestamp": datetime.utcnow().isoformat(),
                            "status": "healthy"
                        }
                    ) as response:
                        if response.status != 200:
                            logger.warning(f"Heartbeat failed: {response.status}")
                
                await asyncio.sleep(30)  # Send heartbeat every 30 seconds
            except Exception as e:
                logger.error(f"Error sending heartbeat: {str(e)}")
                await asyncio.sleep(60)  # Wait longer on error

    async def execute_task(self, task_type: str, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a task with metrics tracking"""
        start_time = datetime.utcnow()
        try:
            result = await self._execute_task_impl(task_type, task_data)
            duration = (datetime.utcnow() - start_time).total_seconds()
            
            # Update metrics
            self.metrics.task_duration.labels(task_type=task_type).observe(duration)
            self.metrics.task_success.labels(task_type=task_type).inc()
            
            return result
        except Exception as e:
            # Update error metrics
            self.metrics.task_errors.labels(task_type=task_type).inc()
            raise

    async def _execute_task_impl(self, task_type: str, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Implementation of task execution - to be overridden by subclasses"""
        raise NotImplementedError("Subclasses must implement _execute_task_impl")

    async def make_api_request(self, method: str, endpoint: str, **kwargs) -> Any:
        """Make an API request with metrics tracking"""
        if not self.session:
            raise RuntimeError("Agent not started")
            
        start_time = datetime.utcnow()
        try:
            async with self.session.request(method, endpoint, **kwargs) as response:
                duration = (datetime.utcnow() - start_time).total_seconds()
                
                # Update metrics
                self.metrics.api_latency.labels(endpoint=endpoint).observe(duration)
                self.metrics.api_requests.labels(endpoint=endpoint, method=method).inc()
                
                if response.status >= 400:
                    self.metrics.api_errors.labels(endpoint=endpoint).inc()
                    response.raise_for_status()
                    
                return await response.json()
        except Exception as e:
            self.metrics.api_errors.labels(endpoint=endpoint).inc()
            raise 