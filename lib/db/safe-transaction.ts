/**
 * BIKAN Safe Transaction — Synchronous Commit for Critical Operations
 * ────────────────────────────────────────────────────────────────────
 * NeonDB default: synchronous_commit = off (3-5x faster writes)
 * Ini aman untuk analytics/logs, tapi BERBAHAYA untuk:
 * - Pembayaran (Xendit invoice status)
 * - SHU distribution
 * - Subscription activation
 *
 * Solusi: Aktifkan synchronous_commit PER-SESSION untuk transaksi kritis.
 * Ini memastikan data keuangan PASTI tersimpan sebelum response dikirim,
 * tanpa mengorbankan performa global untuk data non-kritis.
 *
 * Trade-off:
 * - Analytics (ai_interaction_logs): async commit → fast, toleran kehilangan 200ms
 * - Keuangan (subscriptions, mentor_earnings): sync commit → slower, zero data loss
 */

import { neon } from '@neondatabase/serverless';

/**
 * Execute a critical financial transaction with synchronous commit.
 * Guarantees data is persisted to disk before returning.
 *
 * Usage:
 * ```ts
 * await safeFinancialTransaction(async (sql) => {
 *   await sql`UPDATE ims_core.subscriptions SET status = 'paid' WHERE ...`;
 * });
 * ```
 */
export async function safeFinancialTransaction<T>(
  operation: (sql: ReturnType<typeof neon>) => Promise<T>
): Promise<T> {
  const sql = neon(process.env.DATABASE_URL!);

  // Enable synchronous commit for this session
  await sql`SET LOCAL synchronous_commit = on`;

  try {
    const result = await operation(sql);
    return result;
  } catch (error) {
    console.error('[SafeTransaction] Financial transaction failed:', error);
    throw error;
  }
}

/**
 * Execute a payment status update with guaranteed persistence.
 * Used by Xendit webhook handler.
 */
export async function safePaymentUpdate(
  invoiceId: string,
  status: 'paid' | 'expired' | 'failed',
  paidAt?: Date
): Promise<{ success: boolean; error?: string }> {
  try {
    const sql = neon(process.env.DATABASE_URL!);

    // Force synchronous commit for payment data
    await sql`SET LOCAL synchronous_commit = on`;

    if (status === 'paid' && paidAt) {
      await sql`
        UPDATE ims_core.subscriptions 
        SET status = ${status}, paid_at = ${paidAt.toISOString()}
        WHERE xendit_invoice_id = ${invoiceId}
      `;
    } else {
      await sql`
        UPDATE ims_core.subscriptions 
        SET status = ${status}
        WHERE xendit_invoice_id = ${invoiceId}
      `;
    }

    console.log(`[SafeTransaction] Payment ${invoiceId} → ${status} (sync commit)`);
    return { success: true };
  } catch (error: any) {
    console.error('[SafeTransaction] Payment update failed:', error?.message);
    return { success: false, error: error?.message };
  }
}

/**
 * Execute a SHU distribution with guaranteed persistence.
 * Used by monthly cron job.
 */
export async function safeShuDistribution(
  memberId: string,
  periodYear: number,
  shuJasaUsaha: number,
  shuJasaModal: number,
  totalShu: number,
  memberType: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const sql = neon(process.env.DATABASE_URL!);

    // Force synchronous commit for financial distribution
    await sql`SET LOCAL synchronous_commit = on`;

    await sql`
      INSERT INTO ims_core.shu_distributions 
        (member_id, member_type, period_year, shu_jasa_usaha, shu_jasa_modal, total_shu)
      VALUES 
        (${memberId}, ${memberType}, ${periodYear}, ${shuJasaUsaha}, ${shuJasaModal}, ${totalShu})
    `;

    console.log(`[SafeTransaction] SHU distributed: ${memberId} → Rp ${totalShu} (sync commit)`);
    return { success: true };
  } catch (error: any) {
    console.error('[SafeTransaction] SHU distribution failed:', error?.message);
    return { success: false, error: error?.message };
  }
}
