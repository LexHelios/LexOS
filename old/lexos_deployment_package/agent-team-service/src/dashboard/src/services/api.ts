import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

export interface AgentMetrics {
  id: string;
  name: string;
  status: 'active' | 'idle' | 'error';
  metrics: {
    cpu: number;
    memory: number;
    tasks: number;
  };
}

export interface TaskMetrics {
  timestamp: string;
  activeTasks: number;
  completedTasks: number;
  failedTasks: number;
}

export interface PerformanceMetrics {
  agentId: string;
  metrics: {
    cpu: number[];
    memory: number[];
    tasks: number[];
    timestamps: string[];
  };
}

class ApiService {
  private api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // Agent endpoints
  async getAgents(): Promise<AgentMetrics[]> {
    const response = await this.api.get('/agents');
    return response.data;
  }

  async getAgentMetrics(agentId: string): Promise<PerformanceMetrics> {
    const response = await this.api.get(`/agents/${agentId}/metrics`);
    return response.data;
  }

  // Task endpoints
  async getTaskHistory(): Promise<TaskMetrics[]> {
    const response = await this.api.get('/tasks/history');
    return response.data;
  }

  async getActiveTasks(): Promise<number> {
    const response = await this.api.get('/tasks/active');
    return response.data.count;
  }

  // System endpoints
  async getSystemStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'critical';
    message: string;
  }> {
    const response = await this.api.get('/system/status');
    return response.data;
  }

  // Real-time updates using WebSocket
  connectWebSocket(onUpdate: (data: any) => void): WebSocket {
    const ws = new WebSocket(`${API_BASE_URL.replace('http', 'ws')}/ws`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onUpdate(data);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return ws;
  }
}

export const apiService = new ApiService(); 