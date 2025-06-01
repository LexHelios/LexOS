import { useState, useEffect, useCallback, useRef } from 'react';

interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: number;
}

interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  lastMessage: WebSocketMessage | null;
  reconnectAttempts: number;
}

export const useWebSocket = (url: string = 'ws://localhost:8080') => {
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    lastMessage: null,
    reconnectAttempts: 0
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number>();
  const messageQueueRef = useRef<WebSocketMessage[]>([]);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setState(prev => ({
      ...prev,
      isConnecting: true,
      error: null
    }));

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setState(prev => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          reconnectAttempts: 0
        }));

        // Send queued messages
        while (messageQueueRef.current.length > 0) {
          const message = messageQueueRef.current.shift();
          if (message) {
            ws.send(JSON.stringify(message));
          }
        }
      };

      ws.onclose = () => {
        setState(prev => ({
          ...prev,
          isConnected: false,
          isConnecting: false
        }));

        // Attempt to reconnect
        if (state.reconnectAttempts < 5) {
          reconnectTimeoutRef.current = window.setTimeout(() => {
            setState(prev => ({
              ...prev,
              reconnectAttempts: prev.reconnectAttempts + 1
            }));
            connect();
          }, Math.min(1000 * Math.pow(2, state.reconnectAttempts), 30000));
        }
      };

      ws.onerror = (error) => {
        setState(prev => ({
          ...prev,
          error: 'WebSocket error occurred',
          isConnecting: false
        }));
        console.error('WebSocket error:', error);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          setState(prev => ({
            ...prev,
            lastMessage: message
          }));
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to connect to WebSocket',
        isConnecting: false
      }));
      console.error('Failed to connect to WebSocket:', error);
    }
  }, [url, state.reconnectAttempts]);

  // Send message
  const sendMessage = useCallback((type: string, payload: any) => {
    const message: WebSocketMessage = {
      type,
      payload,
      timestamp: Date.now()
    };

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      // Queue message for later
      messageQueueRef.current.push(message);
    }
  }, []);

  // Subscribe to messages
  const subscribe = useCallback((type: string, callback: (payload: any) => void) => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data) as WebSocketMessage;
        if (message.type === type) {
          callback(message.payload);
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    wsRef.current?.addEventListener('message', handleMessage);
    return () => {
      wsRef.current?.removeEventListener('message', handleMessage);
    };
  }, []);

  // Disconnect
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    setState(prev => ({
      ...prev,
      isConnected: false,
      isConnecting: false,
      reconnectAttempts: 0
    }));
  }, []);

  // Connect on mount
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected: state.isConnected,
    isConnecting: state.isConnecting,
    error: state.error,
    lastMessage: state.lastMessage,
    sendMessage,
    subscribe,
    disconnect
  };
}; 