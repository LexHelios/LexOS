import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Radar from '../components/Radar';
import SystemStatus from '../components/SystemStatus';

const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme, darkMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const themes = [
    { name: 'Dark', value: 'dark', icon: '🌙' },
    { name: 'Light', value: 'light', icon: '☀️' },
    { name: 'Gold', value: 'gold', icon: '✨' },
    { name: 'Platinum', value: 'platinum', icon: '💎' },
  ];

  const getThemeButtonStyle = () => {
    switch (theme) {
      case 'gold':
        return 'bg-gradient-to-r from-gold-light via-gold to-gold-dark text-black';
      case 'platinum':
        return 'bg-gradient-to-r from-platinum-light via-platinum to-platinum-dark text-gray-900';
      default:
        return darkMode
          ? 'bg-gray-800 text-white hover:bg-gray-700'
          : 'bg-white text-gray-900 hover:bg-gray-100';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${getThemeButtonStyle()} shadow-lg hover:shadow-xl`}
      >
        <span className="text-xl">🎨</span>
        <span className="font-medium">Theme</span>
        <span className="text-xs">▼</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-xl bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1">
            {themes.map((themeOption) => (
              <button
                key={themeOption.value}
                onClick={() => {
                  setTheme(themeOption.value as any);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}
              >
                <span className="text-lg">{themeOption.icon}</span>
                <span>{themeOption.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { darkMode, theme } = useTheme();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    // Simulate system logs
    const logMessages = [
      'System initialized...',
      'Loading core modules...',
      'Establishing secure connection...',
      'Running system diagnostics...',
      'All systems operational.',
    ];

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < logMessages.length) {
        setLogs((prev) => [...prev, logMessages[currentIndex]]);
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  const getHeaderStyle = () => {
    switch (theme) {
      case 'gold':
        return 'bg-gradient-to-r from-gold-light via-gold to-gold-dark';
      case 'platinum':
        return 'bg-gradient-to-r from-platinum-light via-platinum to-platinum-dark';
      default:
        return darkMode ? 'bg-gray-800' : 'bg-white';
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <header className={`p-4 ${getHeaderStyle()} shadow-md`}>
        <div className="container mx-auto flex justify-between items-center">
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            LexOS Control Center
          </h1>
          <div className="flex items-center space-x-4">
            <ThemeSwitcher />
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <Radar />
            <SystemStatus />
          </div>
          <div className="military-panel">
            <div className="military-heading mb-2">SYSTEM LOGS</div>
            <div className={`terminal-log h-64 ${darkMode ? 'text-green-400' : 'text-green-800'}`}>
              {logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {`[${new Date().toLocaleTimeString()}] ${log}`}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;