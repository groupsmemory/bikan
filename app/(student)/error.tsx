'use client';

/**
 * BIKAN Student Route Error Boundary
 * ────────────────────────────────────
 * Catches errors in /learn, /dashboard routes
 * tanpa meng-crash seluruh app
 */

import React from 'react';
import { BookOpen, RotateCcw } from 'lucide-react';

export default function StudentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="max-w-sm text-center space-y-5">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-tactical-orange/10 flex items-center justify-center">
          <BookOpen className="w-7 h-7 text-tactical-orange" />
        </div>
        <h2 className="text-lg font-bold text-muted-blue">Oops, Ada Gangguan</h2>
        <p className="text-sm text-muted-blue/50 leading-relaxed">
          Halaman belajar mengalami masalah. Materi dan progress Anda tetap aman.
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
            Coba Lagi
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
