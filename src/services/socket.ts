import { create } from "zustand";

interface SocketState {
  socket: WebSocket | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  send: (message: string) => void;
}

const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  connect: () => {
    // Get WebSocket URL from environment or use production fallback
    // IMPORTANT: All WebSocket connections must use the /ws endpoint
    let wsUrl = import.meta.env.VITE_WS_URL || 'wss://lexos-2.onrender.com/ws';
    
    // Safety check: Ensure the URL ends with /ws for proper WebSocket routing
    if (!wsUrl.endsWith('/ws')) {
      wsUrl = wsUrl.replace(/\/$/, '') + '/ws'; // Remove trailing slash if exists, then add /ws
      console.warn('WebSocket URL did not end with /ws, automatically appended:', wsUrl);
    }

    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log("WebSocket connected");
      set({ isConnected: true });
    };

    socket.onclose = () => {
      console.log("WebSocket disconnected");
      set({ isConnected: false });
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      set({ isConnected: false });
    };

    set({ socket });
  },
  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.close();
      set({ socket: null, isConnected: false });
    }
  },
  send: (message: string) => {
    const { socket, isConnected } = get();
    if (socket && isConnected) {
      socket.send(message);
    } else {
      console.error("WebSocket not connected");
    }
  },
}));

export default useSocketStore; 