import asyncio
import json
import logging
from typing import Dict, Set
import websockets
from websockets.exceptions import ConnectionClosed
import redis.asyncio as redis
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Redis connection
redis_client = redis.Redis(host='localhost', port=6379, db=0)

# Store active connections
active_connections: Set[websockets.WebSocketServerProtocol] = set()

async def register(websocket: websockets.WebSocketServerProtocol):
    """Register a new WebSocket connection."""
    active_connections.add(websocket)
    logger.info(f"New connection registered. Total connections: {len(active_connections)}")

async def unregister(websocket: websockets.WebSocketServerProtocol):
    """Unregister a WebSocket connection."""
    active_connections.remove(websocket)
    logger.info(f"Connection unregistered. Total connections: {len(active_connections)}")

async def broadcast(message: str):
    """Broadcast a message to all connected clients."""
    if active_connections:
        await asyncio.gather(
            *[connection.send(message) for connection in active_connections]
        )

async def handle_message(websocket: websockets.WebSocketServerProtocol, message: str):
    """Handle incoming WebSocket messages."""
    try:
        data = json.loads(message)
        message_type = data.get('type')
        content = data.get('content')

        if message_type == 'consciousness_state':
            # Store state in Redis
            await redis_client.set(
                f"consciousness_state:{datetime.utcnow().isoformat()}",
                json.dumps(content)
            )
            # Broadcast to all clients
            await broadcast(json.dumps({
                'type': 'consciousness_state_update',
                'content': content,
                'timestamp': datetime.utcnow().isoformat()
            }))

        elif message_type == 'reasoning_request':
            # Process reasoning request
            response = {
                'type': 'reasoning_response',
                'content': {
                    'request_id': content.get('request_id'),
                    'result': 'Processing reasoning request...'
                },
                'timestamp': datetime.utcnow().isoformat()
            }
            await websocket.send(json.dumps(response))

        elif message_type == 'environmental_interaction':
            # Handle environmental interaction
            response = {
                'type': 'interaction_response',
                'content': {
                    'interaction_id': content.get('interaction_id'),
                    'status': 'Processing interaction...'
                },
                'timestamp': datetime.utcnow().isoformat()
            }
            await websocket.send(json.dumps(response))

        else:
            # Unknown message type
            await websocket.send(json.dumps({
                'type': 'error',
                'content': f'Unknown message type: {message_type}',
                'timestamp': datetime.utcnow().isoformat()
            }))

    except json.JSONDecodeError:
        logger.error(f"Invalid JSON message received: {message}")
        await websocket.send(json.dumps({
            'type': 'error',
            'content': 'Invalid JSON message',
            'timestamp': datetime.utcnow().isoformat()
        }))
    except Exception as e:
        logger.error(f"Error handling message: {str(e)}")
        await websocket.send(json.dumps({
            'type': 'error',
            'content': f'Error processing message: {str(e)}',
            'timestamp': datetime.utcnow().isoformat()
        }))

async def websocket_handler(websocket: websockets.WebSocketServerProtocol, path: str):
    """Main WebSocket handler function."""
    await register(websocket)
    try:
        async for message in websocket:
            await handle_message(websocket, message)
    except ConnectionClosed:
        logger.info("Connection closed")
    finally:
        await unregister(websocket)

async def main():
    """Start the WebSocket server."""
    server = await websockets.serve(
        websocket_handler,
        "localhost",
        8080,
        ping_interval=20,
        ping_timeout=20
    )
    logger.info("WebSocket server started on ws://localhost:8080")
    await server.wait_closed()

if __name__ == "__main__":
    asyncio.run(main()) 