/**
 * BIKAN Auth Context (httpOnly Cookie Session)
 * ─────────────────────────────────────────────
 * Session dikelola server-side via JWT httpOnly cookie.
 * Client hanya menyimpan user data di state (bukan localStorage).
 * Session verification dilakukan via server action.
 */

'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { registerUser, loginUser, logoutUser, getCurrentSession } from '@/app/actions/auth';

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from server cookie on mount
  useEffect(() => {
    getCurrentSession().then(({ user: sessionUser }) => {
      setUser(sessionUser);
      setIsLoading(false);
    }).catch(() => {
      setIsLoading(false);
    });
  }, []);

  const handleLogin = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const result = await loginUser(email, password);
    if (result.success && result.user) {
      setUser(result.user as User);
    }
    return { success: result.success, error: result.error };
  }, []);

  const handleRegister = useCallback(async (name: string, email: string, password: string): Promise<AuthResult> => {
    const result = await registerUser(name, email, password);
    if (result.success && result.user) {
      setUser(result.user as User);
    }
    return { success: result.success, error: result.error };
  }, []);

  const handleLogout = useCallback(async () => {
    await logoutUser();
    setUser(null);
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
