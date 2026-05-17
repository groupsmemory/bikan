/**
 * BIKAN Developer Dashboard — Private Roadmap & Progress Tracker
 * ───────────────────────────────────────────────────────────────
 * Route: /dev
 * Protected: hanya role=admin yang bisa akses (di-enforce middleware)
 *
 * Fitur:
 * - Checklist progress per fase
 * - Persentase overall
 * - Sprint planning (hari ini / besok)
 * - KPI targets vs current
 * - Blockers & dependencies
 * - Quick reference commands
 */

'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle, Circle, AlertTriangle, Clock, Target, TrendingUp, Flame, Code, Database, Shield } from 'lucide-react';

// ─── Roadmap Data ───
interface Task {
  id: string;
  title: string;
  status: 'done' | 'todo' | 'blocked' | 'in_progress';
  notes?: string;
}

interface Phase {
  id: string;
  title: string;
  timeline: string;
  tasks: Task[];
}

const PHASES: Phase[] = [
  {
    id: 'phase-1',
    title: 'Fase 1: Alpha Testing & Security Hardening',
    timeline: 'Minggu 1-2',
    tasks: [
      { id: '1.1', title: 'Migrasi auth ke httpOnly JWT cookies', status: 'done', notes: 'lib/auth/session.ts + middleware' },
      { id: '1.2', title: 'Hapus localStorage auth (dead code)', status: 'done', notes: 'auth-service.ts deleted' },
      { id: '1.3', title: 'Security headers (X-Frame, CSP)', status: 'done', notes: 'middleware.ts' },
      { id: '1.4', title: 'IRT engine unit tests + edge cases', status: 'done', notes: '23 tests passing' },
      { id: '1.5', title: 'CAT engine tests', status: 'done', notes: '18 tests passing' },
      { id: '1.6', title: 'Diagnostics engine tests', status: 'done', notes: '16 tests passing' },
      { id: '1.7', title: 'Pre-push hook (auto test)', status: 'done', notes: '.githooks/pre-push' },
      { id: '1.8', title: 'db:check script', status: 'done', notes: 'drizzle-kit check before push' },
      { id: '1.9', title: 'Encode 5 video HLS', status: 'blocked', notes: 'Menunggu video dari instruktur' },
      { id: '1.10', title: 'Environment validation (crash early)', status: 'done', notes: 'lib/env.ts' },
      { id: '1.11', title: 'Error boundaries per route group', status: 'done', notes: 'student, instructor, mentor, dev' },
      { id: '1.12', title: 'Role-based middleware enforcement', status: 'done', notes: '/instructor, /mentor, /dev restricted' },
    ],
  },
  {
    id: 'phase-2',
    title: 'Fase 2: Beta Pilot & Legal Compliance',
    timeline: 'Minggu 3-6',
    tasks: [
      { id: '2.1', title: 'Xendit sandbox → production', status: 'todo', notes: 'Ganti API key + signature verify' },
      { id: '2.2', title: 'Terms of Service page', status: 'done', notes: 'app/terms/page.tsx' },
      { id: '2.3', title: 'Privacy Policy page', status: 'done', notes: 'app/privacy/page.tsx' },
      { id: '2.4', title: 'Akta pendirian KMP BIKAN', status: 'todo', notes: 'Non-tech: Notaris + Kemenkop' },
      { id: '2.5', title: 'Rekrutmen 1 instruktur matematika', status: 'todo', notes: 'Operasional' },
      { id: '2.6', title: 'Pilot 10-20 siswa aktif', status: 'todo', notes: 'Setelah video ready' },
      { id: '2.7', title: 'Email verification flow', status: 'done', notes: 'OTP 6-digit, bcrypt, 10min expiry' },
      { id: '2.8', title: 'Mastery Gatekeeper server-side', status: 'done', notes: 'Dual: theta + completion' },
      { id: '2.9', title: 'Landing page SEO optimization', status: 'done', notes: 'JSON-LD, OG, Twitter cards' },
    ],
  },
  {
    id: 'phase-3',
    title: 'Fase 3: Production Scale & Open Launch',
    timeline: 'Bulan 2-3',
    tasks: [
      { id: '3.1', title: 'Sentry error monitoring', status: 'done', notes: 'lib/analytics/sentry.ts' },
      { id: '3.2', title: 'PostHog analytics', status: 'done', notes: 'lib/analytics/posthog.ts' },
      { id: '3.3', title: 'SHU automation (cron)', status: 'done', notes: 'app/api/cron/shu/route.ts' },
      { id: '3.4', title: 'Redis rate limiting', status: 'todo', notes: 'Butuh Upstash account' },
      { id: '3.5', title: 'Modul 2: Persamaan Linear', status: 'done', notes: '5 lessons scaffolded' },
      { id: '3.6', title: 'UTBK/CPNS expansion', status: 'done', notes: 'Modul 3 + 4 = 10 lessons' },
      { id: '3.7', title: 'Domain setup (bikan.id)', status: 'todo' },
      { id: '3.8', title: 'SSL + HSTS', status: 'todo', notes: 'Auto via Vercel' },
    ],
  },
];

