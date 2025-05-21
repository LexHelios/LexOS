import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { apiService, PerformanceMetrics } from '../services/api';

interface AgentDetailsProps {
  agentId: string;
  onClose: () => void;
}

const AgentDetails: React.FC<AgentDetailsProps> = ({ agentId, onClose }) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await apiService.getAgentMetrics(agentId);
        setMetrics(data);
      } catch (error) {
        console.error('Error fetching agent metrics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, [agentId]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-cyber-dark/80 flex items-center justify-center">
        <div className="text-cyber-primary animate-pulse-neon">Loading...</div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="fixed inset-0 bg-cyber-dark/80 flex items-center justify-center">
        <div className="text-cyber-neon-red">Failed to load agent metrics</div>
      </div>
    );
  }

  const chartData = {
    labels: metrics.metrics.timestamps,
    datasets: [
      {
        label: 'CPU Usage',
        data: metrics.metrics.cpu,
        borderColor: '#00ff9f',
        backgroundColor: 'rgba(0, 255, 159, 0.2)',
        tension: 0.4
      },
      {
        label: 'Memory Usage',
        data: metrics.metrics.memory,
        borderColor: '#00ffff',
        backgroundColor: 'rgba(0, 255, 255, 0.2)',
        tension: 0.4
      },
      {
        label: 'Active Tasks',
        data: metrics.metrics.tasks,
        borderColor: '#ff00ff',
        backgroundColor: 'rgba(255, 0, 255, 0.2)',
        tension: 0.4
      }
    ]
  };

  return (
    <div className="fixed inset-0 bg-cyber-dark/80 flex items-center justify-center">
      <div className="bg-cyber-light rounded-lg p-6 w-full max-w-4xl border border-cyber-primary shadow-neon">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-cyber-primary">Agent Details</h2>
          <button
            onClick={onClose}
            className="text-cyber-primary hover:text-cyber-neon-red transition-colors"
          >
            Close
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-cyber-darker rounded-lg p-4 border border-cyber-primary/20">
            <h3 className="text-lg font-bold mb-2">CPU Usage</h3>
            <div className="text-3xl font-mono">
              {metrics.metrics.cpu[metrics.metrics.cpu.length - 1]}%
            </div>
          </div>
          <div className="bg-cyber-darker rounded-lg p-4 border border-cyber-primary/20">
            <h3 className="text-lg font-bold mb-2">Memory Usage</h3>
            <div className="text-3xl font-mono">
              {metrics.metrics.memory[metrics.metrics.memory.length - 1]}%
            </div>
          </div>
          <div className="bg-cyber-darker rounded-lg p-4 border border-cyber-primary/20">
            <h3 className="text-lg font-bold mb-2">Active Tasks</h3>
            <div className="text-3xl font-mono">
              {metrics.metrics.tasks[metrics.metrics.tasks.length - 1]}
            </div>
          </div>
        </div>

        <div className="h-96">
          <Line
            data={chartData}
            options={{
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
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default AgentDetails; 