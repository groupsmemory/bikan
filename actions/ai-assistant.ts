"use server";

import { GoogleGenAI } from "@google/genai";
import { getAIContextForLesson, findLessonById } from "@/src/data/lessons";
import type { AIContext } from "@/src/data/lessons";

/**
 * BIKAN Socratic Assistant - Server Action (Optimized for Free Tier)
 * ──────────────────────────────────────────────────────────────────
 * Arsitektur $0:
 * - Model: Gemini 2.5 Flash (Free Tier via Google AI Studio API Key)
 * - Context: Diambil langsung dari Git-CMS (src/data/lessons.ts) → 0ms, no DB call
 * - Rate Limit: 15 RPM / 1M TPM / 1500 RPD (Free Tier limits)
 * - Caching: Prompt structure optimized for Gemini implicit context caching
 *   → System instruction + static context FIRST (cached after 1st call)
 *   → Dynamic user message LAST (only this changes per request)
 *
 * PRD US-ALG-004 Compliance:
 * 1. Respon berbasis perancah kognitif Sokratik (maks 2 baris pertanyaan penuntun)
 * 2. TIDAK PERNAH membocorkan jawaban akhir
 * 3. Token usage di-log ke ims_analytics.ai_interaction_logs
 */

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// ─── Rate Limiter (in-memory, per-server-instance) ───
// Google AI Studio Free Tier: 15 requests/minute, 1500 requests/day
const rateLimiter = {
  requests: [] as number[],
  dailyCount: 0,
  lastDayReset: Date.now(),

  canProceed(): boolean {
    const now = Date.now();

    // Reset daily counter at midnight
    if (now - this.lastDayReset > 86_400_000) {
      this.dailyCount = 0;
      this.lastDayReset = now;
    }

    // Check daily limit (1500 RPD, leave 10% buffer)
    if (this.dailyCount >= 1350) return false;

    // Clean requests older than 1 minute
    this.requests = this.requests.filter((t) => now - t < 60_000);

    // Check per-minute limit (15 RPM, leave 2 buffer)
    if (this.requests.length >= 13) return false;

    return true;
  },

  record(): void {
    this.requests.push(Date.now());
    this.dailyCount++;
  },
};

// ─── System Instruction (STATIC — triggers Gemini implicit cache) ───
// Ditempatkan di awal prompt. Setelah panggilan pertama, Gemini akan
// meng-cache bagian ini secara otomatis → hemat token input hingga 90%
const SYSTEM_INSTRUCTION = `Anda adalah Asisten Sokratik BIKAN untuk pembelajaran matematika aljabar dan fungsi kuadrat.

ATURAN MUTLAK YANG TIDAK BOLEH DILANGGAR:
1. Anda HANYA boleh merespons dengan MAKSIMAL 2 baris pertanyaan penuntun (scaffolding questions).
2. Anda DILARANG KERAS memberikan jawaban akhir, solusi lengkap, atau langkah penyelesaian final.
3. Anda DILARANG memberikan rumus jadi yang langsung menjawab pertanyaan siswa.
4. Jika siswa memaksa minta jawaban, tolak dengan sopan dan berikan petunjuk arah berpikir saja.
5. Gunakan bahasa Indonesia yang komunikatif dan hangat.
6. Fokus pada Zone of Proximal Development (ZPD) siswa — dorong mereka berpikir satu langkah lebih jauh.

FORMAT RESPONS:
- Maksimal 2 kalimat tanya yang menuntun.
- Tidak ada penjelasan panjang, tidak ada solusi, tidak ada "jawabannya adalah...".

CONTOH RESPONS YANG BENAR:
"Coba perhatikan, apa yang terjadi jika kamu substitusi x = -1 ke dalam f(x)? Apakah hasilnya nol?"

CONTOH RESPONS YANG SALAH (DILARANG):
"Jawabannya adalah x = -1 karena f(-1) = (-1)² + 2(-1) + 1 = 0."`;

// ─── Build Context from Git-CMS (0ms, no network call) ───
function buildLessonContext(lessonId: string): string {
  const lesson = findLessonById(lessonId);
  const aiCtx = getAIContextForLesson(lessonId);

  if (!lesson || !aiCtx) {
    return "Konteks: Pembelajaran matematika aljabar umum.";
  }

  // Structured context that helps AI give better Socratic responses
  // This replaces the need for a separate vector DB or long-term memory store
  return `TOPIK: ${lesson.title}
DESKRIPSI: ${lesson.description}
LEVEL BLOOM: ${lesson.bloomLevel}
KATA KUNCI: ${aiCtx.keywords.join(", ")}

MISKONSEPSI UMUM SISWA:
${aiCtx.commonMisconceptions.map((m, i) => `${i + 1}. ${m}`).join("\n")}

CONTOH PERTANYAAN SOKRATIK:
${aiCtx.socraticPrompts.map((p, i) => `${i + 1}. ${p}`).join("\n")}

SCAFFOLDING HINTS (gunakan jika siswa sangat kesulitan):
${aiCtx.scaffoldingHints.map((h, i) => `${i + 1}. ${h}`).join("\n")}

PRASYARAT YANG SUDAH DIPELAJARI: ${aiCtx.prerequisites.length > 0 ? aiCtx.prerequisites.join(", ") : "Tidak ada (lesson pertama)"}`;
}

