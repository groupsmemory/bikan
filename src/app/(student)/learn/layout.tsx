"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

/**
 * BIKAN State Preservation Layout
 * Ensures Micro-Learning Player remains mounted across sub-routes
 */
export default function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-neutral-base">
      {/* PERSISTENT HEADER / PLAYER CONTAINER */}
      <header className="sticky top-0 z-50 w-full p-4 bg-neutral-base/80 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-full bg-tactical-orange flex items-center justify-center text-white font-bold">
              B
            </div>
            <h1 className="font-semibold text-muted-blue hidden md:block">
              BIKAN Micro-Learning Player
            </h1>
          </div>
          
          {/* Simulated Persistent Player State */}
          <div className="soft-ui-card px-4 py-2 flex items-center space-x-3 text-xs">
            <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            <span className="font-mono uppercase tracking-wider">
              {isPlaying ? 'Now Playing: Aljabar Dasar' : 'Paused'}
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col md:flex-row gap-8">
        {/* SIDEBAR NAVIGATION (PERSISTENT) */}
        <nav className="w-full md:w-64 space-y-4">
          <h3 className="text-sm font-bold text-muted-blue/50 uppercase tracking-widest px-2">Kurikulum</h3>
          <ul className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <li key={i}>
                <button className={`w-full text-left px-4 py-3 soft-ui-card transition-all hover:scale-[1.02] active:scale-95 ${i === 1 ? 'border-tactical-orange' : ''}`}>
                  <span className="text-xs font-bold text-muted-blue">0{i}. Modul Aljabar</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* DYNAMIC CONTENT AREA */}
        <section className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </section>
      </main>

      {/* Floating Socratic AI Trigger */}
      <motion.button 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-8 right-8 w-16 h-16 rounded-2xl bg-muted-blue shadow-2xl flex items-center justify-center text-white soft-ui-card border-none"
      >
        <span className="text-2xl">?</span>
      </motion.button>
    </div>
  );
}
