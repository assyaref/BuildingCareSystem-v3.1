// ======================================================
// Building Care System Enterprise v10.0
// Service Worker Enterprise
// Radiant Group Duri
// ======================================================

"use strict";

// ==========================================
// CACHE CONFIGURATION
// ==========================================
const VERSION = "10.0.0";
const STATIC_CACHE = `bcs-static-${VERSION}`;
const RUNTIME_CACHE = `bcs-runtime-${VERSION}`;
const OFFLINE_PAGE = "/offline.html";

// ==========================================
// APP SHELL
// ==========================================
const APP_SHELL = [
    "/",
    "/index.html",
    "/assets/css/style.css",
    "/assets/css/dashboard.css",
    "/assets/css/login.css",
    "/assets/js/app.js",
    "/assets/js/config.js",
    "/assets/js/core/api.js",
    "/assets/js/core/offline.js",
    "/assets/js/modules/auth.js",
    "/assets/pwa/manifest.json",
    "/assets/pwa/icons/icon-192.png",
    "/assets/pwa/icons/icon-512.png",
    OFFLINE_PAGE
];

// ==========================================
// INSTALL
// ==========================================
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                Logger.info("Caching App Shell...");
                // Menggunakan map & Promise.all / catch agar kegagalan satu file tidak merusak seluruh instalasi
                return Promise.all(
                    APP_SHELL.map(url => {
                        return cache.add(url).catch(err => {
                            Logger.error(`Gagal melakukan pre-cache untuk URL: ${url}`, err);
                        });
                    })
                );
            })
            .then(() => self.skipWaiting())
    );
});

// ==========================================
// ACTIVATE
// ==========================================
self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys()
            .then(keys => {
                return Promise.all(
                    keys
                        .filter(key => key !== STATIC_CACHE && key !== RUNTIME_CACHE)
                        .map(key => {
                            Logger.info(`Menghapus cache lama: ${key}`);
                            return caches.delete(key);
                        })
                );
            })
            .then(() => self.clients.claim())
    );
});

// ==========================================
// FETCH
// ==========================================
self.addEventListener("fetch", event => {
    // Abaikan pemanggilan non-GET (seperti POST API yang dihandle oleh modul offline.js lokal)
    if (event.request.method !== "GET") return;

    // Abaikan request dari ekstensi browser (misal chrome-extension://)
    if (!event.request.url.startsWith(self.location.origin)) return;

    event.respondWith(
        cacheFirst(event.request)
    );
});

// ==========================================
// STRATEGI CACHE FIRST (Dengan Network Fallback)
// ==========================================
async function cacheFirst(request) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }

    try {
        const response = await fetch(request);
        
        // Pastikan response valid sebelum dimasukkan ke dalam runtime cache
        if (response && response.status === 200 && response.type === "basic") {
            const runtimeCache = await caches.open(RUNTIME_CACHE);
            runtimeCache.put(request, response.clone());
        }
        
        return response;
    } catch (error) {
        Logger.warn(`Gagal mengambil data dari jaringan untuk: ${request.url}`, error);

        // Jika user sedang melakukan navigasi halaman, berikan halaman offline khusus
        if (request.mode === "navigate") {
            const offlineResponse = await caches.match(OFFLINE_PAGE);
            if (offlineResponse) return offlineResponse;
        }

        // Fallback untuk aset gambar atau request data biasa saat offline
        return new Response(
            JSON.stringify({ success: false, error: "Koneksi offline atau server tidak merespon" }),
            {
                status: 503,
                headers: { "Content-Type": "application/json" }
            }
        );
    }
}

// ==========================================
// MESSAGE INTERACTION
// ==========================================
self.addEventListener("message", event => {
    if (event.data && event.data.action === "skipWaiting") {
        self.skipWaiting();
    }
});

// ==========================================
// BACKGROUND SYNC
// ==========================================
self.addEventListener("sync", event => {
    if (event.tag === "bcs-sync") {
        event.waitUntil(
            syncOfflineQueue()
        );
    }
});

async function syncOfflineQueue() {
    const clients = await self.clients.matchAll({ includeUncontrolled: true, type: "window" });
    clients.forEach(client => {
        client.postMessage({
            action: "sync",
            timestamp: new Date().toISOString()
        });
    });
}

// ==========================================
// PUSH NOTIFICATION
// ==========================================
self.addEventListener("push", event => {
    let data = { title: "Building Care", body: "Notification" };
    
    try {
        if (event.data) {
            data = event.data.json();
        }
    } catch (e) {
        if (event.data) {
            data.body = event.data.text();
        }
    }

    event.waitUntil(
        self.registration.showNotification(
            data.title,
            {
                body: data.body,
                icon: "/assets/pwa/icons/icon-192.png",
                badge: "/assets/pwa/icons/icon-192.png",
                vibrate: [100, 50, 100],
                data: {
                    dateOfArrival: Date.now(),
                    primaryKey: 1
                }
            }
        )
    );
});

// ==========================================
// INTERNAL SERVICE WORKER LOGGER
// ==========================================
const Logger = {
    info(msg, ...args) {
        console.log(`%c[SW-INFO] ${msg}`, "color: #0D6EFD; font-weight: bold;", ...args);
    },
    warn(msg, ...args) {
        console.warn(`[SW-WARN] ${msg}`, ...args);
    },
    error(msg, ...args) {
        console.error(`[SW-ERROR] ${msg}`, ...args);
    }
};
