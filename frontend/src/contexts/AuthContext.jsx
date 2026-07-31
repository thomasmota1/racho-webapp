import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('racho_token');
    if (!token) {
      setLoading(false);
      return;
    }

    api('/auth/me')
      .then(setUser)
      .catch(() => localStorage.removeItem('racho_token'))
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const data = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('racho_token', data.token);
    setUser(data.user);
    return data.user;
  }

  async function register(name, email, password) {
    const data = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    localStorage.setItem('racho_token', data.token);
    setUser(data.user);
  }

  function logout() {
    localStorage.removeItem('racho_token');
    setUser(null);
  }

  async function refreshUser() {
    const data = await api('/auth/me');
    setUser(data);
  }

  const value = useMemo(() => ({
    user, loading, login, register, logout, refreshUser,
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
