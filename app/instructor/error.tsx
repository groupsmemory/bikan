'use client';

/**
 * BIKAN Instructor Route Error Boundary
 * ───────────────────────────────────────
 * Catches errors in /instructor routes
 */

import React from 'react';
import { Shield, RotateCcw } from 'lucide-react';

export default function InstructorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-base p-6">
      <div className="max-w-sm text-center space-y-5">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-muted-blue/10 flex items-center justify-center">
          <Shield className="w-7 h-7 text-muted-blue/60" />
        </div>
        <h2 className="text-lg font-bold text-muted-blue">Dashboard Error</h2>
        <p className="text-sm text-muted-blue/50 leading-relaxed">
          Terjadi kesalahan saat memuat dashboard instruktur. Data siswa dan bank soal tetap aman di database.
        </p>
        {error.digest && (
          <p className="text-[9px] font-mono text-muted-blue/20">ref: {error.digest}</p>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-tactical-orange text-white text-xs font-bold hover:scale-105 transition-transform"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Muat Ulang
          </button>
          <a
            href="/"
            className="px-5 py-2.5 rounded-xl border border-muted-blue/10 text-xs font-bold text-muted-blue/60 hover:bg-muted-blue/5 transition-colors"
          >
            Ke Beranda
          </a>
        </div>
      </div>
    </div>
  );
}
