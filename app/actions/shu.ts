'use server';

/**
 * BIKAN SHU (Sisa Hasil Usaha) & Mentor Revenue System
 * ─────────────────────────────────────────────────────
 * Permenkop No. 8 Tahun 2021, Pasal 14:
 * - SHU Jasa Usaha: berdasarkan kontribusi ekonomi langsung
 * - SHU Jasa Modal: berdasarkan modal penyertaan koperasi
 * - Platform fee maksimal 15% (rabat transaksi)
 * - Mentor bisa konversi honorarium → modal penyertaan
 *
 * Formula SHU per PRD:
 * SHU_member = SHU_jasa_usaha + SHU_jasa_modal
 * SHU_jasa_usaha = (transaksi_member / total_transaksi) × alokasi_jasa_usaha
 * SHU_jasa_modal = (modal_member / total_modal) × alokasi_jasa_modal
 */

import { db } from '@/lib/db/client';
import { mentorEarnings, shuDistributions, users } from '@/lib/db/schema';
import { eq, and, sql, sum } from 'drizzle-orm';

const PLATFORM_FEE_PERCENT = 15; // Max 15% per PRD
const SHU_JASA_USAHA_ALLOCATION = 0.45; // 45% of net profit goes to jasa usaha
const SHU_JASA_MODAL_ALLOCATION = 0.25; // 25% of net profit goes to jasa modal
// Remaining 30%: cadangan koperasi (20%) + dana pendidikan (10%)

// ─── Record Mentor Earning ───

export async function recordMentorEarning(data: {
  mentorId: string;
  sourceType: 'course_sale' | 'live_class' | 'referral_bonus';
  sourceId?: string;
  grossAmount: number;
  periodMonth: number;
  periodYear: number;
}) {
  try {
    const platformFee = Math.round(data.grossAmount * (PLATFORM_FEE_PERCENT / 100));
    const netAmount = data.grossAmount - platformFee;

    await db.insert(mentorEarnings).values({
      mentorId: data.mentorId,
      sourceType: data.sourceType,
      sourceId: data.sourceId || null,
      grossAmount: data.grossAmount,
      platformFee,
      netAmount,
      status: 'pending',
      periodMonth: data.periodMonth,
      periodYear: data.periodYear,
    } as any);

    return { success: true, netAmount, platformFee };
  } catch (error: any) {
    console.error('[SHU] Record earning error:', error?.message);
    return { success: false, error: error?.message };
  }
}

// ─── Get Mentor Earnings Summary ───

export interface MentorEarningSummary {
  totalGross: number;
  totalNet: number;
  totalPlatformFee: number;
  totalConverted: number;
  pendingPayout: number;
  earningsByType: { type: string; amount: number }[];
}

export async function getMentorEarnings(mentorId: string, year?: number): Promise<MentorEarningSummary> {
  try {
    const targetYear = year || new Date().getFullYear();

    const earnings = await db.select()
      .from(mentorEarnings)
      .where(
        and(
          eq(mentorEarnings.mentorId, mentorId),
          eq(mentorEarnings.periodYear, targetYear)
        )
      );

    const totalGross = earnings.reduce((sum, e) => sum + e.grossAmount, 0);
    const totalNet = earnings.reduce((sum, e) => sum + e.netAmount, 0);
    const totalPlatformFee = earnings.reduce((sum, e) => sum + e.platformFee, 0);
    const totalConverted = earnings.reduce((sum, e) => sum + e.convertedToCapital, 0);
    const pendingPayout = earnings
      .filter(e => e.status === 'pending')
      .reduce((sum, e) => sum + e.netAmount, 0);

    // Group by source type
    const byType = new Map<string, number>();
    for (const e of earnings) {
      byType.set(e.sourceType, (byType.get(e.sourceType) || 0) + e.netAmount);
    }

    return {
      totalGross,
      totalNet,
      totalPlatformFee,
      totalConverted,
      pendingPayout,
      earningsByType: Array.from(byType.entries()).map(([type, amount]) => ({ type, amount })),
    };
  } catch (error: any) {
    console.error('[SHU] Get earnings error:', error?.message);
    return { totalGross: 0, totalNet: 0, totalPlatformFee: 0, totalConverted: 0, pendingPayout: 0, earningsByType: [] };
  }
}

// ─── Convert Honorarium to Koperasi Capital ───

export async function convertToCapital(mentorId: string, earningId: string, amount: number) {
  try {
    // Update earning record
    await db.update(mentorEarnings)
      .set({ convertedToCapital: amount, status: 'converted' } as any)
      .where(
        and(
          eq(mentorEarnings.id, earningId),
          eq(mentorEarnings.mentorId, mentorId)
        )
      );

    return { success: true, message: `Rp ${amount.toLocaleString('id-ID')} dikonversi ke modal penyertaan koperasi.` };
  } catch (error: any) {
    console.error('[SHU] Convert to capital error:', error?.message);
    return { success: false, error: error?.message };
  }
}

