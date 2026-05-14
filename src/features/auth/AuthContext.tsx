/**
 * BIKAN Auth Context
 * ──────────────────
 * React Context untuk state management autentikasi.
 * Terhubung ke NeonDB via Next.js Server Actions.
 * Session disimpan di localStorage untuk persistence antar refresh.
 */

'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { registerUser, loginUser } from '@/app/actions/auth';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthResult {
  success: boolean;
  error?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  handleLogin: (email: string, password: string) => Promise<AuthResult>;
  handleRegister: (name: string, email: string, password: string) => Promise<AuthResult>;
  handleLogout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);
const SESSION_KEY = 'bikan-auth-session';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      if (saved) {
        setUser(JSON.parse(saved));
      }
    } catch {}
    setIsLoading(false);
  }, []);

  // Persist user to localStorage
  const persistUser = (u: User | null) => {
    setUser(u);
    if (u) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(u));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  };

  const handleLogin = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const result = await loginUser(email, password);
    if (result.success && result.user) {
      persistUser(result.user as User);
    }
    return { success: result.success, error: result.error };
  }, []);

  const handleRegister = useCallback(async (name: string, email: string, password: string): Promise<AuthResult> => {
    const result = await registerUser(name, email, password);
    if (result.success && result.user) {
      persistUser(result.user as User);
    }
    return { success: result.success, error: result.error };
  }, []);

  const handleLogout = useCallback(() => {
    persistUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, handleLogin, handleRegister, handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
