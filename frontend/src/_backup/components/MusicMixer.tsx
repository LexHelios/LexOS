import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlay, FiPause, FiVolume2, FiPlus, FiTrash2, FiInfo, FiMusic, FiClock, FiKey, FiGrid, FiSettings, FiSave, FiCpu, FiZap, FiRefreshCw, FiLayers, FiLock, FiLoop, FiTarget } from 'react-icons/fi';
import useMusicStore from '../services/MusicService';
import LexOSCommand from './LexOSCommand';
import BeatLoopStation from './BeatLoopStation';
import SoundEffectsPanel from './SoundEffectsPanel';
import MoodComposer from './MoodComposer';
import CyberHUD from './CyberHUD';
import AutonomousMixer from './AutonomousMixer';
import LexHead from './LexHead';
import VocalEffectsPanel from './VocalEffectsPanel';
import StemsPanel from './StemsPanel';
import Sampler from './Sampler';
import LibraryManager from './LibraryManager';
import HardwareController from './HardwareController';
import VideoMixer from './VideoMixer';
import { AudioVisualizer } from './AudioVisualizer';
import { useMusicStore as useMusicStoreContext } from '../contexts/StoreContext';
import { Mix, Track, Transition } from '../types/music';
import * as Tone from 'tone';

interface Deck {
  id: string;
  track: any | null;
  isPlaying: boolean;
  pitch: number;
  keylock: boolean;
  hotCues: { id: string; time: number; color: string }[];
  loopPoints: { start: number; end: number } | null;
  syncEnabled: boolean;
  volume: number;
  speed: number;
}

interface MusicMixerProps {
  onMixUpdate?: (mix: Mix) => void;
}

