'use server';

/**
 * BIKAN Payment Server Actions (Xendit)
 * ──────────────────────────────────────
 * Virtual Account & Invoice creation for subscription payments
 * Supports: VA Bank Transfer, E-Wallet, QR Code
 *
 * Pricing (PRD):
 * - Basic: Rp 99.000/bulan (akses semua video + assessment)
 * - Premium: Rp 199.000/bulan (+ AI tutor unlimited + sertifikat)
 */

import { db } from '@/lib/db/client';
import { subscriptions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const XENDIT_SECRET = process.env.XENDIT_SECRET_KEY!;
const XENDIT_BASE_URL = 'https://api.xendit.co';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://bikan.vercel.app';

// ─── Plan Definitions ───
export const PLANS = {
  basic: {
    id: 'basic',
    name: 'BIKAN Basic',
    price: 99000,
    description: 'Akses semua video materi + assessment adaptif',
    features: ['Video micro-learning', 'Assessment IRT adaptif', 'Mastery tracking', 'Offline mode'],
  },
  premium: {
    id: 'premium',
    name: 'BIKAN Premium',
    price: 199000,
    description: 'Semua fitur Basic + AI Tutor unlimited + sertifikat',
    features: ['Semua fitur Basic', 'AI Socratic Tutor unlimited', 'Post-live automation', 'Sertifikat digital', 'Priority support'],
  },
} as const;

type PlanId = keyof typeof PLANS;

/**
 * Create Xendit Invoice for subscription payment
 */
export async function createInvoice(userId: string, userEmail: string, userName: string, planId: PlanId) {
  const plan = PLANS[planId];
  if (!plan) {
    return { success: false, error: 'Plan tidak valid' };
  }

  try {
    // Calculate expiry (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Create Xendit Invoice via API
    const response = await fetch(`${XENDIT_BASE_URL}/v2/invoices`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(XENDIT_SECRET + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        external_id: `bikan-${userId}-${Date.now()}`,
        amount: plan.price,
        payer_email: userEmail,
        description: `Langganan ${plan.name} - 1 Bulan`,
        currency: 'IDR',
        invoice_duration: 86400, // 24 hours to pay
        customer: {
          given_names: userName,
          email: userEmail,
        },
        success_redirect_url: `${APP_URL}?payment=success`,
        failure_redirect_url: `${APP_URL}?payment=failed`,
        payment_methods: ['BCA', 'BNI', 'BRI', 'MANDIRI', 'OVO', 'DANA', 'SHOPEEPAY', 'QRIS'],
        items: [{
          name: plan.name,
          quantity: 1,
          price: plan.price,
        }],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[Payment] Xendit error:', errorData);
      return { success: false, error: 'Gagal membuat invoice pembayaran' };
    }

    const invoice = await response.json();

    // Save to database
    await db.insert(subscriptions).values({
      userId,
      plan: planId,
      xenditInvoiceId: invoice.id,
      xenditPaymentUrl: invoice.invoice_url,
      amount: plan.price,
      status: 'pending',
      expiresAt,
    } as any);

    return {
      success: true,
      invoiceUrl: invoice.invoice_url,
      invoiceId: invoice.id,
      amount: plan.price,
      expiresAt: expiresAt.toISOString(),
    };
  } catch (error: any) {
    console.error('[Payment] Create invoice error:', error?.message);
    return { success: false, error: 'Terjadi kesalahan saat memproses pembayaran' };
  }
}

/**
 * Check subscription status for a user
 */
export async function getSubscriptionStatus(userId: string) {
  try {
    const [sub] = await db.select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(subscriptions.createdAt)
      .limit(1);

    if (!sub) {
      return { plan: 'free', active: false, expiresAt: null };
    }

    const now = new Date();
    const isActive = sub.status === 'paid' && new Date(sub.expiresAt) > now;

    return {
      plan: isActive ? sub.plan : 'free',
      active: isActive,
      expiresAt: sub.expiresAt?.toISOString() || null,
      invoiceUrl: sub.status === 'pending' ? sub.xenditPaymentUrl : null,
    };
  } catch (error: any) {
    console.error('[Payment] Get status error:', error?.message);
    return { plan: 'free', active: false, expiresAt: null };
  }
}
