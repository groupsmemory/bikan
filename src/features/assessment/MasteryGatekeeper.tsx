/**
 * BIKAN Mastery-Based Progression Gatekeeper
 * ────────────────────────────────────────────
 * PRD: "Penguncian otomatis materi berikutnya berbasis nilai ambang batas
 * kelulusan minimal 90%. Pencegahan akumulasi defisit celah pengetahuan
 * konseptual prasyarat pada subjek matematika kumulatif."
 *
 * Komponen Soft UI Neomorfisme, warna pastel low-contrast, kedalaman bayangan.
 */

import React from 'react';
import { motion } from 'motion/react';
import { Lock, Unlock, CheckCircle, ChevronRight, BookOpen, Trophy } from 'lucide-react';

interface ModuleInfo {
  id: string;
  title: string;
  subtitle: string;
  requiredMastery: number; // 0-100
}

interface MasteryGatekeeperProps {
  currentMastery: number;  // 0-100 from IRT engine
  currentTheta: number;
  itemsCompleted: number;
  totalItems: number;
  status: string;
}

// Kurikulum modul berurutan (kumulatif, prasyarat ketat)
const MODULES: ModuleInfo[] = [
  {
    id: 'MOD-01',
    title: 'Aljabar Dasar & Variabel',
    subtitle: 'Operasi dasar, substitusi, penyederhanaan',
    requiredMastery: 0, // Modul pertama selalu terbuka
  },
  {
    id: 'MOD-02',
    title: 'Persamaan Kuadrat',
    subtitle: 'Pemfaktoran, rumus abc, diskriminan',
    requiredMastery: 90,
  },
  {
    id: 'MOD-03',
    title: 'Fungsi Kuadrat & Grafik',
    subtitle: 'Parabola, titik puncak, transformasi',
    requiredMastery: 90,
  },
  {
    id: 'MOD-04',
    title: 'Pertidaksamaan Kuadrat',
    subtitle: 'Interval solusi, garis bilangan',
    requiredMastery: 90,
  },
  {
    id: 'MOD-05',
    title: 'Aplikasi Fungsi Kuadrat',
    subtitle: 'Optimasi, gerak parabola, model dunia nyata',
    requiredMastery: 90,
  },
];

