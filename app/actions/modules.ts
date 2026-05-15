'use server';

/**
 * BIKAN Curriculum Modules Server Actions
 * ────────────────────────────────────────
 * Fetch and manage learning modules from NeonDB
 */

import { db } from '@/lib/db/client';
import { modules, itemBank } from '@/lib/db/schema';
import { eq, asc, count } from 'drizzle-orm';

export interface ModuleData {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  orderIndex: number;
  masteryThreshold: number;
  prerequisiteModuleId: string | null;
  iconEmoji: string | null;
  itemCount: number;
}

export async function getAllModules(): Promise<ModuleData[]> {
  try {
    const mods = await db.select()
      .from(modules)
      .where(eq(modules.active, 1))
      .orderBy(asc(modules.orderIndex));

    // Get item counts per module
    const result: ModuleData[] = [];
    for (const mod of mods) {
      const [itemCountResult] = await db.select({ count: count() })
        .from(itemBank)
        .where(eq(itemBank.moduleId, mod.slug));

      result.push({
        id: mod.id,
        slug: mod.slug,
        title: mod.title,
        description: mod.description,
        orderIndex: mod.orderIndex,
        masteryThreshold: mod.masteryThreshold,
        prerequisiteModuleId: mod.prerequisiteModuleId,
        iconEmoji: mod.iconEmoji,
        itemCount: itemCountResult?.count ?? 0,
      });
    }

    return result;
  } catch (error: any) {
    console.error('[Modules] Fetch error:', error?.message);
    return [];
  }
}

export async function getModuleBySlug(slug: string) {
  try {
    const [mod] = await db.select()
      .from(modules)
      .where(eq(modules.slug, slug))
      .limit(1);
    return mod || null;
  } catch {
    return null;
  }
}

// ─── Mastery Gatekeeper: Check if user can access a module ───

import { learningProgress } from '@/lib/db/schema';
import { and, sql } from 'drizzle-orm';

export interface GatekeeperResult {
  status: 'UNLOCKED' | 'LOCKED';
  currentMastery: number;
  requiredMastery: number;
  prerequisiteModule?: string;
}

/**
 * Check if a user has mastery access to a specific module.
 * Returns LOCKED if prerequisite module's completion < 90%.
 */
export async function checkModuleAccess(userId: string, moduleSlug: string): Promise<GatekeeperResult> {
  try {
    // Get the target module
    const [targetModule] = await db.select()
      .from(modules)
      .where(eq(modules.slug, moduleSlug))
      .limit(1);

    if (!targetModule) {
      return { status: 'UNLOCKED', currentMastery: 0, requiredMastery: 90 };
    }

    // If no prerequisite, always unlocked
    if (!targetModule.prerequisiteModuleId) {
      return { status: 'UNLOCKED', currentMastery: 100, requiredMastery: targetModule.masteryThreshold };
    }

    // Get prerequisite module
    const [prereqModule] = await db.select()
      .from(modules)
      .where(eq(modules.id, targetModule.prerequisiteModuleId))
      .limit(1);

    if (!prereqModule) {
      return { status: 'UNLOCKED', currentMastery: 100, requiredMastery: targetModule.masteryThreshold };
    }

    // Check user's completion on prerequisite module's lessons
    // Query: average completion_percentage for all lessons in the prerequisite module's course
    const progressRecords = await db.select({
      avgCompletion: sql<number>`COALESCE(AVG(${learningProgress.completionPercentage}), 0)`,
    })
      .from(learningProgress)
      .where(
        and(
          eq(learningProgress.userId, userId),
          eq(learningProgress.courseId, prereqModule.id) // Using module ID as course reference
        )
      );

    const currentMastery = progressRecords[0]?.avgCompletion ?? 0;
    const requiredMastery = targetModule.masteryThreshold;

    if (currentMastery < requiredMastery) {
      return {
        status: 'LOCKED',
        currentMastery,
        requiredMastery,
        prerequisiteModule: prereqModule.title,
      };
    }

    return {
      status: 'UNLOCKED',
      currentMastery,
      requiredMastery,
    };
  } catch (error: any) {
    console.error('[Gatekeeper] Check access error:', error?.message);
    // Fail open for now (don't block user on DB errors)
    return { status: 'UNLOCKED', currentMastery: 0, requiredMastery: 90 };
  }
}

/**
 * Record lesson completion progress for a user
 */
export async function updateLessonProgress(
  userId: string,
  courseId: string,
  lessonId: string,
  completionPercentage: number
) {
  try {
    // Upsert: update if exists, insert if not
    const existing = await db.select({ id: learningProgress.id })
      .from(learningProgress)
      .where(
        and(
          eq(learningProgress.userId, userId),
          eq(learningProgress.lessonId, lessonId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db.update(learningProgress)
        .set({ completionPercentage, lastAccessed: new Date() } as any)
        .where(eq(learningProgress.id, existing[0].id));
    } else {
      await db.insert(learningProgress).values({
        userId,
        courseId,
        lessonId,
        completionPercentage,
      } as any);
    }

    return { success: true };
  } catch (error: any) {
    console.error('[Gatekeeper] Update progress error:', error?.message);
    return { success: false, error: error?.message };
  }
}
