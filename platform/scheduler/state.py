import json
import time
import logging
import redis

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("NodeRegistry")

r = redis.Redis(host="redis", port=6379, decode_responses=True)

NODE_EXPIRY_SECONDS = 60 # Heartbeat timeout

def register_node(node_id, node_type, resources):
    """
    Registers a node in the grid.
    node_type: 'local' | 'cloud'
    resources: {'gpu': bool, 'vram': int, ...}
    """
    node_data = {
        "id": node_id,
        "type": node_type,
        "resources": resources,
        "last_heartbeat": time.time(),
        "status": "ready"
    }
    
    # Store in a Redis hash for fast lookup
    r.hset("grid_nodes", node_id, json.dumps(node_data))
    # Pulse the node's individual key with an expiry
    r.set(f"node_heartbeat:{node_id}", "alive", ex=NODE_EXPIRY_SECONDS)
    
    logger.info(f"Node registered: {node_id} ({node_type})")

def get_active_nodes():
    """
    Returns a list of all nodes that haven't timed out.
    """
    all_nodes = r.hgetall("grid_nodes")
    active_nodes = []
    
    for node_id, data_str in all_nodes.items():
        # Check if heartbeat key still exists
        if r.exists(f"node_heartbeat:{node_id}"):
            active_nodes.append(json.loads(data_str))
        else:
            # Cleanup stale node
            logger.warning(f"Node {node_id} timed out. Removing from registry.")
            r.hdel("grid_nodes", node_id)
            
    return active_nodes

def update_node_status(node_id, status):
    node_data_str = r.hget("grid_nodes", node_id)
    if node_data_str:
        node_data = json.loads(node_data_str)
        node_data["status"] = status
        r.hset("grid_nodes", node_id, json.dumps(node_data))

def get_node_count(node_type=None):
    nodes = get_active_nodes()
    if node_type:
        return len([n for n in nodes if n["type"] == node_type])
    return len(nodes)
