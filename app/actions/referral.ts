'use server';

/**
 * BIKAN Referral System
 * ─────────────────────
 * Invite teman → kedua pihak dapat 7 hari Premium gratis
 * Referral code = user ID prefix (simple, unique)
 */

import { db } from '@/lib/db/client';
import { users, subscriptions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Generate referral code from user ID
 */
export function generateReferralCode(userId: string): string {
  return `BIKAN-${userId.slice(0, 8).toUpperCase()}`;
}

/**
 * Apply referral code — gives both referrer and referee 7 days Premium
 */
export async function applyReferralCode(newUserId: string, referralCode: string) {
  try {
    // Extract referrer ID from code
    const referrerIdPrefix = referralCode.replace('BIKAN-', '').toLowerCase();

    // Find referrer
    const allUsers = await db.select({ id: users.id })
      .from(users);

    const referrer = allUsers.find(u => u.id.startsWith(referrerIdPrefix));

    if (!referrer) {
      return { success: false, error: 'Kode referral tidak valid' };
    }

    if (referrer.id === newUserId) {
      return { success: false, error: 'Tidak bisa menggunakan kode sendiri' };
    }

    // Give 7 days Premium to both
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Referee (new user) gets trial
    await db.insert(subscriptions).values({
      userId: newUserId,
      plan: 'premium',
      amount: 0,
      status: 'paid',
      paidAt: new Date(),
      expiresAt,
    } as any);

    // Referrer gets extension
    await db.insert(subscriptions).values({
      userId: referrer.id,
      plan: 'premium',
      amount: 0,
      status: 'paid',
      paidAt: new Date(),
      expiresAt,
    } as any);

    return { success: true, message: 'Selamat! Anda dan teman mendapat 7 hari Premium gratis.' };
  } catch (error: any) {
    console.error('[Referral] Error:', error?.message);
    return { success: false, error: 'Gagal memproses kode referral' };
  }
}

/**
 * Activate 7-day free trial for new user (no referral needed)
 */
export async function activateFreeTrial(userId: string) {
  try {
    // Check if user already had a trial
    const existing = await db.select({ id: subscriptions.id })
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    if (existing.length > 0) {
      return { success: false, error: 'Anda sudah pernah menggunakan free trial' };
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await db.insert(subscriptions).values({
      userId,
      plan: 'premium',
      amount: 0,
      status: 'paid',
      paidAt: new Date(),
      expiresAt,
    } as any);

    return { success: true, message: '7 hari Premium gratis telah diaktifkan!' };
  } catch (error: any) {
    console.error('[Trial] Error:', error?.message);
    return { success: false, error: 'Gagal mengaktifkan free trial' };
  }
}
