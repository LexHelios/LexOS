import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';

const SystemStatus: React.FC = () => {
  const [status, setStatus] = useState<{
    status: 'healthy' | 'degraded' | 'critical';
    message: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await apiService.getSystemStatus();
        setStatus(data);
      } catch (error) {
        console.error('Error fetching system status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="bg-cyber-light rounded-lg p-4 border border-cyber-primary/20">
        <div className="text-cyber-primary animate-pulse-neon">Loading system status...</div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="bg-cyber-light rounded-lg p-4 border border-cyber-neon-red">
        <div className="text-cyber-neon-red">Failed to load system status</div>
      </div>
    );
  }

  const getStatusColor = () => {
    switch (status.status) {
      case 'healthy':
        return 'text-cyber-neon-green';
      case 'degraded':
        return 'text-cyber-neon-yellow';
      case 'critical':
        return 'text-cyber-neon-red';
      default:
        return 'text-cyber-primary';
    }
  };

  const getStatusIcon = () => {
    switch (status.status) {
      case 'healthy':
        return '✓';
      case 'degraded':
        return '⚠';
      case 'critical':
        return '✕';
      default:
        return '?';
    }
  };

  return (
    <div className="bg-cyber-light rounded-lg p-4 border border-cyber-primary/20">
      <div className="flex items-center space-x-2">
        <span className={`text-2xl ${getStatusColor()}`}>{getStatusIcon()}</span>
        <div>
          <h3 className="text-lg font-bold text-cyber-primary">System Status</h3>
          <p className={`${getStatusColor()} font-mono`}>{status.message}</p>
        </div>
      </div>
    </div>
  );
};

export default SystemStatus; 