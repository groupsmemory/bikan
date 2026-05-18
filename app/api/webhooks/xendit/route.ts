/**
 * BIKAN Xendit Webhook Handler (Secured)
 * ───────────────────────────────────────
 * Security: Verifies webhook callback token from Xendit
 * URL: POST /api/webhooks/xendit
 *
 * Setup di Xendit Dashboard:
 * 1. Settings → Webhooks → Add URL → https://bikan.vercel.app/api/webhooks/xendit
 * 2. Copy "Verification Token" → tambahkan ke env: XENDIT_WEBHOOK_TOKEN
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { subscriptions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { safePaymentUpdate } from '@/lib/db/safe-transaction';

const WEBHOOK_TOKEN = process.env.XENDIT_WEBHOOK_TOKEN;

export async function POST(request: NextRequest) {
  try {
    // ─── Signature Verification ───
    // Xendit sends a callback verification token in the header
    const callbackToken = request.headers.get('x-callback-token');

    if (WEBHOOK_TOKEN && callbackToken !== WEBHOOK_TOKEN) {
      console.warn('[Webhook] Invalid callback token — rejecting request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('[Webhook] Xendit notification received:', body.event || body.status);

    // ─── Validate payload ───
    const invoiceId = body.id || body.invoice_id;
    const status = body.status;

    if (!invoiceId || typeof invoiceId !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid invoice ID' }, { status: 400 });
    }

    if (!status || typeof status !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid status' }, { status: 400 });
    }

    // ─── Map Xendit status to our status ───
    let ourStatus: 'paid' | 'expired' | 'failed' = 'failed';
    if (status === 'PAID' || status === 'SETTLED') {
      ourStatus = 'paid';
    } else if (status === 'EXPIRED') {
      ourStatus = 'expired';
    }

    // ─── Update subscription with SYNCHRONOUS COMMIT (financial data) ───
    const paidAt = ourStatus === 'paid' ? new Date() : undefined;
    const updateResult = await safePaymentUpdate(invoiceId, ourStatus, paidAt);

    if (!updateResult.success) {
      console.error(`[Webhook] Safe update failed: ${updateResult.error}`);
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
    }

    console.log(`[Webhook] Subscription ${invoiceId} updated to: ${ourStatus} (sync commit)`);

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[Webhook] Error processing:', error?.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
