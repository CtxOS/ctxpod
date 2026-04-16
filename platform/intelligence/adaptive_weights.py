import redis
import json
import logging

logger = logging.getLogger("AdaptiveWeights")
r = redis.Redis(host="redis", port=6379, decode_responses=True)

class AdaptiveOptimizer:
    """
    Analyzes historical job performance to adjust scheduling weights.
    """
    def __init__(self):
        self.weights_key = "scheduler_adaptive_weights"

    def get_weights(self):
        """
        Returns current weights for Local vs Cloud placement.
        """
        weights = r.get(self.weights_key)
        if weights:
            return json.loads(weights)
        
        # Default weights: Prefer local (0.0 cost)
        return {"local_preference": 1.5, "cloud_penalty": 0.8}

    def update_weights_from_history(self, job_results: list):
        """
        Simple feedback loop: If local nodes succeed frequently, increase local_preference.
        """
        current = self.get_weights()
        success_rate = len([j for j in job_results if j['status'] == 'completed']) / len(job_results)
        
        if success_rate > 0.9:
            current["local_preference"] += 0.1
        elif success_rate < 0.5:
            current["local_preference"] -= 0.2
            
        r.set(self.weights_key, json.dumps(current))
        logger.info(f"Adaptive weights updated: {current}")
