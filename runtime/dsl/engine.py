import logging
import time
import json
from enum import Enum
from platform.governance.policy_engine import PolicyEngine

policy_engine = PolicyEngine()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("DSLEngine")

class StepStatus(Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"

class WorkflowEngine:
    """
    Core engine for executing multi-step AI workflows.
    """
    def __init__(self, job_id, steps):
        self.job_id = job_id
        self.steps = steps
        self.context = {} # Shared data between steps
        
    def execute(self):
        logger.info(f"Starting autonomous workflow for Job {self.job_id} with {len(self.steps)} steps.")
        
        current_step_idx = 0
        while current_step_idx < len(self.steps):
            step = self.steps[current_step_idx]
            step_name = step.get("name", f"step-{current_step_idx}")
            agent_type = step.get("agent", "base")
            params = step.get("params", {})
            
            logger.info(f"Executing step {current_step_idx + 1}: {step_name} [{agent_type}]")
            
            try:
                # Actual execution would happen on Ray
                result = self.run_step(step_name, agent_type, params)
                
                # Check for Self-Mutation / Dynamic Feedback
                if isinstance(result, dict) and "follow_up" in result:
                    new_steps = result["follow_up"]
                    
                    # GOVERNANCE CHECK: Validate mutation with Policy Engine
                    if policy_engine.validate_mutation(current_step_idx, len(self.steps)):
                        logger.info(f"💡 Policy Authorized: Injecting {len(new_steps)} follow-up steps.")
                        for i, new_step in enumerate(new_steps):
                            self.steps.insert(current_step_idx + 1 + i, new_step)
                    else:
                        logger.warning("🚨 Policy Blocked: Mutation limit reached. Skipping follow-up steps.")
                
                # Merge result into context
                if isinstance(result, dict):
                    self.context.update(result)
                
                logger.info(f"Step {step_name} completed successfully.")
                
            except Exception as e:
                logger.error(f"Step {step_name} failed: {str(e)}")
                return {"status": "failed", "step": step_name, "error": str(e)}
            
            current_step_idx += 1
                
        return {"status": "completed", "context": self.context}

    def run_step(self, name, agent, params):
        """
        Mock execution of a step. 
        In production, this calls Ray tasks.
        """
        # Simulate work
        time.sleep(1)
        return {"last_action": f"finished {name}", "data": f"processed_{name}"}
