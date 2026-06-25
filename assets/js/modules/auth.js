// ======================================================
// Building Care System Enterprise v4.0 Architect-Level
// File : assets/js/modules/auth.js
// Radiant Group Duri
// ======================================================

"use strict";

// Inisialisasi Namespace Tunggal Enterprise (Rekomendasi 10)
window.BCS = window.BCS || {};

/**
 * ======================================================
 * REKOMENDASI 1 & 10: ENTERPRISE LOGGER SYSTEM
 * ======================================================
 */
BCS.Logger = (() => {
    const isDebug = () => window.CONFIG?.DEBUG !== false;

    return Object.freeze({
        info: (module, message, ...args) => {
            if (isDebug()) console.log(`[%c${module.toUpperCase()}%c] ${message}`, "color: #10b981; font-weight: bold;", "", ...args);
        },
        warn: (module, message, ...args) => {
            if (isDebug()) console.warn(`[%c${module.toUpperCase()}%c] ${message}`, "color: #f59e0b; font-weight: bold;", "", ...args);
        },
        error: (module, error, ...args) => {
            if (isDebug()) console.error(`[%c${module.toUpperCase()}%c]`, "color: #ef4444; font-weight: bold;", error, ...args);
        }
    });
})();

/**
 * ======================================================
 * REKOMENDASI 2: IMMUTABLE AUTH CONFIG
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
 * REKOMENDASI 7: NETWORK DETECTION SERVICE
 * ======================================================
 */
const NetworkService = (() => {
    function init() {
        window.addEventListener("online", () => {
            BCS.Logger.info("NETWORK", "📡 System Online. Resuming Operations.");
            if (window.App && typeof App.toast === "function") App.toast("Kembali Online", "success");
        });
        window.addEventListener("offline", () => {
            BCS.Logger.warn("NETWORK", "📡 Offline Mode. Checking connection stability.");
            if (window.App && typeof App.toast === "function") App.toast("Koneksi Terputus (Offline Mode)", "danger");
        });
    }
    return { init, isOnline: () => navigator.onLine };
})();

/**
 * ======================================================
 * REKOMENDASI 5: NAVIGATION SERVICE
 * ======================================================
 */
const Navigation = (() => {
    return Object.freeze({
        go: (page) => {
            BCS.Logger.info("NAVIGATE", `Redirecting to => ${page}`);
            location.replace(page);
        },
        page: () => location.pathname.split("/").pop(),
        isLoginPage: () => location.pathname.split("/").pop() === AUTH_CONFIG.LOGIN_PAGE
    });
})();

/**
 * ======================================================
 * REKOMENDASI 3 & 10: CENTRALIZED STORAGE PROVIDER
 * ======================================================
 */
BCS.Storage = (() => {
    // Memory fallback jika localStorage/sessionStorage tidak dapat diakses
    const memoryStore = new Map();

    const provider = (type = "local") => {
        if (window.App && typeof App.storage === "function") return App.storage();
        try {
            return type === "session" ? sessionStorage : localStorage;
        } catch {
            return {
                getItem: (key) => memoryStore.get(key) || null,
                setItem: (key, val) => memoryStore.set(key, val),
                removeItem: (key) => memoryStore.delete(key)
            };
        }
    };

    return Object.freeze({
        get: (key, type = "local") => {
            const data = provider(type).getItem(key);
            try { return data ? JSON.parse(data) : null; } catch { return data; }
        },
        set: (key, val, type = "local") => {
            const strVal = typeof val === "object" ? JSON.stringify(val) : val;
            provider(type).setItem(key, strVal);
        },
        remove: (key, type = "local") => provider(type).removeItem(key)
    });
})();

/**
 * ======================================================
 * AUTH STORE
 * ======================================================
 */
