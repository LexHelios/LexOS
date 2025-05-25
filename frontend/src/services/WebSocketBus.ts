import { create } from 'zustand';

export type WebSocketEventType = 
  | 'metrics_update'
  | 'service_status'
  | 'insight_event'
  | 'alert_event'
  | 'trace_event';

export type WebSocketState = {
  isConnected: boolean;
  lastError: string | null;
  reconnectAttempts: number;
};

export type WebSocketStore = WebSocketState & {
  connect: () => void;
  disconnect: () => void;
  setError: (error: string | null) => void;
  incrementReconnectAttempts: () => void;
  resetReconnectAttempts: () => void;
};

const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 1000;

class WebSocketBus {
  private ws: WebSocket | null = null;
  private eventHandlers: Map<WebSocketEventType, Set<(data: any) => void>> = new Map();
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private store: WebSocketStore;

  constructor() {
    this.store = create<WebSocketStore>((set) => ({
      isConnected: false,
      lastError: null,
      reconnectAttempts: 0,
      connect: () => this.connect(),
      disconnect: () => this.disconnect(),
      setError: (error) => set({ lastError: error }),
      incrementReconnectAttempts: () => set((state) => ({ 
        reconnectAttempts: state.reconnectAttempts + 1 
      })),
      resetReconnectAttempts: () => set({ reconnectAttempts: 0 }),
    }));
  }

  private connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.store.resetReconnectAttempts();
      this.store.setError(null);
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.handleReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.store.setError('Connection error occurred');
    };

    this.ws.onmessage = (event) => {
      try {
        const { type, data } = JSON.parse(event.data);
        const handlers = this.eventHandlers.get(type as WebSocketEventType);
        if (handlers) {
          handlers.forEach(handler => handler(data));
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        this.store.setError('Failed to parse message');
      }
    };
  }

  private handleReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    if (this.store.getState().reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      this.store.incrementReconnectAttempts();
      const delay = RECONNECT_DELAY * Math.pow(2, this.store.getState().reconnectAttempts - 1);
      this.reconnectTimeout = setTimeout(() => this.connect(), delay);
    } else {
      this.store.setError('Max reconnection attempts reached');
    }
  }

  public subscribe<T>(eventType: WebSocketEventType, handler: (data: T) => void): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }

    const handlers = this.eventHandlers.get(eventType)!;
    handlers.add(handler);

    // Ensure connection is established
    this.connect();

    return () => {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.eventHandlers.delete(eventType);
      }
    };
  }

  public send(eventType: WebSocketEventType, data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: eventType, data }));
    } else {
      this.store.setError('Cannot send message: WebSocket not connected');
    }
  }

  public disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  public getState() {
    return this.store.getState();
  }
}

export const websocketBus = new WebSocketBus(); 