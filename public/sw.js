const CACHE_NAME = 'quamc-v1';
const STATIC_ASSETS = [
    '/build/assets/app.css',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
];

// Install: cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS).catch(() => {
                // Some assets may not exist yet, that's OK
            });
        })
    );
    self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((names) => {
            return Promise.all(
                names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
            );
        })
    );
    self.clients.claim();
});

// Fetch: network-first for pages/API, cache-first for static assets
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Skip non-GET and external requests
    if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;

    // Static assets → cache-first
    if (url.pathname.startsWith('/build/') || url.pathname.startsWith('/icons/')) {
        event.respondWith(
            caches.match(event.request).then((cached) => {
                return cached || fetch(event.request).then((response) => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                    return response;
                });
            })
        );
        return;
    }

    // Pages/API → network-first with offline fallback
    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request);
        })
    );
});
