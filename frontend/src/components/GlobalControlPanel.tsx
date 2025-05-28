import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { useStore } from '../contexts/StoreContext';

interface SystemHealth {
  uptime: number;
  latency: number;
  eventBacklog: number;
  cpuUsage: number;
  memoryUsage: number;
  gpuUsage: number;
}

type SystemMode = 'safe' | 'autonomous' | 'training';

export const GlobalControlPanel: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth>({
    uptime: 0,
    latency: 0,
    eventBacklog: 0,
    cpuUsage: 0,
    memoryUsage: 0,
    gpuUsage: 0,
  });
  const [systemMode, setSystemMode] = useState<SystemMode>('safe');
  const [isEmergency, setIsEmergency] = useState(false);
  const { agentStore } = useStore();

  useEffect(() => {
    // Subscribe to system health updates
    const interval = setInterval(() => {
      // Simulate health metrics updates
      setHealth((prev) => ({
        ...prev,
        uptime: prev.uptime + 1,
        latency: Math.random() * 100,
        eventBacklog: Math.floor(Math.random() * 50),
        cpuUsage: Math.random() * 100,
        memoryUsage: Math.random() * 100,
        gpuUsage: Math.random() * 100,
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleModeChange = (mode: SystemMode) => {
    setSystemMode(mode);
    // Implement mode change logic
    console.log('System mode changed to:', mode);
  };

  const handleEmergencyOverride = () => {
    setIsEmergency(true);
    // Implement emergency override logic
    console.log('Emergency override activated');
  };

  const getHealthStatus = (value: number, threshold: number) => {
    if (value >= threshold) return 'destructive';
    if (value >= threshold * 0.7) return 'default';
    return 'secondary';
  };

  return (
    <Card className="w-full h-full p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Mission Control</h2>
        <Badge variant={isEmergency ? 'destructive' : 'default'}>
          {isEmergency ? 'EMERGENCY MODE' : systemMode.toUpperCase()}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <h3 className="text-sm font-medium">System Health</h3>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-sm">Uptime</span>
              <Badge variant={getHealthStatus(health.uptime, 86400)}>
                {Math.floor(health.uptime / 3600)}h {Math.floor((health.uptime % 3600) / 60)}m
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Latency</span>
              <Badge variant={getHealthStatus(health.latency, 100)}>
                {health.latency.toFixed(1)}ms
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Event Backlog</span>
              <Badge variant={getHealthStatus(health.eventBacklog, 50)}>
                {health.eventBacklog}
              </Badge>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium">Resource Usage</h3>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-sm">CPU</span>
              <Badge variant={getHealthStatus(health.cpuUsage, 80)}>
                {health.cpuUsage.toFixed(1)}%
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Memory</span>
              <Badge variant={getHealthStatus(health.memoryUsage, 80)}>
                {health.memoryUsage.toFixed(1)}%
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">GPU</span>
              <Badge variant={getHealthStatus(health.gpuUsage, 80)}>
                {health.gpuUsage.toFixed(1)}%
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex space-x-2">
          <Button
            variant={systemMode === 'safe' ? 'default' : 'outline'}
            onClick={() => handleModeChange('safe')}
          >
            Safe Mode
          </Button>
          <Button
            variant={systemMode === 'autonomous' ? 'default' : 'outline'}
            onClick={() => handleModeChange('autonomous')}
          >
            Autonomous
          </Button>
          <Button
            variant={systemMode === 'training' ? 'default' : 'outline'}
            onClick={() => handleModeChange('training')}
          >
            Training
          </Button>
        </div>

        <Button
          variant="destructive"
          className="w-full"
          onClick={handleEmergencyOverride}
        >
          Emergency Override
        </Button>
      </div>
    </Card>
  );
}; 