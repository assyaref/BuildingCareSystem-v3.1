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
            
            if (window.Session && typeof Session.set === 'function') {
                Session.set(data);
            }
            
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

/**
 * ======================================================
 * 7. SESSION MANAGER - DEVICE ID + DEVICE NAME + PUBLIC IP
 * ======================================================
 */
const Session = (() => {
    const SESSION_KEY = "BCS_SESSION";
    const CLIENT_INFO_KEY = "BCS_CLIENT_INFO";
    const DEVICE_ID_KEY = "BCS_DEVICE_ID";
    let heartbeatInterval = null;
    let clientInfoPromise = null;

    function get() {
        try {
            const data = BCS.Storage?.getSession?.();
            if (data?.token) return data;

            const raw = localStorage.getItem(SESSION_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed?.token) return parsed;
            }
        } catch (e) {}
        return null;
    }

    function getToken() {
        return get()?.token || localStorage.getItem("token") || null;
    }

    function getUser() { return get()?.user || {}; }
    function getNik() { return get()?.nik || getUser()?.nik || ""; }
    function getRole() { return get()?.role || getUser()?.role || ""; }
    function getNama() { return getUser()?.nama || getUser()?.name || ""; }
    function getEmail() { return get()?.email || getUser()?.email || ""; }
    function isLoggedIn() { return !!getToken(); }

    function makeDeviceId() {
        let id = localStorage.getItem(DEVICE_ID_KEY);
        if (id) return id;

        if (window.crypto?.randomUUID) {
            id = "DEV-" + crypto.randomUUID().replace(/-/g, "").toUpperCase();
        } else {
            id = "DEV-" + Date.now().toString(36).toUpperCase() +
                 Math.random().toString(36).slice(2, 12).toUpperCase();
        }
        localStorage.setItem(DEVICE_ID_KEY, id);
        return id;
    }

    function detectBrowser(ua) {
        if (/Edg\//i.test(ua)) return "Microsoft Edge";
        if (/OPR\//i.test(ua)) return "Opera";
        if (/Chrome\//i.test(ua)) return "Google Chrome";
        if (/Firefox\//i.test(ua)) return "Mozilla Firefox";
        if (/Safari\//i.test(ua)) return "Safari";
        return "Unknown";
    }

    function detectOS(ua) {
        if (/Windows NT 10\.0/i.test(ua)) return "Windows 10/11";
        if (/Windows/i.test(ua)) return "Windows";
        if (/Android/i.test(ua)) return "Android";
        if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
        if (/Mac OS X/i.test(ua)) return "macOS";
        if (/Linux/i.test(ua)) return "Linux";
        return "Unknown";
    }

    function detectDevice(ua) {
        if (/iPad|Tablet/i.test(ua)) return "Tablet";
        if (/Mobile|Android|iPhone|iPod/i.test(ua)) return "Mobile";
        return "Desktop";
    }

    async function detectClientInfo(force = false) {
        if (!force) {
            try {
                const cached = JSON.parse(localStorage.getItem(CLIENT_INFO_KEY) || "null");
                if (cached?.device_id && cached?.detected_at &&
                    Date.now() - cached.detected_at < 6 * 60 * 60 * 1000) {
                    return cached;
                }
            } catch (e) {}
        }

        if (clientInfoPromise) return clientInfoPromise;

        clientInfoPromise = (async () => {
            const ua = navigator.userAgent || "";
            const device = detectDevice(ua);
            const browser = detectBrowser(ua);
            const os = detectOS(ua);

            const info = {
                device_id: makeDeviceId(),
                device_name: `${os} ${device} • ${browser}`,
                device,
                browser,
                os,
                public_ip: "",
                ip_address: "",
                user_agent: ua,
                detected_at: Date.now()
            };

            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 5000);
                const response = await fetch("https://api.ipify.org?format=json", {
                    cache: "no-store",
                    signal: controller.signal
                });
                clearTimeout(timeout);

                if (response.ok) {
                    const json = await response.json();
                    info.public_ip = json.ip || "";
                    info.ip_address = info.public_ip;
                }
            } catch (e) {
                console.warn("[Session] Public IP detection unavailable:", e.message);
            }

            try {
                localStorage.setItem(CLIENT_INFO_KEY, JSON.stringify(info));
            } catch (e) {}

            return info;
        })();

        try { return await clientInfoPromise; }
        finally { clientInfoPromise = null; }
    }

    async function sendHeartbeat() {
        if (!isLoggedIn()) return false;
        const info = await detectClientInfo(false);
        return !!(await window.BCS?.Api?.heartbeat?.(info));
    }

    function startHeartbeat() {
        stopHeartbeat();
        if (!isLoggedIn()) return;
        sendHeartbeat();
        heartbeatInterval = setInterval(sendHeartbeat, 30000);
    }

    function stopHeartbeat() {
        if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
            heartbeatInterval = null;
        }
    }

    function set(data) {
        if (!data?.token) return false;
        localStorage.setItem(SESSION_KEY, JSON.stringify(data));
        localStorage.setItem("token", data.token);
        if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
        detectClientInfo(true).finally(startHeartbeat);
        return true;
    }

    function clear() {
        stopHeartbeat();
        [SESSION_KEY, "token", "user", "nik", "role", "userEmail", CLIENT_INFO_KEY]
            .forEach(key => {
                localStorage.removeItem(key);
                sessionStorage.removeItem(key);
            });
        BCS.Storage?.removeSession?.();
        return true;
    }

    document.addEventListener("DOMContentLoaded", () => {
        if (isLoggedIn()) setTimeout(startHeartbeat, 1000);
    });

    window.addEventListener("beforeunload", stopHeartbeat);

    return {
        get, set, clear, isLoggedIn, getToken, getUser, getNik, getRole,
        getNama, getEmail, detectClientInfo, sendHeartbeat, startHeartbeat, stopHeartbeat
    };
})();

window.Session = Session;
BCS.Session = Session;

