import json
import time
import logging
import redis
import uuid

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("JobLifecycle")

r = redis.Redis(host="redis", port=6379, decode_responses=True)

MAX_RETRIES = 3

def transition_job(job_id, new_status, metadata=None):
    """
    State machine for job lifecycle.
    Statuses: queued, pending, running, completed, failed
    """
    job_key = f"job:{job_id}"
    job_str = r.get(job_key)
    
    if not job_str:
        logger.error(f"Job {job_id} not found in store.")
        return False
        
    job_data = json.loads(job_str)
    old_status = job_data.get("status")
    
    job_data["status"] = new_status
    job_data["updated_at"] = time.time()
    
    if metadata:
        job_data.update(metadata)
        
    r.set(job_key, json.dumps(job_data))
    logger.info(f"Job {job_id} transitioned: {old_status} -> {new_status}")
    
    # Push event to Redis PubSub for real-time dashboard updates
    r.publish("job_events", json.dumps({"job_id": job_id, "status": new_status}))
    return True

def fail_job(job_id, reason):
    """
    Handles job failure with optional retry logic.
    """
    job_key = f"job:{job_id}"
    job_data = json.loads(r.get(job_key))
    
    retries = job_data.get("retries", 0)
    
    if retries < MAX_RETRIES:
        logger.warning(f"Job {job_id} failed. Retrying ({retries + 1}/{MAX_RETRIES})...")
        job_data["retries"] = retries + 1
        job_data["status"] = "queued"
        job_data["last_error"] = reason
        r.set(job_key, json.dumps(job_data))
        # Requeue job
        r.lpush("job_queue", json.dumps(job_data))
        r.publish("job_events", json.dumps({"job_id": job_id, "status": "retrying"}))
    else:
        logger.error(f"Job {job_id} failed after {MAX_RETRIES} retries. Final Status: FAILED")
        transition_job(job_id, "failed", {"error": reason})

def monitor_stuck_jobs():
    """
    Scans for jobs that have been 'running' or 'pending' for too long.
    """
    # implementation for periodic cleanup/recovery script
    pass
