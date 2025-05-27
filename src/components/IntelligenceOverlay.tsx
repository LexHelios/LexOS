import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown, FiChevronUp, FiDownload, FiShare2, FiMaximize2 } from 'react-icons/fi';

interface IntelligenceCard {
  id: string;
  title: string;
  type: 'analysis' | 'prediction' | 'recommendation' | 'alert';
  content: string;
  timestamp: number;
  confidence: number;
  tags: string[];
  metadata: Record<string, any>;
}

interface IntelligenceOverlayProps {
  cards: IntelligenceCard[];
  onExport?: (card: IntelligenceCard, format: 'json' | 'csv' | 'markdown') => void;
  onShare?: (card: IntelligenceCard) => void;
  onExpand?: (card: IntelligenceCard) => void;
}

export const IntelligenceOverlay: React.FC<IntelligenceOverlayProps> = ({
  cards,
  onExport,
  onShare,
  onExpand,
}) => {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const handleCardClick = (cardId: string) => {
    setExpandedCard(expandedCard === cardId ? null : cardId);
  };

  const getTypeColor = (type: IntelligenceCard['type']) => {
    switch (type) {
      case 'analysis':
        return 'text-blue-400';
      case 'prediction':
        return 'text-purple-400';
      case 'recommendation':
        return 'text-green-400';
      case 'alert':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getTypeIcon = (type: IntelligenceCard['type']) => {
    switch (type) {
      case 'analysis':
        return '📊';
      case 'prediction':
        return '🔮';
      case 'recommendation':
        return '💡';
      case 'alert':
        return '⚠️';
      default:
        return '📝';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 space-y-4 z-50">
      <AnimatePresence>
        {cards.map((card) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gray-900 border border-blue-500/30 rounded-lg overflow-hidden"
          >
            {/* Card Header */}
            <div
              className="p-4 cursor-pointer"
              onClick={() => handleCardClick(card.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">{getTypeIcon(card.type)}</span>
                  <h3 className={`font-semibold ${getTypeColor(card.type)}`}>
                    {card.title}
                  </h3>
                </div>
                <motion.button
                  animate={{ rotate: expandedCard === card.id ? 180 : 0 }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {expandedCard === card.id ? (
                    <FiChevronUp size={20} />
                  ) : (
                    <FiChevronDown size={20} />
                  )}
                </motion.button>
              </div>
            </div>

            {/* Card Content */}
            <AnimatePresence>
              {expandedCard === card.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-4 pb-4"
                >
                  <div className="space-y-4">
                    <p className="text-gray-300">{card.content}</p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                      {card.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Metadata */}
                    <div className="text-sm text-gray-400">
                      <p>Confidence: {card.confidence}%</p>
                      <p>
                        Timestamp:{' '}
                        {new Date(card.timestamp).toLocaleString()}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-4 pt-2">
                      {onExport && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => onExport(card, 'json')}
                            className="text-gray-400 hover:text-white transition-colors"
                            title="Export as JSON"
                          >
                            <FiDownload size={18} />
                          </button>
                          <button
                            onClick={() => onExport(card, 'csv')}
                            className="text-gray-400 hover:text-white transition-colors"
                            title="Export as CSV"
                          >
                            <FiDownload size={18} />
                          </button>
                          <button
                            onClick={() => onExport(card, 'markdown')}
                            className="text-gray-400 hover:text-white transition-colors"
                            title="Export as Markdown"
                          >
                            <FiDownload size={18} />
                          </button>
                        </div>
                      )}
                      {onShare && (
                        <button
                          onClick={() => onShare(card)}
                          className="text-gray-400 hover:text-white transition-colors"
                          title="Share"
                        >
                          <FiShare2 size={18} />
                        </button>
                      )}
                      {onExpand && (
                        <button
                          onClick={() => onExpand(card)}
                          className="text-gray-400 hover:text-white transition-colors"
                          title="Expand"
                        >
                          <FiMaximize2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}; 