// Frontend Ollama Service
// Save as: frontend/src/services/ollamaService.ts

export interface OllamaRequest {
  prompt: string;
  model?: string;
  context?: Record<string, any>;
  temperature?: number;
}

export interface OllamaResponse {
  response: string;
  model: string;
  duration: number;
  uncensored: boolean;
}

export interface OllamaConsensusResponse {
  consensus: string;
  individual_responses: OllamaResponse[];
  models_used: string[];
  timestamp: string;
}

export interface OllamaModel {
  name: string;
  context_length: number;
  capabilities: string[];
  uncensored: boolean;
}

export interface OllamaHealth {
  status: string;
  available_models: string[];
  error?: string;
}

export class OllamaService {
  private ws: WebSocket | null = null;
  private baseUrl: string;
  private wsUrl: string;
  private messageHandlers: Map<string, (data: any) => void> = new Map();

  constructor(
    baseUrl: string = import.meta.env.VITE_API_URL || 'http://localhost:8000',
    wsUrl: string = import.meta.env.VITE_WS_URL || 'wss://lexos-2.onrender.com/ws'
  ) {
    this.baseUrl = baseUrl;
    
    // Safety check: Ensure WebSocket URL ends with /ws for proper routing
    // All WebSocket connections in LexOS must use the /ws endpoint
    if (!wsUrl.endsWith('/ws')) {
      this.wsUrl = wsUrl.replace(/\/$/, '') + '/ws'; // Remove trailing slash if exists, then add /ws
      console.warn('WebSocket URL did not end with /ws, automatically appended:', this.wsUrl);
    } else {
      this.wsUrl = wsUrl;
    }
  }

  // HTTP API calls
  async reason(request: OllamaRequest): Promise<OllamaResponse> {
    const response = await fetch(`${this.baseUrl}/api/ollama/reason`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || `Ollama request failed: ${response.statusText}`);
    }

    return response.json();
  }

  async getConsensus(
    prompt: string,
    models?: string[]
  ): Promise<OllamaConsensusResponse> {
    const response = await fetch(`${this.baseUrl}/api/ollama/consensus`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, models }),
    });

    if (!response.ok) {
      throw new Error(`Consensus request failed: ${response.statusText}`);
    }

    return response.json();
  }

  async getModels(): Promise<{
    models: string[];
    capabilities: Record<string, OllamaModel>;
    recommended: Record<string, string>;
  }> {
    const response = await fetch(`${this.baseUrl}/api/ollama/models`);
    if (!response.ok) {
      throw new Error(`Failed to get models: ${response.statusText}`);
    }
    return response.json();
  }

  async checkHealth(): Promise<OllamaHealth> {
    const response = await fetch(`${this.baseUrl}/api/ollama/health`);
    return response.json();
  }

  async pullModel(modelName: string): Promise<{ message: string; success: boolean }> {
    const response = await fetch(`${this.baseUrl}/api/ollama/pull`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model_name: modelName }),
    });

    if (!response.ok) {
      throw new Error(`Failed to pull model: ${response.statusText}`);
    }

    return response.json();
  }

  // WebSocket methods
  connectWebSocket(clientId: string = 'web-client'): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(`${this.wsUrl}/${clientId}`);

      this.ws.onopen = () => {
        console.log('🧠 ATLAS WebSocket connected');
        resolve();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.ws = null;
      };
    });
  }

  private handleMessage(data: any): void {
    const { type } = data;
    const handler = this.messageHandlers.get(type);
    if (handler) {
      handler(data);
    }
  }

  onMessage(type: string, handler: (data: any) => void): void {
    this.messageHandlers.set(type, handler);
  }

  removeMessageHandler(type: string): void {
    this.messageHandlers.delete(type);
  }

  async reasonViaWebSocket(
    prompt: string,
    model: string = 'dolphin-llama3:latest',
    context?: Record<string, any>
  ): Promise<OllamaResponse> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      const handleResponse = (data: any) => {
        if (data.type === 'ollama_response') {
          this.removeMessageHandler('ollama_response');
          if (data.success) {
            resolve(data.data);
          } else {
            reject(new Error(data.error));
          }
        }
      };

      this.onMessage('ollama_response', handleResponse);

      this.ws.send(
        JSON.stringify({
          type: 'ollama_reasoning',
          prompt,
          model,
          context,
        })
      );

      // Timeout after 5 minutes
      setTimeout(() => {
        this.removeMessageHandler('ollama_response');
        reject(new Error('Request timed out'));
      }, 300000);
    });
  }

  // Streaming support
  connectStreamingWebSocket(url?: string): WebSocket {
    const streamWs = new WebSocket(
      url || `${this.baseUrl.replace('http', 'ws')}/api/ollama/stream`
    );
    return streamWs;
  }

  async *streamReasoning(
    prompt: string,
    model: string = 'dolphin-llama3:latest'
  ): AsyncGenerator<string, void, unknown> {
    const ws = this.connectStreamingWebSocket();

    try {
      await new Promise((resolve, reject) => {
        ws.onopen = resolve;
        ws.onerror = reject;
      });

      ws.send(JSON.stringify({ prompt, model }));

      const messageQueue: string[] = [];
      let done = false;

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'stream' && data.content) {
          messageQueue.push(data.content);
        }
        if (data.done || data.type === 'complete') {
          done = true;
        }
      };

      while (!done || messageQueue.length > 0) {
        if (messageQueue.length > 0) {
          yield messageQueue.shift()!;
        } else {
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
      }
    } finally {
      ws.close();
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.messageHandlers.clear();
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}