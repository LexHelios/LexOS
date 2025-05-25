import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertCircle, FiAlertTriangle, FiInfo, FiX } from 'react-icons/fi';
import { websocketBus } from '../services/WebSocketBus';

export interface SystemInsight {
  id: string;
  type: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  recommendation: string;
  timestamp: number;
  component?: string;
  tags?: string[];
}

interface SystemInsightsPanelProps {
  maxInsights?: number;
  onInsightClick?: (insight: SystemInsight) => void;
  className?: string;
}

const getSeverityColor = (type: SystemInsight['type']) => {
  switch (type) {
    case 'critical':
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200 border-red-500';
    case 'warning':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200 border-yellow-500';
    case 'info':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200 border-green-500';
  }
};

const getSeverityIcon = (type: SystemInsight['type']) => {
  switch (type) {
    case 'critical':
      return <FiAlertCircle className="w-5 h-5" />;
    case 'warning':
      return <FiAlertTriangle className="w-5 h-5" />;
    case 'info':
      return <FiInfo className="w-5 h-5" />;
  }
};

export const SystemInsightsPanel: React.FC<SystemInsightsPanelProps> = ({
  maxInsights = 5,
  onInsightClick,
  className = '',
}) => {
  const [insights, setInsights] = useState<SystemInsight[]>([]);

  useEffect(() => {
    const unsubscribe = websocketBus.subscribe<SystemInsight>('insight_event', (insight) => {
      setInsights((prev) => {
        const newInsights = [insight, ...prev].slice(0, maxInsights);
        return newInsights;
      });
    });

    return () => unsubscribe();
  }, [maxInsights]);

  const handleDismiss = (id: string) => {
    setInsights((prev) => prev.filter((insight) => insight.id !== id));
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
        System Insights
      </h2>
      <AnimatePresence>
        {insights.map((insight) => (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className={`rounded-lg border-l-4 p-4 ${getSeverityColor(insight.type)}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className="mt-1">{getSeverityIcon(insight.type)}</div>
                <div>
                  <h3 className="font-medium">{insight.title}</h3>
                  <p className="mt-1 text-sm opacity-90">{insight.description}</p>
                  {insight.recommendation && (
                    <p className="mt-2 text-sm font-medium">
                      Recommendation: {insight.recommendation}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {insight.component && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800">
                        {insight.component}
                      </span>
                    )}
                    {insight.tags?.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {onInsightClick && (
                  <button
                    onClick={() => onInsightClick(insight)}
                    className="text-sm font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md"
                  >
                    Details
                  </button>
                )}
                <button
                  onClick={() => handleDismiss(insight.id)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md"
                  aria-label="Dismiss insight"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      {insights.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No active insights
        </div>
      )}
    </div>
  );
}; 