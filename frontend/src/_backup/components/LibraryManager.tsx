import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMusic, FiFolder, FiTag, FiStar, FiSearch, FiFilter, FiUpload, FiDownload, FiRefreshCw } from 'react-icons/fi';

interface Track {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  key: string;
  genre: string;
  tags: string[];
  rating: number;
  lastPlayed: Date;
  playCount: number;
}

interface Playlist {
  id: string;
  name: string;
  type: 'manual' | 'smart';
  tracks: Track[];
  criteria?: {
    bpm?: { min: number; max: number };
    key?: string[];
    genre?: string[];
    tags?: string[];
    rating?: number;
  };
}

const LibraryManager: React.FC = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleTagFilter = useCallback((tag: string) => {
    setFilterTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  }, []);

  const createSmartPlaylist = useCallback((criteria: Playlist['criteria']) => {
    const newPlaylist: Playlist = {
      id: Date.now().toString(),
      name: `Smart Playlist ${playlists.length + 1}`,
      type: 'smart',
      tracks: [],
      criteria
    };
    setPlaylists(prev => [...prev, newPlaylist]);
  }, [playlists.length]);

  const analyzeTracks = useCallback(async () => {
    setIsAnalyzing(true);
    try {
      // Simulate track analysis
      await new Promise(resolve => setTimeout(resolve, 2000));
      // Update tracks with analyzed data
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const syncLibrary = useCallback(async () => {
    setIsSyncing(true);
    try {
      // Simulate cloud sync
      await new Promise(resolve => setTimeout(resolve, 2000));
      // Update library with synced data
    } finally {
      setIsSyncing(false);
    }
  }, []);

  return (
    <div className="bg-gray-800/80 backdrop-blur-sm p-4 rounded border border-blue-500/30">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-blue-400 flex items-center gap-2">
          <FiMusic className="text-purple-400" />
          Library Manager
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={analyzeTracks}
            disabled={isAnalyzing}
            className="p-2 rounded bg-blue-500 hover:bg-blue-600 disabled:opacity-50"
            title="Analyze tracks"
          >
            <FiRefreshCw className={isAnalyzing ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={syncLibrary}
            disabled={isSyncing}
            className="p-2 rounded bg-green-500 hover:bg-green-600 disabled:opacity-50"
            title="Sync library"
          >
            <FiDownload className={isSyncing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="mb-4">
        <div className="flex gap-2 mb-2">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search tracks..."
              className="w-full pl-8 pr-4 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              aria-label="Search tracks"
            />
          </div>
          <button
            onClick={() => setFilterTags([])}
            className="px-3 py-2 bg-gray-700 rounded hover:bg-gray-600"
            title="Clear filters"
          >
            <FiFilter />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {['House', 'Techno', 'Trance', 'Drum & Bass'].map(tag => (
            <button
              key={tag}
              onClick={() => handleTagFilter(tag)}
              className={`px-2 py-1 rounded text-sm ${
                filterTags.includes(tag)
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              title={`Filter by ${tag}`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Playlists */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-2">Playlists</h4>
          <div className="space-y-2">
            {playlists.map(playlist => (
              <div
                key={playlist.id}
                className={`p-2 rounded cursor-pointer ${
                  selectedPlaylist === playlist.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
                onClick={() => setSelectedPlaylist(playlist.id)}
              >
                <div className="flex items-center gap-2">
                  {playlist.type === 'smart' ? <FiStar /> : <FiFolder />}
                  <span>{playlist.name}</span>
                </div>
                <div className="text-sm text-gray-400">
                  {playlist.tracks.length} tracks
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Track List */}
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-2">Tracks</h4>
          <div className="space-y-2">
            {tracks.map(track => (
              <div
                key={track.id}
                className="p-2 rounded bg-gray-700 hover:bg-gray-600"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{track.title}</div>
                    <div className="text-sm text-gray-400">{track.artist}</div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <div>{track.bpm} BPM</div>
                    <div>{track.key}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {track.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-1 py-0.5 text-xs rounded bg-gray-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LibraryManager; 