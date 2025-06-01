import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number;
  url: string;
  waveform: number[];
  bpm: number;
  key: string;
  genre: string;
  tags: string[];
}

interface Mix {
  id: string;
  name: string;
  tracks: Track[];
  transitions: Transition[];
  createdAt: number;
  updatedAt: number;
}

interface Transition {
  fromTrackId: string;
  toTrackId: string;
  type: 'fade' | 'cut' | 'crossfade';
  duration: number;
  startTime: number;
}

interface MusicState {
  tracks: Track[];
  mixes: Mix[];
  currentMix: Mix | null;
  isPlaying: boolean;
  currentTime: number;
  volume: number;
  error: string | null;
}

interface MusicActions {
  addTrack: (track: Track) => void;
  removeTrack: (trackId: string) => void;
  createMix: (name: string) => void;
  updateMix: (mixId: string, updates: Partial<Mix>) => void;
  deleteMix: (mixId: string) => void;
  setCurrentMix: (mixId: string | null) => void;
  play: () => void;
  pause: () => void;
  setVolume: (volume: number) => void;
  setCurrentTime: (time: number) => void;
  addTransition: (transition: Transition) => void;
  removeTransition: (transitionId: string) => void;
  setError: (error: string | null) => void;
}

const useMusicStore = create<MusicState & MusicActions>()(
  persist(
    (set) => ({
      tracks: [],
      mixes: [],
      currentMix: null,
      isPlaying: false,
      currentTime: 0,
      volume: 1,
      error: null,

      addTrack: (track) =>
        set((state) => ({
          tracks: [...state.tracks, track],
        })),

      removeTrack: (trackId) =>
        set((state) => ({
          tracks: state.tracks.filter((t) => t.id !== trackId),
        })),

      createMix: (name) =>
        set((state) => ({
          mixes: [
            ...state.mixes,
            {
              id: crypto.randomUUID(),
              name,
              tracks: [],
              transitions: [],
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
          ],
        })),

      updateMix: (mixId, updates) =>
        set((state) => ({
          mixes: state.mixes.map((mix) =>
            mix.id === mixId
              ? { ...mix, ...updates, updatedAt: Date.now() }
              : mix
          ),
        })),

      deleteMix: (mixId) =>
        set((state) => ({
          mixes: state.mixes.filter((m) => m.id !== mixId),
          currentMix: state.currentMix?.id === mixId ? null : state.currentMix,
        })),

      setCurrentMix: (mixId) =>
        set((state) => ({
          currentMix: mixId
            ? state.mixes.find((m) => m.id === mixId) || null
            : null,
        })),

      play: () => set({ isPlaying: true }),
      pause: () => set({ isPlaying: false }),
      setVolume: (volume) => set({ volume }),
      setCurrentTime: (time) => set({ currentTime: time }),

      addTransition: (transition) =>
        set((state) => ({
          mixes: state.mixes.map((mix) =>
            mix.id === state.currentMix?.id
              ? {
                  ...mix,
                  transitions: [...mix.transitions, transition],
                  updatedAt: Date.now(),
                }
              : mix
          ),
        })),

      removeTransition: (transitionId) =>
        set((state) => ({
          mixes: state.mixes.map((mix) =>
            mix.id === state.currentMix?.id
              ? {
                  ...mix,
                  transitions: mix.transitions.filter(
                    (t) => t.id !== transitionId
                  ),
                  updatedAt: Date.now(),
                }
              : mix
          ),
        })),

      setError: (error) => set({ error }),
    }),
    {
      name: 'music-storage',
    }
  )
);

export default useMusicStore; 