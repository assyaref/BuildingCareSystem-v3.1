// ======================================================
// BCS SERVICE WORKER
// Building Care System Enterprise
// Version 2.2 FINAL + FCM
// ======================================================

"use strict";

const CACHE_VERSION = "v2.2.0";
const CACHE_PREFIX = "bcs-cache-";
const CACHE_NAME = `${CACHE_PREFIX}${CACHE_VERSION}`;

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./assets/css/style.css",
  "./assets/css/login.css",
  "./assets/js/core/session.js",
  "./assets/js/core/app.js",
  "./assets/js/core/api.js",
  "./assets/js/core/storage.js",
  "./assets/js/core/ui.js",
  "./assets/js/core/utils.js",
  "./assets/js/modules/auth.js",
  "./assets/js/modules/firebase-config.js",
  "./config/config.js",
  "./assets/img/logo.png",
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

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async cache => {
        await Promise.allSettled(
          APP_SHELL.map(async url => {
            const request = new Request(url, { cache: "reload" });
            const response = await fetch(request);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            await cache.put(request, response.clone());
          })
        );
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(
        names.map(name => {
          if (
            name.startsWith(CACHE_PREFIX) &&
            name !== CACHE_NAME
          ) {
            return caches.delete(name);
          }
          return Promise.resolve(false);
        })
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (
    url.hostname === "script.google.com" ||
    url.hostname === "script.googleusercontent.com"
  ) return;

  if (url.origin !== self.location.origin) return;

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
              .then(cache => cache.put(request, clone))
              .catch(() => {});
          }
          return response;
        })
        .catch(async () => {
          return (
            await caches.match(request) ||
            await caches.match("./index.html") ||
            new Response("Building Care System sedang offline.", {
              status: 503,
              headers: { "Content-Type": "text/plain; charset=utf-8" }
            })
          );
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request)
      .then(cached => {
        if (cached) return cached;

        return fetch(request)
          .then(response => {
            if (!response || !response.ok) return response;

            const clone = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => cache.put(request, clone))
              .catch(() => {});

            return response;
          });
      })
  );
});

// FCM background message dikirim sebagai Web Push.
// Handler ini menampilkan notifikasi jika payload push diterima.
self.addEventListener("push", event => {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = {
      notification: {
        title: "Building Care System",
        body: event.data ? event.data.text() : "Ada pembaruan laporan."
      }
    };
  }

  const notification = data.notification || {};
  const messageData = data.data || {};

  const title =
    notification.title ||
    "Building Care System";

  const options = {
    body:
      notification.body ||
      "Ada pembaruan status laporan.",
    icon: "./assets/icons/icon-192.png",
    badge: "./assets/icons/icon-96.png",
    tag:
      messageData.reportId ||
      "bcs-notification",
    renotify: true,
    vibrate: [200, 100, 200],
    data: {
      url:
        messageData.url ||
        "./history.html",
      reportId:
        messageData.reportId ||
        "",
      status:
        messageData.status ||
        ""
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener("notificationclick", event => {
  event.notification.close();

  const targetUrl =
    event.notification.data?.url ||
    "./history.html";

  event.waitUntil(
    self.clients.matchAll({
      type: "window",
      includeUncontrolled: true
    })
    .then(clientList => {
      for (const client of clientList) {
        if ("navigate" in client && "focus" in client) {
          return client.navigate(targetUrl)
            .then(() => client.focus());
        }
      }

      return self.clients.openWindow
        ? self.clients.openWindow(targetUrl)
        : null;
    })
  );
});

self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

console.log(`✅ [SW] Service Worker ${CACHE_VERSION} + FCM loaded`);
