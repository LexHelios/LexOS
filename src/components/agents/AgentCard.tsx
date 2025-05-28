import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Agent } from '@/stores/agentStore';

interface AgentCardProps {
  agent: Agent;
  isSelected: boolean;
  onClick: () => void;
}

const statusColors = {
  idle: 'bg-gray-500',
  running: 'bg-green-500',
  error: 'bg-red-500',
  completed: 'bg-blue-500',
};

export const AgentCard: React.FC<AgentCardProps> = ({
  agent,
  isSelected,
  onClick,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card
        className={`cursor-pointer transition-all ${
          isSelected ? 'ring-2 ring-primary' : ''
        }`}
        onClick={onClick}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{agent.name}</CardTitle>
          <Badge
            variant="secondary"
            className={`${statusColors[agent.status]} text-white`}
          >
            {agent.status}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>CPU</span>
              <span>{agent.metrics.cpu}%</span>
            </div>
            <Progress value={agent.metrics.cpu} className="h-2" />
            
            <div className="flex items-center justify-between text-sm">
              <span>Memory</span>
              <span>{agent.metrics.memory}%</span>
            </div>
            <Progress value={agent.metrics.memory} className="h-2" />
            
            <div className="flex items-center justify-between text-sm">
              <span>GPU</span>
              <span>{agent.metrics.gpu}%</span>
            </div>
            <Progress value={agent.metrics.gpu} className="h-2" />
          </div>
          
          {agent.error && (
            <div className="mt-2 text-sm text-red-500">
              Error: {agent.error}
            </div>
          )}
          
          <div className="mt-2 text-xs text-muted-foreground">
            Last update: {new Date(agent.lastUpdate).toLocaleTimeString()}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}; 