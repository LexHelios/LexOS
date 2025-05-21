import React, { useState, useEffect } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface AgentStatus {
  id: string;
  name: string;
  status: 'active' | 'idle' | 'error';
  metrics: {
    cpu: number;
    memory: number;
    tasks: number;
  };
}

const Dashboard: React.FC = () => {
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  useEffect(() => {
    // Simulated data - replace with actual API calls
    const mockAgents: AgentStatus[] = [
      {
        id: 'nexus',
        name: 'Nexus',
        status: 'active',
        metrics: { cpu: 75, memory: 60, tasks: 5 }
      },
      {
        id: 'percept',
        name: 'Percept',
        status: 'active',
        metrics: { cpu: 65, memory: 55, tasks: 3 }
      },
      // Add other agents...
    ];
    setAgents(mockAgents);
  }, []);

  const performanceData = {
    labels: ['CPU', 'Memory', 'Tasks'],
    datasets: agents.map(agent => ({
      label: agent.name,
      data: [agent.metrics.cpu, agent.metrics.memory, agent.metrics.tasks],
      borderColor: getAgentColor(agent.id),
      backgroundColor: getAgentColor(agent.id, 0.2),
      tension: 0.4
    }))
  };

  const taskHistoryData = {
    labels: ['1h ago', '45m ago', '30m ago', '15m ago', 'Now'],
    datasets: [{
      label: 'Active Tasks',
      data: [12, 15, 18, 14, 16],
      borderColor: '#00ff9f',
      backgroundColor: 'rgba(0, 255, 159, 0.2)',
      tension: 0.4
    }]
  };

  return (
    <div className="min-h-screen bg-cyber-dark text-cyber-primary font-cyber">
      {/* Header */}
      <header className="bg-cyber-darker border-b border-cyber-primary/20 p-4">
        <h1 className="text-3xl font-bold animate-glow">LEXOS AGENT DASHBOARD</h1>
      </header>

      {/* Main Content */}
      <div className="container mx-auto p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Agent Status Cards */}
        {agents.map(agent => (
          <div
            key={agent.id}
            className={`bg-cyber-light rounded-lg p-4 border ${
              agent.status === 'active' ? 'border-cyber-primary shadow-neon' : 'border-cyber-light'
            } hover:shadow-neon transition-all duration-300 cursor-pointer`}
            onClick={() => setSelectedAgent(agent.id)}
          >
            <h2 className="text-xl font-bold mb-2">{agent.name}</h2>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                agent.status === 'active' ? 'bg-cyber-neon-green animate-pulse-neon' :
                agent.status === 'idle' ? 'bg-cyber-neon-yellow' :
                'bg-cyber-neon-red'
              }`} />
              <span className="text-sm">{agent.status.toUpperCase()}</span>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between">
                <span>CPU</span>
                <span>{agent.metrics.cpu}%</span>
              </div>
              <div className="w-full bg-cyber-darker rounded-full h-2">
                <div
                  className="bg-cyber-primary h-2 rounded-full"
                  style={{ width: `${agent.metrics.cpu}%` }}
                />
              </div>
            </div>
          </div>
        ))}

        {/* Performance Chart */}
        <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-cyber-light rounded-lg p-4 border border-cyber-primary/20">
          <h2 className="text-xl font-bold mb-4">Performance Metrics</h2>
          <div className="h-80">
            <Bar data={performanceData} options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                  grid: {
                    color: 'rgba(0, 255, 159, 0.1)'
                  }
                },
                x: {
                  grid: {
                    color: 'rgba(0, 255, 159, 0.1)'
                  }
                }
              },
              plugins: {
                legend: {
                  labels: {
                    color: '#00ff9f'
                  }
                }
              }
            }} />
          </div>
        </div>

        {/* Task History */}
        <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-cyber-light rounded-lg p-4 border border-cyber-primary/20">
          <h2 className="text-xl font-bold mb-4">Task History</h2>
          <div className="h-80">
            <Line data={taskHistoryData} options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                  grid: {
                    color: 'rgba(0, 255, 159, 0.1)'
                  }
                },
                x: {
                  grid: {
                    color: 'rgba(0, 255, 159, 0.1)'
                  }
                }
              },
              plugins: {
                legend: {
                  labels: {
                    color: '#00ff9f'
                  }
                }
              }
            }} />
          </div>
        </div>
      </div>
    </div>
  );
};

const getAgentColor = (agentId: string, alpha: number = 1): string => {
  const colors: { [key: string]: string } = {
    nexus: `rgba(0, 255, 159, ${alpha})`,
    percept: `rgba(0, 255, 255, ${alpha})`,
    cognos: `rgba(255, 0, 255, ${alpha})`,
    mnemosyne: `rgba(255, 255, 0, ${alpha})`,
    predictor: `rgba(255, 0, 0, ${alpha})`,
    innovator: `rgba(0, 0, 255, ${alpha})`,
    empath: `rgba(255, 128, 0, ${alpha})`,
    guardian: `rgba(128, 0, 255, ${alpha})`
  };
  return colors[agentId] || `rgba(0, 255, 159, ${alpha})`;
};

export default Dashboard; 