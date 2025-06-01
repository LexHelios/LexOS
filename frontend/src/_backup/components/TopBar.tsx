import React, { useEffect, useState } from 'react';
import { FiClock, FiUser, FiLogOut } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import { useSessionStore } from '../services/SessionService';
import { sessionService } from '../services/SessionService';

interface TopBarProps {
  className?: string;
}

export const TopBar: React.FC<TopBarProps> = ({ className = '' }) => {
  const { user, token } = useSessionStore();
  const [timeUntilExpiry, setTimeUntilExpiry] = useState<string>('');

  useEffect(() => {
    const updateExpiry = () => {
      const expiry = localStorage.getItem('token_expiry');
      if (expiry) {
        const expiryDate = new Date(parseInt(expiry));
        setTimeUntilExpiry(formatDistanceToNow(expiryDate, { addSuffix: true }));
      }
    };

    updateExpiry();
    const interval = setInterval(updateExpiry, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await sessionService.logout();
  };

  return (
    <div className={`h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="h-full px-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <FiUser className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {user?.name || 'Guest'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-200 rounded-full">
              {user?.roles[0] || 'No Role'}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <FiClock className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Session expires {timeUntilExpiry}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <FiLogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}; 