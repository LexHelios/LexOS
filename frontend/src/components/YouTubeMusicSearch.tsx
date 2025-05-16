import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiDownload, FiMusic, FiX, FiClock, FiInfo } from 'react-icons/fi';
import useYouTubeMusicStore from '../services/YouTubeMusicService';
import useMusicStore from '../services/MusicService';

const YouTubeMusicSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const { searchTracks, downloadTrack, removeTrack, isSearching, searchResults, error } = useYouTubeMusicStore();
  const { addTrack } = useMusicStore();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    await searchTracks(query);
  };

  const handleDownload = async (track: any) => {
    await downloadTrack(track);
    // Add to music library when download is complete
    if (track.status === 'complete') {
      addTrack({
        id: track.id,
        title: track.title,
        artist: track.artist,
        duration: track.duration,
        url: track.url,
        waveform: track.waveform,
        bpm: track.bpm,
        key: track.key,
        genre: track.genre,
        tags: [...track.tags, 'youtube'],
      });
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-gray-900 text-white p-4 rounded">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-xl font-bold">YouTube Music Search</h2>
        <div className="group relative">
          <FiInfo className="text-gray-400 cursor-help" />
          <div className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-gray-800 rounded shadow-lg text-sm hidden group-hover:block z-10">
            Search for music on YouTube. Download tracks to add them to your music library. Each track will be analyzed for BPM, key, and genre.
          </div>
        </div>
      </div>

      <form onSubmit={handleSearch} className="mb-4">
        <div className="flex gap-2">
          <div className="flex-1 relative group">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for music..."
              className="w-full bg-gray-800 px-3 py-2 rounded pr-8"
              aria-label="Search query"
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-gray-300">
              <FiSearch />
            </div>
          </div>
          <button
            type="submit"
            disabled={isSearching || !query.trim()}
            className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded flex items-center gap-2 disabled:opacity-50 transition-colors"
            aria-label="Search music"
            title={isSearching ? "Searching..." : "Search for music"}
          >
            {isSearching ? (
              <>
                <FiMusic className="animate-spin" /> Searching...
              </>
            ) : (
              <>
                <FiSearch /> Search
              </>
            )}
          </button>
        </div>
      </form>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500 text-white p-2 mb-4 rounded flex items-center gap-2"
        >
          <FiX className="flex-shrink-0" />
          <span>{error}</span>
        </motion.div>
      )}

      <div className="space-y-4">
        <AnimatePresence>
          {searchResults.map((track) => (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-gray-800 p-4 rounded hover:bg-gray-750 transition-colors"
            >
              <div className="flex gap-4">
                <div className="relative group">
                  <img
                    src={track.thumbnail}
                    alt={track.title}
                    className="w-24 h-24 object-cover rounded"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity flex items-center justify-center">
                    <FiInfo className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium group">
                        {track.title}
                        <div className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-gray-800 rounded shadow-lg text-sm hidden group-hover:block z-10">
                          Click download to add this track to your music library
                        </div>
                      </h3>
                      <p className="text-sm text-gray-400">{track.artist}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400" title="Track duration">
                      <FiClock />
                      <span>{formatDuration(track.duration)}</span>
                    </div>
                  </div>

                  <div className="mt-2">
                    {track.status === 'downloading' && (
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${track.progress}%` }}
                          title={`Downloading: ${track.progress}%`}
                        />
                      </div>
                    )}

                    {track.status === 'processing' && (
                      <div className="text-blue-400 flex items-center gap-2">
                        <FiMusic className="animate-spin" />
                        <span>Processing audio...</span>
                      </div>
                    )}

                    {track.status === 'error' && (
                      <div className="text-red-500 flex items-center gap-2">
                        <FiX />
                        <span>{track.error}</span>
                      </div>
                    )}

                    {track.status === 'complete' && (
                      <div className="text-green-500 flex items-center gap-2">
                        <FiMusic />
                        <span>Ready to mix!</span>
                      </div>
                    )}

                    {!track.status && (
                      <button
                        onClick={() => handleDownload(track)}
                        className="bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded flex items-center gap-1 text-sm transition-colors"
                        aria-label={`Download ${track.title}`}
                        title="Download and analyze this track"
                      >
                        <FiDownload /> Download
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default YouTubeMusicSearch; 