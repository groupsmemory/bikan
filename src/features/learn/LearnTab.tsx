/**
 * BIKAN Learn Tab - Video Lesson Selector
 */

'use client';

import React from 'react';
import { BookOpen } from 'lucide-react';
import { MODULE_1, Lesson } from '@/src/data/lessons';

interface LearnTabProps {
  activeLesson: Lesson;
  activeLessonIndex: number;
  onSelectLesson: (index: number) => void;
}

export const LearnTab: React.FC<LearnTabProps> = ({ activeLesson, activeLessonIndex, onSelectLesson }) => {
  return (
    <div className="w-full space-y-5 text-left">
      <div>
        <h2 className="text-xl font-bold">{activeLesson.title}</h2>
        <p className="text-sm text-muted-blue/60 leading-relaxed mt-1">{activeLesson.description}</p>
      </div>

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

      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-4 h-4 text-muted-blue/40" />
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-blue/40">Daftar Materi — {MODULE_1.title}</h4>
        </div>
        {MODULE_1.lessons.map((lesson, idx) => (
          <button
            key={lesson.id}
            onClick={() => onSelectLesson(idx)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
              idx === activeLessonIndex
                ? 'bg-tactical-orange/10 border border-tactical-orange/20'
                : 'hover:bg-muted-blue/5 border border-transparent'
            }`}
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black ${
              idx === activeLessonIndex ? 'bg-tactical-orange text-white' : 'bg-muted-blue/5 text-muted-blue/40'
            }`}>
              {lesson.order}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-bold truncate ${idx === activeLessonIndex ? 'text-tactical-orange' : ''}`}>{lesson.title}</p>
              <p className="text-[9px] text-muted-blue/40">{lesson.duration} • {lesson.bloomLevel}</p>
            </div>
            {idx === activeLessonIndex && (
              <span className="text-[9px] font-bold text-tactical-orange bg-tactical-orange/10 px-2 py-0.5 rounded">NOW</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
