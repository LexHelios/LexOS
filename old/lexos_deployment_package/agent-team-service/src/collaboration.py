import torch
import torch.nn as nn
from typing import Dict, List, Optional, Tuple
import numpy as np
from .models import BaseModel

class CollaborationManager:
    """Manages collaboration between agents."""
    def __init__(self, config: Dict):
        self.config = config
        self.agents = {}
        self.collaboration_graph = None
        self.task_queue = []
        self.results_cache = {}
        
    def register_agent(self, agent_id: str, agent: BaseModel):
        """Register an agent for collaboration."""
        self.agents[agent_id] = agent
        
    def build_collaboration_graph(self):
        """Build a graph representing agent collaboration patterns."""
        num_agents = len(self.agents)
        self.collaboration_graph = torch.zeros((num_agents, num_agents))
        
        # Define collaboration patterns
        for i, agent_id in enumerate(self.agents.keys()):
            for j, other_id in enumerate(self.agents.keys()):
                if i != j:
                    # Set collaboration weights based on agent types
                    self.collaboration_graph[i, j] = self._get_collaboration_weight(agent_id, other_id)
                    
    def _get_collaboration_weight(self, agent1: str, agent2: str) -> float:
        """Get collaboration weight between two agents."""
        # Define collaboration weights based on agent relationships
        collaboration_patterns = {
            ("nexus", "percept"): 0.9,
            ("nexus", "cognos"): 0.9,
            ("nexus", "mnemosyne"): 0.8,
            ("nexus", "predictor"): 0.8,
            ("nexus", "innovator"): 0.7,
            ("nexus", "empath"): 0.7,
            ("nexus", "guardian"): 0.9,
            ("nexus", "code"): 0.8,
            ("percept", "cognos"): 0.8,
            ("percept", "mnemosyne"): 0.7,
            ("cognos", "mnemosyne"): 0.8,
            ("cognos", "predictor"): 0.7,
            ("cognos", "innovator"): 0.6,
            ("mnemosyne", "predictor"): 0.7,
            ("predictor", "innovator"): 0.6,
            ("innovator", "empath"): 0.7,
            ("empath", "guardian"): 0.8,
            ("guardian", "code"): 0.9
        }
        
        # Get collaboration weight
        key = tuple(sorted([agent1, agent2]))
        return collaboration_patterns.get(key, 0.5)
        
    async def coordinate_task(self, task: Dict) -> Dict:
        """Coordinate a task across multiple agents."""
        # Analyze task requirements
        required_agents = self._analyze_task_requirements(task)
        
        # Build task execution plan
        execution_plan = self._build_execution_plan(task, required_agents)
        
        # Execute task
        results = await self._execute_plan(execution_plan)
        
        # Consolidate results
        consolidated_results = self._consolidate_results(results)
        
        return consolidated_results
        
    def _analyze_task_requirements(self, task: Dict) -> List[str]:
        """Analyze task requirements to determine required agents."""
        required_agents = []
        
        # Check task type and determine required agents
        if "perception" in task.get("type", []):
            required_agents.append("percept")
        if "reasoning" in task.get("type", []):
            required_agents.append("cognos")
        if "memory" in task.get("type", []):
            required_agents.append("mnemosyne")
        if "prediction" in task.get("type", []):
            required_agents.append("predictor")
        if "innovation" in task.get("type", []):
            required_agents.append("innovator")
        if "stakeholder" in task.get("type", []):
            required_agents.append("empath")
        if "security" in task.get("type", []):
            required_agents.append("guardian")
        if "code" in task.get("type", []):
            required_agents.append("code")
            
        # Always include Nexus for coordination
        required_agents.append("nexus")
        
        return required_agents
        
    def _build_execution_plan(self, task: Dict, required_agents: List[str]) -> Dict:
        """Build an execution plan for the task."""
        plan = {
            "task": task,
            "agents": required_agents,
            "dependencies": [],
            "execution_order": []
        }
        
        # Build dependency graph
        for i, agent1 in enumerate(required_agents):
            for j, agent2 in enumerate(required_agents):
                if i != j:
                    weight = self.collaboration_graph[
                        list(self.agents.keys()).index(agent1),
                        list(self.agents.keys()).index(agent2)
                    ]
                    if weight > 0.7:  # Strong dependency
                        plan["dependencies"].append((agent1, agent2))
                        
        # Determine execution order
        plan["execution_order"] = self._topological_sort(plan["dependencies"])
        
        return plan
        
    def _topological_sort(self, dependencies: List[Tuple[str, str]]) -> List[str]:
        """Perform topological sort on dependencies."""
        # Build adjacency list
        graph = {}
        in_degree = {}
        
        for agent1, agent2 in dependencies:
            if agent1 not in graph:
                graph[agent1] = []
            if agent2 not in graph:
                graph[agent2] = []
            graph[agent1].append(agent2)
            in_degree[agent2] = in_degree.get(agent2, 0) + 1
            
        # Perform topological sort
        queue = [agent for agent in graph if agent not in in_degree]
        result = []
        
        while queue:
            agent = queue.pop(0)
            result.append(agent)
            
            for neighbor in graph.get(agent, []):
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)
                    
        return result
        
    async def _execute_plan(self, plan: Dict) -> Dict:
        """Execute the task execution plan."""
        results = {}
        
        for agent_id in plan["execution_order"]:
            # Get agent
            agent = self.agents[agent_id]
            
            # Prepare input
            input_data = self._prepare_agent_input(agent_id, plan, results)
            
            # Execute agent
            agent_result = await agent.process(input_data)
            
            # Store result
            results[agent_id] = agent_result
            
        return results
        
    def _prepare_agent_input(self, agent_id: str, plan: Dict, results: Dict) -> Dict:
        """Prepare input data for an agent."""
        input_data = {
            "task": plan["task"],
            "agent_id": agent_id,
            "dependencies": plan["dependencies"],
            "previous_results": results
        }
        
        return input_data
        
    def _consolidate_results(self, results: Dict) -> Dict:
        """Consolidate results from multiple agents."""
        consolidated = {
            "task_results": {},
            "agent_contributions": {},
            "confidence_scores": {},
            "collaboration_metrics": {}
        }
        
        # Consolidate task results
        for agent_id, result in results.items():
            consolidated["task_results"].update(result.get("output", {}))
            consolidated["agent_contributions"][agent_id] = result.get("contribution", {})
            consolidated["confidence_scores"][agent_id] = result.get("confidence", 0.0)
            
        # Calculate collaboration metrics
        consolidated["collaboration_metrics"] = self._calculate_collaboration_metrics(results)
        
        return consolidated
        
    def _calculate_collaboration_metrics(self, results: Dict) -> Dict:
        """Calculate metrics about agent collaboration."""
        metrics = {
            "coordination_score": 0.0,
            "information_flow": 0.0,
            "conflict_resolution": 0.0,
            "efficiency": 0.0
        }
        
        # Calculate coordination score
        coordination_scores = []
        for agent_id, result in results.items():
            if "coordination" in result:
                coordination_scores.append(result["coordination"])
        metrics["coordination_score"] = np.mean(coordination_scores) if coordination_scores else 0.0
        
        # Calculate information flow
        information_flow = 0.0
        for i, agent1 in enumerate(results.keys()):
            for j, agent2 in enumerate(results.keys()):
                if i != j:
                    weight = self.collaboration_graph[
                        list(self.agents.keys()).index(agent1),
                        list(self.agents.keys()).index(agent2)
                    ]
                    information_flow += weight
        metrics["information_flow"] = information_flow / (len(results) * (len(results) - 1))
        
        # Calculate conflict resolution
        conflict_scores = []
        for agent_id, result in results.items():
            if "conflict_resolution" in result:
                conflict_scores.append(result["conflict_resolution"])
        metrics["conflict_resolution"] = np.mean(conflict_scores) if conflict_scores else 0.0
        
        # Calculate efficiency
        execution_times = []
        for agent_id, result in results.items():
            if "execution_time" in result:
                execution_times.append(result["execution_time"])
        metrics["efficiency"] = 1.0 / (np.mean(execution_times) + 1e-6)
        
        return metrics 