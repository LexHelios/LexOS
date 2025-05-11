import { renderHook, act } from '@testing-library/react-hooks';
import { useSessionStore } from '../SessionService';
import { sessionService } from '../SessionService';

describe('SessionService', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useSessionStore());
    expect(result.current.token).toBeNull();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBeFalsy();
  });

  it('should set tokens and update authentication state', () => {
    const { result } = renderHook(() => useSessionStore());
    const token = 'test-token';
    const refreshToken = 'test-refresh-token';

    act(() => {
      result.current.setTokens(token, refreshToken);
    });

    expect(result.current.token).toBe(token);
    expect(result.current.refreshToken).toBe(refreshToken);
    expect(result.current.isAuthenticated).toBeTruthy();
  });

  it('should set user data', () => {
    const { result } = renderHook(() => useSessionStore());
    const user = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      roles: ['admin'],
    };

    act(() => {
      result.current.setUser(user);
    });

    expect(result.current.user).toEqual(user);
  });

  it('should clear session data', () => {
    const { result } = renderHook(() => useSessionStore());

    act(() => {
      result.current.setTokens('token', 'refresh-token');
      result.current.setUser({
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        roles: ['admin'],
      });
    });

    act(() => {
      result.current.clearSession();
    });

    expect(result.current.token).toBeNull();
    expect(result.current.refreshToken).toBeNull();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBeFalsy();
  });

  it('should handle login', async () => {
    const mockResponse = {
      token: 'test-token',
      refreshToken: 'test-refresh-token',
      user: {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        roles: ['admin'],
      },
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    await act(async () => {
      await sessionService.login('test@example.com', 'password');
    });

    const { result } = renderHook(() => useSessionStore());
    expect(result.current.token).toBe(mockResponse.token);
    expect(result.current.refreshToken).toBe(mockResponse.refreshToken);
    expect(result.current.user).toEqual(mockResponse.user);
    expect(result.current.isAuthenticated).toBeTruthy();
  });

  it('should handle login error', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
    });

    const { result } = renderHook(() => useSessionStore());

    await expect(
      act(async () => {
        await sessionService.login('test@example.com', 'wrong-password');
      })
    ).rejects.toThrow('Invalid credentials');

    expect(result.current.error).toBeTruthy();
    expect(result.current.isAuthenticated).toBeFalsy();
  });

  it('should handle logout', async () => {
    const { result } = renderHook(() => useSessionStore());

    act(() => {
      result.current.setTokens('token', 'refresh-token');
      result.current.setUser({
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        roles: ['admin'],
      });
    });

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
    });

    await act(async () => {
      await sessionService.logout();
    });

    expect(result.current.token).toBeNull();
    expect(result.current.refreshToken).toBeNull();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBeFalsy();
  });
}); 