/**
 * BIKAN Module Selector
 * ─────────────────────
 * Menampilkan daftar modul kurikulum dari database
 * Modul terkunci jika prerequisite belum selesai
 */

'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { getAllModules, ModuleData } from '@/app/actions/modules';

interface ModuleSelectorProps {
  currentModuleSlug: string;
  completedModules: string[]; // slugs of completed modules
  onSelectModule: (slug: string) => void;
}

export const ModuleSelector: React.FC<ModuleSelectorProps> = ({
  currentModuleSlug,
  completedModules,
  onSelectModule,
}) => {
  const [modules, setModules] = useState<ModuleData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllModules().then(mods => {
      setModules(mods);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="soft-ui-card p-4 animate-pulse">
            <div className="h-4 bg-muted-blue/5 rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  const isModuleUnlocked = (mod: ModuleData): boolean => {
    if (!mod.prerequisiteModuleId) return true; // No prerequisite = always unlocked
    const prereqMod = modules.find(m => m.id === mod.prerequisiteModuleId);
    if (!prereqMod) return true;
    return completedModules.includes(prereqMod.slug);
  };

  return (
    <div className="space-y-3">
      <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-blue/40">
        Kurikulum ({modules.length} modul)
      </h3>

      {modules.map((mod, idx) => {
        const unlocked = isModuleUnlocked(mod);
        const isCurrent = mod.slug === currentModuleSlug;
        const isCompleted = completedModules.includes(mod.slug);

        return (
          <motion.button
            key={mod.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => unlocked && onSelectModule(mod.slug)}
            disabled={!unlocked}
            className={`w-full flex items-center gap-3 p-4 rounded-xl text-left transition-all ${
              isCurrent
                ? 'soft-ui-card border-2 border-tactical-orange'
                : isCompleted
                ? 'soft-ui-card border-2 border-muted-green/30'
                : unlocked
                ? 'soft-ui-card hover:scale-[1.01]'
                : 'bg-gray-50 border border-gray-100 opacity-50 cursor-not-allowed'
            }`}
          >
            {/* Icon/Number */}
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
              isCompleted
                ? 'bg-muted-green/10'
                : isCurrent
                ? 'bg-tactical-orange/10'
                : unlocked
                ? 'bg-muted-blue/5'
                : 'bg-gray-100'
            }`}>
              {isCompleted ? '✓' : !unlocked ? '🔒' : mod.iconEmoji || `${idx + 1}`}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-bold truncate ${
                isCurrent ? 'text-tactical-orange' : isCompleted ? 'text-muted-green' : ''
              }`}>
                {mod.title}
              </p>
              <p className="text-[10px] text-muted-blue/40 truncate">
                {mod.description || `${mod.itemCount} soal tersedia`}
              </p>
            </div>

            {/* Status badge */}
            <div className="text-[8px] font-bold uppercase tracking-wider">
              {isCompleted && <span className="text-muted-green bg-muted-green/5 px-2 py-0.5 rounded">Done</span>}
              {isCurrent && !isCompleted && <span className="text-tactical-orange bg-tactical-orange/5 px-2 py-0.5 rounded">Active</span>}
              {!unlocked && <span className="text-gray-400">Locked</span>}
            </div>
          </motion.button>
        );
      })}

      {modules.length === 0 && (
        <p className="text-sm text-muted-blue/40 text-center py-4">
          Belum ada modul. Tambahkan via Dasbor Instruktur.
        </p>
      )}
    </div>
  );
};
