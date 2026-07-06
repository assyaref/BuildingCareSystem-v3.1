// ======================================================
// Building Care System Enterprise v7.1 FINAL
// Core Enterprise Framework - Loading Disabled
// Radiant Group Duri
// ======================================================

"use strict";

window.BCS = window.BCS || {};

/**
 * ======================================================
 * 1. FRAMEWORK MANIFEST
 * ======================================================
 */
BCS.manifest = Object.freeze({
    name: "BCS Enterprise",
    version: "1.0.0",
    author: "Radiant Group",
    environment: window.CONFIG?.ENV || "production",
    build: "2026.06.25"
});

/**
 * ======================================================
 * 2. EVENT BUS - SINGLE INSTANCE
 * ======================================================
 */
if (!BCS.Events) {
    BCS.Events = (() => {
        const listeners = {};

        function on(event, callback) {
            if (!listeners[event]) listeners[event] = [];
            listeners[event].push(callback);
        }

        function off(event, callback) {
            if (!listeners[event]) return;
            listeners[event] = listeners[event].filter(cb => cb !== callback);
        }

        function once(event, callback) {
            const handler = (data) => {
                off(event, handler);
                callback(data);
            };
            on(event, handler);
        }

        function emit(event, data) {
            if (!listeners[event]) return;
            listeners[event].forEach(callback => {
                try { callback(data); } catch (e) { console.error(`[EVENT ERROR] ${event}:`, e); }
            });
        }

        async function emitAsync(event, data) {
            if (!listeners[event]) return;
            const promises = listeners[event].map(async (callback) => {
                try { await callback(data); } catch (e) { console.error(`[EVENT ERROR] ${event}:`, e); }
            });
            await Promise.all(promises);
        }

        function getListenerCount() {
            return Object.keys(listeners).reduce((acc, key) => acc + listeners[key].length, 0);
        }

        return Object.freeze({ on, off, once, emit, emitAsync, getListenerCount });
    })();
}

/**
 * ======================================================
 * 3. LOGGER
 * ======================================================
 */
BCS.Logger = (() => {
    const LEVELS = { TRACE: 0, DEBUG: 1, INFO: 2, WARN: 3, ERROR: 4, OFF: 5 };
    let currentLevel = window.CONFIG?.LOG_LEVEL ? LEVELS[window.CONFIG.LOG_LEVEL.toUpperCase()] : LEVELS.INFO;

    function shouldLog(level) { return LEVELS[level] >= currentLevel; }

    return Object.freeze({
        trace: (tag, ...args) => { if (shouldLog("TRACE")) console.log(`[TRACE:${tag}]`, ...args); },
        debug: (tag, ...args) => { if (shouldLog("DEBUG")) console.log(`[DEBUG:${tag}]`, ...args); },
        info:  (tag, ...args) => { if (shouldLog("INFO"))  console.log(`[INFO:${tag}]`, ...args); },
        warn:  (tag, ...args) => { if (shouldLog("WARN"))  console.warn(`[WARN:${tag}]`, ...args); },
        error: (tag, ...args) => { if (shouldLog("ERROR")) console.error(`[ERROR:${tag}]`, ...args); }
    });
})();

/**
 * ======================================================
 * 4. STORAGE - SINGLE LAYER
 * ======================================================
 */
