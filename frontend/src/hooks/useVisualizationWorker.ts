import { useState, useEffect, useCallback, useRef } from 'react';

interface VisualizationSettings {
  fftSize?: number;
  smoothingTimeConstant?: number;
}

interface VisualizationWorkerState {
  isVisualizing: boolean;
  error: string | null;
}

export function useVisualizationWorker(audioContext: AudioContext | null) {
  const [state, setState] = useState<VisualizationWorkerState>({
    isVisualizing: false,
    error: null
  });

  const [worker, setWorker] = useState<Worker | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!audioContext || !canvasRef.current) return;

    // Create worker
    const visualizationWorker = new Worker(new URL('../workers/visualization.worker.ts', import.meta.url));

    // Handle worker errors
    visualizationWorker.onerror = (error) => {
      setState(prev => ({
        ...prev,
        isVisualizing: false,
        error: error.message
      }));
    };

    // Initialize visualization
    const canvas = canvasRef.current;
    const offscreenCanvas = canvas.transferControlToOffscreen();

    visualizationWorker.postMessage({
      type: 'init',
      payload: {
        audioContext,
        canvas: offscreenCanvas,
        width: canvas.width,
        height: canvas.height
      }
    }, [offscreenCanvas]);

    setWorker(visualizationWorker);

    // Cleanup
    return () => {
      visualizationWorker.terminate();
    };
  }, [audioContext]);

  const startVisualization = useCallback(() => {
    if (!worker) {
      throw new Error('Visualization worker not initialized');
    }

    worker.postMessage({ type: 'start' });
    setState(prev => ({ ...prev, isVisualizing: true }));
  }, [worker]);

  const stopVisualization = useCallback(() => {
    if (!worker) {
      throw new Error('Visualization worker not initialized');
    }

    worker.postMessage({ type: 'stop' });
    setState(prev => ({ ...prev, isVisualizing: false }));
  }, [worker]);

  const updateSettings = useCallback((settings: VisualizationSettings) => {
    if (!worker) {
      throw new Error('Visualization worker not initialized');
    }

    worker.postMessage({
      type: 'update',
      payload: settings
    });
  }, [worker]);

  return {
    ...state,
    canvasRef,
    startVisualization,
    stopVisualization,
    updateSettings
  };
} 