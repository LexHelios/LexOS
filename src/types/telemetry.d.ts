export interface SystemMetrics {
  timestamp: number;
  cpu: number;
  memory: number;
  gpu: number;
}

export interface CurrentMetrics {
  cpu: number;
  memory: number;
  gpu: number;
}

export interface MetricsHistory {
  metrics: SystemMetrics[];
  currentMetrics: CurrentMetrics;
}

export interface MetricsUpdate {
  timestamp: number;
  metrics: CurrentMetrics;
}

export interface MetricsError {
  message: string;
  code?: string;
  details?: unknown;
}

export interface MetricsResult {
  success: boolean;
  data?: MetricsHistory;
  error?: MetricsError;
} 