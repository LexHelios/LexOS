import { io, Socket } from 'socket.io-client';

interface WebSocketData {
  metrics?: any;
  health?: any;
  alerts?: any;
  userActivity?: any;
}

class WebSocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(data: WebSocketData) => void>> = new Map();

  constructor() {
    this.connect();
  }

  private connect() {
    this.socket = io(import.meta.env.VITE_WS_URL || 'ws://localhost:8000', {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    this.socket.on('error', (error: Error) => {
      console.error('WebSocket error:', error);
    });

    // Set up event listeners
    this.socket.on('metrics_update', (data: WebSocketData) => {
      this.notifyListeners('metrics', data);
    });

    this.socket.on('system_health', (data: WebSocketData) => {
      this.notifyListeners('health', data);
    });

    this.socket.on('alerts', (data: WebSocketData) => {
      this.notifyListeners('alerts', data);
    });

    this.socket.on('user_activity', (data: WebSocketData) => {
      this.notifyListeners('user_activity', data);
    });
  }

  public subscribe(event: string, callback: (data: WebSocketData) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
  }

  public unsubscribe(event: string, callback: (data: WebSocketData) => void) {
    this.listeners.get(event)?.delete(callback);
  }

  private notifyListeners(event: string, data: WebSocketData) {
    this.listeners.get(event)?.forEach(callback => callback(data));
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const websocketService = new WebSocketService(); 