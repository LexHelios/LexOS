declare type WebSocketEventType = 'metrics' | 'health' | 'alerts' | 'insights' | 'services';

declare type WebSocketEventHandler<T> = (data: T) => void;

declare class WebSocketService {
  private ws: WebSocket | null;
  private eventHandlers: Map<WebSocketEventType, Set<WebSocketEventHandler<any>>>;
  private reconnectAttempts: number;
  private maxReconnectAttempts: number;
  private reconnectTimeout: number;

  constructor();
  private connect(): void;
  private handleReconnect(): void;
  public subscribe<T>(eventType: WebSocketEventType, handler: WebSocketEventHandler<T>): () => void;
  public send(eventType: WebSocketEventType, data: any): void;
}

declare const websocketService: WebSocketService;

export { WebSocketService, websocketService, WebSocketEventType, WebSocketEventHandler }; 