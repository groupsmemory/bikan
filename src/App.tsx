/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, BrainCircuit, Activity, Calculator, Sliders, Moon, Sun, Monitor, WifiOff, BookOpen } from 'lucide-react';
import { QuadraticCanvas } from '@/src/features/canvas/QuadraticCanvas';
import { DiagnosticSession } from '@/src/features/assessment/diagnostic-service';
import { calculateItemInformation, ItemParameters } from '@/lib/ai/irt-engine';
import { askSocraticAssistant } from '@/actions/ai-assistant';
import { useDarkMode } from '@/src/hooks/use-dark-mode';
import { useOnlineStatus } from '@/src/hooks/use-offline';
import { CinematicPlayer } from '@/src/features/player/CinematicPlayer';
import { MODULE_1 } from '@/src/data/lessons';

export default function App() {
  const [activeTab, setActiveTab] = useState('canvas');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Active lesson for video player
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const activeLesson = MODULE_1.lessons[activeLessonIndex];

  // Dark Mode Adaptif (PRD US-ALG-001: lux < 50 → auto dark)
  const { mode, isDark, luxLevel, toggle } = useDarkMode();

  // Offline-First PWA: track connection status
  const isOnline = useOnlineStatus();

  // Quadratic Config for Canvas
  const [config, setConfig] = useState({ a: 1, b: 0, c: 0 });

  // Diagnostic Session
  const session = useMemo(() => new DiagnosticSession(), []);
  const [report, setReport] = useState(session.getSessionReport());

  // ─── IRT Item Bank: Soal Aljabar & Fungsi Kuadrat ───
  // Setiap item memiliki parameter 3PLM (a=discrimination, b=difficulty, c=guessing)
  const itemBank = useMemo(() => [
    {
      id: 'ALG-001',
      question: 'Jika f(x) = x² + 2x + 1, berapakah nilai x saat f(x) = 0?',
      options: [
        { label: 'x = 1', isCorrect: false },
        { label: 'x = -1', isCorrect: true },
        { label: 'x = 0', isCorrect: false },
        { label: 'x = 2', isCorrect: false },
      ],
      params: { a: 1.0, b: -1.5, c: 0.25 } as ItemParameters, // Mudah
    },
    {
      id: 'ALG-002',
      question: 'Tentukan diskriminan dari persamaan 2x² - 4x + 2 = 0.',
      options: [
        { label: 'D = 0', isCorrect: true },
        { label: 'D = 8', isCorrect: false },
        { label: 'D = -8', isCorrect: false },
        { label: 'D = 4', isCorrect: false },
      ],
      params: { a: 1.2, b: -0.5, c: 0.25 } as ItemParameters, // Mudah-Sedang
    },
    {
      id: 'ALG-003',
      question: 'Fungsi f(x) = -x² + 4x - 3 memiliki titik puncak di...',
      options: [
        { label: '(2, 1)', isCorrect: true },
        { label: '(4, -3)', isCorrect: false },
        { label: '(-2, 1)', isCorrect: false },
        { label: '(2, -1)', isCorrect: false },
      ],
      params: { a: 1.4, b: 0.5, c: 0.20 } as ItemParameters, // Sedang
    },
    {
      id: 'ALG-004',
      question: 'Persamaan kuadrat x² - 5x + 6 = 0 memiliki akar-akar...',
      options: [
        { label: 'x = 2 dan x = 3', isCorrect: true },
        { label: 'x = -2 dan x = -3', isCorrect: false },
        { label: 'x = 1 dan x = 6', isCorrect: false },
        { label: 'x = -1 dan x = -6', isCorrect: false },
      ],
      params: { a: 1.1, b: 0.0, c: 0.25 } as ItemParameters, // Sedang
    },
    {
      id: 'ALG-005',
      question: 'Jika grafik y = ax² + bx + c melalui titik (0, 5), maka nilai c adalah...',
      options: [
        { label: 'c = 5', isCorrect: true },
        { label: 'c = 0', isCorrect: false },
        { label: 'c = -5', isCorrect: false },
        { label: 'Tidak dapat ditentukan', isCorrect: false },
      ],
      params: { a: 0.9, b: -1.0, c: 0.25 } as ItemParameters, // Mudah
    },
    {
      id: 'ALG-006',
      question: 'Sumbu simetri dari f(x) = 3x² - 12x + 7 adalah...',
      options: [
        { label: 'x = 2', isCorrect: true },
        { label: 'x = 4', isCorrect: false },
        { label: 'x = -2', isCorrect: false },
        { label: 'x = 6', isCorrect: false },
      ],
      params: { a: 1.3, b: 1.0, c: 0.20 } as ItemParameters, // Sedang-Sulit
    },
    {
      id: 'ALG-007',
      question: 'Persamaan kuadrat yang akar-akarnya 3 dan -2 adalah...',
      options: [
        { label: 'x² - x - 6 = 0', isCorrect: true },
        { label: 'x² + x - 6 = 0', isCorrect: false },
        { label: 'x² - x + 6 = 0', isCorrect: false },
        { label: 'x² + x + 6 = 0', isCorrect: false },
      ],
      params: { a: 1.5, b: 1.5, c: 0.20 } as ItemParameters, // Sulit
    },
    {
      id: 'ALG-008',
      question: 'Nilai minimum dari f(x) = 2x² - 8x + 10 adalah...',
      options: [
        { label: '2', isCorrect: true },
        { label: '10', isCorrect: false },
        { label: '-2', isCorrect: false },
        { label: '0', isCorrect: false },
      ],
      params: { a: 1.6, b: 2.0, c: 0.20 } as ItemParameters, // Sulit
    },
    {
      id: 'ALG-009',
      question: 'Agar persamaan x² + kx + 9 = 0 memiliki akar kembar, nilai k adalah...',
      options: [
        { label: 'k = 6 atau k = -6', isCorrect: true },
        { label: 'k = 3', isCorrect: false },
        { label: 'k = 9', isCorrect: false },
        { label: 'k = 0', isCorrect: false },
      ],
      params: { a: 1.8, b: 2.5, c: 0.15 } as ItemParameters, // Sangat Sulit
    },
    {
      id: 'ALG-010',
      question: 'Jika x₁ dan x₂ adalah akar dari 2x² - 7x + 3 = 0, maka x₁² + x₂² = ...',
      options: [
        { label: '37/4', isCorrect: true },
        { label: '49/4', isCorrect: false },
        { label: '7/2', isCorrect: false },
        { label: '3/2', isCorrect: false },
      ],
      params: { a: 2.0, b: 3.0, c: 0.15 } as ItemParameters, // Sangat Sulit
    },
  ], []);

  // Track which items have been administered
  const [administeredIds, setAdministeredIds] = useState<Set<string>>(new Set());
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [lastFeedback, setLastFeedback] = useState<{ correct: boolean; theta: number } | null>(null);
  const [showErrorGlow, setShowErrorGlow] = useState(false);

  // Adaptive Item Selection: pilih soal dengan informasi maksimum pada theta saat ini
  const selectNextItem = useCallback(() => {
    const theta = session.getTheta();
    let bestIndex = -1;
    let bestInfo = -Infinity;

    for (let i = 0; i < itemBank.length; i++) {
      if (administeredIds.has(itemBank[i].id)) continue;
      const info = calculateItemInformation(theta, itemBank[i].params);
      if (info > bestInfo) {
        bestInfo = info;
        bestIndex = i;
      }
    }

    return bestIndex >= 0 ? bestIndex : -1; // -1 = semua soal habis
  }, [session, itemBank, administeredIds]);

  // Initialize first item
  useEffect(() => {
    const idx = selectNextItem();
    if (idx >= 0) setCurrentItemIndex(idx);
  }, []);

  const handleAssessment = (isCorrect: boolean) => {
    const item = itemBank[currentItemIndex];
    
    // Trigger estimateTheta via DiagnosticSession with proper IRT parameters
    const newTheta = session.addResponse(
      isCorrect,
      item.params.b,  // difficulty
      item.params.a,  // discrimination
      item.params.c   // guessing
    );

    // Mark item as administered
    const newAdministered = new Set(administeredIds);
    newAdministered.add(item.id);
    setAdministeredIds(newAdministered);

    // Update report and feedback
    setReport(session.getSessionReport());
    setLastFeedback({ correct: isCorrect, theta: newTheta });

    // ─── Pendaran Merah + Getaran Haptik saat jawaban SALAH ───
    if (!isCorrect) {
      // Activate error glow CSS animation
      setShowErrorGlow(true);

      // Trigger haptic vibration on mobile devices (Vibration API)
      if (navigator.vibrate) {
        navigator.vibrate([80, 50, 80]); // Short double-pulse pattern
      }

      // Reset glow after animation completes (1.2s matches CSS keyframe duration)
      setTimeout(() => setShowErrorGlow(false), 1200);
    }

    // Select next item adaptively after short delay (for feedback display)
    setTimeout(() => {
      const theta = session.getTheta();
      let bestIndex = -1;
      let bestInfo = -Infinity;

      for (let i = 0; i < itemBank.length; i++) {
        if (newAdministered.has(itemBank[i].id)) continue;
        const info = calculateItemInformation(theta, itemBank[i].params);
        if (info > bestInfo) {
          bestInfo = info;
          bestIndex = i;
        }
      }

      if (bestIndex >= 0) {
        setCurrentItemIndex(bestIndex);
      }
      setLastFeedback(null);
    }, 1200);
  };

  // Simulated Socratic Interaction
  const [chatInput, setChatInput] = useState('');
  const [tokenInfo, setTokenInfo] = useState<{ total: number; cached: number; latency: number } | null>(null);

  const handleAskAI = async () => {
    const message = chatInput.trim();
    if (!message || isAiLoading) return;

    setIsAiLoading(true);
    setChatInput('');

    try {
      const result = await askSocraticAssistant(
        'student-session-001',
        message,
        'Materi: Aljabar dasar, persamaan kuadrat, fungsi kuadrat f(x) = ax² + bx + c, diskriminan, titik puncak parabola.'
      );

      setAiResponse(result.text);
      setTokenInfo({ total: result.tokens, cached: result.cached, latency: result.latencyMs });
    } catch (error: any) {
      setAiResponse(error.message || 'Terjadi kesalahan. Coba lagi.');
      setTokenInfo(null);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className={`min-h-screen font-sans antialiased selection:bg-tactical-orange/20 transition-colors duration-300 ${isDark ? 'bg-[#0F172A] text-[#F1F5F9]' : 'bg-neutral-base text-muted-blue'}`}>
      {/* Offline Banner */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-tactical-orange text-white text-center py-2 px-4 flex items-center justify-center gap-2 text-xs font-bold overflow-hidden"
          >
            <WifiOff className="w-3.5 h-3.5" />
            <span>Mode Offline — Data progres tersimpan lokal dan akan disinkronkan otomatis saat koneksi pulih</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. TOP PERSISTENT PLAYER BAR */}
      <header className="sticky top-0 z-50 bg-white/50 backdrop-blur-xl border-b border-white/50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-muted-blue to-black flex items-center justify-center text-white font-black shadow-lg">
            B
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">KMP BIKAN 2026</h1>
            <p className="text-[10px] font-medium text-muted-blue/40 uppercase tracking-widest">Architectural Preview v1.0</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-gray-100 shadow-sm">
            <Activity className="w-3 h-3 text-tactical-orange" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-blue/60">Estimated Theta: +1.2 (Active)</span>
          </div>

          {/* Dark Mode Toggle */}
          <button 
            onClick={toggle}
            className="soft-ui-card p-2 rounded-xl hover:scale-105 transition-transform relative group"
            aria-label={`Tema: ${mode === 'auto' ? 'Otomatis' : mode === 'dark' ? 'Gelap' : 'Terang'}`}
            title={`Mode: ${mode}${luxLevel !== null ? ` (lux: ${luxLevel.toFixed(0)})` : ''}`}
          >
            {mode === 'dark' && <Moon className="w-5 h-5 text-indigo-400" />}
            {mode === 'light' && <Sun className="w-5 h-5 text-tactical-orange" />}
            {mode === 'auto' && <Monitor className="w-5 h-5 text-muted-blue/60" />}
            {/* Indicator dot */}
            <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${isDark ? 'bg-indigo-400' : 'bg-tactical-orange'}`} />
          </button>

          <button className="soft-ui-card p-2 rounded-xl text-tactical-orange hover:scale-105 transition-transform">
            <BrainCircuit className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* 2. MAIN CONTENT GRID */}
      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: PLAYER & CANVAS (THE 60% AREA) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* CINEMATIC MICRO-LEARNING PLAYER */}
          <CinematicPlayer
            src={activeLesson.videoUrl}
            lessonId={activeLesson.id}
            isDark={isDark}
            chapters={activeLesson.chapters}
            onComplete={() => {
              // Auto-advance to next lesson if available
              if (activeLessonIndex < MODULE_1.lessons.length - 1) {
                setActiveLessonIndex(activeLessonIndex + 1);
              }
            }}
          />

          {/* DYNAMIC TABS FOR CANVAS / ASSESSMENT */}
          <div className="soft-ui-card p-2 flex gap-1 bg-white/50 border-white/50">
            {['video', 'canvas', 'assessment'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                  activeTab === tab 
                    ? 'bg-white shadow-soft-out text-tactical-orange scale-[1.02]' 
                    : 'text-muted-blue/40 hover:text-muted-blue/60'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* CONTENT RENDERING */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.3 }}
              className="soft-ui-card p-10 min-h-[300px] flex flex-col items-center justify-center text-center space-y-4"
            >
              {activeTab === 'video' && (
                <div className="w-full space-y-5 text-left">
                  {/* Current Lesson Info */}
                  <div>
                    <h2 className="text-xl font-bold">{activeLesson.title}</h2>
                    <p className="text-sm text-muted-blue/60 leading-relaxed mt-1">{activeLesson.description}</p>
                  </div>

                  {/* Lesson Metadata */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-tactical-orange/5 border border-tactical-orange/10">
                      <p className="text-[9px] font-bold uppercase text-muted-blue/40">Durasi</p>
                      <p className="text-sm font-bold text-tactical-orange">{activeLesson.duration}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted-green/5 border border-muted-green/10">
                      <p className="text-[9px] font-bold uppercase text-muted-blue/40">Level</p>
                      <p className="text-sm font-bold text-muted-green">{activeLesson.bloomLevel}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted-blue/5 border border-muted-blue/10">
                      <p className="text-[9px] font-bold uppercase text-muted-blue/40">Chapters</p>
                      <p className="text-sm font-bold">{activeLesson.chapters.length} segmen</p>
                    </div>
                  </div>

                  {/* Lesson Playlist */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="w-4 h-4 text-muted-blue/40" />
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-blue/40">Daftar Materi — {MODULE_1.title}</h4>
                    </div>
                    {MODULE_1.lessons.map((lesson, idx) => (
                      <button
                        key={lesson.id}
                        onClick={() => setActiveLessonIndex(idx)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                          idx === activeLessonIndex
                            ? 'bg-tactical-orange/10 border border-tactical-orange/20'
                            : 'hover:bg-muted-blue/5 border border-transparent'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black ${
                          idx === activeLessonIndex
                            ? 'bg-tactical-orange text-white'
                            : 'bg-muted-blue/5 text-muted-blue/40'
                        }`}>
                          {lesson.order}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-bold truncate ${idx === activeLessonIndex ? 'text-tactical-orange' : ''}`}>
                            {lesson.title}
                          </p>
                          <p className="text-[9px] text-muted-blue/40">{lesson.duration} • {lesson.bloomLevel}</p>
                        </div>
                        {idx === activeLessonIndex && (
                          <span className="text-[9px] font-bold text-tactical-orange bg-tactical-orange/10 px-2 py-0.5 rounded">NOW</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {activeTab === 'canvas' && (
                <div className="w-full flex flex-col md:flex-row gap-8 items-center">
                  <QuadraticCanvas a={config.a} b={config.b} c={config.c} isDark={isDark} />
                  
                  <div className="flex-1 w-full space-y-6">
                    <div className="soft-ui-card p-6 bg-white/50 space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Sliders className="w-4 h-4 text-tactical-orange" />
                        <h4 className="text-xs font-bold uppercase tracking-widest text-muted-blue/60">Coefficient Control</h4>
                      </div>
                      
                      {['a', 'b', 'c'].map((param) => (
                        <div key={param} className="space-y-1">
                          <div className="flex justify-between text-[10px] font-bold">
                            <span className="uppercase">{param} Variable</span>
                            <span className="text-tactical-orange">{(config as any)[param]}</span>
                          </div>
                          <input 
                            type="range" 
                            min={param === 'a' ? -10 : -20} 
                            max={param === 'a' ? 10 : 20} 
                            step="0.1"
                            value={(config as any)[param]}
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
              )}
              {activeTab === 'assessment' && (
                <div className="w-full space-y-6">
                  <div className="text-xs font-bold text-tactical-red bg-tactical-red/5 py-2 rounded-full inline-block px-4">
                    IRT Theta: {report.theta.toFixed(2)} | Items: {report.count}/{itemBank.length}
                  </div>

                  {administeredIds.size < itemBank.length ? (
                    <div className={`space-y-4 rounded-2xl transition-all ${showErrorGlow ? 'error-pendaran' : ''}`}>
                      {/* Question Display */}
                      <div className={`p-8 soft-ui-card text-xl font-mono border-l-4 relative transition-colors duration-300 ${
                        showErrorGlow 
                          ? 'bg-[#FFECEC] border-tactical-red' 
                          : 'bg-white border-tactical-orange'
                      }`}>
                        <span className="absolute top-2 right-3 text-[9px] font-bold text-muted-blue/30 uppercase">
                          {itemBank[currentItemIndex].id} • b={itemBank[currentItemIndex].params.b.toFixed(1)} a={itemBank[currentItemIndex].params.a.toFixed(1)}
                        </span>
                        {itemBank[currentItemIndex].question}
                      </div>

                      {/* Feedback Flash */}
                      {lastFeedback && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className={`text-center py-2 rounded-xl text-sm font-bold ${
                            lastFeedback.correct
                              ? 'bg-muted-green/10 text-muted-green'
                              : 'bg-tactical-red/10 text-tactical-red'
                          }`}
                        >
                          {lastFeedback.correct ? '✓ Benar' : '✗ Salah'} — θ diperbarui: {lastFeedback.theta.toFixed(3)}
                        </motion.div>
                      )}

                      {/* Answer Options */}
                      <div className="grid grid-cols-2 gap-4">
                        {itemBank[currentItemIndex].options.map((opt) => (
                          <button
                            key={opt.label}
                            onClick={() => handleAssessment(opt.isCorrect)}
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
                        Estimasi kemampuan akhir (θ): <span className="font-mono font-bold text-tactical-orange">{report.theta.toFixed(3)}</span>
                      </p>
                      <p className="text-sm text-muted-blue/60">
                        Mastery: <span className="font-mono font-bold">{report.mastery.toFixed(1)}%</span>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* RIGHT COLUMN: AI & PROGRESS (THE 30% MODAL) */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* SOCRATIC ASSISTANT PANEL */}
          <div className="soft-ui-card bg-muted-blue p-6 text-white overflow-hidden relative min-h-[400px] flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-tactical-orange flex items-center justify-center">?</div>
              <h3 className="font-bold text-sm">Socratic Assistant</h3>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto pr-2">
              <div className="bg-white/10 p-4 rounded-2xl rounded-tl-none text-[13px] leading-relaxed border border-white/5">
                Selamat datang di sesi IRT Adaptif. Materi apa yang ingin Anda eksplorasi lebih dalam?
              </div>
              
              {aiResponse && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-tactical-orange/20 p-4 rounded-2xl rounded-tr-none text-[13px] leading-relaxed border border-tactical-orange/30 italic self-end ml-4"
                >
                  {aiResponse}
                  {tokenInfo && (
                    <div className="mt-2 text-[9px] font-mono text-white/30 not-italic">
                      tokens: {tokenInfo.total} | cached: {tokenInfo.cached} | {tokenInfo.latency}ms
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            <div className="mt-4 relative">
              <input 
                disabled={isAiLoading}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Tanyakan sesuatu..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-tactical-orange transition-all placeholder:text-white/20"
                onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
              />
              <button 
                onClick={handleAskAI}
                disabled={isAiLoading || !chatInput.trim()}
                className="absolute right-2 top-2 p-1.5 bg-tactical-orange rounded-lg shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* MASTERY PROGRESS GATEKEEPER */}
          <div className={`soft-ui-card p-6 space-y-5 border-t-4 transition-colors duration-500 ${report.status === 'QUALIFIED' ? 'border-muted-green' : 'border-tactical-orange'}`}>
            {/* Header */}
            <div className="flex justify-between items-end">
              <div>
                <h4 className="text-[10px] font-bold text-muted-blue/40 uppercase tracking-widest">Mastery Gatekeeper</h4>
                <p className="text-xl font-black">{report.mastery.toFixed(1)}%</p>
              </div>
              <div className={`text-[10px] font-bold px-2 py-1 rounded ${report.status === 'QUALIFIED' ? 'text-muted-green bg-muted-green/5' : 'text-tactical-orange bg-tactical-orange/5'}`}>
                {report.status === 'QUALIFIED' ? '🔓 UNLOCKED' : '🔒 LOCKED'}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="relative">
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${report.mastery}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className={`h-full transition-colors duration-500 ${report.status === 'QUALIFIED' ? 'bg-muted-green' : 'bg-tactical-orange'}`} 
                />
              </div>
              {/* 90% threshold marker */}
              <div className="absolute top-0 left-[90%] -translate-x-1/2 h-3 w-0.5 bg-muted-blue/30" />
              <span className="absolute -bottom-4 left-[90%] -translate-x-1/2 text-[8px] font-mono text-muted-blue/30">90%</span>
            </div>

            {/* Module Progression Map */}
            <div className="pt-4 space-y-2">
              <h5 className="text-[9px] font-bold uppercase tracking-widest text-muted-blue/30 mb-3">Jalur Modul</h5>
              
              {/* Module 1: Current */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-tactical-orange/5 border border-tactical-orange/20">
                <div className="w-8 h-8 rounded-lg bg-tactical-orange/10 flex items-center justify-center text-tactical-orange font-black text-xs">1</div>
                <div className="flex-1">
                  <p className="text-xs font-bold">Aljabar & Fungsi Kuadrat</p>
                  <p className="text-[9px] text-muted-blue/40">Sedang dikerjakan • {report.count} item selesai</p>
                </div>
                <div className="text-[9px] font-mono font-bold text-tactical-orange">{report.mastery.toFixed(0)}%</div>
              </div>

              {/* Module 2: Gated */}
              <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-500 ${
                report.status === 'QUALIFIED' 
                  ? 'bg-muted-green/5 border-muted-green/20' 
                  : 'bg-gray-50 border-gray-100 opacity-60'
              }`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                  report.status === 'QUALIFIED' 
                    ? 'bg-muted-green/10 text-muted-green' 
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {report.status === 'QUALIFIED' ? '2' : '🔒'}
                </div>
                <div className="flex-1">
                  <p className={`text-xs font-bold ${report.status !== 'QUALIFIED' ? 'text-gray-400' : ''}`}>
                    Persamaan Linear & Sistem
                  </p>
                  <p className="text-[9px] text-muted-blue/40">
                    {report.status === 'QUALIFIED' ? 'Terbuka — siap dimulai' : 'Terkunci — butuh mastery ≥ 90%'}
                  </p>
                </div>
                {report.status === 'QUALIFIED' && (
                  <motion.span 
                    initial={{ scale: 0 }} 
                    animate={{ scale: 1 }} 
                    className="text-muted-green text-sm">✓</motion.span>
                )}
              </div>

              {/* Module 3: Locked */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 opacity-40">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 font-black text-xs">🔒</div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-400">Geometri Analitik</p>
                  <p className="text-[9px] text-gray-400">Terkunci — selesaikan Modul 2 terlebih dahulu</p>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            {report.status === 'QUALIFIED' ? (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full py-3 rounded-xl bg-muted-green text-white text-xs font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-lg"
              >
                Lanjut ke Modul 2 →
              </motion.button>
            ) : (
              <div className="w-full py-3 rounded-xl bg-gray-100 text-gray-400 text-xs font-bold uppercase tracking-widest text-center cursor-not-allowed">
                Selesaikan Assessment untuk Membuka Gerbang
              </div>
            )}

            {/* Theta info */}
            <p className="text-[9px] text-muted-blue/30 font-mono text-center">
              θ = {report.theta.toFixed(3)} | Mastery = {report.mastery.toFixed(1)}% | Threshold = 90%
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
