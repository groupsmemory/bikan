/**
 * BIKAN Diagnostics Workspace
 * ────────────────────────────
 * PRD US-ALG-003: Area input teks yang mengenali dan mem-parsing
 * karakter notasi matematika secara dinamis per baris pengerjaan.
 *
 * Features:
 * - Line-by-line math input with real-time error detection
 * - Red pastel (#FFECEC) highlight on error lines
 * - Haptic feedback on error detection
 * - Inline error messages with scaffolding hints
 * - Supports quadratic equations, factoring, discriminant, roots
 */

'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, CheckCircle, Lightbulb, Trash2, RotateCcw } from 'lucide-react';
import { validateStudentWork, DiagnosticError } from './error-detector';

interface DiagnosticsWorkspaceProps {
  /** Lesson context for problem setup */
  problemStatement?: string;
  /** Callback when student completes work correctly */
  onCorrectSolution?: () => void;
}

// ─── Preset Problems for Practice ───
const PRESET_PROBLEMS = [
  {
    id: 'factor-1',
    title: 'Pemfaktoran Dasar',
    statement: 'Faktorkan dan cari akar: x² + 5x + 6 = 0',
    hint: 'Cari dua bilangan yang jumlahnya 5 dan hasilkalinya 6',
  },
  {
    id: 'factor-2',
    title: 'Pemfaktoran Negatif',
    statement: 'Faktorkan dan cari akar: x² - 3x - 10 = 0',
    hint: 'Cari dua bilangan yang jumlahnya -3 dan hasilkalinya -10',
  },
  {
    id: 'discriminant-1',
    title: 'Diskriminan',
    statement: 'Tentukan jenis akar: 2x² + 4x + 2 = 0',
    hint: 'Hitung D = b² - 4ac terlebih dahulu',
  },
  {
    id: 'quadratic-formula',
    title: 'Rumus Kuadratik',
    statement: 'Selesaikan dengan rumus abc: x² - 6x + 5 = 0',
    hint: 'x = (-b ± √D) / 2a',
  },
];

