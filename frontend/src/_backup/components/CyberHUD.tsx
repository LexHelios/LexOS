import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCpu, FiActivity, FiZap, FiMusic } from 'react-icons/fi';

interface AIDecision {
  id: string;
  type: 'transition' | 'effect' | 'analysis' | 'suggestion';
  message: string;
  confidence: number;
  timestamp: number;
}

interface CyberHUDProps {
  isVisible: boolean;
  waveformData?: Float32Array;
  aiDecisions?: AIDecision[];
  currentBPM?: number;
  currentKey?: string;
  energyLevel?: number;
}

const CyberHUD: React.FC<CyberHUDProps> = ({
  isVisible,
  waveformData,
  aiDecisions = [],
  currentBPM,
  currentKey,
  energyLevel = 0
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showDecisions, setShowDecisions] = useState(true);

  // Draw waveform
  useEffect(() => {
    if (!canvasRef.current || !waveformData) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = '#00ffff';
      ctx.beginPath();

      const sliceWidth = canvas.width / waveformData.length;
      let x = 0;

      for (let i = 0; i < waveformData.length; i++) {
        const v = waveformData[i];
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      requestAnimationFrame(draw);
    };

    draw();
  }, [waveformData]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 pointer-events-none z-50"
        >
          {/* Top HUD Elements */}
          <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start">
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-blue-500/20 backdrop-blur-sm p-2 rounded border border-blue-500/30"
              >
                <FiCpu className="text-blue-400" />
              </motion.div>
              <div className="text-blue-400 font-mono">
                <div className="text-sm opacity-50">BPM</div>
                <div className="text-xl">{currentBPM || '---'}</div>
              </div>
              <div className="text-purple-400 font-mono">
                <div className="text-sm opacity-50">KEY</div>
                <div className="text-xl">{currentKey || '---'}</div>
              </div>
            </div>
            <motion.button
              onClick={() => setShowDecisions(!showDecisions)}
              className="bg-purple-500/20 backdrop-blur-sm p-2 rounded border border-purple-500/30 text-purple-400"
              title="Toggle AI decisions"
            >
              <FiActivity />
            </motion.button>
          </div>

          {/* Center Waveform */}
          <div className="absolute inset-0 flex items-center justify-center">
            <canvas
              ref={canvasRef}
              className="w-full h-32 opacity-50"
              width={window.innerWidth}
              height={128}
            />
          </div>

          {/* Energy Level Indicator */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800/50">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${energyLevel * 100}%` }}
              transition={{ type: 'spring', stiffness: 100 }}
            />
          </div>

          {/* AI Decisions Panel */}
          <AnimatePresence>
            {showDecisions && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="absolute top-20 left-4 w-80 space-y-2"
              >
                {aiDecisions.map((decision) => (
                  <motion.div
                    key={decision.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-gray-900/80 backdrop-blur-sm p-3 rounded border border-blue-500/30"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <FiZap className="text-blue-400" />
                      <span className="text-sm font-medium text-blue-400">
                        {decision.type.toUpperCase()}
                      </span>
                      <div className="flex-1" />
                      <div className="text-xs text-gray-400">
                        {new Date(decision.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="text-sm text-gray-300">{decision.message}</div>
                    <div className="mt-2 h-1 bg-gray-800 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-blue-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${decision.confidence * 100}%` }}
                        transition={{ type: 'spring', stiffness: 100 }}
                      />
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Corner Decorations */}
          <div className="absolute top-0 left-0 w-32 h-32 border-t-2 border-l-2 border-blue-500/30" />
          <div className="absolute top-0 right-0 w-32 h-32 border-t-2 border-r-2 border-blue-500/30" />
          <div className="absolute bottom-0 left-0 w-32 h-32 border-b-2 border-l-2 border-blue-500/30" />
          <div className="absolute bottom-0 right-0 w-32 h-32 border-b-2 border-r-2 border-blue-500/30" />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CyberHUD; 