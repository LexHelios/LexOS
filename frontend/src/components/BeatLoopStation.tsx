import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlay, FiPause, FiPlus, FiTrash2, FiCpu, FiZap, FiGrid, FiClock, FiMusic } from 'react-icons/fi';

interface BeatLoop {
  id: string;
  name: string;
  bpm: number;
  pattern: boolean[][];
  effects: string[];
  isPlaying: boolean;
}

const BeatLoopStation: React.FC = () => {
  const [loops, setLoops] = useState<BeatLoop[]>([]);
  const [selectedLoop, setSelectedLoop] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  const generateBeatPattern = useCallback(() => {
    setIsGenerating(true);
    // Simulate AI beat generation
    setTimeout(() => {
      const newLoop: BeatLoop = {
        id: Date.now().toString(),
        name: `AI Beat ${loops.length + 1}`,
        bpm: Math.floor(Math.random() * 40) + 80, // 80-120 BPM
        pattern: Array(16).fill(null).map(() => 
          Array(4).fill(null).map(() => Math.random() > 0.7)
        ),
        effects: ['reverb', 'delay'],
        isPlaying: false
      };
      setLoops(prev => [...prev, newLoop]);
      setIsGenerating(false);
    }, 1500);
  }, [loops.length]);

  const toggleLoop = useCallback((id: string) => {
    setLoops(prev => prev.map(loop => 
      loop.id === id ? { ...loop, isPlaying: !loop.isPlaying } : loop
    ));
  }, []);

  const deleteLoop = useCallback((id: string) => {
    setLoops(prev => prev.filter(loop => loop.id !== id));
    if (selectedLoop === id) {
      setSelectedLoop(null);
    }
  }, [selectedLoop]);

  return (
    <div className="bg-gray-800/80 backdrop-blur-sm p-4 rounded border border-blue-500/30 shadow-[0_0_15px_rgba(32,128,255,0.1)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-blue-400 flex items-center gap-2">
          <FiMusic className="text-purple-400" />
          Beat Loop Station
        </h3>
        <button
          onClick={generateBeatPattern}
          disabled={isGenerating}
          className="bg-purple-500 hover:bg-purple-600 px-3 py-1 rounded text-sm flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-purple-400/30"
        >
          <FiCpu className={isGenerating ? 'animate-spin' : ''} />
          {isGenerating ? 'Generating...' : 'Generate Beat'}
        </button>
      </div>

      <div className="space-y-4">
        {loops.map((loop) => (
          <motion.div
            key={loop.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-3 rounded border ${
              selectedLoop === loop.id
                ? 'border-purple-500/50 bg-purple-500/10'
                : 'border-blue-500/30 bg-gray-700/50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleLoop(loop.id)}
                  className={`p-1 rounded transition-colors ${
                    loop.isPlaying
                      ? 'bg-green-500 hover:bg-green-600'
                      : 'bg-blue-500 hover:bg-blue-600'
                  }`}
                >
                  {loop.isPlaying ? <FiPause /> : <FiPlay />}
                </button>
                <span className="font-medium">{loop.name}</span>
                <span className="text-sm text-gray-400 flex items-center gap-1">
                  <FiClock className="text-blue-400" />
                  {loop.bpm} BPM
                </span>
              </div>
              <button
                onClick={() => deleteLoop(loop.id)}
                className="text-red-400 hover:text-red-300 transition-colors"
              >
                <FiTrash2 />
              </button>
            </div>

            <div className="grid grid-cols-16 gap-1 mb-2">
              {loop.pattern.map((row, rowIndex) => (
                <div key={rowIndex} className="flex gap-1">
                  {row.map((active, colIndex) => (
                    <div
                      key={colIndex}
                      className={`w-4 h-4 rounded transition-colors ${
                        active
                          ? 'bg-purple-500'
                          : 'bg-gray-600'
                      } ${
                        currentStep === colIndex && loop.isPlaying
                          ? 'ring-2 ring-blue-400'
                          : ''
                      }`}
                    />
                  ))}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {loop.effects.map((effect) => (
                <span
                  key={effect}
                  className="px-2 py-1 text-xs rounded bg-blue-500/20 text-blue-300 border border-blue-500/30"
                >
                  {effect}
                </span>
              ))}
            </div>
          </motion.div>
        ))}

        {loops.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            <FiMusic className="mx-auto text-4xl mb-2" />
            <p>No beat loops yet</p>
            <p className="text-sm">Generate a new beat or create your own</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BeatLoopStation; 