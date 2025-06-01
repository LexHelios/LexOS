export interface Mix {
  id: string;
  name: string;
  tracks: Track[];
  bpm: number;
  key: string;
  metadata: Record<string, any>;
}

export interface Track {
  id: string;
  name: string;
  audioUrl: string;
  volume: number;
  pan: number;
  effects: Effect[];
  transitions: Transition[];
  analysis: Record<string, any>;
  metadata: Record<string, any>;
}

export interface Effect {
  id: string;
  type: string;
  parameters: Record<string, any>;
  enabled: boolean;
}

export interface Transition {
  id: string;
  type: string;
  duration: number;
  targetTrackId: string;
  parameters: Record<string, any>;
}

export interface MusicStore {
  currentMix: Mix | null;
  mixes: Mix[];
  createMix: (name: string) => void;
  updateMix: (mixId: string, updates: Partial<Mix>) => void;
  deleteMix: (mixId: string) => void;
  setCurrentMix: (mixId: string) => void;
} 