const AuthStore = (() => {
    let cache = null;
    const EMPTY_SESSION = Object.freeze({ token: "", user: {} });

    function get() {
        if (cache) return cache;
        if (window.App && typeof App.getSession === "function") {
            cache = App.getSession() ?? structuredClone(EMPTY_SESSION);
        } else {
            cache = BCS.Storage.get(AUTH_CONFIG.STORAGE_KEY) ?? structuredClone(EMPTY_SESSION);
        }
        return cache;
    }

    function set(session) {
        cache = session || structuredClone(EMPTY_SESSION);
        if (window.App && typeof App.setSession === "function") {
            App.setSession(cache);
        } else {
            BCS.Storage.set(AUTH_CONFIG.STORAGE_KEY, cache);
        }
        return cache;
    }

    function clear() {
        cache = structuredClone(EMPTY_SESSION);
        if (window.App && typeof App.removeSession === "function") {
            App.removeSession();
        } else {
            BCS.Storage.remove(AUTH_CONFIG.STORAGE_KEY);
        }
    }

    return {
        get, set, clear,
        token: () => get()?.token || "",
        user: () => get()?.user || {},
        role: () => String(user().role || "").trim().toUpperCase(),
        isLogin: () => token() !== ""
    };
})();

/**
 * ======================================================
 * REKOMENDASI 4: CENTRALIZED REQUEST HANDLER & AUTH API
 * ======================================================
 */
const AuthApi = (() => {
    // Interceptor & Wrapper Terpusat untuk Penanganan Error API
    async function request(endpoint, payload = {}) {
        if (!NetworkService.isOnline()) {
            BCS.Logger.warn("AUTH_API", `Aborted [${endpoint}] request due to offline status.`);
            return { success: false, message: "Tidak ada koneksi internet." };
        }
        try {
            // Menggunakan provider Api bawaan BCS global
            const apiProvider = window.Api || window.BCS.Api;
            if (!apiProvider || typeof apiProvider.post !== "function") {
                throw new Error("BCS API Provider Global tidak ditemukan.");
            }
            return await apiProvider.post(endpoint, payload);
        } catch (err) {
            BCS.Logger.error("AUTH_API", `Endpoint [${endpoint}] failed:`, err);
            return { success: false, message: "Koneksi server bermasalah." };
        }
    }

    async function login(payload = {}) {
        if (window.App && typeof App.loading === "function") App.loading(true, "Signing In...");
        
        BCS.Logger.info("AUTH", "Initiating login request...");
        const response = await request("login", payload);

        if (response && response.success) {
            AuthStore.set(response.data);
            // Rekomendasi 9: Global Event Dispatch
            window.dispatchEvent(new CustomEvent("auth:login", { detail: response.data }));
        }
        
        if (window.App && typeof App.loading === "function") App.loading(false);
        return response;
    }

    async function logout() {
        AuthHeartbeat.stop();
        try {
            if (AuthStore.isLogin()) {
                await request("logout", { token: AuthStore.token() });
            }
        } finally {
            AuthStore.clear();
            // Rekomendasi 9: Global Event Dispatch
            window.dispatchEvent(new CustomEvent("auth:logout"));
            Navigation.go(AUTH_CONFIG.LOGIN_PAGE);
        }
    }

    async function verify() {
        if (!AuthStore.isLogin()) return false;
        const response = await request("verifySession", { token: AuthStore.token() });
        return Boolean(response && response.success);
    }

    async function verifyWithRetry(retries = 3, delayMs = 2000) {
        for (let i = 1; i <= retries; i++) {
            if (await verify()) return true;
            BCS.Logger.warn("AUTH", `Verifikasi gagal. Retry attempt (${i}/${retries})`);
            if (i < retries) await new Promise(res => setTimeout(res, delayMs));
        }
        return false;
    }

    /**
     * REKOMENDASI 8: AUTO REFRESH TOKEN
     */
    async function refreshToken() {
        BCS.Logger.info("AUTH", "Attempting token silent refresh...");
        const response = await request("refreshToken", { token: AuthStore.token() });
        if (response && response.success && response.data?.token) {
            AuthStore.updateToken(response.data.token);
            BCS.Logger.info("AUTH", "Silent token refresh success.");
            return true;
        }
        BCS.Logger.error("AUTH", "Silent token refresh rejected by Server.");
        return false;
    }

    return { login, logout, verifyWithRetry, refreshToken };
})();

/**
 * ======================================================
 * AUTH ROUTER
 * ======================================================
 */