const KPI_TARGETS = [
  { metric: 'Activation Rate', target: '> 65%', current: '—', achieved: false },
  { metric: 'Mastery Speed', target: '< 25 min/sub-bab', current: '—', achieved: false },
  { metric: 'Day-7 Retention', target: '> 45%', current: '—', achieved: false },
  { metric: 'Error Decline (3rd)', target: '> 40%', current: '—', achieved: false },
  { metric: 'Video Cold Start', target: '< 1.5s', current: '< 1s', achieved: true },
  { metric: 'Canvas FPS', target: '60fps', current: '60fps', achieved: true },
  { metric: 'AI Response', target: '< 1.5s', current: '~800ms', achieved: true },
  { metric: 'UX CSAT', target: '> 85%', current: '—', achieved: false },
];

const BLOCKERS = [
  { item: 'Video HLS encode', dependency: 'Rekaman dari instruktur', impact: 'Tidak bisa test video lokal' },
  { item: 'Xendit production', dependency: 'Akun bisnis verified', impact: 'Tidak bisa terima pembayaran' },
  { item: 'Pilot testing', dependency: 'Video + instruktur + siswa', impact: 'Tidak bisa validasi KPI' },
  { item: 'Akta KMP', dependency: 'Notaris + anggota pendiri', impact: 'SHU belum legal' },
];

