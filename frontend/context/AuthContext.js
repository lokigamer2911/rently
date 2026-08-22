import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { getStoredAuthToken, setStoredAuthToken } from '../lib/authToken';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const startupRetryDone = useRef(false);
  const startupRetryTimer = useRef(null);

  // Fetch CSRF token on mount (for double-submit cookie pattern)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    api.get('/auth/csrf-token').catch(() => {
      // Non-critical — CSRF cookie may already exist from a previous session
    });
  }, []);

  const fetchUser = async ({ retryOn401 = false, useFallbackToken = false } = {}) => {
    try {
      const { data } = await api.get('/users/me', useFallbackToken ? { __useAuthFallback: true } : undefined);
      setUser(data);
    } catch (err) {
      if (err.response?.status === 401) {
        const hasFallbackToken = !!getStoredAuthToken();
        if (retryOn401 && hasFallbackToken && !startupRetryDone.current) {
          startupRetryDone.current = true;
          startupRetryTimer.current = window.setTimeout(() => {
            fetchUser({ retryOn401: false, useFallbackToken: true });
          }, 500);
          return;
        }
        // Only clear user if we definitely have no valid session
        // (don't clear on network errors)
        if (!hasFallbackToken && !err.message?.includes('Network Error')) {
          setUser(null);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser({ retryOn401: true });
    return () => {
      if (startupRetryTimer.current) {
        window.clearTimeout(startupRetryTimer.current);
      }
    };
  }, []);

  const login = (data) => {
    setStoredAuthToken(data.token);
    setUser(data.user);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout'); 
    } catch {
      // Ignore network errors on logout
    }
    setStoredAuthToken(null);
    setUser(null);
    // Hard redirect to clear all state
    window.location.href = '/';
  };

  const refreshUser = () => fetchUser({ retryOn401: true });

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuthContext = () => useContext(AuthContext);
