import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

interface LayoutProps {
  className?: string;
}

export const Layout: React.FC<LayoutProps> = ({ className = '' }) => {
  return (
    <div className={`flex h-screen bg-gray-50 dark:bg-gray-900 ${className}`}>
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopBar />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-6 py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}; 