import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { FiHome, FiAlertCircle, FiCode, FiGitBranch, FiGrid } from 'react-icons/fi';

interface SidebarProps {
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ className = '' }) => {
  const location = useLocation();

  const navItems = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: FiHome,
    },
    {
      path: '/insights',
      label: 'System Insights',
      icon: FiAlertCircle,
    },
    {
      path: '/trace',
      label: 'Agent Traces',
      icon: FiCode,
    },
    {
      path: '/flow',
      label: 'Flow Map',
      icon: FiGitBranch,
    },
    {
      path: '/heatmap',
      label: 'Heatmap View',
      icon: FiGrid,
    },
  ];

  return (
    <div className={`w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="p-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          LexCommand
        </h1>
      </div>
      
      <nav className="mt-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center px-4 py-3 text-sm font-medium transition-colors
                ${isActive
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-200'
                  : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50'
                }
              `}
            >
              <Icon className="w-5 h-5 mr-3" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};
