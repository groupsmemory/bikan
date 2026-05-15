'use client';

/**
 * BIKAN Global Error Boundary
 * ────────────────────────────
 * Catches unhandled errors in the app and shows a friendly UI
 */

import React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-base p-6">
      <div className="max-w-md text-center space-y-6">
        <div className="text-5xl">⚠️</div>
        <h1 className="text-xl font-bold text-muted-blue">Terjadi Kesalahan</h1>
        <p className="text-sm text-muted-blue/50">
          Maaf, terjadi kesalahan yang tidak terduga. Tim kami sudah diberitahu.
        </p>
        {error.digest && (
          <p className="text-[9px] font-mono text-muted-blue/30">
            Error ID: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="px-6 py-3 rounded-xl bg-tactical-orange text-white text-sm font-bold hover:scale-105 transition-transform"
        >
          Coba Lagi
        </button>
        <p className="text-[10px] text-muted-blue/30">
          Jika masalah berlanjut, hubungi support@bikan.co.id
        </p>
      </div>
    </div>
  );
}
