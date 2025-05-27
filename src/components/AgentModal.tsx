import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCpu, FiHardDrive, FiAlertCircle, FiClock, FiWifi } from 'react-icons/fi';
import { useAgent } from '../context/AgentContext';

export const AgentModal: React.FC = () => {
  const { state, dispatch } = useAgent();
  const selectedAgent = state.selectedAgent ? state.agents[state.selectedAgent] : null;

  if (!selectedAgent) return null;

  const handleClose = () => {
    dispatch({ type: 'SELECT_AGENT', payload: null });
  };

  return (
    <AnimatePresence>
      {state.selectedAgent && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-gray-900 border border-blue-500/30 rounded-lg p-6 w-full max-w-2xl"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-blue-400">{selectedAgent.name}</h2>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>

            {/* Status Badge */}
            <div className="mb-6">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  selectedAgent.status === 'online'
                    ? 'bg-green-500/20 text-green-400'
                    : selectedAgent.status === 'warning'
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-red-500/20 text-red-400'
                }`}
              >
                {selectedAgent.status.toUpperCase()}
              </span>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-800/50 p-4 rounded-lg border border-blue-500/20">
                <div className="flex items-center mb-2">
                  <FiCpu className="text-blue-400 mr-2" />
                  <span className="text-gray-300">CPU Usage</span>
                </div>
                <div className="text-2xl font-bold text-blue-400">
                  {selectedAgent.metrics.cpu}%
                </div>
              </div>

              <div className="bg-gray-800/50 p-4 rounded-lg border border-blue-500/20">
                <div className="flex items-center mb-2">
                  <FiHardDrive className="text-blue-400 mr-2" />
                  <span className="text-gray-300">Memory Usage</span>
                </div>
                <div className="text-2xl font-bold text-blue-400">
                  {selectedAgent.metrics.memory}%
                </div>
              </div>

              <div className="bg-gray-800/50 p-4 rounded-lg border border-blue-500/20">
                <div className="flex items-center mb-2">
                  <FiAlertCircle className="text-blue-400 mr-2" />
                  <span className="text-gray-300">Active Tasks</span>
                </div>
                <div className="text-2xl font-bold text-blue-400">
                  {selectedAgent.metrics.tasks}
                </div>
              </div>

              <div className="bg-gray-800/50 p-4 rounded-lg border border-blue-500/20">
                <div className="flex items-center mb-2">
                  <FiClock className="text-blue-400 mr-2" />
                  <span className="text-gray-300">Uptime</span>
                </div>
                <div className="text-2xl font-bold text-blue-400">
                  {Math.floor(selectedAgent.uptime / 3600)}h
                </div>
              </div>
            </div>

            {/* Configuration */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-blue-400 mb-3">Configuration</h3>
              <div className="bg-gray-800/50 p-4 rounded-lg border border-blue-500/20">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-400">Model</span>
                    <p className="text-white">{selectedAgent.config.model}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Version</span>
                    <p className="text-white">{selectedAgent.config.version}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Connection Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FiWifi
                  className={`mr-2 ${
                    selectedAgent.wsState === 'connected'
                      ? 'text-green-400'
                      : selectedAgent.wsState === 'reconnecting'
                      ? 'text-yellow-400'
                      : 'text-red-400'
                  }`}
                />
                <span className="text-gray-300">
                  {selectedAgent.wsState.toUpperCase()}
                </span>
              </div>
              <span className="text-gray-400 text-sm">
                Last sync: {new Date(selectedAgent.lastSync).toLocaleTimeString()}
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 