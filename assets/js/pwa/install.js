// ==========================================
// INSTALL.JS - Client Side (Browser Window)
// ==========================================

// File ini berjalan di MAIN THREAD (browser window)
// BUKAN di Service Worker!

let deferredPrompt = null;

// 1. Tangkap event beforeinstallprompt (hanya di window)
window.addEventListener("beforeinstallprompt", event => {
    // Mencegah browser menampilkan prompt otomatis
    event.preventDefault();
    
    // Simpan event untuk digunakan nanti
    deferredPrompt = event;
    
    // Beri tahu aplikasi bahwa PWA siap diinstall
    if (typeof BCS !== 'undefined' && BCS.Events) {
        BCS.Events.emit("pwa:install-available");
    }
    
    console.log("[PWA] Install prompt available");
});

// 2. Tangkap event appinstalled (hanya di window)
window.addEventListener("appinstalled", event => {
    // Reset deferred prompt
    deferredPrompt = null;
    
    // Beri tahu aplikasi bahwa PWA sudah terinstall
    if (typeof BCS !== 'undefined' && BCS.Events) {
        BCS.Events.emit("pwa:installed");
    }
    
    console.log("[PWA] App installed successfully");
});

// 3. Fungsi untuk memicu install (dipanggil dari UI)
window.installPWA = async function() {
    if (!deferredPrompt) {
        console.warn("[PWA] No install prompt available");
        return false;
    }
    
    try {
        // Tampilkan prompt install
        const result = await deferredPrompt.prompt();
        
        // Tunggu hasil pilihan user
        const outcome = result.outcome;
        
        if (outcome === 'accepted') {
            console.log("[PWA] User accepted the install");
            // Reset prompt
            deferredPrompt = null;
            return true;
        } else {
            console.log("[PWA] User dismissed the install");
            return false;
        }
    } catch (error) {
        console.error("[PWA] Install failed:", error);
        return false;
    }
};

// 4. Bridge: Menerima pesan dari Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener("message", event => {
        const { type, payload } = event.data || {};
        
        switch(type) {
            case "pwa:activated":
                // Service Worker sudah aktif, beri tahu BCS
                if (typeof BCS !== 'undefined' && BCS.Events) {
                    BCS.Events.emit("pwa:activated", payload);
                }
                console.log("[PWA] Service Worker activated");
                break;
                
            case "pwa:update-available":
                if (typeof BCS !== 'undefined' && BCS.Events) {
                    BCS.Events.emit("pwa:update-available", payload);
                }
                console.log("[PWA] Update available");
                break;
                
            case "pwa:update-downloaded":
                if (typeof BCS !== 'undefined' && BCS.Events) {
                    BCS.Events.emit("pwa:update-downloaded", payload);
                }
                console.log("[PWA] Update downloaded");
                break;
                
            default:
                // Forward other messages
                if (typeof BCS !== 'undefined' && BCS.Events) {
                    BCS.Events.emit(`pwa:${type}`, payload);
                }
        }
    });
}

// 5. Optional: Cek apakah sudah terinstall sebagai PWA
if (window.matchMedia('(display-mode: standalone)').matches) {
    console.log("[PWA] Running as standalone PWA");
    if (typeof BCS !== 'undefined' && BCS.Events) {
        BCS.Events.emit("pwa:standalone");
    }
}

// 6. Optional: Detect when PWA is launched from homescreen
if (window.navigator.standalone === true) {
    console.log("[PWA] Running in iOS standalone mode");
    if (typeof BCS !== 'undefined' && BCS.Events) {
        BCS.Events.emit("pwa:ios-standalone");
    }
}

console.log("[PWA] Install handler ready");
