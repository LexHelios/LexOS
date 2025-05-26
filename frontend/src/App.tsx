import React from 'react';
import CyberpunkDashboard from './components/CyberpunkDashboard';
import './styles/cyberpunk.css';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-cyber-bg">
      <CyberpunkDashboard />
    </div>
  );
};

export default App; 