export const DiagnosticsWorkspace: React.FC<DiagnosticsWorkspaceProps> = ({
  problemStatement,
  onCorrectSolution,
}) => {
  const [lines, setLines] = useState<string[]>(['']);
  const [errors, setErrors] = useState<DiagnosticError[]>([]);
  const [activeProblem, setActiveProblem] = useState(PRESET_PROBLEMS[0]);
  const [showHints, setShowHints] = useState<Set<number>>(new Set());
  const [isValidating, setIsValidating] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Real-time Validation (debounced) ───
  const runValidation = useCallback((currentLines: string[]) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      setIsValidating(true);
      const { errors: newErrors } = validateStudentWork(currentLines);
      setErrors(newErrors);
      setIsValidating(false);

      // Haptic feedback on new errors (PRD: getaran haptik halus)
      if (newErrors.some(e => e.severity === 'error')) {
        if (navigator.vibrate) {
          navigator.vibrate([60, 40, 60]);
        }
      }

      // Check if solution is correct (no errors and has roots declared)
      const hasContent = currentLines.some(l => l.trim().length > 0);
      const hasRoots = currentLines.some(l => /x\s*=/.test(l));
      if (hasContent && hasRoots && newErrors.length === 0) {
        onCorrectSolution?.();
      }
    }, 400); // 400ms debounce for real-time feel without overwhelming
  }, [onCorrectSolution]);

  // ─── Line Change Handler ───
  const handleLineChange = (index: number, value: string) => {
    const newLines = [...lines];
    newLines[index] = value;
    setLines(newLines);
    runValidation(newLines);
  };

  // ─── Key Handlers ───
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Add new line below
      const newLines = [...lines];
      newLines.splice(index + 1, 0, '');
      setLines(newLines);
      // Focus new line
      setTimeout(() => inputRefs.current[index + 1]?.focus(), 50);
    } else if (e.key === 'Backspace' && lines[index] === '' && lines.length > 1) {
      e.preventDefault();
      // Remove empty line
      const newLines = lines.filter((_, i) => i !== index);
      setLines(newLines);
      runValidation(newLines);
      // Focus previous line
      setTimeout(() => inputRefs.current[Math.max(0, index - 1)]?.focus(), 50);
    } else if (e.key === 'ArrowUp' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowDown' && index < lines.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // ─── Get errors for a specific line ───
  const getLineErrors = (lineIndex: number): DiagnosticError[] => {
    return errors.filter(e => e.lineIndex === lineIndex);
  };

  // ─── Reset workspace ───
  const handleReset = () => {
    setLines(['']);
    setErrors([]);
    setShowHints(new Set());
  };

  // ─── Toggle hint visibility ───
  const toggleHint = (lineIndex: number) => {
    setShowHints(prev => {
      const next = new Set(prev);
      if (next.has(lineIndex)) next.delete(lineIndex);
      else next.add(lineIndex);
      return next;
    });
  };

  return (
    <div className="w-full space-y-6 text-left">
      {/* Problem Statement */}
      <div className="soft-ui-card p-5 border-l-4 border-tactical-orange">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-blue/40 mb-1">
              Soal — {activeProblem.title}
            </p>
            <p className="text-sm font-bold text-muted-blue">
              {problemStatement || activeProblem.statement}
            </p>
            <p className="text-[10px] text-muted-blue/50 mt-1 italic">
              💡 {activeProblem.hint}
            </p>
          </div>
          <button
            onClick={handleReset}
            className="p-2 rounded-lg hover:bg-muted-blue/5 transition-colors"
            title="Reset"
          >
            <RotateCcw className="w-4 h-4 text-muted-blue/40" />
          </button>
        </div>
      </div>

      {/* Problem Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {PRESET_PROBLEMS.map((prob) => (
          <button
            key={prob.id}
            onClick={() => { setActiveProblem(prob); handleReset(); }}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all ${
              activeProblem.id === prob.id
                ? 'bg-tactical-orange text-white'
                : 'bg-muted-blue/5 text-muted-blue/60 hover:bg-muted-blue/10'
            }`}
          >
            {prob.title}
          </button>
        ))}
      </div>

      {/* Workspace Lines */}
      <div className="space-y-1 font-mono">
        {lines.map((line, index) => {
          const lineErrors = getLineErrors(index);
          const hasError = lineErrors.some(e => e.severity === 'error');
          const hasWarning = lineErrors.some(e => e.severity === 'warning');

          return (
            <div key={index} className="group">
              {/* Input Line */}
              <div
                className={`flex items-center gap-2 rounded-xl px-3 py-2 transition-all duration-300 ${
                  hasError
                    ? 'bg-[#FFECEC] border border-tactical-red/30 error-pendaran'
                    : hasWarning
                    ? 'bg-amber-50 border border-amber-200/50'
                    : line.trim()
                    ? 'bg-muted-green/5 border border-muted-green/10'
                    : 'bg-white/50 border border-transparent hover:border-muted-blue/10'
                }`}
              >
                {/* Line Number */}
                <span className="text-[10px] font-bold text-muted-blue/30 w-5 text-right select-none">
                  {index + 1}
                </span>

                {/* Status Icon */}
                <span className="w-4 flex-shrink-0">
                  {hasError && <AlertTriangle className="w-3.5 h-3.5 text-tactical-red" />}
                  {!hasError && hasWarning && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                  {!hasError && !hasWarning && line.trim() && <CheckCircle className="w-3.5 h-3.5 text-muted-green/60" />}
                </span>

                {/* Input */}
                <input
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  value={line}
                  onChange={(e) => handleLineChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  placeholder={index === 0 ? 'Tulis langkah pertama di sini...' : 'Langkah berikutnya...'}
                  className="flex-1 bg-transparent outline-none text-sm text-muted-blue placeholder:text-muted-blue/20 font-mono"
                  autoComplete="off"
                  spellCheck={false}
                />

                {/* Hint toggle button (only show if there are errors) */}
                {lineErrors.length > 0 && (
                  <button
                    onClick={() => toggleHint(index)}
                    className="p-1 rounded-md hover:bg-white/50 transition-colors"
                    title="Lihat petunjuk"
                  >
                    <Lightbulb className={`w-3.5 h-3.5 ${showHints.has(index) ? 'text-tactical-orange' : 'text-muted-blue/30'}`} />
                  </button>
                )}

                {/* Delete line button */}
                {lines.length > 1 && (
                  <button
                    onClick={() => {
                      const newLines = lines.filter((_, i) => i !== index);
                      setLines(newLines);
                      runValidation(newLines);
                    }}
                    className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-tactical-red/10 transition-all"
                    title="Hapus baris"
                  >
                    <Trash2 className="w-3 h-3 text-tactical-red/50" />
                  </button>
                )}
              </div>

              {/* Error Messages */}
              <AnimatePresence>
                {lineErrors.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="ml-10 mt-1 space-y-1"
                  >
                    {lineErrors.map((err, errIdx) => (
                      <div
                        key={errIdx}
                        className={`text-[10px] px-3 py-1.5 rounded-lg ${
                          err.severity === 'error'
                            ? 'text-tactical-red bg-tactical-red/5'
                            : 'text-amber-700 bg-amber-50'
                        }`}
                      >
                        <span className="font-bold">
                          {err.severity === 'error' ? '✗' : '⚠'} {err.message}
                        </span>

                        {/* Scaffolding Hint (expandable) */}
                        <AnimatePresence>
                          {showHints.has(index) && (
                            <motion.p
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-1 text-muted-blue/60 italic border-l-2 border-tactical-orange/30 pl-2"
                            >
                              💡 {err.hint}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Add Line Button */}
      <button
        onClick={() => {
          setLines([...lines, '']);
          setTimeout(() => inputRefs.current[lines.length]?.focus(), 50);
        }}
        className="w-full py-2 rounded-xl border-2 border-dashed border-muted-blue/10 text-[10px] font-bold text-muted-blue/30 hover:border-tactical-orange/30 hover:text-tactical-orange/60 transition-all"
      >
        + Tambah Langkah (atau tekan Enter)
      </button>

      {/* Status Bar */}
      <div className="flex items-center justify-between text-[9px] font-mono text-muted-blue/30 px-2">
        <span>
          {lines.filter(l => l.trim()).length} langkah •{' '}
          {errors.filter(e => e.severity === 'error').length} error •{' '}
          {errors.filter(e => e.severity === 'warning').length} warning
        </span>
        <span className={isValidating ? 'text-tactical-orange' : ''}>
          {isValidating ? '⟳ validating...' : '✓ real-time check active'}
        </span>
      </div>

      {/* Usage Guide */}
      <div className="p-4 bg-muted-blue/5 rounded-xl text-[10px] text-muted-blue/50 space-y-1">
        <p className="font-bold text-muted-blue/60">Format Penulisan:</p>
        <ul className="space-y-0.5 ml-3 list-disc">
          <li><code className="bg-white/50 px-1 rounded">x^2 + 5x + 6 = 0</code> — Persamaan kuadrat</li>
          <li><code className="bg-white/50 px-1 rounded">(x + 2)(x + 3) = 0</code> — Bentuk faktor</li>
          <li><code className="bg-white/50 px-1 rounded">D = 5^2 - 4*1*6 = 1</code> — Diskriminan</li>
          <li><code className="bg-white/50 px-1 rounded">x = -2</code> atau <code className="bg-white/50 px-1 rounded">x = -3</code> — Akar persamaan</li>
        </ul>
      </div>
    </div>
  );
};
