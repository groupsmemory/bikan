'use client';

import { AuthProvider } from '@/src/features/auth/AuthContext';

export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
