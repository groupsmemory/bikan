'use server';

/**
 * BIKAN Socratic AI Tutor - Server Action (Next.js 15)
 * ────────────────────────────────────────────────────
 * Arsitektur $0 (Google AI Studio Free Tier):
 * - Model: Gemini 2.5 Flash (15 RPM / 1500 RPD gratis)
 * - Context: Dari Git-CMS (src/data/lessons.ts) → 0ms, tanpa DB call
 * - Logging: NeonDB (ims_analytics.ai_interaction_logs)
 * - Caching: Prompt structure optimized for Gemini implicit caching
 *
 * Mengapa tanpa database untuk AI memory?
 * → AIContext sudah tersimpan di lessons.ts (Git-CMS)
 * → Dikirim sebagai prompt context setiap request
 * → Hemat biaya storage, hemat latensi, type-safe
 */

import { GoogleGenAI } from '@google/genai';
import { db } from '@/lib/db/client';
import { aiInteractionLogs } from '@/lib/db/schema';
import { getAIContextForLesson, findLessonById } from '@/src/data/lessons';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

// ─── Rate Limiter (server-instance level) ───
// Free Tier: 15 RPM, 1500 RPD — kita pakai 80% threshold untuk safety
const rateState = {
  minuteRequests: [] as number[],
  dailyCount: 0,
  dayStart: Date.now(),
};

function checkRateLimit(): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();

  // Reset daily counter
  if (now - rateState.dayStart > 86_400_000) {
    rateState.dailyCount = 0;
    rateState.dayStart = now;
  }

  // Daily limit (80% of 1500)
  if (rateState.dailyCount >= 1200) {
    return { allowed: false, retryAfterMs: rateState.dayStart + 86_400_000 - now };
  }

  // Clean old minute entries
  rateState.minuteRequests = rateState.minuteRequests.filter(t => now - t < 60_000);

  // Per-minute limit (80% of 15)
  if (rateState.minuteRequests.length >= 12) {
    const oldestInWindow = rateState.minuteRequests[0];
    return { allowed: false, retryAfterMs: 60_000 - (now - oldestInWindow) };
  }

  return { allowed: true };
}

function recordRequest(): void {
  rateState.minuteRequests.push(Date.now());
  rateState.dailyCount++;
}

// ─── System Instruction (STATIC — Gemini implicit cache target) ───
const SYSTEM_INSTRUCTION = `Anda adalah Asisten Sokratik BIKAN untuk pembelajaran matematika aljabar dan fungsi kuadrat.

ATURAN MUTLAK:
1. HANYA boleh merespons dengan MAKSIMAL 2 baris pertanyaan penuntun.
2. DILARANG KERAS memberikan jawaban akhir atau solusi lengkap.
3. DILARANG memberikan rumus jadi yang langsung menjawab pertanyaan siswa.
4. Jika siswa memaksa minta jawaban, tolak dengan sopan dan berikan petunjuk arah berpikir.
5. Gunakan bahasa Indonesia yang komunikatif dan hangat.
6. Fokus pada Zone of Proximal Development (ZPD) siswa.

FORMAT: Maksimal 2 kalimat tanya yang menuntun. Tidak ada solusi.`;

// ─── Build Rich Context from Git-CMS (0ms, no network) ───
function buildContextFromCMS(lessonId: string): string {
  const lesson = findLessonById(lessonId);
  const aiCtx = getAIContextForLesson(lessonId);

  if (!lesson || !aiCtx) {
    return 'Konteks: Pembelajaran matematika aljabar umum.';
  }

  return `TOPIK: ${lesson.title}
DESKRIPSI: ${lesson.description}
LEVEL BLOOM: ${lesson.bloomLevel}
KATA KUNCI: ${aiCtx.keywords.join(', ')}

MISKONSEPSI UMUM SISWA:
${aiCtx.commonMisconceptions.map((m, i) => `${i + 1}. ${m}`).join('\n')}

CONTOH PERTANYAAN SOKRATIK:
${aiCtx.socraticPrompts.map((p, i) => `${i + 1}. ${p}`).join('\n')}

SCAFFOLDING HINTS:
${aiCtx.scaffoldingHints.map((h, i) => `${i + 1}. ${h}`).join('\n')}

PRASYARAT: ${aiCtx.prerequisites.length > 0 ? aiCtx.prerequisites.join(', ') : 'Tidak ada'}`;
}

