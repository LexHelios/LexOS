type MessageHandler = (message: string) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private messageHandlers: MessageHandler[] = [];

  connect(url: string) {
    // Safety check: Ensure WebSocket URL ends with /ws for proper backend routing
    // All WebSocket connections in LexOS must use the /ws endpoint
    let wsUrl = url;
    if (!wsUrl.endsWith('/ws')) {
      wsUrl = wsUrl.replace(/\/$/, '') + '/ws'; // Remove trailing slash if exists, then add /ws
      console.warn('WebSocket URL did not end with /ws, automatically appended:', wsUrl);
    }
    
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
    };

    this.ws.onmessage = (event) => {
      const message = event.data;
      this.messageHandlers.forEach(handler => handler(message));
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      // Attempt to reconnect after 5 seconds using the same corrected URL
      setTimeout(() => this.connect(wsUrl), 5000);
    };
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  sendMessage(message: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(message);
    } else {
      console.error('WebSocket is not connected');
    }
  }

  addMessageHandler(handler: MessageHandler) {
    this.messageHandlers.push(handler);
  }

  removeMessageHandler(handler: MessageHandler) {
    this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
  }
}

export const websocketService = new WebSocketService(); 