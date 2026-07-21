import React, { createContext, useState, useEffect, useCallback } from 'react';
import type { User } from '../types/user.type';
import authApi from '../api/authApi';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (token: string, user: User) => void;
  loginWithGoogle: (credential: string) => Promise<User>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  updateCurrentUser: (updatedUser: User) => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true,
  login: () => {},
  loginWithGoogle: async () => { throw new Error('Not implemented'); },
  logout: () => {},
  fetchProfile: async () => {},
  updateCurrentUser: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await authApi.getProfile();
      const userData = res.data.data?.user || res.data.data;
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch {
      // Token expired or invalid
      setToken(null);
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }, []);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
      // Fetch latest profile from backend
      fetchProfile().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [fetchProfile]);

  const login = useCallback((newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
  }, []);

  const loginWithGoogle = useCallback(async (credential: string): Promise<User> => {
    const res = await authApi.googleLogin(credential);
    const { token: newToken, user: newUser } = res.data.data;

    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));

    return newUser;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  /**
   * Immediately update user in context and localStorage after profile edit.
   * Header/dropdown re-render automatically since they consume AuthContext.
   */
  const updateCurrentUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token && !!user, login, loginWithGoogle, logout, loading, fetchProfile, updateCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
};