const AuthRouter = (() => {
    const ROLE_ROUTE = window.CONFIG?.ROUTES || {
        USER: "user-report.html",
        "GENERAL AFFAIR": "user-report.html",
        TECHNICIAN: "workorder.html",
        ADMIN: "dashboard.html",
        ADMINISTRATOR: "dashboard.html",
        "LEAD BRANCH SUPPORT": "dashboard.html"
    };

    function getRoute(role = "") {
        return ROLE_ROUTE[String(role).trim().toUpperCase()] || AUTH_CONFIG.DEFAULT_ROUTE;
    }

    return {
        redirect: () => Navigation.go(getRoute(AuthStore.role())),
        allow: (...roles) => roles.length === 0 || roles.includes(AuthStore.role())
    };
})();

/**
 * ======================================================
 * AUTH GUARD
 * ======================================================
 */
const AuthGuard = (() => {
    async function protect(roles = []) {
        if (Navigation.isLoginPage()) {
            if (AuthStore.isLogin()) AuthRouter.redirect();
            return true;
        }

        if (!AuthStore.isLogin()) {
            BCS.Logger.warn("GUARD", "Unauthorized state. Redirecting to login.");
            Navigation.go(AUTH_CONFIG.LOGIN_PAGE);
            return false;
        }

        const sessionValid = await AuthApi.verifyWithRetry();
        if (!sessionValid) {
            BCS.Logger.error("GUARD", "Session validation failed on load.");
            await AuthApi.logout();
            return false;
        }

        if (roles.length > 0 && !AuthRouter.allow(...roles)) {
            BCS.Logger.warn("GUARD", "Forbidden Area: User lacking role authorization.");
            if (window.App && typeof App.toast === "function") App.toast("Hak akses ditolak", "warning");
            AuthRouter.redirect();
            return false;
        }

        return true;
    }

    return { protect };
})();

/**
 * ======================================================
 * AUTH UI HANDLER
 * ======================================================
 */
const AuthUI = (() => {
    let submitting = false;
    let binded = false;

    const dom = {
        form: () => document.getElementById("loginForm"),
        nik: () => document.getElementById("nik"),
        password: () => document.getElementById("password"),
        button: () => document.getElementById("btnLogin"),
        remember: () => document.getElementById("rememberMe"),
        togglePassword: () => document.getElementById("togglePassword")
    };

    async function submit(e) {
        if (e) e.preventDefault();
        if (submitting) return;

        if (!dom.nik()?.value.trim() || !dom.password()?.value.trim()) {
            if (window.App && typeof App.toast === "function") App.toast("Lengkapi seluruh form login", "warning");
            return;
        }

        submitting = true;
        dom.button()?.setAttribute("disabled", "true");

        const result = await AuthApi.login({
            nik: dom.nik().value.trim(),
            password: dom.password().value.trim()
        });

        if (result && result.success) {
            if (dom.remember()?.checked) {
                BCS.Storage.set("BCS_REMEMBER", dom.nik().value.trim());
            } else {
                BCS.Storage.remove("BCS_REMEMBER");
            }
            
            if (window.App && typeof App.toast === "function") App.toast("Selamat datang kembali!", "success");

            await Promise.resolve();
            requestAnimationFrame(() => AuthRouter.redirect());
        } else {
            if (window.App && typeof App.toast === "function") App.toast(result?.message || "Identitas login salah", "danger");
            submitting = false;
            dom.button()?.removeAttribute("disabled");
        }
    }

    function init() {
        if (binded || !Navigation.isLoginPage()) return;
        binded = true;

        dom.form()?.addEventListener("submit", submit);
        
        dom.togglePassword()?.addEventListener("click", () => {
            const passEl = dom.password();
            if (!passEl) return;
            const isPass = passEl.type === "password";
            passEl.type = isPass ? "text" : "password";
            
            const icon = dom.togglePassword().querySelector("i") || dom.togglePassword();
            icon.className = isPass 
                ? icon.className.replace(/fa-eye|bi-eye/g, m => m.includes("fa") ? "fa-eye-slash" : "bi-eye-slash")
                : icon.className.replace(/fa-eye-slash|bi-eye-slash/g, m => m.includes("fa") ? "fa-eye" : "bi-eye");
        });

        const savedNik = BCS.Storage.get("BCS_REMEMBER");
        if (savedNik && dom.nik() && dom.remember()) {
            dom.nik().value = savedNik;
            dom.remember().checked = true;
        }

        dom.nik()?.focus();
        BCS.Logger.info("UI", "Auth UI Components loaded cleanly.");
    }

    return { init };
})();

