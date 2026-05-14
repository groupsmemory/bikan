/**
 * BIKAN Real-Time LaTeX Formula Display
 * Renders quadratic equation f(x) = ax² + bx + c using KaTeX
 * Updates reactively when slider coefficients change (<80ms latency target per PRD US-ALG-002)
 */

import React, { useRef, useEffect, useMemo } from 'react';

interface LatexFormulaProps {
  a: number;
  b: number;
  c: number;
}

/**
 * Builds a clean LaTeX string for the quadratic function.
 * Handles sign formatting: suppresses "+0" terms, shows "-" naturally, etc.
 */
function buildQuadraticLatex(a: number, b: number, c: number): string {
  const parts: string[] = [];

  // Term ax²
  if (a !== 0) {
    if (a === 1) parts.push('x^2');
    else if (a === -1) parts.push('-x^2');
    else parts.push(`${a}x^2`);
  }

  // Term bx
  if (b !== 0) {
    if (parts.length === 0) {
      // Leading term
      if (b === 1) parts.push('x');
      else if (b === -1) parts.push('-x');
      else parts.push(`${b}x`);
    } else {
      if (b === 1) parts.push('+ x');
      else if (b === -1) parts.push('- x');
      else if (b > 0) parts.push(`+ ${b}x`);
      else parts.push(`- ${Math.abs(b)}x`);
    }
  }

  // Term c
  if (c !== 0) {
    if (parts.length === 0) {
      parts.push(`${c}`);
    } else {
      if (c > 0) parts.push(`+ ${c}`);
      else parts.push(`- ${Math.abs(c)}`);
    }
  }

  // Edge case: all zero
  if (parts.length === 0) parts.push('0');

  return `f(x) = ${parts.join(' ')}`;
}

/**
 * Builds LaTeX for the discriminant display
 */
function buildDiscriminantLatex(a: number, b: number, c: number): string {
  const D = b * b - 4 * a * c;
  return `\\Delta = b^2 - 4ac = ${b}^2 - 4(${a})(${c}) = ${D.toFixed(2)}`;
}

/**
 * Builds LaTeX for the vertex coordinates
 */
function buildVertexLatex(a: number, b: number, c: number): string {
  if (a === 0) return '\\text{(bukan parabola, } a = 0\\text{)}';
  const vx = -b / (2 * a);
  const vy = c - (b * b) / (4 * a);
  return `\\text{Titik Puncak: } \\left( ${vx.toFixed(2)},\\ ${vy.toFixed(2)} \\right)`;
}

export const LatexFormula: React.FC<LatexFormulaProps> = ({ a, b, c }) => {
  const formulaRef = useRef<HTMLDivElement>(null);
  const discriminantRef = useRef<HTMLDivElement>(null);
  const vertexRef = useRef<HTMLDivElement>(null);

  // Memoize LaTeX strings to avoid unnecessary re-renders
  const formulaLatex = useMemo(() => buildQuadraticLatex(a, b, c), [a, b, c]);
  const discriminantLatex = useMemo(() => buildDiscriminantLatex(a, b, c), [a, b, c]);
  const vertexLatex = useMemo(() => buildVertexLatex(a, b, c), [a, b, c]);

  useEffect(() => {
    const katex = (window as any).katex;
    if (!katex) return;

    if (formulaRef.current) {
      katex.render(formulaLatex, formulaRef.current, {
        throwOnError: false,
        displayMode: true,
      });
    }

    if (discriminantRef.current) {
      katex.render(discriminantLatex, discriminantRef.current, {
        throwOnError: false,
        displayMode: false,
      });
    }

    if (vertexRef.current) {
      katex.render(vertexLatex, vertexRef.current, {
        throwOnError: false,
        displayMode: false,
      });
    }
  }, [formulaLatex, discriminantLatex, vertexLatex]);

  const D = b * b - 4 * a * c;

  return (
    <div className="mt-4 p-4 bg-white/80 rounded-2xl border border-muted-blue/10 space-y-3">
      {/* Main formula - prominent display */}
      <div
        ref={formulaRef}
        className="text-center text-lg text-muted-blue font-medium"
        aria-label={`Fungsi kuadrat: f(x) = ${a}x² + ${b}x + ${c}`}
      />

      {/* Discriminant and Vertex - secondary info */}
      <div className="flex flex-col sm:flex-row sm:justify-between gap-2 pt-2 border-t border-muted-blue/5">
        <div
          ref={discriminantRef}
          className="text-xs text-muted-blue/70"
          aria-label={`Diskriminan: ${D.toFixed(2)}`}
        />
        <div
          ref={vertexRef}
          className="text-xs text-muted-blue/70"
          aria-label={`Titik puncak parabola`}
        />
      </div>

      {/* Discriminant interpretation badge */}
      <div className="flex items-center gap-2">
        <span className={`inline-block w-2 h-2 rounded-full ${
          D > 0 ? 'bg-muted-green' : D === 0 ? 'bg-tactical-orange' : 'bg-tactical-red'
        }`} />
        <span className="text-[10px] font-medium text-muted-blue/50 uppercase tracking-wider">
          {D > 0 && 'Dua akar real berbeda'}
          {D === 0 && 'Satu akar real kembar'}
          {D < 0 && 'Tidak memiliki akar real'}
        </span>
      </div>
    </div>
  );
};
