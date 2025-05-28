import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { motion } from 'framer-motion';

import { Agent } from '@/stores/agentStore';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface AgentNodeData {
  agent: Agent;
}

const statusColors = {
  idle: 'bg-gray-500',
  running: 'bg-green-500',
  error: 'bg-red-500',
  completed: 'bg-blue-500',
};

export const AgentNode = memo(({ data }: NodeProps<AgentNodeData>) => {
  const { agent } = data;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card className="w-[200px]">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">{agent.name}</h3>
            <Badge
              variant="secondary"
              className={`${statusColors[agent.status]} text-white`}
            >
              {agent.status}
            </Badge>
          </div>

          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>CPU:</span>
              <span>{agent.metrics.cpu}%</span>
            </div>
            <div className="flex justify-between">
              <span>Memory:</span>
              <span>{agent.metrics.memory}%</span>
            </div>
            <div className="flex justify-between">
              <span>GPU:</span>
              <span>{agent.metrics.gpu}%</span>
            </div>
          </div>

          {agent.error && (
            <div className="mt-2 text-xs text-red-500">{agent.error}</div>
          )}
        </CardContent>
      </Card>

      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-primary"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-primary"
      />
    </motion.div>
  );
});

AgentNode.displayName = 'AgentNode'; 