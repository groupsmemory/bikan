'use server';

/**
 * BIKAN Instructor Dashboard Server Actions
 * ──────────────────────────────────────────
 * CRUD operations for courses, analytics, and item bank management
 */

import { db } from '@/lib/db/client';
import { users, courses, enrollments, itemBank, learningStreaks } from '@/lib/db/schema';
import { eq, desc, count, sql, and, gte } from 'drizzle-orm';

// ─── Analytics ───

export async function getInstructorStats(instructorId: string) {
  try {
    // Total students (all users with role student)
    const [studentCount] = await db.select({ count: count() })
      .from(users)
      .where(eq(users.role, 'student'));

    // Total courses by this instructor
    const [courseCount] = await db.select({ count: count() })
      .from(courses)
      .where(eq(courses.instructorId, instructorId));

    // Total items in bank
    const [itemCount] = await db.select({ count: count() })
      .from(itemBank);

    // Active learners (streaks in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const [activeCount] = await db.select({ count: count() })
      .from(learningStreaks)
      .where(gte(learningStreaks.streakDate, sevenDaysAgo));

    return {
      totalStudents: studentCount?.count ?? 0,
      totalCourses: courseCount?.count ?? 0,
      totalItems: itemCount?.count ?? 0,
      activeLearnersWeek: activeCount?.count ?? 0,
    };
  } catch (error: any) {
    console.error('[Instructor] Stats error:', error?.message);
    return { totalStudents: 0, totalCourses: 0, totalItems: 0, activeLearnersWeek: 0 };
  }
}

export async function getRecentStudents() {
  try {
    const students = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
    })
      .from(users)
      .where(eq(users.role, 'student'))
      .orderBy(desc(users.createdAt))
      .limit(10);

    return students;
  } catch (error: any) {
    console.error('[Instructor] Recent students error:', error?.message);
    return [];
  }
}

// ─── Item Bank Management ───

export async function getAllItems() {
  try {
    const items = await db.select()
      .from(itemBank)
      .orderBy(desc(itemBank.createdAt));
    return items;
  } catch (error: any) {
    console.error('[Instructor] Get items error:', error?.message);
    return [];
  }
}

export async function addItem(data: {
  moduleId: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  discrimination: string;
  difficulty: string;
  guessing: string;
  bloomLevel: string;
}) {
  try {
    await db.insert(itemBank).values({
      moduleId: data.moduleId,
      question: data.question,
      optionA: data.optionA,
      optionB: data.optionB,
      optionC: data.optionC,
      optionD: data.optionD,
      correctOption: data.correctOption,
      discrimination: data.discrimination,
      difficulty: data.difficulty,
      guessing: data.guessing,
      bloomLevel: data.bloomLevel,
    } as any);
    return { success: true };
  } catch (error: any) {
    console.error('[Instructor] Add item error:', error?.message);
    return { success: false, error: error?.message };
  }
}

export async function deleteItem(itemId: string) {
  try {
    await db.delete(itemBank).where(eq(itemBank.id, itemId));
    return { success: true };
  } catch (error: any) {
    console.error('[Instructor] Delete item error:', error?.message);
    return { success: false, error: error?.message };
  }
}
