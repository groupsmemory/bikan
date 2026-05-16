/**
 * BIKAN Learn Index — Lesson List
 * ────────────────────────────────
 * Route: /learn
 * Daftar semua lesson dalam modul aktif
 */

'use client';

import React from 'react';
import { BookOpen, Clock, Award } from 'lucide-react';
import { CURRICULUM } from '@/src/data/lessons';

export default function LearnIndexPage() {
  return (
    <div className="flex-1 space-y-8">
      <div>
        <h1 className="text-2xl font-black">Kurikulum BIKAN</h1>
        <p className="text-sm text-muted-blue/50 mt-1">Pilih materi untuk mulai belajar</p>
      </div>

      {CURRICULUM.map(mod => (
        <div key={mod.id} className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-lg">{mod.title}</h2>
              <p className="text-xs text-muted-blue/50">{mod.description}</p>
            </div>
            <span className="text-[9px] font-bold text-muted-blue/30 bg-muted-blue/5 px-2 py-1 rounded">
              {mod.lessons.length} lessons
            </span>
          </div>

          {mod.lessons.length > 0 ? (
            <div className="grid gap-3">
              {mod.lessons.map((lesson, idx) => (
                <a
                  key={lesson.id}
                  href={`/learn/${lesson.id}`}
                  className="soft-ui-card p-4 flex items-center gap-4 hover:scale-[1.01] hover:border-tactical-orange/30 transition-all"
                >
                  {/* Order badge */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black bg-gradient-to-br ${lesson.thumbnailColor} text-white`}>
                    {lesson.order}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{lesson.title}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-[10px] text-muted-blue/40">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {lesson.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        {lesson.bloomLevel}
                      </span>
                      <span>{lesson.chapters.length} chapters</span>
                    </div>
                  </div>

                  {/* Arrow */}
                  <span className="text-muted-blue/20 text-lg">→</span>
                </a>
              ))}
            </div>
          ) : (
            <div className="soft-ui-card p-6 text-center">
              <p className="text-sm text-muted-blue/40">🔒 Modul ini belum tersedia. Selesaikan modul sebelumnya terlebih dahulu.</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
