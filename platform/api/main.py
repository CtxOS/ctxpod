import uuid
import json
import logging
import time
from typing import Dict, Any
from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends, Request
from pydantic import BaseModel
import redis
from sqlalchemy.orm import Session

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from platform.api.db import init_db, get_db, JobRecord
from platform.api.monitor import router as monitor_router
from platform.api.ws import router as ws_router
from platform.api.auth import get_api_key

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="KhulnaSoft AI Compute Grid API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.on_event("startup")
def on_startup():
    init_db()

# Include Routers
app.include_router(monitor_router)
app.include_router(ws_router)

# Redis configuration
REDIS_HOST = "redis"
REDIS_PORT = 6379
r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)

class JobPayload(BaseModel):
    task_type: str
    params: Dict[str, Any]
    priority: int = 0
    resources: Dict[str, Any] = {}

@app.get("/health")
def health_check():
    try:
        r.ping()
        return {"status": "healthy", "redis": "connected"}
    except Exception as e:
        return {"status": "degraded", "redis": str(e)}

@app.post("/submit")
@limiter.limit("10/minute")
async def submit_job(
    request: Request, 
    payload: JobPayload, 
    user_scope: str = Depends(get_api_key),
    db: Session = Depends(get_db)
):
    job_id = str(uuid.uuid4())
    job_data = {
        "id": job_id,
        "task_type": payload.task_type,
        "params": payload.params,
        "priority": payload.priority,
        "resources_requested": payload.resources,
        "status": "queued",
        "created_at": time.time(),
        "user_scope": user_scope,
        "retries": 0
    }
    
    try:
        # 1. Persistent Storage (PostgreSQL/SQLite)
        db_job = JobRecord(
            id=job_id,
            task_type=payload.task_type,
            status="queued",
            priority=payload.priority,
            params=payload.params,
            user_scope=user_scope
        )
        db.add(db_job)
        db.commit()

        # 2. Real-time Queue (Redis)
        # Determine priority queue
        queue_name = "job_queue"
        if payload.priority > 5:
            queue_name = "high_priority_queue"
        elif payload.priority < 0:
            queue_name = "low_priority_queue"

        r.lpush(queue_name, json.dumps(job_data))
        r.set(f"job:{job_id}", json.dumps(job_data))
        
        logger.info(f"Job {job_id} submitted by {user_scope} to {queue_name}")
        return {"job_id": job_id, "status": "queued", "scope": user_scope}
        
    except Exception as e:
        logger.error(f"Failed to submit job {job_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.get("/job/{job_id}")
def get_job_status(job_id: str):
    job_data = r.get(f"job:{job_id}")
    if not job_data:
        raise HTTPException(status_code=404, detail="Job not found")
    return json.loads(job_data)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
