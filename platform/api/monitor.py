from fastapi import APIRouter, Depends
import redis
import json

router = APIRouter(prefix="/api/monitor", tags=["monitoring"])

# Note: In production, use the same redis connection pool
REDIS_HOST = "redis"
REDIS_PORT = 6379
r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)

from platform.scheduler.state import get_active_nodes

@router.get("/metrics")
def get_metrics():
    """
    Returns high-level cluster metrics for the dashboard.
    """
    try:
        queue_size = r.llen("job_queue")
        active_jobs = r.get("active_jobs_count") or 0
        
        nodes = get_active_nodes()
        
        return {
            "queue_size": int(queue_size),
            "active_jobs": int(active_jobs),
            "nodes": nodes,
            "status": "healthy"
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.get("/cost")
def get_cost_estimate():
    """
    Simulated cost tracking metrics.
    """
    # In a real system, you'd calculate this based on cloud instance runtimes
    total_spend = float(r.get("total_cloud_spend") or 0.0)
    return {
        "monthly_estimate": total_spend * 30,
        "total_spend": total_spend,
        "currency": "USD"
    }
