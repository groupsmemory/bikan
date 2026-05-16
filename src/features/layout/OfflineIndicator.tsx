/**
 * BIKAN Offline Queue Indicator
 * ──────────────────────────────
 * Visual indicator showing:
 * - Online/offline status
 * - Pending queue items count
 * - Sync progress
 * - Last sync time
 */

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wifi, WifiOff, CloudOff, RefreshCw, Check, AlertCircle } from 'lucide-react';
import type { QueueStats } from '@/src/lib/offline-queue';

interface OfflineIndicatorProps {
  isOnline: boolean;
  queueStats: QueueStats;
  isSyncing: boolean;
  onSync: () => void;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  isOnline,
  queueStats,
  isSyncing,
  onSync,
}) => {
  const [expanded, setExpanded] = useState(false);

  // Don't show anything if online and queue is empty
  if (isOnline && queueStats.total === 0) return null;

  return (
    <div className="fixed bottom-20 left-4 z-50">
      {/* Compact Badge */}
      <motion.button
        onClick={() => setExpanded(!expanded)}
        whileTap={{ scale: 0.95 }}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl shadow-lg text-xs font-bold transition-colors ${
          !isOnline
            ? 'bg-tactical-red text-white'
            : queueStats.total > 0
            ? 'bg-tactical-orange text-white'
            : 'bg-muted-green text-white'
        }`}
      >
        {!isOnline ? (
          <WifiOff className="w-3.5 h-3.5" />
        ) : isSyncing ? (
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        ) : queueStats.total > 0 ? (
          <CloudOff className="w-3.5 h-3.5" />
        ) : (
          <Check className="w-3.5 h-3.5" />
        )}

        {!isOnline && <span>Offline</span>}
        {isOnline && queueStats.total > 0 && (
          <span>{queueStats.total} pending</span>
        )}
        {isSyncing && <span>Syncing...</span>}
      </motion.button>

      {/* Expanded Panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-12 left-0 w-64 soft-ui-card p-4 shadow-xl space-y-3"
          >
            {/* Status Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <Wifi className="w-4 h-4 text-muted-green" />
                ) : (
                  <WifiOff className="w-4 h-4 text-tactical-red" />
                )}
                <span className="text-xs font-bold">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              {isOnline && queueStats.total > 0 && (
                <button
                  onClick={onSync}
                  disabled={isSyncing}
                  className="text-[9px] font-bold text-tactical-orange hover:underline disabled:opacity-50"
                >
                  {isSyncing ? 'Syncing...' : 'Sync Now'}
                </button>
              )}
            </div>

            {/* Queue Breakdown */}
            {queueStats.total > 0 && (
              <div className="space-y-1.5">
                <p className="text-[9px] font-bold text-muted-blue/40 uppercase tracking-wider">
                  Antrian ({queueStats.total} item)
                </p>
                {queueStats.byType.assessment_response > 0 && (
                  <QueueRow label="Assessment" count={queueStats.byType.assessment_response} />
                )}
                {queueStats.byType.streak_activity > 0 && (
                  <QueueRow label="Streak" count={queueStats.byType.streak_activity} />
                )}
                {queueStats.byType.progress_update > 0 && (
                  <QueueRow label="Progress" count={queueStats.byType.progress_update} />
                )}
                {queueStats.byType.ai_interaction_log > 0 && (
                  <QueueRow label="AI Log" count={queueStats.byType.ai_interaction_log} />
                )}
              </div>
            )}

            {/* Info */}
            {!isOnline && (
              <div className="flex items-start gap-2 p-2 bg-tactical-red/5 rounded-lg">
                <AlertCircle className="w-3.5 h-3.5 text-tactical-red flex-shrink-0 mt-0.5" />
                <p className="text-[9px] text-tactical-red/80 leading-relaxed">
                  Data tersimpan lokal. Akan otomatis sinkron saat koneksi pulih.
                </p>
              </div>
            )}

            {queueStats.total === 0 && isOnline && (
              <p className="text-[9px] text-muted-green/70 text-center py-2">
                ✓ Semua data tersinkronisasi
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Queue Row Component ───
function QueueRow({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center justify-between text-[10px]">
      <span className="text-muted-blue/60">{label}</span>
      <span className="font-mono font-bold text-tactical-orange">{count}</span>
    </div>
  );
}
