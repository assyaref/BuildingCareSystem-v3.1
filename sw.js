// sw.js - Service Worker untuk PWA

const CACHE_NAME = 'bcs-cache-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './assets/css/style.css',
  './assets/css/login.css',
  './assets/js/core/session.js',
  './assets/js/core/app.js',
  './assets/js/core/api.js',
  './assets/js/core/storage.js',
  './assets/js/core/ui.js',
  './assets/js/core/utils.js',
  './assets/js/modules/auth.js',
  './config/config.js',
  './assets/img/logo.png',
  './assets/icons/favicon.ico',
  './assets/icons/icon-72.png',
  './assets/icons/icon-96.png',
  './assets/icons/icon-128.png',
  './assets/icons/icon-144.png',
  './assets/icons/icon-152.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-384.png',
  './assets/icons/icon-512.png',
  // Library dari CDN biasanya tidak di-cache (atau cache optional)
  // Tapi kita bisa cache jika ingin benar-benar offline, 
  // namun lebih baik menggunakan CDN karena update otomatis.
  // Contoh: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
  // 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js',
  // 'https://cdn.jsdelivr.net/npm/sweetalert2@11',
  // 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css'
];

// Install SW - cache semua aset
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching files...');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate SW - hapus cache lama
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch - serve dari cache jika ada, fallback ke network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        // Clone request karena bisa dipakai dua kali
        const fetchRequest = event.request.clone();
        return fetch(fetchRequest).then(response => {
          // Cek response valid
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          // Clone response untuk disimpan di cache
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          return response;
        });
      })
  );
});
