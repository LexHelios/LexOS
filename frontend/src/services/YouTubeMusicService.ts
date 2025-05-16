import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface YouTubeTrack {
  id: string;
  videoId: string;
  title: string;
  artist: string;
  duration: number;
  thumbnail: string;
  url: string;
  waveform: number[];
  bpm: number;
  key: string;
  genre: string;
  tags: string[];
  status: 'pending' | 'downloading' | 'processing' | 'complete' | 'error';
  error?: string;
  progress: number;
}

interface YouTubeMusicState {
  tracks: YouTubeTrack[];
  isSearching: boolean;
  searchResults: YouTubeTrack[];
  error: string | null;
}

interface YouTubeMusicActions {
  searchTracks: (query: string) => Promise<void>;
  downloadTrack: (track: YouTubeTrack) => Promise<void>;
  removeTrack: (trackId: string) => void;
  clearError: () => void;
}

const useYouTubeMusicStore = create<YouTubeMusicState & YouTubeMusicActions>()(
  persist(
    (set, get) => ({
      tracks: [],
      isSearching: false,
      searchResults: [],
      error: null,

      searchTracks: async (query: string) => {
        set({ isSearching: true, error: null });
        try {
          const response = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}`);
          if (!response.ok) throw new Error('Search failed');
          
          const data = await response.json();
          set({ searchResults: data.items });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Search failed' });
        } finally {
          set({ isSearching: false });
        }
      },

      downloadTrack: async (track: YouTubeTrack) => {
        set((state) => ({
          tracks: [
            ...state.tracks,
            { ...track, status: 'downloading', progress: 0 },
          ],
        }));

        try {
          // Start download
          const response = await fetch(`/api/youtube/download`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ videoId: track.videoId }),
          });

          if (!response.ok) throw new Error('Download failed');

          const reader = response.body?.getReader();
          if (!reader) throw new Error('No response stream');

          // Process download stream
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            // Update progress
            set((state) => ({
              tracks: state.tracks.map((t) =>
                t.id === track.id
                  ? { ...t, progress: Math.min(t.progress + 10, 90) }
                  : t
              ),
            }));
          }

          // Process audio
          set((state) => ({
            tracks: state.tracks.map((t) =>
              t.id === track.id ? { ...t, status: 'processing' } : t
            ),
          }));

          // Extract metadata and generate waveform
          const processResponse = await fetch(`/api/youtube/process`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ videoId: track.videoId }),
          });

          if (!processResponse.ok) throw new Error('Processing failed');

          const processedData = await processResponse.json();

          // Update track with processed data
          set((state) => ({
            tracks: state.tracks.map((t) =>
              t.id === track.id
                ? {
                    ...t,
                    ...processedData,
                    status: 'complete',
                    progress: 100,
                  }
                : t
            ),
          }));
        } catch (error) {
          set((state) => ({
            tracks: state.tracks.map((t) =>
              t.id === track.id
                ? {
                    ...t,
                    status: 'error',
                    error: error instanceof Error ? error.message : 'Download failed',
                  }
                : t
            ),
          }));
        }
      },

      removeTrack: (trackId: string) => {
        set((state) => ({
          tracks: state.tracks.filter((t) => t.id !== trackId),
        }));
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'youtube-music-storage',
    }
  )
);

export default useYouTubeMusicStore; 