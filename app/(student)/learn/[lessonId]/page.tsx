/**
 * BIKAN Dynamic Lesson Page
 * ──────────────────────────
 * Route: /learn/[lessonId]
 * Ruang Belajar: Video + Canvas + Diagnostics + Socratic AI
 *
 * Setiap lesson memiliki URL unik yang shareable:
 * /learn/lesson-01-pengantar
 * /learn/lesson-03-diskriminan
 */

'use client';

import React, { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, BookOpen, PenTool, Brain, MessageCircle } from 'lucide-react';
import { findLessonById, MODULE_1 } from '@/src/data/lessons';
import { CinematicPlayer } from '@/src/features/player/CinematicPlayer';
import { CanvasTab } from '@/src/features/canvas/CanvasTab';
import { DiagnosticsWorkspace } from '@/src/features/diagnostics';
import { SocraticPanel } from '@/src/features/chat/SocraticPanel';
import { useAuth } from '@/src/features/auth/AuthContext';
import { useDarkMode } from '@/src/hooks/use-dark-mode';

type TabId = 'video' | 'canvas' | 'diagnostics' | 'ai';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'video', label: 'Materi', icon: <BookOpen className="w-3.5 h-3.5" /> },
  { id: 'canvas', label: 'Canvas', icon: <PenTool className="w-3.5 h-3.5" /> },
  { id: 'diagnostics', label: 'Latihan', icon: <Brain className="w-3.5 h-3.5" /> },
  { id: 'ai', label: 'AI Tutor', icon: <MessageCircle className="w-3.5 h-3.5" /> },
];

export default function LessonPage() {
  const params = useParams();
  const lessonId = params.lessonId as string;
  const { user } = useAuth();
  const { isDark } = useDarkMode();

  const [activeTab, setActiveTab] = useState<TabId>('video');
  const [config, setConfig] = useState({ a: 1, b: 0, c: 0 });

  // Find lesson from Git-CMS
  const lesson = useMemo(() => findLessonById(lessonId), [lessonId]);

  // Find next/prev lessons
  const lessonIndex = MODULE_1.lessons.findIndex(l => l.id === lessonId);
  const prevLesson = lessonIndex > 0 ? MODULE_1.lessons[lessonIndex - 1] : null;
  const nextLesson = lessonIndex < MODULE_1.lessons.length - 1 ? MODULE_1.lessons[lessonIndex + 1] : null;

  if (!lesson) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
        <p className="text-4xl mb-4">📚</p>
        <h2 className="text-lg font-bold text-muted-blue">Lesson tidak ditemukan</h2>
        <p className="text-sm text-muted-blue/50 mt-2">ID: {lessonId}</p>
        <a href="/learn" className="mt-4 text-xs font-bold text-tactical-orange hover:underline">
          ← Kembali ke daftar materi
        </a>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6">
      {/* Lesson Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] font-bold uppercase tracking-widest text-tactical-orange bg-tactical-orange/10 px-2 py-0.5 rounded">
              {lesson.bloomLevel}
            </span>
            <span className="text-[9px] text-muted-blue/40">{lesson.duration}</span>
          </div>
          <h1 className="text-xl font-bold text-muted-blue">{lesson.title}</h1>
          <p className="text-sm text-muted-blue/50 mt-1 leading-relaxed">{lesson.description}</p>
        </div>
      </div>

      {/* Video Player */}
      <CinematicPlayer
        src={lesson.videoUrl}
        lessonId={lesson.id}
        isDark={isDark}
        chapters={lesson.chapters}
      />

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-muted-blue/5 rounded-xl">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
              activeTab === tab.id
                ? 'bg-white shadow-sm text-tactical-orange'
                : 'text-muted-blue/40 hover:text-muted-blue/60'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'video' && (
            <div className="space-y-4">
              {/* Chapters list */}
              <div className="soft-ui-card p-5 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-blue/40">
                  Chapters ({lesson.chapters.length} segmen)
                </h3>
                <div className="space-y-1.5">
                  {lesson.chapters.map((ch, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted-blue/5 transition-colors">
                      <span className="text-[9px] font-mono text-muted-blue/30 w-10">
                        {Math.floor(ch.startTime / 60)}:{(ch.startTime % 60).toString().padStart(2, '0')}
                      </span>
                      <span className="text-xs text-muted-blue/70">{ch.title}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                {lesson.tags.map(tag => (
                  <span key={tag} className="text-[9px] font-medium text-muted-blue/40 bg-muted-blue/5 px-2 py-0.5 rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'canvas' && (
            <CanvasTab config={config} setConfig={setConfig} isDark={isDark} />
          )}

          {activeTab === 'diagnostics' && (
            <DiagnosticsWorkspace
              onCorrectSolution={() => {
                if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]);
              }}
            />
          )}

          {activeTab === 'ai' && user && (
            <SocraticPanel userId={user.id} lessonId={lesson.id} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation: Prev / Next Lesson */}
      <div className="flex items-center justify-between pt-4 border-t border-muted-blue/10">
        {prevLesson ? (
          <a
            href={`/learn/${prevLesson.id}`}
            className="flex items-center gap-2 text-xs font-bold text-muted-blue/50 hover:text-tactical-orange transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {prevLesson.title}
          </a>
        ) : <div />}

        {nextLesson && (
          <a
            href={`/learn/${nextLesson.id}`}
            className="flex items-center gap-2 text-xs font-bold text-tactical-orange hover:underline"
          >
            {nextLesson.title}
            <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
          </a>
        )}
      </div>
    </div>
  );
}
