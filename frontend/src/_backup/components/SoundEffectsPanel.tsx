import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiZap, FiCpu, FiSliders, FiPlus, FiTrash2, FiVolume2, FiWaveSquare } from 'react-icons/fi';

interface Effect {
  id: string;
  name: string;
  type: string;
  parameters: {
    [key: string]: number;
  };
  isActive: boolean;
}

const SoundEffectsPanel: React.FC = () => {
  const [effects, setEffects] = useState<Effect[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedEffect, setSelectedEffect] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const effectTypes = [
    { name: 'Reverb', parameters: { decay: 0, wet: 0, dry: 0 } },
    { name: 'Delay', parameters: { time: 0, feedback: 0, mix: 0 } },
    { name: 'Distortion', parameters: { amount: 0, oversample: 0 } },
    { name: 'Filter', parameters: { frequency: 0, resonance: 0, type: 0 } },
    { name: 'Compressor', parameters: { threshold: 0, ratio: 0, attack: 0, release: 0 } },
  ];

  const generateEffect = useCallback(() => {
    setIsGenerating(true);
    // Simulate AI effect generation
    setTimeout(() => {
      const effectType = effectTypes[Math.floor(Math.random() * effectTypes.length)];
      const newEffect: Effect = {
        id: Date.now().toString(),
        name: `AI ${effectType.name}`,
        type: effectType.name,
        parameters: Object.fromEntries(
          Object.entries(effectType.parameters).map(([key, _]) => [
            key,
            Math.random()
          ])
        ),
        isActive: true
      };
      setEffects(prev => [...prev, newEffect]);
      setIsGenerating(false);
    }, 1000);
  }, []);

  const toggleEffect = useCallback((id: string) => {
    setEffects(prev => prev.map(effect =>
      effect.id === id ? { ...effect, isActive: !effect.isActive } : effect
    ));
  }, []);

  const updateParameter = useCallback((effectId: string, param: string, value: number) => {
    setEffects(prev => prev.map(effect =>
      effect.id === effectId
        ? {
            ...effect,
            parameters: {
              ...effect.parameters,
              [param]: value
            }
          }
        : effect
    ));
  }, []);

  const deleteEffect = useCallback((id: string) => {
    setEffects(prev => prev.filter(effect => effect.id !== id));
    if (selectedEffect === id) {
      setSelectedEffect(null);
    }
  }, [selectedEffect]);

  return (
    <div className="bg-gray-800/80 backdrop-blur-sm p-4 rounded border border-blue-500/30 shadow-[0_0_15px_rgba(32,128,255,0.1)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-blue-400 flex items-center gap-2">
          <FiWaveSquare className="text-purple-400" />
          Sound Effects
        </h3>
        <button
          onClick={generateEffect}
          disabled={isGenerating}
          className="bg-purple-500 hover:bg-purple-600 px-3 py-1 rounded text-sm flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-purple-400/30"
          title="Generate AI effect"
        >
          <FiCpu className={isGenerating ? 'animate-spin' : ''} />
          {isGenerating ? 'Generating...' : 'Generate Effect'}
        </button>
      </div>

      <div className="space-y-4">
        {effects.map((effect) => (
          <motion.div
            key={effect.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-3 rounded border ${
              selectedEffect === effect.id
                ? 'border-purple-500/50 bg-purple-500/10'
                : 'border-blue-500/30 bg-gray-700/50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleEffect(effect.id)}
                  className={`p-1 rounded transition-colors ${
                    effect.isActive
                      ? 'bg-green-500 hover:bg-green-600'
                      : 'bg-gray-600 hover:bg-gray-500'
                  }`}
                  title={effect.isActive ? 'Disable effect' : 'Enable effect'}
                >
                  <FiVolume2 />
                </button>
                <span className="font-medium">{effect.name}</span>
                <span className="text-sm text-gray-400">{effect.type}</span>
              </div>
              <button
                onClick={() => deleteEffect(effect.id)}
                className="text-red-400 hover:text-red-300 transition-colors"
                title="Delete effect"
              >
                <FiTrash2 />
              </button>
            </div>

            <div className="space-y-2">
              {Object.entries(effect.parameters).map(([param, value]) => (
                <div key={param} className="flex items-center gap-2">
                  <span className="text-sm text-gray-400 w-24">{param}</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={value}
                    onChange={(e) => updateParameter(effect.id, param, parseFloat(e.target.value))}
                    className="flex-1 accent-blue-500"
                    title={`Adjust ${param}`}
                  />
                  <span className="text-sm text-gray-400 w-12">{Math.round(value * 100)}%</span>
                </div>
              ))}
            </div>
          </motion.div>
        ))}

        {effects.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            <FiWaveSquare className="mx-auto text-4xl mb-2" />
            <p>No effects added yet</p>
            <p className="text-sm">Generate an AI effect or add your own</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SoundEffectsPanel; 