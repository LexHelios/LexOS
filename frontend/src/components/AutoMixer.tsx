import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FiPlay, FiPause, FiSave, FiMusic, FiSettings } from 'react-icons/fi';
import useMusicStore from '../services/MusicService';

interface MixSettings {
  bpmRange: [number, number];
  keyCompatibility: boolean;
  genreMatch: boolean;
  transitionType: 'fade' | 'cut' | 'crossfade';
  transitionDuration: number;
  maxTracks: number;
}

const defaultSettings: MixSettings = {
  bpmRange: [120, 130],
  keyCompatibility: true,
  genreMatch: true,
  transitionType: 'crossfade',
  transitionDuration: 8,
  maxTracks: 10,
};

const keyCompatibilityMap: Record<string, string[]> = {
  'C': ['C', 'G', 'F', 'Am'],
  'G': ['G', 'C', 'D', 'Em'],
  'D': ['D', 'G', 'A', 'Bm'],
  'A': ['A', 'D', 'E', 'F#m'],
  'E': ['E', 'A', 'B', 'C#m'],
  'B': ['B', 'E', 'F#', 'G#m'],
  'F#': ['F#', 'B', 'C#', 'D#m'],
  'C#': ['C#', 'F#', 'G#', 'A#m'],
  'G#': ['G#', 'C#', 'D#', 'Fm'],
  'D#': ['D#', 'G#', 'A#', 'Cm'],
  'A#': ['A#', 'D#', 'F', 'Gm'],
  'F': ['F', 'A#', 'C', 'Dm'],
};

const AutoMixer: React.FC = () => {
  const { tracks, createMix, updateMix, setCurrentMix } = useMusicStore();
  const [settings, setSettings] = useState<MixSettings>(defaultSettings);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const compatibleTracks = useMemo(() => {
    return tracks.filter(track => {
      const bpmMatch = track.bpm >= settings.bpmRange[0] && track.bpm <= settings.bpmRange[1];
      
      if (!bpmMatch) return false;
      
      if (settings.keyCompatibility) {
        const compatibleKeys = keyCompatibilityMap[track.key] || [];
        return compatibleKeys.some(key => 
          tracks.some(t => t.key === key && t.id !== track.id)
        );
      }
      
      if (settings.genreMatch) {
        return tracks.some(t => t.genre === track.genre && t.id !== track.id);
      }
      
      return true;
    });
  }, [tracks, settings]);

  const generateMix = async () => {
    if (compatibleTracks.length < 2) {
      alert('Not enough compatible tracks found');
      return;
    }

    setIsGenerating(true);

    try {
      // Create new mix
      const mixId = crypto.randomUUID();
      createMix(`Auto Mix ${new Date().toLocaleTimeString()}`);

      // Sort tracks by BPM for smooth transitions
      const sortedTracks = [...compatibleTracks].sort((a, b) => a.bpm - b.bpm);
      const selectedTracks = sortedTracks.slice(0, settings.maxTracks);

      // Add tracks to mix
      updateMix(mixId, {
        tracks: selectedTracks,
        transitions: selectedTracks.slice(1).map((track, index) => ({
          fromTrackId: selectedTracks[index].id,
          toTrackId: track.id,
          type: settings.transitionType,
          duration: settings.transitionDuration,
          startTime: selectedTracks[index].duration - settings.transitionDuration,
        })),
      });

      setCurrentMix(mixId);
    } catch (error) {
      console.error('Error generating mix:', error);
      alert('Failed to generate mix');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-gray-900 text-white p-4 rounded">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Auto Mixer</h2>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="text-gray-400 hover:text-white"
          aria-label="Toggle settings"
        >
          <FiSettings />
        </button>
      </div>

      {showSettings && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-gray-800 p-4 rounded mb-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">BPM Range</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={settings.bpmRange[0]}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      bpmRange: [Number(e.target.value), settings.bpmRange[1]],
                    })
                  }
                  className="bg-gray-700 px-2 py-1 rounded w-20"
                  min="60"
                  max="200"
                  aria-label="Minimum BPM"
                  title="Minimum BPM"
                />
                <span>-</span>
                <input
                  type="number"
                  value={settings.bpmRange[1]}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      bpmRange: [settings.bpmRange[0], Number(e.target.value)],
                    })
                  }
                  className="bg-gray-700 px-2 py-1 rounded w-20"
                  min="60"
                  max="200"
                  aria-label="Maximum BPM"
                  title="Maximum BPM"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1">Transition Type</label>
              <select
                value={settings.transitionType}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    transitionType: e.target.value as MixSettings['transitionType'],
                  })
                }
                className="bg-gray-700 px-2 py-1 rounded w-full"
                aria-label="Transition type"
                title="Select transition type"
              >
                <option value="fade">Fade</option>
                <option value="cut">Cut</option>
                <option value="crossfade">Crossfade</option>
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1">Transition Duration (s)</label>
              <input
                type="number"
                value={settings.transitionDuration}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    transitionDuration: Number(e.target.value),
                  })
                }
                className="bg-gray-700 px-2 py-1 rounded w-full"
                min="1"
                max="30"
                aria-label="Transition duration in seconds"
                title="Transition duration in seconds"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Max Tracks</label>
              <input
                type="number"
                value={settings.maxTracks}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    maxTracks: Number(e.target.value),
                  })
                }
                className="bg-gray-700 px-2 py-1 rounded w-full"
                min="2"
                max="20"
                aria-label="Maximum number of tracks"
                title="Maximum number of tracks"
              />
            </div>

            <div className="col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.keyCompatibility}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      keyCompatibility: e.target.checked,
                    })
                  }
                  className="rounded"
                />
                <span>Key Compatibility</span>
              </label>
            </div>

            <div className="col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.genreMatch}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      genreMatch: e.target.checked,
                    })
                  }
                  className="rounded"
                />
                <span>Genre Matching</span>
              </label>
            </div>
          </div>
        </motion.div>
      )}

      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-400">
          {compatibleTracks.length} compatible tracks found
        </div>
        <button
          onClick={generateMix}
          disabled={isGenerating || compatibleTracks.length < 2}
          className="bg-blue-500 px-4 py-2 rounded flex items-center gap-2 disabled:opacity-50"
          aria-label="Generate mix"
        >
          {isGenerating ? (
            <>
              <FiMusic className="animate-spin" /> Generating...
            </>
          ) : (
            <>
              <FiPlay /> Generate Mix
            </>
          )}
        </button>
      </div>

      <div className="bg-gray-800 p-4 rounded">
        <h3 className="text-lg font-semibold mb-2">Compatible Tracks</h3>
        <div className="space-y-2">
          {compatibleTracks.map((track) => (
            <div
              key={track.id}
              className="bg-gray-700 p-2 rounded flex items-center justify-between"
            >
              <div>
                <div className="font-medium">{track.title}</div>
                <div className="text-sm text-gray-400">
                  {track.artist} • {track.bpm} BPM • {track.key} • {track.genre}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AutoMixer; 