// ─── Output Validation (prevent answer leaking) ───
function sanitizeResponse(text: string): string {
  const lines = text.trim().split('\n').filter(l => l.trim());
  const truncated = lines.slice(0, 2).join('\n');

  const leakPatterns = [
    /jawabannya\s+(adalah|=)/i,
    /solusinya\s+(adalah|=)/i,
    /hasilnya\s+(adalah|=)/i,
    /maka\s+x\s*=\s*[-\d]/i,
    /jadi,?\s+(nilai|x|y)\s*=\s*/i,
    /sehingga\s+(x|y|f\(x\))\s*=\s*/i,
  ];

  for (const pattern of leakPatterns) {
    if (pattern.test(truncated)) {
      return 'Coba pikirkan kembali — langkah apa yang bisa kamu ambil selanjutnya?\nApa yang terjadi jika kamu coba pendekatan yang berbeda?';
    }
  }

  return truncated;
}

/**
 * Main Server Action: Socratic AI Tutor
 *
 * @param userId - Student UUID
 * @param message - Pertanyaan siswa
 * @param lessonId - Lesson ID aktif (untuk ambil AIContext dari Git-CMS)
 */
export async function askSocraticTutor(
  userId: string,
  message: string,
  lessonId: string
): Promise<{
  text: string;
  tokens: number;
  cached: number;
  latencyMs: number;
  rateLimited: boolean;
}> {
  const startTime = Date.now();

  // ─── Rate Limit Check ───
  const rateCheck = checkRateLimit();
  if (!rateCheck.allowed) {
    const waitSec = Math.ceil((rateCheck.retryAfterMs ?? 60_000) / 1000);
    return {
      text: `Asisten sedang sibuk. Coba lagi dalam ${waitSec} detik ya! 🙏\nSementara itu, cek scaffolding hints di bawah video.`,
      tokens: 0,
      cached: 0,
      latencyMs: Date.now() - startTime,
      rateLimited: true,
    };
  }

  try {
    // ─── Context from Git-CMS (FREE, 0ms, no DB call) ───
    const context = buildContextFromCMS(lessonId);

    // ─── Gemini API Call ───
    // Prompt structure for implicit caching:
    // [STATIC] System Instruction → cached after 1st call (saves ~500 tokens/req)
    // [SEMI-STATIC] Lesson Context → cached per-lesson session
    // [DYNAMIC] User message → only this part is "new" each request
    recordRequest();

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{
        role: 'user',
        parts: [{
          text: `${SYSTEM_INSTRUCTION}\n\n---\nKONTEKS MATERI (dari kurikulum BIKAN):\n${context}\n---\nPERTANYAAN SISWA:\n${message}\n---\nRespons (maks 2 baris pertanyaan penuntun Sokratik):`,
        }],
      }],
      config: {
        maxOutputTokens: 150,
        temperature: 0.3,
        topP: 0.8,
      },
    });

    const latencyMs = Date.now() - startTime;
    const rawText = response.text ?? '';
    const metadata = response.usageMetadata;

    // Sanitize output
    const text = sanitizeResponse(rawText);

    // Token data for analytics
    const tokenData = {
      userId,
      promptTokens: metadata?.promptTokenCount ?? 0,
      completionTokens: metadata?.candidatesTokenCount ?? 0,
      totalTokens: metadata?.totalTokenCount ?? 0,
      cachedTokens: metadata?.cachedContentTokenCount ?? 0,
      latencyMs,
      workflowTag: 'socratic_scaffolding',
    };

    // Non-blocking DB insert (keep response fast)
    db.insert(aiInteractionLogs).values(tokenData as any).catch(err => {
      console.error('[AI Log] DB insert failed:', err);
    });

    return {
      text,
      tokens: tokenData.totalTokens,
      cached: tokenData.cachedTokens,
      latencyMs,
      rateLimited: false,
    };
  } catch (error: any) {
    const latencyMs = Date.now() - startTime;
    const isRateLimit = error?.status === 429 || error?.message?.includes('RESOURCE_EXHAUSTED');

    // Log error to DB (non-blocking)
    db.insert(aiInteractionLogs).values({
      userId,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      cachedTokens: 0,
      latencyMs,
      workflowTag: isRateLimit ? 'rate_limited_429' : 'socratic_error',
    } as any).catch(() => {});

    console.error('[AI Tutor]', error?.message || error);

    if (isRateLimit) {
      return {
        text: 'Kuota AI harian hampir habis. Gunakan scaffolding hints di bawah video! 📚',
        tokens: 0,
        cached: 0,
        latencyMs,
        rateLimited: true,
      };
    }

    return {
      text: 'Asisten sedang istirahat. Coba lagi dalam beberapa saat.',
      tokens: 0,
      cached: 0,
      latencyMs,
      rateLimited: false,
    };
  }
}
