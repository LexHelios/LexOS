import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiInfo, FiMaximize2, FiMinimize2, FiFilter } from 'react-icons/fi';

interface Metric {
  name: string;
  unit: string;
  min: number;
  max: number;
  warning: number;
  critical: number;
}

interface ServiceMetric {
  serviceId: string;
  serviceName: string;
  metrics: Record<string, number>;
}

interface HeatmapGridProps {
  services: ServiceMetric[];
  metricDefinitions: Metric[];
  onCellClick?: (serviceId: string, metricName: string, value: number) => void;
  className?: string;
}

const getColorForValue = (value: number, metric: Metric) => {
  const { min, max, warning, critical } = metric;
  const normalizedValue = (value - min) / (max - min);

  if (value >= critical) {
    return 'bg-red-500';
  } else if (value >= warning) {
    return 'bg-yellow-500';
  } else if (value <= min) {
    return 'bg-blue-500';
  } else {
    // Interpolate between blue (min) and green (warning)
    const hue = 120 + (normalizedValue * 60); // 120 (green) to 180 (blue)
    return `hsl(${hue}, 70%, 50%)`;
  }
};

export const HeatmapGrid: React.FC<HeatmapGridProps> = ({
  services,
  metricDefinitions,
  onCellClick,
  className = '',
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<{
    serviceId: string;
    metricName: string;
    value: number;
  } | null>(null);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(
    metricDefinitions.map(m => m.name)
  );

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const toggleMetric = (metricName: string) => {
    setSelectedMetrics(prev =>
      prev.includes(metricName)
        ? prev.filter(m => m !== metricName)
        : [...prev, metricName]
    );
  };

  const filteredMetrics = useMemo(() =>
    metricDefinitions.filter(m => selectedMetrics.includes(m.name)),
    [metricDefinitions, selectedMetrics]
  );

  const getMetricValue = (service: ServiceMetric, metricName: string) => {
    return service.metrics[metricName] ?? 0;
  };

  const formatValue = (value: number, metric: Metric) => {
    return `${value.toLocaleString()} ${metric.unit}`;
  };

  return (
    <div
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Service Metrics Heatmap
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSelectedMetrics(metricDefinitions.map(m => m.name))}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-200 rounded hover:bg-blue-200 dark:hover:bg-blue-900/40"
            >
              Show All
            </button>
            <button
              onClick={() => setSelectedMetrics([])}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Metric Filter */}
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <FiFilter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Metrics
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {metricDefinitions.map((metric) => (
              <button
                key={metric.name}
                onClick={() => toggleMetric(metric.name)}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  selectedMetrics.includes(metric.name)
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-200'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                {metric.name}
              </button>
            ))}
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="sticky left-0 z-20 bg-white dark:bg-gray-800 p-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                  Service
                </th>
                {filteredMetrics.map((metric) => (
                  <th
                    key={metric.name}
                    className="p-2 text-center text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex flex-col items-center">
                      <span>{metric.name}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {metric.unit}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {services.map((service) => (
                <tr key={service.serviceId}>
                  <td className="sticky left-0 z-10 bg-white dark:bg-gray-800 p-2 text-sm font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700">
                    {service.serviceName}
                  </td>
                  {filteredMetrics.map((metric) => {
                    const value = getMetricValue(service, metric.name);
                    const color = getColorForValue(value, metric);
                    const isHovered =
                      hoveredCell?.serviceId === service.serviceId &&
                      hoveredCell?.metricName === metric.name;

                    return (
                      <td
                        key={`${service.serviceId}-${metric.name}`}
                        className={`p-2 text-center text-sm border-b border-gray-200 dark:border-gray-700 transition-colors ${
                          isHovered ? 'ring-2 ring-blue-500' : ''
                        }`}
                        style={{ backgroundColor: color }}
                        onMouseEnter={() =>
                          setHoveredCell({
                            serviceId: service.serviceId,
                            metricName: metric.name,
                            value,
                          })
                        }
                        onMouseLeave={() => setHoveredCell(null)}
                        onClick={() => onCellClick?.(service.serviceId, metric.name, value)}
                      >
                        <span className="text-white font-medium">
                          {formatValue(value, metric)}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tooltip */}
        <AnimatePresence>
          {hoveredCell && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-4 left-4 right-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start space-x-3">
                <FiInfo className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {services.find(s => s.serviceId === hoveredCell.serviceId)?.serviceName}
                  </h3>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Metric: {hoveredCell.metricName}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Value: {formatValue(
                        hoveredCell.value,
                        metricDefinitions.find(m => m.name === hoveredCell.metricName)!
                      )}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Status:{' '}
                      {hoveredCell.value >=
                      metricDefinitions.find(m => m.name === hoveredCell.metricName)!.critical
                        ? 'Critical'
                        : hoveredCell.value >=
                          metricDefinitions.find(m => m.name === hoveredCell.metricName)!.warning
                        ? 'Warning'
                        : 'Normal'}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}; 