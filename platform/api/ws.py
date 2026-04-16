import asyncio
import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import redis

router = APIRouter(tags=["websockets"])

logger = logging.getLogger("WS")

# Redis for metrics polling
REDIS_HOST = "redis"
REDIS_PORT = 6379
r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                # Handle stale connections
                pass

manager = ConnectionManager()

from platform.scheduler.state import get_active_nodes

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            queue_size = r.llen("job_queue")
            active_jobs = r.get("active_jobs_count") or 0
            nodes = get_active_nodes()
            
            data = {
                "type": "metrics_update",
                "queue_size": int(queue_size),
                "active_jobs": int(active_jobs),
                "nodes": nodes,
                "timestamp": asyncio.get_event_loop().time()
            }
            
            await websocket.send_json(data)
            await asyncio.sleep(2) # Push update every 2 seconds
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info("WebSocket disconnected")
    except Exception as e:
        logger.error(f"WS Error: {str(e)}")
        manager.disconnect(websocket)
