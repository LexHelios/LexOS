import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMusic, FiPlay, FiPause, FiPlus, FiTrash2, FiGrid, FiClock } from 'react-icons/fi';

interface Sample {
  id: string;
  name: string;
  color: string;
  steps: boolean[];
}

interface SequencerStep {
  id: string;
  samples: Record<string, boolean>;
}

const Sampler: React.FC = () => {
  const [samples, setSamples] = useState<Sample[]>([
    { id: '1', name: 'Kick', color: '#ff4444', steps: Array(16).fill(false) },
    { id: '2', name: 'Snare', color: '#44ff44', steps: Array(16).fill(false) },
    { id: '3', name: 'Hi-hat', color: '#4444ff', steps: Array(16).fill(false) },
    { id: '4', name: 'Clap', color: '#ffff44', steps: Array(16).fill(false) }
  ]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [bpm, setBpm] = useState(120);
  const [showSequencer, setShowSequencer] = useState(true);
  const sequencerInterval = useRef<NodeJS.Timeout>();

  const toggleStep = useCallback((sampleId: string, stepIndex: number) => {
    setSamples(prev => prev.map(sample => 
      sample.id === sampleId ? {
        ...sample,
        steps: sample.steps.map((step, i) => i === stepIndex ? !step : step)
      } : sample
    ));
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      clearInterval(sequencerInterval.current);
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      sequencerInterval.current = setInterval(() => {
        setCurrentStep(prev => (prev + 1) % 16);
      }, (60 / bpm) * 1000);
    }
  }, [isPlaying, bpm]);

  const addSample = useCallback(() => {
    const colors = ['#ff4444', '#44ff44', '#4444ff', '#ffff44', '#ff44ff', '#44ffff'];
    setSamples(prev => [...prev, {
      id: Date.now().toString(),
      name: `Sample ${prev.length + 1}`,
      color: colors[prev.length % colors.length],
      steps: Array(16).fill(false)
    }]);
  }, []);

  const removeSample = useCallback((sampleId: string) => {
    setSamples(prev => prev.filter(sample => sample.id !== sampleId));
  }, []);

  return (
    <div className="bg-gray-800/80 backdrop-blur-sm p-4 rounded border border-blue-500/30">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-blue-400 flex items-center gap-2">
          <FiGrid className="text-purple-400" />
          Sampler
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={togglePlay}
            className={`p-2 rounded ${isPlaying ? 'bg-red-500' : 'bg-green-500'}`}
            title={isPlaying ? 'Stop sequencer' : 'Start sequencer'}
          >
            {isPlaying ? <FiPause /> : <FiPlay />}
          </button>
          <button
            onClick={addSample}
            className="p-2 rounded bg-blue-500"
            title="Add new sample"
          >
            <FiPlus />
          </button>
        </div>
      </div>

      <div className="mb-4">
        <label className="text-sm text-gray-400">BPM</label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="60"
            max="200"
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            className="flex-1"
            disabled={isPlaying}
            aria-label="BPM control"
            title="Adjust BPM"
          />
          <span className="text-sm text-gray-400 w-12 text-right">{bpm}</span>
        </div>
      </div>

      <div className="space-y-4">
        {samples.map(sample => (
          <div key={sample.id} className="bg-gray-700/50 p-3 rounded border border-gray-600/30">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: sample.color }}
                />
                <span className="font-medium">{sample.name}</span>
              </div>
              <button
                onClick={() => removeSample(sample.id)}
                className="p-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30"
                title={`Remove ${sample.name}`}
              >
                <FiTrash2 />
              </button>
            </div>

            <div className="grid grid-cols-16 gap-1">
              {sample.steps.map((step, index) => (
                <button
                  key={index}
                  onClick={() => toggleStep(sample.id, index)}
                  className={`w-8 h-8 rounded ${
                    currentStep === index && isPlaying
                      ? 'ring-2 ring-white'
                      : step
                      ? 'bg-blue-500'
                      : 'bg-gray-600'
                  }`}
                  title={`Toggle step ${index + 1} for ${sample.name}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Sample Pads */}
      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-400 mb-2">Sample Pads</h4>
        <div className="grid grid-cols-4 gap-2">
          {samples.map(sample => (
            <button
              key={sample.id}
              className="aspect-square rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
              style={{ backgroundColor: sample.color }}
              title={`Trigger ${sample.name}`}
            >
              {sample.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sampler; 