import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    username: string;
    email: string;
    password: string;
    bio?: string;
    avatarUrl?: string;
  }) => Promise<void>;
  logout: () => void;
  switchUser: (userId: string) => Promise<void>;
  availableUsers: User[];
  refreshUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('blog_auth_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);

  const fetchUsers = async () => {
    try {
      const data = await api.getUsers();
      setAvailableUsers(data.users);
    } catch (err) {
      console.error('Failed to load users list:', err);
    }
  };

  useEffect(() => {
    fetchUsers();

    const initAuth = async () => {
      const savedToken = localStorage.getItem('blog_auth_token');
      if (savedToken) {
        try {
          const res = await api.getMe();
          setUser(res.user);
        } catch {
          // If token expired or invalid, auto-login with default demo author (Alex Rivera)
          localStorage.removeItem('blog_auth_token');
          setToken(null);
          setUser(null);
        }
      } else {
        // Auto sign-in as first demo persona for immediate friction-free testing
        try {
          const res = await api.login('alex@example.com', 'password123');
          localStorage.setItem('blog_auth_token', res.token);
          setToken(res.token);
          setUser(res.user);
        } catch (e) {
          console.warn('Auto demo login skipped:', e);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (emailOrUsername: string, password: string) => {
    const res = await api.login(emailOrUsername, password);
    localStorage.setItem('blog_auth_token', res.token);
    setToken(res.token);
    setUser(res.user);
    await fetchUsers();
  };

  const register = async (data: {
    name: string;
    username: string;
    email: string;
    password: string;
    bio?: string;
    avatarUrl?: string;
  }) => {
    const res = await api.register(data);
    localStorage.setItem('blog_auth_token', res.token);
    setToken(res.token);
    setUser(res.user);
    await fetchUsers();
  };

  const logout = () => {
    localStorage.removeItem('blog_auth_token');
    setToken(null);
    setUser(null);
  };

  const switchUser = async (userId: string) => {
    const targetToken = `token_${userId}`;
    localStorage.setItem('blog_auth_token', targetToken);
    setToken(targetToken);
    try {
      const res = await api.getMe();
      setUser(res.user);
    } catch (err) {
      console.error('Failed to switch user:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        switchUser,
        availableUsers,
        refreshUsers: fetchUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
