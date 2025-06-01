import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { websocketBus } from '../services/WebSocketBus';

export interface SystemMetrics {
  timestamp: number;
  cpu_usage: number;
  memory_usage: number;
  api_requests: number;
  latency: number;
  error_rate: number;
}

export interface MetricsState {
  data: SystemMetrics[];
  isLoading: boolean;
  error: string | null;
  trend: {
    cpu: number;
    memory: number;
    requests: number;
    latency: number;
    error_rate: number;
  };
}

const calculateTrend = (current: number, previous: number): number => {
  if (!previous) return 0;
  return ((current - previous) / previous) * 100;
};

const fetchMetrics = async (): Promise<SystemMetrics> => {
  const response = await fetch('/api/metrics');
  if (!response.ok) {
    throw new Error('Failed to fetch metrics');
  }
  return response.json();
};

export const useRealTimeMetrics = (pollInterval = 5000): MetricsState => {
  const [metrics, setMetrics] = useState<SystemMetrics[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Polling query
  const { data: polledData, isLoading } = useQuery<SystemMetrics>({
    queryKey: ['metrics'],
    queryFn: fetchMetrics,
    refetchInterval: pollInterval,
    onError: (err) => setError(err instanceof Error ? err.message : 'Unknown error'),
  });

  // WebSocket subscription
  useEffect(() => {
    const unsubscribe = websocketBus.subscribe<SystemMetrics>('metrics_update', (data) => {
      setMetrics((prev) => {
        const newMetrics = [...prev, data].slice(-30); // Keep last 30 data points
        return newMetrics;
      });
    });

    return () => unsubscribe();
  }, []);

  // Update metrics when polling data arrives
  useEffect(() => {
    if (polledData) {
      setMetrics((prev) => {
        const newMetrics = [...prev, polledData].slice(-30);
        return newMetrics;
      });
    }
  }, [polledData]);

  // Calculate trends
  const calculateTrends = useCallback((): MetricsState['trend'] => {
    if (metrics.length < 2) {
      return {
        cpu: 0,
        memory: 0,
        requests: 0,
        latency: 0,
        error_rate: 0,
      };
    }

    const current = metrics[metrics.length - 1];
    const previous = metrics[metrics.length - 2];

    return {
      cpu: calculateTrend(current.cpu_usage, previous.cpu_usage),
      memory: calculateTrend(current.memory_usage, previous.memory_usage),
      requests: calculateTrend(current.api_requests, previous.api_requests),
      latency: calculateTrend(current.latency, previous.latency),
      error_rate: calculateTrend(current.error_rate, previous.error_rate),
    };
  }, [metrics]);

  return {
    data: metrics,
    isLoading,
    error,
    trend: calculateTrends(),
  };
}; 