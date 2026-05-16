/**
 * BIKAN Service Worker - Offline-First PWA
 * ─────────────────────────────────────────
 * Strategi Caching (dari PRD & Panduan Infrastruktur):
 * 1. Cache First  → Aset statis (CSS, JS, fonts) → 95% faster reload
 * 2. Network First → API data transaksional → menjamin kesegaran data
 * 3. Stale While Revalidate → Feed materi non-kritis → UI instan
 *
 * Offline Queue:
 * - Data progres belajar disimpan di IndexedDB outbox
 * - Background Sync mengirim ke server saat koneksi pulih
 */

const CACHE_VERSION = 'bikan-v1.0.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const API_CACHE = `${CACHE_VERSION}-api`;

// Aset statis yang di-precache saat install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// ─── INSTALL: Precache aset statis ───
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Precaching static assets');
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  // Activate immediately without waiting for old SW to finish
  self.skipWaiting();
});

// ─── ACTIVATE: Cleanup old caches ───
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE && key !== API_CACHE)
          .map((key) => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      );
    })
  );
  // Take control of all clients immediately
  self.clients.claim();
});

// ─── FETCH: Route-based caching strategies ───
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests (POST, PUT, etc. go to network or outbox)
  if (request.method !== 'GET') {
    event.respondWith(handleNonGetRequest(request));
    return;
  }

  // Strategy routing based on request type
  if (isStaticAsset(url)) {
    // CACHE FIRST: CSS, JS, images, fonts
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  } else if (isApiRequest(url)) {
    // NETWORK FIRST: API calls (fresh data priority)
    event.respondWith(networkFirst(request, API_CACHE));
  } else if (isMediaContent(url)) {
    // STALE WHILE REVALIDATE: Video thumbnails, lesson content
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
  } else {
    // Default: Network first with cache fallback
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
  }
});

// ─── BACKGROUND SYNC: Retry failed requests when online ───
self.addEventListener('sync', (event) => {
  if (event.tag === 'bikan-outbox-sync') {
    console.log('[SW] Background Sync triggered: processing outbox');
    event.waitUntil(processOutbox());
  }
});

// ─── PUSH NOTIFICATIONS (future use) ───
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'BIKAN', {
      body: data.body || 'Ada materi baru untuk Anda!',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: 'bikan-notification',
    })
  );
});

// ═══════════════════════════════════════════════════════════
// CACHING STRATEGIES
// ═══════════════════════════════════════════════════════════

/**
 * Cache First: Serve from cache, fallback to network
 * Best for: static assets that rarely change (JS, CSS, fonts)
 */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Offline fallback
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

/**
 * Network First: Try network, fallback to cache
 * Best for: API data that needs to be fresh
 */
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/index.html');
    }

    return new Response(JSON.stringify({ error: 'offline', message: 'Data tidak tersedia saat offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Stale While Revalidate: Serve cache immediately, update in background
 * Best for: content that can be slightly stale (lesson feeds, thumbnails)
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  // Fetch fresh version in background
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);

  // Return cached immediately if available, otherwise wait for network
  return cached || fetchPromise;
}

/**
 * Handle non-GET requests (POST/PUT/DELETE)
 * If offline, store in IndexedDB outbox for Background Sync
 */
async function handleNonGetRequest(request) {
  try {
    return await fetch(request);
  } catch {
    // Store in outbox for later sync
    if (request.url.includes('/api/')) {
      await storeInOutbox(request);
      return new Response(JSON.stringify({ queued: true, message: 'Disimpan untuk sinkronisasi nanti' }), {
        status: 202,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response('Offline', { status: 503 });
  }
}

// ═══════════════════════════════════════════════════════════
// INDEXEDDB OUTBOX (Offline Queue)
// ═══════════════════════════════════════════════════════════

function openOutboxDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('bikan-outbox', 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('requests')) {
        db.createObjectStore('requests', { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function storeInOutbox(request) {
  try {
    const db = await openOutboxDB();
    const body = await request.clone().text();
    const tx = db.transaction('requests', 'readwrite');
    tx.objectStore('requests').add({
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body,
      timestamp: Date.now(),
    });
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = reject;
    });

    // Register for background sync
    if (self.registration.sync) {
      await self.registration.sync.register('bikan-outbox-sync');
    }
  } catch (err) {
    console.error('[SW] Failed to store in outbox:', err);
  }
}

async function processOutbox() {
  const db = await openOutboxDB();
  const tx = db.transaction('requests', 'readwrite');
  const store = tx.objectStore('requests');

  return new Promise((resolve, reject) => {
    const getAll = store.getAll();
    getAll.onsuccess = async () => {
      const requests = getAll.result;
      console.log(`[SW] Processing ${requests.length} queued requests`);

      for (const item of requests) {
        try {
          await fetch(item.url, {
            method: item.method,
            headers: item.headers,
            body: item.body,
          });
          // Remove from outbox on success
          store.delete(item.id);
        } catch {
          console.log('[SW] Request still failing, keeping in outbox:', item.url);
        }
      }
      resolve();
    };
    getAll.onerror = reject;
  });
}

// ═══════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════

function isStaticAsset(url) {
  return /\.(js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|webp|ico)(\?.*)?$/.test(url.pathname);
}

function isApiRequest(url) {
  return url.pathname.startsWith('/api/') || url.hostname.includes('generativelanguage.googleapis.com');
}

function isMediaContent(url) {
  return url.pathname.startsWith('/media/') || url.pathname.startsWith('/content/') || url.pathname.startsWith('/videos/') || /\.(mp4|webm|m3u8|ts)$/.test(url.pathname);
}
