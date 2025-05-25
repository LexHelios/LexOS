import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMusic, FiSun, FiMoon, FiHeart, FiActivity, FiZap } from 'react-icons/fi';

interface MoodProfile {
  id: string;
  name: string;
  bpm: number;
  key: string;
  genre: string;
  emotionalTags: string[];
  intensity: number;
  energy: number;
  popularity: number;
}

interface MixVariation {
  id: string;
  name: string;
  mood: MoodProfile;
  tracks: any[];
  userRating?: number;
  timestamp: number;
}

const MoodComposer: React.FC = () => {
  const [selectedMood, setSelectedMood] = useState<MoodProfile | null>(null);
  const [isMirrorMode, setIsMirrorMode] = useState(false);
  const [variations, setVariations] = useState<MixVariation[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userFeedback, setUserFeedback] = useState<Record<string, number>>({});

  const moodProfiles: MoodProfile[] = [
    {
      id: '1',
      name: 'Chill Vibes',
      bpm: 90,
      key: 'Am',
      genre: 'Lo-fi',
      emotionalTags: ['relaxed', 'calm', 'introspective'],
      intensity: 0.3,
      energy: 0.4,
      popularity: 0.8
    },
    {
      id: '2',
      name: 'Intense Energy',
      bpm: 128,
      key: 'Em',
      genre: 'Techno',
      emotionalTags: ['energetic', 'powerful', 'driving'],
      intensity: 0.9,
      energy: 0.9,
      popularity: 0.7
    },
    {
      id: '3',
      name: 'Euphoric Journey',
      bpm: 122,
      key: 'F#m',
      genre: 'Progressive House',
      emotionalTags: ['uplifting', 'euphoric', 'transcendent'],
      intensity: 0.7,
      energy: 0.8,
      popularity: 0.9
    }
  ];

  const handleMoodSelect = useCallback(async (mood: MoodProfile) => {
    setSelectedMood(mood);
    setIsProcessing(true);

    try {
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Generate variations based on mood
      const newVariations: MixVariation[] = [
        {
          id: Date.now().toString(),
          name: `${mood.name} Mix`,
          mood,
          tracks: [], // Will be populated by AI
          timestamp: Date.now()
        }
      ];

      if (isMirrorMode) {
        // Generate contrasting variation
        const mirrorMood = {
          ...mood,
          bpm: mood.bpm + (mood.bpm > 100 ? -20 : 20),
          intensity: 1 - mood.intensity,
          emotionalTags: mood.emotionalTags.map(tag => 
            tag === 'relaxed' ? 'energetic' :
            tag === 'energetic' ? 'relaxed' :
            tag === 'calm' ? 'intense' :
            tag === 'intense' ? 'calm' : tag
          )
        };

        newVariations.push({
          id: (Date.now() + 1).toString(),
          name: `${mirrorMood.name} Mirror`,
          mood: mirrorMood,
          tracks: [], // Will be populated by AI
          timestamp: Date.now()
        });
      }

      setVariations(newVariations);
    } finally {
      setIsProcessing(false);
    }
  }, [isMirrorMode]);

  const handleUserFeedback = useCallback((variationId: string, rating: number) => {
    setUserFeedback(prev => ({
      ...prev,
      [variationId]: rating
    }));

    // Update variation with user rating
    setVariations(prev => prev.map(v => 
      v.id === variationId ? { ...v, userRating: rating } : v
    ));
  }, []);

  return (
    <div className="bg-gray-800/80 backdrop-blur-sm p-4 rounded border border-blue-500/30 shadow-[0_0_15px_rgba(32,128,255,0.1)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-blue-400 flex items-center gap-2">
          <FiMusic className="text-purple-400" />
          Mood Composer
        </h3>
        <button
          onClick={() => setIsMirrorMode(!isMirrorMode)}
          className={`flex items-center gap-2 px-3 py-1 rounded text-sm transition-colors ${
            isMirrorMode
              ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30'
              : 'bg-gray-700/50 text-gray-300 border border-gray-600/30'
          }`}
        >
          <FiZap className={isMirrorMode ? 'text-purple-400' : 'text-gray-400'} />
          Mirror Mode
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        {moodProfiles.map(mood => (
          <motion.button
            key={mood.id}
            onClick={() => handleMoodSelect(mood)}
            className={`p-4 rounded border transition-colors ${
              selectedMood?.id === mood.id
                ? 'border-blue-500 bg-blue-500/20'
                : 'border-gray-700 hover:border-blue-500/50'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <FiActivity className="text-blue-400" />
              <span className="font-medium">{mood.name}</span>
            </div>
            <div className="text-sm text-gray-400 space-y-1">
              <div>BPM: {mood.bpm}</div>
              <div>Key: {mood.key}</div>
              <div>Genre: {mood.genre}</div>
              <div className="flex flex-wrap gap-1 mt-2">
                {mood.emotionalTags.map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-full text-xs bg-blue-500/20 text-blue-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {variations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            {variations.map(variation => (
              <motion.div
                key={variation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded border border-blue-500/30 bg-gray-700/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {variation.name.includes('Mirror') ? (
                      <FiMoon className="text-purple-400" />
                    ) : (
                      <FiSun className="text-yellow-400" />
                    )}
                    <span className="font-medium">{variation.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map(rating => (
                      <button
                        key={rating}
                        onClick={() => handleUserFeedback(variation.id, rating)}
                        className={`p-1 rounded transition-colors ${
                          variation.userRating === rating
                            ? 'text-yellow-400'
                            : 'text-gray-400 hover:text-yellow-400/50'
                        }`}
                      >
                        <FiHeart className={variation.userRating === rating ? 'fill-current' : ''} />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="text-sm text-gray-400">
                  <div>BPM: {variation.mood.bpm}</div>
                  <div>Key: {variation.mood.key}</div>
                  <div>Genre: {variation.mood.genre}</div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {variation.mood.emotionalTags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-full text-xs bg-blue-500/20 text-blue-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {isProcessing && (
        <div className="mt-4 text-center text-blue-400">
          <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-full" />
          <div className="mt-2">Processing mood variations...</div>
        </div>
      )}
    </div>
  );
};

export default MoodComposer; 