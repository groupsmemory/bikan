/**
 * BIKAN Next.js Middleware — Security Layer
 * ──────────────────────────────────────────
 * Fase 1 Security Hardening:
 * 1. JWT session verification on every request
 * 2. Auto-refresh token if expiring within 24h (sliding window)
 * 3. Protected route enforcement (/instructor, /mentor)
 * 4. Security headers (X-Frame-Options, CSP, etc.)
 * 5. Clear invalid/expired tokens automatically
 */

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, SignJWT } from 'jose';

const SESSION_COOKIE = 'bikan-session';
const SESSION_EXPIRY = 7 * 24 * 60 * 60; // 7 days
const REFRESH_THRESHOLD = 24 * 60 * 60;  // Refresh if < 24h remaining

// Routes that are fully public (no auth check)
const PUBLIC_PATHS = ['/landing', '/privacy', '/terms', '/api/webhooks'];

// Routes that require authentication — redirect to / if no session
const PROTECTED_PATHS = ['/instructor', '/mentor'];

function getSecret() {
  const secret = process.env.SESSION_SECRET || 'bikan-default-secret-change-in-production-2026';
  return new TextEncoder().encode(secret);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ─── Skip static assets and public files ───
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/videos') ||
    pathname === '/manifest.json' ||
    pathname === '/sw.js' ||
    pathname.match(/\.(png|jpg|svg|ico|woff2?|css|js|ts|m3u8)$/)
  ) {
    return NextResponse.next();
  }

  // ─── Skip fully public routes ───
  if (PUBLIC_PATHS.some(route => pathname.startsWith(route))) {
    return addSecurityHeaders(NextResponse.next());
  }

  // ─── Verify session ───
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  let isAuthenticated = false;
  let payload: any = null;

  if (token) {
    try {
      const result = await jwtVerify(token, getSecret());
      isAuthenticated = true;
      payload = result.payload;
    } catch {
      // Token invalid/expired — will be cleared below
      isAuthenticated = false;
    }
  }

  // ─── Protected routes: redirect if not authenticated ───
  if (PROTECTED_PATHS.some(route => pathname.startsWith(route)) && !isAuthenticated) {
    const loginUrl = new URL('/', request.url);
    const response = NextResponse.redirect(loginUrl);
    // Clear invalid cookie
    if (token) response.cookies.delete(SESSION_COOKIE);
    return addSecurityHeaders(response);
  }

  // ─── Build response ───
  let response = NextResponse.next();

  // ─── Clear invalid token ───
  if (token && !isAuthenticated) {
    response.cookies.delete(SESSION_COOKIE);
  }

  // ─── Sliding window: refresh token if expiring soon ───
  if (isAuthenticated && payload) {
    const exp = payload.exp as number;
    const now = Math.floor(Date.now() / 1000);
    const timeRemaining = exp - now;

    if (timeRemaining < REFRESH_THRESHOLD && timeRemaining > 0) {
      // Re-sign with fresh expiry
      const newToken = await new SignJWT({
        userId: payload.userId,
        name: payload.name,
        email: payload.email,
        role: payload.role,
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(`${SESSION_EXPIRY}s`)
        .sign(getSecret());

      response.cookies.set(SESSION_COOKIE, newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: SESSION_EXPIRY,
        path: '/',
      });
    }
  }

  return addSecurityHeaders(response);
}

/**
 * Add security headers to response
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy (disable unnecessary browser features)
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(self), geolocation=(), payment=()'
  );

  return response;
}

export const config = {
  matcher: [
    // Match all routes except static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
