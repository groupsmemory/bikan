/**
 * BIKAN Offline-First Hooks
 * ─────────────────────────
 * 1. useOnlineStatus — track koneksi internet real-time
 * 2. useOfflineQueue — IndexedDB outbox untuk data progres belajar
 * 3. registerServiceWorker — registrasi SW saat app boot
 */

import { useState, useEffect, useCallback } from 'react';

// ─── Online Status Hook ───
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// ─── IndexedDB Outbox for Learning Progress ───
const DB_NAME = 'bikan-offline-data';
const DB_VERSION = 1;
const STORE_NAME = 'progress-queue';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export interface QueuedProgress {
  id?: number;
  userId: string;
  lessonId: string;
  completionPercentage: number;
  timestamp: number;
  synced: boolean;
}

export function useOfflineQueue() {
  const [queueSize, setQueueSize] = useState(0);

  // Count pending items
  const refreshCount = useCallback(async () => {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const countReq = store.count();
      countReq.onsuccess = () => setQueueSize(countReq.result);
    } catch {
      // IndexedDB not available
    }
  }, []);

  useEffect(() => {
    refreshCount();
  }, [refreshCount]);

  // Add progress data to queue
  const enqueue = useCallback(async (data: Omit<QueuedProgress, 'id' | 'synced'>) => {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).add({ ...data, synced: false });
      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      refreshCount();

      // Request background sync if available
      if ('serviceWorker' in navigator && 'sync' in (navigator.serviceWorker as any)) {
        const reg = await navigator.serviceWorker.ready;
        await (reg as any).sync.register('bikan-outbox-sync');
      }
    } catch (err) {
      console.error('[Offline Queue] Failed to enqueue:', err);
    }
  }, [refreshCount]);

  // Flush queue (attempt to sync all pending items)
  const flush = useCallback(async () => {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      const getAll = store.getAll();
      getAll.onsuccess = async () => {
        const items: QueuedProgress[] = getAll.result;
        for (const item of items) {
          if (item.synced) continue;
          try {
            // In production: POST to /api/v1/progress
            console.log('[Offline Queue] Syncing:', item);
            // await fetch('/api/v1/progress', { method: 'POST', body: JSON.stringify(item) });
            store.delete(item.id!);
          } catch {
            // Keep in queue if still offline
          }
        }
        refreshCount();
      };
    } catch (err) {
      console.error('[Offline Queue] Flush failed:', err);
    }
  }, [refreshCount]);

  // Auto-flush when coming back online
  useEffect(() => {
    const handleOnline = () => {
      console.log('[Offline Queue] Back online — flushing queue');
      flush();
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [flush]);

  return { queueSize, enqueue, flush };
}

// ─── Service Worker Registration ───
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.log('[SW] Service Workers not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('[SW] Registered successfully, scope:', registration.scope);

    // Listen for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'activated') {
            console.log('[SW] New version activated');
          }
        });
      }
    });

    return registration;
  } catch (error) {
    console.error('[SW] Registration failed:', error);
    return null;
  }
}
