// ======================================================
// Building Care System Enterprise v3.6 Stable (Refactored)
// File : assets/js/modules/auth.js
// Phase 1 : Header + Helper + AuthStore
// Radiant Group Duri
// ======================================================

"use strict";

/**
 * ======================================================
 * REKOMENDASI 13: LOGGER SYSTEM (DEBUG CONTROL)
 * ======================================================
 */
const Logger = (() => {
    const isDebug = () => window.CONFIG?.DEBUG !== false;

    return {
        info: (...args) => { if (isDebug()) console.log("[INFO]", ...args); },
        warn: (...args) => { if (isDebug()) console.warn("[WARN]", ...args); },
        error: (...args) => { if (isDebug()) console.error("[ERROR]", ...args); }
    };
})();

/**
 * ======================================================
 * PERBAIKAN 1: AUTH_CONFIG IMMUTABLE (OBJECT.FREEZE)
 * ======================================================
 */
const AUTH_CONFIG = Object.freeze({
    HEARTBEAT_INTERVAL: window.CONFIG?.AUTH?.HEARTBEAT || 300000,
    LOGIN_PAGE: window.CONFIG?.AUTH?.LOGIN || "login.html",
    DEFAULT_ROUTE: window.CONFIG?.AUTH?.DEFAULT || "dashboard.html",
    STORAGE_KEY: "BCS_SESSION"
});

/**
 * ======================================================
 * REKOMENDASI 7: DYNAMIC ROLE ROUTE FROM CONFIG
 * ======================================================
 */
const ROLE_ROUTE = window.CONFIG?.ROUTES || {
    USER: "user-report.html",
    "GENERAL AFFAIR": "user-report.html",
    TECHNICIAN: "workorder.html",
    ADMIN: "dashboard.html",
    ADMINISTRATOR: "dashboard.html",
    "LEAD BRANCH SUPPORT": "dashboard.html"
};

/**
 * ======================================================
 * AUTH HELPER
 * ======================================================
 */
const AuthHelper = (() => {
    function toast(message, type = "info") {
        if (window.App && typeof App.toast === "function") {
            App.toast(message, type);
        } else {
            Logger.info(`[TOAST - ${type.toUpperCase()}] ${message}`);
        }
    }

    function loading(show, text = "Loading...") {
        if (window.App && typeof App.loading === "function") {
            App.loading(show, text);
        }
    }

    function redirect(page) {
        if (AuthHelper.page() === page) {
            Logger.info(`[NAVIGATION] Sudah berada di halaman ${page}. Navigasi dibatalkan.`);
            return;
        }
        location.replace(page);
    }

    function page() {
        return location.pathname.split("/").pop();
    }

    function isLoginPage() {
        return page() === AUTH_CONFIG.LOGIN_PAGE;
    }

    return {
        toast,
        loading,
        redirect,
        page,
        isLoginPage
    };
})();

/**
 * ======================================================
 * REKOMENDASI 2 & 8: AUTH STORE & PERBAIKAN 3: SAFE STORAGE PROVIDER
 * ======================================================
 */
const AuthStore = (() => {
    let cache = null;

    const EMPTY_SESSION = {
        token: "",
        user: {}
    };

    const memoryStorage = (() => {
        const store = {};
        return {
            getItem: (key) => store[key] || null,
            setItem: (key, val) => { store[key] = String(val); },
            removeItem: (key) => { delete store[key]; }
        };
    })();

    const storageProvider = () => {
        if (window.App && typeof App.storage === "function") {
            return App.storage();
        }
        
        try {
            localStorage.setItem("__storage_test__", "1");
            localStorage.removeItem("__storage_test__");
            return localStorage;
        } catch (e) {
            Logger.warn("localStorage tidak tersedia, mencoba sessionStorage.", e);
            try {
                sessionStorage.setItem("__storage_test__", "1");
                sessionStorage.removeItem("__storage_test__");
                return sessionStorage;
            } catch (err) {
                Logger.error("sessionStorage juga tidak tersedia. Menggunakan memory fallback.", err);
                return memoryStorage;
            }
        }
    };

    function get() {
        if (cache) return cache;
        if (window.App && typeof App.getSession === "function") {
            cache = App.getSession() ?? structuredClone(EMPTY_SESSION);
        } else {
            const stored = storageProvider().getItem(AUTH_CONFIG.STORAGE_KEY);
            cache = stored ? JSON.parse(stored) : structuredClone(EMPTY_SESSION);
        }
        return cache;
    }

    function set(session) {
        cache = session || structuredClone(EMPTY_SESSION);
        if (window.App && typeof App.setSession === "function") {
            App.setSession(cache);
        } else {
            storageProvider().setItem(AUTH_CONFIG.STORAGE_KEY, JSON.stringify(cache));
        }
        return cache;
    }

    function clear() {
        cache = structuredClone(EMPTY_SESSION);
        if (window.App && typeof App.removeSession === "function") {
            App.removeSession();
        } else {
            storageProvider().removeItem(AUTH_CONFIG.STORAGE_KEY);
        }
    }

    function token() { return get()?.token || ""; }
    function user() { return get()?.user || {}; }
    function role() { return String(user().role || "").trim().toUpperCase(); }
    function isLogin() { return token() !== ""; }

    function hasRole(...roles) { return roles.includes(role()); }

    function updateUser(data = {}) {
        const session = get();
        session.user = { ...session.user, ...data };
        set(session);
    }

    function updateToken(newToken) {
        const session = get();
        session.token = newToken;
        set(session);
    }

    return {
        get, set, clear, token, user, role, isLogin, hasRole, updateUser, updateToken, storageProvider
    };
})();

