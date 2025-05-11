import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMic, FiMicOff, FiSend, FiCommand, FiZap } from 'react-icons/fi';

interface Command {
  type: 'text' | 'voice';
  content: string;
  timestamp: number;
  status: 'processing' | 'success' | 'error';
  response?: string;
}

const LexOSCommand: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [inputText, setInputText] = useState('');
  const [commands, setCommands] = useState<Command[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setInputText(transcript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
    }
  }, []);

  const handleVoiceCommand = useCallback(() => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [isListening]);

  const handleCommand = useCallback(async (content: string, type: 'text' | 'voice') => {
    const command: Command = {
      type,
      content,
      timestamp: Date.now(),
      status: 'processing'
    };

    setCommands(prev => [command, ...prev]);
    setIsProcessing(true);

    try {
      // Simulate command processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Example command handling
      let response = '';
      if (content.toLowerCase().includes('play')) {
        response = 'Starting playback...';
      } else if (content.toLowerCase().includes('mix')) {
        response = 'Creating new mix...';
      } else if (content.toLowerCase().includes('enhance')) {
        response = 'Applying AI enhancements...';
      } else {
        response = 'Command received. Processing...';
      }

      setCommands(prev => prev.map(cmd => 
        cmd.timestamp === command.timestamp 
          ? { ...cmd, status: 'success', response }
          : cmd
      ));
    } catch (error) {
      setCommands(prev => prev.map(cmd => 
        cmd.timestamp === command.timestamp 
          ? { ...cmd, status: 'error', response: 'Error processing command' }
          : cmd
      ));
    } finally {
      setIsProcessing(false);
      setInputText('');
    }
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      handleCommand(inputText, 'text');
    }
  }, [inputText, handleCommand]);

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-gray-900/95 backdrop-blur-sm rounded-lg border border-blue-500/30 shadow-[0_0_15px_rgba(32,128,255,0.3)] overflow-hidden">
      {/* Cyberpunk grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,_rgba(32,128,255,0.1)_2%,_transparent_3%),_linear-gradient(90deg,transparent_0%,_rgba(32,128,255,0.1)_2%,_transparent_3%)] bg-[length:50px_50px] opacity-20"></div>

      <div className="relative z-10 p-4">
        <div className="flex items-center gap-2 mb-4">
          <FiCommand className="text-blue-400" />
          <h3 className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            LexOS Command Interface
          </h3>
        </div>

        {/* Command History */}
        <div className="h-48 overflow-y-auto mb-4 space-y-2">
          <AnimatePresence>
            {commands.map((command) => (
              <motion.div
                key={command.timestamp}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`p-2 rounded border ${
                  command.status === 'success'
                    ? 'border-green-500/30 bg-green-500/10'
                    : command.status === 'error'
                    ? 'border-red-500/30 bg-red-500/10'
                    : 'border-blue-500/30 bg-blue-500/10'
                }`}
              >
                <div className="flex items-center gap-2 text-sm">
                  {command.type === 'voice' ? (
                    <FiMic className="text-blue-400" />
                  ) : (
                    <FiCommand className="text-blue-400" />
                  )}
                  <span className="text-gray-300">{command.content}</span>
                </div>
                {command.response && (
                  <div className="mt-1 text-sm text-gray-400 flex items-center gap-2">
                    <FiZap className="text-purple-400" />
                    {command.response}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Command Input */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a command or speak..."
            className="flex-1 bg-gray-800/80 backdrop-blur-sm px-3 py-2 rounded text-sm border border-blue-500/30 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            disabled={isProcessing}
          />
          <button
            type="button"
            onClick={handleVoiceCommand}
            className={`p-2 rounded transition-colors ${
              isListening
                ? 'bg-red-500 hover:bg-red-600 border-red-400/30'
                : 'bg-blue-500 hover:bg-blue-600 border-blue-400/30'
            } border`}
            title={isListening ? 'Stop listening' : 'Start voice command'}
          >
            {isListening ? <FiMicOff /> : <FiMic />}
          </button>
          <button
            type="submit"
            disabled={!inputText.trim() || isProcessing}
            className="bg-purple-500 hover:bg-purple-600 p-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-purple-400/30"
            title="Send command"
          >
            <FiSend />
          </button>
        </form>

        {/* Command Suggestions */}
        <div className="mt-2 text-xs text-gray-400">
          Try: "play mix", "enhance track", "create new mix"
        </div>
      </div>
    </div>
  );
};

export default LexOSCommand; 