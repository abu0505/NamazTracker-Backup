import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, createContext, useContext } from 'react';
import type { User } from '@shared/schema';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  refetchUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Always use JWT auth for local development
// In production on Replit, use the server-side detection
const isCustomAuth = true;

// Custom auth functions
const getAuthToken = () => localStorage.getItem('authToken');
const setAuthToken = (token: string) => localStorage.setItem('authToken', token);
const removeAuthToken = () => localStorage.removeItem('authToken');

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useAuthQuery() {
  const queryClient = useQueryClient();
  const [customUser, setCustomUser] = useState<User | null>(null);
  const [customLoading, setCustomLoading] = useState(true);

  // For custom JWT auth, check token and fetch user
  useEffect(() => {
    if (isCustomAuth) {
      const token = getAuthToken();
      if (token) {
        // Verify token by fetching user
        fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        .then(res => res.json())
        .then(setCustomUser)
        .catch(() => {
          removeAuthToken();
          setCustomUser(null);
        })
        .finally(() => setCustomLoading(false));
      } else {
        setCustomUser(null);
        setCustomLoading(false);
      }
    }
  }, []);

  const {
    data: sessionUser,
    isLoading: sessionLoading,
    error,
    refetch: refetchSessionUser
  } = useQuery<User | null>({
    queryKey: ['/api/auth/user'],
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !isCustomAuth, // Only run for session auth
  });

  const user = isCustomAuth ? customUser : sessionUser;
  const isLoading = isCustomAuth ? customLoading : sessionLoading;
  const isAuthenticated = !!user;

  const login = () => {
    if (isCustomAuth) {
      window.location.href = '/login';
    } else {
      window.location.href = '/api/login';
    }
  };

  const logout = () => {
    if (isCustomAuth) {
      removeAuthToken();
      setCustomUser(null);
      window.location.href = '/';
    } else {
      queryClient.clear();
      window.location.href = '/api/logout';
    }
  };

  const refetchUser = () => {
    if (isCustomAuth) {
      const token = getAuthToken();
      if (token) {
        setCustomLoading(true);
        fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        .then(res => res.json())
        .then(setCustomUser)
        .catch(() => {
          removeAuthToken();
          setCustomUser(null);
        })
        .finally(() => setCustomLoading(false));
      }
    } else {
      refetchSessionUser();
    }
  };

  return {
    user: user || null,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refetchUser,
  };
}

export { AuthContext };
export type { AuthContextType };
