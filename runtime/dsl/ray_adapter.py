import ray
import logging

logger = logging.getLogger("RayAdapter")

@ray.remote
class AgentExecutor:
    """
    Stateful Ray Actor to execute agent tasks.
    """
    def __init__(self, agent_type, config):
        self.agent_type = agent_type
        self.config = config
        self.history = []

    def execute_task(self, task_name, params):
        logger.info(f"Ray Actor executing {task_name}...")
        # In production, this would load real Agent classes
        # result = AgentFactory.get(self.agent_type).run(params)
        
        result = {"status": "success", "task": task_name, "node": ray.get_runtime_context().node_id.hex()}
        self.history.append(result)
        return result

def run_workflow_step_on_ray(agent_type, step_name, params):
    """
    Helper to dispatch a DSL step to a Ray Actor.
    """
    try:
        # Create a transient actor for the step
        executor = AgentExecutor.remote(agent_type, params)
        future = executor.execute_task.remote(step_name, params)
        return ray.get(future)
    except Exception as e:
        logger.error(f"Ray execution error: {str(e)}")
        raise
