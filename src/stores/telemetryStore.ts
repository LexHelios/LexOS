import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface SystemMetrics {
  timestamp: number;
  cpu: number;
  memory: number;
  gpu: number;
}

interface TelemetryState {
  metrics: SystemMetrics[];
  currentMetrics: {
    cpu: number;
    memory: number;
    gpu: number;
  };
  actions: {
    addMetrics: (metrics: SystemMetrics) => void;
    updateCurrentMetrics: (metrics: Partial<SystemMetrics>) => void;
    clearMetrics: () => void;
  };
}

const MAX_METRICS_HISTORY = 100;

const useTelemetryStore = create<TelemetryState>()(
  devtools(
    (set) => ({
      metrics: [],
      currentMetrics: {
        cpu: 0,
        memory: 0,
        gpu: 0,
      },
      actions: {
        addMetrics: (metrics) =>
          set((state) => ({
            metrics: [...state.metrics, metrics].slice(-MAX_METRICS_HISTORY),
            currentMetrics: {
              cpu: metrics.cpu,
              memory: metrics.memory,
              gpu: metrics.gpu,
            },
          })),
        updateCurrentMetrics: (metrics) =>
          set((state) => ({
            currentMetrics: {
              ...state.currentMetrics,
              ...metrics,
            },
          })),
        clearMetrics: () =>
          set({
            metrics: [],
            currentMetrics: {
              cpu: 0,
              memory: 0,
              gpu: 0,
            },
          }),
      },
    }),
    {
      name: "telemetry-store",
    }
  )
);

export default useTelemetryStore; 