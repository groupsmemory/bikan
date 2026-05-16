/**
 * BIKAN Offline Sync Hook
 * ────────────────────────
 * Integrates the offline queue with server actions.
 * Provides resilient data submission that works offline.
 *
 * Usage:
 *   const { submitAction, queueStats, isSyncing } = useOfflineSync(userId);
 *   await submitAction('assessment_response', { itemId, isCorrect, params });
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  enqueueAction,
  flushQueue,
  getQueueStats,
  QueueActionType,
  QueueItem,
  QueueStats,
} from '@/src/lib/offline-queue';

interface UseOfflineSyncOptions {
  /** Auto-flush interval in ms (0 = disabled) */
  autoFlushInterval?: number;
  /** Callback when sync completes */
  onSyncComplete?: (processed: number, failed: number) => void;
}

export function useOfflineSync(
  userId: string,
  options: UseOfflineSyncOptions = {}
) {
  const { autoFlushInterval = 30_000, onSyncComplete } = options;

  const [queueStats, setQueueStats] = useState<QueueStats>({
    total: 0,
    byType: { assessment_response: 0, streak_activity: 0, progress_update: 0, ai_interaction_log: 0 },
    oldestItem: null,
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const flushTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Track online status ───
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-flush when coming back online
      triggerSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ─── Refresh queue stats ───
  const refreshStats = useCallback(async () => {
    const stats = await getQueueStats();
    setQueueStats(stats);
  }, []);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  // ─── Auto-flush interval ───
  useEffect(() => {
    if (autoFlushInterval <= 0 || !isOnline) return;

    const interval = setInterval(() => {
      if (queueStats.total > 0 && isOnline) {
        triggerSync();
      }
    }, autoFlushInterval);

    return () => clearInterval(interval);
  }, [autoFlushInterval, isOnline, queueStats.total]);

  // ─── Process queue items via server actions ───
  const processItem = useCallback(async (item: QueueItem): Promise<boolean> => {
    switch (item.actionType) {
      case 'assessment_response': {
        const { recordResponseAndUpdateTheta } = await import('@/app/actions/irt');
        const { userId: uid, itemId, isCorrect, params } = item.payload as any;
        const result = await recordResponseAndUpdateTheta(uid || userId, itemId, isCorrect, params);
        return result.success;
      }

      case 'streak_activity': {
        const { recordActivity } = await import('@/app/actions/streaks');
        const { userId: uid, minutes } = item.payload as any;
        await recordActivity(uid || userId, minutes);
        return true;
      }

      case 'progress_update': {
        // Future: POST to progress API
        console.log('[Sync] Progress update:', item.payload);
        return true;
      }

      case 'ai_interaction_log': {
        // Non-critical: just log and discard
        console.log('[Sync] AI log:', item.payload);
        return true;
      }

      default:
        return false;
    }
  }, [userId]);

  // ─── Trigger sync ───
  const triggerSync = useCallback(async () => {
    if (isSyncing || !isOnline) return;

    setIsSyncing(true);
    try {
      const { processed, failed } = await flushQueue(processItem);
      await refreshStats();
      onSyncComplete?.(processed, failed);
    } catch (err) {
      console.error('[OfflineSync] Flush error:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, isOnline, processItem, refreshStats, onSyncComplete]);

  // ─── Submit action (online → direct, offline → queue) ───
  const submitAction = useCallback(async (
    actionType: QueueActionType,
    payload: Record<string, unknown>
  ): Promise<{ queued: boolean; immediate: boolean }> => {
    if (isOnline) {
      // Try direct submission first
      try {
        const item: QueueItem = {
          actionType,
          payload: { ...payload, userId },
          createdAt: Date.now(),
          retryCount: 0,
          maxRetries: 5,
        };
        const success = await processItem(item);
        if (success) {
          return { queued: false, immediate: true };
        }
      } catch {
        // Fall through to queue
      }
    }

    // Queue for later
    await enqueueAction(actionType, { ...payload, userId });
    await refreshStats();
    return { queued: true, immediate: false };
  }, [isOnline, userId, processItem, refreshStats]);

  return {
    submitAction,
    triggerSync,
    queueStats,
    isSyncing,
    isOnline,
    refreshStats,
  };
}
