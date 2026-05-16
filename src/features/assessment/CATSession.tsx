/**
 * BIKAN CAT Session — Full Adaptive Testing UI
 * ──────────────────────────────────────────────
 * Computerized Adaptive Testing with:
 * - Real-time theta estimation + SE tracking
 * - Visual confidence interval
 * - Stopping rule indicators
 * - Session persistence (localStorage)
 * - Theta trajectory graph
 * - Detailed session report
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, TrendingUp, Clock, Award, RotateCcw, ChevronRight } from 'lucide-react';
import {
  createCATSession,
  processResponse,
  selectNextItem,
  generateReport,
  thetaToLabel,
  DEFAULT_CAT_CONFIG,
  CATSessionState,
  CATReport,
} from '@/lib/ai/cat-engine';
import { ItemParameters } from '@/lib/ai/irt-engine';

// ─── Props ───
interface CATSessionProps {
  userId: string;
  moduleSlug: string;
  /** Initial theta from database (personalization) */
  initialTheta?: number;
  /** Callback when session completes */
  onComplete?: (report: CATReport) => void;
  /** Callback on each response (for parent state updates) */
  onProgress?: (state: { theta: number; mastery: number; count: number; status: string }) => void;
}

// ─── Item from DB ───
interface DBItem {
  id: string;
  question: string;
  options: { label: string; key: string }[];
  correctOption: string;
  params: ItemParameters;
  bloomLevel: string | null;
}

// ─── Storage key for session persistence ───
const getSessionKey = (userId: string, moduleSlug: string) =>
  `bikan-cat-${userId}-${moduleSlug}`;

