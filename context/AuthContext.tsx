// context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  getTokens, getUserData, getCurrentUser,
  logoutUser, isTokenValid, refreshAccessToken,
} from '@/services/auth.service';
import { useAuthStore } from '@/store/authStore';
import { securityManager } from '@/utils/security';
import { Config } from '@/utils/Config';
import { router } from 'expo-router';

interface AuthContextType {
  isLoading: boolean;
  user: any;
  isAuthenticated: boolean;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setAuth, setLoading, user, isAuthenticated, isLoading } = useAuthStore();
  const [localLoading, setLocalLoading] = useState(true);

  const checkAuth = async () => {
    try {
      setLocalLoading(true);
      setLoading(true);

      // Security check on auth (only in production)
      if (!Config.isDev) {
        const isCompromised = await securityManager.blockIfCompromised();
        if (isCompromised) {
          console.warn('[Auth] Device compromised - logging out');
          await logoutUser();
          setAuth(null, null);
          router.replace('/(auth)/login');
          return;
        }
      }

      const { accessToken, refreshToken } = await getTokens();

      if (!accessToken && !refreshToken) {
        setAuth(null, null);
        return;
      }

      const tokenValid = await isTokenValid();

      if (!tokenValid) {
        console.log('Token expired — attempting refresh...');
        const refreshed = await refreshAccessToken();

        if (!refreshed) {
          console.log('Refresh failed — logging out');
          await logoutUser();
          setAuth(null, null);
          router.replace('/(auth)/login');
          return;
        }

        console.log('✅ Token refreshed — continuing session');
      }

      let userData = await getUserData();

      if (!userData) {
        try {
          userData = await getCurrentUser();
        } catch {
          await logoutUser();
          setAuth(null, null);
          router.replace('/(auth)/login');
          return;
        }
      }

      const { accessToken: currentToken } = await getTokens();
      setAuth(userData, currentToken);

    } catch (error) {
      console.error('Auth check error:', error);
      setAuth(null, null);
      await logoutUser();
      router.replace('/(auth)/login');
    } finally {
      setLocalLoading(false);
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await logoutUser();
      setAuth(null, null);
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{
      isLoading: localLoading || isLoading,
      user,
      isAuthenticated,
      checkAuth,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};