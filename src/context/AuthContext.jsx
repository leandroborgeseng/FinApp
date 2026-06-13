import React from 'react';
import { getAccessToken } from '../api/client.js';
import * as authApi from '../api/auth.js';

const AuthContext = React.createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(!!getAccessToken());

  const bootstrap = React.useCallback(async () => {
    if (!getAccessToken()) {
      setLoading(false);
      return;
    }
    try {
      const me = await authApi.fetchMe();
      setUser(me);
      localStorage.setItem('fin_logged_in', '1');
      localStorage.setItem('fin_user_email', me.email);
    } catch {
      await authApi.logout();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { bootstrap(); }, [bootstrap]);

  const login = async (email, password) => {
    const me = await authApi.login(email, password);
    setUser(me);
    return me;
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