Logger.info("Auth Phase 1 Loaded");

/**
 * ======================================================
 * REKOMENDASI 5 & 6: AUTH API WITH RETRY LOGIC & SAFE VERIFY
 * ======================================================
 * FIX: Gunakan BCS.Api, bukan Api langsung
 */
const AuthApi = (() => {
    // Helper untuk mendapatkan Api instance
    function getApi() {
        // Coba ambil dari BCS.Api terlebih dahulu
        if (window.BCS && window.BCS.Api) {
            return window.BCS.Api;
        }
        // Fallback ke window.Api
        if (window.Api) {
            return window.Api;
        }
        // Terakhir coba BCS.Api dari global
        return window.BCS?.Api;
    }

    async function login(payload = {}) {
        AuthHelper.loading(true, "Signing In...");
        try {
            Logger.info("Login Request", payload);
            const api = getApi();
            if (!api) {
                throw new Error("API not initialized");
            }
            const response = await api.post("login", payload);
            Logger.info("Login Response", response);

            if (!response || !response.success) {
                return response || { success: false, message: "Login gagal." };
            }

            AuthStore.set(response.data);
            return response;
        } catch (err) {
            Logger.error("Login Error:", err);
            return { success: false, message: err.message || "Server tidak dapat dihubungi." };
        } finally {
            AuthHelper.loading(false);
        }
    }

    async function logout() {
        AuthHeartbeat.stop();
        try {
            if (AuthStore.isLogin()) {
                const api = getApi();
                if (api) {
                    await api.post("logout", { token: AuthStore.token() });
                }
            }
        } catch (err) {
            Logger.warn("Logout API warning:", err);
        } finally {
            AuthStore.clear();
            AuthHelper.redirect(AUTH_CONFIG.LOGIN_PAGE);
        }
    }

    async function verify() {
        if (!AuthStore.isLogin()) return false;
        try {
            const api = getApi();
            if (!api) return false;
            const response = await api.post("verifySession", { token: AuthStore.token() });
            return Boolean(response && response.success);
        } catch (err) {
            Logger.warn("Verify API Warning:", err);
            return false;
        }
    }

    async function verifyWithRetry(retries = 3, delayMs = 2000) {
        for (let i = 1; i <= retries; i++) {
            const isValid = await verify();
            if (isValid) return true;
            
            Logger.warn(`Verifikasi gagal. Mencoba ulang (${i}/${retries})...`);
            if (i < retries) {
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
        return false;
    }

    async function refresh() {
        const valid = await verifyWithRetry();
        if (!valid) {
            AuthHelper.toast("Session Expired", "warning");
            await logout();
        }
        return valid;
    }

    return {
        login, logout, verify, verifyWithRetry, refresh,
        updateUser: AuthStore.updateUser,
        updateToken: AuthStore.updateToken
    };
})();

Logger.info("Auth Phase 2 Loaded");

// ... sisanya sama seperti auth.js Anda ...

/**
 * ======================================================
 * AUTH FACADE (REKOMENDASI 15: OBJECT FREEZE)
 * ======================================================
 */
const Auth = (() => {
    const instance = {
        login: AuthApi.login,
        logout: AuthApi.logout,
        verify: AuthApi.verify,
        guard: AuthGuard.protect,
        user: AuthStore.user,
        token: AuthStore.token,
        role: AuthStore.role,
        session: AuthStore.get,
        isLogin: AuthStore.isLogin,
        redirect: AuthRouter.redirect,
        clear: AuthStore.clear,
        startHeartbeat: AuthHeartbeat.start,
        stopHeartbeat: AuthHeartbeat.stop
    };

    // FIX: Assign ke window.Auth agar bisa diakses global
    window.Auth = instance;
    return Object.freeze(instance);
})();

// ... sisanya tetap sama ...
