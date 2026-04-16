import time
import redis
import json

r = redis.Redis(host="redis", port=6379, decode_responses=True)

# Price per hour for cloud nodes (e.g., A10G on AWS)
PRICE_PER_HOUR = 1.05 

def track_job_cost(job_id, start_time, cluster_type):
    """
    Calculates cost for a completed job if it ran on cloud.
    """
    if cluster_type != "cloud":
        return 0.0
    
    duration_seconds = time.time() - start_time
    duration_hours = duration_seconds / 3600.0
    cost = duration_hours * PRICE_PER_HOUR
    
    # Update total spend in Redis
    current_spend = float(r.get("total_cloud_spend") or 0.0)
    r.set("total_cloud_spend", current_spend + cost)
    
    return cost

def get_total_cloud_spend():
    return float(r.get("total_cloud_spend") or 0.0)
