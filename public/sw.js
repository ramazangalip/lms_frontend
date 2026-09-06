const CACHE_NAME = 'bu-lms-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/apple-touch-icon.png'
];

// Service Worker Kurulumu (Install)
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
});

// Service Worker Etkinleştirme (Activate) & Eski Önbellekleri Temizleme
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

// Ağ/Önbellek Yönlendirme (Fetch)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Canlı API istekleri, Auth işlemleri ve POST/PUT/DELETE isteklerini doğrudan ağa yönlendir (Önbelleğe Alma)
  if (
    event.request.method !== 'GET' ||
    url.pathname.startsWith('/api') ||
    url.pathname.includes('/users/') ||
    url.pathname.includes('/contents/') ||
    url.hostname.includes('koyeb.app')
  ) {
    return;
  }

  // Statik varlıklar ve sayfalar için Network-First (Ağ Öncelikli) Stratejisi
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          return cachedResponse || Response.error();
        });
      })
  );
});
