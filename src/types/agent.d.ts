export interface Agent {
  id: string;
  name: string;
  type: string;
  status: "idle" | "running" | "error";
  metrics: {
    cpu: number;
    memory: number;
    gpu: number;
  };
  error?: string;
}

export interface AgentNode {
  id: string;
  type: "agent";
  position: {
    x: number;
    y: number;
  };
  data: Agent;
}

export interface AgentEdge {
  id: string;
  source: string;
  target: string;
  type: "smoothstep";
  animated: boolean;
  style: {
    stroke: string;
  };
}

export interface AgentMetrics {
  cpu: number;
  memory: number;
  gpu: number;
}

export interface AgentStatus {
  status: "idle" | "running" | "error";
  error?: string;
} 