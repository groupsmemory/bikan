/**
 * BIKAN Home Page
 * ───────────────
 * Client component that renders the main app.
 * All existing UI logic lives here during migration.
 * Will be split into proper routes later.
 */

'use client';

import App from '@/src/App';
import { AuthProvider } from '@/src/features/auth/AuthContext';

export default function HomePage() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}