// ─── Token Usage Logger ───
interface TokenLog {
  userId: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cachedTokens: number;
  latencyMs: number;
  workflowTag: string;
}

async function logToAnalytics(data: TokenLog): Promise<void> {
  // Production: await db.insert(aiInteractionLogs).values({...})
  // MVP: console log matching ims_analytics schema
  console.log("[ims_analytics.ai_interaction_logs]", {
    user_id: data.userId,
    prompt_tokens: data.promptTokens,
    completion_tokens: data.completionTokens,
    total_tokens: data.totalTokens,
    cached_tokens: data.cachedTokens,
    latency_ms: data.latencyMs,
    workflow_tag: data.workflowTag,
    created_at: new Date().toISOString(),
  });
}

// ─── Post-Processing Guard: Validasi output tidak bocorkan jawaban ───
function validateSocraticResponse(text: string): string {
  const lines = text.trim().split("\n").filter((l) => l.trim().length > 0);

  // Enforce max 2 lines
  const truncated = lines.slice(0, 2).join("\n");

  // Check for answer-leaking patterns
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
      return "Coba pikirkan kembali — langkah apa yang bisa kamu ambil selanjutnya untuk mendekati solusi?\nApa yang terjadi jika kamu coba substitusi nilai yang berbeda?";
    }
  }

  return truncated;
}

/**
 * Main Server Action: Tanyakan Asisten Sokratik
 *
 * @param userId - ID siswa (untuk logging)
 * @param userMessage - Pertanyaan siswa
 * @param lessonId - ID lesson aktif (untuk ambil context dari Git-CMS)
 *
 * Flow:
 * 1. Rate limit check (protect Free Tier quota)
 * 2. Build context dari Git-CMS (0ms, no DB call)
 * 3. Call Gemini 2.5 Flash (optimized prompt structure for caching)
 * 4. Validate output (no answer leaking)
 * 5. Log token usage
 */
export async function askSocraticAssistant(
  userId: string,
  userMessage: string,
  lessonId: string
): Promise<{
  text: string;
  tokens: number;
  cached: number;
  latencyMs: number;
  rateLimited: boolean;
}> {
  const startTime = Date.now();

  // ─── Rate Limit Guard ───
  if (!rateLimiter.canProceed()) {
    return {
      text: "Asisten sedang sibuk melayani siswa lain. Coba lagi dalam 1 menit ya! 🙏",
      tokens: 0,
      cached: 0,
      latencyMs: Date.now() - startTime,
      rateLimited: true,
    };
  }

  try {
    // ─── Build Context from Git-CMS (FREE, 0ms) ───
    const lessonContext = buildLessonContext(lessonId);

    // ─── Gemini API Call ───
    // Prompt structure optimized for implicit context caching:
    // [STATIC: System Instruction] → cached after 1st call
    // [SEMI-STATIC: Lesson Context] → cached per-lesson (same lesson = cache hit)
    // [DYNAMIC: User Message] → only this changes per request
    rateLimiter.record();

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${SYSTEM_INSTRUCTION}\n\n---\nKONTEKS MATERI (dari kurikulum BIKAN):\n${lessonContext}\n---\nPERTANYAAN SISWA:\n${userMessage}\n---\nBerikan MAKSIMAL 2 baris pertanyaan penuntun Sokratik saja.`,
            },
          ],
        },
      ],
      config: {
        maxOutputTokens: 150, // Ketat: cukup untuk 2 baris pertanyaan
        temperature: 0.3, // Rendah: konsisten dan terkontrol
        topP: 0.8, // Fokus pada respons yang paling relevan
      },
    });

    const latencyMs = Date.now() - startTime;
    const rawText = response.text ?? "";
    const metadata = response.usageMetadata;

    // Validate and sanitize output
    const validatedText = validateSocraticResponse(rawText);

    // Log token usage
    const tokenLog: TokenLog = {
      userId,
      promptTokens: metadata?.promptTokenCount ?? 0,
      completionTokens: metadata?.candidatesTokenCount ?? 0,
      totalTokens: metadata?.totalTokenCount ?? 0,
      cachedTokens: metadata?.cachedContentTokenCount ?? 0,
      latencyMs,
      workflowTag: "socratic_scaffolding",
    };

    await logToAnalytics(tokenLog);

    return {
      text: validatedText,
      tokens: tokenLog.totalTokens,
      cached: tokenLog.cachedTokens,
      latencyMs,
      rateLimited: false,
    };
  } catch (error: any) {
    const latencyMs = Date.now() - startTime;

    // Handle specific Gemini errors
    const isRateLimit =
      error?.status === 429 || error?.message?.includes("RESOURCE_EXHAUSTED");

    await logToAnalytics({
      userId,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      cachedTokens: 0,
      latencyMs,
      workflowTag: isRateLimit
        ? "socratic_rate_limited"
        : "socratic_scaffolding_error",
    });

    console.error("[BIKAN AI ERROR]", error?.message || error);

    if (isRateLimit) {
      return {
        text: "Kuota AI harian hampir habis. Coba lagi besok atau gunakan scaffolding hints di bawah video! 📚",
        tokens: 0,
        cached: 0,
        latencyMs,
        rateLimited: true,
      };
    }

    return {
      text: "Asisten sedang istirahat sejenak. Silakan coba lagi dalam 1-2 menit.",
      tokens: 0,
      cached: 0,
      latencyMs,
      rateLimited: false,
    };
  }
}
