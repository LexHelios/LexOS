import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Line, Area } from 'react-chartjs-2';
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
  FiBrain,
  FiSettings,
  FiList,
  FiKey,
  FiPower,
  FiShield,
  FiUser,
  FiInfo,
  FiSearch,
  FiFilter,
  FiX,
  FiDownload,
  FiTrash2,
  FiKeyboard,
  FiUsers,
  FiMapPin,
  FiMonitor,
  FiGlobe,
  FiBell
} from 'react-icons/fi';
import { format, subMinutes, differenceInSeconds, subHours, subDays } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { websocketService } from '../services/websocket';

interface LLMTrace {
  id: string;
  timestamp: number;
  prompt: string;
  plan: string;
  output: string;
  model: string;
  duration: number;
}

interface SystemControl {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'maintenance';
  lastAction?: string;
  lastActionTime?: number;
}

interface AuditLog {
  id: string;
  timestamp: number;
  user: string;
  action: string;
  details: string;
  ip: string;
  status: 'success' | 'failure';
}

interface TokenInfo {
  id: string;
  jti: string;
  user: string;
  issuedAt: number;
  expiresAt: number;
  lastUsed?: number;
  status: 'active' | 'revoked' | 'expired';
}

interface FilterState {
  llmTraces: {
    model?: string;
    timeRange?: '1h' | '24h' | '7d';
  };
  auditLogs: {
    user?: string;
    status?: 'success' | 'failure';
    timeRange?: '1h' | '24h' | '7d';
  };
  tokens: {
    status?: 'active' | 'revoked' | 'expired';
    timeRange?: '1h' | '24h' | '7d';
  };
}

interface BulkAction {
  type: 'revoke' | 'delete' | 'export';
  items: string[];
}

interface KeyboardShortcut {
  key: string;
  description: string;
  action: () => void;
}

interface AnalyticsData {
  timestamp: number;
  requests: number;
  errors: number;
  latency: number;
  tokens: number;
}

interface AIInsight {
  id: string;
  type: 'anomaly' | 'trend' | 'recommendation';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  timestamp: number;
  metrics: {
    value: number;
    change: number;
    threshold: number;
  };
}

interface SystemHealth {
  cpu: {
    usage: number;
    cores: number;
    temperature: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    connections: number;
  };
  services: {
    name: string;
    status: 'healthy' | 'degraded' | 'down';
    uptime: number;
    lastError?: string;
  }[];
}

interface UserActivity {
  id: string;
  user: string;
  action: string;
  details: string;
  timestamp: number;
  ip: string;
  location?: {
    country: string;
    city: string;
  };
  device?: {
    type: string;
    browser: string;
    os: string;
  };
}

interface SystemUpdate {
  id: string;
  version: string;
  type: 'security' | 'feature' | 'bugfix';
  title: string;
  description: string;
  releaseDate: number;
  status: 'available' | 'downloading' | 'installing' | 'completed' | 'failed';
  size: number;
  changelog: string[];
  requiresRestart: boolean;
}

interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  targetUsers: string[];
  startDate: number;
  endDate?: number;
  metrics: {
    usage: number;
    success: number;
    errors: number;
  };
}

