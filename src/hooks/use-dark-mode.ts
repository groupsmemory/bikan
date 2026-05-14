/**
 * BIKAN Dark Mode Adaptif Hook
 * ─────────────────────────────
 * PRD US-ALG-001: "Sistem wajib mendeteksi data sensor lux pencahayaan sekitar gawai;
 * jika nilai lux < 50, antarmuka secara otomatis beralih ke mode kontras tinggi OLED."
 *
 * Strategi deteksi (prioritas):
 * 1. Ambient Light Sensor API (jika tersedia di device) → lux < 50 = dark
 * 2. prefers-color-scheme media query (OS-level preference)
 * 3. Manual toggle oleh user (override semua)
 */

import { useState, useEffect, useCallback } from 'react';

export type ThemeMode = 'light' | 'dark' | 'auto';

interface DarkModeState {
  mode: ThemeMode;          // Preferensi user: 'light' | 'dark' | 'auto'
  isDark: boolean;          // Resolved state: apakah saat ini dark?
  luxLevel: number | null;  // Nilai lux sensor (null jika tidak tersedia)
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

const STORAGE_KEY = 'bikan-theme-mode';

export function useDarkMode(): DarkModeState {
  // Load saved preference
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'auto';
    return (localStorage.getItem(STORAGE_KEY) as ThemeMode) || 'auto';
  });

  const [luxLevel, setLuxLevel] = useState<number | null>(null);
  const [systemPrefersDark, setSystemPrefersDark] = useState(false);

  // ─── 1. Detect OS-level preference via media query ───
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemPrefersDark(mq.matches);

    const handler = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // ─── 2. Ambient Light Sensor API (progressive enhancement) ───
  useEffect(() => {
    // AmbientLightSensor is only available in secure contexts (HTTPS) on supported devices
    if (!('AmbientLightSensor' in window)) return;

    try {
      const sensor = new (window as any).AmbientLightSensor();
      sensor.addEventListener('reading', () => {
        setLuxLevel(sensor.illuminance);
      });
      sensor.addEventListener('error', () => {
        // Sensor not available or permission denied — graceful fallback
        setLuxLevel(null);
      });
      sensor.start();

      return () => sensor.stop();
    } catch {
      // Browser doesn't support AmbientLightSensor
      return;
    }
  }, []);

  // ─── Resolve final dark state ───
  const isDark = (() => {
    if (mode === 'dark') return true;
    if (mode === 'light') return false;
    // mode === 'auto': check lux first, then OS preference
    if (luxLevel !== null && luxLevel < 50) return true;
    return systemPrefersDark;
  })();

  // ─── Apply to DOM ───
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  // ─── Persist preference ───
  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem(STORAGE_KEY, newMode);
  }, []);

  const toggle = useCallback(() => {
    const next: ThemeMode = mode === 'auto' ? 'dark' : mode === 'dark' ? 'light' : 'auto';
    setMode(next);
  }, [mode, setMode]);

  return { mode, isDark, luxLevel, setMode, toggle };
}
