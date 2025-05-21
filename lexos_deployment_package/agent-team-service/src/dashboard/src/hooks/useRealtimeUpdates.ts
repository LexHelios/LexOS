import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import { AgentMetrics, TaskMetrics } from '../services/api';

export const useRealtimeUpdates = () => {
  const [agents, setAgents] = useState<AgentMetrics[]>([]);
  const [taskHistory, setTaskHistory] = useState<TaskMetrics[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const handleWebSocketUpdate = useCallback((data: any) => {
    if (data.type === 'agent_update') {
      setAgents(prevAgents => {
        const updatedAgents = [...prevAgents];
        const index = updatedAgents.findIndex(a => a.id === data.agent.id);
        if (index !== -1) {
          updatedAgents[index] = data.agent;
        } else {
          updatedAgents.push(data.agent);
        }
        return updatedAgents;
      });
    } else if (data.type === 'task_update') {
      setTaskHistory(prevHistory => {
        const newHistory = [...prevHistory, data.task];
        // Keep only the last 100 tasks
        return newHistory.slice(-100);
      });
    }
  }, []);

  useEffect(() => {
    // Initial data fetch
    const fetchInitialData = async () => {
      try {
        const [agentsData, taskHistoryData] = await Promise.all([
          apiService.getAgents(),
          apiService.getTaskHistory()
        ]);
        setAgents(agentsData);
        setTaskHistory(taskHistoryData);
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };

    fetchInitialData();

    // Set up WebSocket connection
    const ws = apiService.connectWebSocket(handleWebSocketUpdate);
    setIsConnected(true);

    // Cleanup
    return () => {
      ws.close();
      setIsConnected(false);
    };
  }, [handleWebSocketUpdate]);

  return {
    agents,
    taskHistory,
    isConnected
  };
}; 