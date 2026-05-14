"use server";

import { GoogleGenAI } from "@google/genai";

/**
 * BIKAN Socratic Assistant - Server Action
 * ─────────────────────────────────────────
 * PRD US-ALG-004 Compliance:
 * 1. Model AI wajib menghasilkan respon berbasis perancah kognitif Sokratik
 *    dengan batasan ketat MAKSIMAL 2 baris pertanyaan penuntun.
 * 2. TIDAK PERNAH membocorkan jawaban akhir.
 * 3. Setiap interaksi mencatat penggunaan token (termasuk cached_tokens)
 *    untuk skema ims_analytics.ai_interaction_logs.
 */

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// ─── System Instruction: Socratic Scaffolding Protocol ───
// Ditempatkan di awal prompt untuk memaksimalkan implicit cache hit (PRD Gemini Optimization)
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

// ─── Token Usage Logger (ims_analytics.ai_interaction_logs schema) ───
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
  // Production: await db.insert(ai_interaction_logs).values({...})
  // Untuk MVP/local testing, log ke console dengan format yang match skema DB
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

  // Check for answer-leaking patterns (basic heuristic guard)
  const leakPatterns = [
    /jawabannya\s+(adalah|=)/i,
    /solusinya\s+(adalah|=)/i,
    /hasilnya\s+(adalah|=)/i,
    /maka\s+x\s*=\s*[-\d]/i,
    /jadi,?\s+(nilai|x|y)\s*=\s*/i,
  ];

  for (const pattern of leakPatterns) {
    if (pattern.test(truncated)) {
      // Jika terdeteksi bocor, ganti dengan fallback Sokratik
      return "Coba pikirkan kembali — langkah apa yang bisa kamu ambil selanjutnya untuk mendekati solusi?\nApa yang terjadi jika kamu coba substitusi nilai yang berbeda?";
    }
  }

  return truncated;
}

/**
 * Main Server Action: Tanyakan Asisten Sokratik
 */
export async function askSocraticAssistant(
  userId: string,
  userMessage: string,
  lessonContext: string
): Promise<{ text: string; tokens: number; cached: number; latencyMs: number }> {
  const startTime = Date.now();

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${SYSTEM_INSTRUCTION}\n\n---\nKONTEKS MATERI: ${lessonContext}\n---\nPERTANYAAN SISWA: ${userMessage}\n---\nBerikan MAKSIMAL 2 baris pertanyaan penuntun saja.`,
            },
          ],
        },
      ],
      config: {
        maxOutputTokens: 150, // Ketat: cukup untuk 2 baris pertanyaan
        temperature: 0.3, // Rendah: konsisten dan terkontrol
      },
    });

    const latencyMs = Date.now() - startTime;
    const rawText = response.text ?? "";
    const metadata = response.usageMetadata;

    // Validate and sanitize output
    const validatedText = validateSocraticResponse(rawText);

    // Log token usage to ims_analytics
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
    };
  } catch (error) {
    const latencyMs = Date.now() - startTime;

    // Log failed attempt
    await logToAnalytics({
      userId,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      cachedTokens: 0,
      latencyMs,
      workflowTag: "socratic_scaffolding_error",
    });

    console.error("[BIKAN AI ERROR]", error);
    throw new Error(
      "Asisten sedang istirahat sejenak. Silakan coba lagi dalam 1-2 menit."
    );
  }
}
