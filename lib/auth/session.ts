/**
 * BIKAN Session Management
 * ─────────────────────────
 * httpOnly cookie + JWT (jose)
 * - Token signed with secret, expires in 7 days
 * - Cookie: httpOnly, secure, sameSite strict
 * - Works in Edge Runtime (Next.js middleware compatible)
 */

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'bikan-session';
const SESSION_EXPIRY = 7 * 24 * 60 * 60; // 7 days in seconds

// Secret key for JWT signing (must be at least 32 chars)
function getSecret() {
  const secret = process.env.SESSION_SECRET || 'bikan-default-secret-change-in-production-2026';
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  userId: string;
  name: string;
  email: string;
  role: string;
}

/**
 * Create a signed JWT and set it as httpOnly cookie
 */
export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_EXPIRY}s`)
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_EXPIRY,
    path: '/',
  });
}

/**
 * Read and verify session from cookie
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as SessionPayload;
  } catch {
    // Token expired or invalid
    return null;
  }
}

/**
 * Destroy session (logout)
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/**
 * Verify token without cookies (for middleware)
 */
export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
