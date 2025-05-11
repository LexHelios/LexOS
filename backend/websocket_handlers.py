import asyncio
import json
from datetime import datetime
from typing import List, Set, Dict
from fastapi import WebSocket, WebSocketDisconnect
import logging
from prometheus_client import Counter, Gauge
import psutil
from dataclasses import dataclass, asdict

# Metrics
ws_connections = Gauge('websocket_connections', 'Number of active WebSocket connections')
ws_messages = Counter('websocket_messages_total', 'Total WebSocket messages', ['type'])
ws_errors = Counter('websocket_errors_total', 'WebSocket errors', ['type'])
system_cpu_usage = Gauge('system_cpu_usage', 'System CPU usage percentage')
system_memory_usage = Gauge('system_memory_usage', 'System memory usage percentage')
system_disk_usage = Gauge('system_disk_usage', 'System disk usage percentage')

logger = logging.getLogger(__name__)

@dataclass
class SystemMetrics:
    cpu_percent: float
    memory_percent: float
    disk_percent: float
    network_bytes_sent: int
    network_bytes_recv: int
    timestamp: float

    @classmethod
    def collect(cls) -> 'SystemMetrics':
        cpu = psutil.cpu_percent(interval=None)
        memory = psutil.virtual_memory().percent
        disk = psutil.disk_usage('/').percent
        network = psutil.net_io_counters()
        
        system_cpu_usage.set(cpu)
        system_memory_usage.set(memory)
        system_disk_usage.set(disk)
        
        return cls(
            cpu_percent=cpu,
            memory_percent=memory,
            disk_percent=disk,
            network_bytes_sent=network.bytes_sent,
            network_bytes_recv=network.bytes_recv,
            timestamp=datetime.now().timestamp()
        )

class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.connection_info: Dict[WebSocket, Dict] = {}
        self._broadcast_task = None
        self._cleanup_task = None
        self._metrics_task = None

    async def connect(self, websocket: WebSocket):
        try:
            await websocket.accept()
            self.active_connections.add(websocket)
            self.connection_info[websocket] = {
                'connected_at': datetime.now(),
                'last_heartbeat': datetime.now(),
                'messages_received': 0
            }
            ws_connections.inc()
            logger.info(f"New WebSocket connection. Total connections: {len(self.active_connections)}")
            
            # Start metrics collection if not already running
            if not self._metrics_task:
                self._metrics_task = asyncio.create_task(self._collect_metrics())
        except Exception as e:
            logger.error(f"Error accepting WebSocket connection: {str(e)}")
            ws_errors.labels(type='connection').inc()
            raise

    def disconnect(self, websocket: WebSocket):
        try:
            self.active_connections.remove(websocket)
            self.connection_info.pop(websocket, None)
            ws_connections.dec()
            logger.info(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")
            
            # Stop metrics collection if no connections
            if not self.active_connections and self._metrics_task:
                self._metrics_task.cancel()
                self._metrics_task = None
        except Exception as e:
            logger.error(f"Error during WebSocket disconnect: {str(e)}")
            ws_errors.labels(type='disconnect').inc()

    async def _collect_metrics(self):
        last_network_sent = 0
        last_network_recv = 0
        
        while True:
            try:
                metrics = SystemMetrics.collect()
                
                # Calculate network rate
                network_sent_rate = (metrics.network_bytes_sent - last_network_sent) / 1
                network_recv_rate = (metrics.network_bytes_recv - last_network_recv) / 1
                
                last_network_sent = metrics.network_bytes_sent
                last_network_recv = metrics.network_bytes_recv
                
                metrics_data = {
                    **asdict(metrics),
                    'network_send_rate': network_sent_rate,
                    'network_recv_rate': network_recv_rate
                }
                
                await self.broadcast(json.dumps({
                    'type': 'metrics',
                    'data': metrics_data
                }))
                
                await asyncio.sleep(1)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error collecting metrics: {e}")
                await asyncio.sleep(5)

    async def broadcast(self, message: str):
        disconnected = set()
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
                ws_messages.labels(type='broadcast').inc()
            except Exception as e:
                logger.error(f"Error broadcasting message: {str(e)}")
                ws_errors.labels(type='broadcast').inc()
                disconnected.add(connection)
        
        for connection in disconnected:
            self.disconnect(connection)

    async def start_broadcasting(self):
        if self._broadcast_task is None:
            self._broadcast_task = asyncio.create_task(self._broadcast_loop())
            self._cleanup_task = asyncio.create_task(self._cleanup_loop())

    async def _broadcast_loop(self):
        while True:
            try:
                if self.active_connections:
                    status_update = {
                        'type': 'status',
                        'data': {
                            'connections': len(self.active_connections),
                            'timestamp': datetime.now().isoformat()
                        }
                    }
                    await self.broadcast(json.dumps(status_update))
                await asyncio.sleep(30)
            except Exception as e:
                logger.error(f"Error in broadcast loop: {str(e)}")
                ws_errors.labels(type='broadcast_loop').inc()
                await asyncio.sleep(5)  # Back off on error

    async def _cleanup_loop(self):
        while True:
            try:
                now = datetime.now()
                disconnected = set()
                for ws, info in self.connection_info.items():
                    # Remove connections that haven't had a heartbeat in 2 minutes
                    if (now - info['last_heartbeat']).total_seconds() > 120:
                        disconnected.add(ws)
                
                for ws in disconnected:
                    logger.info(f"Removing stale connection")
                    self.disconnect(ws)
                
                await asyncio.sleep(60)
            except Exception as e:
                logger.error(f"Error in cleanup loop: {str(e)}")
                ws_errors.labels(type='cleanup_loop').inc()
                await asyncio.sleep(5)  # Back off on error

    async def handle_message(self, websocket: WebSocket, message: str):
        try:
            data = json.loads(message)
            if data.get('type') == 'heartbeat':
                self.connection_info[websocket]['last_heartbeat'] = datetime.now()
                await websocket.send_text(json.dumps({'type': 'heartbeat_ack'}))
            self.connection_info[websocket]['messages_received'] += 1
            ws_messages.labels(type='received').inc()
        except json.JSONDecodeError:
            logger.error("Invalid JSON message received")
            ws_errors.labels(type='invalid_json').inc()
        except Exception as e:
            logger.error(f"Error handling message: {str(e)}")
            ws_errors.labels(type='message_handling').inc() 