import logging

logger = logging.getLogger("DAGManager")

class DAGManager:
    """
    Handles Directed Acyclic Graph based workflow dependencies.
    """
    def __init__(self, nodes, dependencies):
        self.nodes = nodes # {name: step_config}
        self.dependencies = dependencies # {child: [parents]}
        
    def get_execution_order(self):
        """
        Simple topological sort to determine execution order.
        """
        order = []
        visited = set()
        
        def visit(node):
            if node in visited:
                return
            for parent in self.dependencies.get(node, []):
                visit(parent)
            visited.add(node)
            order.append(node)
            
        for node in self.nodes:
            visit(node)
            
        return order
