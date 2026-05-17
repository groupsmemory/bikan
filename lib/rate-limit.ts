/**
 * BIKAN Rate Limiter — Upstash Redis
 * ────────────────────────────────────
 * Production-grade rate limiting via Upstash Redis (serverless).
 * Works across multiple Vercel instances (shared state).
 *
 * Tiers:
 * - API general: 60 req/min per IP
 * - Auth (login/register): 5 req/min per IP
 * - AI Tutor: 15 req/min per user (matches Gemini Free Tier)
 * - Webhook: 100 req/min (Xendit callbacks)
 *
 * Setup:
 * 1. Create Redis database at console.upstash.com
 * 2. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env.local
 *
 * Fallback: If Redis unavailable, falls back to permissive (no blocking).
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// ─── Redis Client ───
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// ─── Rate Limit Tiers ───

/** General API: 60 requests per 1 minute per IP */
export const generalLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, '1 m'),
  prefix: 'bikan:rl:general',
  analytics: true,
});

/** Auth endpoints: 5 requests per 1 minute per IP */
export const authLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  prefix: 'bikan:rl:auth',
  analytics: true,
});

/** AI Tutor: 15 requests per 1 minute per user (Gemini Free Tier limit) */
export const aiLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(15, '1 m'),
  prefix: 'bikan:rl:ai',
  analytics: true,
});

/** Daily AI limit: 1500 requests per day per deployment */
export const aiDailyLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(1500, '1 d'),
  prefix: 'bikan:rl:ai-daily',
  analytics: true,
});

/** Webhook: 100 requests per 1 minute (Xendit callbacks) */
export const webhookLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  prefix: 'bikan:rl:webhook',
  analytics: true,
});

// ─── Helper: Check rate limit with fallback ───

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Check rate limit with graceful fallback.
 * If Redis is unavailable, allows the request (fail-open).
 */
export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<RateLimitResult> {
  // Skip if Redis not configured
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return { success: true, limit: 0, remaining: 0, reset: 0 };
  }

  try {
    const result = await limiter.limit(identifier);
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (error) {
    // Fail-open: if Redis is down, don't block users
    console.error('[RateLimit] Redis error, failing open:', error);
    return { success: true, limit: 0, remaining: 0, reset: 0 };
  }
}

/**
 * Get client IP from request headers (works behind Vercel proxy)
 */
export function getClientIP(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    'unknown'
  );
}
