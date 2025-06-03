#!/usr/bin/env python3
import os
import sys
import json
import logging
import time
import threading
from datetime import datetime
from typing import Dict, Any, Tuple, List
from dataclasses import dataclass, asdict
from prometheus_client import start_http_server, Gauge, Counter, Histogram

# Configure logging
logging.basicConfig(
    level=os.getenv('LOG_LEVEL', 'INFO'),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Prometheus metrics
GPU_UTILIZATION = Gauge('gpu_utilization', 'GPU utilization percentage', ['device_id'])
GPU_MEMORY_USED = Gauge('gpu_memory_used', 'GPU memory used in MB', ['device_id'])
GPU_MEMORY_TOTAL = Gauge('gpu_memory_total', 'Total GPU memory in MB', ['device_id'])
GPU_TEMPERATURE = Gauge('gpu_temperature', 'GPU temperature in Celsius', ['device_id'])
MEMORY_USED = Gauge('memory_used', 'System memory used in MB')
MEMORY_TOTAL = Gauge('memory_total', 'Total system memory in MB')
DISK_USED = Gauge('disk_used', 'Disk space used in MB')
DISK_TOTAL = Gauge('disk_total', 'Total disk space in MB')
NETWORK_LATENCY = Histogram('network_latency', 'Network latency in seconds')
HEALTH_CHECK_DURATION = Histogram('health_check_duration', 'Duration of health checks in seconds')
HEALTH_CHECK_ERRORS = Counter('health_check_errors', 'Number of health check errors', ['check_name'])

@dataclass
class HealthCheckResult:
    status: str
    message: Any
    timestamp: str
    duration: float

class HealthChecker:
    def __init__(self):
        self.results: Dict[str, HealthCheckResult] = {}
        self.start_time = time.time()

    def check_gpu(self) -> Tuple[bool, str]:
        """Check if GPU is accessible and working."""
        try:
            import torch
            import pynvml
            pynvml.nvmlInit()
            
            if torch.cuda.is_available():
                device_count = torch.cuda.device_count()
                if device_count > 0:
                    gpu_info = []
                    for i in range(device_count):
                        handle = pynvml.nvmlDeviceGetHandleByIndex(i)
                        info = pynvml.nvmlDeviceGetMemoryInfo(handle)
                        utilization = pynvml.nvmlDeviceGetUtilizationRates(handle)
                        temp = pynvml.nvmlDeviceGetTemperature(handle, pynvml.NVML_TEMPERATURE_GPU)
                        
                        # Update Prometheus metrics
                        GPU_UTILIZATION.labels(device_id=i).set(utilization.gpu)
                        GPU_MEMORY_USED.labels(device_id=i).set(info.used / 1024 / 1024)
                        GPU_MEMORY_TOTAL.labels(device_id=i).set(info.total / 1024 / 1024)
                        GPU_TEMPERATURE.labels(device_id=i).set(temp)
                        
                        gpu_info.append({
                            "device_id": i,
                            "name": pynvml.nvmlDeviceGetName(handle).decode('utf-8'),
                            "memory_used": info.used / 1024 / 1024,
                            "memory_total": info.total / 1024 / 1024,
                            "utilization": utilization.gpu,
                            "temperature": temp
                        })
                    return True, gpu_info
            return False, "No GPU available"
        except Exception as e:
            HEALTH_CHECK_ERRORS.labels(check_name='gpu').inc()
            return False, f"GPU check failed: {str(e)}"

    def check_memory(self) -> Tuple[bool, Dict[str, Any]]:
        """Check system memory usage."""
        try:
            import psutil
            memory = psutil.virtual_memory()
            swap = psutil.swap_memory()
            
            # Update Prometheus metrics
            MEMORY_USED.set(memory.used / 1024 / 1024)
            MEMORY_TOTAL.set(memory.total / 1024 / 1024)
            
            return True, {
                "total": memory.total,
                "available": memory.available,
                "used": memory.used,
                "percent": memory.percent,
                "swap_total": swap.total,
                "swap_used": swap.used,
                "swap_percent": swap.percent
            }
        except Exception as e:
            HEALTH_CHECK_ERRORS.labels(check_name='memory').inc()
            return False, f"Memory check failed: {str(e)}"

    def check_disk(self) -> Tuple[bool, Dict[str, Any]]:
        """Check disk space and I/O."""
        try:
            import psutil
            disk = psutil.disk_usage('/')
            io = psutil.disk_io_counters()
            
            # Update Prometheus metrics
            DISK_USED.set(disk.used / 1024 / 1024)
            DISK_TOTAL.set(disk.total / 1024 / 1024)
            
            return True, {
                "total": disk.total,
                "free": disk.free,
                "used": disk.used,
                "percent": disk.percent,
                "read_bytes": io.read_bytes,
                "write_bytes": io.write_bytes,
                "read_count": io.read_count,
                "write_count": io.write_count
            }
        except Exception as e:
            HEALTH_CHECK_ERRORS.labels(check_name='disk').inc()
            return False, f"Disk check failed: {str(e)}"

    def check_network(self) -> Tuple[bool, Dict[str, Any]]:
        """Check network connectivity and performance."""
        try:
            import socket
            import requests
            import time
            
            # Check DNS resolution
            start_time = time.time()
            socket.gethostbyname('8.8.8.8')
            dns_time = time.time() - start_time
            
            # Check HTTP connectivity
            start_time = time.time()
            response = requests.get('https://www.google.com', timeout=5)
            http_time = time.time() - start_time
            
            # Update Prometheus metrics
            NETWORK_LATENCY.observe(http_time)
            
            return True, {
                "dns_resolution_time": dns_time,
                "http_response_time": http_time,
                "http_status": response.status_code,
                "http_headers": dict(response.headers)
            }
        except Exception as e:
            HEALTH_CHECK_ERRORS.labels(check_name='network').inc()
            return False, f"Network check failed: {str(e)}"

    def check_process(self) -> Tuple[bool, Dict[str, Any]]:
        """Check process status and resource usage."""
        try:
            import psutil
            process = psutil.Process()
            
            return True, {
                "cpu_percent": process.cpu_percent(),
                "memory_percent": process.memory_percent(),
                "num_threads": process.num_threads(),
                "num_fds": process.num_fds() if hasattr(process, 'num_fds') else None,
                "create_time": process.create_time(),
                "status": process.status()
            }
        except Exception as e:
            HEALTH_CHECK_ERRORS.labels(check_name='process').inc()
            return False, f"Process check failed: {str(e)}"

    def run_checks(self) -> Dict[str, Any]:
        """Run all health checks and collect results."""
        health_status = {
            "timestamp": datetime.utcnow().isoformat(),
            "status": "healthy",
            "checks": {},
            "duration": 0
        }

        checks = {
            "gpu": self.check_gpu,
            "memory": self.check_memory,
            "disk": self.check_disk,
            "network": self.check_network,
            "process": self.check_process
        }

        for check_name, check_func in checks.items():
            try:
                start_time = time.time()
                success, result = check_func()
                duration = time.time() - start_time
                
                HEALTH_CHECK_DURATION.labels(check_name=check_name).observe(duration)
                
                self.results[check_name] = HealthCheckResult(
                    status="ok" if success else "error",
                    message=result,
                    timestamp=datetime.utcnow().isoformat(),
                    duration=duration
                )
                
                health_status["checks"][check_name] = asdict(self.results[check_name])
                
                if not success:
                    health_status["status"] = "unhealthy"
            except Exception as e:
                HEALTH_CHECK_ERRORS.labels(check_name=check_name).inc()
                health_status["checks"][check_name] = {
                    "status": "error",
                    "message": f"Check failed: {str(e)}",
                    "timestamp": datetime.utcnow().isoformat(),
                    "duration": 0
                }
                health_status["status"] = "unhealthy"

        health_status["duration"] = time.time() - self.start_time
        return health_status

def start_prometheus_server():
    """Start Prometheus metrics server."""
    start_http_server(8000)

def main():
    """Main health check function."""
    # Start Prometheus metrics server in a separate thread
    if os.getenv('PROMETHEUS_METRICS', 'false').lower() == 'true':
        prometheus_thread = threading.Thread(target=start_prometheus_server)
        prometheus_thread.daemon = True
        prometheus_thread.start()

    checker = HealthChecker()
    health_status = checker.run_checks()

    # Output results
    print(json.dumps(health_status, indent=2))
    sys.exit(0 if health_status["status"] == "healthy" else 1)

if __name__ == "__main__":
    main() 