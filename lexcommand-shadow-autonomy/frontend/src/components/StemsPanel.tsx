import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMusic, FiMic, FiDrum, FiRadio, FiVolume2, FiSliders } from 'react-icons/fi';

interface Stem {
  id: string;
  type: 'vocals' | 'drums' | 'bass' | 'melody';
  volume: number;
  solo: boolean;
  mute: boolean;
  effects: {
    reverb: number;
    delay: number;
    filter: number;
  };
}

const StemsPanel: React.FC = () => {
  const [stems, setStems] = useState<Stem[]>([
    { id: 'vocals', type: 'vocals', volume: 100, solo: false, mute: false, effects: { reverb: 0, delay: 0, filter: 0 } },
    { id: 'drums', type: 'drums', volume: 100, solo: false, mute: false, effects: { reverb: 0, delay: 0, filter: 0 } },
    { id: 'bass', type: 'bass', volume: 100, solo: false, mute: false, effects: { reverb: 0, delay: 0, filter: 0 } },
    { id: 'melody', type: 'melody', volume: 100, solo: false, mute: false, effects: { reverb: 0, delay: 0, filter: 0 } }
  ]);
  const [showEffects, setShowEffects] = useState<Record<string, boolean>>({});

  const handleVolumeChange = useCallback((stemId: string, value: number) => {
    setStems(prev => prev.map(stem => 
      stem.id === stemId ? { ...stem, volume: value } : stem
    ));
  }, []);

  const toggleSolo = useCallback((stemId: string) => {
    setStems(prev => prev.map(stem => ({
      ...stem,
      solo: stem.id === stemId ? !stem.solo : false
    })));
  }, []);

  const toggleMute = useCallback((stemId: string) => {
    setStems(prev => prev.map(stem => 
      stem.id === stemId ? { ...stem, mute: !stem.mute } : stem
    ));
  }, []);

  const handleEffectChange = useCallback((stemId: string, effect: string, value: number) => {
    setStems(prev => prev.map(stem => 
      stem.id === stemId ? {
        ...stem,
        effects: { ...stem.effects, [effect]: value }
      } : stem
    ));
  }, []);

  const getStemIcon = (type: string) => {
    switch (type) {
      case 'vocals': return <FiMic className="text-pink-400" />;
      case 'drums': return <FiDrum className="text-yellow-400" />;
      case 'bass': return <FiRadio className="text-green-400" />;
      case 'melody': return <FiMusic className="text-blue-400" />;
      default: return <FiMusic />;
    }
  };

  return (
    <div className="bg-gray-800/80 backdrop-blur-sm p-4 rounded border border-blue-500/30">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-blue-400 flex items-center gap-2">
          <FiSliders className="text-purple-400" />
          Stems Control
        </h3>
      </div>

      <div className="space-y-4">
        {stems.map(stem => (
          <div key={stem.id} className="bg-gray-700/50 p-3 rounded border border-gray-600/30">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getStemIcon(stem.type)}
                <span className="font-medium capitalize">{stem.type}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleSolo(stem.id)}
                  className={`p-1 rounded ${stem.solo ? 'bg-yellow-500 text-black' : 'bg-gray-600 text-gray-300'}`}
                  title={`Solo ${stem.type}`}
                >
                  S
                </button>
                <button
                  onClick={() => toggleMute(stem.id)}
                  className={`p-1 rounded ${stem.mute ? 'bg-red-500 text-white' : 'bg-gray-600 text-gray-300'}`}
                  title={`Mute ${stem.type}`}
                >
                  M
                </button>
                <button
                  onClick={() => setShowEffects(prev => ({ ...prev, [stem.id]: !prev[stem.id] }))}
                  className="p-1 rounded bg-gray-600 text-gray-300"
                  title={`Toggle effects for ${stem.type}`}
                >
                  <FiSliders />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <FiVolume2 className="text-gray-400" />
              <input
                type="range"
                min="0"
                max="100"
                value={stem.volume}
                onChange={(e) => handleVolumeChange(stem.id, Number(e.target.value))}
                className="flex-1"
                disabled={stem.mute}
                aria-label={`Volume control for ${stem.type}`}
                title={`Adjust volume for ${stem.type}`}
              />
              <span className="text-sm text-gray-400 w-12 text-right">{stem.volume}%</span>
            </div>

            <AnimatePresence>
              {showEffects[stem.id] && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 pt-2 border-t border-gray-600/30"
                >
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm text-gray-400">Reverb</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={stem.effects.reverb}
                        onChange={(e) => handleEffectChange(stem.id, 'reverb', Number(e.target.value))}
                        className="w-full"
                        aria-label={`Reverb control for ${stem.type}`}
                        title={`Adjust reverb for ${stem.type}`}
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Delay</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={stem.effects.delay}
                        onChange={(e) => handleEffectChange(stem.id, 'delay', Number(e.target.value))}
                        className="w-full"
                        aria-label={`Delay control for ${stem.type}`}
                        title={`Adjust delay for ${stem.type}`}
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Filter</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={stem.effects.filter}
                        onChange={(e) => handleEffectChange(stem.id, 'filter', Number(e.target.value))}
                        className="w-full"
                        aria-label={`Filter control for ${stem.type}`}
                        title={`Adjust filter for ${stem.type}`}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StemsPanel; 