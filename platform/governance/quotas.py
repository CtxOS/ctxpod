import redis
import json
import logging

logger = logging.getLogger("QuotaManager")
r = redis.Redis(host="redis", port=6379, decode_responses=True)

DEFAULT_QUOTAS = {
    "gpu_hours": 24,
    "max_cost": 500.0,
    "rate_limit_rpm": 60
}

class QuotaManager:
    """
    Manages per-user usage quotas and budget caps.
    """
    def __init__(self):
        self.key_prefix = "quota:user:"

    def check_quota(self, user_id: str, estimated_hours: float) -> bool:
        """
        Verifies if the user has enough remaining quota for a new job.
        """
        quota = self.get_user_quota(user_id)
        current_usage = float(r.get(f"{self.key_prefix}{user_id}:usage") or 0.0)
        
        if (current_usage + estimated_hours) > quota["gpu_hours"]:
            logger.warning(f"Quota exceeded for user {user_id}: {current_usage} + {estimated_hours} > {quota['gpu_hours']}")
            return False
            
        return True

    def track_usage(self, user_id: str, actual_hours: float):
        """
        Increments the user's recorded usage after job completion.
        """
        r.incrbyfloat(f"{self.key_prefix}{user_id}:usage", actual_hours)

    def get_user_quota(self, user_id: str):
        # In production, fetch from Postgres. Here using defaults.
        data = r.get(f"{self.key_prefix}{user_id}:config")
        return json.loads(data) if data else DEFAULT_QUOTAS
