import asyncio
import websockets
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_websocket():
    uri = "ws://localhost:3000/ws"
    try:
        async with websockets.connect(uri) as websocket:
            logger.info("Connected to WebSocket server")
            
            # Send a test message
            test_message = "Hello from test client!"
            await websocket.send(test_message)
            logger.info(f"Sent message: {test_message}")
            
            # Wait for response
            response = await websocket.recv()
            logger.info(f"Received response: {response}")
            
            # Wait for system status message
            status = await websocket.recv()
            logger.info(f"Received status: {status}")
            
    except Exception as e:
        logger.error(f"WebSocket test failed: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_websocket()) 