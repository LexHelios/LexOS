import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import ForceGraph2D from 'force-graph';
import { FiServer, FiDatabase, FiCpu, FiMessageSquare, FiRefreshCw, FiAlertCircle, FiCode } from 'react-icons/fi';
import { websocketBus } from '../services/WebSocketBus';

export interface ServiceNode {
  id: string;
  name: string;
  type: 'api' | 'database' | 'cache' | 'queue';
  status: 'healthy' | 'degraded' | 'down';
  metrics: {
    cpu: number;
    memory: number;
    error_rate: number;
    uptime: number;
  };
  connections: string[];
}

interface ServiceMapProps {
  onNodeClick?: (node: ServiceNode) => void;
  className?: string;
}

const getNodeIcon = (type: ServiceNode['type']) => {
  switch (type) {
    case 'api':
      return <FiServer className="w-4 h-4" />;
    case 'database':
      return <FiDatabase className="w-4 h-4" />;
    case 'cache':
      return <FiCpu className="w-4 h-4" />;
    case 'queue':
      return <FiMessageSquare className="w-4 h-4" />;
  }
};

const getStatusColor = (status: ServiceNode['status']) => {
  switch (status) {
    case 'healthy':
      return 'text-green-500';
    case 'degraded':
      return 'text-yellow-500';
    case 'down':
      return 'text-red-500';
  }
};

export const ServiceMap: React.FC<ServiceMapProps> = ({
  onNodeClick,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);
  const [nodes, setNodes] = useState<ServiceNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<ServiceNode | null>(null);

  useEffect(() => {
    const unsubscribe = websocketBus.subscribe<ServiceNode[]>('service_status', (services) => {
      setNodes(services);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!containerRef.current || nodes.length === 0) return;

    // Prepare graph data
    const graphData = {
      nodes: nodes.map(node => ({
        id: node.id,
        name: node.name,
        type: node.type,
        status: node.status,
        metrics: node.metrics,
        val: 1,
        color: getStatusColor(node.status).replace('text-', '')
      })),
      links: nodes.flatMap(node =>
        node.connections.map(targetId => ({
          source: node.id,
          target: targetId
        }))
      )
    };

    // Initialize force graph
    graphRef.current = ForceGraph2D()(containerRef.current)
      .graphData(graphData)
      .nodeLabel('name')
      .nodeColor(node => node.color)
      .nodeRelSize(6)
      .linkWidth(2)
      .linkColor(() => '#666')
      .onNodeClick((node: any) => {
        const serviceNode = nodes.find(n => n.id === node.id);
        if (serviceNode) {
          setSelectedNode(serviceNode);
          onNodeClick?.(serviceNode);
        }
      });

    return () => {
      if (graphRef.current) {
        graphRef.current._destructor();
      }
    };
  }, [nodes, onNodeClick]);

  const handleAction = async (action: 'restart' | 'isolate' | 'debug', nodeId: string) => {
    try {
      await fetch(`/api/services/${nodeId}/${action}`, { method: 'POST' });
      // The WebSocket will update the service status
    } catch (error) {
      console.error(`Failed to ${action} service:`, error);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div ref={containerRef} className="w-full h-[600px] bg-white dark:bg-gray-800 rounded-lg shadow-md" />
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Service Types</h3>
        <div className="space-y-2">
          {['api', 'database', 'cache', 'queue'].map((type) => (
            <div key={type} className="flex items-center space-x-2">
              {getNodeIcon(type as ServiceNode['type'])}
              <span className="text-sm text-gray-600 dark:text-gray-300 capitalize">{type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Node Details */}
      {selectedNode && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="absolute top-4 right-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md w-80"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {selectedNode.name}
            </h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedNode.status)}`}>
              {selectedNode.status}
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Metrics</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                  <p className="text-xs text-gray-500 dark:text-gray-400">CPU</p>
                  <p className="text-sm font-medium">{selectedNode.metrics.cpu}%</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Memory</p>
                  <p className="text-sm font-medium">{selectedNode.metrics.memory}%</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Error Rate</p>
                  <p className="text-sm font-medium">{selectedNode.metrics.error_rate}%</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Uptime</p>
                  <p className="text-sm font-medium">{selectedNode.metrics.uptime}h</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Actions</h4>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleAction('restart', selectedNode.id)}
                  className="flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-200 rounded hover:bg-blue-200 dark:hover:bg-blue-900/40"
                >
                  <FiRefreshCw className="w-4 h-4 mr-1" />
                  Restart
                </button>
                <button
                  onClick={() => handleAction('isolate', selectedNode.id)}
                  className="flex items-center px-3 py-1 text-sm bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-200 rounded hover:bg-yellow-200 dark:hover:bg-yellow-900/40"
                >
                  <FiAlertCircle className="w-4 h-4 mr-1" />
                  Isolate
                </button>
                <button
                  onClick={() => handleAction('debug', selectedNode.id)}
                  className="flex items-center px-3 py-1 text-sm bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-200 rounded hover:bg-purple-200 dark:hover:bg-purple-900/40"
                >
                  <FiCode className="w-4 h-4 mr-1" />
                  Debug
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}; 