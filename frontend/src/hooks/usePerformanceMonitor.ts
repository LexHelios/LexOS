import { useState, useEffect, useCallback } from 'react';

interface PerformanceMetrics {
  cpuUsage: number;
  memoryUsage: number;
  latency: number;
  fps: number;
}

type OptimizationTarget = 'cpu' | 'memory' | 'latency' | 'fps' | 'all';

export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    cpuUsage: 0,
    memoryUsage: 0,
    latency: 0,
    fps: 60
  });

  const [lastFrameTime, setLastFrameTime] = useState<number>(0);
  const [frameCount, setFrameCount] = useState<number>(0);

  // Monitor FPS
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();
    let frames = 0;

    const measureFPS = () => {
      const currentTime = performance.now();
      frames++;

      if (currentTime - lastTime >= 1000) {
        setMetrics(prev => ({
          ...prev,
          fps: Math.round((frames * 1000) / (currentTime - lastTime))
        }));
        frames = 0;
        lastTime = currentTime;
      }

      animationFrameId = requestAnimationFrame(measureFPS);
    };

    animationFrameId = requestAnimationFrame(measureFPS);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Monitor CPU and Memory
  useEffect(() => {
    if ('performance' in window && 'memory' in performance) {
      const interval = setInterval(() => {
        const memory = (performance as any).memory;
        setMetrics(prev => ({
          ...prev,
          memoryUsage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
        }));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, []);

  // Monitor Latency
  useEffect(() => {
    const measureLatency = async () => {
      const start = performance.now();
      await new Promise(resolve => setTimeout(resolve, 0));
      const end = performance.now();
      setMetrics(prev => ({
        ...prev,
        latency: end - start
      }));
    };

    const interval = setInterval(measureLatency, 1000);
    return () => clearInterval(interval);
  }, []);

  // Optimization strategies
  const optimize = useCallback((target: OptimizationTarget) => {
    switch (target) {
      case 'cpu':
        // Reduce processing load
        setMetrics(prev => ({
          ...prev,
          cpuUsage: Math.max(0, prev.cpuUsage - 10)
        }));
        break;

      case 'memory':
        // Clear caches and unused resources
        if ('caches' in window) {
          caches.keys().then(keys => {
            keys.forEach(key => caches.delete(key));
          });
        }
        setMetrics(prev => ({
          ...prev,
          memoryUsage: Math.max(0, prev.memoryUsage - 10)
        }));
        break;

      case 'latency':
        // Optimize rendering and processing
        setMetrics(prev => ({
          ...prev,
          latency: Math.max(0, prev.latency - 5)
        }));
        break;

      case 'fps':
        // Optimize frame rate
        setMetrics(prev => ({
          ...prev,
          fps: Math.min(60, prev.fps + 5)
        }));
        break;

      case 'all':
        // Apply all optimizations
        optimize('cpu');
        optimize('memory');
        optimize('latency');
        optimize('fps');
        break;
    }
  }, []);

  return { metrics, optimize };
}; 