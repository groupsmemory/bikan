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
