'use server';

/**
 * BIKAN Learning Streak Server Actions
 * ─────────────────────────────────────
 * PRD Could Have: Pelacakan keterikatan belajar harian
 * tanpa papan peringkat sosial (menghindari kecemasan kompetisi)
 *
 * Streak = jumlah hari berturut-turut siswa aktif belajar (≥30 menit)
 */

import { db } from '@/lib/db/client';
import { learningStreaks } from '@/lib/db/schema';
import { eq, desc, and, gte, lte } from 'drizzle-orm';

export interface StreakData {
  currentStreak: number;      // Hari berturut-turut aktif
  longestStreak: number;      // Rekor terpanjang
  todayMinutes: number;       // Menit belajar hari ini
  todayActivities: number;    // Aktivitas selesai hari ini
  weekData: { date: string; minutes: number; active: boolean }[]; // 7 hari terakhir
}

/**
 * Record learning activity for today
 */
export async function recordActivity(userId: string, minutes: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  try {
    // Check if today's record exists
    const existing = await db.select()
      .from(learningStreaks)
      .where(
        and(
          eq(learningStreaks.userId, userId),
          gte(learningStreaks.streakDate, today),
          lte(learningStreaks.streakDate, tomorrow)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Update existing record — add minutes and increment activities
      const current = existing[0];
      await db.update(learningStreaks)
        .set({
          minutesStudied: current.minutesStudied + minutes,
          activitiesCompleted: current.activitiesCompleted + 1,
        })
        .where(eq(learningStreaks.id, current.id));
    } else {
      // Create new record for today
      await db.insert(learningStreaks).values({
        userId,
        streakDate: today,
        minutesStudied: minutes,
        activitiesCompleted: 1,
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error('[Streak] Record error:', error?.message);
    return { success: false, error: error?.message };
  }
}

/**
 * Get streak data for a user
 */
export async function getStreakData(userId: string): Promise<StreakData> {
  try {
    // Get last 30 days of activity
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const records = await db.select()
      .from(learningStreaks)
      .where(
        and(
          eq(learningStreaks.userId, userId),
          gte(learningStreaks.streakDate, thirtyDaysAgo)
        )
      )
      .orderBy(desc(learningStreaks.streakDate));

    // Calculate current streak
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];

      const dayRecord = records.find(r => {
        const rDate = new Date(r.streakDate);
        return rDate.toISOString().split('T')[0] === dateStr;
      });

      // Active = studied ≥ 30 minutes
      if (dayRecord && dayRecord.minutesStudied >= 30) {
        currentStreak++;
      } else if (i === 0) {
        // Today hasn't hit 30 min yet — don't break streak, just don't count
        continue;
      } else {
        break;
      }
    }

    // Calculate longest streak from all records
    let longestStreak = currentStreak;
    let tempStreak = 0;
    const allDates = records
      .filter(r => r.minutesStudied >= 30)
      .map(r => new Date(r.streakDate).toISOString().split('T')[0])
      .sort();

    for (let i = 0; i < allDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prev = new Date(allDates[i - 1]);
        const curr = new Date(allDates[i]);
        const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak);
    }

    // Today's data
    const todayRecord = records.find(r => {
      const rDate = new Date(r.streakDate);
      return rDate.toISOString().split('T')[0] === today.toISOString().split('T')[0];
    });

    // Last 7 days for weekly view
    const weekData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const record = records.find(r => {
        return new Date(r.streakDate).toISOString().split('T')[0] === dateStr;
      });
      weekData.push({
        date: dateStr,
        minutes: record?.minutesStudied ?? 0,
        active: (record?.minutesStudied ?? 0) >= 30,
      });
    }

    return {
      currentStreak,
      longestStreak,
      todayMinutes: todayRecord?.minutesStudied ?? 0,
      todayActivities: todayRecord?.activitiesCompleted ?? 0,
      weekData,
    };
  } catch (error: any) {
    console.error('[Streak] Get data error:', error?.message);
    return {
      currentStreak: 0,
      longestStreak: 0,
      todayMinutes: 0,
      todayActivities: 0,
      weekData: [],
    };
  }
}
