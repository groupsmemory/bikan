'use server';

/**
 * BIKAN Assessment Server Actions
 * ────────────────────────────────
 * Fetch IRT item bank from NeonDB for adaptive testing
 */

import { db } from '@/lib/db/client';
import { itemBank } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export interface AssessmentItem {
  id: string;
  question: string;
  options: { label: string; key: string }[];
  correctOption: string;
  params: { a: number; b: number; c: number };
  bloomLevel: string | null;
}

export async function getItemsByModule(moduleId: string): Promise<AssessmentItem[]> {
  try {
    const items = await db.select()
      .from(itemBank)
      .where(eq(itemBank.moduleId, moduleId));

    return items.map(item => ({
      id: item.id,
      question: item.question,
      options: [
        { label: item.optionA, key: 'a' },
        { label: item.optionB, key: 'b' },
        { label: item.optionC, key: 'c' },
        { label: item.optionD, key: 'd' },
      ],
      correctOption: item.correctOption,
      params: {
        a: parseFloat(item.discrimination),
        b: parseFloat(item.difficulty),
        c: parseFloat(item.guessing),
      },
      bloomLevel: item.bloomLevel,
    }));
  } catch (error: any) {
    console.error('[Assessment] Failed to fetch items:', error?.message);
    return [];
  }
}
