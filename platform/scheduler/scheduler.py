import redis
import json
import time
import logging
import random

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("Scheduler")

REDIS_HOST = "redis"
REDIS_PORT = 6379
r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)

from platform.scheduler.state import get_active_nodes, update_node_status
from platform.scheduler.lifecycle import transition_job, fail_job
from platform.scheduler.resource_manager import get_required_resources, find_best_node

def dispatch(cluster_type, job_data, node_id):
    """
    Dispatches the job to a specific node with lifecycle tracking.
    """
    job_id = job_data["id"]
    
    # Transition to 'pending' as we attempt to deploy
    transition_job(job_id, "pending", {"node_id": node_id, "cluster": cluster_type})
    
    try:
        # Update node status in registry
        update_node_status(node_id, "busy")
        
        # In a real system, trigger Ray task here
        # Example: ray_task.remote(...)
        
        # Transition to 'running'
        transition_job(job_id, "running")
        logger.info(f"Job {job_id} successfully dispatched to node {node_id}")
        
    except Exception as e:
        logger.error(f"Dispatch failed for job {job_id}: {str(e)}")
        fail_job(job_id, str(e))
        update_node_status(node_id, "ready")

from platform.scheduler.locks import distributed_lock

PRIORITY_QUEUES = ["high_priority_queue", "job_queue", "low_priority_queue"]

def schedule():
    logger.info("Elite Scheduler started. Monitoring priority queues...")
    while True:
        # Use distributed lock to prevent multiple schedulers from thrashing the same queues
        with distributed_lock("scheduler_main") as acquired:
            if not acquired:
                time.sleep(1)
                continue
                
            try:
                # Poll priority queues in order
                job = None
                target_queue = None
                for q in PRIORITY_QUEUES:
                    job = r.rpop(q)
                    if job:
                        target_queue = q
                        break
                        
                if job:
                    job_data = json.loads(job)
                    job_id = job_data["id"]
                    
                    # Idempotency check: Ensure we haven't already dispatched this job
                    current_status = json.loads(r.get(f"job:{job_id}") or "{}").get("status")
                    if current_status not in ["queued", "retrying"]:
                        logger.warning(f"Job {job_id} is already {current_status}. Skipping duplicate dispatch.")
                        continue

                    resources_req = get_required_resources(job_data.get("task_type"))
                    available_nodes = get_active_nodes()
                    ready_nodes = [n for n in available_nodes if n["status"] == "ready"]
                    
                    target_node = find_best_node(resources_req, ready_nodes)
                    
                    if target_node:
                        dispatch(target_node["type"], job_data, target_node["id"])
                    else:
                        logger.debug(f"Pending resources for {job_id}. Requeueing to {target_queue}.")
                        r.lpush(target_queue, json.dumps(job_data))
                        
            except Exception as e:
                logger.error(f"Error in locked schedule loop: {str(e)}")
        
        time.sleep(2) # Small gap between lock attempts
            time.sleep(5)

if __name__ == "__main__":
    schedule()
