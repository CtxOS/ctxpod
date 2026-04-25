import logging

logger = logging.getLogger("ResourceManager")

# Resource profiles for different AI/Pentest tasks
TASK_RESOURCES = {
    "llm_inference": {"gpu": True, "vram_min_gb": 16, "cpu_cores": 4},
    "llm_training": {"gpu": True, "vram_min_gb": 40, "cpu_cores": 8},
    "cve_scanner": {"gpu": False, "cpu_cores": 2, "mem_gb": 4},
    "brute_force_hash": {"gpu": True, "vram_min_gb": 8, "cpu_cores": 2},
}

def get_required_resources(task_type):
    """
    Returns the resource requirements for a given task type.
    """
    return TASK_RESOURCES.get(task_type.lower(), {"gpu": False, "cpu_cores": 1, "mem_gb": 2})

def can_fit_on_node(resources_required, node_resources):
    """
    Enhanced matching logic that respects granular availability (Bin-Packing).
    """
    if resources_required.get("gpu") and not node_resources.get("gpu"):
        return False
        
    # Check VRAM availability
    available_vram = node_resources.get("vram_gb", 0)
    if resources_required.get("vram_min_gb", 0) > available_vram:
        return False
        
    # Check CPU availability
    available_cpu = node_resources.get("cpu_cores", 0)
    if resources_required.get("cpu_cores", 0) > available_cpu:
        return False
        
    return True

from platform.intelligence.adaptive_weights import AdaptiveOptimizer

optimizer = AdaptiveOptimizer()

def find_best_node(resources_required, available_nodes):
    """
    Selects the best node using adaptive weights from the feedback loop.
    """
    eligible_nodes = [n for n in available_nodes if can_fit_on_node(resources_required, n["resources"])]
    
    if not eligible_nodes:
        return None
        
    weights = optimizer.get_weights()
    scored_nodes = []
    
    for node in eligible_nodes:
        # Base score from VRAM compactness
        vram_diff = node["resources"].get("vram_gb", 0) - resources_required.get("vram_min_gb", 0)
        
        # Apply adaptive weights
        if node["type"] == "local":
            type_multiplier = weights.get("local_preference", 1.0)
            score = vram_diff / type_multiplier
        else:
            type_penalty = weights.get("cloud_penalty", 1.0)
            score = (vram_diff + 1000) * type_penalty
            
        scored_nodes.append((score, node))
        
    scored_nodes.sort(key=lambda x: x[0])
    return scored_nodes[0][1]

def update_node_resources(node_id, resources_consumed):
    """
    Updates the registry after a job is scheduled to reflect consumed resources.
    """
    # implementation will interact with NodeRegistry to decrement vram/cpu
    pass
