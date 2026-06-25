// ======================================================
// Building Care System Enterprise v7.1 FINAL
// Core Enterprise Framework - FIXED
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
    build: "2026.06.25",
    modules: ["Auth", "Api", "Storage", "Logger", "Events", "Components", "Modules"]
});

/**
 * ======================================================
 * 2. ENTERPRISE LOGGER
 * ======================================================
 */
BCS.Logger = (() => {
    const LEVELS = { TRACE: 0, DEBUG: 1, INFO: 2, WARN: 3, ERROR: 4, OFF: 5 };
    let currentLevel = window.CONFIG?.LOG_LEVEL ? LEVELS[window.CONFIG.LOG_LEVEL.toUpperCase()] : LEVELS.INFO;

    function shouldLog(level) { return LEVELS[level] >= currentLevel; }
    function getLevelName() { return Object.keys(LEVELS).find(key => LEVELS[key] === currentLevel); }

    function setLevel(levelName) {
        const upper = levelName.toUpperCase();
        if (LEVELS[upper] !== undefined) {
            currentLevel = LEVELS[upper];
            console.log(`[LOGGER] Level diubah ke: ${upper}`);
        }
    }

    return Object.freeze({
        trace: (tag, ...args) => { if (shouldLog("TRACE")) console.log(`[TRACE:${tag}]`, ...args); },
        debug: (tag, ...args) => { if (shouldLog("DEBUG")) console.log(`[DEBUG:${tag}]`, ...args); },
        info:  (tag, ...args) => { if (shouldLog("INFO"))  console.log(`[INFO:${tag}]`, ...args); },
        warn:  (tag, ...args) => { if (shouldLog("WARN"))  console.warn(`[WARN:${tag}]`, ...args); },
        error: (tag, ...args) => { if (shouldLog("ERROR")) console.error(`[ERROR:${tag}]`, ...args); },
        setLevel,
        getLevelName
    });
})();

/**
 * ======================================================
 * 3. SINGLE EVENT BUS (MERGE dari api.js)
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
 * 4. STORAGE LAYER - FIXED
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
            // Simpan ke localStorage
            set(SESSION_KEY, data);
            // Simpan ke sessionStorage sebagai backup
            try {
                sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
            } catch (e) {}
            // Simpan ke legacy keys
            set("token", data.token);
            set("user", data.user || {});
            if (data.nik) set("nik", data.nik);
            if (data.role) set("role", data.role);
            
            // Also update Session global
            if (window.Session && typeof Session.set === 'function') {
                Session.set(data);
            }
            
            BCS.Logger.info("Storage", "Session saved successfully");
            return true;
        }
        return false;
    }

    function getSession() {
        // Try BCS_SESSION first
        let data = get(SESSION_KEY);
        if (data && data.token) {
            return data;
        }
        
        // Try sessionStorage backup
        try {
            const backup = sessionStorage.getItem(SESSION_KEY);
            if (backup) {
                data = JSON.parse(backup);
                if (data && data.token) {
                    // Restore to localStorage
                    set(SESSION_KEY, data);
                    return data;
                }
            }
        } catch (e) {}
        
        // Try legacy keys
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
        try {
            sessionStorage.removeItem(SESSION_KEY);
        } catch (e) {}
        BCS.Logger.info("Storage", "Session removed");
    }

    return Object.freeze({
        set,
        get,
        remove,
        setSession,
        getSession,
        removeSession,
        getStorage
    });
})();

/**
 * ======================================================
 * 5. UTILITIES
 * ======================================================
 */
BCS.Utils = (() => {
    return Object.freeze({
        delay: (ms = 300) => new Promise(res => setTimeout(res, ms)),
        uuid: () => Date.now().toString(36) + Math.random().toString(36).substring(2),
        clone: (obj) => typeof structuredClone === "function" ? structuredClone(obj) : JSON.parse(JSON.stringify(obj))
    });
})();

/**
 * ======================================================
 * 6. APP UI HELPERS
 * ======================================================
 */
BCS.App = (() => {
    let loadingCounter = 0;

    const Loading = {
        show: () => {
            loadingCounter++;
            const loader = document.getElementById("loading");
            if (loader) loader.style.display = "flex";
        },
        hide: () => {
            loadingCounter = Math.max(0, loadingCounter - 1);
            if (loadingCounter === 0) {
                const loader = document.getElementById("loading");
                if (loader) loader.style.display = "none";
            }
        }
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
            BCS.Events.on("loading:start", Loading.show);
            BCS.Events.on("loading:end", Loading.hide);
        }
    });
})();

/**
 * ======================================================
 * 7. MODULE REGISTRY
 * ======================================================
 */
BCS.Modules = (() => {
    const modules = new Map();
    const activeInstances = new Map();

    return Object.freeze({
        register: (name, moduleDefinition) => {
            modules.set(name, moduleDefinition);
            BCS.Logger.trace("Modules", `Module [${name}] registered`);
        },
        init: async (name, options = {}) => {
            if (!modules.has(name)) return null;
            if (activeInstances.has(name)) return activeInstances.get(name);

            const mod = modules.get(name);
            if (mod.init) await mod.init(options);
            activeInstances.set(name, mod);
            BCS.Logger.trace("Modules", `Module [${name}] initialized`);
            return mod;
        },
        getRunning: () => Array.from(activeInstances.keys())
    });
})();

/**
 * ======================================================
 * 8. BOOTSTRAP
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
