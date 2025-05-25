import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiDownload, FiMusic, FiX } from 'react-icons/fi';
import useMusicStore from '../services/MusicService';

interface DownloadProgress {
  trackId: string;
  progress: number;
  status: 'downloading' | 'processing' | 'complete' | 'error';
  error?: string;
}

const MusicDownloader: React.FC = () => {
  const [url, setUrl] = useState('');
  const [downloads, setDownloads] = useState<DownloadProgress[]>([]);
  const { addTrack } = useMusicStore();

  const handleDownload = async () => {
    if (!url) return;

    const trackId = crypto.randomUUID();
    setDownloads((prev) => [
      ...prev,
      { trackId, progress: 0, status: 'downloading' },
    ]);

    try {
      // Simulate download progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        setDownloads((prev) =>
          prev.map((d) =>
            d.trackId === trackId
              ? { ...d, progress: i, status: 'downloading' }
              : d
          )
        );
      }

      // Simulate processing
      setDownloads((prev) =>
        prev.map((d) =>
          d.trackId === trackId ? { ...d, status: 'processing' } : d
        )
      );

      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Add track to library
      const track = {
        id: trackId,
        title: 'Downloaded Track',
        artist: 'Unknown Artist',
        duration: 180,
        url: url,
        waveform: Array.from({ length: 100 }, () => Math.random()),
        bpm: 120,
        key: 'C',
        genre: 'Unknown',
        tags: ['downloaded'],
      };

      addTrack(track);

      setDownloads((prev) =>
        prev.map((d) =>
          d.trackId === trackId ? { ...d, status: 'complete' } : d
        )
      );
    } catch (error) {
      setDownloads((prev) =>
        prev.map((d) =>
          d.trackId === trackId
            ? { ...d, status: 'error', error: 'Download failed' }
            : d
        )
      );
    }
  };

  const removeDownload = (trackId: string) => {
    setDownloads((prev) => prev.filter((d) => d.trackId !== trackId));
  };

  return (
    <div className="bg-gray-900 text-white p-4 rounded">
      <h2 className="text-xl font-bold mb-4">Music Downloader</h2>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter music URL"
          className="flex-1 bg-gray-800 px-3 py-2 rounded"
          aria-label="Music URL"
        />
        <button
          onClick={handleDownload}
          disabled={!url}
          className="bg-blue-500 px-4 py-2 rounded flex items-center gap-2 disabled:opacity-50"
          aria-label="Download music"
        >
          <FiDownload /> Download
        </button>
      </div>

      <div className="space-y-2">
        {downloads.map((download) => (
          <motion.div
            key={download.trackId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gray-800 p-3 rounded"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FiMusic />
                <span>
                  {download.status === 'downloading'
                    ? 'Downloading...'
                    : download.status === 'processing'
                    ? 'Processing...'
                    : download.status === 'complete'
                    ? 'Complete'
                    : 'Error'}
                </span>
              </div>
              <button
                onClick={() => removeDownload(download.trackId)}
                className="text-gray-400 hover:text-white"
                aria-label="Remove download"
              >
                <FiX />
              </button>
            </div>

            {download.status === 'downloading' && (
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${download.progress}%` }}
                />
              </div>
            )}

            {download.error && (
              <div className="text-red-500 text-sm mt-1">{download.error}</div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default MusicDownloader; 