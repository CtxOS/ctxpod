import time
import json
import logging
import redis
from platform.scheduler.state import get_active_nodes, r as redis_conn
from platform.scheduler.lifecycle import fail_job

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("FaultRecovery")

def recovery_loop():
    logger.info("Fault Recovery monitor started.")
    while True:
        try:
            # get_active_nodes automatically cleans up stale heartbeats in our state.py
            # But we need to handle jobs that were running on those nodes.
            nodes = get_active_nodes()
            active_node_ids = {n["id"] for n in nodes}
            
            # Check for jobs that are 'running' but their node is gone
            all_job_keys = redis_conn.keys("job:*")
            for key in all_job_keys:
                job_data = json.loads(redis_conn.get(key))
                if job_data.get("status") == "running":
                    node_id = job_data.get("node_id")
                    if node_id and node_id not in active_node_ids:
                        logger.warning(f"Job {job_data['id']} was running on lost node {node_id}. Triggering recovery...")
                        fail_job(job_data['id'], f"Node {node_id} heartbeat timeout")
            
        except Exception as e:
            logger.error(f"Error in recovery loop: {str(e)}")
            
        time.sleep(30)

if __name__ == "__main__":
    recovery_loop()
