import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CyberpunkVisualizer from './CyberpunkVisualizer';
import BattleRadar from './BattleRadar';
import CommandConsole from './CommandConsole';
import '../styles/cyberpunk.css';

interface SystemStatus {
  name: string;
  status: 'active' | 'warning' | 'error';
  value: number;
  trend: 'up' | 'down' | 'stable';
}

const CyberpunkDashboard: React.FC = () => {
  const [systems, setSystems] = useState<SystemStatus[]>([
    { name: 'Beat Detection', status: 'active', value: 98, trend: 'up' },
    { name: 'Effects Processing', status: 'active', value: 95, trend: 'stable' },
    { name: 'Automation Engine', status: 'warning', value: 87, trend: 'down' },
    { name: 'Recording System', status: 'active', value: 100, trend: 'up' },
  ]);

  const [glitchActive, setGlitchActive] = useState(false);
  const [showHologram, setShowHologram] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 200);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'var(--military-green)';
      case 'warning': return 'var(--tactical-orange)';
      case 'error': return 'var(--cyber-pink)';
      default: return 'var(--military-green)';
    }
  };

  const handleAction = (action: string) => {
    setShowHologram(true);
    setTimeout(() => setShowHologram(false), 2000);
  };

  return (
    <div className="min-h-screen hud-grid p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className={`text-6xl font-bold military-heading ${glitchActive ? 'glitch' : ''}`}>LEXOS</h1>
        <p className="text-xl mt-2 military-heading" style={{ color: 'var(--tactical-orange)' }}>BATTLE COMMAND CENTER</p>
      </motion.div>

      {/* Radar */}
      <BattleRadar />

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {systems.map((system, index) => (
          <motion.div
            key={system.name}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="military-panel"
          >
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-bold military-heading">{system.name}</h3>
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getStatusColor(system.status), boxShadow: `0 0 10px ${getStatusColor(system.status)}` }}
              />
            </div>
            <div className="mt-4">
              <div className="text-3xl font-bold" style={{ color: getStatusColor(system.status) }}>
                {system.value}%
              </div>
              <div className="flex items-center mt-2">
                <span className="text-sm">
                  {system.trend === 'up' && '↑'}
                  {system.trend === 'down' && '↓'}
                  {system.trend === 'stable' && '→'}
                </span>
                <span className="text-sm ml-2">System Status</span>
              </div>
            </div>
            <div className="mt-4">
              <div className="h-2 bg-hud-gray rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${system.value}%` }}
                  transition={{ duration: 1, delay: index * 0.1 }}
                  className="h-full"
                  style={{ backgroundColor: getStatusColor(system.status) }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Visualizer */}
      <CyberpunkVisualizer />

      {/* Control Panel */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="military-panel"
      >
        <h2 className="text-xl font-bold military-heading mb-4">COMMAND MODULES</h2>
        <div className="flex flex-wrap justify-center">
          {['ARM', 'SCAN', 'DEPLOY', 'RECALL'].map((action, i) => (
            <motion.button
              key={action}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="military-btn"
              onClick={() => handleAction(action)}
            >
              {action}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Hologram Effect */}
      <AnimatePresence>
        {showHologram && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="military-panel" style={{ borderColor: 'var(--tactical-orange)', boxShadow: '0 0 30px var(--tactical-orange)' }}>
              <h3 className="text-2xl font-bold military-heading" style={{ color: 'var(--tactical-orange)' }}>COMMAND ENGAGED</h3>
              <p className="mt-2" style={{ color: 'var(--military-green)' }}>Processing command...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Command Console */}
      <CommandConsole />
    </div>
  );
};

export default CyberpunkDashboard; 