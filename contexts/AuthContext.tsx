'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { User, authenticate, getUserById } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Load user from sessionStorage on mount
  useEffect(() => {
    const storedUserId = sessionStorage.getItem('userId');
    if (storedUserId) {
      const userId = parseInt(storedUserId, 10);
      const userData = getUserById(userId);
      if (userData) {
        setUser(userData);
      } else {
        sessionStorage.removeItem('userId');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const authenticatedUser = authenticate(email, password);
    
    if (!authenticatedUser) {
      return { success: false, error: 'Invalid email or password' };
    }

    setUser(authenticatedUser);
    sessionStorage.setItem('userId', authenticatedUser.id.toString());

    // Redirect based on role
    if (authenticatedUser.role === 'admin') {
      router.push('/admin/insights');
    } else {
      router.push('/mobile/checklist');
    }

    return { success: true };
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('userId');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
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

