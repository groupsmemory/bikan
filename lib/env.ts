/**
 * BIKAN Environment Validation — Crash Early
 * ────────────────────────────────────────────
 * Validates all required environment variables at boot time.
 * If any are missing, the app crashes immediately with a clear error
 * instead of failing silently at runtime when a feature is used.
 *
 * Usage: import '@/lib/env' at the top of layout.tsx or instrumentation.ts
 */

// ─── Required Server-Side Variables ───
const REQUIRED_SERVER_VARS = [
  { key: 'DATABASE_URL', description: 'NeonDB PostgreSQL connection string' },
  { key: 'GEMINI_API_KEY', description: 'Google AI Studio API key' },
  { key: 'SESSION_SECRET', description: 'JWT signing secret (min 32 chars)' },
] as const;

// ─── Optional Server-Side Variables (warn if missing) ───
const OPTIONAL_SERVER_VARS = [
  { key: 'XENDIT_SECRET_KEY', description: 'Xendit payment gateway key' },
  { key: 'XENDIT_WEBHOOK_TOKEN', description: 'Xendit webhook verification token' },
] as const;

// ─── Required Client-Side Variables ───
const REQUIRED_CLIENT_VARS = [
  { key: 'NEXT_PUBLIC_APP_URL', description: 'Application base URL' },
] as const;

// ─── Validation Logic ───
function validateEnv(): void {
  // Skip validation during build time (env vars may not be available)
  if (process.env.NODE_ENV === 'test') return;

  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required server vars
  for (const { key, description } of REQUIRED_SERVER_VARS) {
    const value = process.env[key];
    if (!value || value.trim() === '' || value.includes('your_') || value.includes('_here')) {
      errors.push(`  ❌ ${key} — ${description}`);
    }
  }

  // Check SESSION_SECRET strength
  const sessionSecret = process.env.SESSION_SECRET;
  if (sessionSecret && sessionSecret.length < 32) {
    errors.push(`  ❌ SESSION_SECRET — Must be at least 32 characters (current: ${sessionSecret.length})`);
  }
  if (sessionSecret?.includes('default') || sessionSecret?.includes('change-this')) {
    warnings.push(`  ⚠️  SESSION_SECRET — Using default/placeholder value. Change for production!`);
  }

  // Check optional server vars
  for (const { key, description } of OPTIONAL_SERVER_VARS) {
    const value = process.env[key];
    if (!value || value.trim() === '') {
      warnings.push(`  ⚠️  ${key} — ${description} (optional, payment features disabled)`);
    }
  }

  // Check required client vars
  for (const { key, description } of REQUIRED_CLIENT_VARS) {
    const value = process.env[key];
    if (!value || value.trim() === '') {
      warnings.push(`  ⚠️  ${key} — ${description}`);
    }
  }

  // Validate DATABASE_URL format
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl && !dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://')) {
    errors.push(`  ❌ DATABASE_URL — Must start with postgresql:// or postgres://`);
  }

  // Output warnings
  if (warnings.length > 0) {
    console.warn('\n⚠️  BIKAN Environment Warnings:');
    console.warn(warnings.join('\n'));
    console.warn('');
  }

  // Crash on errors
  if (errors.length > 0) {
    const message = [
      '',
      '╔══════════════════════════════════════════════════════════╗',
      '║  BIKAN FATAL: Missing Required Environment Variables    ║',
      '╚══════════════════════════════════════════════════════════╝',
      '',
      ...errors,
      '',
      '  Fix: Copy .env.example to .env.local and fill in values.',
      '  Docs: See docs/ROADMAP.md for setup instructions.',
      '',
    ].join('\n');

    console.error(message);

    // In production, crash hard. In development, just warn loudly.
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required environment variables:\n${errors.join('\n')}`);
    }
  }
}

// ─── Run validation on import ───
validateEnv();

// ─── Typed env access (for use in other files) ───
export const env = {
  DATABASE_URL: process.env.DATABASE_URL!,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY!,
  SESSION_SECRET: process.env.SESSION_SECRET!,
  XENDIT_SECRET_KEY: process.env.XENDIT_SECRET_KEY ?? '',
  XENDIT_WEBHOOK_TOKEN: process.env.XENDIT_WEBHOOK_TOKEN ?? '',
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  NEXT_PUBLIC_USE_LOCAL_VIDEOS: process.env.NEXT_PUBLIC_USE_LOCAL_VIDEOS === 'true',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
} as const;
