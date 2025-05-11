import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { FiUser, FiAlertCircle, FiCode, FiX } from 'react-icons/fi';

export interface AuditEvent {
  id: string;
  timestamp: number;
  userId: string;
  userName: string;
  action: string;
  details: string;
  type: 'insight' | 'trace' | 'system';
}

interface AuditLogProps {
  events: AuditEvent[];
  onClear?: () => void;
  className?: string;
}

export const AuditLog: React.FC<AuditLogProps> = ({
  events,
  onClear,
  className = '',
}) => {
  const getEventIcon = (type: AuditEvent['type']) => {
    switch (type) {
      case 'insight':
        return FiAlertCircle;
      case 'trace':
        return FiCode;
      default:
        return FiUser;
    }
  };

  const getEventColor = (type: AuditEvent['type']) => {
    switch (type) {
      case 'insight':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'trace':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm ${className}`}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Audit Log
        </h2>
        {onClear && (
          <button
            onClick={onClear}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="Clear audit log"
          >
            <FiX className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        <AnimatePresence>
          {events.map((event) => {
            const Icon = getEventIcon(event.type);
            const iconColor = getEventColor(event.type);

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-4"
              >
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${iconColor} bg-opacity-10`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {event.action}
                      </p>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {format(new Date(event.timestamp), 'MMM d, HH:mm:ss')}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                      {event.details}
                    </p>
                    <div className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <FiUser className="w-4 h-4 mr-1" />
                      {event.userName}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}; 