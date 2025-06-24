import { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/api';
import { User } from '../types';

type AuthContextType = {
  user: User | null;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await authService.getToken();
      console.log('[Auth] Checking auth status, token:', token ? 'exists' : 'not found');

      if (!token) {
        setUser(null);
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      try {
        const userData = await authService.getMe();
        console.log('[Auth] User data retrieved:', userData);

        if (userData) {
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
          await authService.logout();
        }
      } catch (authError: any) {
        console.error('[Auth] Token validation failed:', authError);

        // 401 hatası durumunda token'ı temizle
        if (authError?.response?.status === 401) {
          console.log('[Auth] Token expired, clearing...');
          await authService.logout();
          setUser(null);
          setIsAuthenticated(false);
        } else {
          // Diğer hatalar için token'ı koru (network hatası olabilir)
          console.log('[Auth] Network error, keeping token for offline use');
          // Ancak user'ı null yap ki login ekranına yönlendirilsin
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    } catch (error) {
      console.error('[Auth] Error checking auth status:', error);
      setUser(null);
      setIsAuthenticated(false);
      await authService.logout();
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await authService.login(username, password);
      console.log('[Auth] Login successful, token:', response.token ? 'received' : 'not received');
      setUser(response.user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('[Auth] Login error:', error);
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error signing out:', error);
      // Hata olsa bile local state'i temizle
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        signIn,
        signOut,
        isLoading,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
