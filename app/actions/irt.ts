'use server';

/**
 * BIKAN IRT Engine Server Integration
 * ────────────────────────────────────
 * Connects lib/ai/irt-engine.ts to NeonDB for persistent theta estimation.
 *
 * Flow:
 * 1. Fetch student's response pattern from grades table
 * 2. Call estimateTheta() with 3PLM parameters (a, b, c)
 * 3. Save updated theta_score to users table for personalization
 */

import { db } from '@/lib/db/client';
import { users, grades, itemBank } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { estimateTheta, UserResponse, ItemParameters } from '@/lib/ai/irt-engine';

/**
 * Recalculate theta for a user based on their full response history
 * and persist to database for next session personalization.
 */
export async function recalculateAndPersistTheta(userId: string): Promise<{
  success: boolean;
  theta?: number;
  responseCount?: number;
  error?: string;
}> {
  try {
    // 1. Fetch all graded responses for this user
    const userGrades = await db.select({
      score: grades.score,
      assessmentId: grades.assessmentId,
    })
      .from(grades)
      .where(eq(grades.studentId, userId));

    if (userGrades.length === 0) {
      return { success: true, theta: 0, responseCount: 0 };
    }

    // 2. Fetch item parameters for each graded item
    // Map grades to IRT responses (score > 0 = correct)
    const allItems = await db.select()
      .from(itemBank);

    // Build response pattern from grades
    const responses: UserResponse[] = userGrades.map((grade, idx) => {
      // Match grade to item (simplified: use index-based matching)
      const item = allItems[idx % allItems.length];
      return {
        itemId: grade.assessmentId,
        isCorrect: grade.score > 0,
        params: {
          a: item ? parseFloat(item.discrimination) : 1.2,
          b: item ? parseFloat(item.difficulty) : 0,
          c: item ? parseFloat(item.guessing) : 0.25,
        },
      };
    });

    // 3. Get current theta as starting point
    const [currentUser] = await db.select({ thetaScore: users.thetaScore })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const currentTheta = currentUser?.thetaScore ? parseFloat(currentUser.thetaScore) : 0;

    // 4. Call estimateTheta with MLEF (Newton-Raphson + fences)
    const newTheta = estimateTheta(responses, currentTheta);

    // 5. Persist to database
    await db.update(users)
      .set({ thetaScore: newTheta.toFixed(4), updatedAt: new Date() } as any)
      .where(eq(users.id, userId));

    return {
      success: true,
      theta: newTheta,
      responseCount: responses.length,
    };
  } catch (error: any) {
    console.error('[IRT] Recalculate theta error:', error?.message);
    return { success: false, error: error?.message };
  }
}

/**
 * Record a single assessment response and update theta in real-time
 */
export async function recordResponseAndUpdateTheta(
  userId: string,
  itemId: string,
  isCorrect: boolean,
  itemParams: ItemParameters
): Promise<{ success: boolean; newTheta?: number }> {
  try {
    // Get current theta
    const [currentUser] = await db.select({ thetaScore: users.thetaScore })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const currentTheta = currentUser?.thetaScore ? parseFloat(currentUser.thetaScore) : 0;

    // Single-response theta update (incremental)
    const response: UserResponse = { itemId, isCorrect, params: itemParams };
    const newTheta = estimateTheta([response], currentTheta);

    // Persist
    await db.update(users)
      .set({ thetaScore: newTheta.toFixed(4), updatedAt: new Date() } as any)
      .where(eq(users.id, userId));

    return { success: true, newTheta };
  } catch (error: any) {
    console.error('[IRT] Record response error:', error?.message);
    return { success: false };
  }
}

/**
 * Get user's current theta from database
 */
export async function getUserTheta(userId: string): Promise<number> {
  try {
    const [user] = await db.select({ thetaScore: users.thetaScore })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return user?.thetaScore ? parseFloat(user.thetaScore) : 0;
  } catch {
    return 0;
  }
}
