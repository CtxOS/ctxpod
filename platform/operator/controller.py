import kopf
import kubernetes
import redis
import json
import logging
import uuid
import datetime

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("AIOperator")

r = redis.Redis(host="redis", port=6379, decode_responses=True)

@kopf.on.create('khulnasoft.ai', 'v1', 'aijobs')
def create_fn(spec, name, namespace, logger, **kwargs):
    """
    Called when a new AIJob is created.
    """
    logger.info(f"AIJob {name} detected. Syncing with compute grid...")
    
    job_id = str(uuid.uuid4())
    workflow = spec.get("workflow", [])
    resources = spec.get("resources", {})
    job_type = spec.get("type", "custom")
    
    job_data = {
        "id": job_id,
        "k8s_name": name,
        "type": job_type,
        "workflow": workflow,
        "resources_requested": resources,
        "status": "queued",
        "created_at": datetime.datetime.now().isoformat()
    }
    
    # Push to our internal grid scheduler
    r.lpush("job_queue", json.dumps(job_data))
    r.set(f"job:{job_id}", json.dumps(job_data))
    
    # Store mapping between K8s name and Grid ID
    r.set(f"k8s_job_map:{name}", job_id)
    
    return {'jobId': job_id, 'status': 'submitted'}

@kopf.on.update('khulnasoft.ai', 'v1', 'aijobs')
def update_fn(spec, status, name, logger, **kwargs):
    """
    Handles updates to the AIJob (e.g. spec changes).
    """
    # implementation for handling spec updates (e.g. canceling/restarting)
    pass

@kopf.on.delete('khulnasoft.ai', 'v1', 'aijobs')
def delete_fn(name, logger, **kwargs):
    """
    Cleans up grid resources when AIJob is deleted.
    """
    job_id = r.get(f"k8s_job_map:{name}")
    if job_id:
        logger.info(f"AIJob {name} deleted. Cleaning up Grid ID {job_id}")
        r.delete(f"job:{job_id}")
        r.delete(f"k8s_job_map:{name}")

def update_k8s_status(name, namespace, phase, progress, node=None):
    """
    Utility to push grid updates back to K8s status.
    """
    api = kubernetes.client.CustomObjectsApi()
    status = {
        "status": {
            "phase": phase,
            "progress": progress,
            "node": node
        }
    }
    api.patch_namespaced_custom_object_status(
        group="khulnasoft.ai",
        version="v1",
        namespace=namespace,
        plural="aijobs",
        name=name,
        body=status
    )
