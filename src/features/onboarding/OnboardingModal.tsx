/**
 * BIKAN Onboarding Modal
 * ───────────────────────
 * Ditampilkan sekali saat user pertama kali login
 * Tour singkat fitur-fitur utama platform
 */

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface OnboardingProps {
  userName: string;
  onComplete: () => void;
}

const STEPS = [
  {
    emoji: '👋',
    title: 'Selamat Datang di BIKAN!',
    description: 'Platform pembelajaran matematika adaptif yang menyesuaikan dengan kemampuan Anda secara real-time.',
  },
  {
    emoji: '🎬',
    title: 'Video Micro-Learning',
    description: 'Tonton materi dalam segmen pendek 3-12 menit. Posisi tontonan tersimpan otomatis — lanjutkan kapan saja.',
  },
  {
    emoji: '📐',
    title: 'Canvas Interaktif',
    description: 'Eksplorasi grafik fungsi kuadrat secara langsung. Geser slider, zoom, dan pan untuk memahami konsep visual.',
  },
  {
    emoji: '🧠',
    title: 'Assessment Adaptif (IRT)',
    description: 'Soal menyesuaikan tingkat kesulitan berdasarkan kemampuan Anda. Capai mastery 90% untuk membuka modul berikutnya.',
  },
  {
    emoji: '🤖',
    title: 'AI Socratic Assistant',
    description: 'Tanya apa saja — AI akan membimbing dengan pertanyaan penuntun, bukan memberikan jawaban langsung.',
  },
];

export const OnboardingModal: React.FC<OnboardingProps> = ({ userName, onComplete }) => {
  const [step, setStep] = useState(0);

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      localStorage.setItem('bikan-onboarding-done', 'true');
      onComplete();
    }
  };

  const handleSkip = () => {
    localStorage.setItem('bikan-onboarding-done', 'true');
    onComplete();
  };

  const current = STEPS[step];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        key={step}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="soft-ui-card p-8 max-w-md w-full space-y-6 text-center"
      >
        {/* Step indicator */}
        <div className="flex justify-center gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === step ? 'bg-tactical-orange' : i < step ? 'bg-muted-green' : 'bg-muted-blue/10'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="text-5xl">{current.emoji}</div>
        <h2 className="text-xl font-bold">
          {step === 0 ? `${current.title.replace('!', '')}, ${userName}!` : current.title}
        </h2>
        <p className="text-sm text-muted-blue/60 leading-relaxed">{current.description}</p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleSkip}
            className="flex-1 py-3 rounded-xl text-xs font-bold text-muted-blue/40 hover:text-muted-blue/60 transition-colors"
          >
            Lewati
          </button>
          <button
            onClick={handleNext}
            className="flex-1 py-3 rounded-xl bg-tactical-orange text-white text-xs font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-lg"
          >
            {step < STEPS.length - 1 ? 'Lanjut' : 'Mulai Belajar!'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

/**
 * Check if onboarding should be shown
 */
export function shouldShowOnboarding(): boolean {
  if (typeof window === 'undefined') return false;
  return !localStorage.getItem('bikan-onboarding-done');
}
