from typing import Dict, Any, List
from agents.types.base_agent import Agent

class PlannerAgent(Agent):
    """
    Agent specialized in decomposing complex goals into DSL workflows.
    """
    def __init__(self, agent_id: str, config: Dict[str, Any] = None):
        super().__init__(agent_id, "Planner", config)

    def run(self, goal: Any, context: Dict[str, Any] = None) -> Dict[str, Any]:
        self.log_decision("Generate Workflow", f"Decomposing goal: {goal}")
        # Simplified mock logic - would call workflow_generator.py
        return {
            "type": "autonomous_scan",
            "workflow": [
                {"name": "Recon", "agent": "recon", "params": {"target": goal}}
            ]
        }

class CriticAgent(Agent):
    """
    Agent specialized in safety audit and efficiency review.
    """
    def __init__(self, agent_id: str, config: Dict[str, Any] = None):
        super().__init__(agent_id, "Critic", config)

    def run(self, plan: Any, context: Dict[str, Any] = None) -> Dict[str, Any]:
        self.log_decision("Audit Plan", "Reviewing proposed workflow for safety breaches.")
        # Logic to check for blocked agents or dangerous commands
        return {"approved": True, "score": 0.95}

class ObserverAgent(Agent):
    """
    Agent specialized in real-time execution monitoring and anomaly detection.
    """
    def __init__(self, agent_id: str, config: Dict[str, Any] = None):
        super().__init__(agent_id, "Observer", config)

    def run(self, job_telemetry: Any, context: Dict[str, Any] = None) -> Dict[str, Any]:
        runtime = job_telemetry.get("runtime", 0)
        if runtime > 600:
             self.log_decision("Alert Anomaly", f"Job runtime ({runtime}s) exceeds threshold.")
             return {"anomaly": True, "action": "Kill"}
        return {"anomaly": False}
