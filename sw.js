// ======================================================
// BCS SERVICE WORKER
// Building Care System Enterprise
// Version 2.0 FINAL
// GitHub Pages Safe + Resilient Cache
// ======================================================

"use strict";

const CACHE_VERSION = "v2.0.0";
const CACHE_PREFIX = "bcs-cache-";
const CACHE_NAME = `${CACHE_PREFIX}${CACHE_VERSION}`;

// ======================================================
// APP SHELL
// ======================================================

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",

  // CSS
  "./assets/css/style.css",
  "./assets/css/login.css",

  // Core JS
  "./assets/js/core/session.js",
  "./assets/js/core/app.js",
  "./assets/js/core/api.js",
  "./assets/js/core/storage.js",
  "./assets/js/core/ui.js",
  "./assets/js/core/utils.js",

  // Modules
  "./assets/js/modules/auth.js",

  // Config
  "./config/config.js",

  // Images
  "./assets/img/logo.png",

  // Icons
  "./assets/icons/favicon.ico",
  "./assets/icons/icon-72.png",
  "./assets/icons/icon-96.png",
  "./assets/icons/icon-128.png",
  "./assets/icons/icon-144.png",
  "./assets/icons/icon-152.png",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-384.png",
  "./assets/icons/icon-512.png"
];

// ======================================================
// INSTALL
// Cache asset satu per satu.
// Satu file gagal tidak membatalkan seluruh instalasi.
// ======================================================

self.addEventListener("install", event => {
  console.log(
    `[SW] Installing ${CACHE_NAME}...`
  );

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async cache => {

        console.log(
          `[SW] Caching ${APP_SHELL.length} app shell files...`
        );

        const results = await Promise.allSettled(
          APP_SHELL.map(async url => {
            try {
              const request = new Request(url, {
                cache: "reload"
              });

              const response = await fetch(request);

              if (!response.ok) {
                throw new Error(
                  `HTTP ${response.status} ${response.statusText}`
                );
              }

              await cache.put(request, response.clone());

              console.log(
                `✅ [SW] Cached: ${url}`
              );

              return url;

            } catch (error) {

              console.warn(
                `⚠️ [SW] Failed to cache: ${url}`,
                error.message
              );

              throw error;
            }
          })
        );

        const successCount = results.filter(
          result => result.status === "fulfilled"
        ).length;

        const failedCount = results.filter(
          result => result.status === "rejected"
        ).length;

        console.log(
          `✅ [SW] Cache complete: ${successCount} success, ${failedCount} failed`
        );

        return true;
      })
      .then(() => {
        console.log(
          "✅ [SW] Installation complete"
        );

        return self.skipWaiting();
      })
      .catch(error => {
        console.error(
          "❌ [SW] Installation error:",
          error
        );
      })
  );
});

// ======================================================
// ACTIVATE
// Hapus cache BCS versi lama.
// Cache lain milik domain tidak disentuh.
// ======================================================

self.addEventListener("activate", event => {
  console.log(
    `[SW] Activating ${CACHE_NAME}...`
  );

  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {

            const isOldBCSCache =
              cacheName.startsWith(CACHE_PREFIX) &&
              cacheName !== CACHE_NAME;

            if (isOldBCSCache) {
              console.log(
                `🗑️ [SW] Deleting old cache: ${cacheName}`
              );

              return caches.delete(cacheName);
            }

            return Promise.resolve(false);
          })
        );
      })
      .then(() => {
        console.log(
          "✅ [SW] Activated and controlling clients"
        );

        return self.clients.claim();
      })
  );
});

// ======================================================
// FETCH
// Strategy:
// 1. Navigation / HTML = Network First
// 2. Static assets = Cache First
// 3. API / external request = Network Only
// ======================================================

self.addEventListener("fetch", event => {
  const request = event.request;

  // Hanya handle GET
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  // Jangan intercept Google Apps Script API
  if (
    url.hostname === "script.google.com" ||
    url.hostname === "script.googleusercontent.com"
  ) {
    return;
  }

  // Jangan intercept external origin / CDN
  if (url.origin !== self.location.origin) {
    return;
  }

  // ====================================================
  // HTML / NAVIGATION
  // Network First
  // ====================================================

  if (
    request.mode === "navigate" ||
    request.destination === "document"
  ) {
    event.respondWith(
      fetch(request)
        .then(response => {

          if (
            response &&
            response.ok
          ) {
            const clone = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(request, clone);
              })
              .catch(() => {});
          }

          return response;
        })
        .catch(async () => {

          const cached =
            await caches.match(request);

          if (cached) {
            return cached;
          }

          const indexFallback =
            await caches.match("./index.html");

          if (indexFallback) {
            return indexFallback;
          }

          return new Response(
            "Building Care System sedang offline.",
            {
              status: 503,
              statusText: "Offline",
              headers: {
                "Content-Type":
                  "text/plain; charset=utf-8"
              }
            }
          );
        })
    );

    return;
  }

  // ====================================================
  // STATIC ASSETS
  // Cache First
  // ====================================================

  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {

        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request)
          .then(response => {

            if (
              !response ||
              !response.ok
            ) {
              return response;
            }

            const responseToCache =
              response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(
                  request,
                  responseToCache
                );
              })
              .catch(error => {
                console.warn(
                  "[SW] Runtime cache failed:",
                  error
                );
              });

            return response;
          });
      })
  );
});

// ======================================================
// MESSAGE HANDLER
// Bisa dipanggil dari frontend untuk update SW.
// ======================================================

self.addEventListener("message", event => {
  if (
    event.data &&
    event.data.type === "SKIP_WAITING"
  ) {
    console.log(
      "[SW] Skip waiting requested"
    );

    self.skipWaiting();
  }
});

console.log(
  `✅ [SW] Service Worker ${CACHE_VERSION} loaded`
);
