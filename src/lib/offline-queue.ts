/**
 * BIKAN Offline Queue — Universal Request Queue with Background Sync
 * ──────────────────────────────────────────────────────────────────
 * PRD Should Have: Mekanisme penanganan kegagalan pengiriman data
 * akibat putusnya jaringan internet lokal melalui sistem penyimpanan
 * antrean lokal (local storage queue).
 *
 * Architecture:
 * - IndexedDB "bikan-queue" stores failed requests
 * - Each action type has its own store for type safety
 * - Auto-flush on reconnect (online event)
 * - Background Sync API for SW-level retry
 * - Exponential backoff on repeated failures
 * - Queue size limits to prevent storage bloat
 *
 * Supported action types:
 * - assessment_response: IRT theta updates
 * - streak_activity: Daily learning streak records
 * - progress_update: Lesson completion percentage
 * - ai_interaction_log: Token usage analytics
 */

// ─── Queue Item Types ───
export type QueueActionType =
  | 'assessment_response'
  | 'streak_activity'
  | 'progress_update'
  | 'ai_interaction_log';

export interface QueueItem {
  id?: number;
  actionType: QueueActionType;
  payload: Record<string, unknown>;
  createdAt: number;
  retryCount: number;
  maxRetries: number;
  lastError?: string;
}

export interface QueueStats {
  total: number;
  byType: Record<QueueActionType, number>;
  oldestItem: number | null;
}

// ─── Constants ───
const DB_NAME = 'bikan-queue';
const DB_VERSION = 2;
const STORE_NAME = 'actions';
const MAX_QUEUE_SIZE = 500;
const MAX_RETRIES = 5;

// ─── IndexedDB Helpers ───
function openQueueDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create or upgrade store
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('actionType', 'actionType', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Add an action to the offline queue
 */
export async function enqueueAction(
  actionType: QueueActionType,
  payload: Record<string, unknown>
): Promise<boolean> {
  try {
    const db = await openQueueDB();

    // Check queue size limit
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const countReq = store.count();

    return new Promise((resolve, reject) => {
      countReq.onsuccess = () => {
        if (countReq.result >= MAX_QUEUE_SIZE) {
          // Remove oldest items to make room
          const cursor = store.openCursor();
          let deleted = 0;
          cursor.onsuccess = (e) => {
            const result = (e.target as IDBRequest).result;
            if (result && deleted < 50) {
              result.delete();
              deleted++;
              result.continue();
            }
          };
        }

        const item: Omit<QueueItem, 'id'> = {
          actionType,
          payload,
          createdAt: Date.now(),
          retryCount: 0,
          maxRetries: MAX_RETRIES,
        };

        const addReq = store.add(item);
        addReq.onsuccess = () => resolve(true);
        addReq.onerror = () => reject(addReq.error);
      };
      countReq.onerror = () => reject(countReq.error);

      tx.oncomplete = () => {
        // Request background sync
        requestBackgroundSync();
      };
    });
  } catch (err) {
    console.error('[OfflineQueue] Enqueue failed:', err);
    return false;
  }
}

/**
 * Get all pending items from the queue
 */
export async function getQueueItems(actionType?: QueueActionType): Promise<QueueItem[]> {
  try {
    const db = await openQueueDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      let request: IDBRequest;

      if (actionType) {
        const index = store.index('actionType');
        request = index.getAll(actionType);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return [];
  }
}

/**
 * Remove a successfully processed item from the queue
 */
export async function dequeueItem(id: number): Promise<void> {
  try {
    const db = await openQueueDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('[OfflineQueue] Dequeue failed:', err);
  }
}

/**
 * Update retry count for a failed item
 */
export async function markRetry(id: number, error: string): Promise<void> {
  try {
    const db = await openQueueDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const item = getReq.result as QueueItem;
      if (item) {
        item.retryCount++;
        item.lastError = error;

        // Remove if max retries exceeded
        if (item.retryCount >= item.maxRetries) {
          store.delete(id);
          console.warn('[OfflineQueue] Max retries exceeded, dropping:', item.actionType);
        } else {
          store.put(item);
        }
      }
    };
  } catch (err) {
    console.error('[OfflineQueue] Mark retry failed:', err);
  }
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<QueueStats> {
  try {
    const items = await getQueueItems();
    const byType: Record<QueueActionType, number> = {
      assessment_response: 0,
      streak_activity: 0,
      progress_update: 0,
      ai_interaction_log: 0,
    };

    for (const item of items) {
      byType[item.actionType] = (byType[item.actionType] || 0) + 1;
    }

    return {
      total: items.length,
      byType,
      oldestItem: items.length > 0 ? items[0].createdAt : null,
    };
  } catch {
    return { total: 0, byType: { assessment_response: 0, streak_activity: 0, progress_update: 0, ai_interaction_log: 0 }, oldestItem: null };
  }
}

/**
 * Clear all items from the queue
 */
export async function clearQueue(): Promise<void> {
  try {
    const db = await openQueueDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('[OfflineQueue] Clear failed:', err);
  }
}

/**
 * Request Background Sync via Service Worker
 */
async function requestBackgroundSync(): Promise<void> {
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if ('sync' in reg) {
        await (reg as any).sync.register('bikan-outbox-sync');
      }
    }
  } catch {
    // Background Sync not supported — will flush on online event
  }
}

/**
 * Flush the queue: process all pending items
 * Called on reconnect or by Background Sync
 */
export async function flushQueue(
  processor: (item: QueueItem) => Promise<boolean>
): Promise<{ processed: number; failed: number }> {
  const items = await getQueueItems();
  let processed = 0;
  let failed = 0;

  for (const item of items) {
    try {
      const success = await processor(item);
      if (success) {
        await dequeueItem(item.id!);
        processed++;
      } else {
        await markRetry(item.id!, 'Processing returned false');
        failed++;
      }
    } catch (err: any) {
      await markRetry(item.id!, err.message || 'Unknown error');
      failed++;
    }
  }

  console.log(`[OfflineQueue] Flush complete: ${processed} processed, ${failed} failed`);
  return { processed, failed };
}
