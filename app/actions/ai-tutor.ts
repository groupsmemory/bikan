'use server';

/**
 * BIKAN Socratic AI Tutor - Server Action (Next.js 15)
 * ────────────────────────────────────────────────────
 * Connected to NeonDB for token logging (ims_analytics.ai_interaction_logs)
 */

import { GoogleGenAI } from '@google/genai';
import { db } from '@/lib/db/client';
import { aiInteractionLogs } from '@/lib/db/schema';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const SYSTEM_INSTRUCTION = `Anda adalah Asisten Sokratik BIKAN untuk pembelajaran matematika aljabar dan fungsi kuadrat.

ATURAN MUTLAK:
1. HANYA boleh merespons dengan MAKSIMAL 2 baris pertanyaan penuntun.
2. DILARANG KERAS memberikan jawaban akhir atau solusi lengkap.
3. DILARANG memberikan rumus jadi yang langsung menjawab pertanyaan siswa.
4. Jika siswa memaksa minta jawaban, tolak dengan sopan dan berikan petunjuk arah berpikir.
5. Gunakan bahasa Indonesia yang komunikatif dan hangat.
6. Fokus pada Zone of Proximal Development (ZPD) siswa.

FORMAT: Maksimal 2 kalimat tanya yang menuntun. Tidak ada solusi.`;

export async function askSocraticTutor(
  userId: string,
  message: string,
  context: string
) {
  const startTime = Date.now();

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{
        role: 'user',
        parts: [{
          text: `${SYSTEM_INSTRUCTION}\n\n---\nKONTEKS: ${context}\n---\nSISWA: ${message}\n---\nMaksimal 2 baris pertanyaan penuntun:`,
        }],
      }],
      config: { maxOutputTokens: 150, temperature: 0.3 },
    });

    const latencyMs = Date.now() - startTime;
    const rawText = response.text ?? '';
    const metadata = response.usageMetadata;

    // Truncate to max 2 lines
    const lines = rawText.trim().split('\n').filter(l => l.trim());
    const text = lines.slice(0, 2).join('\n');

    // Log to NeonDB (ims_analytics)
    const tokenData = {
      userId,
      promptTokens: metadata?.promptTokenCount ?? 0,
      completionTokens: metadata?.candidatesTokenCount ?? 0,
      totalTokens: metadata?.totalTokenCount ?? 0,
      cachedTokens: metadata?.cachedContentTokenCount ?? 0,
      latencyMs,
      workflowTag: 'socratic_scaffolding',
    };

    // Non-blocking DB insert (don't await to keep response fast)
    db.insert(aiInteractionLogs).values(tokenData).catch(err => {
      console.error('[AI Log] Failed to insert:', err);
    });

    return {
      text,
      tokens: tokenData.totalTokens,
      cached: tokenData.cachedTokens,
      latencyMs,
    };
  } catch (error: any) {
    console.error('[AI Tutor] Error:', error);
    return {
      text: 'Asisten sedang istirahat. Coba lagi dalam beberapa saat.',
      tokens: 0,
      cached: 0,
      latencyMs: Date.now() - startTime,
    };
  }
}
