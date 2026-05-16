'use server';

/**
 * BIKAN Instructor Analytics — Student Progress & Item Performance
 * ────────────────────────────────────────────────────────────────
 * Server actions for:
 * - Per-student theta/mastery tracking
 * - Item performance statistics (accuracy, discrimination fit)
 * - Cohort theta distribution
 * - Learning velocity metrics
 */

import { db } from '@/lib/db/client';
import { users, grades, itemBank, learningStreaks, learningProgress } from '@/lib/db/schema';
import { eq, desc, count, sql, and, gte, avg } from 'drizzle-orm';

// ─── Student Progress Data ───

export interface StudentProgress {
  id: string;
  name: string;
  email: string;
  theta: number;
  mastery: number;
  totalResponses: number;
  accuracy: number;
  lastActive: string | null;
  streakDays: number;
  riskLevel: 'on_track' | 'at_risk' | 'needs_help';
}

export async function getStudentProgressList(): Promise<StudentProgress[]> {
  try {
    // Get all students with their theta scores
    const students = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      thetaScore: users.thetaScore,
      updatedAt: users.updatedAt,
    })
      .from(users)
      .where(eq(users.role, 'student'))
      .orderBy(desc(users.updatedAt));

    // Get response counts and accuracy per student
    const gradeStats = await db.select({
      studentId: grades.studentId,
      totalResponses: count(),
      correctCount: sql<number>`SUM(CASE WHEN ${grades.score} > 0 THEN 1 ELSE 0 END)`,
    })
      .from(grades)
      .groupBy(grades.studentId);

    // Get streak data (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const streakData = await db.select({
      userId: learningStreaks.userId,
      streakDays: count(),
    })
      .from(learningStreaks)
      .where(gte(learningStreaks.streakDate, sevenDaysAgo))
      .groupBy(learningStreaks.userId);

    // Map stats to students
    const gradeMap = new Map(gradeStats.map(g => [g.studentId, g]));
    const streakMap = new Map(streakData.map(s => [s.userId, s.streakDays]));

    return students.map(student => {
      const theta = student.thetaScore ? parseFloat(student.thetaScore) : 0;
      const mastery = Math.min(Math.max(((theta + 3.5) / 7) * 100, 0), 100);
      const stats = gradeMap.get(student.id);
      const totalResponses = stats?.totalResponses ?? 0;
      const correctCount = Number(stats?.correctCount ?? 0);
      const accuracy = totalResponses > 0 ? correctCount / totalResponses : 0;
      const streakDays = streakMap.get(student.id) ?? 0;

      // Risk assessment
      let riskLevel: 'on_track' | 'at_risk' | 'needs_help' = 'on_track';
      if (theta < -1.0 && totalResponses > 5) riskLevel = 'needs_help';
      else if (theta < 0 && streakDays < 2) riskLevel = 'at_risk';

      return {
        id: student.id,
        name: student.name,
        email: student.email,
        theta,
        mastery,
        totalResponses,
        accuracy,
        lastActive: student.updatedAt?.toISOString() ?? null,
        streakDays,
        riskLevel,
      };
    });
  } catch (error: any) {
    console.error('[Analytics] Student progress error:', error?.message);
    return [];
  }
}

// ─── Item Performance Analytics ───

export interface ItemPerformance {
  id: string;
  question: string;
  moduleId: string;
  bloomLevel: string | null;
  discrimination: number;
  difficulty: number;
  guessing: number;
  timesAdministered: number;
  correctRate: number;
  /** Flag if item is performing poorly (low discrimination or extreme difficulty) */
  flag: 'good' | 'review' | 'poor';
}

