import { useState, useEffect, useCallback, useRef } from 'react';

interface VideoNode {
  id: string;
  type: string;
  element: HTMLVideoElement;
  effects: {
    opacity: number;
    scale: number;
    rotation: number;
    blendMode: string;
  };
}

interface VideoContextState {
  videoContext: HTMLVideoElement | null;
  videoNodes: VideoNode[];
  isInitialized: boolean;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
}

export const useVideoContext = () => {
  const [state, setState] = useState<VideoContextState>({
    videoContext: null,
    videoNodes: [],
    isInitialized: false,
    currentTime: 0,
    duration: 0,
    isPlaying: false
  });

  const videoContextRef = useRef<HTMLVideoElement | null>(null);
  const videoNodesRef = useRef<VideoNode[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number>();

  // Initialize video context
  const initialize = useCallback(() => {
    try {
      const video = document.createElement('video');
      video.autoplay = false;
      video.playsInline = true;
      video.crossOrigin = 'anonymous';

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (ctx) {
        videoContextRef.current = video;
        canvasRef.current = canvas;
        setState(prev => ({
          ...prev,
          videoContext: video,
          isInitialized: true
        }));
      }
    } catch (error) {
      console.error('Failed to initialize video context:', error);
    }
  }, []);

  // Create new video node
  const createNode = useCallback((type: string, source: string) => {
    const video = document.createElement('video');
    video.src = source;
    video.autoplay = false;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';

    const newNode: VideoNode = {
      id: `${type}-${Date.now()}`,
      type,
      element: video,
      effects: {
        opacity: 1,
        scale: 1,
        rotation: 0,
        blendMode: 'normal'
      }
    };

    videoNodesRef.current = [...videoNodesRef.current, newNode];
    setState(prev => ({
      ...prev,
      videoNodes: [...prev.videoNodes, newNode]
    }));

    return newNode;
  }, []);

  // Update node effects
  const updateNode = useCallback((id: string, effects: Partial<VideoNode['effects']>) => {
    const node = videoNodesRef.current.find(n => n.id === id);
    if (node) {
      node.effects = { ...node.effects, ...effects };
      setState(prev => ({
        ...prev,
        videoNodes: prev.videoNodes.map(n =>
          n.id === id ? { ...n, effects: node.effects } : n
        )
      }));
    }
  }, []);

  // Remove node
  const removeNode = useCallback((id: string) => {
    const node = videoNodesRef.current.find(n => n.id === id);
    if (node) {
      node.element.pause();
      node.element.src = '';
      videoNodesRef.current = videoNodesRef.current.filter(n => n.id !== id);
      setState(prev => ({
        ...prev,
        videoNodes: prev.videoNodes.filter(n => n.id !== id)
      }));
    }
  }, []);

  // Process video frame
  const processFrame = useCallback((frame: VideoFrame) => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        // Apply effects to frame
        ctx.save();
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';

        videoNodesRef.current.forEach(node => {
          if (node.element.readyState >= 2) {
            ctx.globalAlpha = node.effects.opacity;
            ctx.globalCompositeOperation = node.effects.blendMode as GlobalCompositeOperation;

            const { width, height } = canvasRef.current!;
            const scale = node.effects.scale;
            const rotation = node.effects.rotation;

            ctx.translate(width / 2, height / 2);
            ctx.rotate((rotation * Math.PI) / 180);
            ctx.scale(scale, scale);
            ctx.translate(-width / 2, -height / 2);

            ctx.drawImage(node.element, 0, 0, width, height);
          }
        });

        ctx.restore();
      }
    }
  }, []);

  // Play all videos
  const play = useCallback(async () => {
    try {
      await Promise.all(
        videoNodesRef.current.map(node => node.element.play())
      );
      setState(prev => ({ ...prev, isPlaying: true }));
    } catch (error) {
      console.error('Failed to play videos:', error);
    }
  }, []);

  // Pause all videos
  const pause = useCallback(() => {
    videoNodesRef.current.forEach(node => node.element.pause());
    setState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  // Seek all videos
  const seek = useCallback((time: number) => {
    videoNodesRef.current.forEach(node => {
      node.element.currentTime = time;
    });
    setState(prev => ({ ...prev, currentTime: time }));
  }, []);

  // Render loop
  const render = useCallback(() => {
    if (canvasRef.current && videoNodesRef.current.length > 0) {
      const frame = new VideoFrame(canvasRef.current);
      processFrame(frame);
      frame.close();

      animationFrameRef.current = requestAnimationFrame(render);
    }
  }, [processFrame]);

  // Start render loop
  useEffect(() => {
    if (state.isPlaying) {
      render();
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [state.isPlaying, render]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      videoNodesRef.current.forEach(node => {
        node.element.pause();
        node.element.src = '';
      });
    };
  }, []);

  return {
    videoContext: state.videoContext,
    videoNodes: state.videoNodes,
    isInitialized: state.isInitialized,
    currentTime: state.currentTime,
    duration: state.duration,
    isPlaying: state.isPlaying,
    initialize,
    createNode,
    updateNode,
    removeNode,
    play,
    pause,
    seek
  };
}; 