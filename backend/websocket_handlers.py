import asyncio
import json
import psutil
import random
from datetime import datetime, timedelta
from typing import Dict, List, Set, Any
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.metrics_history: List[Dict[str, Any]] = []
        self.insights_history: List[Dict[str, Any]] = []
        self.services: Dict[str, Dict[str, Any]] = {
            'api': {
                'id': 'api',
                'name': 'API Gateway',
                'type': 'api',
                'status': 'healthy',
                'metrics': {
                    'latency': 50,
                    'throughput': 1000,
                    'errorRate': 0.1
                },
                'connections': ['auth', 'cache']
            },
            'auth': {
                'id': 'auth',
                'name': 'Auth Service',
                'type': 'api',
                'status': 'healthy',
                'metrics': {
                    'latency': 30,
                    'throughput': 500,
                    'errorRate': 0.05
                },
                'connections': ['database']
            },
            'database': {
                'id': 'database',
                'name': 'Main Database',
                'type': 'database',
                'status': 'healthy',
                'metrics': {
                    'latency': 20,
                    'throughput': 2000,
                    'errorRate': 0.01
                },
                'connections': ['cache']
            },
            'cache': {
                'id': 'cache',
                'name': 'Redis Cache',
                'type': 'cache',
                'status': 'healthy',
                'metrics': {
                    'latency': 5,
                    'throughput': 5000,
                    'errorRate': 0.02
                },
                'connections': ['queue']
            },
            'queue': {
                'id': 'queue',
                'name': 'Message Queue',
                'type': 'queue',
                'status': 'healthy',
                'metrics': {
                    'latency': 10,
                    'throughput': 3000,
                    'errorRate': 0.03
                },
                'connections': []
            }
        }

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

    async def broadcast_metrics(self):
        while True:
            if self.active_connections:
                metrics = {
                    'timestamp': datetime.now().timestamp(),
                    'cpu_usage': psutil.cpu_percent(),
                    'memory_usage': psutil.virtual_memory().percent,
                    'disk_usage': psutil.disk_usage('/').percent,
                    'network_io': {
                        'bytes_sent': psutil.net_io_counters().bytes_sent,
                        'bytes_recv': psutil.net_io_counters().bytes_recv
                    }
                }
                self.metrics_history.append(metrics)
                if len(self.metrics_history) > 100:
                    self.metrics_history.pop(0)
                
                await self.broadcast(json.dumps({
                    'type': 'metrics',
                    'data': self.metrics_history[-10:]  # Send last 10 metrics
                }))
            await asyncio.sleep(1)

    async def broadcast_health(self):
        while True:
            if self.active_connections:
                health = {
                    'status': 'healthy',
                    'timestamp': datetime.now().timestamp(),
                    'services': {
                        service_id: {
                            'status': service['status'],
                            'last_check': datetime.now().timestamp()
                        }
                        for service_id, service in self.services.items()
                    }
                }
                await self.broadcast(json.dumps({
                    'type': 'health',
                    'data': health
                }))
            await asyncio.sleep(5)

    async def broadcast_alerts(self):
        while True:
            if self.active_connections:
                # Simulate random alerts
                if random.random() < 0.1:  # 10% chance of generating an alert
                    alert = {
                        'id': str(random.randint(1000, 9999)),
                        'type': random.choice(['error', 'warning', 'info']),
                        'message': f"Simulated alert {datetime.now().strftime('%H:%M:%S')}",
                        'timestamp': datetime.now().timestamp()
                    }
                    await self.broadcast(json.dumps({
                        'type': 'alerts',
                        'data': [alert]
                    }))
            await asyncio.sleep(10)

    async def broadcast_insights(self):
        while True:
            if self.active_connections:
                # Generate system insights
                if random.random() < 0.05:  # 5% chance of generating an insight
                    insight_types = ['performance', 'security', 'usage']
                    insight = {
                        'type': random.choice(insight_types),
                        'title': f"System {random.choice(['Optimization', 'Security', 'Resource'])} Insight",
                        'description': f"Detected potential {random.choice(['performance', 'security', 'resource'])} improvement opportunity",
                        'severity': random.choice(['low', 'medium', 'high']),
                        'recommendation': f"Consider {random.choice(['optimizing', 'securing', 'scaling'])} the system",
                        'timestamp': datetime.now().timestamp()
                    }
                    self.insights_history.append(insight)
                    if len(self.insights_history) > 10:
                        self.insights_history.pop(0)
                    
                    await self.broadcast(json.dumps({
                        'type': 'insights',
                        'data': insight
                    }))
            await asyncio.sleep(30)

    async def broadcast_services(self):
        while True:
            if self.active_connections:
                # Update service metrics
                for service in self.services.values():
                    service['metrics']['latency'] = max(5, service['metrics']['latency'] + random.uniform(-5, 5))
                    service['metrics']['throughput'] = max(100, service['metrics']['throughput'] + random.uniform(-100, 100))
                    service['metrics']['errorRate'] = max(0, min(5, service['metrics']['errorRate'] + random.uniform(-0.1, 0.1)))
                    
                    # Randomly change service status
                    if random.random() < 0.05:  # 5% chance of status change
                        service['status'] = random.choice(['healthy', 'degraded', 'down'])

                await self.broadcast(json.dumps({
                    'type': 'services',
                    'data': list(self.services.values())
                }))
            await asyncio.sleep(2)

    async def start_broadcasting(self):
        await asyncio.gather(
            self.broadcast_metrics(),
            self.broadcast_health(),
            self.broadcast_alerts(),
            self.broadcast_insights(),
            self.broadcast_services()
        ) 