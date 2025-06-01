import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const SystemStatus: React.FC = () => {
  const { darkMode } = useTheme();

  const metrics = [
    { name: 'CPU Usage', value: '45%', status: 'normal' },
    { name: 'Memory', value: '2.4GB/8GB', status: 'normal' },
    { name: 'Network', value: '1.2MB/s', status: 'normal' },
    { name: 'Storage', value: '128GB/256GB', status: 'warning' },
  ];

  return (
    <div className="military-panel">
      <div className="military-heading mb-2">SYSTEM STATUS</div>
      <div className={`space-y-2 ${darkMode ? 'text-green-400' : 'text-green-800'}`}>
        {metrics.map((metric) => (
          <div
            key={metric.name}
            className={`p-2 rounded ${
              darkMode ? 'bg-gray-800' : 'bg-gray-100'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="font-mono">{metric.name}</span>
              <span
                className={`font-mono ${
                  metric.status === 'warning'
                    ? darkMode
                      ? 'text-yellow-400'
                      : 'text-yellow-600'
                    : ''
                }`}
              >
                {metric.value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SystemStatus; 