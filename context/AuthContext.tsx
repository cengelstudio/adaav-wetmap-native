import { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/api';
import { User } from '../types';

type AuthContextType = {
  user: User | null;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await authService.getToken();
      console.log('[Auth] Checking auth status, token:', token ? 'exists' : 'not found');
      if (token) {
        const userData = await authService.getMe();
        console.log('[Auth] User data retrieved:', userData);
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('[Auth] Error checking auth status:', error);
      setUser(null);
      // Token geçersizse veya hata varsa token'ı temizle
      await authService.logout();
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (username: string, password: string) => {
    try {
      const response = await authService.login(username, password);
      console.log('[Auth] Login successful, token:', response.token ? 'received' : 'not received');
      setUser(response.user);
    } catch (error) {
      console.error('[Auth] Login error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        signIn,
        signOut,
        isLoading,
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
