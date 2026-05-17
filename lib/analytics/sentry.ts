/**
 * BIKAN Sentry Integration — Error Monitoring
 * ─────────────────────────────────────────────
 * Fase 3: Production-grade error detection & alerting
 *
 * Setup:
 * 1. npm install @sentry/nextjs
 * 2. Set NEXT_PUBLIC_SENTRY_DSN di .env.local
 * 3. Import this file di instrumentation.ts
 *
 * Untuk MVP tanpa Sentry package, file ini menyediakan
 * lightweight error reporter yang log ke console + bisa
 * di-swap ke Sentry SDK saat ready.
 */

interface ErrorReport {
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
  userId?: string;
  route?: string;
  severity: 'fatal' | 'error' | 'warning' | 'info';
  timestamp: string;
}

// ─── Error buffer (flush to Sentry/API when available) ───
const errorBuffer: ErrorReport[] = [];
const MAX_BUFFER = 50;

/**
 * Report an error to monitoring system
 */
export function captureError(
  error: Error | string,
  context?: Record<string, unknown>,
  severity: ErrorReport['severity'] = 'error'
): void {
  const report: ErrorReport = {
    message: typeof error === 'string' ? error : error.message,
    stack: typeof error === 'string' ? undefined : error.stack,
    context,
    userId: context?.userId as string | undefined,
    route: context?.route as string | undefined,
    severity,
    timestamp: new Date().toISOString(),
  };

  // Buffer for batch sending
  errorBuffer.push(report);
  if (errorBuffer.length > MAX_BUFFER) {
    errorBuffer.shift(); // Drop oldest
  }

  // Console output (always)
  const prefix = severity === 'fatal' ? '🔴' : severity === 'error' ? '🟠' : severity === 'warning' ? '🟡' : '🔵';
  console.error(`${prefix} [BIKAN ${severity.toUpperCase()}]`, report.message, context || '');

  // ─── Sentry SDK (uncomment when installed) ───
  // import * as Sentry from '@sentry/nextjs';
  // Sentry.captureException(typeof error === 'string' ? new Error(error) : error, {
  //   extra: context,
  //   level: severity,
  // });
}

/**
 * Report a message (non-error) to monitoring
 */
export function captureMessage(
  message: string,
  context?: Record<string, unknown>,
  severity: ErrorReport['severity'] = 'info'
): void {
  captureError(message, context, severity);
}

/**
 * Set user context for error reports
 */
export function setUser(user: { id: string; email: string; role: string } | null): void {
  // ─── Sentry SDK ───
  // import * as Sentry from '@sentry/nextjs';
  // if (user) Sentry.setUser({ id: user.id, email: user.email });
  // else Sentry.setUser(null);

  if (user) {
    console.log(`[Sentry] User context set: ${user.id} (${user.role})`);
  }
}

/**
 * Get buffered errors (for dev dashboard or manual flush)
 */
export function getErrorBuffer(): ErrorReport[] {
  return [...errorBuffer];
}

/**
 * Flush error buffer (call periodically or on page unload)
 */
export async function flushErrors(): Promise<void> {
  if (errorBuffer.length === 0) return;

  // ─── Production: POST to Sentry/custom endpoint ───
  // await fetch('/api/errors', {
  //   method: 'POST',
  //   body: JSON.stringify(errorBuffer),
  // });

  console.log(`[Sentry] Flushed ${errorBuffer.length} error reports`);
  errorBuffer.length = 0;
}
