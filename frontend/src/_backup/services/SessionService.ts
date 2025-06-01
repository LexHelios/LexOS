import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  roles: string[];
}

interface SessionState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface SessionActions {
  setTokens: (token: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  clearSession: () => void;
  setError: (error: string | null) => void;
  setLoading: (isLoading: boolean) => void;
}

interface SessionStore extends SessionState, SessionActions {}

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const TOKEN_EXPIRY_KEY = 'token_expiry';

export const useSessionStore = create<SessionStore>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      setTokens: (token: string, refreshToken: string) => {
        // Calculate token expiry (1 hour from now)
        const expiry = Date.now() + 60 * 60 * 1000;
        localStorage.setItem(TOKEN_EXPIRY_KEY, expiry.toString());
        set({ token, refreshToken, isAuthenticated: true, error: null });
      },

      setUser: (user: User) => {
        set({ user });
      },

      clearSession: () => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(TOKEN_EXPIRY_KEY);
        set({
          token: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
          error: null,
        });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      setLoading: (isLoading: boolean) => {
        set({ isLoading });
      },
    }),
    {
      name: 'session-storage',
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    }
  )
);

class SessionService {
  private static instance: SessionService;
  private refreshTimeout: NodeJS.Timeout | null = null;

  private constructor() {
    this.initializeSession();
  }

  public static getInstance(): SessionService {
    if (!SessionService.instance) {
      SessionService.instance = new SessionService();
    }
    return SessionService.instance;
  }

  private initializeSession() {
    const store = useSessionStore.getState();
    if (store.token) {
      this.scheduleTokenRefresh();
    }
  }

  private scheduleTokenRefresh() {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }

    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    if (!expiry) return;

    const timeUntilExpiry = parseInt(expiry) - Date.now();
    if (timeUntilExpiry <= 0) {
      this.refreshToken();
      return;
    }

    // Refresh token 5 minutes before expiry
    const refreshTime = Math.max(0, timeUntilExpiry - 5 * 60 * 1000);
    this.refreshTimeout = setTimeout(() => {
      this.refreshToken();
    }, refreshTime);
  }

  private async refreshToken() {
    const store = useSessionStore.getState();
    if (!store.refreshToken) return;

    try {
      store.setLoading(true);
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: store.refreshToken,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const { token, refreshToken } = await response.json();
      store.setTokens(token, refreshToken);
      this.scheduleTokenRefresh();
    } catch (error) {
      store.setError(error instanceof Error ? error.message : 'Failed to refresh token');
      store.clearSession();
    } finally {
      store.setLoading(false);
    }
  }

  public async login(email: string, password: string): Promise<void> {
    const store = useSessionStore.getState();
    try {
      store.setLoading(true);
      store.setError(null);

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const { token, refreshToken, user } = await response.json();
      store.setTokens(token, refreshToken);
      store.setUser(user);
      this.scheduleTokenRefresh();
    } catch (error) {
      store.setError(error instanceof Error ? error.message : 'Login failed');
      throw error;
    } finally {
      store.setLoading(false);
    }
  }

  public async logout(): Promise<void> {
    const store = useSessionStore.getState();
    try {
      if (store.token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${store.token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      store.clearSession();
      if (this.refreshTimeout) {
        clearTimeout(this.refreshTimeout);
      }
    }
  }

  public getAuthHeader(): Record<string, string> {
    const store = useSessionStore.getState();
    return store.token ? { Authorization: `Bearer ${store.token}` } : {};
  }

  public isTokenExpired(): boolean {
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    if (!expiry) return true;
    return Date.now() >= parseInt(expiry);
  }
}

export const sessionService = SessionService.getInstance(); 