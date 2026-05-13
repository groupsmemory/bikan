/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, ChevronRight, BrainCircuit, Activity, Calculator, Sliders } from 'lucide-react';
import { QuadraticCanvas } from '@/src/features/canvas/QuadraticCanvas';
import { DiagnosticSession } from '@/src/features/assessment/diagnostic-service';

export default function App() {
  const [activeTab, setActiveTab] = useState('canvas');
  const [isPlaying, setIsPlaying] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Quadratic Config for Canvas
  const [config, setConfig] = useState({ a: 1, b: 0, c: 0 });

  // Diagnostic Session
  const session = useMemo(() => new DiagnosticSession(), []);
  const [report, setReport] = useState(session.getSessionReport());

  const handleAssessment = (correct: boolean, diff: number) => {
    session.addResponse(correct, diff);
    setReport(session.getSessionReport());
  };

  // Simulated Socratic Interaction
  const handleAskAI = () => {
    setIsAiLoading(true);
    setTimeout(() => {
      setAiResponse("Bagaimana jika Anda mencoba menggeser nilai 'a'? Perhatikan apakah mulut parabola terbuka lebih lebar atau lebih sempit.");
      setIsAiLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-neutral-base font-sans text-muted-blue selection:bg-tactical-orange/20">
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
          <button className="soft-ui-card p-2 rounded-xl text-tactical-orange hover:scale-105 transition-transform">
            <BrainCircuit className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* 2. MAIN CONTENT GRID */}
      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: PLAYER & CANVAS (THE 60% AREA) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* VIDEO PLAYER COMPONENT */}
          <div className="relative aspect-video soft-ui-card overflow-hidden group">
            <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors z-10" />
            <div className="absolute inset-0 flex items-center justify-center bg-muted-blue/90 animate-pulse text-white/50 font-mono text-xs">
              [ HLS_STREAM_LOADER: SIMULATING 1080P_BITRATE ]
            </div>
            
            {/* Player Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent z-20 flex items-center gap-4">
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-12 h-12 rounded-full bg-tactical-orange text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"
              >
                {isPlaying ? <Pause /> : <Play fill="currentColor" />}
              </button>
              <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: "0%" }}
                  animate={{ width: isPlaying ? "100%" : "30%" }}
                  transition={{ duration: isPlaying ? 60 : 0.5 }}
                  className="h-full bg-tactical-orange" 
                />
              </div>
            </div>
          </div>

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
                <>
                  <h2 className="text-2xl font-bold text-muted-blue">Pengantar Persamaan Kuadrat</h2>
                  <p className="text-muted-blue/50 max-w-md">Dalam unit mikro ini, Anda akan mempelajari bagaimana nilai diskriminan mempengaruhi bentuk kurva parabola.</p>
                </>
              )}
              {activeTab === 'canvas' && (
                <div className="w-full flex flex-col md:flex-row gap-8 items-center">
                  <QuadraticCanvas a={config.a} b={config.b} c={config.c} />
                  
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
                    IRT Theta: {report.theta.toFixed(2)} | Items: {report.count}
                  </div>
                  <div className="space-y-4">
                    <div className="p-8 soft-ui-card bg-white text-xl font-mono border-l-4 border-tactical-orange">
                      f(x) = x² + 2x + 1. Berapakah nilai x saat f(x) = 0?
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: 'x = 1', val: false, diff: -1 },
                        { label: 'x = -1', val: true, diff: 0.5 },
                        { label: 'x = 0', val: false, diff: -0.5 },
                        { label: 'Tidak Tahu', val: false, diff: -2 }
                      ].map(ans => (
                        <button 
                          key={ans.label} 
                          onClick={() => handleAssessment(ans.val, ans.diff)}
                          className="soft-ui-card py-5 font-bold hover:scale-[1.02] active:soft-ui-pressed transition-all hover:border-tactical-orange"
                        >
                          {ans.label}
                        </button>
                      ))}
                    </div>
                  </div>
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
                </motion.div>
              )}
            </div>

            <div className="mt-4 relative">
              <input 
                disabled={isAiLoading}
                placeholder="Tanyakan sesuatu..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-tactical-orange transition-all placeholder:text-white/20"
                onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
              />
              <button 
                onClick={handleAskAI}
                className="absolute right-2 top-2 p-1.5 bg-tactical-orange rounded-lg shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* MASTERY PROGRESS GATEKEEPER */}
          <div className={`soft-ui-card p-6 space-y-4 border-t-4 transition-colors duration-500 ${report.status === 'QUALIFIED' ? 'border-muted-green' : 'border-tactical-orange'}`}>
            <div className="flex justify-between items-end">
              <div>
                <h4 className="text-[10px] font-bold text-muted-blue/40 uppercase tracking-widest">Mastery Threshold</h4>
                <p className="text-xl font-black">{report.mastery.toFixed(1)}%</p>
              </div>
              <div className={`text-[10px] font-bold px-2 py-1 rounded ${report.status === 'QUALIFIED' ? 'text-muted-green bg-muted-green/5' : 'text-tactical-orange bg-tactical-orange/5'}`}>
                {report.status}
              </div>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner">
               <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${report.mastery}%` }}
                className={`h-full shadow-[0_0_10px_rgba(0,0,0,0.1)] transition-colors duration-500 ${report.status === 'QUALIFIED' ? 'bg-muted-green' : 'bg-tactical-orange'}`} 
               />
            </div>
            <p className="text-[10px] text-muted-blue/40 leading-relaxed italic">
              {report.status === 'QUALIFIED' 
                ? '✓ Kompetensi terpenuhi. Anda dapat melanjutkan ke Modul Aljabar II.' 
                : '* Gerbang modul lanjutan akan terbuka otomatis saat skor diagnostik mencapai 90%.'}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
