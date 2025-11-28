'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '@/lib/api';

export interface User {
  _id?: string;
  id?: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  phone?: string;
  lane?: string;
  subArea?: string;
  roleName?: string;
  plantId?: string | { _id: string; name: string };
  compliance?: number;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Load user from API on mount if token exists
  useEffect(() => {
    const loadUser = async () => {
      // Check if token exists before making API call
      if (typeof window !== 'undefined' && !localStorage.getItem('authToken')) {
        setIsLoading(false);
        return;
      }

      try {
        const userData = await api.auth.getMe();
        // Normalize user data (handle MongoDB _id)
        const normalizedUser: User = {
          ...userData,
          id: userData._id || userData.id,
        };
        setUser(normalizedUser);
      } catch (error) {
        // No valid token or user not found
        console.error('Failed to load user:', error);
        // Clear token if it exists but is invalid
        if (typeof window !== 'undefined') {
          localStorage.removeItem('authToken');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.auth.login(email, password);
      // Normalize user data
      const normalizedUser: User = {
        ...response.user,
        id: response.user._id || response.user.id,
      };
      setUser(normalizedUser);

      // Redirect based on role
      if (normalizedUser.role === 'admin') {
        router.push('/admin/insights');
      } else {
        router.push('/mobile/checklist');
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Invalid email or password' };
    }
  };

  const register = async (name: string, email: string, password: string, phone?: string) => {
    try {
      await api.auth.register({ name, email, password, phone });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Registration failed' };
    }
  };

  const logout = () => {
    setUser(null);
    api.auth.logout();
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

