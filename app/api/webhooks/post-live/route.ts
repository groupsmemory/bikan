/**
 * BIKAN Post-Live Webhook — Automated Recording Processing
 * ──────────────────────────────────────────────────────────
 * Route: POST /api/webhooks/post-live
 *
 * Receives webhook from live streaming providers (Livepeer, Mux, etc.)
 * after a live session ends. Triggers automated processing:
 * 1. Extract transcript/metadata from payload
 * 2. Send to Gemini for summary, FAQ, and quiz generation
 * 3. Store results for student access
 *
 * PRD Requirements:
 * - Kompartemen mikro 10-12 menit
 * - Otomatisasi < 5 menit pasca-siaran
 * - Output: Ringkasan Markdown, FAQ timestamp, Kuis formatif
 *
 * Payload size: Configured for large payloads (transcript text, not video binary)
 * Video binary is NOT sent here — only metadata + transcript URL
 */

import { NextRequest, NextResponse } from 'next/server';
import { processPostLiveSession } from '@/app/actions/post-live';

// Webhook secret for authentication
const WEBHOOK_SECRET = process.env.POST_LIVE_WEBHOOK_SECRET || process.env.SESSION_SECRET || '';

// ─── Payload Types (compatible with Livepeer/Mux webhook formats) ───
interface LiveSessionPayload {
  /** Event type from provider */
  event: 'recording.ready' | 'stream.ended' | 'asset.ready';
  /** Session/stream ID */
  streamId: string;
  /** Session title */
  title?: string;
  /** Duration in seconds */
  duration?: number;
  /** Recording URL (for future Gemini File API) */
  recordingUrl?: string;
  /** Transcript text (if transcription service already processed) */
  transcript?: string;
  /** Transcript URL (fetch separately) */
  transcriptUrl?: string;
  /** Instructor/host user ID */
  userId?: string;
  /** Timestamp segments (for micro-compartment splitting) */
  segments?: Array<{
    startTime: number;
    endTime: number;
    title?: string;
  }>;
  /** Metadata */
  metadata?: Record<string, string>;
}

export async function POST(request: NextRequest) {
  // ─── Auth: Verify webhook secret ───
  const authHeader = request.headers.get('authorization');
  const webhookSecret = request.headers.get('x-webhook-secret');

  if (webhookSecret !== WEBHOOK_SECRET && authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload: LiveSessionPayload = await request.json();

    console.log(`[Post-Live Webhook] Received: ${payload.event} for stream ${payload.streamId}`);

    // ─── Validate payload ───
    if (!payload.event || !payload.streamId) {
      return NextResponse.json(
        { error: 'Missing required fields: event, streamId' },
        { status: 400 }
      );
    }

    // Only process recording-ready events
    if (!['recording.ready', 'stream.ended', 'asset.ready'].includes(payload.event)) {
      return NextResponse.json({ status: 'ignored', event: payload.event });
    }

    // ─── Get transcript ───
    let transcript = payload.transcript || '';

    // If transcript URL provided, fetch it
    if (!transcript && payload.transcriptUrl) {
      try {
        const res = await fetch(payload.transcriptUrl);
        if (res.ok) {
          transcript = await res.text();
        }
      } catch (err) {
        console.error('[Post-Live Webhook] Failed to fetch transcript:', err);
      }
    }

    if (!transcript) {
      return NextResponse.json(
        { error: 'No transcript available. Provide transcript or transcriptUrl.' },
        { status: 422 }
      );
    }

    // ─── Split into micro-compartments if > 12 minutes ───
    const durationMinutes = payload.duration ? payload.duration / 60 : 0;
    const COMPARTMENT_LIMIT = 12; // minutes

    if (durationMinutes > COMPARTMENT_LIMIT && payload.segments && payload.segments.length > 1) {
      // Process each segment separately for better quality
      const results = [];
      for (const segment of payload.segments) {
        const segmentTranscript = transcript.substring(
          Math.floor((segment.startTime / (payload.duration || 1)) * transcript.length),
          Math.floor((segment.endTime / (payload.duration || 1)) * transcript.length)
        );

        const result = await processPostLiveSession(
          `${payload.title || 'Live Session'} — ${segment.title || `Segment ${segment.startTime}s`}`,
          segmentTranscript,
          payload.userId || 'system',
          Math.round((segment.endTime - segment.startTime) / 60)
        );
        results.push(result);
      }

      return NextResponse.json({
        status: 'processed',
        streamId: payload.streamId,
        segments: results.length,
        results: results.map(r => ({
          success: r.success,
          faqCount: r.faqCount,
          quizCount: r.quizCount,
          latencyMs: r.latencyMs,
        })),
      });
    }

    // ─── Process full session ───
    const result = await processPostLiveSession(
      payload.title || `Live Session ${payload.streamId}`,
      transcript,
      payload.userId || 'system',
      durationMinutes || undefined
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, streamId: payload.streamId },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 'processed',
      streamId: payload.streamId,
      summary: result.summary?.substring(0, 200) + '...',
      faqCount: result.faqCount,
      quizCount: result.quizCount,
      tokens: result.tokens,
      cached: result.cached,
      latencyMs: result.latencyMs,
    });
  } catch (error: any) {
    console.error('[Post-Live Webhook] Error:', error?.message);
    return NextResponse.json(
      { error: error?.message || 'Internal error' },
      { status: 500 }
    );
  }
}

// ─── GET: Health check ───
export async function GET() {
  return NextResponse.json({
    service: 'BIKAN Post-Live Webhook',
    status: 'ready',
    accepts: ['recording.ready', 'stream.ended', 'asset.ready'],
    maxPayloadSize: '4MB (transcript text)',
    processingTarget: '< 5 minutes',
    output: ['summary (markdown)', 'FAQ (timestamped)', 'quiz (5 MCQ)'],
  });
}
