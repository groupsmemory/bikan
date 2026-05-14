/**
 * BIKAN Post-Live Automation Panel
 * ─────────────────────────────────
 * UI untuk memproses rekaman sesi live teaching
 * Menghasilkan: ringkasan, FAQ, kuis formatif
 */

'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { processPostLiveSession, PostLiveResult } from '@/app/actions/post-live';

interface PostLivePanelProps {
  userId: string;
}

export const PostLivePanel: React.FC<PostLivePanelProps> = ({ userId }) => {
  const [sessionTitle, setSessionTitle] = useState('');
  const [transcript, setTranscript] = useState('');
  const [duration, setDuration] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<PostLiveResult | null>(null);

  const handleProcess = async () => {
    if (!sessionTitle.trim() || !transcript.trim()) return;

    setIsProcessing(true);
    setResult(null);

    const res = await processPostLiveSession(
      sessionTitle.trim(),
      transcript.trim(),
      userId,
      duration ? parseInt(duration) : undefined
    );

    setResult(res);
    setIsProcessing(false);
  };

  return (
    <div className="w-full space-y-4 text-left">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-tactical-red animate-pulse" />
        <h3 className="text-sm font-bold">Post-Live Automation</h3>
      </div>
      <p className="text-[11px] text-muted-blue/50 leading-relaxed">
        Paste transkrip sesi live teaching di bawah. Sistem akan otomatis menghasilkan ringkasan materi, FAQ berbasis timestamp, dan kuis formatif.
      </p>

      {/* Input Form */}
      {!result && (
        <div className="space-y-3">
          <input
            type="text"
            value={sessionTitle}
            onChange={(e) => setSessionTitle(e.target.value)}
            placeholder="Judul sesi (cth: Pengantar Fungsi Kuadrat)"
            className="w-full px-3 py-2 rounded-lg border border-muted-blue/10 bg-muted-blue/5 text-sm focus:outline-none focus:ring-2 focus:ring-tactical-orange/50"
          />
          <div className="flex gap-2">
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="Durasi (menit)"
              className="w-28 px-3 py-2 rounded-lg border border-muted-blue/10 bg-muted-blue/5 text-sm focus:outline-none focus:ring-2 focus:ring-tactical-orange/50"
            />
            <span className="self-center text-[10px] text-muted-blue/30">opsional</span>
          </div>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Paste transkrip sesi live di sini...&#10;&#10;Contoh:&#10;[00:00] Selamat pagi, hari ini kita akan membahas fungsi kuadrat...&#10;[05:00] Bentuk umum f(x) = ax² + bx + c dimana a ≠ 0..."
            rows={6}
            className="w-full px-3 py-2 rounded-lg border border-muted-blue/10 bg-muted-blue/5 text-sm focus:outline-none focus:ring-2 focus:ring-tactical-orange/50 resize-none"
          />
          <button
            onClick={handleProcess}
            disabled={isProcessing || !sessionTitle.trim() || !transcript.trim()}
            className="w-full py-3 rounded-xl bg-tactical-orange text-white text-xs font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Memproses dengan Gemini...
              </span>
            ) : (
              '⚡ Generate Ringkasan + FAQ + Kuis'
            )}
          </button>
        </div>
      )}

      {/* Result Display */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          {result.success ? (
            <>
              {/* Stats */}
              <div className="flex gap-2 flex-wrap">
                <span className="text-[9px] font-bold bg-muted-green/10 text-muted-green px-2 py-1 rounded">
                  ✓ FAQ: {result.faqCount} items
                </span>
                <span className="text-[9px] font-bold bg-tactical-orange/10 text-tactical-orange px-2 py-1 rounded">
                  ✓ Kuis: {result.quizCount} soal
                </span>
                <span className="text-[9px] font-mono text-muted-blue/30 px-2 py-1">
                  {result.tokens} tokens • {result.cached} cached • {result.latencyMs}ms
                </span>
              </div>

              {/* Markdown Output */}
              <div className="max-h-[400px] overflow-y-auto p-4 rounded-xl bg-muted-blue/5 border border-muted-blue/10">
                <pre className="text-[11px] leading-relaxed whitespace-pre-wrap font-mono text-muted-blue/80">
                  {result.content}
                </pre>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(result.content || '');
                  }}
                  className="flex-1 py-2 rounded-lg bg-muted-blue/5 text-xs font-bold text-muted-blue/60 hover:bg-muted-blue/10 transition-colors"
                >
                  📋 Copy Markdown
                </button>
                <button
                  onClick={() => setResult(null)}
                  className="flex-1 py-2 rounded-lg bg-muted-blue/5 text-xs font-bold text-muted-blue/60 hover:bg-muted-blue/10 transition-colors"
                >
                  🔄 Proses Sesi Lain
                </button>
              </div>
            </>
          ) : (
            <div className="p-3 rounded-lg bg-tactical-red/5 border border-tactical-red/10">
              <p className="text-xs text-tactical-red">{result.error}</p>
              <button
                onClick={() => setResult(null)}
                className="mt-2 text-[10px] text-muted-blue/50 underline"
              >
                Coba lagi
              </button>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};
