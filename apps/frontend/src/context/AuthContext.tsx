/**
 * Authentication Context
 * Provides auth state and methods to the entire app
 */

import React, { useState, createContext, useContext, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { IUser, IAuthContext } from '../types';

const AuthContext = createContext<IAuthContext | undefined>(undefined);
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

/**
 * Hook to access auth context
 * Must be used within AuthProvider
 */
export const useAuth = (): IAuthContext => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

/**
 * Authentication Provider
 * Manages user state, login, and logout
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Used to purge other users' cached queries on every auth transition
  const queryClient = useQueryClient();
  const logoutRef = useRef<() => void>();

  // Define logout first so verify can use it
  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
    // Wipe ALL cached query data so the next user never sees this user's data
    queryClient.clear();
  }, [queryClient]);

  // Keep logoutRef in sync so the interceptor can access it without stale closure
  logoutRef.current = logout;

  // Verify stored session against server on mount
  useEffect(() => {
    const verifySession = async () => {
      const token = localStorage.getItem('auth_token');
      const storedUser = localStorage.getItem('auth_user');

      if (!token || !storedUser) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/auth/verify`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          // Token expired or user deactivated — clear everything
          logoutRef.current?.();
          setIsLoading(false);
          return;
        }

        const data = await response.json();
        const verifiedUser = data.data?.user;
        if (verifiedUser) {
          setUser(verifiedUser);
          localStorage.setItem('auth_user', JSON.stringify(verifiedUser));
        } else {
          // Unexpected response shape — clear
          logoutRef.current?.();
        }
      } catch {
        // Network error — trust stored user for offline/dev convenience
        try {
          const parsedUser = JSON.parse(storedUser) as IUser;
          setUser(parsedUser);
        } catch {
          logoutRef.current?.();
        }
      }
      setIsLoading(false);
    };

    verifySession();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Login failed');
    }

    const data = await response.json();
    const userData = data.data?.user || data.user;
    const token = data.data?.token || data.token;

    setUser(userData);
    localStorage.setItem('auth_user', JSON.stringify(userData));
    localStorage.setItem('auth_token', token);
    // Clear any previous user's cached data so the new user starts fresh
    queryClient.clear();
  }, [queryClient]);

  const platformLogin = useCallback(async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/platform-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Login failed');
    }

    const data = await response.json();
    const userData = data.data?.user || data.user;
    const token = data.data?.token || data.token;

    setUser(userData);
    localStorage.setItem('auth_user', JSON.stringify(userData));
    localStorage.setItem('auth_token', token);
    queryClient.clear();
  }, [queryClient]);

  const value: IAuthContext = {
    user,
    login,
    platformLogin,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin' || user?.role === 'super_admin',
    isSuperAdmin: user?.role === 'super_admin',
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
