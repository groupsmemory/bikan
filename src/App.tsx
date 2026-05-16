/**
 * BIKAN Main App (Refactored)
 * ────────────────────────────
 * Orchestrator component — delegates to modular feature components.
 * ~150 lines (down from 500+)
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WifiOff } from 'lucide-react';
import { useDarkMode } from '@/src/hooks/use-dark-mode';
import { useOnlineStatus } from '@/src/hooks/use-offline';
import { MODULE_1 } from '@/src/data/lessons';
import { useAuth } from '@/src/features/auth/AuthContext';
import { AuthScreen } from '@/src/features/auth/AuthScreen';
import { AppHeader } from '@/src/features/layout/AppHeader';
import { SocraticPanel } from '@/src/features/chat/SocraticPanel';
import { OnboardingModal, shouldShowOnboarding } from '@/src/features/onboarding/OnboardingModal';
import { CinematicPlayer } from '@/src/features/player/CinematicPlayer';
import { PostLivePanel } from '@/src/features/player/PostLivePanel';
import { StreakWidget } from '@/src/features/streaks/StreakWidget';
import { PricingPanel } from '@/src/features/payment/PricingPanel';
import { CertificateGenerator } from '@/src/features/certificate/CertificateGenerator';
import { ModuleSelector } from '@/src/features/curriculum/ModuleSelector';
import { LearnTab } from '@/src/features/learn/LearnTab';
import { CanvasTab } from '@/src/features/canvas/CanvasTab';
import { AssessmentTab } from '@/src/features/assessment/AssessmentTab';
import { CATSession } from '@/src/features/assessment/CATSession';
import { DiagnosticsWorkspace } from '@/src/features/diagnostics';

export default function App() {
  // ─── State ───
  const [activeTab, setActiveTab] = useState('canvas');
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const [activeModuleSlug, setActiveModuleSlug] = useState('mod-aljabar-kuadrat');
  const [completedModules] = useState<string[]>([]);
  const [config, setConfig] = useState({ a: 1, b: 0, c: 0 });
  const [report, setReport] = useState({ theta: 0, mastery: 0, count: 0, status: 'IN_PROGRESS' });
  const [showOnboarding, setShowOnboarding] = useState(false);

  // ─── Hooks ───
  const { mode, isDark, luxLevel, toggle } = useDarkMode();
  const isOnline = useOnlineStatus();
  const { user, isLoading, handleLogout } = useAuth();

  const activeLesson = MODULE_1.lessons[activeLessonIndex];

  useEffect(() => {
    if (shouldShowOnboarding()) setShowOnboarding(true);
  }, []);

  // ─── Auth Guard ───
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-base">
        <div className="w-10 h-10 border-3 border-tactical-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <AuthScreen isDark={isDark} />;

  // ─── Render ───
  return (
    <div className={`min-h-screen font-sans antialiased selection:bg-tactical-orange/20 transition-colors duration-300 ${isDark ? 'bg-[#0F172A] text-[#F1F5F9]' : 'bg-neutral-base text-muted-blue'}`}>
      {showOnboarding && <OnboardingModal userName={user.name} onComplete={() => setShowOnboarding(false)} />}

      <AnimatePresence>
        {!isOnline && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="bg-tactical-orange text-white text-center py-2 px-4 flex items-center justify-center gap-2 text-xs font-bold overflow-hidden">
            <WifiOff className="w-3.5 h-3.5" />
            <span>Mode Offline — Data tersimpan lokal</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AppHeader userName={user.name} theta={report.theta} mode={mode} isDark={isDark} luxLevel={luxLevel} onToggleTheme={toggle} onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-8 space-y-6">
          <CinematicPlayer
            src={activeLesson.videoUrl}
            lessonId={activeLesson.id}
            isDark={isDark}
            chapters={activeLesson.chapters}
            onComplete={() => { if (activeLessonIndex < MODULE_1.lessons.length - 1) setActiveLessonIndex(activeLessonIndex + 1); }}
          />

          {/* Tabs */}
          <div className="soft-ui-card p-2 flex gap-1 bg-white/50 border-white/50">
            {['video', 'canvas', 'diagnostics', 'assessment', 'post-live', 'pricing'].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                  activeTab === tab ? 'bg-white shadow-soft-out text-tactical-orange scale-[1.02]' : 'text-muted-blue/40 hover:text-muted-blue/60'
                }`}>
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }} transition={{ duration: 0.3 }}
              className="soft-ui-card p-10 min-h-[300px] flex flex-col items-center justify-center text-center space-y-4">
              {activeTab === 'video' && <LearnTab activeLesson={activeLesson} activeLessonIndex={activeLessonIndex} onSelectLesson={setActiveLessonIndex} />}
              {activeTab === 'canvas' && <CanvasTab config={config} setConfig={setConfig} isDark={isDark} />}
              {activeTab === 'diagnostics' && <DiagnosticsWorkspace onCorrectSolution={() => { if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]); }} />}
              {activeTab === 'assessment' && <CATSession userId={user.id} moduleSlug={activeModuleSlug} onProgress={setReport} />}
              {activeTab === 'post-live' && <PostLivePanel userId={user.id} />}
              {activeTab === 'pricing' && <PricingPanel userId={user.id} userEmail={user.email} userName={user.name} currentPlan="free" />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-4 space-y-6">
          <SocraticPanel userId={user.id} lessonId={activeLesson.id} />
          <StreakWidget userId={user.id} />
          <div className="soft-ui-card p-5">
            <ModuleSelector currentModuleSlug={activeModuleSlug} completedModules={completedModules} onSelectModule={setActiveModuleSlug} />
          </div>

          {/* Mastery Gatekeeper (simplified) */}
          <div className={`soft-ui-card p-6 space-y-4 border-t-4 ${report.status === 'QUALIFIED' ? 'border-muted-green' : 'border-tactical-orange'}`}>
            <div className="flex justify-between items-end">
              <div>
                <h4 className="text-[10px] font-bold text-muted-blue/40 uppercase tracking-widest">Mastery</h4>
                <p className="text-xl font-black">{report.mastery.toFixed(1)}%</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded ${report.status === 'QUALIFIED' ? 'text-muted-green bg-muted-green/5' : 'text-tactical-orange bg-tactical-orange/5'}`}>
                {report.status === 'QUALIFIED' ? '🔓 UNLOCKED' : '🔒 LOCKED'}
              </span>
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden relative">
              <motion.div animate={{ width: `${report.mastery}%` }} className={`h-full ${report.status === 'QUALIFIED' ? 'bg-muted-green' : 'bg-tactical-orange'}`} />
              <div className="absolute top-0 left-[90%] h-3 w-0.5 bg-muted-blue/30" />
            </div>
            {report.status === 'QUALIFIED' && (
              <CertificateGenerator
                studentName={user.name}
                moduleName="Aljabar & Fungsi Kuadrat"
                masteryScore={report.mastery}
                thetaScore={report.theta}
                completedDate={new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                certificateId={`BIKAN-${user.id.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`}
              />
            )}
            <p className="text-[9px] text-muted-blue/30 font-mono text-center">
              θ = {report.theta.toFixed(3)} | {report.count} items | threshold 90%
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
