/**
 * BIKAN Student Dashboard
 * ────────────────────────
 * Route: /dashboard
 * Pelacakan Streak, Progress Belajar, dan Theta Score
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Flame, Target, BookOpen, TrendingUp, Award, Calendar } from 'lucide-react';
import { useAuth } from '@/src/features/auth/AuthContext';
import { CURRICULUM, getModuleDuration } from '@/src/data/lessons';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [streakData, setStreakData] = useState({ currentStreak: 0, longestStreak: 0, totalMinutes: 0 });
  const [theta, setTheta] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Fetch theta from server
    import('@/app/actions/irt').then(({ getUserTheta }) => {
      getUserTheta(user.id).then(setTheta);
    });

    // Fetch streak data
    import('@/app/actions/streaks').then(({ getStreakData }) => {
      getStreakData(user.id).then((data: any) => {
        if (data) setStreakData(data);
      });
    });
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-tactical-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const mastery = Math.min(Math.max(((theta + 3.5) / 7) * 100, 0), 100);
  const abilityLabel = theta >= 2.5 ? 'Sangat Mahir' : theta >= 1.5 ? 'Mahir' : theta >= 0.5 ? 'Kompeten' : theta >= -0.5 ? 'Berkembang' : theta >= -1.5 ? 'Dasar' : 'Pemula';

  return (
    <div className="min-h-screen bg-neutral-base p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black">Dashboard Belajar</h1>
            <p className="text-sm text-muted-blue/50">Selamat datang kembali, {user.name} 👋</p>
          </div>
          <a href="/" className="text-xs font-bold text-tactical-orange hover:underline">← Kembali ke App</a>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={<Target className="w-5 h-5 text-tactical-orange" />}
            label="Theta Score"
            value={theta.toFixed(2)}
            sub={abilityLabel}
          />
          <StatCard
            icon={<Award className="w-5 h-5 text-muted-green" />}
            label="Mastery"
            value={`${mastery.toFixed(0)}%`}
            sub={mastery >= 90 ? 'Qualified' : 'In Progress'}
          />
          <StatCard
            icon={<Flame className="w-5 h-5 text-tactical-red" />}
            label="Streak"
            value={`${streakData.currentStreak}`}
            sub="hari berturut"
          />
          <StatCard
            icon={<Calendar className="w-5 h-5 text-muted-blue/60" />}
            label="Total Belajar"
            value={`${streakData.totalMinutes}`}
            sub="menit"
          />
        </div>

        {/* Mastery Progress Bar */}
        <div className="soft-ui-card p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-tactical-orange" />
              Progress Mastery
            </h2>
            <span className="text-[9px] font-mono text-muted-blue/40">threshold: 90%</span>
          </div>
          <div className="w-full h-4 bg-muted-blue/5 rounded-full overflow-hidden relative">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${mastery}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className={`h-full rounded-full ${mastery >= 90 ? 'bg-muted-green' : 'bg-tactical-orange'}`}
            />
            <div className="absolute top-0 left-[90%] h-full w-0.5 bg-muted-blue/20" />
          </div>
          <p className="text-[10px] text-muted-blue/40 text-center">
            {mastery >= 90
              ? '🎉 Selamat! Anda sudah melewati gerbang mastery. Modul berikutnya terbuka.'
              : `Butuh ${(90 - mastery).toFixed(0)}% lagi untuk membuka modul berikutnya.`}
          </p>
        </div>

        {/* Module Progress */}
        <div className="soft-ui-card p-6 space-y-4">
          <h2 className="font-bold text-sm flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-muted-blue/60" />
            Progress Kurikulum
          </h2>
          <div className="space-y-3">
            {CURRICULUM.map((mod, idx) => {
              const totalDuration = getModuleDuration(mod.id);
              const isLocked = idx > 0 && mastery < 90;

              return (
                <div
                  key={mod.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isLocked
                      ? 'bg-muted-blue/5 border-muted-blue/10 opacity-60'
                      : 'bg-white border-muted-blue/10 hover:border-tactical-orange/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold flex items-center gap-2">
                        {isLocked ? '🔒' : '📖'} {mod.title}
                      </p>
                      <p className="text-[10px] text-muted-blue/40 mt-0.5">
                        {mod.lessons.length} lessons • ~{Math.round(totalDuration / 60)} menit • Threshold: {mod.masteryThreshold}%
                      </p>
                    </div>
                    {!isLocked && mod.lessons.length > 0 && (
                      <a
                        href={`/learn/${mod.lessons[0].id}`}
                        className="text-[10px] font-bold text-tactical-orange hover:underline"
                      >
                        Mulai →
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <a href="/learn" className="soft-ui-card p-5 text-center hover:scale-[1.02] transition-transform">
            <BookOpen className="w-6 h-6 text-tactical-orange mx-auto mb-2" />
            <p className="text-xs font-bold">Lanjut Belajar</p>
          </a>
          <a href="/" className="soft-ui-card p-5 text-center hover:scale-[1.02] transition-transform">
            <Brain className="w-6 h-6 text-muted-green mx-auto mb-2" />
            <p className="text-xs font-bold">Latihan Soal</p>
          </a>
        </div>
      </div>
    </div>
  );
}

// Missing import for Brain
import { Brain } from 'lucide-react';

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="soft-ui-card p-4 space-y-2">
      {icon}
      <div>
        <p className="text-xl font-black">{value}</p>
        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-blue/40">{label}</p>
        <p className="text-[9px] text-muted-blue/30">{sub}</p>
      </div>
    </div>
  );
}
