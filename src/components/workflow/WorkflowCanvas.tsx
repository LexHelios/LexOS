import React, { useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { Agent } from '@/stores/agentStore';
import { AgentNode } from './AgentNode';
import { WorkflowControls } from './WorkflowControls';

const nodeTypes = {
  agent: AgentNode,
};

interface WorkflowCanvasProps {
  agents: Agent[];
  onNodeClick?: (nodeId: string) => void;
  onEdgeUpdate?: (oldEdge: Edge, newConnection: Connection) => void;
  onConnect?: (connection: Connection) => void;
}

export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  agents,
  onNodeClick,
  onEdgeUpdate,
  onConnect,
}) => {
  const initialNodes: Node[] = agents.map((agent) => ({
    id: agent.id,
    type: 'agent',
    position: { x: Math.random() * 500, y: Math.random() * 500 },
    data: { agent },
  }));

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const handleConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds));
      onConnect?.(params);
    },
    [setEdges, onConnect]
  );

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onNodeClick?.(node.id);
    },
    [onNodeClick]
  );

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
        <Panel position="top-right">
          <WorkflowControls
            onLayout={() => {
              // Implement auto-layout logic here
            }}
            onClear={() => {
              setEdges([]);
            }}
          />
        </Panel>
      </ReactFlow>
    </div>
  );
}; 