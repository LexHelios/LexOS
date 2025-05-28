import { Agent } from "./agent";
import { Command } from "./command";
import { SystemMetrics } from "./telemetry";
import { Workflow } from "./workflow";

export interface ApiClient {
  agents: {
    list: () => Promise<Agent[]>;
    get: (id: string) => Promise<Agent>;
    create: (agent: Omit<Agent, "id">) => Promise<Agent>;
    update: (id: string, updates: Partial<Agent>) => Promise<Agent>;
    delete: (id: string) => Promise<void>;
  };
  commands: {
    list: () => Promise<Command[]>;
    get: (id: string) => Promise<Command>;
    create: (command: Omit<Command, "id" | "timestamp" | "status">) => Promise<Command>;
    update: (id: string, updates: Partial<Command>) => Promise<Command>;
    delete: (id: string) => Promise<void>;
  };
  telemetry: {
    getMetrics: () => Promise<SystemMetrics[]>;
    getCurrentMetrics: () => Promise<SystemMetrics>;
  };
  workflow: {
    get: () => Promise<Workflow>;
    update: (workflow: Workflow) => Promise<Workflow>;
  };
}

export interface ApiClientConfig {
  baseUrl: string;
  headers?: Record<string, string>;
  timeout?: number;
}

export interface ApiClientError extends Error {
  code?: string;
  details?: unknown;
  response?: Response;
} 