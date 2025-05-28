import { Agent } from "./agent";
import { Command } from "./command";
import { SystemMetrics } from "./telemetry";
import { Workflow } from "./workflow";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

export interface ApiEndpoints {
  agents: {
    list: () => Promise<ApiResponse<Agent[]>>;
    get: (id: string) => Promise<ApiResponse<Agent>>;
    create: (agent: Omit<Agent, "id">) => Promise<ApiResponse<Agent>>;
    update: (id: string, updates: Partial<Agent>) => Promise<ApiResponse<Agent>>;
    delete: (id: string) => Promise<ApiResponse<void>>;
  };
  commands: {
    list: () => Promise<ApiResponse<Command[]>>;
    get: (id: string) => Promise<ApiResponse<Command>>;
    create: (command: Omit<Command, "id" | "timestamp" | "status">) => Promise<ApiResponse<Command>>;
    update: (id: string, updates: Partial<Command>) => Promise<ApiResponse<Command>>;
    delete: (id: string) => Promise<ApiResponse<void>>;
  };
  telemetry: {
    getMetrics: () => Promise<ApiResponse<SystemMetrics[]>>;
    getCurrentMetrics: () => Promise<ApiResponse<SystemMetrics>>;
  };
  workflow: {
    get: () => Promise<ApiResponse<Workflow>>;
    update: (workflow: Workflow) => Promise<ApiResponse<Workflow>>;
  };
}

export interface ApiConfig {
  baseUrl: string;
  headers?: Record<string, string>;
  timeout?: number;
}

export interface ApiError extends Error {
  code?: string;
  details?: unknown;
  response?: Response;
} 