import { renderHook, act } from '@testing-library/react-hooks';
import { useRealtimeUpdates } from '../useRealtimeUpdates';

// Mock WebSocket
class MockWebSocket {
  onopen: (() => void) | null = null;
  onmessage: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  onclose: (() => void) | null = null;
  readyState = 0;

  constructor(url: string) {
    setTimeout(() => this.onopen?.(), 0);
  }

  send(data: string) {
    // Mock send implementation
  }

  close() {
    this.onclose?.();
  }
}

(global as any).WebSocket = MockWebSocket;

describe('useRealtimeUpdates Hook', () => {
  const mockData = {
    agents: [
      { id: 1, name: 'Agent 1', status: 'active' },
      { id: 2, name: 'Agent 2', status: 'inactive' },
    ],
    systemStatus: {
      cpu: 45,
      memory: 60,
      disk: 75,
    },
  };

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('initializes with loading state', () => {
    const { result } = renderHook(() => useRealtimeUpdates());
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('handles WebSocket connection', () => {
    const { result } = renderHook(() => useRealtimeUpdates());

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.loading).toBe(false);
  });

  it('handles WebSocket messages', () => {
    const { result } = renderHook(() => useRealtimeUpdates());

    act(() => {
      const ws = new WebSocket('ws://localhost:8000');
      ws.onmessage?.({ data: JSON.stringify(mockData) } as any);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('handles WebSocket errors', () => {
    const { result } = renderHook(() => useRealtimeUpdates());

    act(() => {
      const ws = new WebSocket('ws://localhost:8000');
      ws.onerror?.({ message: 'Connection failed' } as any);
    });

    expect(result.current.error).toBe('Connection failed');
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();
  });

  it('cleans up WebSocket connection', () => {
    const { unmount } = renderHook(() => useRealtimeUpdates());
    const ws = new WebSocket('ws://localhost:8000');
    const closeSpy = jest.spyOn(ws, 'close');

    unmount();

    expect(closeSpy).toHaveBeenCalled();
  });
}); 