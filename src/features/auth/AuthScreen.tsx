/**
 * BIKAN Auth Screen
 * ─────────────────
 * Login & Register UI — Cognitive UI Architecture
 * Soft UI Neomorfisme, palet warna 60-30-10
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from './AuthContext';

export const AuthScreen: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const { handleLogin, handleRegister } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (isLogin) {
        const result = await handleLogin(email, password);
        if (!result.success) setError(result.error || 'Login gagal');
      } else {
        const result = await handleRegister(name, email, password);
        if (!result.success) setError(result.error || 'Registrasi gagal');
      }
    } catch (err: any) {
      setError('Terjadi kesalahan jaringan. Coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 transition-colors duration-300 ${isDark ? 'bg-[#0F172A]' : 'bg-neutral-base'}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8"
      >
        {/* Logo & Branding */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-muted-blue to-black flex items-center justify-center text-white font-black text-2xl shadow-lg">
            B
          </div>
          <h1 className="text-2xl font-black tracking-tight">KMP BIKAN 2026</h1>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-muted-blue/50'}`}>
            Platform Pembelajaran Matematika Adaptif
          </p>
        </div>

        {/* Auth Card */}
        <div className="soft-ui-card p-8 space-y-6">
          {/* Tab Toggle */}
          <div className="flex gap-1 p-1 bg-muted-blue/5 rounded-xl">
            <button
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                isLogin ? 'bg-white shadow-sm text-tactical-orange' : 'text-muted-blue/40'
              }`}
            >
              Masuk
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                !isLogin ? 'bg-white shadow-sm text-tactical-orange' : 'text-muted-blue/40'
              }`}
            >
              Daftar
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-blue/40">Nama Lengkap</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ahmad Fauzi"
                  className="w-full px-4 py-3 rounded-xl border border-muted-blue/10 bg-muted-blue/5 text-sm focus:outline-none focus:ring-2 focus:ring-tactical-orange/50 transition-all"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-blue/40">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full px-4 py-3 rounded-xl border border-muted-blue/10 bg-muted-blue/5 text-sm focus:outline-none focus:ring-2 focus:ring-tactical-orange/50 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-blue/40">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full px-4 py-3 rounded-xl border border-muted-blue/10 bg-muted-blue/5 text-sm focus:outline-none focus:ring-2 focus:ring-tactical-orange/50 transition-all"
              />
            </div>

            {/* Error Message */}
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-tactical-red bg-tactical-red/5 px-3 py-2 rounded-lg"
              >
                {error}
              </motion.p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-tactical-orange text-white font-bold text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Memproses...' : isLogin ? 'Masuk ke BIKAN' : 'Daftar Sekarang'}
            </button>
          </form>

          {/* Footer hint */}
          <p className={`text-center text-[10px] ${isDark ? 'text-gray-500' : 'text-muted-blue/30'}`}>
            {isLogin
              ? 'Belum punya akun? Klik tab "Daftar" di atas.'
              : 'Sudah punya akun? Klik tab "Masuk" di atas.'}
          </p>
        </div>

        {/* Koperasi badge */}
        <p className={`text-center text-[9px] uppercase tracking-widest ${isDark ? 'text-gray-600' : 'text-muted-blue/20'}`}>
          Koperasi Multi-Pihak • Permenkop No. 8/2021
        </p>
      </motion.div>
    </div>
  );
};
