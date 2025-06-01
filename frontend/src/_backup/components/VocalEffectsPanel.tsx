import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMic, FiMusic, FiZap, FiCpu, FiSettings, FiPlay, FiPause, FiVolume2, FiGrid, FiSliders } from 'react-icons/fi';
import * as Tone from 'tone';

interface VocalEffect {
  id: string;
  name: string;
  type: 'pitch' | 'speed' | 'autotune' | 'reverb' | 'delay' | 'filter' | 'chorus' | 'distortion' | 'compressor';
  value: number;
  active: boolean;
  node?: Tone.ToneAudioNode;
}

const VocalEffectsPanel: React.FC = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [currentPitch, setCurrentPitch] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [showPresetInput, setShowPresetInput] = useState(false);
  const [midiDevices, setMidiDevices] = useState<WebMidi.MIDIInput[]>([]);
  const [selectedMidiDevice, setSelectedMidiDevice] = useState<string | null>(null);
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);
  const [spectrumData, setSpectrumData] = useState<Float32Array | null>(null);

  const [effects, setEffects] = useState<VocalEffect[]>([
    { id: '1', name: 'Pitch Shift', type: 'pitch', value: 0, active: false },
    { id: '2', name: 'Speed Control', type: 'speed', value: 1, active: false },
    { id: '3', name: 'Auto-Tune', type: 'autotune', value: 0, active: false },
    { id: '4', name: 'Reverb', type: 'reverb', value: 0, active: false },
    { id: '5', name: 'Delay', type: 'delay', value: 0, active: false },
    { id: '6', name: 'Filter', type: 'filter', value: 1000, active: false },
    { id: '7', name: 'Chorus', type: 'chorus', value: 0, active: false },
    { id: '8', name: 'Distortion', type: 'distortion', value: 0, active: false },
    { id: '9', name: 'Compressor', type: 'compressor', value: 0, active: false },
  ]);

  // Initialize audio context and nodes
  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
    }
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Initialize Tone.js
  useEffect(() => {
    Tone.start();
    return () => {
      Tone.dispose();
    };
  }, []);

  // MIDI device handling
  useEffect(() => {
    if (navigator.requestMIDIAccess) {
      navigator.requestMIDIAccess().then(access => {
        const inputs = Array.from(access.inputs.values());
        setMidiDevices(inputs);
      });
    }
  }, []);

  // Spectrum analyzer
  useEffect(() => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);

    const updateSpectrum = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getFloatFrequencyData(dataArray);
      setSpectrumData(dataArray);
      requestAnimationFrame(updateSpectrum);
    };

    updateSpectrum();
  }, []);

  // Draw waveform
  useEffect(() => {
    if (!canvasRef.current || !analyserRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      requestAnimationFrame(draw);
      analyserRef.current?.getByteTimeDomainData(dataArray);

      ctx.fillStyle = 'rgb(20, 20, 20)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#00ffff';
      ctx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * canvas.height / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };

    draw();
  }, []);

  // Pitch detection
  useEffect(() => {
    if (!analyserRef.current || !isRecording) return;

    const detectPitch = () => {
      const bufferLength = analyserRef.current!.frequencyBinCount;
      const dataArray = new Float32Array(bufferLength);
      analyserRef.current!.getFloatTimeDomainData(dataArray);

      // Simple pitch detection using autocorrelation
      let maxOffset = 0;
      let maxCorrelation = 0;
      const correlation = new Float32Array(bufferLength);

      for (let offset = 0; offset < bufferLength; offset++) {
        let correlationSum = 0;
        for (let i = 0; i < bufferLength - offset; i++) {
          correlationSum += dataArray[i] * dataArray[i + offset];
        }
        correlation[offset] = correlationSum;
        if (correlation[offset] > maxCorrelation) {
          maxCorrelation = correlation[offset];
          maxOffset = offset;
        }
      }

      if (maxOffset > 0) {
        const frequency = audioContextRef.current!.sampleRate / maxOffset;
        setCurrentPitch(frequency);
      }
    };

    const interval = setInterval(detectPitch, 100);
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!audioContextRef.current) return;

      sourceNodeRef.current = audioContextRef.current.createMediaStreamSource(stream);
      sourceNodeRef.current.connect(analyserRef.current!);
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const handleStopRecording = () => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    setIsRecording(false);
  };

  // Enhanced effect handling with Tone.js
  const createEffectNode = useCallback((effect: VocalEffect) => {
    switch (effect.type) {
      case 'pitch':
        return new Tone.PitchShift(effect.value).toDestination();
      case 'reverb':
        return new Tone.Reverb(effect.value / 100).toDestination();
      case 'delay':
        return new Tone.FeedbackDelay(effect.value / 100).toDestination();
      case 'filter':
        return new Tone.Filter(effect.value).toDestination();
      case 'chorus':
        return new Tone.Chorus(effect.value / 100).toDestination();
      case 'distortion':
        return new Tone.Distortion(effect.value / 100).toDestination();
      case 'compressor':
        return new Tone.Compressor({
          threshold: -24,
          ratio: 12,
          attack: 0.003,
          release: 0.25
        }).toDestination();
      default:
        return null;
    }
  }, []);

  const handleEffectChange = useCallback((id: string, value: number) => {
    setEffects(prev => prev.map(effect => {
      if (effect.id === id) {
        if (effect.node) {
          effect.node.dispose();
        }
        const newNode = createEffectNode({ ...effect, value });
        return { ...effect, value, active: true, node: newNode };
      }
      return effect;
    }));
  }, [createEffectNode]);

  const handleEffectToggle = useCallback((id: string) => {
    setEffects(prev => prev.map(effect => {
      if (effect.id === id) {
        const newActive = !effect.active;
        if (effect.node) {
          effect.node.disconnect();
          if (newActive) {
            // Reconnect with new parameters
            effect.node.connect(analyserRef.current!);
          }
        }
        return { ...effect, active: newActive };
      }
      return effect;
    }));
  }, []);

  const handleSavePreset = useCallback(() => {
    if (!presetName) return;
    // TODO: Implement preset saving logic
    setShowPresetInput(false);
    setPresetName('');
  }, [presetName]);

  const handleAIAnalysis = useCallback(async () => {
    setIsProcessing(true);
    try {
      // Send audio data to backend for AI analysis
      const response = await fetch('/api/analyze-vocals', {
        method: 'POST',
        body: JSON.stringify({
          pitch: currentPitch,
          effects: effects.map(e => ({ type: e.type, value: e.value }))
        })
      });
      const data = await response.json();
      
      // Apply AI-suggested effects
      setEffects(prev => prev.map(effect => ({
        ...effect,
        value: data.effects[effect.type] || effect.value,
        active: true
      })));
    } catch (error) {
      console.error('Error analyzing vocals:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [currentPitch, effects]);

  return (
    <div className="bg-gray-800/80 backdrop-blur-sm p-4 rounded border border-blue-500/30 shadow-[0_0_15px_rgba(32,128,255,0.1)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-blue-400 flex items-center gap-2">
          <FiMic className="text-purple-400" />
          Vocal Effects
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPresetInput(true)}
            className="bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded text-sm flex items-center gap-1 transition-colors border border-blue-400/30"
            title="Save current effects as preset"
          >
            <FiSettings />
            Save Preset
          </button>
          <button
            onClick={handleAIAnalysis}
            disabled={isProcessing}
            className="bg-purple-500 hover:bg-purple-600 px-3 py-1 rounded text-sm flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-purple-400/30"
            title="Let AI analyze and enhance vocals"
          >
            <FiCpu className={isProcessing ? 'animate-spin' : ''} />
            {isProcessing ? 'Processing...' : 'AI Enhance'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showPresetInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="Enter preset name"
                className="flex-1 bg-gray-700/80 backdrop-blur-sm px-2 py-1 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none border border-blue-500/30"
              />
              <button
                onClick={handleSavePreset}
                className="bg-green-500 hover:bg-green-600 px-3 py-1 rounded text-sm transition-colors border border-green-400/30"
              >
                Save
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Advanced Controls Toggle */}
      <div className="mb-4">
        <button
          onClick={() => setShowAdvancedControls(!showAdvancedControls)}
          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
        >
          <FiSliders />
          {showAdvancedControls ? 'Hide Advanced Controls' : 'Show Advanced Controls'}
        </button>
      </div>

      {/* Waveform and Spectrum Visualization */}
      <div className="mb-4 space-y-4">
        <canvas
          ref={canvasRef}
          className="w-full h-32 bg-gray-900 rounded"
          title="Vocal waveform visualization"
        />
        {spectrumData && (
          <div className="h-32 bg-gray-900 rounded p-2">
            <div className="flex h-full items-end gap-1">
              {Array.from(spectrumData).map((value, i) => (
                <div
                  key={i}
                  className="flex-1 bg-blue-500/50 hover:bg-blue-500/70 transition-colors"
                  style={{
                    height: `${((value + 140) / 140) * 100}%`,
                    minHeight: '2px'
                  }}
                  title={`Frequency: ${i * (audioContextRef.current?.sampleRate || 44100) / (analyserRef.current?.fftSize || 2048)}Hz`}
                />
              ))}
            </div>
          </div>
        )}
        {currentPitch && (
          <div className="text-sm text-blue-400">
            Current Pitch: {Math.round(currentPitch)}Hz ({getNoteFromFrequency(currentPitch)})
          </div>
        )}
      </div>

      {/* MIDI Device Selection */}
      {midiDevices.length > 0 && (
        <div className="mb-4">
          <select
            value={selectedMidiDevice || ''}
            onChange={(e) => setSelectedMidiDevice(e.target.value)}
            className="w-full bg-gray-700/80 backdrop-blur-sm px-2 py-1 rounded text-sm border border-blue-500/30"
            title="Select MIDI controller"
            aria-label="MIDI controller selection"
          >
            <option value="">No MIDI controller</option>
            {midiDevices.map(device => (
              <option key={device.id} value={device.id}>
                {device.name || device.id}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Effects Controls */}
      <div className="space-y-4">
        {effects.map((effect) => (
          <motion.div
            key={effect.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded border border-blue-500/30 bg-gray-700/50"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEffectToggle(effect.id)}
                  className={`p-1 rounded transition-colors ${
                    effect.active
                      ? 'bg-blue-500/20 text-blue-300'
                      : 'bg-gray-600/20 text-gray-400'
                  }`}
                  title={`${effect.active ? 'Disable' : 'Enable'} ${effect.name}`}
                >
                  <FiZap />
                </button>
                <span className="font-medium">{effect.name}</span>
              </div>
              <span className="text-sm text-gray-400">
                {effect.type === 'speed'
                  ? `${effect.value.toFixed(1)}x`
                  : effect.type === 'filter'
                  ? `${Math.round(effect.value)}Hz`
                  : `${Math.round(effect.value)}%`}
              </span>
            </div>
            <label className="sr-only" htmlFor={`effect-${effect.id}`}>
              {effect.name} control
            </label>
            <input
              id={`effect-${effect.id}`}
              type="range"
              min={effect.type === 'speed' ? 0.5 : 0}
              max={effect.type === 'speed' ? 2 : effect.type === 'filter' ? 20000 : 100}
              step={effect.type === 'speed' ? 0.1 : 1}
              value={effect.value}
              onChange={(e) => handleEffectChange(effect.id, parseFloat(e.target.value))}
              className="w-full accent-blue-500"
              disabled={!effect.active}
              title={`Adjust ${effect.name}`}
              aria-label={`${effect.name} control`}
            />
          </motion.div>
        ))}
      </div>

      {/* Advanced Controls */}
      <AnimatePresence>
        {showAdvancedControls && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 space-y-4"
          >
            {/* Add advanced controls here */}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-4 flex items-center gap-4">
        <button
          onClick={isRecording ? handleStopRecording : handleStartRecording}
          className={`p-2 rounded-full transition-colors ${
            isRecording
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
          title={isRecording ? "Stop recording" : "Start recording"}
        >
          {isRecording ? <FiPause /> : <FiPlay />}
        </button>
        <div className="flex-1">
          <input
            type="range"
            min="0"
            max="100"
            defaultValue="80"
            className="w-full accent-blue-500"
            title="Effect mix level"
            aria-label="Effect mix level"
          />
        </div>
        <FiVolume2 className="text-gray-400" />
      </div>
    </div>
  );
};

// Helper function to convert frequency to note name
const getNoteFromFrequency = (frequency: number): string => {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const a4 = 440;
  const c0 = a4 * Math.pow(2, -4.75);
  
  if (frequency < c0) return '?';
  
  const halfStepsFromC0 = Math.round(12 * Math.log2(frequency / c0));
  const octave = Math.floor(halfStepsFromC0 / 12);
  const noteIndex = halfStepsFromC0 % 12;
  
  return `${noteNames[noteIndex]}${octave}`;
};

export default VocalEffectsPanel; 