// Circular progress ring component
const ProgressRing: React.FC<{ progress: number; size?: number; strokeWidth?: number }> = ({
  progress,
  size = 48,
  strokeWidth = 4,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-gray-200 dark:text-gray-700"
      />
      {/* Progress circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className={progress >= 90 ? 'text-muted-green' : 'text-tactical-orange'}
        style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
      />
    </svg>
  );
};

export const MasteryGatekeeper: React.FC<MasteryGatekeeperProps> = ({
  currentMastery,
  currentTheta,
  itemsCompleted,
  totalItems,
  status,
}) => {
  // Determine which modules are unlocked
  // Module N is unlocked if mastery >= requiredMastery for that module
  // For MVP: only first module is "active", rest depend on mastery threshold
  const currentModuleIndex = currentMastery >= 90 ? 1 : 0; // Simplified: unlock MOD-02 at 90%

  const isQualified = status === 'QUALIFIED';

  return (
    <div className="space-y-4">
      {/* ─── Header: Mastery Score Ring ─── */}
      <div className="soft-ui-card p-5 flex items-center gap-4">
        <div className="relative">
          <ProgressRing progress={currentMastery} size={56} strokeWidth={5} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-black">{Math.round(currentMastery)}%</span>
          </div>
        </div>
        <div className="flex-1">
          <h4 className="text-xs font-bold uppercase tracking-widest text-muted-blue/40">
            Mastery Gatekeeper
          </h4>
          <p className="text-lg font-black leading-tight">
            θ = {currentTheta.toFixed(2)}
          </p>
          <p className="text-[10px] text-muted-blue/50 mt-0.5">
            {itemsCompleted}/{totalItems} soal dijawab
          </p>
        </div>
        <div className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
          isQualified 
            ? 'bg-muted-green/10 text-muted-green' 
            : 'bg-tactical-orange/10 text-tactical-orange'
        }`}>
          {isQualified ? 'LULUS' : 'PROSES'}
        </div>
      </div>

      {/* ─── Module Progression List ─── */}
      <div className="soft-ui-card p-4 space-y-1">
        <div className="flex items-center gap-2 mb-3 px-1">
          <BookOpen className="w-3.5 h-3.5 text-tactical-orange" />
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-blue/50">
            Jalur Kurikulum
          </h4>
        </div>

        {MODULES.map((mod, idx) => {
          const isUnlocked = idx <= currentModuleIndex;
          const isActive = idx === currentModuleIndex;
          const isCompleted = idx < currentModuleIndex;

          return (
            <motion.div
              key={mod.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.08 }}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
                isActive
                  ? 'bg-tactical-orange/5 border border-tactical-orange/20'
                  : isCompleted
                  ? 'bg-muted-green/5 border border-muted-green/10'
                  : 'bg-gray-50/50 border border-transparent dark:bg-white/5'
              }`}
            >
              {/* Status Icon */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                isCompleted
                  ? 'bg-muted-green/10'
                  : isActive
                  ? 'bg-tactical-orange/10'
                  : 'bg-gray-100 dark:bg-gray-800'
              }`}>
                {isCompleted && <CheckCircle className="w-4 h-4 text-muted-green" />}
                {isActive && <ChevronRight className="w-4 h-4 text-tactical-orange" />}
                {!isUnlocked && <Lock className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />}
              </div>

              {/* Module Info */}
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-bold truncate ${
                  isUnlocked ? '' : 'text-muted-blue/30'
                }`}>
                  {mod.title}
                </p>
                <p className={`text-[10px] truncate ${
                  isUnlocked ? 'text-muted-blue/50' : 'text-muted-blue/20'
                }`}>
                  {mod.subtitle}
                </p>
              </div>

              {/* Lock/Unlock Badge */}
              {!isUnlocked && (
                <div className="flex items-center gap-1 text-[9px] font-bold text-muted-blue/25 flex-shrink-0">
                  <Lock className="w-3 h-3" />
                  <span>{mod.requiredMastery}%</span>
                </div>
              )}
              {isCompleted && (
                <Trophy className="w-3.5 h-3.5 text-muted-green/60 flex-shrink-0" />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* ─── Gate Status Message ─── */}
      <div className={`p-4 rounded-2xl border text-center transition-all duration-500 ${
        isQualified
          ? 'bg-muted-green/5 border-muted-green/20'
          : 'bg-tactical-orange/5 border-tactical-orange/10'
      }`}>
        {isQualified ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="space-y-2"
          >
            <Unlock className="w-6 h-6 text-muted-green mx-auto" />
            <p className="text-xs font-bold text-muted-green">Gerbang Terbuka</p>
            <p className="text-[10px] text-muted-blue/50 leading-relaxed">
              Kompetensi terpenuhi. Modul <span className="font-bold">Persamaan Kuadrat</span> telah dibuka.
            </p>
            <button className="mt-2 px-4 py-2 bg-muted-green text-white text-xs font-bold rounded-xl hover:scale-105 active:scale-95 transition-transform shadow-lg">
              Lanjut ke Modul 2 →
            </button>
          </motion.div>
        ) : (
          <div className="space-y-2">
            <Lock className="w-5 h-5 text-tactical-orange/60 mx-auto" />
            <p className="text-[10px] text-muted-blue/40 leading-relaxed">
              Gerbang modul lanjutan terbuka otomatis saat mastery mencapai <span className="font-bold text-tactical-orange">90%</span>.
              <br />
              Saat ini: <span className="font-mono font-bold">{currentMastery.toFixed(1)}%</span> — butuh <span className="font-mono font-bold">{Math.max(0, 90 - currentMastery).toFixed(1)}%</span> lagi.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
