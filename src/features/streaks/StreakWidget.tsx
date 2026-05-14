/**
 * BIKAN Learning Streak Widget
 * ─────────────────────────────
 * Menampilkan streak harian tanpa papan peringkat sosial
 * Fokus: motivasi intrinsik, bukan kompetisi
 */

'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { getStreakData, StreakData } from '@/app/actions/streaks';

interface StreakWidgetProps {
  userId: string;
}

const DAYS_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export const StreakWidget: React.FC<StreakWidgetProps> = ({ userId }) => {
  const [data, setData] = useState<StreakData | null>(null);

  useEffect(() => {
    getStreakData(userId).then(setData);
  }, [userId]);

  if (!data) {
    return (
      <div className="soft-ui-card p-4 animate-pulse">
        <div className="h-4 bg-muted-blue/5 rounded w-24 mb-3" />
        <div className="h-8 bg-muted-blue/5 rounded w-16" />
      </div>
    );
  }

  const streakActive = data.currentStreak > 0;
  const todayGoalMet = data.todayMinutes >= 30;

  return (
    <div className="soft-ui-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-blue/40">
          Learning Streak
        </h4>
        {streakActive && (
          <span className="text-lg" title={`${data.currentStreak} hari berturut-turut`}>
            🔥
          </span>
        )}
      </div>

      {/* Streak Count */}
      <div className="flex items-end gap-2">
        <motion.span
          key={data.currentStreak}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-3xl font-black text-tactical-orange"
        >
          {data.currentStreak}
        </motion.span>
        <span className="text-xs text-muted-blue/40 pb-1">
          hari berturut-turut
        </span>
      </div>

      {/* Weekly Heatmap */}
      <div className="flex gap-1.5 justify-between">
        {data.weekData.map((day, i) => {
          const dayOfWeek = new Date(day.date).getDay();
          return (
            <div key={day.date} className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold transition-colors ${
                  day.active
                    ? 'bg-tactical-orange text-white'
                    : day.minutes > 0
                    ? 'bg-tactical-orange/20 text-tactical-orange'
                    : 'bg-muted-blue/5 text-muted-blue/20'
                }`}
                title={`${day.date}: ${day.minutes} menit`}
              >
                {day.active ? '✓' : day.minutes > 0 ? day.minutes : '·'}
              </div>
              <span className="text-[8px] text-muted-blue/30">{DAYS_SHORT[dayOfWeek]}</span>
            </div>
          );
        })}
      </div>

      {/* Today's Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-[10px]">
          <span className="text-muted-blue/40">Hari ini</span>
          <span className={`font-bold ${todayGoalMet ? 'text-muted-green' : 'text-muted-blue/60'}`}>
            {data.todayMinutes}/30 menit
          </span>
        </div>
        <div className="w-full h-2 bg-muted-blue/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((data.todayMinutes / 30) * 100, 100)}%` }}
            transition={{ duration: 0.6 }}
            className={`h-full rounded-full ${todayGoalMet ? 'bg-muted-green' : 'bg-tactical-orange'}`}
          />
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex justify-between pt-2 border-t border-muted-blue/5">
        <div>
          <p className="text-[9px] text-muted-blue/30 uppercase">Rekor</p>
          <p className="text-sm font-bold">{data.longestStreak} hari</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] text-muted-blue/30 uppercase">Aktivitas hari ini</p>
          <p className="text-sm font-bold">{data.todayActivities}</p>
        </div>
      </div>

      {/* Motivational message (no social comparison) */}
      <p className="text-[9px] text-muted-blue/30 italic text-center">
        {todayGoalMet
          ? '✨ Target harian tercapai. Konsistensi adalah kunci!'
          : data.todayMinutes > 0
          ? `Sedikit lagi — ${30 - data.todayMinutes} menit lagi untuk menjaga streak.`
          : 'Mulai belajar hari ini untuk membangun streak baru.'}
      </p>
    </div>
  );
};
