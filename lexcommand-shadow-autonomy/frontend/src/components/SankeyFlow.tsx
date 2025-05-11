import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { FiInfo, FiMaximize2, FiMinimize2 } from 'react-icons/fi';
import { format } from 'date-fns';

interface FlowNode {
  id: string;
  name: string;
  type: 'service' | 'resource' | 'external';
  value: number;
  color?: string;
}

interface FlowLink {
  source: string;
  target: string;
  value: number;
  label?: string;
}

interface SankeyFlowProps {
  nodes: FlowNode[];
  links: FlowLink[];
  onNodeClick?: (node: FlowNode) => void;
  onLinkClick?: (link: FlowLink) => void;
  className?: string;
}

const getNodeColor = (type: FlowNode['type'], value: number) => {
  const intensity = Math.min(100, Math.max(0, value));
  switch (type) {
    case 'service':
      return `hsl(210, 100%, ${100 - intensity}%)`;
    case 'resource':
      return `hsl(120, 100%, ${100 - intensity}%)`;
    case 'external':
      return `hsl(280, 100%, ${100 - intensity}%)`;
    default:
      return `hsl(0, 0%, ${100 - intensity}%)`;
  }
};

export const SankeyFlow: React.FC<SankeyFlowProps> = ({
  nodes,
  links,
  onNodeClick,
  onLinkClick,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<FlowNode | null>(null);
  const [hoveredLink, setHoveredLink] = useState<FlowLink | null>(null);

  // Calculate node positions and dimensions
  const nodePositions = nodes.reduce((acc, node) => {
    const typeIndex = ['service', 'resource', 'external'].indexOf(node.type);
    const x = (typeIndex * 33) + '%';
    const y = `${Math.random() * 80}%`;
    acc[node.id] = { x, y };
    return acc;
  }, {} as Record<string, { x: string; y: string }>);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleNodeHover = (node: FlowNode | null) => {
    setHoveredNode(node);
    setHoveredLink(null);
  };

  const handleLinkHover = (link: FlowLink | null) => {
    setHoveredLink(link);
    setHoveredNode(null);
  };

  return (
    <div
      ref={containerRef}
      className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden ${
        isFullscreen ? 'fixed inset-0 z-50' : className
      }`}
    >
      <div className="absolute top-4 right-4 z-10 flex items-center space-x-2">
        <button
          onClick={toggleFullscreen}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
        >
          {isFullscreen ? (
            <FiMinimize2 className="w-5 h-5" />
          ) : (
            <FiMaximize2 className="w-5 h-5" />
          )}
        </button>
      </div>

      <div className="p-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          System Flow
        </h2>

        {/* Legend */}
        <div className="flex items-center space-x-4 mb-4">
          {['service', 'resource', 'external'].map((type) => (
            <div key={type} className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getNodeColor(type as FlowNode['type'], 50) }}
              />
              <span className="text-sm text-gray-600 dark:text-gray-300 capitalize">
                {type}
              </span>
            </div>
          ))}
        </div>

        {/* Sankey Diagram */}
        <div className="relative h-[600px]">
          {/* Nodes */}
          {nodes.map((node) => {
            const position = nodePositions[node.id];
            const color = node.color || getNodeColor(node.type, node.value);
            const isHovered = hoveredNode?.id === node.id;

            return (
              <motion.div
                key={node.id}
                className="absolute"
                style={{
                  left: position.x,
                  top: position.y,
                  transform: 'translate(-50%, -50%)',
                }}
                whileHover={{ scale: 1.1 }}
                onClick={() => onNodeClick?.(node)}
                onMouseEnter={() => handleNodeHover(node)}
                onMouseLeave={() => handleNodeHover(null)}
              >
                <div
                  className={`p-3 rounded-lg shadow-sm cursor-pointer transition-all ${
                    isHovered ? 'ring-2 ring-blue-500' : ''
                  }`}
                  style={{ backgroundColor: color }}
                >
                  <div className="text-sm font-medium text-white">
                    {node.name}
                  </div>
                  <div className="text-xs text-white/80">
                    {node.value.toLocaleString()}
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* Links */}
          {links.map((link, index) => {
            const sourceNode = nodes.find(n => n.id === link.source);
            const targetNode = nodes.find(n => n.id === link.target);
            if (!sourceNode || !targetNode) return null;

            const sourcePos = nodePositions[link.source];
            const targetPos = nodePositions[link.target];
            const isHovered = hoveredLink === link;

            return (
              <motion.div
                key={index}
                className="absolute pointer-events-none"
                style={{
                  left: '50%',
                  top: '50%',
                  width: '100%',
                  height: '100%',
                }}
                onMouseEnter={() => handleLinkHover(link)}
                onMouseLeave={() => handleLinkHover(null)}
              >
                <svg
                  className="absolute inset-0 w-full h-full"
                  style={{ pointerEvents: 'all' }}
                >
                  <path
                    d={`M ${sourcePos.x} ${sourcePos.y} C ${
                      (parseFloat(sourcePos.x) + parseFloat(targetPos.x)) / 2
                    } ${sourcePos.y}, ${
                      (parseFloat(sourcePos.x) + parseFloat(targetPos.x)) / 2
                    } ${targetPos.y}, ${targetPos.x} ${targetPos.y}`}
                    stroke={isHovered ? '#3B82F6' : '#94A3B8'}
                    strokeWidth={Math.max(1, Math.log(link.value) * 2)}
                    fill="none"
                    className="transition-all duration-200"
                  />
                  {isHovered && (
                    <text
                      x={(parseFloat(sourcePos.x) + parseFloat(targetPos.x)) / 2}
                      y={(parseFloat(sourcePos.y) + parseFloat(targetPos.y)) / 2}
                      textAnchor="middle"
                      className="text-xs fill-gray-700 dark:fill-gray-300"
                    >
                      {link.label || `${link.value.toLocaleString()} units`}
                    </text>
                  )}
                </svg>
              </motion.div>
            );
          })}
        </div>

        {/* Tooltip */}
        <AnimatePresence>
          {(hoveredNode || hoveredLink) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-4 left-4 right-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
            >
              {hoveredNode && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {hoveredNode.name}
                  </h3>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Type: {hoveredNode.type}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Value: {hoveredNode.value.toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
              {hoveredLink && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Flow Details
                  </h3>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      From: {nodes.find(n => n.id === hoveredLink.source)?.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      To: {nodes.find(n => n.id === hoveredLink.target)?.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Value: {hoveredLink.value.toLocaleString()}
                    </p>
                    {hoveredLink.label && (
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {hoveredLink.label}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}; 