export async function getItemPerformanceStats(): Promise<ItemPerformance[]> {
  try {
    const items = await db.select()
      .from(itemBank)
      .orderBy(desc(itemBank.createdAt));

    // Get response data per item from grades
    const gradesByItem = await db.select({
      assessmentId: grades.assessmentId,
      totalAttempts: count(),
      correctCount: sql<number>`SUM(CASE WHEN ${grades.score} > 0 THEN 1 ELSE 0 END)`,
    })
      .from(grades)
      .groupBy(grades.assessmentId);

    const gradeMap = new Map(gradesByItem.map(g => [g.assessmentId, g]));

    return items.map(item => {
      const stats = gradeMap.get(item.id);
      const timesAdministered = stats?.totalAttempts ?? 0;
      const correctRate = timesAdministered > 0
        ? Number(stats?.correctCount ?? 0) / timesAdministered
        : 0;

      const disc = parseFloat(item.discrimination);
      const diff = parseFloat(item.difficulty);

      // Flag items that need review
      let flag: 'good' | 'review' | 'poor' = 'good';
      if (disc < 0.5) flag = 'poor'; // Low discrimination
      else if (Math.abs(diff) > 2.5) flag = 'review'; // Extreme difficulty
      else if (timesAdministered > 10 && (correctRate > 0.95 || correctRate < 0.1)) flag = 'review';

      return {
        id: item.id,
        question: item.question,
        moduleId: item.moduleId,
        bloomLevel: item.bloomLevel,
        discrimination: disc,
        difficulty: diff,
        guessing: parseFloat(item.guessing),
        timesAdministered,
        correctRate,
        flag,
      };
    });
  } catch (error: any) {
    console.error('[Analytics] Item performance error:', error?.message);
    return [];
  }
}

// ─── Cohort Analytics ───

export interface CohortAnalytics {
  totalStudents: number;
  averageTheta: number;
  medianTheta: number;
  thetaDistribution: { range: string; count: number }[];
  masteryRate: number; // % students with mastery >= 90%
  atRiskCount: number;
  averageAccuracy: number;
  activeRate7d: number; // % students active in last 7 days
}

export async function getCohortAnalytics(): Promise<CohortAnalytics> {
  try {
    // Get all student thetas
    const students = await db.select({
      thetaScore: users.thetaScore,
    })
      .from(users)
      .where(eq(users.role, 'student'));

    const thetas = students
      .map(s => s.thetaScore ? parseFloat(s.thetaScore) : 0)
      .sort((a, b) => a - b);

    const totalStudents = thetas.length;
    if (totalStudents === 0) {
      return {
        totalStudents: 0, averageTheta: 0, medianTheta: 0,
        thetaDistribution: [], masteryRate: 0, atRiskCount: 0,
        averageAccuracy: 0, activeRate7d: 0,
      };
    }

    const averageTheta = thetas.reduce((s, t) => s + t, 0) / totalStudents;
    const medianTheta = thetas[Math.floor(totalStudents / 2)];

    // Theta distribution buckets
    const buckets = [
      { range: '< -2.0 (Pemula)', min: -4, max: -2 },
      { range: '-2.0 to -1.0 (Dasar)', min: -2, max: -1 },
      { range: '-1.0 to 0.0 (Berkembang)', min: -1, max: 0 },
      { range: '0.0 to 1.0 (Kompeten)', min: 0, max: 1 },
      { range: '1.0 to 2.0 (Mahir)', min: 1, max: 2 },
      { range: '> 2.0 (Sangat Mahir)', min: 2, max: 4 },
    ];

    const thetaDistribution = buckets.map(bucket => ({
      range: bucket.range,
      count: thetas.filter(t => t >= bucket.min && t < bucket.max).length,
    }));

    // Mastery rate (theta >= 2.8 ≈ 90% mastery)
    const masteryCount = thetas.filter(t => t >= 2.8).length;
    const masteryRate = (masteryCount / totalStudents) * 100;

    // At-risk count (theta < -1.0)
    const atRiskCount = thetas.filter(t => t < -1.0).length;

    // Average accuracy from grades
    const [accuracyResult] = await db.select({
      avgScore: sql<number>`AVG(CASE WHEN ${grades.score} > 0 THEN 1.0 ELSE 0.0 END)`,
    }).from(grades);
    const averageAccuracy = accuracyResult?.avgScore ?? 0;

    // Active rate (7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const [activeResult] = await db.select({
      activeCount: sql<number>`COUNT(DISTINCT ${learningStreaks.userId})`,
    })
      .from(learningStreaks)
      .where(gte(learningStreaks.streakDate, sevenDaysAgo));

    const activeRate7d = totalStudents > 0
      ? ((activeResult?.activeCount ?? 0) / totalStudents) * 100
      : 0;

    return {
      totalStudents,
      averageTheta,
      medianTheta,
      thetaDistribution,
      masteryRate,
      atRiskCount,
      averageAccuracy,
      activeRate7d,
    };
  } catch (error: any) {
    console.error('[Analytics] Cohort error:', error?.message);
    return {
      totalStudents: 0, averageTheta: 0, medianTheta: 0,
      thetaDistribution: [], masteryRate: 0, atRiskCount: 0,
      averageAccuracy: 0, activeRate7d: 0,
    };
  }
}
