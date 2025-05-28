import { Node, Edge } from "reactflow";

export interface Workflow {
  nodes: Node[];
  edges: Edge[];
}

export interface WorkflowNode extends Node {
  type: "agent";
  data: {
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
  };
}

export interface WorkflowEdge extends Edge {
  type: "smoothstep";
  animated: boolean;
  style: {
    stroke: string;
  };
}

export interface WorkflowUpdate {
  nodes?: Node[];
  edges?: Edge[];
}

export interface WorkflowError {
  message: string;
  code?: string;
  details?: unknown;
}

export interface WorkflowResult {
  success: boolean;
  data?: Workflow;
  error?: WorkflowError;
} 