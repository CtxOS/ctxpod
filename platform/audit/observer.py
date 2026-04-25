import time
import json
import logging
import redis
from platform.scheduler.state import r as redis_conn

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("AnomalyObserver")

MAX_RUNTIME_SECONDS = 3600 # 1 Hour hard limit
MAX_MUTATIONS_ALLOWED = 10

def audit_loop():
    logger.info("Anomaly Observer started. Monitoring job telemetry...")
    while True:
        try:
            # Check all active jobs
            all_job_keys = redis_conn.keys("job:*")
            for key in all_job_keys:
                raw_data = redis_conn.get(key)
                if not raw_data: continue
                
                job_data = json.loads(raw_data)
                if job_data.get("status") != "running": continue
                
                # 1. Runtime Anomaly
                start_time = job_data.get("created_at", time.time())
                runtime = time.time() - start_time
                if runtime > MAX_RUNTIME_SECONDS:
                    logger.warning(f"🚨 ANOMALY: Job {job_data['id']} runtime ({int(runtime)}s) exceeds safety limit. Triggering kill.")
                    # In production: trigger task termination via Ray
                
                # 2. Mutation Count Anomaly
                mutations = job_data.get("mutations", 0)
                if mutations > MAX_MUTATIONS_ALLOWED:
                    logger.warning(f"🚨 ANOMALY: Job {job_data['id']} mutations ({mutations}) spike detected. Investigation required.")

        except Exception as e:
            logger.error(f"Error in anomaly audit loop: {str(e)}")
            
        time.sleep(20)

if __name__ == "__main__":
    audit_loop()
