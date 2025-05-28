import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

const WS_URL = process.env.REACT_APP_WS_URL || "http://localhost:8000";

export function useWebSocket<T = any>(topic: string) {
  const [data, setData] = useState<T | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(WS_URL);
    socketRef.current = socket;
    socket.on(topic, (payload: T) => setData(payload));
    return () => {
      socket.off(topic);
      socket.disconnect();
    };
  }, [topic]);

  return data;
} 