import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const { data } = await api.get('/users/me');
      setUser(data);
    } catch (err) {
      if (err.response?.status === 401) {
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
    // The backend now sets an HttpOnly cookie automatically.
    setUser(data.user);
  };

  const logout = async () => {
    // Tell the server to increment tokenVersion and clear the cookie
    try {
      await api.post('/auth/logout'); 
    } catch {
      // Ignore network errors on logout
    }
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
