/**
 * BIKAN SHU Cron Job — Monthly Automation
 * ─────────────────────────────────────────
 * Route: /api/cron/shu
 * Method: POST (with secret header for auth)
 *
 * Triggered monthly by:
 * - Vercel Cron (vercel.json)
 * - External cron service (cron-job.org, free)
 * - Manual trigger from admin dashboard
 *
 * What it does:
 * 1. Calculate platform revenue for current month
 * 2. Distribute SHU to all eligible members
 * 3. Log results
 */

import { NextRequest, NextResponse } from 'next/server';
import { calculateAnnualShu, recordMentorEarning } from '@/app/actions/shu';

// Secret for cron authentication (prevent unauthorized triggers)
const CRON_SECRET = process.env.CRON_SECRET || process.env.SESSION_SECRET || '';

export async function POST(request: NextRequest) {
  // ─── Auth: Verify cron secret ───
  const authHeader = request.headers.get('authorization');
  const cronSecret = request.headers.get('x-cron-secret');

  if (cronSecret !== CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    console.log(`[SHU Cron] Running for ${year}-${month.toString().padStart(2, '0')}`);

    // Calculate and distribute SHU
    const result = await calculateAnnualShu(year);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, timestamp: now.toISOString() },
        { status: 500 }
      );
    }

    const response = {
      success: true,
      timestamp: now.toISOString(),
      period: `${year}-${month.toString().padStart(2, '0')}`,
      totalNetProfit: result.totalNetProfit,
      distributionsCount: result.distributions?.length ?? 0,
      distributions: result.distributions?.map(d => ({
        member: d.memberName,
        type: d.memberType,
        shuJasaUsaha: d.shuJasaUsaha,
        shuJasaModal: d.shuJasaModal,
        total: d.totalShu,
      })),
    };

    console.log('[SHU Cron] Complete:', JSON.stringify(response, null, 2));

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('[SHU Cron] Error:', error?.message);
    return NextResponse.json(
      { error: error?.message || 'Internal error', timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}

// GET: Health check
export async function GET() {
  return NextResponse.json({
    service: 'BIKAN SHU Cron',
    status: 'ready',
    nextRun: 'Monthly (1st of each month)',
    timestamp: new Date().toISOString(),
  });
}