const Dashboard: React.FC = () => {
  const [llmTraces, setLlmTraces] = useState<LLMTrace[]>([]);
  const [systemControls, setSystemControls] = useState<SystemControl[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [selectedTab, setSelectedTab] = useState<'metrics' | 'admin'>('metrics');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    llmTraces: {},
    auditLogs: {},
    tokens: {}
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTokens, setSelectedTokens] = useState<string[]>([]);
  const [selectedLogs, setSelectedLogs] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<BulkAction | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const shortcutsRef = useRef<HTMLDivElement>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '24h' | '7d'>('24h');
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [updates, setUpdates] = useState<SystemUpdate[]>([]);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedUpdate, setSelectedUpdate] = useState<SystemUpdate | null>(null);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [tokenSearchQuery, setTokenSearchQuery] = useState('');
  const [traceSearchQuery, setTraceSearchQuery] = useState('');
  const [activitySearchQuery, setActivitySearchQuery] = useState('');

  const { data: llmTracesData } = useQuery<LLMTrace[]>({
    queryKey: ['llmTraces'],
    queryFn: async () => {
      const response = await api.get('/admin/llm-traces');
      return response.data;
    },
    refetchInterval: autoRefresh ? 30000 : false,
  });

  const { data: systemControlsData } = useQuery<SystemControl[]>({
    queryKey: ['systemControls'],
    queryFn: async () => {
      const response = await api.get('/admin/system-controls');
      return response.data;
    },
    refetchInterval: autoRefresh ? 30000 : false,
  });

  const { data: auditLogsData } = useQuery<AuditLog[]>({
    queryKey: ['auditLogs'],
    queryFn: async () => {
      const response = await api.get('/admin/audit-logs');
      return response.data;
    },
    refetchInterval: autoRefresh ? 30000 : false,
  });

  const { data: tokensData } = useQuery<TokenInfo[]>({
    queryKey: ['tokens'],
    queryFn: async () => {
      const response = await api.get('/admin/tokens');
      return response.data;
    },
    refetchInterval: autoRefresh ? 30000 : false,
  });

  const { data: updatesData } = useQuery<SystemUpdate[]>({
    queryKey: ['systemUpdates'],
    queryFn: async () => {
      const response = await api.get('/admin/updates');
      return response.data;
    },
    refetchInterval: 300000, // Check every 5 minutes
  });

  const { data: flagsData } = useQuery<FeatureFlag[]>({
    queryKey: ['featureFlags'],
    queryFn: async () => {
      const response = await api.get('/admin/feature-flags');
      return response.data;
    },
    refetchInterval: 60000, // Check every minute
  });

  const shortcuts: KeyboardShortcut[] = [
    {
      key: '⌘/Ctrl + F',
      description: 'Focus search',
      action: () => {
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }
    },
    {
      key: '⌘/Ctrl + K',
      description: 'Toggle filters',
      action: () => setShowFilters(!showFilters)
    },
    {
      key: '⌘/Ctrl + E',
      description: 'Export selected',
      action: () => {
        if (selectedTokens.length > 0) {
          handleBulkAction({ type: 'export', items: selectedTokens });
        } else if (selectedLogs.length > 0) {
          handleBulkAction({ type: 'export', items: selectedLogs });
        }
      }
    },
    {
      key: '⌘/Ctrl + D',
      description: 'Clear selections',
      action: () => {
        setSelectedTokens([]);
        setSelectedLogs([]);
      }
    },
    {
      key: '⌘/Ctrl + ?',
      description: 'Show shortcuts',
      action: () => setShowShortcuts(!showShortcuts)
    }
  ];

  useEffect(() => {
    if (llmTracesData) setLlmTraces(llmTracesData);
    if (systemControlsData) setSystemControls(systemControlsData);
    if (auditLogsData) setAuditLogs(auditLogsData);
    if (tokensData) setTokens(tokensData);
    if (updatesData) setUpdates(updatesData);
    if (flagsData) setFeatureFlags(flagsData);
  }, [llmTracesData, systemControlsData, auditLogsData, tokensData, updatesData, flagsData]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if we're in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Check for modifier keys
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifierKey = isMac ? e.metaKey : e.ctrlKey;

      if (modifierKey) {
        switch (e.key.toLowerCase()) {
          case 'f':
            e.preventDefault();
            shortcuts[0].action();
            break;
          case 'k':
            e.preventDefault();
            shortcuts[1].action();
            break;
          case 'e':
            e.preventDefault();
            shortcuts[2].action();
            break;
          case 'd':
            e.preventDefault();
            shortcuts[3].action();
            break;
          case '?':
            e.preventDefault();
            shortcuts[4].action();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showFilters, selectedTokens, selectedLogs]);

  // Close shortcuts panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shortcutsRef.current && !shortcutsRef.current.contains(event.target as Node)) {
        setShowShortcuts(false);
      }
    };

    if (showShortcuts) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showShortcuts]);

  // Filter functions
  const filterLLMTraces = (traces: LLMTrace[]) => {
    return traces.filter(trace => {
      if (filters.llmTraces.model && trace.model !== filters.llmTraces.model) return false;
      if (filters.llmTraces.timeRange) {
        const timeRange = filters.llmTraces.timeRange;
        const now = Date.now();
        const ranges = {
          '1h': now - 3600000,
          '24h': now - 86400000,
          '7d': now - 604800000
        };
        if (trace.timestamp < ranges[timeRange]) return false;
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          trace.prompt.toLowerCase().includes(query) ||
          trace.plan.toLowerCase().includes(query) ||
          trace.output.toLowerCase().includes(query)
        );
      }
      return true;
    });
  };

  const filterAuditLogs = (logs: AuditLog[]) => {
    return logs.filter(log => {
      if (filters.auditLogs.user && log.user !== filters.auditLogs.user) return false;
      if (filters.auditLogs.status && log.status !== filters.auditLogs.status) return false;
      if (filters.auditLogs.timeRange) {
        const timeRange = filters.auditLogs.timeRange;
        const now = Date.now();
        const ranges = {
          '1h': now - 3600000,
          '24h': now - 86400000,
          '7d': now - 604800000
        };
        if (log.timestamp < ranges[timeRange]) return false;
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          log.user.toLowerCase().includes(query) ||
          log.action.toLowerCase().includes(query) ||
          log.details.toLowerCase().includes(query)
        );
      }
      return true;
    });
  };

  const filterTokens = (tokens: TokenInfo[]) => {
    return tokens.filter(token => {
      if (filters.tokens.status && token.status !== filters.tokens.status) return false;
      if (filters.tokens.timeRange) {
        const timeRange = filters.tokens.timeRange;
        const now = Date.now();
        const ranges = {
          '1h': now - 3600000,
          '24h': now - 86400000,
          '7d': now - 604800000
        };
        if (token.issuedAt < ranges[timeRange]) return false;
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          token.user.toLowerCase().includes(query) ||
          token.jti.toLowerCase().includes(query)
        );
      }
      return true;
    });
  };

  const exportData = (type: 'llmTraces' | 'auditLogs' | 'tokens') => {
    let data: any[] = [];
    let filename = '';

    switch (type) {
      case 'llmTraces':
        data = filterLLMTraces(llmTraces);
        filename = 'llm-traces';
        break;
      case 'auditLogs':
        data = filterAuditLogs(auditLogs);
        filename = 'audit-logs';
        break;
      case 'tokens':
        data = filterTokens(tokens);
        filename = 'tokens';
        break;
    }

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleBulkAction = async (action: BulkAction) => {
    try {
      switch (action.type) {
        case 'revoke':
          await api.post('/admin/tokens/revoke-bulk', { tokenIds: action.items });
          break;
        case 'delete':
          await api.post('/admin/audit-logs/delete-bulk', { logIds: action.items });
          break;
        case 'export':
          const data = action.items.map(id => {
            if (action.items.includes(id)) {
              return tokens.find(t => t.id === id) || auditLogs.find(l => l.id === id);
            }
            return null;
          }).filter(Boolean);
          
          const jsonString = JSON.stringify(data, null, 2);
          const blob = new Blob([jsonString], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `bulk-export-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.json`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          break;
      }
      
      // Clear selections after action
      setSelectedTokens([]);
      setSelectedLogs([]);
      setBulkAction(null);
    } catch (error) {
      console.error('Bulk action failed:', error);
      // Handle error (show notification, etc.)
    }
  };

  // Analytics chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: selectedTimeRange === '1h' ? 'minute' : 'hour',
        },
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
  };

  // Fetch analytics data
  const { data: analyticsDataResponse } = useQuery<AnalyticsData[]>({
    queryKey: ['analytics', selectedTimeRange],
    queryFn: async () => {
      const response = await api.get(`/admin/analytics?timeRange=${selectedTimeRange}`);
      return response.data;
    },
    refetchInterval: 30000,
  });

  // Fetch AI insights
  const { data: insightsData } = useQuery<AIInsight[]>({
    queryKey: ['insights'],
    queryFn: async () => {
      const response = await api.get('/admin/insights');
      return response.data;
    },
    refetchInterval: 60000,
  });

  useEffect(() => {
    if (analyticsDataResponse) setAnalyticsData(analyticsDataResponse);
    if (insightsData) setInsights(insightsData);
  }, [analyticsDataResponse, insightsData]);

  // Calculate metrics
  const calculateMetrics = () => {
    if (!analyticsData.length) return null;

    const latest = analyticsData[analyticsData.length - 1];
    const previous = analyticsData[0];

    return {
      requests: {
        value: latest.requests,
        change: ((latest.requests - previous.requests) / previous.requests) * 100,
      },
      errors: {
        value: latest.errors,
        change: ((latest.errors - previous.errors) / previous.errors) * 100,
      },
      latency: {
        value: latest.latency,
        change: ((latest.latency - previous.latency) / previous.latency) * 100,
      },
      tokens: {
        value: latest.tokens,
        change: ((latest.tokens - previous.tokens) / previous.tokens) * 100,
      },
    };
  };

  const metrics = calculateMetrics();

  // Fetch system health
  const { data: healthData } = useQuery<SystemHealth>({
    queryKey: ['systemHealth'],
    queryFn: async () => {
      const response = await api.get('/admin/system-health');
      return response.data;
    },
    refetchInterval: 10000,
  });

  // Fetch user activities
  const { data: activitiesData } = useQuery<UserActivity[]>({
    queryKey: ['userActivities'],
    queryFn: async () => {
      const response = await api.get('/admin/user-activities');
      return response.data;
    },
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (healthData) setSystemHealth(healthData);
    if (activitiesData) setUserActivities(activitiesData);
  }, [healthData, activitiesData]);

  // Calculate health status
  const getHealthStatus = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return 'critical';
    if (value >= thresholds.warning) return 'warning';
    return 'healthy';
  };

  const handleUpdate = async (update: SystemUpdate) => {
    setSelectedUpdate(update);
    setShowUpdateModal(true);
    setUpdateProgress(0);

    try {
      // Simulate update progress
      const interval = setInterval(() => {
        setUpdateProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 1000);

      await api.post(`/admin/updates/${update.id}/install`);
      
      // Update local state
      setUpdates(prev => prev.map(u => 
        u.id === update.id ? { ...u, status: 'completed' } : u
      ));

      if (update.requiresRestart) {
        // Show restart notification
      }
    } catch (error) {
      console.error('Update failed:', error);
      setUpdates(prev => prev.map(u => 
        u.id === update.id ? { ...u, status: 'failed' } : u
      ));
    }
  };

  const toggleFeatureFlag = async (flag: FeatureFlag) => {
    try {
      await api.post(`/admin/feature-flags/${flag.id}/toggle`);
      setFeatureFlags(prev => prev.map(f => 
        f.id === flag.id ? { ...f, enabled: !f.enabled } : f
      ));
    } catch (error) {
      console.error('Failed to toggle feature flag:', error);
    }
  };

  // WebSocket subscriptions
  useEffect(() => {
    const handleMetricsUpdate = (data: any) => {
      setAnalyticsData(prev => [...prev.slice(-29), data]);
      setLastRefresh(new Date());
    };

    const handleHealthUpdate = (data: any) => {
      setSystemHealth(data);
    };

    const handleAlertUpdate = (data: any) => {
      addAlert(data.type, data.message);
    };

    const handleUserActivityUpdate = (data: any) => {
      setUserActivities(prev => [data, ...prev].slice(0, 50));
    };

    // Subscribe to WebSocket events
    websocketService.subscribe('metrics', handleMetricsUpdate);
    websocketService.subscribe('health', handleHealthUpdate);
    websocketService.subscribe('alerts', handleAlertUpdate);
    websocketService.subscribe('user_activity', handleUserActivityUpdate);

    // Cleanup subscriptions
    return () => {
      websocketService.unsubscribe('metrics', handleMetricsUpdate);
      websocketService.unsubscribe('health', handleHealthUpdate);
      websocketService.unsubscribe('alerts', handleAlertUpdate);
      websocketService.unsubscribe('user_activity', handleUserActivityUpdate);
    };
  }, []);

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} p-6 transition-colors duration-200`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">LexCommand Dashboard</h1>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
              Real-time system monitoring and analytics
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowShortcuts(!showShortcuts)}
              className={`p-2 rounded-lg ${
                darkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
              title="Keyboard Shortcuts (⌘/Ctrl + ?)"
            >
              <FiKeyboard className="w-5 h-5" />
            </button>
            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedTab('metrics')}
                className={`px-4 py-2 rounded-lg ${
                  selectedTab === 'metrics'
                    ? darkMode
                      ? 'bg-gray-700 text-white'
                      : 'bg-blue-600 text-white'
                    : darkMode
                    ? 'text-gray-400 hover:text-white'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Metrics
              </button>
              <button
                onClick={() => setSelectedTab('admin')}
                className={`px-4 py-2 rounded-lg ${
                  selectedTab === 'admin'
                    ? darkMode
                      ? 'bg-gray-700 text-white'
                      : 'bg-blue-600 text-white'
                    : darkMode
                    ? 'text-gray-400 hover:text-white'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Admin
              </button>
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts Panel */}
        <AnimatePresence>
          {showShortcuts && (
            <motion.div
              ref={shortcutsRef}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 ${
                darkMode ? 'bg-gray-800' : 'bg-white'
              } rounded-lg shadow-xl p-6 w-96`}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Keyboard Shortcuts
                </h2>
                <button
                  onClick={() => setShowShortcuts(false)}
                  className={`p-2 rounded-lg ${
                    darkMode
                      ? 'text-gray-400 hover:text-white'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  title="Close shortcuts panel"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3">
                {shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className={`flex justify-between items-center p-2 rounded-lg ${
                      darkMode ? 'bg-gray-700' : 'bg-gray-50'
                    }`}
                  >
                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {shortcut.description}
                    </span>
                    <kbd className={`px-2 py-1 rounded ${
                      darkMode
                        ? 'bg-gray-600 text-gray-300'
                        : 'bg-gray-200 text-gray-700'
                    } text-xs font-mono`}>
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {selectedTab === 'metrics' ? (
          <div className="space-y-6">
            {/* Time Range Selector */}
            <div className="flex justify-end space-x-2">
              {(['1h', '24h', '7d'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setSelectedTimeRange(range)}
                  className={`px-4 py-2 rounded-lg ${
                    selectedTimeRange === range
                      ? darkMode
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-500 text-white'
                      : darkMode
                      ? 'bg-gray-700 text-gray-300'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>

            {/* Metrics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {metrics && (
                <>
                  <div className={`p-6 rounded-lg shadow-sm ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Requests
                      </h3>
                      <FiActivity className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    </div>
                    <div className="flex items-baseline">
                      <p className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {metrics.requests.value.toLocaleString()}
                      </p>
                      <span className={`ml-2 text-sm ${
                        metrics.requests.change >= 0
                          ? 'text-green-500'
                          : 'text-red-500'
                      }`}>
                        {metrics.requests.change >= 0 ? '+' : ''}
                        {metrics.requests.change.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className={`p-6 rounded-lg shadow-sm ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Error Rate
                      </h3>
                      <FiAlertTriangle className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    </div>
                    <div className="flex items-baseline">
                      <p className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {metrics.errors.value.toLocaleString()}
                      </p>
                      <span className={`ml-2 text-sm ${
                        metrics.errors.change <= 0
                          ? 'text-green-500'
                          : 'text-red-500'
                      }`}>
                        {metrics.errors.change >= 0 ? '+' : ''}
                        {metrics.errors.change.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className={`p-6 rounded-lg shadow-sm ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Avg. Latency
                      </h3>
                      <FiClock className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    </div>
                    <div className="flex items-baseline">
                      <p className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {metrics.latency.toFixed(2)}ms
                      </p>
                      <span className={`ml-2 text-sm ${
                        metrics.latency.change <= 0
                          ? 'text-green-500'
                          : 'text-red-500'
                      }`}>
                        {metrics.latency.change >= 0 ? '+' : ''}
                        {metrics.latency.change.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className={`p-6 rounded-lg shadow-sm ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Tokens Used
                      </h3>
                      <FiBrain className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    </div>
                    <div className="flex items-baseline">
                      <p className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {metrics.tokens.value.toLocaleString()}
                      </p>
                      <span className={`ml-2 text-sm ${
                        metrics.tokens.change >= 0
                          ? 'text-green-500'
                          : 'text-red-500'
                      }`}>
                        {metrics.tokens.change >= 0 ? '+' : ''}
                        {metrics.tokens.change.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Analytics Chart */}
            <div className={`p-6 rounded-lg shadow-sm ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                System Performance
              </h3>
              <div className="h-80">
                <Area
                  data={{
                    labels: analyticsData.map(d => new Date(d.timestamp)),
                    datasets: [
                      {
                        label: 'Requests',
                        data: analyticsData.map(d => d.requests),
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        fill: true,
                      },
                      {
                        label: 'Errors',
                        data: analyticsData.map(d => d.errors),
                        borderColor: 'rgb(239, 68, 68)',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        fill: true,
                      },
                      {
                        label: 'Latency (ms)',
                        data: analyticsData.map(d => d.latency),
                        borderColor: 'rgb(16, 185, 129)',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        fill: true,
                      },
                    ],
                  }}
                  options={chartOptions}
                />
              </div>
            </div>

            {/* AI Insights */}
            <div className={`p-6 rounded-lg shadow-sm ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  AI Insights
                </h3>
                <button
                  onClick={() => {/* Refresh insights */}}
                  className={`p-2 ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'} transition-colors`}
                  title="Refresh insights"
                >
                  <FiRefreshCw className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                {insights.map((insight) => (
                  <div
                    key={insight.id}
                    className={`p-4 rounded-lg ${
                      darkMode ? 'bg-gray-700' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          insight.severity === 'high'
                            ? 'bg-red-100 text-red-800'
                            : insight.severity === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {insight.severity}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          insight.type === 'anomaly'
                            ? 'bg-purple-100 text-purple-800'
                            : insight.type === 'trend'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {insight.type}
                        </span>
                      </div>
                      <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {format(new Date(insight.timestamp), 'HH:mm:ss')}
                      </span>
                    </div>
                    <h4 className={`font-medium mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {insight.title}
                    </h4>
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {insight.description}
                    </p>
                    <div className="mt-2 flex items-center space-x-4">
                      <div>
                        <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Current Value:
                        </span>
                        <span className={`ml-1 font-medium ${
                          insight.metrics.value > insight.metrics.threshold
                            ? 'text-red-500'
                            : 'text-green-500'
                        }`}>
                          {insight.metrics.value.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Change:
                        </span>
                        <span className={`ml-1 font-medium ${
                          insight.metrics.change >= 0
                            ? 'text-green-500'
                            : 'text-red-500'
                        }`}>
                          {insight.metrics.change >= 0 ? '+' : ''}
                          {insight.metrics.change.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* System Health */}
            <div className={`p-6 rounded-lg shadow-sm ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  <FiServer className="inline-block mr-2" />
                  System Health
                </h3>
                <button
                  onClick={() => {/* Refresh health data */}}
                  className={`p-2 ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'} transition-colors`}
                  title="Refresh system health data"
                >
                  <FiRefreshCw className="w-5 h-5" />
                </button>
              </div>

              {systemHealth && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* CPU Usage */}
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        CPU Usage
                      </h4>
                      <FiCpu className={`w-5 h-5 ${
                        getHealthStatus(systemHealth.cpu.usage, { warning: 70, critical: 90 }) === 'critical'
                          ? 'text-red-500'
                          : getHealthStatus(systemHealth.cpu.usage, { warning: 70, critical: 90 }) === 'warning'
                          ? 'text-yellow-500'
                          : 'text-green-500'
                      }`} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Usage
                        </span>
                        <span className={`font-medium ${
                          getHealthStatus(systemHealth.cpu.usage, { warning: 70, critical: 90 }) === 'critical'
                            ? 'text-red-500'
                            : getHealthStatus(systemHealth.cpu.usage, { warning: 70, critical: 90 }) === 'warning'
                            ? 'text-yellow-500'
                            : 'text-green-500'
                        }`}>
                          {systemHealth.cpu.usage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Temperature
                        </span>
                        <span className={`font-medium ${
                          getHealthStatus(systemHealth.cpu.temperature, { warning: 70, critical: 85 }) === 'critical'
                            ? 'text-red-500'
                            : getHealthStatus(systemHealth.cpu.temperature, { warning: 70, critical: 85 }) === 'warning'
                            ? 'text-yellow-500'
                            : 'text-green-500'
                        }`}>
                          {systemHealth.cpu.temperature}°C
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Memory Usage */}
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Memory Usage
                      </h4>
                      <FiDatabase className={`w-5 h-5 ${
                        getHealthStatus((systemHealth.memory.used / systemHealth.memory.total) * 100, { warning: 80, critical: 90 }) === 'critical'
                          ? 'text-red-500'
                          : getHealthStatus((systemHealth.memory.used / systemHealth.memory.total) * 100, { warning: 80, critical: 90 }) === 'warning'
                          ? 'text-yellow-500'
                          : 'text-green-500'
                      }`} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Used
                        </span>
                        <span className="font-medium">
                          {(systemHealth.memory.used / 1024 / 1024 / 1024).toFixed(1)} GB
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Free
                        </span>
                        <span className="font-medium">
                          {(systemHealth.memory.free / 1024 / 1024 / 1024).toFixed(1)} GB
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Disk Usage */}
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Disk Usage
                      </h4>
                      <FiDatabase className={`w-5 h-5 ${
                        getHealthStatus((systemHealth.disk.used / systemHealth.disk.total) * 100, { warning: 80, critical: 90 }) === 'critical'
                          ? 'text-red-500'
                          : getHealthStatus((systemHealth.disk.used / systemHealth.disk.total) * 100, { warning: 80, critical: 90 }) === 'warning'
                          ? 'text-yellow-500'
                          : 'text-green-500'
                      }`} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Used
                        </span>
                        <span className="font-medium">
                          {(systemHealth.disk.used / 1024 / 1024 / 1024).toFixed(1)} GB
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Free
                        </span>
                        <span className="font-medium">
                          {(systemHealth.disk.free / 1024 / 1024 / 1024).toFixed(1)} GB
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Network Stats */}
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Network
                      </h4>
                      <FiActivity className={`w-5 h-5 ${
                        getHealthStatus(systemHealth.network.connections, { warning: 1000, critical: 2000 }) === 'critical'
                          ? 'text-red-500'
                          : getHealthStatus(systemHealth.network.connections, { warning: 1000, critical: 2000 }) === 'warning'
                          ? 'text-yellow-500'
                          : 'text-green-500'
                      }`} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Connections
                        </span>
                        <span className="font-medium">
                          {systemHealth.network.connections.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Traffic
                        </span>
                        <span className="font-medium">
                          {(systemHealth.network.bytesIn / 1024 / 1024).toFixed(1)} MB/s
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Service Status */}
              {systemHealth && (
                <div className="mt-6">
                  <h4 className={`text-sm font-medium mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Service Status
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {systemHealth.services.map((service) => (
                      <div
                        key={service.name}
                        className={`p-4 rounded-lg ${
                          darkMode ? 'bg-gray-700' : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h5 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {service.name}
                          </h5>
                          <span className={`px-2 py-1 rounded text-xs ${
                            service.status === 'healthy'
                              ? 'bg-green-100 text-green-800'
                              : service.status === 'degraded'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {service.status}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              Uptime
                            </span>
                            <span className="font-medium">
                              {Math.floor(service.uptime / 3600)}h {Math.floor((service.uptime % 3600) / 60)}m
                            </span>
                          </div>
                          {service.lastError && (
                            <div className="mt-2">
                              <span className={`text-sm ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                                Last Error: {service.lastError}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User Activity Timeline */}
            <div className={`p-6 rounded-lg shadow-sm ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  <FiUsers className="inline-block mr-2" />
                  User Activity Timeline
                </h3>
                <button
                  onClick={() => {/* Refresh activities */}}
                  className={`p-2 ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'} transition-colors`}
                  title="Refresh user activities"
                >
                  <FiRefreshCw className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {userActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className={`p-4 rounded-lg ${
                      darkMode ? 'bg-gray-700' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {activity.user}
                        </h4>
                        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {activity.action}
                        </p>
                      </div>
                      <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {format(new Date(activity.timestamp), 'HH:mm:ss')}
                      </span>
                    </div>
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {activity.details}
                    </p>
                    <div className="mt-2 flex items-center space-x-4">
                      {activity.location && (
                        <div className="flex items-center space-x-1">
                          <FiMapPin className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                          <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {activity.location.city}, {activity.location.country}
                          </span>
                        </div>
                      )}
                      {activity.device && (
                        <div className="flex items-center space-x-1">
                          <FiMonitor className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                          <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {activity.device.browser} on {activity.device.os}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <FiGlobe className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                        <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {activity.ip}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Search and Filter Bar */}
            <div className={`rounded-lg shadow-sm p-4 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <FiSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <input
                    type="text"
                    placeholder="Search logs..."
                    className={`w-full px-4 py-2 rounded-lg ${
                      darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'
                    }`}
                    title="Search logs"
                    aria-label="Search logs"
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-2 rounded-lg ${
                    darkMode
                      ? 'bg-gray-700 hover:bg-gray-600'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                  title="Toggle filters"
                >
                  <FiFilter className="w-5 h-5" />
                </button>
              </div>

              {/* Filter Panel */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* LLM Traces Filters */}
                      <div className="space-y-2">
                        <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          LLM Traces
                        </h3>
                        <select
                          value={filters.llmTraces.model || ''}
                          onChange={(e) => setFilters(prev => ({
                            ...prev,
                            llmTraces: { ...prev.llmTraces, model: e.target.value || undefined }
                          }))}
                          className={`w-full px-4 py-2 rounded-lg ${
                            darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'
                          }`}
                          title="Filter by model"
                          aria-label="Filter by model"
                        >
                          <option value="">All Models</option>
                          <option value="gpt-4">GPT-4</option>
                          <option value="gpt-3.5">GPT-3.5</option>
                        </select>
                        <select
                          value={filters.llmTraces.timeRange || ''}
                          onChange={(e) => setFilters(prev => ({
                            ...prev,
                            llmTraces: { ...prev.llmTraces, timeRange: e.target.value as any || undefined }
                          }))}
                          className={`w-full px-4 py-2 rounded-lg ${
                            darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'
                          }`}
                          title="Filter by duration"
                          aria-label="Filter by duration"
                        >
                          <option value="">All Durations</option>
                          <option value="short">Short</option>
                          <option value="medium">Medium</option>
                          <option value="long">Long</option>
                        </select>
                      </div>

                      {/* Audit Logs Filters */}
                      <div className="space-y-2">
                        <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Audit Logs
                        </h3>
                        <select
                          value={filters.auditLogs.status || ''}
                          onChange={(e) => setFilters(prev => ({
                            ...prev,
                            auditLogs: { ...prev.auditLogs, status: e.target.value as any || undefined }
                          }))}
                          className={`w-full px-4 py-2 rounded-lg ${
                            darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'
                          }`}
                          title="Filter by status"
                          aria-label="Filter by status"
                        >
                          <option value="">All Statuses</option>
                          <option value="success">Success</option>
                          <option value="failure">Failure</option>
                        </select>
                        <select
                          value={filters.auditLogs.timeRange || ''}
                          onChange={(e) => setFilters(prev => ({
                            ...prev,
                            auditLogs: { ...prev.auditLogs, timeRange: e.target.value as any || undefined }
                          }))}
                          className={`w-full px-4 py-2 rounded-lg ${
                            darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'
                          }`}
                          title="Filter by duration"
                          aria-label="Filter by duration"
                        >
                          <option value="">All Durations</option>
                          <option value="short">Short</option>
                          <option value="medium">Medium</option>
                          <option value="long">Long</option>
                        </select>
                      </div>

                      {/* Token Filters */}
                      <div className="space-y-2">
                        <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Tokens
                        </h3>
                        <select
                          value={filters.tokens.status || ''}
                          onChange={(e) => setFilters(prev => ({
                            ...prev,
                            tokens: { ...prev.tokens, status: e.target.value as any || undefined }
                          }))}
                          className={`w-full px-4 py-2 rounded-lg ${
                            darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'
                          }`}
                          title="Filter by status"
                          aria-label="Filter by status"
                        >
                          <option value="">All Statuses</option>
                          <option value="active">Active</option>
                          <option value="revoked">Revoked</option>
                          <option value="expired">Expired</option>
                        </select>
                        <select
                          value={filters.tokens.timeRange || ''}
                          onChange={(e) => setFilters(prev => ({
                            ...prev,
                            tokens: { ...prev.tokens, timeRange: e.target.value as any || undefined }
                          }))}
                          className={`w-full px-4 py-2 rounded-lg ${
                            darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'
                          }`}
                          title="Filter by duration"
                          aria-label="Filter by duration"
                        >
                          <option value="">All Durations</option>
                          <option value="short">Short</option>
                          <option value="medium">Medium</option>
                          <option value="long">Long</option>
                        </select>
                      </div>
                    </div>

                    {/* Clear Filters Button */}
                    <div className="flex justify-end">
                      <button
                        onClick={() => {
                          setFilters({
                            llmTraces: {},
                            auditLogs: {},
                            tokens: {}
                          });
                          setSearchQuery('');
                        }}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                          darkMode
                            ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        <FiX className="w-4 h-4" />
                        <span>Clear Filters</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bulk Actions Bar */}
            {(selectedTokens.length > 0 || selectedLogs.length > 0) && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-lg shadow-sm p-4 ${
                  darkMode ? 'bg-gray-800' : 'bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {selectedTokens.length > 0
                        ? `${selectedTokens.length} tokens selected`
                        : `${selectedLogs.length} logs selected`}
                    </span>
                    <div className="flex space-x-2">
                      {selectedTokens.length > 0 && (
                        <>
                          <button
                            onClick={() => handleBulkAction({ type: 'revoke', items: selectedTokens })}
                            className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                              darkMode
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : 'bg-red-100 hover:bg-red-200 text-red-700'
                            }`}
                          >
                            <FiAlertCircle className="w-4 h-4" />
                            <span>Revoke Selected</span>
                          </button>
                          <button
                            onClick={() => handleBulkAction({ type: 'export', items: selectedTokens })}
                            className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                              darkMode
                                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            }`}
                          >
                            <FiDownload className="w-4 h-4" />
                            <span>Export Selected</span>
                          </button>
                        </>
                      )}
                      {selectedLogs.length > 0 && (
                        <>
                          <button
                            onClick={() => handleBulkAction({ type: 'delete', items: selectedLogs })}
                            className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                              darkMode
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : 'bg-red-100 hover:bg-red-200 text-red-700'
                            }`}
                          >
                            <FiTrash2 className="w-4 h-4" />
                            <span>Delete Selected</span>
                          </button>
                          <button
                            onClick={() => handleBulkAction({ type: 'export', items: selectedLogs })}
                            className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                              darkMode
                                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            }`}
                          >
                            <FiDownload className="w-4 h-4" />
                            <span>Export Selected</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedTokens([]);
                      setSelectedLogs([]);
                    }}
                    className={`p-2 ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}
                    title="Clear selections"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow ${
                darkMode ? 'bg-gray-800' : 'bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  <FiBrain className="inline-block mr-2" />
                  LLM Trace Panel
                </h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => exportData('llmTraces')}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                      darkMode
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    <FiDownload className="w-4 h-4" />
                    <span>Export</span>
                  </button>
                  <button
                    onClick={() => {/* Refresh traces */}}
                    className={`p-2 ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'} transition-colors`}
                    title="Refresh traces"
                  >
                    <FiRefreshCw className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                {filterLLMTraces(llmTraces).map((trace) => (
                  <div
                    key={trace.id}
                    className={`p-4 rounded-lg ${
                      darkMode ? 'bg-gray-700' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {format(new Date(trace.timestamp), 'HH:mm:ss')}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        darkMode ? 'bg-gray-600' : 'bg-gray-200'
                      }`}>
                        {trace.model}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Prompt</p>
                        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{trace.prompt}</p>
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Plan</p>
                        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{trace.plan}</p>
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Output</p>
                        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{trace.output}</p>
                      </div>
                    </div>
                  </div>
                ))}
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
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  <FiSettings className="inline-block mr-2" />
                  System Controls
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {systemControls.map((control) => (
                  <div
                    key={control.id}
                    className={`p-4 rounded-lg ${
                      darkMode ? 'bg-gray-700' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                        {control.name}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        control.status === 'running'
                          ? 'bg-green-100 text-green-800'
                          : control.status === 'maintenance'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {control.status}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {/* Restart service */}}
                        className={`p-2 rounded ${
                          darkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                        title="Restart service"
                      >
                        <FiPower className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {/* Toggle maintenance */}}
                        className={`p-2 rounded ${
                          darkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                        title="Toggle maintenance mode"
                      >
                        <FiShield className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
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
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  <FiList className="inline-block mr-2" />
                  Audit Logs
                </h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => exportData('auditLogs')}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                      darkMode
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    <FiDownload className="w-4 h-4" />
                    <span>Export</span>
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <th className="px-4 py-2">
                        <input
                          type="checkbox"
                          checked={selectedLogs.length === filterAuditLogs(auditLogs).length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedLogs(filterAuditLogs(auditLogs).map(log => log.id));
                            } else {
                              setSelectedLogs([]);
                            }
                          }}
                          className={`rounded ${
                            darkMode
                              ? 'bg-gray-600 border-gray-500'
                              : 'bg-white border-gray-300'
                          }`}
                        />
                      </th>
                      <th className={`px-4 py-2 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Time</th>
                      <th className={`px-4 py-2 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>User</th>
                      <th className={`px-4 py-2 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Action</th>
                      <th className={`px-4 py-2 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Details</th>
                      <th className={`px-4 py-2 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filterAuditLogs(auditLogs).map((log) => (
                      <tr key={log.id} className={`${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                        <td className="px-4 py-2">
                          <input
                            type="checkbox"
                            checked={selectedLogs.includes(log.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedLogs([...selectedLogs, log.id]);
                              } else {
                                setSelectedLogs(selectedLogs.filter(id => id !== log.id));
                              }
                            }}
                            className={`rounded ${
                              darkMode
                                ? 'bg-gray-600 border-gray-500'
                                : 'bg-white border-gray-300'
                            }`}
                          />
                        </td>
                        <td className={`px-4 py-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {format(new Date(log.timestamp), 'HH:mm:ss')}
                        </td>
                        <td className={`px-4 py-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {log.user}
                        </td>
                        <td className={`px-4 py-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {log.action}
                        </td>
                        <td className={`px-4 py-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {log.details}
                        </td>
                        <td className={`px-4 py-2 text-sm`}>
                          <span className={`px-2 py-1 rounded text-xs ${
                            log.status === 'success'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow ${
                darkMode ? 'bg-gray-800' : 'bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  <FiKey className="inline-block mr-2" />
                  Token Management
                </h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => exportData('tokens')}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                      darkMode
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    <FiDownload className="w-4 h-4" />
                    <span>Export</span>
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <th className="px-4 py-2">
                        <input
                          type="checkbox"
                          checked={selectedTokens.length === filterTokens(tokens).length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTokens(filterTokens(tokens).map(token => token.id));
                            } else {
                              setSelectedTokens([]);
                            }
                          }}
                          className={`rounded ${
                            darkMode
                              ? 'bg-gray-600 border-gray-500'
                              : 'bg-white border-gray-300'
                          }`}
                        />
                      </th>
                      <th className={`px-4 py-2 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>User</th>
                      <th className={`px-4 py-2 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Issued</th>
                      <th className={`px-4 py-2 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Expires</th>
                      <th className={`px-4 py-2 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Last Used</th>
                      <th className={`px-4 py-2 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Status</th>
                      <th className={`px-4 py-2 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filterTokens(tokens).map((token) => (
                      <tr key={token.id} className={`${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                        <td className="px-4 py-2">
                          <input
                            type="checkbox"
                            checked={selectedTokens.includes(token.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTokens([...selectedTokens, token.id]);
                              } else {
                                setSelectedTokens(selectedTokens.filter(id => id !== token.id));
                              }
                            }}
                            className={`rounded ${
                              darkMode
                                ? 'bg-gray-600 border-gray-500'
                                : 'bg-white border-gray-300'
                            }`}
                          />
                        </td>
                        <td className={`px-4 py-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {token.user}
                        </td>
                        <td className={`px-4 py-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {format(new Date(token.issuedAt), 'HH:mm:ss')}
                        </td>
                        <td className={`px-4 py-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {format(new Date(token.expiresAt), 'HH:mm:ss')}
                        </td>
                        <td className={`px-4 py-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {token.lastUsed ? format(new Date(token.lastUsed), 'HH:mm:ss') : 'N/A'}
                        </td>
                        <td className={`px-4 py-2 text-sm`}>
                          <span className={`px-2 py-1 rounded text-xs ${
                            token.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : token.status === 'revoked'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {token.status}
                          </span>
                        </td>
                        <td className={`px-4 py-2 text-sm`}>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {/* Revoke token */}}
                              className={`p-2 rounded ${
                                darkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'
                              }`}
                              title="Revoke token"
                            >
                              <FiAlertCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* Updates & Features Panel */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={`rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow ${
                darkMode ? 'bg-gray-800' : 'bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  <FiBell className="inline-block mr-2" />
                  Updates & Features
                </h2>
              </div>

              {/* System Updates */}
              <div className="mb-6">
                <h3 className={`text-md font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  System Updates
                </h3>
                <div className="space-y-3">
                  {updates.map((update) => (
                    <div
                      key={update.id}
                      className={`p-4 rounded-lg ${
                        darkMode ? 'bg-gray-700' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {update.title}
                            </h4>
                            <span className={`px-2 py-1 rounded text-xs ${
                              update.type === 'security'
                                ? 'bg-red-100 text-red-800'
                                : update.type === 'feature'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {update.type}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs ${
                              update.status === 'available'
                                ? 'bg-yellow-100 text-yellow-800'
                                : update.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : update.status === 'failed'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {update.status}
                            </span>
                          </div>
                          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {update.description}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {format(new Date(update.releaseDate), 'MMM d, yyyy')}
                          </span>
                          {update.status === 'available' && (
                            <button
                              onClick={() => handleUpdate(update)}
                              className={`px-3 py-1 rounded-lg ${
                                darkMode
                                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                  : 'bg-blue-500 hover:bg-blue-600 text-white'
                              }`}
                            >
                              Update
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="mt-2">
                        <h5 className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Changelog:
                        </h5>
                        <ul className={`text-sm list-disc list-inside ${
                          darkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {update.changelog.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feature Flags */}
              <div>
                <h3 className={`text-md font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Feature Flags
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {featureFlags.map((flag) => (
                    <div
                      key={flag.id}
                      className={`p-4 rounded-lg ${
                        darkMode ? 'bg-gray-700' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {flag.name}
                            </h4>
                            <span className={`px-2 py-1 rounded text-xs ${
                              flag.enabled
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {flag.enabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {flag.description}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => toggleFeatureFlag(flag)}
                            className={`px-3 py-1 rounded-lg ${
                              flag.enabled
                                ? darkMode
                                  ? 'bg-red-600 hover:bg-red-700 text-white'
                                  : 'bg-red-500 hover:bg-red-600 text-white'
                                : darkMode
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : 'bg-green-500 hover:bg-green-600 text-white'
                            }`}
                          >
                            {flag.enabled ? 'Disable' : 'Enable'}
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Rollout
                          </span>
                          <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {flag.rolloutPercentage}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Usage
                          </span>
                          <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {flag.metrics.usage.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Success Rate
                          </span>
                          <span className={`text-sm font-medium ${
                            (flag.metrics.success / flag.metrics.usage) * 100 >= 90
                              ? 'text-green-500'
                              : (flag.metrics.success / flag.metrics.usage) * 100 >= 70
                              ? 'text-yellow-500'
                              : 'text-red-500'
                          }`}>
                            {((flag.metrics.success / flag.metrics.usage) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Update Modal */}
      <AnimatePresence>
        {showUpdateModal && selectedUpdate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className={`rounded-lg shadow-xl p-6 w-96 ${
                darkMode ? 'bg-gray-800' : 'bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Installing Update
                </h3>
                <button
                  onClick={() => setShowUpdateModal(false)}
                  className={`p-2 ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}
                  title="Close update modal"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {selectedUpdate.title}
                  </h4>
                  <p className={`text-sm mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {selectedUpdate.description}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Progress
                    </span>
                    <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {updateProgress}%
                    </span>
                  </div>
                  <div className={`h-2 rounded-full overflow-hidden ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-200'
                  }`}>
                    <div
                      className={`h-full rounded-full ${
                        updateProgress === 100
                          ? 'bg-green-500'
                          : 'bg-blue-500'
                      }`}
                      style={{ width: `${updateProgress}%` }}
                    />
                  </div>
                </div>
                {selectedUpdate.requiresRestart && updateProgress === 100 && (
                  <div className={`p-3 rounded-lg ${
                    darkMode ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    <p className="text-sm">
                      A system restart is required to complete the update.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;