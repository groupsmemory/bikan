/**
 * BIKAN Assessment Tab - IRT Adaptive Testing
 */

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'motion/react';
import { DiagnosticSession } from './diagnostic-service';
import { calculateItemInformation, ItemParameters } from '@/lib/ai/irt-engine';

interface AssessmentTabProps {
  userId: string;
  moduleSlug: string;
  onReportChange: (report: { theta: number; mastery: number; count: number; status: string }) => void;
}

interface LocalItem {
  id: string;
  question: string;
  options: { label: string; isCorrect: boolean }[];
  params: ItemParameters;
}

export const AssessmentTab: React.FC<AssessmentTabProps> = ({ userId, moduleSlug, onReportChange }) => {
  const session = useMemo(() => new DiagnosticSession(), []);
  const [report, setReport] = useState(session.getSessionReport());
  const [itemBank, setItemBank] = useState<LocalItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [administeredIds, setAdministeredIds] = useState<Set<string>>(new Set());
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [lastFeedback, setLastFeedback] = useState<{ correct: boolean; theta: number } | null>(null);
  const [showErrorGlow, setShowErrorGlow] = useState(false);

  // Fetch items from database
  useEffect(() => {
    async function loadItems() {
      setItemsLoading(true);
      const { getItemsByModule } = await import('@/app/actions/assessment');
      const items = await getItemsByModule(moduleSlug);
      const mapped: LocalItem[] = items.map(item => ({
        id: item.id,
        question: item.question,
        options: item.options.map(opt => ({
          label: opt.label,
          isCorrect: opt.key === item.correctOption,
        })),
        params: item.params as ItemParameters,
      }));
      setItemBank(mapped);
      setItemsLoading(false);
    }
    loadItems();
  }, [moduleSlug]);

  // Select next item adaptively
  const selectNextItem = useCallback(() => {
    const theta = session.getTheta();
    let bestIndex = -1;
    let bestInfo = -Infinity;
    for (let i = 0; i < itemBank.length; i++) {
      if (administeredIds.has(itemBank[i].id)) continue;
      const info = calculateItemInformation(theta, itemBank[i].params);
      if (info > bestInfo) { bestInfo = info; bestIndex = i; }
    }
    return bestIndex;
  }, [session, itemBank, administeredIds]);

  // Initialize first item
  useEffect(() => {
    if (itemBank.length === 0) return;
    const idx = selectNextItem();
    if (idx >= 0) setCurrentItemIndex(idx);
  }, [itemBank.length]);

  const handleAnswer = (isCorrect: boolean) => {
    const item = itemBank[currentItemIndex];

    // Record streak
    import('@/app/actions/streaks').then(({ recordActivity }) => {
      recordActivity(userId, 2);
    });

    const newTheta = session.addResponse(isCorrect, item.params.b, item.params.a, item.params.c);
    const newAdministered = new Set(administeredIds);
    newAdministered.add(item.id);
    setAdministeredIds(newAdministered);

    const newReport = session.getSessionReport();
    setReport(newReport);
    onReportChange(newReport);
    setLastFeedback({ correct: isCorrect, theta: newTheta });

    // Error glow + haptic
    if (!isCorrect) {
      setShowErrorGlow(true);
      if (navigator.vibrate) navigator.vibrate([80, 50, 80]);
      setTimeout(() => setShowErrorGlow(false), 1200);
    }

    // Next item
    setTimeout(() => {
      const theta = session.getTheta();
      let bestIndex = -1;
      let bestInfo = -Infinity;
      for (let i = 0; i < itemBank.length; i++) {
        if (newAdministered.has(itemBank[i].id)) continue;
        const info = calculateItemInformation(theta, itemBank[i].params);
        if (info > bestInfo) { bestInfo = info; bestIndex = i; }
      }
      if (bestIndex >= 0) setCurrentItemIndex(bestIndex);
      setLastFeedback(null);
    }, 1200);
  };

  if (itemsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <div className="w-8 h-8 border-3 border-tactical-orange border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-muted-blue/40">Memuat bank soal dari database...</p>
      </div>
    );
  }

  if (itemBank.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-blue/50">Tidak ada soal tersedia untuk modul ini.</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="text-xs font-bold text-tactical-red bg-tactical-red/5 py-2 rounded-full inline-block px-4">
        IRT Theta: {report.theta.toFixed(2)} | Items: {report.count}/{itemBank.length}
      </div>

      {administeredIds.size < itemBank.length ? (
        <div className={`space-y-4 rounded-2xl transition-all ${showErrorGlow ? 'error-pendaran' : ''}`}>
          <div className={`p-8 soft-ui-card text-xl font-mono border-l-4 relative transition-colors duration-300 ${
            showErrorGlow ? 'bg-[#FFECEC] border-tactical-red' : 'bg-white border-tactical-orange'
          }`}>
            <span className="absolute top-2 right-3 text-[9px] font-bold text-muted-blue/30 uppercase">
              b={itemBank[currentItemIndex].params.b.toFixed(1)} a={itemBank[currentItemIndex].params.a.toFixed(1)}
            </span>
            {itemBank[currentItemIndex].question}
          </div>

          {lastFeedback && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-center py-2 rounded-xl text-sm font-bold ${
                lastFeedback.correct ? 'bg-muted-green/10 text-muted-green' : 'bg-tactical-red/10 text-tactical-red'
              }`}
            >
              {lastFeedback.correct ? '✓ Benar' : '✗ Salah'} — θ: {lastFeedback.theta.toFixed(3)}
            </motion.div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {itemBank[currentItemIndex].options.map((opt) => (
              <button
                key={opt.label}
                onClick={() => handleAnswer(opt.isCorrect)}
                disabled={lastFeedback !== null}
                className="soft-ui-card py-5 font-bold hover:scale-[1.02] active:soft-ui-pressed transition-all hover:border-tactical-orange disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center space-y-4 py-8">
          <div className="text-4xl">🎯</div>
          <h3 className="text-lg font-bold text-muted-blue">Sesi Diagnostik Selesai</h3>
          <p className="text-sm text-muted-blue/60">
            θ: <span className="font-mono font-bold text-tactical-orange">{report.theta.toFixed(3)}</span> | 
            Mastery: <span className="font-mono font-bold">{report.mastery.toFixed(1)}%</span>
          </p>
        </div>
      )}
    </div>
  );
};
