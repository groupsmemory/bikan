'use client';

/**
 * BIKAN Dev Dashboard Error Boundary
 */

import React from 'react';
import { Code, RotateCcw } from 'lucide-react';

export default function DevError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F172A] p-6">
      <div className="max-w-sm text-center space-y-5">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-tactical-red/10 flex items-center justify-center">
          <Code className="w-7 h-7 text-tactical-red" />
        </div>
        <h2 className="text-lg font-bold text-[#F1F5F9]">Dev Dashboard Error</h2>
        <p className="text-sm text-[#94A3B8] leading-relaxed">
          {error.message || 'Unexpected error in dev dashboard.'}
        </p>
        {error.digest && (
          <p className="text-[9px] font-mono text-[#475569]">ref: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="flex items-center gap-2 mx-auto px-5 py-2.5 rounded-xl bg-tactical-orange text-white text-xs font-bold hover:scale-105 transition-transform"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Retry
        </button>
      </div>
    </div>
  );
}
