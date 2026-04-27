const APP_CACHE_NAME = 'quamc-app-v2';
const EXTERNAL_CACHE_NAME = 'quamc-external-v1';
const STATIC_ASSETS = [
    '/build/assets/app.css',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
];
function isFacebookEmbedHost(hostname) {
    return (
        hostname === 'connect.facebook.net' ||
        hostname === 'facebook.com' ||
        hostname.endsWith('.facebook.com') ||
        hostname.endsWith('.fbcdn.net')
    );
}

// Install: cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(APP_CACHE_NAME).then((cache) => {
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
                names
                    .filter((n) => n !== APP_CACHE_NAME && n !== EXTERNAL_CACHE_NAME)
                    .map((n) => caches.delete(n))
            );
        })
    );
    self.clients.claim();
});

// Fetch: network-first for pages/API, cache-first for static assets
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    if (event.request.method !== 'GET') return;

    // Facebook embeds/scripts: cache for offline reuse after first successful fetch
    if (isFacebookEmbedHost(url.hostname)) {
        event.respondWith(
            caches.open(EXTERNAL_CACHE_NAME).then(async (cache) => {
                const cached = await cache.match(event.request);

                const networkFetch = fetch(event.request)
                    .then((response) => {
                        if (response && (response.ok || response.type === 'opaque')) {
                            cache.put(event.request, response.clone());
                        }
                        return response;
                    })
                    .catch(() => cached);

                return cached || networkFetch;
            })
        );
        return;
    }

    // Ignore other external requests
    if (url.origin !== self.location.origin) return;

    // Static assets → cache-first
    if (url.pathname.startsWith('/build/') || url.pathname.startsWith('/icons/')) {
        event.respondWith(
            caches.match(event.request).then((cached) => {
                return cached || fetch(event.request).then((response) => {
                    const clone = response.clone();
                    caches.open(APP_CACHE_NAME).then((cache) => cache.put(event.request, clone));
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
