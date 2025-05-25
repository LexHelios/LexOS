import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiClock, FiCode, FiChevronDown, FiChevronUp, FiPlay, FiPause, FiRefreshCw } from 'react-icons/fi';
import { format } from 'date-fns';

export interface AgentTrace {
  id: string;
  timestamp: number;
  prompt: string;
  plan: {
    steps: string[];
    confidence: number;
  };
  output: string;
  duration: number;
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
  model: string;
  metadata?: {
    temperature?: number;
    top_p?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
  };
}

interface AgentTracePanelProps {
  traces: AgentTrace[];
  onTraceClick?: (trace: AgentTrace) => void;
  className?: string;
}

export const AgentTracePanel: React.FC<AgentTracePanelProps> = ({
  traces,
  onTraceClick,
  className = '',
}) => {
  const [expandedTrace, setExpandedTrace] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const handleTraceClick = (trace: AgentTrace) => {
    setExpandedTrace(expandedTrace === trace.id ? null : trace.id);
    onTraceClick?.(trace);
  };

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Agent Trace
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={togglePlayback}
            className="flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-200 rounded hover:bg-blue-200 dark:hover:bg-blue-900/40"
          >
            {isPlaying ? (
              <FiPause className="w-4 h-4 mr-1" />
            ) : (
              <FiPlay className="w-4 h-4 mr-1" />
            )}
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <select
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
            className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            aria-label="Playback speed"
          >
            <option value={0.5}>0.5x</option>
            <option value={1}>1x</option>
            <option value={2}>2x</option>
            <option value={5}>5x</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {traces.map((trace) => (
            <motion.div
              key={trace.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden"
            >
              <button
                onClick={() => handleTraceClick(trace)}
                className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FiCode className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(trace.timestamp), 'MMM d, yyyy HH:mm:ss')}
                    </span>
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 rounded-full">
                      {trace.model}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <FiClock className="w-4 h-4 mr-1" />
                      {formatDuration(trace.duration)}
                    </div>
                    {expandedTrace === trace.id ? (
                      <FiChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <FiChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
                <p className="mt-2 text-gray-900 dark:text-white line-clamp-2">
                  {trace.prompt}
                </p>
              </button>

              <AnimatePresence>
                {expandedTrace === trace.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                      {/* Plan */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Plan
                        </h4>
                        <div className="space-y-2">
                          {trace.plan.steps.map((step, index) => (
                            <div
                              key={index}
                              className="flex items-start space-x-2 text-sm"
                            >
                              <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-200 rounded-full">
                                {index + 1}
                              </span>
                              <p className="text-gray-600 dark:text-gray-300">
                                {step}
                              </p>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                          Confidence: {Math.round(trace.plan.confidence * 100)}%
                        </div>
                      </div>

                      {/* Output */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Output
                        </h4>
                        <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                            {trace.output}
                          </pre>
                        </div>
                      </div>

                      {/* Metrics */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Tokens
                          </h4>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Prompt
                              </p>
                              <p className="text-sm font-medium">
                                {trace.tokens.prompt}
                              </p>
                            </div>
                            <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Completion
                              </p>
                              <p className="text-sm font-medium">
                                {trace.tokens.completion}
                              </p>
                            </div>
                            <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Total
                              </p>
                              <p className="text-sm font-medium">
                                {trace.tokens.total}
                              </p>
                            </div>
                          </div>
                        </div>

                        {trace.metadata && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Parameters
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                              {Object.entries(trace.metadata).map(([key, value]) => (
                                <div
                                  key={key}
                                  className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded"
                                >
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {key.replace(/_/g, ' ')}
                                  </p>
                                  <p className="text-sm font-medium">{value}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
        {traces.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No traces available
          </div>
        )}
      </div>
    </div>
  );
}; 