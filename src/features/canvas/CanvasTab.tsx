/**
 * BIKAN Canvas Tab - Interactive Quadratic Graph
 */

'use client';

import React from 'react';
import { Calculator, Sliders } from 'lucide-react';
import { QuadraticCanvas } from './QuadraticCanvas';

interface CanvasTabProps {
  config: { a: number; b: number; c: number };
  setConfig: (config: { a: number; b: number; c: number }) => void;
  isDark: boolean;
}

export const CanvasTab: React.FC<CanvasTabProps> = ({ config, setConfig, isDark }) => {
  return (
    <div className="w-full flex flex-col md:flex-row gap-8 items-center">
      <QuadraticCanvas a={config.a} b={config.b} c={config.c} isDark={isDark} />

      <div className="flex-1 w-full space-y-6">
        <div className="soft-ui-card p-6 bg-white/50 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Sliders className="w-4 h-4 text-tactical-orange" />
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-blue/60">Coefficient Control</h4>
          </div>

          {(['a', 'b', 'c'] as const).map((param) => (
            <div key={param} className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold">
                <span className="uppercase">{param} Variable</span>
                <span className="text-tactical-orange">{config[param]}</span>
              </div>
              <input
                type="range"
                min={param === 'a' ? -10 : -20}
                max={param === 'a' ? 10 : 20}
                step="0.1"
                value={config[param]}
                onChange={(e) => setConfig({ ...config, [param]: parseFloat(e.target.value) || 0.1 })}
                className="w-full h-1.5 bg-muted-blue/5 rounded-full appearance-none cursor-pointer accent-tactical-orange"
              />
            </div>
          ))}
        </div>

        <div className="p-4 bg-muted-blue/5 rounded-2xl border border-muted-blue/10 flex items-center gap-3">
          <Calculator className="w-5 h-5 text-muted-blue/40" />
          <p className="text-[11px] leading-relaxed text-muted-blue/60 font-medium">
            Ubah nilai <span className="font-bold text-tactical-orange">a</span> untuk melihat efek kelengkungan, dan <span className="font-bold text-tactical-orange">c</span> untuk pergeseran vertikal.
          </p>
        </div>
      </div>
    </div>
  );
};
