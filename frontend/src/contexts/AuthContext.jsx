import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { setCsrfToken } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCsrf = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/csrf-token');
      setCsrfToken(data.csrf_token);
    } catch (_) {}
  }, []);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
    } catch (_) {
      localStorage.removeItem('access_token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCsrf().then(loadUser);
    const handler = () => { setUser(null); localStorage.removeItem('access_token'); };
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, [fetchCsrf, loadUser]);

  const login = async (email, password) => {
    await fetchCsrf();
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('access_token', data.access_token);
    setCsrfToken(data.csrf_token);
    setUser(data.user);
    return data;
  };

  const register = async (username, email, password, display_name) => {
    await fetchCsrf();
    const { data } = await api.post('/auth/register', { username, email, password, display_name });
    localStorage.setItem('access_token', data.access_token);
    setCsrfToken(data.csrf_token);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    try {
      await fetchCsrf();
      await api.post('/auth/logout');
    } catch (_) {}
    localStorage.removeItem('access_token');
    setUser(null);
    await fetchCsrf();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
