'use client';

import { AuthProvider } from '@/src/features/auth/AuthContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
