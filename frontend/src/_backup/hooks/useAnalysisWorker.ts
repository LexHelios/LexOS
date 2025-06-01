import { useState, useEffect, useCallback } from 'react';

interface AnalysisResult {
  energy: number;
  bpm: number;
  key: string;
  danceability: number;
  stems: {
    type: string;
    energy: number;
    bpm: number;
    key: string;
    danceability: number;
  }[];
}

interface AnalysisWorkerState {
  isAnalyzing: boolean;
  progress: number;
  result: AnalysisResult | null;
  error: string | null;
}

export function useAnalysisWorker() {
  const [state, setState] = useState<AnalysisWorkerState>({
    isAnalyzing: false,
    progress: 0,
    result: null,
    error: null
  });

  const [worker, setWorker] = useState<Worker | null>(null);

  useEffect(() => {
    // Create worker
    const analysisWorker = new Worker(new URL('../workers/analysis.worker.ts', import.meta.url));

    // Handle messages from worker
    analysisWorker.onmessage = (event) => {
      const { type, payload } = event.data;

      switch (type) {
        case 'analysis':
          setState(prev => ({
            ...prev,
            isAnalyzing: false,
            progress: 100,
            result: payload,
            error: null
          }));
          break;

        case 'error':
          setState(prev => ({
            ...prev,
            isAnalyzing: false,
            error: payload
          }));
          break;

        case 'progress':
          setState(prev => ({
            ...prev,
            progress: payload
          }));
          break;
      }
    };

    // Handle worker errors
    analysisWorker.onerror = (error) => {
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: error.message
      }));
    };

    setWorker(analysisWorker);

    // Cleanup
    return () => {
      analysisWorker.terminate();
    };
  }, []);

  const analyzeTrack = useCallback(async (track: any) => {
    if (!worker) {
      throw new Error('Analysis worker not initialized');
    }

    setState(prev => ({
      ...prev,
      isAnalyzing: true,
      progress: 0,
      result: null,
      error: null
    }));

    worker.postMessage({ track });
  }, [worker]);

  const cancelAnalysis = useCallback(() => {
    if (worker) {
      worker.terminate();
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        progress: 0,
        error: 'Analysis cancelled'
      }));
    }
  }, [worker]);

  return {
    ...state,
    analyzeTrack,
    cancelAnalysis
  };
} 