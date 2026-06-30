import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { getStoredAuthToken, setStoredAuthToken } from '../lib/authToken';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const startupRetryDone = useRef(false);
  const startupRetryTimer = useRef(null);

  const fetchUser = async ({ retryOn401 = false } = {}) => {
    try {
      const { data } = await api.get('/users/me');
      setUser(data);
    } catch (err) {
      if (err.response?.status === 401) {
        const hasFallbackToken = !!getStoredAuthToken();
        if (retryOn401 && hasFallbackToken && !startupRetryDone.current) {
          startupRetryDone.current = true;
          startupRetryTimer.current = window.setTimeout(() => {
            fetchUser({ retryOn401: false });
          }, 500);
          return;
        }
        if (!hasFallbackToken) {
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
    // Keep a bearer fallback for browsers that block or delay the cookie.
    setStoredAuthToken(data.token);
    setUser(data.user);
  };

  const logout = async () => {
    // Tell the server to increment tokenVersion and clear the cookie
    try {
      await api.post('/auth/logout'); 
    } catch {
      // Ignore network errors on logout
    }
    setStoredAuthToken(null);
    setUser(null);
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