/**
 * ======================================================
 * REKOMENDASI 6: AUTH HEARTBEAT WITH VISIBILITY DETECTION
 * ======================================================
 */
const AuthHeartbeat = (() => {
    let timer = null;

    async function processPulse() {
        if (!AuthStore.isLogin()) return;
        BCS.Logger.info("HEARTBEAT", "Validating pipeline activity background...");
        
        const valid = await AuthApi.verifyWithRetry();
        if (valid) {
            if (window.App && typeof App.refreshLastActivity === "function") {
                App.refreshLastActivity();
            }
        } else {
            BCS.Logger.error("HEARTBEAT", "Background handshake failed. Purging active terminal.");
            await AuthApi.logout();
        }
    }

    function start() {
        stop();
        timer = setInterval(processPulse, AUTH_CONFIG.HEARTBEAT_INTERVAL);
        BCS.Logger.info("HEARTBEAT", "Background loop initialized.");
    }

    function stop() {
        if (timer) {
            clearInterval(timer);
            timer = null;
            BCS.Logger.info("HEARTBEAT", "Background loop suspended.");
        }
    }

    function initVisibilityTriggers() {
        // Otomatis pause heartbeat jika tab di-minimize atau berpindah tab (Menghemat resource device client)
        document.addEventListener("visibilitychange", () => {
            if (!AuthStore.isLogin()) return;
            if (document.hidden) {
                BCS.Logger.info("HEARTBEAT", "Application hidden. Entering safe hibernation pause mode.");
                stop();
            } else {
                BCS.Logger.info("HEARTBEAT", "Application focused. Activating reactive resume.");
                processPulse(); // Jalankan verifikasi instant saat tab dibuka kembali
                start();
            }
        });
    }

    return { start, stop, initVisibilityTriggers };
})();

/**
 * ======================================================
 * REKOMENDASI 10 & 15: SECURE ARCHITECT FACADE IMMUTABILITY
 * ======================================================
 */
BCS.Auth = (() => {
    const facadeInstance = {
        login: AuthApi.login,
        logout: AuthApi.logout,
        guard: AuthGuard.protect,
        refreshToken: AuthApi.refreshToken,
        user: AuthStore.user,
        token: AuthStore.token,
        role: AuthStore.role,
        isLogin: AuthStore.isLogin,
        startHeartbeat: AuthHeartbeat.start,
        stopHeartbeat: AuthHeartbeat.stop
    };

    // Bekukan facade agar komponen internal/script luar tidak bisa melakukan manipulasi (Anti-Tampering)
    return Object.freeze(facadeInstance);
})();

// Backward compatibility shim untuk module legacy
if (!window.Session) {
    window.Session = Object.freeze({
        getUser: () => BCS.Auth.user(),
        getToken: () => BCS.Auth.token(),
        getRole: () => BCS.Auth.role(),
        isLoggedIn: () => BCS.Auth.isLogin()
    });
}

/**
 * ======================================================
 * AUTH BOOTSTRAPPER (WINDOW LOAD ENGINE)
 * ======================================================
 */
const AuthBootstrap = (() => {
    let executed = false;

    async function startEngine() {
        if (executed) return;
        executed = true;

        BCS.Logger.info("CORE", "Bootstrapping BCS Engine v4.0 Structural Architecture...");

        NetworkService.init();
        AuthHeartbeat.initVisibilityTriggers();

        const activeRouteClear = await AuthGuard.protect();
        if (!activeRouteClear) return;

        if (Navigation.isLoginPage()) {
            AuthUI.init();
        } else {
            AuthHeartbeat.start();
        }

        BCS.Logger.info("CORE", "All modules stabilized.");
    }

    return { startEngine };
})();

// Rekomendasi 12 (Dari sebelumnya) & Dipertahankan di v4: load event agar seluruh aset CSS & DOM render tuntas
window.addEventListener("load", AuthBootstrap.startEngine);