const MusicMixer: React.FC<MusicMixerProps> = ({ onMixUpdate }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showTransitionSettings, setShowTransitionSettings] = useState(false);
  const [selectedTrackIndex, setSelectedTrackIndex] = useState<number | null>(null);
  const {
    tracks,
    mixes,
    currentMix,
    isPlaying,
    currentTime,
    volume,
    addTrack,
    removeTrack,
    createMix,
    updateMix,
    deleteMix,
    play,
    pause,
    setVolume,
  } = useMusicStore();
  const [isAutoComposing, setIsAutoComposing] = useState(false);
  const [compositionStyle, setCompositionStyle] = useState('energetic');
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isLexTalking, setIsLexTalking] = useState(false);
  const [lexMessage, setLexMessage] = useState('');
  const [isHUDVisible, setIsHUDVisible] = useState(true);
  const [currentBPM, setCurrentBPM] = useState<number | null>(null);
  const [currentKey, setCurrentKey] = useState<string | null>(null);
  const [energyLevel, setEnergyLevel] = useState(0);
  const [aiDecisions, setAiDecisions] = useState<Array<{
    id: string;
    type: 'transition' | 'effect' | 'analysis' | 'suggestion';
    message: string;
    confidence: number;
    timestamp: number;
  }>>([]);
  const [decks, setDecks] = useState<Deck[]>([
    { id: 'deck1', track: null, isPlaying: false, pitch: 0, keylock: true, hotCues: [], loopPoints: null, syncEnabled: false, volume: 0.5, speed: 1 },
    { id: 'deck2', track: null, isPlaying: false, pitch: 0, keylock: true, hotCues: [], loopPoints: null, syncEnabled: false, volume: 0.5, speed: 1 }
  ]);
  const [masterBPM, setMasterBPM] = useState<number | null>(null);
  const [selectedDeck, setSelectedDeck] = useState<string>('deck1');
  const [isProcessing, setIsProcessing] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          if (currentMix?.tracks.length) {
            isPlaying ? pause() : play();
          }
          break;
        case 'm':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            createMix();
          }
          break;
        case 's':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (currentMix) {
              updateMix({ ...currentMix, name: currentMix.name || 'Untitled Mix' });
            }
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentMix, isPlaying, createMix, updateMix, play, pause]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      currentTime(audioRef.current.currentTime);
    }
  };

  const handleDragStart = (e: React.DragEvent, track: any) => {
    setIsDragging(true);
    e.dataTransfer.setData('track', JSON.stringify(track));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const track = JSON.parse(e.dataTransfer.getData('track'));
    addTrack(track);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleTrackSelect = useCallback((index: number) => {
    setSelectedTrackIndex(index);
    setShowTransitionSettings(true);
  }, []);

  const handleTransitionChange = useCallback((type: string, duration: number) => {
    if (selectedTrackIndex === null || !currentMix) return;
    
    const updatedTracks = [...currentMix.tracks];
    updatedTracks[selectedTrackIndex] = {
      ...updatedTracks[selectedTrackIndex],
      transition: { type, duration }
    };
    
    updateMix({ ...currentMix, tracks: updatedTracks });
  }, [selectedTrackIndex, currentMix, updateMix]);

  const handleAutoCompose = useCallback(async () => {
    if (!currentMix) return;
    setIsProcessing(true);
    try {
      // Auto-compose logic here
    } catch (error) {
      console.error('Auto-compose failed:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [currentMix]);

  // Simulate Lex talking when processing commands
  useEffect(() => {
    if (isProcessing) {
      setIsLexTalking(true);
      setLexMessage('Processing your request...');
    } else {
      setIsLexTalking(false);
      setLexMessage('');
    }
  }, [isProcessing]);

  // Simulate AI decisions
  useEffect(() => {
    const decisionTypes = ['transition', 'effect', 'analysis', 'suggestion'];
    const messages = {
      transition: [
        'Analyzing transition points...',
        'Calculating optimal crossfade...',
        'Synchronizing beat patterns...'
      ],
      effect: [
        'Applying dynamic EQ...',
        'Modulating reverb space...',
        'Enhancing stereo field...'
      ],
      analysis: [
        'Processing audio spectrum...',
        'Detecting key changes...',
        'Analyzing rhythm patterns...'
      ],
      suggestion: [
        'Suggesting energy boost...',
        'Recommending mood shift...',
        'Proposing effect chain...'
      ]
    };

    const addDecision = () => {
      const type = decisionTypes[Math.floor(Math.random() * decisionTypes.length)] as any;
      const messageList = messages[type];
      const message = messageList[Math.floor(Math.random() * messageList.length)];
      
      setAiDecisions(prev => [
        {
          id: Date.now().toString(),
          type,
          message,
          confidence: Math.random() * 0.5 + 0.5,
          timestamp: Date.now()
        },
        ...prev.slice(0, 4)
      ]);
    };

    const interval = setInterval(addDecision, 3000);
    return () => clearInterval(interval);
  }, []);

  // Simulate BPM and key detection
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBPM(Math.floor(Math.random() * 40) + 100);
      setCurrentKey(['Am', 'Em', 'Dm', 'Gm'][Math.floor(Math.random() * 4)]);
      setEnergyLevel(Math.random());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Add hot cue
  const addHotCue = useCallback((deckId: string, time: number) => {
    setDecks(prev => prev.map(deck => {
      if (deck.id === deckId) {
        const colors = ['#ff4444', '#44ff44', '#4444ff', '#ffff44', '#ff44ff'];
        return {
          ...deck,
          hotCues: [...deck.hotCues, {
            id: Date.now().toString(),
            time,
            color: colors[deck.hotCues.length % colors.length]
          }]
        };
      }
      return deck;
    }));
  }, []);

  // Set loop points
  const setLoopPoints = useCallback((deckId: string, start: number, end: number) => {
    setDecks(prev => prev.map(deck => {
      if (deck.id === deckId) {
        return {
          ...deck,
          loopPoints: { start, end }
        };
      }
      return deck;
    }));
  }, []);

  // Toggle keylock
  const toggleKeylock = useCallback((deckId: string) => {
    setDecks(prev => prev.map(deck => {
      if (deck.id === deckId) {
        return {
          ...deck,
          keylock: !deck.keylock
        };
      }
      return deck;
    }));
  }, []);

  // Adjust pitch
  const adjustPitch = useCallback((deckId: string, value: number) => {
    setDecks(prev => prev.map(deck => {
      if (deck.id === deckId) {
        return {
          ...deck,
          pitch: value
        };
      }
      return deck;
    }));
  }, []);

  // Toggle sync
  const toggleSync = useCallback((deckId: string) => {
    setDecks(prev => prev.map(deck => {
      if (deck.id === deckId) {
        return {
          ...deck,
          syncEnabled: !deck.syncEnabled
        };
      }
      return deck;
    }));
  }, []);

  const handlePlayPause = useCallback((index: number) => {
    if (decks[index].isPlaying) {
      pause();
    } else {
      play();
    }
  }, [pause, play]);

  const handleVolumeChange = useCallback((index: number, value: number) => {
    setDecks(prev => prev.map((deck, i) => {
      if (i === index) {
        return {
          ...deck,
          volume: value
        };
      }
      return deck;
    }));
  }, []);

  const handleSpeedChange = useCallback((index: number, value: number) => {
    setDecks(prev => prev.map((deck, i) => {
      if (i === index) {
        return {
          ...deck,
          speed: value
        };
      }
      return deck;
    }));
  }, []);

  const handleMixUpdate = useCallback((updates: Partial<Mix>) => {
    if (!currentMix) return;
    updateMix(currentMix.id, { ...currentMix, ...updates });
  }, [currentMix, updateMix]);

  const handleTransitionUpdate = useCallback((transitionId: string, updates: Partial<Transition>) => {
    if (!currentMix) return;
    const updatedTracks = currentMix.tracks.map(track => ({
      ...track,
      transitions: track.transitions.map(t => 
        t.id === transitionId ? { ...t, ...updates } : t
      )
    }));
    updateMix(currentMix.id, { ...currentMix, tracks: updatedTracks });
  }, [currentMix, updateMix]);

  const handleEffectUpdate = useCallback((effectId: string, updates: Partial<any>) => {
    if (!currentMix) return;
    const updatedTracks = currentMix.tracks.map(track => ({
      ...track,
      effects: track.effects.map(e => 
        e.id === effectId ? { ...e, ...updates } : e
      )
    }));
    updateMix(currentMix.id, { ...currentMix, tracks: updatedTracks });
  }, [currentMix, updateMix]);

  const handleTrackUpdate = useCallback((trackId: string, updates: Partial<Track>) => {
    if (!currentMix) return;
    const updatedTracks = currentMix.tracks.map(track => 
      track.id === trackId ? { ...track, ...updates } : track
    );
    updateMix(currentMix.id, { ...currentMix, tracks: updatedTracks });
  }, [currentMix, updateMix]);

  const handleAddTrack = useCallback(() => {
    if (!currentMix) return;
    const newTrack: Track = {
      id: Date.now().toString(),
      name: `Track ${currentMix.tracks.length + 1}`,
      audioUrl: '',
      volume: 1,
      pan: 0,
      effects: [],
      transitions: [],
      analysis: {},
      metadata: {}
    };
    updateMix(currentMix.id, {
      ...currentMix,
      tracks: [...currentMix.tracks, newTrack]
    });
  }, [currentMix, updateMix]);

  const handleRemoveTrack = useCallback((trackId: string) => {
    if (!currentMix) return;
    updateMix(currentMix.id, {
      ...currentMix,
      tracks: currentMix.tracks.filter(t => t.id !== trackId)
    });
  }, [currentMix, updateMix]);

  const handleAddTransition = useCallback((trackId: string, type: string) => {
    if (!currentMix) return;
    const newTransition: Transition = {
      id: Date.now().toString(),
      type,
      duration: 1000,
      targetTrackId: '',
      parameters: {}
    };
    const updatedTracks = currentMix.tracks.map(track => 
      track.id === trackId 
        ? { ...track, transitions: [...track.transitions, newTransition] }
        : track
    );
    updateMix(currentMix.id, { ...currentMix, tracks: updatedTracks });
  }, [currentMix, updateMix]);

  const handleRemoveTransition = useCallback((trackId: string, transitionId: string) => {
    if (!currentMix) return;
    const updatedTracks = currentMix.tracks.map(track => 
      track.id === trackId 
        ? { 
            ...track, 
            transitions: track.transitions.filter(t => t.id !== transitionId)
          }
        : track
    );
    updateMix(currentMix.id, { ...currentMix, tracks: updatedTracks });
  }, [currentMix, updateMix]);

  const handleAddEffect = useCallback((trackId: string, type: string) => {
    if (!currentMix) return;
    const newEffect = {
      id: Date.now().toString(),
      type,
      parameters: {},
      enabled: true
    };
    const updatedTracks = currentMix.tracks.map(track => 
      track.id === trackId 
        ? { ...track, effects: [...track.effects, newEffect] }
        : track
    );
    updateMix(currentMix.id, { ...currentMix, tracks: updatedTracks });
  }, [currentMix, updateMix]);

  const handleRemoveEffect = useCallback((trackId: string, effectId: string) => {
    if (!currentMix) return;
    const updatedTracks = currentMix.tracks.map(track => 
      track.id === trackId 
        ? { 
            ...track, 
            effects: track.effects.filter(e => e.id !== effectId)
          }
        : track
    );
    updateMix(currentMix.id, { ...currentMix, tracks: updatedTracks });
  }, [currentMix, updateMix]);

  useEffect(() => {
    if (onMixUpdate && currentMix) {
      onMixUpdate(currentMix);
    }
  }, [currentMix, onMixUpdate]);

  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-2 gap-4 p-4">
        <LibraryManager />
        <HardwareController />
      </div>
      <div className="flex-1 p-4">
        <div className="grid grid-cols-2 gap-4 h-full">
          <div className="flex flex-col">
            <div className="flex-1">
              <AudioVisualizer
                audioContext={audioRef.current}
                className="h-full"
              />
            </div>
            <div className="mt-4">
              <VideoMixer />
            </div>
          </div>
          <div className="flex flex-col">
            {/* Deck controls */}
            <div className="grid grid-cols-2 gap-4">
              {decks.map((deck, index) => (
                <div key={index} className="bg-gray-800 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">Deck {index + 1}</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => handlePlayPause(index)}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                    >
                      {deck.isPlaying ? 'Pause' : 'Play'}
                    </button>
                    <div className="flex items-center space-x-2">
                      <label htmlFor={`volume-${index}`}>Volume:</label>
                      <input
                        id={`volume-${index}`}
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={deck.volume}
                        onChange={(e) => handleVolumeChange(index, parseFloat(e.target.value))}
                        className="flex-1"
                        title={`Adjust volume for deck ${index + 1}`}
                        aria-label={`Volume control for deck ${index + 1}`}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <label htmlFor={`speed-${index}`}>Speed:</label>
                      <input
                        id={`speed-${index}`}
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.01"
                        value={deck.speed}
                        onChange={(e) => handleSpeedChange(index, parseFloat(e.target.value))}
                        className="flex-1"
                        title={`Adjust playback speed for deck ${index + 1}`}
                        aria-label={`Speed control for deck ${index + 1}`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicMixer; 