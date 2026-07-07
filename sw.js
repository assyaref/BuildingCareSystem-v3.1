// ======================================================
// BCS SERVICE WORKER
// Building Care System Enterprise
// Version 2.3.10 FINAL + FCM
// Background Push + Status Style + Click Navigation
// ======================================================

"use strict";

const CACHE_VERSION = "v2.3.10";
const CACHE_PREFIX = "bcs-cache-";
const CACHE_NAME = `${CACHE_PREFIX}${CACHE_VERSION}`;

// ======================================================
// APP SHELL
// ======================================================

const APP_SHELL = [
  "./",
  ".//",
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
  "./assets/js/modules/firebase-config.js",

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
// Cache satu per satu agar satu file gagal tidak
// membatalkan seluruh instalasi Service Worker.
// ======================================================

self.addEventListener("install", event => {
  console.log(`[SW] Installing ${CACHE_NAME}...`);

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async cache => {
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

              await cache.put(
                request,
                response.clone()
              );

              console.log(`✅ [SW] Cached: ${url}`);

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
          item => item.status === "fulfilled"
        ).length;

        const failedCount = results.filter(
          item => item.status === "rejected"
        ).length;

        console.log(
          `[SW] Cache complete: ${successCount} success, ${failedCount} failed`
        );
      })
      .then(() => self.skipWaiting())
  );
});

// ======================================================
// ACTIVATE
// Hapus hanya cache lama milik BCS.
// ======================================================

self.addEventListener("activate", event => {
  console.log(`[SW] Activating ${CACHE_NAME}...`);

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
      .then(() => self.clients.claim())
  );
});

// ======================================================
// FETCH
// Navigation = Network First
// Static Asset = Cache First
// GAS API / External Origin = tidak diintercept
// ======================================================

self.addEventListener("fetch", event => {
  const request = event.request;

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

  // Jangan intercept CDN / external origin
  if (url.origin !== self.location.origin) {
    return;
  }

  // ====================================================
  // HTML / NAVIGATION = NETWORK FIRST
  // ====================================================

  if (
    request.mode === "navigate" ||
    request.destination === "document"
  ) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response && response.ok) {
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
            await caches.match(".//");

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
  // STATIC ASSETS = CACHE FIRST
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
// PUSH NOTIFICATION
// Bekerja saat BCS background atau ditutup.
// ======================================================

self.addEventListener("push", event => {
  console.log("🔔 [SW] Push event received");

  let payload = {};

  try {
    payload =
      event.data
        ? event.data.json()
        : {};
  } catch (error) {
    payload = {
      notification: {
        title: "Building Care System",
        body:
          event.data
            ? event.data.text()
            : "Ada pembaruan laporan."
      }
    };
  }

  const notification =
    payload.notification || {};

  const messageData =
    payload.data || {};

  const status = String(
    messageData.status || ""
  ).toUpperCase();

  const reportId = String(
    messageData.reportId || ""
  );

  // ====================================================
  // STYLE BERDASARKAN STATUS
  // ====================================================

  let defaultTitle =
    "🔔 Building Care System";

  let defaultBody =
    "Ada pembaruan status laporan.";

  let vibration =
    [200, 100, 200];

  if (status === "OPEN") {
    defaultTitle =
      "🔵 Laporan Baru";

    defaultBody =
      reportId
        ? `Laporan ${reportId} telah diterima.`
        : "Ada laporan baru yang telah diterima.";

    vibration =
      [180, 80, 180];
  }

  if (status === "PROGRESS") {
    defaultTitle =
      "🟠 Laporan Sedang Diproses";

    defaultBody =
      reportId
        ? `Laporan ${reportId} sedang ditangani.`
        : "Laporan sedang dalam proses penanganan.";

    vibration =
      [200, 100, 200, 100, 300];
  }

  if (status === "DONE") {
    defaultTitle =
      "🟢 Pekerjaan Selesai";

    defaultBody =
      reportId
        ? `Laporan ${reportId} telah selesai ditangani.`
        : "Pekerjaan telah selesai ditangani.";

    vibration =
      [120, 70, 120, 70, 350];
  }

  const title =
    notification.title ||
    defaultTitle;

  const body =
    notification.body ||
    defaultBody;

  const targetUrl =
    messageData.url ||
    ".//user-history";

  const options = {
    body: body,

    icon:
      "./assets/icons/icon-192.png",

    badge:
      "./assets/icons/icon-96.png",

    // PROGRESS dan DONE untuk report yang sama
    // memiliki tag berbeda.
    tag:
      `bcs-${reportId || "notification"}-${status || "update"}`,

    renotify: true,

    vibrate: vibration,

    timestamp: Date.now(),

    data: {
      url: targetUrl,
      reportId: reportId,
      status: status
    },

    actions: [
      {
        action: "open",
        title: "Lihat Laporan"
      },
      {
        action: "close",
        title: "Tutup"
      }
    ]
  };

  event.waitUntil(
    self.registration
      .showNotification(
        title,
        options
      )
      .then(() => {
        console.log(
          `✅ [SW] Notification shown: ${status || "UPDATE"} ${reportId}`
        );
      })
      .catch(error => {
        console.error(
          "❌ [SW] Failed to show notification:",
          error
        );
      })
  );
});

// ======================================================
// NOTIFICATION CLICK
// ======================================================

self.addEventListener(
  "notificationclick",
  event => {
    console.log(
      "[SW] Notification clicked:",
      event.action
    );

    event.notification.close();

    // Tombol Tutup tidak membuka aplikasi
    if (event.action === "close") {
      return;
    }

    const targetUrl =
      event.notification.data?.url ||
      ".//user-history";

    const absoluteUrl =
      new URL(
        targetUrl,
        self.location.origin
      ).href;

    event.waitUntil(
      self.clients.matchAll({
        type: "window",
        includeUncontrolled: true
      })
      .then(clientList => {
        // Jika BCS sudah terbuka, arahkan dan fokuskan
        for (const client of clientList) {
          if (
            "focus" in client &&
            "navigate" in client
          ) {
            return client
              .navigate(absoluteUrl)
              .then(() => client.focus());
          }
        }

        // Jika BCS tertutup, buka halaman tujuan
        if (self.clients.openWindow) {
          return self.clients.openWindow(
            absoluteUrl
          );
        }

        return null;
      })
  );
});

// ======================================================
// NOTIFICATION CLOSE
// ======================================================

self.addEventListener(
  "notificationclose",
  event => {
    console.log(
      "[SW] Notification closed:",
      event.notification.data?.status || "UNKNOWN",
      event.notification.data?.reportId || ""
    );
  }
);

// ======================================================
// MESSAGE HANDLER
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
  `✅ [SW] Service Worker ${CACHE_VERSION} FINAL + FCM loaded`
);
