import { Agent } from "./agent";
import { Command } from "./command";
import { SystemMetrics } from "./telemetry";
import { Workflow } from "./workflow";

export interface UseAgentReturn {
  agents: Agent[];
  selectedAgent: string | null;
  addAgent: (agent: Agent) => void;
  removeAgent: (id: string) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  updateAgentMetrics: (id: string, metrics: Agent["metrics"]) => void;
  selectAgent: (id: string | null) => void;
}

export interface UseCommandReturn {
  commands: Command[];
  addCommand: (command: Omit<Command, "id" | "timestamp" | "status">) => void;
  updateCommand: (id: string, updates: Partial<Command>) => void;
  removeCommand: (id: string) => void;
  clearCommands: () => void;
}

export interface UseTelemetryReturn {
  metrics: SystemMetrics[];
  currentMetrics: {
    cpu: number;
    memory: number;
    gpu: number;
  };
  addMetrics: (metrics: SystemMetrics) => void;
  updateCurrentMetrics: (metrics: Partial<SystemMetrics>) => void;
  clearMetrics: () => void;
}

export interface UseWorkflowReturn {
  workflow: Workflow;
  setNodes: (nodes: Workflow["nodes"]) => void;
  setEdges: (edges: Workflow["edges"]) => void;
  addNode: (node: Workflow["nodes"][0]) => void;
  removeNode: (id: string) => void;
  updateNode: (id: string, updates: Partial<Workflow["nodes"][0]>) => void;
  addEdge: (edge: Workflow["edges"][0]) => void;
  removeEdge: (id: string) => void;
  updateEdge: (id: string, updates: Partial<Workflow["edges"][0]>) => void;
  clearWorkflow: () => void;
}

export interface UseSocketReturn {
  socket: WebSocket | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  send: (message: string) => void;
} 