export const CATSession: React.FC<CATSessionProps> = ({
  userId,
  moduleSlug,
  initialTheta = 0,
  onComplete,
  onProgress,
}) => {
  const [items, setItems] = useState<DBItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<CATSessionState | null>(null);
  const [currentItem, setCurrentItem] = useState<DBItem | null>(null);
  const [feedback, setFeedback] = useState<{ correct: boolean; theta: number; se: number } | null>(null);
  const [showErrorGlow, setShowErrorGlow] = useState(false);
  const [report, setReport] = useState<CATReport | null>(null);
  const [itemStartTime, setItemStartTime] = useState(Date.now());

  const sessionRef = useRef<CATSessionState | null>(null);

  // ─── Load items from DB ───
  useEffect(() => {
    async function loadItems() {
      setLoading(true);
      const { getItemsByModule } = await import('@/app/actions/assessment');
      const dbItems = await getItemsByModule(moduleSlug);
      setItems(dbItems);
      setLoading(false);
    }
    loadItems();
  }, [moduleSlug]);

  // ─── Initialize or restore session ───
  useEffect(() => {
    if (items.length === 0) return;

    // Try to restore from localStorage
    const storageKey = getSessionKey(userId, moduleSlug);
    const saved = localStorage.getItem(storageKey);

    let catSession: CATSessionState;

    if (saved) {
      try {
        const parsed = JSON.parse(saved) as CATSessionState;
        // Only restore if session is still in progress
        if (parsed.status === 'in_progress') {
          catSession = parsed;
        } else {
          catSession = createCATSession(initialTheta, DEFAULT_CAT_CONFIG);
        }
      } catch {
        catSession = createCATSession(initialTheta, DEFAULT_CAT_CONFIG);
      }
    } else {
      catSession = createCATSession(initialTheta, DEFAULT_CAT_CONFIG);
    }

    setSession(catSession);
    sessionRef.current = catSession;

    // Select first item
    selectAndSetNextItem(catSession);
  }, [items.length, userId, moduleSlug, initialTheta]);

  // ─── Persist session to localStorage ───
  const persistSession = useCallback((state: CATSessionState) => {
    const storageKey = getSessionKey(userId, moduleSlug);
    localStorage.setItem(storageKey, JSON.stringify(state));
  }, [userId, moduleSlug]);

  // ─── Select next item ───
  const selectAndSetNextItem = useCallback((state: CATSessionState) => {
    const administered = new Set(state.administeredItemIds);
    const available = items.map(item => ({
      id: item.id,
      params: item.params,
      bloomLevel: item.bloomLevel ?? undefined,
    }));

    const selection = selectNextItem(
      state.theta,
      available,
      administered,
      state.config,
      state.responses
    );

    if (selection) {
      const item = items[selection.itemIndex];
      setCurrentItem(item);
      setItemStartTime(Date.now());
    } else {
      setCurrentItem(null);
    }
  }, [items]);

  // ─── Handle answer ───
  const handleAnswer = (selectedKey: string) => {
    if (!session || !currentItem) return;

    const isCorrect = selectedKey === currentItem.correctOption;
    const responseTimeMs = Date.now() - itemStartTime;

    // Process response through CAT engine
    const updatedSession = processResponse(
      session,
      currentItem.id,
      isCorrect,
      currentItem.params,
      responseTimeMs
    );

    setSession(updatedSession);
    sessionRef.current = updatedSession;
    persistSession(updatedSession);

    // Persist theta to DB (non-blocking)
    import('@/app/actions/irt').then(({ recordResponseAndUpdateTheta }) => {
      recordResponseAndUpdateTheta(userId, currentItem.id, isCorrect, currentItem.params);
    });

    // Record streak activity
    import('@/app/actions/streaks').then(({ recordActivity }) => {
      recordActivity(userId, 2);
    });

    // Show feedback
    setFeedback({
      correct: isCorrect,
      theta: updatedSession.theta,
      se: updatedSession.se,
    });

    // Error glow + haptic
    if (!isCorrect) {
      setShowErrorGlow(true);
      if (navigator.vibrate) navigator.vibrate([80, 50, 80]);
      setTimeout(() => setShowErrorGlow(false), 1200);
    }

    // Notify parent
    const catReport = generateReport(updatedSession);
    onProgress?.({
      theta: catReport.theta,
      mastery: catReport.mastery,
      count: catReport.itemsAdministered,
      status: updatedSession.status === 'in_progress' ? 'IN_PROGRESS' : 'QUALIFIED',
    });

    // Check if session is complete
    if (updatedSession.status !== 'in_progress') {
      setTimeout(() => {
        setReport(catReport);
        onComplete?.(catReport);
        // Clear persisted session
        localStorage.removeItem(getSessionKey(userId, moduleSlug));
      }, 1500);
    } else {
      // Select next item after delay
      setTimeout(() => {
        setFeedback(null);
        selectAndSetNextItem(updatedSession);
      }, 1200);
    }
  };

  // ─── Reset session ───
  const handleReset = () => {
    const newSession = createCATSession(initialTheta, DEFAULT_CAT_CONFIG);
    setSession(newSession);
    sessionRef.current = newSession;
    setReport(null);
    setFeedback(null);
    persistSession(newSession);
    selectAndSetNextItem(newSession);
  };

  // ─── Loading State ───
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <div className="w-8 h-8 border-3 border-tactical-orange border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-muted-blue/40">Memuat bank soal adaptif...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-blue/50">Tidak ada soal tersedia untuk modul ini.</p>
      </div>
    );
  }

  // ─── Report View ───
  if (report) {
    return <CATReportView report={report} session={session!} onReset={handleReset} />;
  }

  if (!session || !currentItem) return null;

  const progress = session.responses.length / session.config.maxItems;
  const catReport = generateReport(session);

  return (
    <div className="w-full space-y-5">
      {/* Header Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[10px] font-bold bg-tactical-orange/10 text-tactical-orange px-3 py-1.5 rounded-full">
            <Target className="w-3 h-3" />
            <span>θ = {session.theta.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold bg-muted-blue/5 text-muted-blue/60 px-3 py-1.5 rounded-full">
            <TrendingUp className="w-3 h-3" />
            <span>SE = {session.se.toFixed(2)}</span>
          </div>
        </div>
        <span className="text-[9px] font-mono text-muted-blue/30">
          {session.responses.length}/{session.config.maxItems} items
        </span>
      </div>

      {/* Progress Bar with SE indicator */}
      <div className="space-y-1">
        <div className="w-full h-2 bg-muted-blue/5 rounded-full overflow-hidden relative">
          {/* Progress fill */}
          <motion.div
            animate={{ width: `${progress * 100}%` }}
            className="h-full bg-tactical-orange rounded-full"
            transition={{ duration: 0.3 }}
          />
          {/* SE threshold marker */}
          <div
            className="absolute top-0 h-full w-0.5 bg-muted-green/50"
            style={{ left: `${(session.config.minItems / session.config.maxItems) * 100}%` }}
            title={`Min items: ${session.config.minItems}`}
          />
        </div>
        <div className="flex justify-between text-[8px] font-mono text-muted-blue/30">
          <span>SE target: ≤{session.config.seThreshold}</span>
          <span>{thetaToLabel(session.theta)}</span>
        </div>
      </div>

      {/* Theta Trajectory (mini sparkline) */}
      {session.responses.length > 1 && (
        <div className="h-12 flex items-end gap-0.5 px-2">
          {session.responses.map((resp, i) => {
            const normalized = (resp.thetaAfter + 3.5) / 7; // 0-1
            return (
              <div
                key={i}
                className={`flex-1 rounded-t-sm transition-all ${
                  resp.isCorrect ? 'bg-muted-green/40' : 'bg-tactical-red/30'
                }`}
                style={{ height: `${Math.max(8, normalized * 100)}%` }}
                title={`Item ${i + 1}: θ=${resp.thetaAfter.toFixed(2)}`}
              />
            );
          })}
        </div>
      )}

      {/* Question Card */}
      <div className={`space-y-4 rounded-2xl transition-all ${showErrorGlow ? 'error-pendaran' : ''}`}>
        <div className={`p-6 soft-ui-card border-l-4 relative transition-colors duration-300 ${
          showErrorGlow ? 'bg-[#FFECEC] border-tactical-red' : 'bg-white border-tactical-orange'
        }`}>
          {/* Item metadata */}
          <div className="absolute top-2 right-3 flex items-center gap-2">
            <span className="text-[8px] font-mono text-muted-blue/20">
              b={currentItem.params.b.toFixed(1)} a={currentItem.params.a.toFixed(1)}
            </span>
            {currentItem.bloomLevel && (
              <span className="text-[8px] font-bold text-muted-blue/20 bg-muted-blue/5 px-1.5 py-0.5 rounded">
                {currentItem.bloomLevel}
              </span>
            )}
          </div>

          {/* Question text */}
          <p className="text-base font-medium text-muted-blue pr-20 leading-relaxed">
            {currentItem.question}
          </p>
        </div>

        {/* Feedback */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`text-center py-2 rounded-xl text-sm font-bold ${
                feedback.correct ? 'bg-muted-green/10 text-muted-green' : 'bg-tactical-red/10 text-tactical-red'
              }`}
            >
              {feedback.correct ? '✓ Benar' : '✗ Salah'} — θ: {feedback.theta.toFixed(3)} (SE: {feedback.se.toFixed(2)})
            </motion.div>
          )}
        </AnimatePresence>

        {/* Options */}
        <div className="grid grid-cols-2 gap-3">
          {currentItem.options.map((opt) => (
            <button
              key={opt.key}
              onClick={() => handleAnswer(opt.key)}
              disabled={feedback !== null}
              className="soft-ui-card py-4 px-3 text-sm font-medium text-left hover:scale-[1.02] active:scale-95 transition-all hover:border-tactical-orange disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-[9px] font-bold text-tactical-orange/60 uppercase mr-2">
                {opt.key}.
              </span>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Confidence Interval Display */}
      <div className="p-3 bg-muted-blue/5 rounded-xl">
        <div className="flex items-center justify-between text-[9px] text-muted-blue/40">
          <span>95% CI: [{catReport.confidenceInterval.lower.toFixed(2)}, {catReport.confidenceInterval.upper.toFixed(2)}]</span>
          <span>Akurasi: {(catReport.accuracy * 100).toFixed(0)}%</span>
        </div>
        {/* Visual CI bar */}
        <div className="mt-2 h-3 bg-white rounded-full relative overflow-hidden">
          {/* Full range -3.5 to 3.5 */}
          <div
            className="absolute top-0 h-full bg-tactical-orange/20 rounded-full"
            style={{
              left: `${((catReport.confidenceInterval.lower + 3.5) / 7) * 100}%`,
              width: `${((catReport.confidenceInterval.upper - catReport.confidenceInterval.lower) / 7) * 100}%`,
            }}
          />
          {/* Theta point */}
          <div
            className="absolute top-0 h-full w-1 bg-tactical-orange rounded-full"
            style={{ left: `${((session.theta + 3.5) / 7) * 100}%` }}
          />
          {/* Mastery threshold (90% = theta ~2.8) */}
          <div
            className="absolute top-0 h-full w-px bg-muted-green/50"
            style={{ left: `${((2.8 + 3.5) / 7) * 100}%` }}
            title="Mastery threshold"
          />
        </div>
      </div>
    </div>
  );
};

