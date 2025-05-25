import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiGlobe, FiMusic, FiCpu, FiZap, FiClock, FiTrendingUp, FiHeart, FiMessageSquare } from 'react-icons/fi';

interface CulturalTrack {
  id: string;
  title: string;
  artist: string;
  language: string;
  culture: string;
  bpm: number;
  key: string;
  popularity: number;
  duration: number;
  genre: string;
  mood: string;
  shoutout?: string;
}

interface MixRequest {
  duration: number;
  languages: string[];
  shoutout?: string;
  style?: string;
}

const AutonomousMixer: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [mixRequest, setMixRequest] = useState<MixRequest | null>(null);
  const [selectedTracks, setSelectedTracks] = useState<CulturalTrack[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);

  // Simulated cultural track database
  const culturalTracks: CulturalTrack[] = [
    // Tamil tracks
    {
      id: 't1',
      title: 'Chaleya',
      artist: 'Arijit Singh',
      language: 'Tamil',
      culture: 'Indian',
      bpm: 128,
      key: 'Am',
      popularity: 95,
      duration: 240,
      genre: 'Bollywood',
      mood: 'energetic'
    },
    // Japanese tracks
    {
      id: 'j1',
      title: 'U.S.A.',
      artist: 'DA PUMP',
      language: 'Japanese',
      culture: 'Japanese',
      bpm: 130,
      key: 'Dm',
      popularity: 92,
      duration: 235,
      genre: 'J-Pop',
      mood: 'euphoric'
    },
    // English tracks
    {
      id: 'e1',
      title: 'Blinding Lights',
      artist: 'The Weeknd',
      language: 'English',
      culture: 'Western',
      bpm: 171,
      key: 'Fm',
      popularity: 98,
      duration: 200,
      genre: 'Pop',
      mood: 'intense'
    }
    // Add more tracks...
  ];

  const handleVoiceCommand = useCallback(async (command: string) => {
    setIsListening(true);
    setIsProcessing(true);

    // Parse voice command
    const duration = command.match(/(\d+)-hour/)?.[1] || '2';
    const languages = command.match(/Tamil|Japanese|English/g) || [];
    const shoutout = command.match(/DJ\s+(\w+)/)?.[1];

    const request: MixRequest = {
      duration: parseInt(duration) * 3600,
      languages,
      shoutout,
      style: 'dance'
    };

    setMixRequest(request);

    // Simulate AI processing
    setTimeout(() => {
      const analysis = [
        'Analyzing cultural patterns...',
        'Matching BPM progressions across languages...',
        'Optimizing key transitions...',
        'Calculating optimal track sequence...',
        'Generating cultural overlays...',
        'Preparing shoutout integration...'
      ];
      setAiAnalysis(analysis);

      // Simulate track selection
      const tracks = culturalTracks
        .filter(track => languages.includes(track.language))
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 10);

      setSelectedTracks(tracks);
      setIsProcessing(false);
      setIsListening(false);
    }, 3000);
  }, []);

  return (
    <div className="bg-gray-800/80 backdrop-blur-sm p-4 rounded border border-blue-500/30 shadow-[0_0_15px_rgba(32,128,255,0.1)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-blue-400 flex items-center gap-2">
          <FiGlobe className="text-purple-400" />
          Autonomous Mixer
        </h3>
        <button
          onClick={() => handleVoiceCommand("Make me a 2-hour Tamil, Japanese, and English dance mix with overlays, most popular tracks from those cultures, and shout out to DJ Lex")}
          disabled={isProcessing}
          className="bg-purple-500 hover:bg-purple-600 px-3 py-1 rounded text-sm flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-purple-400/30"
          title="Start autonomous mixing"
        >
          <FiCpu className={isProcessing ? 'animate-spin' : ''} />
          {isProcessing ? 'Processing...' : 'Create Mix'}
        </button>
      </div>

      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4"
          >
            <div className="p-3 bg-gray-700/50 rounded border border-blue-500/30">
              <div className="flex items-center gap-2 mb-2">
                <FiCpu className="text-blue-400" />
                <h4 className="font-medium text-blue-400">AI Processing</h4>
              </div>
              <div className="space-y-2">
                {aiAnalysis.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.2 }}
                    className="text-sm text-blue-300 flex items-center gap-2"
                  >
                    <FiZap className="text-purple-400" />
                    {step}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {selectedTracks.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {selectedTracks.map((track) => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded border border-blue-500/30 bg-gray-700/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded ${
                      track.language === 'Tamil' ? 'bg-orange-500/20 text-orange-300' :
                      track.language === 'Japanese' ? 'bg-red-500/20 text-red-300' :
                      'bg-blue-500/20 text-blue-300'
                    }`}>
                      {track.language}
                    </span>
                    <span className="text-sm text-gray-400">{track.culture}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <FiClock className="text-blue-400" />
                    {Math.floor(track.duration / 60)}:{String(track.duration % 60).padStart(2, '0')}
                  </div>
                </div>
                <h4 className="font-medium mb-1">{track.title}</h4>
                <p className="text-sm text-gray-400 mb-2">{track.artist}</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 text-xs rounded bg-gray-600 text-gray-300">
                    {track.genre}
                  </span>
                  <span className="px-2 py-1 text-xs rounded bg-gray-600 text-gray-300">
                    {track.mood}
                  </span>
                  <span className="px-2 py-1 text-xs rounded bg-gray-600 text-gray-300">
                    {track.bpm} BPM
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {mixRequest?.shoutout && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded border border-purple-500/30 bg-purple-500/10"
            >
              <div className="flex items-center gap-2">
                <FiMessageSquare className="text-purple-400" />
                <span className="text-purple-300">
                  Shoutout to DJ {mixRequest.shoutout} integrated at optimal points
                </span>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
};

export default AutonomousMixer; 