BCS.Storage = (() => {
    const SESSION_KEY = "BCS_SESSION";

    function getStorage() {
        try {
            localStorage.setItem("__test__", "1");
            localStorage.removeItem("__test__");
            return localStorage;
        } catch (e) {
            try {
                sessionStorage.setItem("__test__", "1");
                sessionStorage.removeItem("__test__");
                return sessionStorage;
            } catch (err) {
                return null;
            }
        }
    }

    function set(key, value) {
        const storage = getStorage();
        if (storage) {
            try {
                storage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
                return true;
            } catch (e) {
                BCS.Logger.error("Storage", "Gagal set:", e);
                return false;
            }
        }
        return false;
    }

    function get(key) {
        const storage = getStorage();
        if (storage) {
            try {
                const value = storage.getItem(key);
                if (!value) return null;
                try { return JSON.parse(value); } catch (e) { return value; }
            } catch (e) {
                BCS.Logger.error("Storage", "Gagal get:", e);
                return null;
            }
        }
        return null;
    }

    function remove(key) {
        const storage = getStorage();
        if (storage) {
            try {
                storage.removeItem(key);
                return true;
            } catch (e) {
                BCS.Logger.error("Storage", "Gagal remove:", e);
                return false;
            }
        }
        return false;
    }

    function setSession(data) {
        if (data && data.token) {
            set(SESSION_KEY, data);
            set("token", data.token);
            set("user", data.user || {});
            if (data.nik) set("nik", data.nik);
            if (data.role) set("role", data.role);
            
            try {
                sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
            } catch (e) {}
BCS.Logger.info("Storage", "Session saved");
            return true;
        }
        return false;
    }

    function getSession() {
        let data = get(SESSION_KEY);
        if (data && data.token) return data;
        
        try {
            const backup = sessionStorage.getItem(SESSION_KEY);
            if (backup) {
                data = JSON.parse(backup);
                if (data && data.token) {
                    set(SESSION_KEY, data);
                    return data;
                }
            }
        } catch (e) {}
        
        const token = get("token");
        if (token) {
            const user = get("user") || {};
            const nik = get("nik") || "";
            const role = get("role") || "";
            data = { token, user, nik, role };
            set(SESSION_KEY, data);
            return data;
        }
        
        return null;
    }

    function removeSession() {
        remove(SESSION_KEY);
        remove("token");
        remove("user");
        remove("nik");
        remove("role");
        try { sessionStorage.removeItem(SESSION_KEY); } catch (e) {}
        BCS.Logger.info("Storage", "Session removed");
    }

    return Object.freeze({
        set,
        get,
        remove,
        setSession,
        getSession,
        removeSession
    });
})();

/**
 * ======================================================
 * 5. APP UI HELPERS - LOADING DISABLED
 * ======================================================
 */
BCS.App = (() => {
    // Loading is disabled to prevent blank screen
    const Loading = {
        show: () => {},  // No-op
        hide: () => {}   // No-op
    };

    const Toast = {
        fire: (msg, icon) => {
            if (typeof Swal !== "undefined") {
                Swal.fire({ toast: true, position: "top-end", icon, title: msg, timer: 2000, showConfirmButton: false });
            } else {
                BCS.Logger.info("Toast", `[${icon}] ${msg}`);
            }
        },
        success: (m) => Toast.fire(m, "success"),
        warning: (m) => Toast.fire(m, "warning"),
        danger: (m) => Toast.fire(m, "error"),
        info: (m) => Toast.fire(m, "info")
    };

    const Theme = {
        init: () => {
            const saved = BCS.Storage.get("BCS_THEME") || "light";
            document.documentElement.setAttribute("data-bs-theme", saved);
        }
    };

    return Object.freeze({
        Loading,
        Toast,
        Theme,
        initEventSubscribers: () => {
            // Remove loading event listeners
            BCS.Events.off("loading:start", Loading.show);
            BCS.Events.off("loading:end", Loading.hide);
        }
    });
})();

/**
 * ======================================================
 * 6. BOOTSTRAP
 * ======================================================
 */
BCS.bootstrap = (() => {
    let initialized = false;

    return async function bootstrap() {
        if (initialized) return;
        initialized = true;

        BCS.Logger.info("System", "BCS Framework bootstrapping...");
        BCS.App.initEventSubscribers();
        BCS.App.Theme.init();
        BCS.Logger.info("System", "BCS Framework ready");
    };
})();

// Auto-bootstrap
document.addEventListener("DOMContentLoaded", () => {
    BCS.bootstrap();
});

console.log("✅ [BCS] Core Framework loaded");

console.log("✅ [BCS] app.js loaded without duplicate Session");
