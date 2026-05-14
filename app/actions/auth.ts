'use server';

/**
 * BIKAN Auth Server Actions
 * ─────────────────────────
 * Server-side authentication connected to NeonDB (ims_core.users)
 * These will replace the localStorage mock in auth-service.ts
 * when the migration is complete.
 */

import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Note: In production, use bcrypt or argon2 for password hashing.
// For MVP, we use a simple hash function. Replace before launch.
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'bikan-salt-2026');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function registerUser(name: string, email: string, password: string) {
  console.log('[Auth] Register attempt:', { name, email });
  
  try {
    // Check if email already exists
    console.log('[Auth] Checking existing user...');
    const existing = await db.select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    console.log('[Auth] Existing check result:', existing);

    if (existing.length > 0) {
      return { success: false, error: 'Email sudah terdaftar' };
    }

    const passwordHash = await hashPassword(password);
    console.log('[Auth] Inserting new user...');

    const [newUser] = await db.insert(users).values({
      name,
      email,
      passwordHash,
      role: 'student',
    }).returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    });

    console.log('[Auth] User created:', newUser);
    return { success: true, user: newUser };
  } catch (error: any) {
    console.error('[Auth] Register error:', error?.message || error);
    console.error('[Auth] Full error:', JSON.stringify(error, null, 2));
    return { success: false, error: `DB Error: ${error?.message || 'Unknown'}` };
  }
}

export async function loginUser(email: string, password: string) {
  try {
    const passwordHash = await hashPassword(password);

    const [found] = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      passwordHash: users.passwordHash,
    })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!found || found.passwordHash !== passwordHash) {
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
    console.error('[Auth] Login error:', error);
    return { success: false, error: 'Terjadi kesalahan saat login' };
  }
}
