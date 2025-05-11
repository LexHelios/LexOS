import { useState, useEffect, useCallback, useRef } from 'react';
import * as Tone from 'tone';

interface AudioNode {
  id: string;
  type: string;
  node: Tone.ToneAudioNode;
  parameters: Record<string, number>;
}

interface AudioContextState {
  audioContext: AudioContext | null;
  audioNodes: AudioNode[];
  isInitialized: boolean;
  sampleRate: number;
  latency: number;
}

export const useAudioContext = () => {
  const [state, setState] = useState<AudioContextState>({
    audioContext: null,
    audioNodes: [],
    isInitialized: false,
    sampleRate: 44100,
    latency: 0
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioNodesRef = useRef<AudioNode[]>([]);

  // Initialize audio context
  const initialize = useCallback(async () => {
    try {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: state.sampleRate,
        latencyHint: 'interactive'
      });

      // Initialize Tone.js
      await Tone.start();
      Tone.setContext(context);

      audioContextRef.current = context;
      setState(prev => ({
        ...prev,
        audioContext: context,
        isInitialized: true
      }));

      // Create default audio nodes
      const nodes: AudioNode[] = [
        {
          id: 'master',
          type: 'master',
          node: Tone.getDestination(),
          parameters: {
            volume: 0,
            mute: 0
          }
        },
        {
          id: 'reverb',
          type: 'reverb',
          node: new Tone.Reverb({
            decay: 2.5,
            wet: 0.5
          }),
          parameters: {
            decay: 2.5,
            wet: 0.5
          }
        },
        {
          id: 'delay',
          type: 'delay',
          node: new Tone.FeedbackDelay({
            delayTime: 0.25,
            feedback: 0.5,
            wet: 0.5
          }),
          parameters: {
            delayTime: 0.25,
            feedback: 0.5,
            wet: 0.5
          }
        },
        {
          id: 'filter',
          type: 'filter',
          node: new Tone.Filter({
            frequency: 1000,
            type: 'lowpass',
            rolloff: -24
          }),
          parameters: {
            frequency: 1000,
            Q: 1,
            gain: 0
          }
        },
        {
          id: 'compressor',
          type: 'compressor',
          node: new Tone.Compressor({
            threshold: -24,
            ratio: 12,
            attack: 0.003,
            release: 0.25
          }),
          parameters: {
            threshold: -24,
            ratio: 12,
            attack: 0.003,
            release: 0.25
          }
        }
      ];

      audioNodesRef.current = nodes;
      setState(prev => ({
        ...prev,
        audioNodes: nodes
      }));

      // Connect nodes
      nodes.forEach(node => {
        if (node.type !== 'master') {
          node.node.connect(nodes[0].node);
        }
      });

    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }
  }, [state.sampleRate]);

  // Create new audio node
  const createNode = useCallback((type: string, parameters: Record<string, number>) => {
    let node: Tone.ToneAudioNode;

    switch (type) {
      case 'reverb':
        node = new Tone.Reverb(parameters);
        break;
      case 'delay':
        node = new Tone.FeedbackDelay(parameters);
        break;
      case 'filter':
        node = new Tone.Filter(parameters);
        break;
      case 'distortion':
        node = new Tone.Distortion(parameters);
        break;
      case 'chorus':
        node = new Tone.Chorus(parameters);
        break;
      case 'compressor':
        node = new Tone.Compressor(parameters);
        break;
      default:
        throw new Error(`Unknown node type: ${type}`);
    }

    const newNode: AudioNode = {
      id: `${type}-${Date.now()}`,
      type,
      node,
      parameters
    };

    audioNodesRef.current = [...audioNodesRef.current, newNode];
    setState(prev => ({
      ...prev,
      audioNodes: [...prev.audioNodes, newNode]
    }));

    return newNode;
  }, []);

  // Update node parameters
  const updateNode = useCallback((id: string, parameters: Record<string, number>) => {
    const node = audioNodesRef.current.find(n => n.id === id);
    if (node) {
      Object.entries(parameters).forEach(([param, value]) => {
        if (param in node.node) {
          (node.node as any)[param] = value;
        }
      });
      node.parameters = { ...node.parameters, ...parameters };

      setState(prev => ({
        ...prev,
        audioNodes: prev.audioNodes.map(n =>
          n.id === id ? { ...n, parameters: node.parameters } : n
        )
      }));
    }
  }, []);

  // Remove node
  const removeNode = useCallback((id: string) => {
    const node = audioNodesRef.current.find(n => n.id === id);
    if (node) {
      node.node.dispose();
      audioNodesRef.current = audioNodesRef.current.filter(n => n.id !== id);
      setState(prev => ({
        ...prev,
        audioNodes: prev.audioNodes.filter(n => n.id !== id)
      }));
    }
  }, []);

  // Process audio buffer
  const processBuffer = useCallback(async (buffer: AudioBuffer) => {
    if (!audioContextRef.current) return buffer;

    const offlineContext = new OfflineAudioContext(
      buffer.numberOfChannels,
      buffer.length,
      buffer.sampleRate
    );

    const source = offlineContext.createBufferSource();
    source.buffer = buffer;

    // Connect through all nodes
    let currentNode = source;
    audioNodesRef.current.forEach(node => {
      if (node.type !== 'master') {
        const offlineNode = node.node.clone();
        currentNode.connect(offlineNode);
        currentNode = offlineNode;
      }
    });

    currentNode.connect(offlineContext.destination);
    source.start();

    return offlineContext.startRendering();
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      audioNodesRef.current.forEach(node => {
        node.node.dispose();
      });
    };
  }, []);

  return {
    audioContext: state.audioContext,
    audioNodes: state.audioNodes,
    isInitialized: state.isInitialized,
    initialize,
    createNode,
    updateNode,
    removeNode,
    processBuffer
  };
}; 