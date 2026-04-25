import ray
import os
import logging
import time

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("RayWorker")

# Initialize Ray (address="auto" assumes we're running inside the K8s cluster or local Ray)
# In production, this would be set via environment variable
RAY_ADDRESS = os.getenv("RAY_ADDRESS", "auto")

def ensure_ray_initialized():
    if ray.is_initialized():
        return
    try:
        ray.init(address=RAY_ADDRESS)
        logger.info(f"Connected to Ray cluster at {RAY_ADDRESS}")
    except Exception as e:
        logger.exception("Failed to connect to Ray cluster")
        raise RuntimeError("Ray cluster initialization failed") from e

`@ray.remote`(num_gpus=1)
def run_ai_compute_task(payload):

def main():
    ensure_ray_initialized()
    # Example usage
@ray.remote(num_gpus=1)
def run_ai_compute_task(payload):
    """
    Core AI task execution.
    Requires NVIDIA GPU and PyTorch/TensorFlow.
    """
    logger.info(f"Starting AI task: {payload.get('task', 'unknown')}")
    
    # Simulate heavy computation
    time.sleep(2)
    
    # Simulate GPU check
    import torch
    gpu_available = torch.cuda.is_available()
    device_name = torch.cuda.get_device_name(0) if gpu_available else "CPU (Fallback)"
    
    return {
        "status": "completed",
        "result": f"Processed {payload.get('task')} on {device_name}",
        "gpu_used": gpu_available
    }

def main():
    # Example usage
    future = run_ai_compute_task.remote({"task": "LLM Inference", "model": "Llama-3"})
    result = ray.get(future)
    print(f"Result: {result}")

if __name__ == "__main__":
    main()