// ─── Calculate Annual SHU Distribution ───

export interface ShuCalculation {
  memberId: string;
  memberName: string;
  memberType: string;
  transactionVolume: number;
  capitalContribution: number;
  shuJasaUsaha: number;
  shuJasaModal: number;
  totalShu: number;
}

export async function calculateAnnualShu(year: number): Promise<{
  success: boolean;
  totalNetProfit?: number;
  distributions?: ShuCalculation[];
  error?: string;
}> {
  try {
    // 1. Calculate total net profit for the year
    const [profitResult] = await db.select({
      totalNet: sql<number>`COALESCE(SUM(${mentorEarnings.platformFee}), 0)`,
    })
      .from(mentorEarnings)
      .where(eq(mentorEarnings.periodYear, year));

    const totalNetProfit = profitResult?.totalNet ?? 0;

    if (totalNetProfit === 0) {
      return { success: true, totalNetProfit: 0, distributions: [] };
    }

    // 2. Calculate each member's transaction volume (jasa usaha)
    const memberTransactions = await db.select({
      mentorId: mentorEarnings.mentorId,
      totalTransaction: sql<number>`SUM(${mentorEarnings.grossAmount})`,
    })
      .from(mentorEarnings)
      .where(eq(mentorEarnings.periodYear, year))
      .groupBy(mentorEarnings.mentorId);

    const totalTransactions = memberTransactions.reduce((s, m) => s + (m.totalTransaction || 0), 0);

    // 3. Calculate each member's capital contribution (jasa modal)
    const memberCapital = await db.select({
      mentorId: mentorEarnings.mentorId,
      totalCapital: sql<number>`SUM(${mentorEarnings.convertedToCapital})`,
    })
      .from(mentorEarnings)
      .where(eq(mentorEarnings.periodYear, year))
      .groupBy(mentorEarnings.mentorId);

    const totalCapital = memberCapital.reduce((s, m) => s + (m.totalCapital || 0), 0);

    // 4. Allocate SHU
    const jasaUsahaPool = Math.round(totalNetProfit * SHU_JASA_USAHA_ALLOCATION);
    const jasaModalPool = Math.round(totalNetProfit * SHU_JASA_MODAL_ALLOCATION);

    // 5. Calculate per-member distribution
    const distributions: ShuCalculation[] = [];

    for (const mt of memberTransactions) {
      const transactionRatio = totalTransactions > 0 ? (mt.totalTransaction || 0) / totalTransactions : 0;
      const capitalRecord = memberCapital.find(mc => mc.mentorId === mt.mentorId);
      const capitalRatio = totalCapital > 0 ? ((capitalRecord?.totalCapital || 0) / totalCapital) : 0;

      const shuJasaUsaha = Math.round(jasaUsahaPool * transactionRatio);
      const shuJasaModal = Math.round(jasaModalPool * capitalRatio);

      // Get member name
      const [member] = await db.select({ name: users.name, role: users.role })
        .from(users)
        .where(eq(users.id, mt.mentorId))
        .limit(1);

      distributions.push({
        memberId: mt.mentorId,
        memberName: member?.name || 'Unknown',
        memberType: member?.role === 'instructor' ? 'producer' : 'founder',
        transactionVolume: mt.totalTransaction || 0,
        capitalContribution: capitalRecord?.totalCapital || 0,
        shuJasaUsaha,
        shuJasaModal,
        totalShu: shuJasaUsaha + shuJasaModal,
      });
    }

    // 6. Persist distributions
    for (const dist of distributions) {
      await db.insert(shuDistributions).values({
        memberId: dist.memberId,
        memberType: dist.memberType,
        periodYear: year,
        shuJasaUsaha: dist.shuJasaUsaha,
        shuJasaModal: dist.shuJasaModal,
        totalShu: dist.totalShu,
      } as any);
    }

    return { success: true, totalNetProfit, distributions };
  } catch (error: any) {
    console.error('[SHU] Calculate annual error:', error?.message);
    return { success: false, error: error?.message };
  }
}

// ─── Get Member's SHU History ───

export async function getMemberShuHistory(memberId: string) {
  try {
    const history = await db.select()
      .from(shuDistributions)
      .where(eq(shuDistributions.memberId, memberId));

    return history;
  } catch (error: any) {
    console.error('[SHU] Get history error:', error?.message);
    return [];
  }
}
