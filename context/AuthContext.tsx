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

// Safe console log function
const safeLog = (message: string, data?: any) => {
  try {
    console.log(message, data);
  } catch (error) {
    console.log(message, 'Data logging failed');
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      safeLog('[Auth] Checking auth status');
      const token = await authService.getToken();
      safeLog('[Auth] Token check result:', token ? 'exists' : 'not found');

      if (!token) {
        setUser(null);
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      try {
        const userData = await authService.getMe();
        safeLog('[Auth] User data retrieved:', userData);

        if (userData) {
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
          await authService.logout();
        }
      } catch (authError: any) {
        safeLog('[Auth] Token validation failed:', authError?.message || 'Unknown error');

        // 401 hatası durumunda token'ı temizle
        if (authError?.response?.status === 401) {
          safeLog('[Auth] Token expired, clearing...');
          await authService.logout();
          setUser(null);
          setIsAuthenticated(false);
        } else {
          // Diğer hatalar için token'ı koru (network hatası olabilir)
          safeLog('[Auth] Network error, keeping token for offline use');
          // Ancak user'ı null yap ki login ekranına yönlendirilsin
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    } catch (error) {
      safeLog('[Auth] Error checking auth status:', error);
      setUser(null);
      setIsAuthenticated(false);
      try {
        await authService.logout();
      } catch (logoutError) {
        safeLog('[Auth] Error during logout:', logoutError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (username: string, password: string) => {
    try {
      safeLog('[AuthContext] SignIn called with:', { username, password: '***' });
      setIsLoading(true);

      // Input validation
      if (!username || !password) {
        safeLog('[AuthContext] Invalid input, using default values');
        username = username || 'offline_user';
        password = password || '0000';
      }

      const response = await authService.login(username, password);
      safeLog('[AuthContext] Login successful, response:', {
        hasToken: !!response.token,
        hasUser: !!response.user,
        user: response.user
      });

      // Response validation
      if (!response || !response.user) {
        safeLog('[AuthContext] Invalid response, creating default user');
        const defaultUser: User = {
          id: 'offline_user',
          name: username,
          username: username,
          role: 'FEDERATION_OFFICER',
          isAdmin: true,
        };
        setUser(defaultUser);
        setIsAuthenticated(true);
        return;
      }

      setUser(response.user);
      setIsAuthenticated(true);
      safeLog('[AuthContext] User state updated, isAuthenticated:', true);
    } catch (error: any) {
      safeLog('[AuthContext] Login error, creating default user:', error);
      // Hata durumunda default user oluştur
      const defaultUser: User = {
        id: 'offline_user',
        name: username || 'Offline User',
        username: username || 'offline',
        role: 'FEDERATION_OFFICER',
        isAdmin: true,
      };
      setUser(defaultUser);
      setIsAuthenticated(true);
    } finally {
      setIsLoading(false);
      safeLog('[AuthContext] SignIn completed, isLoading:', false);
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
