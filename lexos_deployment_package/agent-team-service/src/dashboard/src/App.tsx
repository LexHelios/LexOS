import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import AgentDetails from './components/AgentDetails';
import SystemStatus from './components/SystemStatus';
import { useRealtimeUpdates } from './hooks/useRealtimeUpdates';

const App: React.FC = () => {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const { agents, taskHistory, isConnected } = useRealtimeUpdates();

  return (
    <div className="min-h-screen bg-cyber-dark text-cyber-primary font-cyber">
      {/* Header */}
      <header className="bg-cyber-darker border-b border-cyber-primary/20 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold animate-glow">LEXOS AGENT DASHBOARD</h1>
          <div className="flex items-center space-x-4">
            <SystemStatus />
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                isConnected ? 'bg-cyber-neon-green animate-pulse-neon' : 'bg-cyber-neon-red'
              }`} />
              <span className="text-sm">{isConnected ? 'CONNECTED' : 'DISCONNECTED'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4">
        <Dashboard
          agents={agents}
          taskHistory={taskHistory}
          onAgentSelect={setSelectedAgent}
        />
      </main>

      {/* Agent Details Modal */}
      {selectedAgent && (
        <AgentDetails
          agentId={selectedAgent}
          onClose={() => setSelectedAgent(null)}
        />
      )}

      {/* Cyberpunk Scan Line Effect */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyber-primary/5 to-transparent animate-scan" />
      </div>
    </div>
  );
};

export default App; 