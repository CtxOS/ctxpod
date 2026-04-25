import logging
import json
from typing import Dict, Any

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("AICritic")

class AICritic:
    """
    Independent AI agent that reviews proposed workflows for efficiency and safety.
    """
    def __init__(self):
        self.role = "Security Auditor & Efficiency Optimizer"

    def review_plan(self, plan: Dict[str, Any]) -> Dict[str, Any]:
        """
        Simulates an LLM-based review of an AIJob plan.
        """
        logger.info("AICritic reviewing proposed workflow...")
        
        # Mocking a 'Critic' evaluation
        workflow = plan.get("workflow", [])
        
        if len(workflow) > 10:
            return {
                "decision": "Warning",
                "reason": "Workflow is unusually long. Optimization suggested.",
                "adjustments": {"limit_steps": 10}
            }
            
        for step in workflow:
            if step.get("agent") == "exploit":
                return {
                    "decision": "Manual Approval Required",
                    "reason": "Autonomous exploit agent detected. Higher risk level.",
                    "adjustments": {}
                }
        
        return {
            "decision": "Approved",
            "reason": "Workflow aligns with safety best practices and operational efficiency.",
            "adjustments": {}
        }
