import React, { useEffect, useState, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiActivity, 
  FiServer, 
  FiClock, 
  FiAlertCircle, 
  FiCheckCircle, 
  FiRefreshCw, 
  FiTrendingUp, 
  FiTrendingDown,
  FiSun,
  FiMoon,
  FiCpu,
  FiDatabase,
  FiAlertTriangle,
  FiSettings,
  FiUsers,
  FiInfo
} from 'react-icons/fi';
import { format, subMinutes, differenceInSeconds } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import SystemInsights from '../components/SystemInsights';
import ServiceMap from '../components/ServiceMap';
import { websocketService } from '../services/websocket';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface SystemMetrics {
  timestamp: number;
  active_sessions: number;
  api_requests_total: number;
  api_errors_total: number;
  cpu_usage?: number;
  memory_usage?: number;
  response_time?: number;
}

interface HealthStatus {
  status: string;
  timestamp: number;
  services: {
    redis: string;
    tracing: string;
  };
}

interface ServiceStatus {
  name: string;
  status: 'up' | 'down';
  lastCheck: number;
}

interface SystemAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  timestamp: number;
}

interface SystemInsight {
  type: 'performance' | 'security' | 'usage';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  recommendation: string;
  timestamp: number;
}

interface ServiceNode {
  id: string;
  name: string;
  type: 'api' | 'database' | 'cache' | 'queue';
  status: 'healthy' | 'degraded' | 'down';
  metrics: {
    latency: number;
    throughput: number;
    errorRate: number;
  };
  connections: string[];
}

type ServiceStatusType = 'up' | 'down';

