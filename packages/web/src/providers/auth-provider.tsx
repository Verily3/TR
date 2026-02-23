'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import type { AuthUser as BaseAuthUser } from '@tr/shared';

// Extended user type with profile info
interface AuthUser extends BaseAuthUser {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatar?: string;
  title?: string;
  department?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // Mutex: prevent concurrent refreshUser calls
  const refreshPromiseRef = useRef<Promise<void> | null>(null);

  // Track client-side mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const refreshUser = useCallback(async () => {
    // If already refreshing, return the existing promise
    if (refreshPromiseRef.current) return refreshPromiseRef.current;

    const doRefresh = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.get<AuthUser>('/api/auth/me');
        setUser(response.data);
      } catch {
        // Token might be expired, try to refresh
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          try {
            const refreshResponse = await api.post<{ accessToken: string; refreshToken: string }>(
              '/api/auth/refresh',
              {
                refreshToken,
              }
            );
            localStorage.setItem('accessToken', refreshResponse.data.accessToken);
            localStorage.setItem('refreshToken', refreshResponse.data.refreshToken);
            // Retry getting user
            const userResponse = await api.get<AuthUser>('/api/auth/me');
            setUser(userResponse.data);
          } catch {
            // Refresh failed, clear tokens
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            setUser(null);
          }
        } else {
          localStorage.removeItem('accessToken');
          setUser(null);
        }
      } finally {
        setIsLoading(false);
        refreshPromiseRef.current = null;
      }
    };

    refreshPromiseRef.current = doRefresh();
    return refreshPromiseRef.current;
  }, []);

  useEffect(() => {
    if (isMounted) {
      refreshUser();
    }
  }, [isMounted, refreshUser]);

  const login = async (email: string, password: string) => {
    const response = await api.post<{ accessToken: string; refreshToken: string }>(
      '/api/auth/login',
      { email, password }
    );
    const { accessToken, refreshToken } = response.data;

    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);

    // Get full user data including permissions
    const userResponse = await api.get<AuthUser>('/api/auth/me');
    setUser(userResponse.data);
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      sessionStorage.removeItem('impersonation_token');
      setUser(null);
      // Redirect to login — full reload clears React Query cache and all client state
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export type { AuthContextType, AuthUser };

export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
