/**
 * BIKAN PostHog Analytics — Event Tracking
 * ──────────────────────────────────────────
 * Fase 3: User behavior analytics for KPI measurement
 *
 * Tracks:
 * - Activation Rate (register → first video + quiz in 24h)
 * - Day-7 Retention (return after 7 days)
 * - Mastery Speed (time to reach 90%)
 * - Feature usage (which tabs, AI interactions)
 *
 * Setup:
 * 1. npm install posthog-js
 * 2. Set NEXT_PUBLIC_POSTHOG_KEY di .env.local
 * 3. Import this in client components
 *
 * MVP: Lightweight tracker tanpa PostHog SDK.
 * Logs events ke console + localStorage buffer.
 */

// ─── Event Types ───
export type AnalyticsEvent =
  | 'user_registered'
  | 'user_logged_in'
  | 'lesson_started'
  | 'lesson_completed'
  | 'video_played'
  | 'video_completed'
  | 'quiz_started'
  | 'quiz_completed'
  | 'quiz_answer_submitted'
  | 'ai_tutor_asked'
  | 'diagnostics_used'
  | 'canvas_interacted'
  | 'mastery_achieved'
  | 'module_unlocked'
  | 'streak_recorded'
  | 'payment_initiated'
  | 'payment_completed'
  | 'certificate_generated';

interface EventPayload {
  event: AnalyticsEvent;
  properties?: Record<string, unknown>;
  userId?: string;
  timestamp: string;
  sessionId: string;
}

// ─── Session ID (persists per browser tab) ───
let sessionId: string = '';
if (typeof window !== 'undefined') {
  sessionId = sessionStorage.getItem('bikan-session-id') || `s_${Date.now().toString(36)}`;
  sessionStorage.setItem('bikan-session-id', sessionId);
}

// ─── Event buffer ───
const eventBuffer: EventPayload[] = [];
const BUFFER_KEY = 'bikan-analytics-buffer';
const MAX_BUFFER = 100;

/**
 * Track an analytics event
 */
export function track(
  event: AnalyticsEvent,
  properties?: Record<string, unknown>
): void {
  const payload: EventPayload = {
    event,
    properties,
    userId: properties?.userId as string | undefined,
    timestamp: new Date().toISOString(),
    sessionId,
  };

  eventBuffer.push(payload);
  if (eventBuffer.length > MAX_BUFFER) {
    eventBuffer.shift();
  }

  // Persist to localStorage for offline resilience
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(BUFFER_KEY, JSON.stringify(eventBuffer.slice(-MAX_BUFFER)));
    } catch {
      // Storage full — ignore
    }
  }

  // Console log in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`📊 [Analytics] ${event}`, properties || '');
  }

  // ─── PostHog SDK (uncomment when installed) ───
  // import posthog from 'posthog-js';
  // posthog.capture(event, properties);
}

/**
 * Identify user (call after login/register)
 */
export function identify(user: { id: string; name: string; email: string; role: string }): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`📊 [Analytics] identify:`, user.id, user.role);
  }

  // ─── PostHog SDK ───
  // import posthog from 'posthog-js';
  // posthog.identify(user.id, { name: user.name, email: user.email, role: user.role });
}

/**
 * Reset identity (call on logout)
 */
export function reset(): void {
  // ─── PostHog SDK ───
  // import posthog from 'posthog-js';
  // posthog.reset();
}

/**
 * Get buffered events (for dev dashboard)
 */
export function getEventBuffer(): EventPayload[] {
  return [...eventBuffer];
}

/**
 * Flush events to analytics backend
 */
export async function flushEvents(): Promise<void> {
  if (eventBuffer.length === 0) return;

  // ─── Production: POST to PostHog/custom endpoint ───
  // await fetch('/api/analytics', {
  //   method: 'POST',
  //   body: JSON.stringify(eventBuffer),
  // });

  console.log(`📊 [Analytics] Flushed ${eventBuffer.length} events`);
  eventBuffer.length = 0;

  if (typeof window !== 'undefined') {
    localStorage.removeItem(BUFFER_KEY);
  }
}

// ─── KPI Helper: Track activation funnel ───
export function trackActivation(step: 'registered' | 'first_video' | 'first_quiz', userId: string): void {
  track(step === 'registered' ? 'user_registered' : step === 'first_video' ? 'video_played' : 'quiz_started', {
    userId,
    activationStep: step,
    activationTimestamp: Date.now(),
  });
}
