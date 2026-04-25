import logging
from typing import Dict, Any, List

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("PolicyEngine")

# Hard-coded safety policies
ALLOWED_AGENTS = ["recon", "scanner", "base", "analyst"]
MAX_RECURSION_DEPTH = 5
MAX_JOBS_PER_SESSION = 20
RESTRICTED_PARAMS = ["--privileged", "rm -rf /", "chmod 777"]

from platform.governance.quotas import QuotaManager

quota_manager = QuotaManager()

class PolicyEngine:
    """
    Validates autonomous actions against security and safety policies.
    """
    def __init__(self):
        self.active_policies = ["agent_restriction", "recursion_guard", "param_sanitization"]

    def validate_workflow(self, workflow_spec: Dict[str, Any], user_id: str = "default") -> Dict[str, Any]:
        """
        Validates an entire AIJob workflow including user quotas.
        """
        issues = []
        
        # 1. Quota Check
        estimated_hours = 1.0 # Simple estimate based on step count later
        if not quota_manager.check_quota(user_id, estimated_hours):
            issues.append(f"Insufficient GPU quota for user '{user_id}'.")

        # 2. Agent/Param Checks
        steps = workflow_spec.get("workflow", [])
        for step in steps:
            agent = step.get("agent")
            if agent not in ALLOWED_AGENTS:
                issues.append(f"Agent '{agent}' is not in the allowed list.")
            
            # Check params for dangerous strings
            params_str = str(step.get("params", ""))
            for restricted in RESTRICTED_PARAMS:
                if restricted in params_str:
                    issues.append(f"Restricted parameter/command detected: {restricted}")

        if issues:
            return {"status": "Blocked", "reason": "; ".join(issues)}
        
        return {"status": "Authorized", "reason": "All steps pass safety validation."}

    def validate_mutation(self, current_depth: int, total_mutations: int) -> bool:
        """
        Checks if a dynamic mutation is allowed based on recursion guards.
        """
        if current_depth >= MAX_RECURSION_DEPTH:
            logger.warning(f"Recursion depth limit reached: {current_depth}")
            return False
        return True
