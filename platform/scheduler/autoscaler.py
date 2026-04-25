import time
import redis
import logging
import os
import requests

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("Autoscaler")

# Config
REDIS_HOST = os.getenv("REDIS_HOST", "redis")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
QUEUE_THRESHOLD = int(os.getenv("QUEUE_THRESHOLD", 5))
CHECK_INTERVAL = int(os.getenv("AUTOSCALE_INTERVAL", 10))

from platform.scheduler.state import get_node_count, register_node, get_active_nodes

r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)

def scale_up_cloud():
    """
    Triggers cloud node provisioning if we don't already have one in progress.
    """
    active_cloud_nodes = get_node_count(node_type="cloud")
    
    if active_cloud_nodes < 5: # Max cloud nodes limit
        logger.info(f"🚀 Queue pressure high. Current cloud nodes: {active_cloud_nodes}. Spawning new node...")
        
        # Simulate API call to provider
        node_id = f"cloud-node-{uuid.uuid4().hex[:6]}"
        register_node(node_id, "cloud", {"gpu": True, "vram_gb": 24}) # Simulated A10G
        
        # Increment total spend for monitoring
        current_spend = float(r.get("total_cloud_spend") or 0.0)
        r.set("total_cloud_spend", current_spend + 1.05) # Assume $1.05/hr base cost
    else:
        logger.warning("Cloud quota reached. Cannot scale up further.")

def scale_down_cloud():
    """
    Cleans up idle cloud nodes from the registry.
    """
    cloud_nodes = [n for n in get_active_nodes() if n["type"] == "cloud"]
    if cloud_nodes:
        node_to_kill = cloud_nodes[0]
        logger.info(f"🛑 Cluster idle. Terminating cloud node {node_to_kill['id']}...")
        r.hdel("grid_nodes", node_to_kill['id'])
        r.delete(f"node_heartbeat:{node_to_kill['id']}")

def autoscale_loop():
    logger.info(f"Autoscaler started. Threshold: {QUEUE_THRESHOLD}, Interval: {CHECK_INTERVAL}s")
    while True:
        try:
            queue_size = r.llen("job_queue")
            logger.debug(f"Current queue size: {queue_size}")

            if queue_size > QUEUE_THRESHOLD:
                scale_up_cloud()
            elif queue_size == 0:
                scale_down_cloud()

        except Exception as e:
            logger.error(f"Error in autoscaler loop: {str(e)}")
        
        time.sleep(CHECK_INTERVAL)

if __name__ == "__main__":
    autoscale_loop()
