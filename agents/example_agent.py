import requests
import time
import json
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("AIAgent")

API_URL = "http://localhost:8000"

def submit_and_wait(task_type, params):
    payload = {
        "task_type": task_type,
        "params": params,
        "priority": 1
    }
    
    try:
        # Submit job
        response = requests.post(f"{API_URL}/submit", json=payload)
        response.raise_for_status()
        job_id = response.json()["job_id"]
        logger.info(f"Submitted {task_type} job. ID: {job_id}")
        
        # Poll for status
        while True:
            status_resp = requests.get(f"{API_URL}/job/{job_id}")
            status_resp.raise_for_status()
            job_data = status_resp.json()
            
            status = job_data.get("status")
            logger.info(f"Job {job_id} status: {status}")
            
            if "running" in status or "completed" in status:
                return job_data
            
            time.sleep(2)
            
    except Exception as e:
        logger.error(f"Error communicating with Grid API: {str(e)}")
        return None

if __name__ == "__main__":
    logger.info("Starting AI Agent example...")
    result = submit_and_wait("CVE-Scanner", {"target": "khulnasoft.com", "depth": "advanced"})
    if result:
        print(f"Final Job State: {json.dumps(result, indent=2)}")