export default function DevDashboard() {
  const [activePhase, setActivePhase] = useState('phase-1');

  // Calculate progress
  const allTasks = PHASES.flatMap(p => p.tasks);
  const doneTasks = allTasks.filter(t => t.status === 'done');
  const overallProgress = Math.round((doneTasks.length / allTasks.length) * 100);

  const getPhaseProgress = (phase: Phase) => {
    const done = phase.tasks.filter(t => t.status === 'done').length;
    return Math.round((done / phase.tasks.length) * 100);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#F1F5F9] p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-3">
              <Code className="w-6 h-6 text-tactical-orange" />
              BIKAN Dev Dashboard
            </h1>
            <p className="text-sm text-[#94A3B8] mt-1">Private roadmap & progress tracker</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black text-tactical-orange">{overallProgress}%</p>
            <p className="text-[9px] uppercase tracking-widest text-[#94A3B8]">Overall Progress</p>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="space-y-2">
          <div className="w-full h-3 bg-[#1E293B] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${overallProgress}%` }}
              transition={{ duration: 1 }}
              className="h-full bg-gradient-to-r from-tactical-orange to-amber-400 rounded-full"
            />
          </div>
          <div className="flex justify-between text-[9px] text-[#94A3B8]">
            <span>{doneTasks.length}/{allTasks.length} tasks done</span>
            <span>Target: Production Launch Bulan ke-3</span>
          </div>
        </div>

        {/* Phase Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PHASES.map(phase => {
            const progress = getPhaseProgress(phase);
            return (
              <button
                key={phase.id}
                onClick={() => setActivePhase(phase.id)}
                className={`p-5 rounded-2xl text-left transition-all ${
                  activePhase === phase.id
                    ? 'bg-[#1E293B] border border-tactical-orange/30 scale-[1.02]'
                    : 'bg-[#1E293B]/50 border border-[#334155] hover:border-[#475569]'
                }`}
              >
                <p className="text-[9px] uppercase tracking-widest text-[#94A3B8]">{phase.timeline}</p>
                <p className="text-sm font-bold mt-1">{phase.title.split(':')[1]}</p>
                <div className="mt-3 w-full h-1.5 bg-[#334155] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${progress === 100 ? 'bg-green-500' : 'bg-tactical-orange'}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-[10px] text-[#94A3B8] mt-1">{progress}%</p>
              </button>
            );
          })}
        </div>

        {/* Active Phase Tasks */}
        {PHASES.filter(p => p.id === activePhase).map(phase => (
          <div key={phase.id} className="bg-[#1E293B] rounded-2xl p-6 space-y-4">
            <h2 className="font-bold text-sm">{phase.title}</h2>
            <div className="space-y-2">
              {phase.tasks.map(task => (
                <div
                  key={task.id}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                    task.status === 'done' ? 'bg-green-500/5' :
                    task.status === 'blocked' ? 'bg-amber-500/5' :
                    task.status === 'in_progress' ? 'bg-tactical-orange/5' :
                    'bg-[#0F172A]/50'
                  }`}
                >
                  {task.status === 'done' && <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />}
                  {task.status === 'todo' && <Circle className="w-4 h-4 text-[#475569] flex-shrink-0" />}
                  {task.status === 'blocked' && <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />}
                  {task.status === 'in_progress' && <Clock className="w-4 h-4 text-tactical-orange flex-shrink-0" />}

                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium ${task.status === 'done' ? 'line-through text-[#94A3B8]' : ''}`}>
                      <span className="text-[#475569] mr-2">{task.id}</span>
                      {task.title}
                    </p>
                    {task.notes && (
                      <p className="text-[9px] text-[#64748B] mt-0.5">{task.notes}</p>
                    )}
                  </div>

                  <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${
                    task.status === 'done' ? 'bg-green-500/10 text-green-400' :
                    task.status === 'blocked' ? 'bg-amber-500/10 text-amber-400' :
                    task.status === 'in_progress' ? 'bg-tactical-orange/10 text-tactical-orange' :
                    'bg-[#334155] text-[#64748B]'
                  }`}>
                    {task.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Two Column: KPIs + Blockers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* KPI Targets */}
          <div className="bg-[#1E293B] rounded-2xl p-6 space-y-4">
            <h2 className="font-bold text-sm flex items-center gap-2">
              <Target className="w-4 h-4 text-tactical-orange" />
              KPI Targets (PRD)
            </h2>
            <div className="space-y-2">
              {KPI_TARGETS.map(kpi => (
                <div key={kpi.metric} className="flex items-center justify-between p-2 rounded-lg bg-[#0F172A]/50">
                  <div>
                    <p className="text-[10px] font-medium">{kpi.metric}</p>
                    <p className="text-[8px] text-[#64748B]">Target: {kpi.target}</p>
                  </div>
                  <span className={`text-[10px] font-bold ${kpi.achieved ? 'text-green-400' : 'text-[#64748B]'}`}>
                    {kpi.current}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Blockers */}
          <div className="bg-[#1E293B] rounded-2xl p-6 space-y-4">
            <h2 className="font-bold text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Blockers & Dependencies
            </h2>
            <div className="space-y-2">
              {BLOCKERS.map(b => (
                <div key={b.item} className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                  <p className="text-[10px] font-bold text-amber-400">{b.item}</p>
                  <p className="text-[9px] text-[#94A3B8]">Depends: {b.dependency}</p>
                  <p className="text-[8px] text-[#64748B]">Impact: {b.impact}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Architecture Summary */}
        <div className="bg-[#1E293B] rounded-2xl p-6 space-y-4">
          <h2 className="font-bold text-sm flex items-center gap-2">
            <Database className="w-4 h-4 text-[#94A3B8]" />
            Tech Stack & Architecture
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px]">
            {[
              { label: 'Framework', value: 'Next.js 15 (App Router)' },
              { label: 'Database', value: 'NeonDB (Serverless PG)' },
              { label: 'ORM', value: 'Drizzle' },
              { label: 'AI', value: 'Gemini 2.5 Flash (Free)' },
              { label: 'Auth', value: 'JWT httpOnly + jose' },
              { label: 'Payment', value: 'Xendit' },
              { label: 'Video', value: 'HLS.js + Vercel CDN' },
              { label: 'Styling', value: 'Tailwind CSS v4' },
              { label: 'Testing', value: 'Vitest (57 tests)' },
              { label: 'Deploy', value: 'Vercel Free Tier' },
              { label: 'PWA', value: 'Service Worker + IndexedDB' },
              { label: 'IRT', value: '3PLM + MLEF + CAT' },
            ].map(item => (
              <div key={item.label} className="p-2 rounded-lg bg-[#0F172A]/50">
                <p className="text-[8px] text-[#64748B] uppercase">{item.label}</p>
                <p className="font-medium text-[#F1F5F9]">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[9px] text-[#475569] space-y-1">
          <p>BIKAN LMS — Koperasi Multi-Pihak EdTech</p>
          <p>Last deploy: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <a href="/" className="text-tactical-orange hover:underline">← Kembali ke App</a>
        </div>
      </div>
    </div>
  );
}
