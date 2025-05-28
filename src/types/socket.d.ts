export interface AgentUpdateMessage {
  type: "agent_update";
  data: {
    id: string;
    name?: string;
    type?: string;
    status?: "idle" | "running" | "error";
    metrics?: {
      cpu: number;
      memory: number;
      gpu: number;
    };
    error?: string;
  };
}

export interface SystemMetricsMessage {
  type: "system_metrics";
  data: {
    timestamp: number;
    cpu: number;
    memory: number;
    gpu: number;
  };
}

export interface CommandResponseMessage {
  type: "command_response";
  data: {
    id: string;
    status: "running" | "completed" | "error";
    error?: string;
  };
}

export type WebSocketMessage =
  | AgentUpdateMessage
  | SystemMetricsMessage
  | CommandResponseMessage; 