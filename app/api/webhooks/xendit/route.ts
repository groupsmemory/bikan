/**
 * BIKAN Xendit Webhook Handler
 * ─────────────────────────────
 * Menerima notifikasi pembayaran dari Xendit
 * URL: POST /api/webhooks/xendit
 *
 * Setup di Xendit Dashboard:
 * Settings → Webhooks → Add URL → https://bikan.vercel.app/api/webhooks/xendit
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { subscriptions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('[Webhook] Xendit notification received:', body.event || body.status);

    // Xendit sends invoice callbacks with these statuses
    const invoiceId = body.id || body.invoice_id;
    const status = body.status;

    if (!invoiceId) {
      return NextResponse.json({ error: 'Missing invoice ID' }, { status: 400 });
    }

    // Map Xendit status to our status
    let ourStatus: 'paid' | 'expired' | 'failed' = 'failed';
    if (status === 'PAID' || status === 'SETTLED') {
      ourStatus = 'paid';
    } else if (status === 'EXPIRED') {
      ourStatus = 'expired';
    }

    // Update subscription in database
    const updateData: any = { status: ourStatus };
    if (ourStatus === 'paid') {
      updateData.paidAt = new Date();
    }

    await db.update(subscriptions)
      .set(updateData)
      .where(eq(subscriptions.xenditInvoiceId, invoiceId));

    console.log(`[Webhook] Subscription ${invoiceId} updated to: ${ourStatus}`);

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[Webhook] Error processing:', error?.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
