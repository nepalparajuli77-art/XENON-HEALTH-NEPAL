// XENON HEALTH Service Worker with Background Sync
const CACHE_NAME = 'xenon-health-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install: Cache static shell and skip waiting
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[ServiceWorker] Precache failed for some assets:', err);
      });
    })
  );
});

// Activate: Claim clients and cleanup obsolete caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Network-first for API routes, Stale-while-revalidate for static assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // For /api/ endpoints, always try network first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // Return offline JSON response if network fails
        return new Response(
          JSON.stringify({
            offline: true,
            message: 'App is currently in offline mode. Requests are cached for background sync.'
          }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      })
    );
    return;
  }

  // For non-GET requests or browser navigation
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// Background Sync Event (Standard W3C Sync API)
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Background sync event triggered with tag:', event.tag);
  if (event.tag === 'sync-health-data') {
    event.waitUntil(notifyClientsToSync());
  }
});

// Notify active client windows that background sync is active
async function notifyClientsToSync() {
  const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (const client of allClients) {
    client.postMessage({
      type: 'BACKGROUND_SYNC_TRIGGERED',
      timestamp: Date.now()
    });
  }
}

// Client message dispatch
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'PING_SYNC') {
    event.source?.postMessage({
      type: 'SYNC_PONG',
      serviceWorkerActive: true,
      timestamp: Date.now()
    });
  }
});
