import React, { useEffect } from 'react';
import { useVisualizationWorker } from '../hooks/useVisualizationWorker';

interface AudioVisualizerProps {
  audioContext: AudioContext | null;
  width?: number;
  height?: number;
  className?: string;
}

export function AudioVisualizer({
  audioContext,
  width = 800,
  height = 200,
  className = ''
}: AudioVisualizerProps) {
  const {
    canvasRef,
    isVisualizing,
    error,
    startVisualization,
    stopVisualization,
    updateSettings
  } = useVisualizationWorker(audioContext);

  useEffect(() => {
    if (audioContext) {
      startVisualization();
    }
    return () => {
      stopVisualization();
    };
  }, [audioContext, startVisualization, stopVisualization]);

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="w-full h-full bg-black rounded-lg"
      />
      {!isVisualizing && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
          <div className="text-white">No audio input</div>
        </div>
      )}
    </div>
  );
} 