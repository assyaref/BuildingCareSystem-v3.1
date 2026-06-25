// ==========================================
// BCS INTEGRATION & LOGGER
// ==========================================
const Logger = {
    info(...args) {
        BCS.Logger?.info?.("PWA", ...args);
    },
    warn(...args) {
        BCS.Logger?.warn?.("PWA", ...args);
    },
    error(...args) {
        BCS.Logger?.error?.("PWA", ...args);
    }
};

// ==========================================
// INSTALLATION lifecycle
// ==========================================

self.addEventListener("install", event => {
    Logger.info("Memulai proses instalasi Service Worker dan caching App Shell...");

    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                Logger.info("Static cache berhasil dibuka. Mengunduh aset...");
                return cache.addAll(APP_SHELL);
            })
            .then(() => {
                Logger.info("Semua aset App Shell berhasil disimpan ke cache.");
            })
            .catch(err => {
                Logger.error("Gagal melakukan caching App Shell saat install:", err);
            })
    );

    self.skipWaiting();
});

// ==========================================
// ACTIVATION & EVENT EMISSION
// ==========================================

self.addEventListener("activate", event => {
    Logger.info("Service Worker aktif. Mengambil alih kontrol halaman...");
    
    // Memastikan modul lain tahu bahwa PWA telah aktif dan siap (Installed)
    if (typeof BCS !== 'undefined') {
        BCS.Events?.emit("pwa:installed");
        Logger.info("Event 'pwa:installed' berhasil di-emit ke BCS.");
    }

    event.waitUntil(self.clients.claim());
});

// ==========================================
// WINDOW EVENT LISTENERS (Dijalankan di Context Main Thread)
// ==========================================
// Catatan: 'beforeinstallprompt' hanya berjalan di main thread (window), 
// bukan di dalam environment Service Worker (self).
if (typeof window !== 'undefined') {
    window.addEventListener("beforeinstallprompt", event => {
        Logger.info("Prompt instalasi PWA tersedia.");
        
        if (typeof BCS !== 'undefined') {
            BCS.Events?.emit("pwa:install-available");
            Logger.info("Event 'pwa:install-available' berhasil di-emit ke BCS.");
        }
    });
}
