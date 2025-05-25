import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiDownload, FiFilter, FiSearch, FiClock, FiTag, FiAlertCircle } from 'react-icons/fi';
import { format, subDays } from 'date-fns';
import { SystemInsight } from './SystemInsightsPanel';

interface InsightLogbookProps {
  insights: SystemInsight[];
  className?: string;
}

type SortField = 'timestamp' | 'severity' | 'component';
type SortOrder = 'asc' | 'desc';
type TimeRange = '1d' | '7d' | '30d' | 'all';

export const InsightLogbook: React.FC<InsightLogbookProps> = ({
  insights,
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedComponents, setSelectedComponents] = useState<string[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Extract unique tags and components
  const { tags, components } = useMemo(() => {
    const uniqueTags = new Set<string>();
    const uniqueComponents = new Set<string>();

    insights.forEach(insight => {
      insight.tags?.forEach(tag => uniqueTags.add(tag));
      if (insight.component) uniqueComponents.add(insight.component);
    });

    return {
      tags: Array.from(uniqueTags),
      components: Array.from(uniqueComponents),
    };
  }, [insights]);

  // Filter and sort insights
  const filteredInsights = useMemo(() => {
    let filtered = [...insights];

    // Apply time range filter
    const now = Date.now();
    const timeRanges = {
      '1d': subDays(now, 1).getTime(),
      '7d': subDays(now, 7).getTime(),
      '30d': subDays(now, 30).getTime(),
      'all': 0,
    };
    filtered = filtered.filter(insight => insight.timestamp >= timeRanges[timeRange]);

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(insight =>
        insight.title.toLowerCase().includes(query) ||
        insight.description.toLowerCase().includes(query) ||
        insight.recommendation.toLowerCase().includes(query)
      );
    }

    // Apply tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(insight =>
        insight.tags?.some(tag => selectedTags.includes(tag))
      );
    }

    // Apply component filter
    if (selectedComponents.length > 0) {
      filtered = filtered.filter(insight =>
        insight.component && selectedComponents.includes(insight.component)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'timestamp':
          comparison = a.timestamp - b.timestamp;
          break;
        case 'severity':
          const severityOrder = { critical: 3, warning: 2, info: 1 };
          comparison = severityOrder[a.type] - severityOrder[b.type];
          break;
        case 'component':
          comparison = (a.component || '').localeCompare(b.component || '');
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [insights, searchQuery, selectedTags, selectedComponents, timeRange, sortField, sortOrder]);

  const handleExport = (format: 'json' | 'csv') => {
    const data = filteredInsights.map(insight => ({
      ...insight,
      timestamp: format(new Date(insight.timestamp), 'yyyy-MM-dd HH:mm:ss'),
    }));

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `insights-${format(new Date(), 'yyyy-MM-dd')}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const headers = ['Timestamp', 'Type', 'Title', 'Description', 'Component', 'Tags'];
      const csvContent = [
        headers.join(','),
        ...data.map(insight => [
          insight.timestamp,
          insight.type,
          `"${insight.title.replace(/"/g, '""')}"`,
          `"${insight.description.replace(/"/g, '""')}"`,
          insight.component || '',
          (insight.tags || []).join(';'),
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `insights-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Insight Logbook
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleExport('json')}
            className="flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-200 rounded hover:bg-blue-200 dark:hover:bg-blue-900/40"
          >
            <FiDownload className="w-4 h-4 mr-1" />
            Export JSON
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center px-3 py-1 text-sm bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-200 rounded hover:bg-green-200 dark:hover:bg-green-900/40"
          >
            <FiDownload className="w-4 h-4 mr-1" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search insights..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <FiFilter className="w-4 h-4 mr-2" />
          Filters
        </button>
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {isFilterOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 space-y-4">
              {/* Time Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Time Range
                </label>
                <div className="flex space-x-2">
                  {(['1d', '7d', '30d', 'all'] as TimeRange[]).map((range) => (
                    <button
                      key={range}
                      onClick={() => setTimeRange(range)}
                      className={`px-3 py-1 rounded ${
                        timeRange === range
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-200'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {range === 'all' ? 'All Time' : `Last ${range}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => {
                        setSelectedTags(prev =>
                          prev.includes(tag)
                            ? prev.filter(t => t !== tag)
                            : [...prev, tag]
                        );
                      }}
                      className={`px-2 py-1 rounded-full text-sm ${
                        selectedTags.includes(tag)
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-200'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Components */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Components
                </label>
                <div className="flex flex-wrap gap-2">
                  {components.map((component) => (
                    <button
                      key={component}
                      onClick={() => {
                        setSelectedComponents(prev =>
                          prev.includes(component)
                            ? prev.filter(c => c !== component)
                            : [...prev, component]
                        );
                      }}
                      className={`px-2 py-1 rounded-full text-sm ${
                        selectedComponents.includes(component)
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-200'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {component}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sort Controls */}
      <div className="flex items-center space-x-4">
        <select
          value={sortField}
          onChange={(e) => setSortField(e.target.value as SortField)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="timestamp">Time</option>
          <option value="severity">Severity</option>
          <option value="component">Component</option>
        </select>
        <button
          onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
          className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
        >
          {sortOrder === 'asc' ? '↑' : '↓'}
        </button>
      </div>

      {/* Insights List */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredInsights.map((insight) => (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      insight.type === 'critical'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-200'
                        : insight.type === 'warning'
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-200'
                        : 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-200'
                    }`}>
                      {insight.type}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(insight.timestamp), 'MMM d, yyyy HH:mm:ss')}
                    </span>
                  </div>
                  <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
                    {insight.title}
                  </h3>
                  <p className="mt-1 text-gray-600 dark:text-gray-300">
                    {insight.description}
                  </p>
                  {insight.recommendation && (
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      <strong>Recommendation:</strong> {insight.recommendation}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {insight.component && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700">
                        {insight.component}
                      </span>
                    )}
                    {insight.tags?.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {filteredInsights.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No insights found matching the current filters
          </div>
        )}
      </div>
    </div>
  );
}; 