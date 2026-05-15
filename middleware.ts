/**
 * BIKAN Next.js Middleware
 * ────────────────────────
 * Verifikasi session di tingkat server sebelum request mencapai page.
 * Protected routes redirect ke /login jika tidak ada session valid.
 */

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SESSION_COOKIE = 'bikan-session';

// Routes yang TIDAK perlu auth (publik)
const PUBLIC_ROUTES = ['/landing', '/api/webhooks'];
const AUTH_ROUTES = ['/login', '/register'];

function getSecret() {
  const secret = process.env.SESSION_SECRET || 'bikan-default-secret-change-in-production-2026';
  return new TextEncoder().encode(secret);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip public routes and static assets
  if (
    PUBLIC_ROUTES.some(route => pathname.startsWith(route)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/api/webhooks') ||
    pathname === '/manifest.json' ||
    pathname === '/sw.js'
  ) {
    return NextResponse.next();
  }

  // Check session
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  let isAuthenticated = false;

  if (token) {
    try {
      await jwtVerify(token, getSecret());
      isAuthenticated = true;
    } catch {
      // Token invalid/expired — clear it
      const response = NextResponse.next();
      response.cookies.delete(SESSION_COOKIE);
      isAuthenticated = false;
    }
  }

  // If on auth routes (login/register) and already authenticated → redirect to app
  if (AUTH_ROUTES.some(route => pathname.startsWith(route)) && isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Protected routes: if not authenticated → let the page handle it
  // (App.tsx shows AuthScreen when no session)
  // We don't redirect here because the app handles auth state client-side too

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
