'use server';

/**
 * BIKAN Auth Server Actions (Production-Ready)
 * ─────────────────────────────────────────────
 * Security features:
 * 1. bcrypt password hashing (cost factor 12)
 * 2. Input validation (length, format)
 * 3. Rate limiting (in-memory, per IP simulation)
 * 4. Timing-safe comparison
 * 5. No sensitive data in error messages
 */

import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = 12;

// ─── Input Validation ───
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

function validatePassword(password: string): string | null {
  if (password.length < 6) return 'Password minimal 6 karakter';
  if (password.length > 128) return 'Password terlalu panjang';
  return null;
}

function validateName(name: string): string | null {
  if (name.trim().length < 2) return 'Nama minimal 2 karakter';
  if (name.length > 255) return 'Nama terlalu panjang';
  return null;
}

// ─── Simple Rate Limiting (in-memory) ───
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;       // Max attempts
const RATE_LIMIT_WINDOW = 60000; // 1 minute window

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true; // Allowed
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false; // Blocked
  }

  entry.count++;
  return true; // Allowed
}

// ─── Register ───
export async function registerUser(name: string, email: string, password: string) {
  // Rate limit check
  if (!checkRateLimit(`register:${email}`)) {
    return { success: false, error: 'Terlalu banyak percobaan. Coba lagi dalam 1 menit.' };
  }

  // Input validation
  const nameError = validateName(name);
  if (nameError) return { success: false, error: nameError };

  if (!validateEmail(email)) {
    return { success: false, error: 'Format email tidak valid' };
  }

  const passwordError = validatePassword(password);
  if (passwordError) return { success: false, error: passwordError };

  try {
    // Check if email already exists
    const existing = await db.select({ id: users.id })
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1);

    if (existing.length > 0) {
      return { success: false, error: 'Email sudah terdaftar' };
    }

    // Hash password with bcrypt
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const [newUser] = await db.insert(users).values({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
    } as any).returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    });

    return { success: true, user: newUser };
  } catch (error: any) {
    console.error('[Auth] Register error:', error?.message);
    return { success: false, error: 'Terjadi kesalahan. Silakan coba lagi.' };
  }
}

// ─── Login ───
export async function loginUser(email: string, password: string) {
  // Rate limit check
  if (!checkRateLimit(`login:${email}`)) {
    return { success: false, error: 'Terlalu banyak percobaan. Coba lagi dalam 1 menit.' };
  }

  // Input validation
  if (!validateEmail(email) || !password) {
    return { success: false, error: 'Email dan password wajib diisi' };
  }

  try {
    const [found] = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      passwordHash: users.passwordHash,
    })
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1);

    if (!found) {
      // Timing-safe: still hash to prevent timing attacks
      await bcrypt.hash(password, BCRYPT_ROUNDS);
      return { success: false, error: 'Email atau password salah' };
    }

    // Compare password with bcrypt (timing-safe internally)
    const isValid = await bcrypt.compare(password, found.passwordHash);

    if (!isValid) {
      return { success: false, error: 'Email atau password salah' };
    }

    return {
      success: true,
      user: {
        id: found.id,
        name: found.name,
        email: found.email,
        role: found.role,
      },
    };
  } catch (error: any) {
    console.error('[Auth] Login error:', error?.message);
    return { success: false, error: 'Terjadi kesalahan. Silakan coba lagi.' };
  }
}
