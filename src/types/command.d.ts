export interface Command {
  id: string;
  text: string;
  timestamp: number;
  status: "pending" | "running" | "completed" | "error";
  error?: string;
}

export interface CommandInput {
  text: string;
}

export interface CommandResponse {
  id: string;
  status: "running" | "completed" | "error";
  error?: string;
}

export interface CommandError {
  message: string;
  code?: string;
  details?: unknown;
}

export interface CommandResult {
  success: boolean;
  data?: unknown;
  error?: CommandError;
} 