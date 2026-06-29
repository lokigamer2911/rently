import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    const token = typeof window !== 'undefined' && localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get('/users/me');
      setUser(data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = (data) => {
    if (data.token) localStorage.setItem('token', data.token);
    setUser(data.user);
  };

  const logout = async () => {
    // Tell the server to increment tokenVersion — instantly invalidates this token
    // and all other active sessions for this user across all devices
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await api.post('/auth/logout'); // Fire-and-forget is fine; clears locally regardless
      } catch {
        // Even if the server call fails, clear locally so the UI logs out
      }
    }
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/';
  };

  const refreshUser = () => fetchUser();

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuthContext = () => useContext(AuthContext);
