'use server';

/**
 * BIKAN Post-Live Automation - Server Action
 * ───────────────────────────────────────────
 * PRD & Creative Director Doc:
 * - Setelah sesi live ditutup, sistem otomasi mengirim rekaman ke Gemini
 * - Output: ringkasan materi, FAQ otomatis berbasis timestamp, kuis formatif
 * - Target: < 5 menit pasca-siaran
 *
 * Menggunakan Gemini 2.5 Flash (context window besar, implicit caching)
 * Prompt structure: media first → rules → instructions (optimal for cache hit)
 */

import { GoogleGenAI } from '@google/genai';
import { db } from '@/lib/db/client';
import { aiInteractionLogs } from '@/lib/db/schema';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

// ─── Structured Prompt for Post-Live Processing ───
const SYSTEM_PROMPT = `Anda adalah sistem Kecerdasan Buatan Otomatisasi Konten EdTech BIKAN.
Tugas: mengekstrak data instruksional dari rekaman sesi live teaching, menghasilkan sintesis teks tanpa halusinasi, dan menyusun modul evaluasi.

FORMAT OUTPUT (Markdown ketat, tanpa basa-basi):

## 1. RINGKASAN MATERI
Konversikan sesi menjadi ringkasan terstruktur (500-800 kata):
- Tesis utama sesi
- Poin-poin kunci (bullet points)
- Terminologi kritis (bold)
- Hubungan antar-konsep

## 2. FAQ OTOMATIS (minimal 5 entri)
Format per entri:
**[JJ:MM:DD]** Pertanyaan?
> Jawaban ringkas (2-3 kalimat)

## 3. KUIS FORMATIF (5 soal pilihan ganda)
Format per soal:
**Soal N.** [pertanyaan]
- A) opsi
- B) opsi
- C) opsi
- D) opsi
**Jawaban:** [huruf] — [rasional singkat]

ATURAN:
- Tidak ada halusinasi. Hanya ekstrak dari konten yang diberikan.
- Bahasa Indonesia formal-akademis.
- Timestamp harus akurat berdasarkan konten.`;

export interface PostLiveResult {
  success: boolean;
  content?: string;       // Full markdown output
  summary?: string;       // Extracted summary section
  faqCount?: number;      // Number of FAQ items generated
  quizCount?: number;     // Number of quiz items generated
  tokens?: number;
  cached?: number;
  latencyMs?: number;
  error?: string;
}

/**
 * Process a live session recording via Gemini
 * 
 * @param sessionTitle - Title of the live session
 * @param transcript - Full transcript or description of the session content
 * @param userId - User ID for logging
 * @param duration - Duration in minutes (for context)
 */
export async function processPostLiveSession(
  sessionTitle: string,
  transcript: string,
  userId: string,
  duration?: number
): Promise<PostLiveResult> {
  const startTime = Date.now();

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{
        role: 'user',
        parts: [{
          text: `${SYSTEM_PROMPT}\n\n---\nJUDUL SESI: ${sessionTitle}\nDURASI: ${duration || 'tidak diketahui'} menit\n---\nTRANSKRIP/KONTEN SESI:\n${transcript}\n---\nHasilkan output lengkap sesuai format di atas.`,
        }],
      }],
      config: {
        maxOutputTokens: 4000,
        temperature: 0.2, // Low temperature for factual extraction
      },
    });

    const latencyMs = Date.now() - startTime;
    const content = response.text ?? '';
    const metadata = response.usageMetadata;

    // Log to analytics
    const tokenData = {
      userId,
      promptTokens: metadata?.promptTokenCount ?? 0,
      completionTokens: metadata?.candidatesTokenCount ?? 0,
      totalTokens: metadata?.totalTokenCount ?? 0,
      cachedTokens: metadata?.cachedContentTokenCount ?? 0,
      latencyMs,
      workflowTag: 'post_live_automation',
    };

    db.insert(aiInteractionLogs).values(tokenData).catch(err => {
      console.error('[Post-Live] Log insert failed:', err);
    });

    // Parse output sections
    const summaryMatch = content.match(/## 1\. RINGKASAN MATERI([\s\S]*?)(?=## 2\.|$)/);
    const faqMatch = content.match(/\*\*\[\d{2}:\d{2}:\d{2}\]\*\*/g);
    const quizMatch = content.match(/\*\*Soal \d+\.\*\*/g);

    return {
      success: true,
      content,
      summary: summaryMatch ? summaryMatch[1].trim() : undefined,
      faqCount: faqMatch ? faqMatch.length : 0,
      quizCount: quizMatch ? quizMatch.length : 0,
      tokens: tokenData.totalTokens,
      cached: tokenData.cachedTokens,
      latencyMs,
    };
  } catch (error: any) {
    const latencyMs = Date.now() - startTime;
    console.error('[Post-Live] Processing error:', error?.message);

    // Log error
    db.insert(aiInteractionLogs).values({
      userId,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      cachedTokens: 0,
      latencyMs,
      workflowTag: 'post_live_automation_error',
    }).catch(() => {});

    return {
      success: false,
      error: error?.message || 'Gagal memproses rekaman sesi',
      latencyMs,
    };
  }
}

/**
 * Process a video URL directly (for future use with Gemini multimodal)
 * Currently accepts transcript text. When Gemini File API is integrated,
 * this can accept video/audio files directly.
 */
export async function processVideoRecording(
  videoUrl: string,
  sessionTitle: string,
  userId: string
): Promise<PostLiveResult> {
  // For MVP: This would be called after a transcription service
  // processes the video. In production with Gemini 1.5 Pro,
  // the video file can be sent directly to the model.
  
  return {
    success: false,
    error: 'Direct video processing requires Gemini File API integration. Use processPostLiveSession() with transcript for now.',
  };
}
