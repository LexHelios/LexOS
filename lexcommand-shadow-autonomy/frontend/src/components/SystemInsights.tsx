import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiActivity, FiShield, FiTrendingUp, FiAlertTriangle } from 'react-icons/fi';

interface SystemInsight {
  type: 'performance' | 'security' | 'usage';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  recommendation: string;
  timestamp: number;
}

interface SystemInsightsProps {
  insights: SystemInsight[];
  onDismiss: (id: string) => void;
}

const getInsightIcon = (type: SystemInsight['type']) => {
  switch (type) {
    case 'performance':
      return <FiActivity className="w-5 h-5" />;
    case 'security':
      return <FiShield className="w-5 h-5" />;
    case 'usage':
      return <FiTrendingUp className="w-5 h-5" />;
    default:
      return <FiAlertTriangle className="w-5 h-5" />;
  }
};

const getSeverityColor = (severity: SystemInsight['severity']) => {
  switch (severity) {
    case 'high':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'low':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  }
};

const SystemInsights: React.FC<SystemInsightsProps> = ({ insights, onDismiss }) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        System Insights
      </h2>
      <AnimatePresence>
        {insights.map((insight) => (
          <motion.div
            key={insight.timestamp}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${getSeverityColor(insight.severity)}`}>
                  {getInsightIcon(insight.type)}
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {insight.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    {insight.description}
                  </p>
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {insight.type}
                    </span>
                    <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(insight.severity)}`}>
                      {insight.severity}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    <strong>Recommendation:</strong> {insight.recommendation}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onDismiss(insight.timestamp.toString())}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                aria-label="Dismiss insight"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default SystemInsights; 