const getStatusColor = (status: 'healthy' | 'degraded' | 'down' | 'up' | 'warning' | 'error') => {
  switch (status) {
    case 'healthy':
    case 'up':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'degraded':
    case 'warning':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'down':
    case 'error':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
};

const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '6h' | '24h'>('1h');
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [insights, setInsights] = useState<SystemInsight[]>([]);
  const [serviceNodes, setServiceNodes] = useState<ServiceNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<ServiceNode | null>(null);

  // React Query for health check
  const { data: healthData, isLoading: healthLoading } = useQuery<HealthStatus>({
    queryKey: ['health'],
    queryFn: async () => {
      const response = await api.get('/health');
      return response.data;
    },
    refetchInterval: autoRefresh ? 30000 : false,
  });

  // React Query for metrics
  const { data: metricsData, isLoading: metricsLoading } = useQuery<string>({
    queryKey: ['metrics'],
    queryFn: async () => {
      const response = await api.get('/metrics');
      return response.data;
    },
    refetchInterval: autoRefresh ? 30000 : false,
  });

  useEffect(() => {
    // Subscribe to WebSocket events
    const unsubscribeMetrics = websocketService.subscribe<SystemMetrics[]>('metrics', (data: SystemMetrics[]) => {
      setMetrics(data);
    });

    const unsubscribeHealth = websocketService.subscribe<HealthStatus>('health', (data: HealthStatus) => {
      setHealth(data);
    });

    const unsubscribeAlerts = websocketService.subscribe<SystemAlert[]>('alerts', (data: SystemAlert[]) => {
      setAlerts(data);
    });

    const unsubscribeInsights = websocketService.subscribe<SystemInsight>('insights', (data: SystemInsight) => {
      setInsights(prev => [...prev, data].slice(-5)); // Keep last 5 insights
    });

    const unsubscribeServices = websocketService.subscribe<ServiceNode[]>('services', (data: ServiceNode[]) => {
      setServiceNodes(data);
    });

    return () => {
      unsubscribeMetrics();
      unsubscribeHealth();
      unsubscribeAlerts();
      unsubscribeInsights();
      unsubscribeServices();
    };
  }, []);

  // Process metrics data
  useEffect(() => {
    if (metricsData) {
      const lines = metricsData.split('\n');
      const newMetrics: SystemMetrics = {
        timestamp: Date.now(),
        active_sessions: 0,
        api_requests_total: 0,
        api_errors_total: 0,
        cpu_usage: 0,
        memory_usage: 0,
        response_time: 0
      };

      lines.forEach((line: string) => {
        if (line.startsWith('active_sessions')) {
          newMetrics.active_sessions = parseFloat(line.split(' ')[1]);
        } else if (line.startsWith('api_requests_total')) {
          newMetrics.api_requests_total = parseFloat(line.split(' ')[1]);
        } else if (line.startsWith('api_errors_total')) {
          newMetrics.api_errors_total = parseFloat(line.split(' ')[1]);
        } else if (line.startsWith('cpu_usage')) {
          newMetrics.cpu_usage = parseFloat(line.split(' ')[1]);
        } else if (line.startsWith('memory_usage')) {
          newMetrics.memory_usage = parseFloat(line.split(' ')[1]);
        } else if (line.startsWith('response_time')) {
          newMetrics.response_time = parseFloat(line.split(' ')[1]);
        }
      });

      // Check for alerts
      if (newMetrics.cpu_usage && newMetrics.cpu_usage > 80) {
        addAlert('warning', `High CPU usage: ${newMetrics.cpu_usage.toFixed(1)}%`);
      }
      if (newMetrics.memory_usage && newMetrics.memory_usage > 90) {
        addAlert('warning', `High memory usage: ${newMetrics.memory_usage.toFixed(1)}%`);
      }
      if (newMetrics.response_time && newMetrics.response_time > 1000) {
        addAlert('warning', `High response time: ${newMetrics.response_time.toFixed(0)}ms`);
      }

      setMetrics((prev: SystemMetrics[]) => [...prev.slice(-29), newMetrics]);
      setLastRefresh(new Date());
    }
  }, [metricsData]);

  const addAlert = (type: SystemAlert['type'], message: string) => {
    const newAlert: SystemAlert = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: Date.now()
    };
    setAlerts(prev => [newAlert, ...prev].slice(0, 5));
  };

  // Calculate trends
  const calculateTrend = (current: number, previous: number): number => {
    if (!previous) return 0;
    return ((current - previous) / previous) * 100;
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <FiTrendingUp className="w-4 h-4 text-green-500" />;
    if (trend < 0) return <FiTrendingDown className="w-4 h-4 text-red-500" />;
    return null;
  };

  // Chart data with enhanced styling
  const chartData = {
    labels: metrics.map((m: SystemMetrics) => format(new Date(m.timestamp), 'HH:mm:ss')),
    datasets: [
      {
        label: 'Active Sessions',
        data: metrics.map((m: SystemMetrics) => m.active_sessions),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 5
      },
      {
        label: 'API Requests',
        data: metrics.map((m: SystemMetrics) => m.api_requests_total),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 5
      },
      {
        label: 'CPU Usage',
        data: metrics.map((m: SystemMetrics) => m.cpu_usage || 0),
        borderColor: 'rgb(245, 158, 11)',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 5
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'System Metrics'
      },
      tooltip: {
        backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        titleColor: darkMode ? '#f3f4f6' : '#1f2937',
        bodyColor: darkMode ? '#d1d5db' : '#4b5563',
        borderColor: darkMode ? '#374151' : '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('en-US', { 
                style: 'decimal',
                maximumFractionDigits: 2 
              }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          color: darkMode ? '#9ca3af' : '#6b7280'
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: darkMode ? '#9ca3af' : '#6b7280'
        }
      }
    }
  };

  const getTimeRangeData = () => {
    const now = Date.now();
    const ranges = {
      '1h': now - 3600000,
      '6h': now - 21600000,
      '24h': now - 86400000
    };
    return metrics.filter(m => m.timestamp >= ranges[selectedTimeRange]);
  };

  const handleDismissInsight = (id: string) => {
    setInsights(prev => prev.filter(insight => insight.timestamp.toString() !== id));
  };

  const handleNodeClick = (node: ServiceNode) => {
    setSelectedNode(node);
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} p-6 transition-colors duration-200`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">LexCommand Dashboard</h1>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
              Real-time system monitoring and analytics
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Auto-refresh</span>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  autoRefresh ? 'bg-blue-600' : darkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}
                title={`${autoRefresh ? 'Disable' : 'Enable'} auto-refresh`}
                aria-label={`${autoRefresh ? 'Disable' : 'Enable'} auto-refresh`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoRefresh ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'} transition-colors`}
              title={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
              aria-label={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
            >
              {darkMode ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
            </button>
            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Last refresh: {format(lastRefresh, 'HH:mm:ss')}
            </span>
            <button
              onClick={() => window.location.reload()}
              className={`p-2 ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'} transition-colors`}
              title="Refresh data"
              aria-label="Refresh data"
            >
              <FiRefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="flex justify-end mb-6">
          <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 p-1">
            {(['1h', '6h', '24h'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setSelectedTimeRange(range)}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  selectedTimeRange === range
                    ? darkMode
                      ? 'bg-gray-700 text-white'
                      : 'bg-blue-600 text-white'
                    : darkMode
                    ? 'text-gray-400 hover:text-white'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Alerts */}
        <AnimatePresence>
          {alerts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6"
            >
              {alerts.map((alert) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={`mb-2 p-4 rounded-lg ${
                    alert.type === 'error'
                      ? 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500'
                      : alert.type === 'warning'
                      ? 'bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500'
                      : 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500'
                  }`}
                >
                  <div className="flex items-center">
                    {alert.type === 'error' ? (
                      <FiAlertCircle className="w-5 h-5 text-red-500 mr-2" />
                    ) : alert.type === 'warning' ? (
                      <FiAlertTriangle className="w-5 h-5 text-yellow-500 mr-2" />
                    ) : (
                      <FiInfo className="w-5 h-5 text-blue-500 mr-2" />
                    )}
                    <p className={darkMode ? 'text-gray-200' : 'text-gray-700'}>
                      {alert.message}
                      <span className="text-xs ml-2 opacity-75">
                        {format(new Date(alert.timestamp), 'HH:mm:ss')}
                      </span>
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>System Status</p>
                <p className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {health?.status === 'healthy' ? 'Healthy' : 'Unhealthy'}
                </p>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                  Last checked: {health ? format(new Date(health.timestamp), 'HH:mm:ss') : 'N/A'}
                </p>
              </div>
              <div className={`p-3 rounded-full ${
                health?.status === 'healthy' ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'
              }`}>
                {health?.status === 'healthy' ? (
                  <FiCheckCircle className="w-6 h-6 text-green-500" />
                ) : (
                  <FiAlertCircle className="w-6 h-6 text-red-500" />
                )}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Active Sessions</p>
                <div className="flex items-center space-x-2">
                  <p className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {metrics[metrics.length - 1]?.active_sessions || 0}
                  </p>
                  {metrics.length > 1 && (
                    <div className="flex items-center">
                      {getTrendIcon(calculateTrend(
                        metrics[metrics.length - 1]?.active_sessions || 0,
                        metrics[metrics.length - 2]?.active_sessions || 0
                      ))}
                      <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} ml-1`}>
                        {Math.abs(calculateTrend(
                          metrics[metrics.length - 1]?.active_sessions || 0,
                          metrics[metrics.length - 2]?.active_sessions || 0
                        )).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                  Last 30 minutes
                </p>
              </div>
              <div className={`p-3 rounded-full ${darkMode ? 'bg-blue-900/20' : 'bg-blue-100'}`}>
                <FiActivity className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>API Requests</p>
                <div className="flex items-center space-x-2">
                  <p className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {metrics[metrics.length - 1]?.api_requests_total || 0}
                  </p>
                  {metrics.length > 1 && (
                    <div className="flex items-center">
                      {getTrendIcon(calculateTrend(
                        metrics[metrics.length - 1]?.api_requests_total || 0,
                        metrics[metrics.length - 2]?.api_requests_total || 0
                      ))}
                      <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} ml-1`}>
                        {Math.abs(calculateTrend(
                          metrics[metrics.length - 1]?.api_requests_total || 0,
                          metrics[metrics.length - 2]?.api_requests_total || 0
                        )).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                  Total requests
                </p>
              </div>
              <div className={`p-3 rounded-full ${darkMode ? 'bg-purple-900/20' : 'bg-purple-100'}`}>
                <FiServer className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>CPU Usage</h2>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${metrics[metrics.length - 1]?.cpu_usage || 0}%`,
                      backgroundColor: (metrics[metrics.length - 1]?.cpu_usage || 0) > 80 ? '#ef4444' : '#3b82f6'
                    }}
                  />
                </div>
                <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {metrics[metrics.length - 1]?.cpu_usage?.toFixed(1) || 0}%
                </p>
              </div>
              <div className={`p-3 rounded-full ${darkMode ? 'bg-blue-900/20' : 'bg-blue-100'} ml-4`}>
                <FiCpu className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Memory Usage</h2>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${metrics[metrics.length - 1]?.memory_usage || 0}%`,
                      backgroundColor: (metrics[metrics.length - 1]?.memory_usage || 0) > 90 ? '#ef4444' : '#22c55e'
                    }}
                  />
                </div>
                <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {metrics[metrics.length - 1]?.memory_usage?.toFixed(1) || 0}%
                </p>
              </div>
              <div className={`p-3 rounded-full ${darkMode ? 'bg-green-900/20' : 'bg-green-100'} ml-4`}>
                <FiDatabase className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* System Insights */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <SystemInsights insights={insights} onDismiss={handleDismissInsight} />
        </div>

        {/* Service Map */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <ServiceMap nodes={serviceNodes} onNodeClick={handleNodeClick} />
        </div>

        {/* Selected Service Details */}
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {selectedNode.name}
              </h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedNode.status)}`}>
                {selectedNode.status}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Latency</h3>
                <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                  {selectedNode.metrics.latency}ms
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Throughput</h3>
                <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                  {selectedNode.metrics.throughput}/s
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Error Rate</h3>
                <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                  {selectedNode.metrics.errorRate}%
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>System Metrics</h2>
            <div className="h-80">
              <Line data={chartData} options={chartOptions} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Service Status</h2>
            <div className="space-y-4">
              {health?.services && Object.entries(health.services).map(([service, status]) => {
                const serviceStatus = status as ServiceStatusType;
                return (
                  <div
                    key={service}
                    className={`flex items-center justify-between p-4 rounded-lg hover:bg-opacity-50 transition-colors ${
                      darkMode
                        ? 'bg-gray-700 hover:bg-gray-600'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${
                        serviceStatus === 'up' ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <span className={`font-medium capitalize ${
                        darkMode ? 'text-gray-200' : 'text-gray-700'
                      }`}>{service}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm ${
                        serviceStatus === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {serviceStatus.toUpperCase()}
                      </span>
                      <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {format(new Date(health.timestamp), 'HH:mm:ss')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Error Rate Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-lg shadow-sm p-6 mb-8 hover:shadow-md transition-shadow ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}
        >
          <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Error Rate</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {metrics[metrics.length - 1]?.api_errors_total || 0}
              </p>
              <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Total errors in the last 30 minutes
              </p>
            </div>
            <div className={`p-3 rounded-full ${darkMode ? 'bg-red-900/20' : 'bg-red-100'}`}>
              <FiAlertCircle className="w-6 h-6 text-red-500" />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
