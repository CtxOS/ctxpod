import abc
import logging
from typing import Dict, Any

logger = logging.getLogger("GridAgent")

class Agent(abc.ABC):
    """
    Formalized Base Agent for the multi-agent orchestration system.
    Every agent must implement the 'run' method with input_data and context.
    """
    def __init__(self, agent_id: str, role: str, config: Dict[str, Any] = None):
        self.id = agent_id
        self.role = role
        self.config = config or {}
        self.status = "idle"

    @abc.abstractmethod
    def run(self, input_data: Any, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Main execution logic.
        """
        pass

    def log_decision(self, action: str, rationale: str, data: Any = None):
        """
        Helper to record autonomous decisions for the audit trail.
        """
        logger.info(f"[{self.role}] ACTION: {action} | RATIONALE: {rationale}")
        # In production, this would call the platform/audit/logger.py