// ─── Report View Component ───
function CATReportView({
  report,
  session,
  onReset,
}: {
  report: CATReport;
  session: CATSessionState;
  onReset: () => void;
}) {
  const statusMessages: Record<string, string> = {
    completed_se: 'Estimasi kemampuan sudah presisi (SE rendah)',
    completed_max: 'Jumlah soal maksimum tercapai',
    completed_mastery: 'Mastery tercapai!',
    abandoned: 'Sesi dibatalkan',
  };

  return (
    <div className="w-full space-y-6 text-center">
      {/* Hero */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="space-y-3"
      >
        <div className="text-5xl">
          {report.mastery >= 90 ? '🏆' : report.mastery >= 70 ? '🎯' : '📊'}
        </div>
        <h3 className="text-lg font-bold text-muted-blue">Sesi CAT Selesai</h3>
        <p className="text-xs text-muted-blue/50">
          {statusMessages[report.status] || 'Selesai'}
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="soft-ui-card p-4 space-y-1">
          <div className="flex items-center justify-center gap-1 text-muted-blue/40">
            <Target className="w-3.5 h-3.5" />
            <span className="text-[9px] font-bold uppercase">Theta</span>
          </div>
          <p className="text-xl font-black text-tactical-orange">{report.theta.toFixed(3)}</p>
          <p className="text-[9px] text-muted-blue/40">SE: ±{report.se.toFixed(3)}</p>
        </div>

        <div className="soft-ui-card p-4 space-y-1">
          <div className="flex items-center justify-center gap-1 text-muted-blue/40">
            <Award className="w-3.5 h-3.5" />
            <span className="text-[9px] font-bold uppercase">Mastery</span>
          </div>
          <p className={`text-xl font-black ${report.mastery >= 90 ? 'text-muted-green' : 'text-muted-blue'}`}>
            {report.mastery.toFixed(1)}%
          </p>
          <p className="text-[9px] text-muted-blue/40">{report.estimatedAbilityLabel}</p>
        </div>

        <div className="soft-ui-card p-4 space-y-1">
          <div className="flex items-center justify-center gap-1 text-muted-blue/40">
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="text-[9px] font-bold uppercase">Akurasi</span>
          </div>
          <p className="text-xl font-black">{(report.accuracy * 100).toFixed(0)}%</p>
          <p className="text-[9px] text-muted-blue/40">{report.correctCount}/{report.itemsAdministered} benar</p>
        </div>

        <div className="soft-ui-card p-4 space-y-1">
          <div className="flex items-center justify-center gap-1 text-muted-blue/40">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-[9px] font-bold uppercase">Durasi</span>
          </div>
          <p className="text-xl font-black">{Math.round(report.durationMs / 1000)}s</p>
          <p className="text-[9px] text-muted-blue/40">
            ~{(report.durationMs / report.itemsAdministered / 1000).toFixed(0)}s/item
          </p>
        </div>
      </div>

      {/* Confidence Interval */}
      <div className="soft-ui-card p-4 space-y-2">
        <p className="text-[9px] font-bold text-muted-blue/40 uppercase">95% Confidence Interval</p>
        <div className="h-4 bg-muted-blue/5 rounded-full relative overflow-hidden">
          <div
            className="absolute top-0 h-full bg-tactical-orange/20 rounded-full"
            style={{
              left: `${((report.confidenceInterval.lower + 3.5) / 7) * 100}%`,
              width: `${((report.confidenceInterval.upper - report.confidenceInterval.lower) / 7) * 100}%`,
            }}
          />
          <div
            className="absolute top-0 h-full w-1.5 bg-tactical-orange rounded-full"
            style={{ left: `${((report.theta + 3.5) / 7) * 100}%` }}
          />
        </div>
        <p className="text-[10px] font-mono text-muted-blue/50">
          θ ∈ [{report.confidenceInterval.lower.toFixed(2)}, {report.confidenceInterval.upper.toFixed(2)}]
        </p>
      </div>

      {/* Theta Trajectory */}
      {session.responses.length > 0 && (
        <div className="soft-ui-card p-4 space-y-2">
          <p className="text-[9px] font-bold text-muted-blue/40 uppercase">Theta Trajectory</p>
          <div className="h-16 flex items-end gap-1 px-1">
            {session.responses.map((resp, i) => {
              const normalized = (resp.thetaAfter + 3.5) / 7;
              return (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(10, normalized * 100)}%` }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex-1 rounded-t-sm ${
                    resp.isCorrect ? 'bg-muted-green/50' : 'bg-tactical-red/40'
                  }`}
                  title={`#${i + 1}: ${resp.isCorrect ? '✓' : '✗'} θ=${resp.thetaAfter.toFixed(2)}`}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-[8px] font-mono text-muted-blue/30">
            <span>Item 1</span>
            <span>Item {session.responses.length}</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onReset}
          className="flex-1 flex items-center justify-center gap-2 soft-ui-card py-3 text-xs font-bold text-muted-blue/60 hover:text-tactical-orange hover:scale-[1.02] transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Ulangi Sesi
        </button>
        {report.mastery >= 90 && (
          <button className="flex-1 flex items-center justify-center gap-2 bg-muted-green text-white py-3 rounded-2xl text-xs font-bold hover:scale-[1.02] transition-all">
            <ChevronRight className="w-3.5 h-3.5" />
            Lanjut Modul
          </button>
        )}
      </div>
    </div>
  );
}
