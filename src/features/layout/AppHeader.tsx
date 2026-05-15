/**
 * BIKAN App Header
 * ────────────────
 * Persistent top bar with branding, theta display, dark mode toggle, logout
 */

'use client';

import React from 'react';
import { Activity, Moon, Sun, Monitor, LogOut } from 'lucide-react';
import { ThemeMode } from '@/src/hooks/use-dark-mode';

interface AppHeaderProps {
  userName: string;
  theta: number;
  mode: ThemeMode;
  isDark: boolean;
  luxLevel: number | null;
  onToggleTheme: () => void;
  onLogout: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  userName,
  theta,
  mode,
  isDark,
  luxLevel,
  onToggleTheme,
  onLogout,
}) => {
  return (
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
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-blue/60">
            θ: {theta.toFixed(2)} • {userName}
          </span>
        </div>

        {/* Dark Mode Toggle */}
        <button
          onClick={onToggleTheme}
          className="soft-ui-card p-2 rounded-xl hover:scale-105 transition-transform relative group"
          aria-label={`Tema: ${mode === 'auto' ? 'Otomatis' : mode === 'dark' ? 'Gelap' : 'Terang'}`}
          title={`Mode: ${mode}${luxLevel !== null ? ` (lux: ${luxLevel.toFixed(0)})` : ''}`}
        >
          {mode === 'dark' && <Moon className="w-5 h-5 text-indigo-400" />}
          {mode === 'light' && <Sun className="w-5 h-5 text-tactical-orange" />}
          {mode === 'auto' && <Monitor className="w-5 h-5 text-muted-blue/60" />}
          <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${isDark ? 'bg-indigo-400' : 'bg-tactical-orange'}`} />
        </button>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="soft-ui-card p-2 rounded-xl text-muted-blue/40 hover:text-tactical-red hover:scale-105 transition-all"
          title="Keluar"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
