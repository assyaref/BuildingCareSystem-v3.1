// ======================================================
// Building Care System Enterprise v3.7 Stable
// File : assets/js/modules/auth.js
// Radiant Group Duri
// ======================================================

"use strict";

/**
 * ======================================================
 * LOGGER SYSTEM (DEBUG CONTROL)
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
 * AUTH_CONFIG IMMUTABLE
 * ======================================================
 */
const AUTH_CONFIG = Object.freeze({
    HEARTBEAT_INTERVAL: window.CONFIG?.AUTH?.HEARTBEAT || 300000,
    LOGIN_PAGE: window.CONFIG?.AUTH?.LOGIN || "login.html",
    DEFAULT_ROUTE: window.CONFIG?.AUTH?.DEFAULT || "user-report.html",
    STORAGE_KEY: "BCS_SESSION"
});

/**
 * ======================================================
 * DYNAMIC ROLE ROUTE FROM CONFIG
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
 * AUTH STORE - FIXED
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
        
        try {
            let stored = null;
            
            // Coba dari App dulu
            if (window.App && typeof App.getSession === "function") {
                stored = App.getSession();
                if (stored && stored.token) {
                    cache = stored;
                    return cache;
                }
            }
            
            // Coba dari BCS_SESSION
            const raw = storageProvider().getItem(AUTH_CONFIG.STORAGE_KEY);
            if (raw) {
                stored = JSON.parse(raw);
                if (stored && stored.token) {
                    cache = stored;
                    return cache;
                }
            }
            
            // Fallback ke key legacy
            const token = localStorage.getItem("token");
            const userStr = localStorage.getItem("user");
            const nik = localStorage.getItem("nik");
            const role = localStorage.getItem("role");
            
            if (token) {
                const user = userStr ? JSON.parse(userStr) : {};
                stored = {
                    token: token,
                    user: user,
                    nik: nik || user?.nik || "",
                    role: role || user?.role || ""
                };
                // Sync ke BCS_SESSION
                storageProvider().setItem(AUTH_CONFIG.STORAGE_KEY, JSON.stringify(stored));
                cache = stored;
                return cache;
            }
            
            cache = structuredClone(EMPTY_SESSION);
            return cache;
        } catch (e) {
            console.error("[AuthStore] Gagal get session:", e);
            cache = structuredClone(EMPTY_SESSION);
            return cache;
        }
    }

    function set(session) {
        // Validasi
        if (!session || !session.token) {
            console.warn("[AuthStore] Session tidak valid:", session);
            return null;
        }

        // Normalisasi
        const normalized = {
            token: session.token || "",
            user: session.user || {},
            nik: session.nik || session.user?.nik || "",
            role: session.role || session.user?.role || ""
        };

        // Pastikan nik dan role ada di user
        if (normalized.nik && !normalized.user.nik) {
            normalized.user.nik = normalized.nik;
        }
        if (normalized.role && !normalized.user.role) {
            normalized.user.role = normalized.role;
        }

        cache = normalized;

        try {
            const storage = storageProvider();
            const jsonData = JSON.stringify(normalized);
            
            // Simpan ke BCS_SESSION
            storage.setItem(AUTH_CONFIG.STORAGE_KEY, jsonData);
            
            // Simpan ke key legacy
            storage.setItem("token", normalized.token);
            storage.setItem("user", JSON.stringify(normalized.user));
            if (normalized.nik) {
                storage.setItem("nik", normalized.nik);
            }
            if (normalized.role) {
                storage.setItem("role", normalized.role);
            }

            // Juga simpan via Session jika ada
            if (window.Session && typeof Session.set === "function") {
                Session.set(normalized);
            }

            console.log("✅ [AuthStore] Session tersimpan:", {
                key: AUTH_CONFIG.STORAGE_KEY,
                token: normalized.token.substring(0, 20) + "...",
                nik: normalized.nik,
                role: normalized.role
            });

            return normalized;
        } catch (e) {
            console.error("❌ [AuthStore] Gagal menyimpan:", e);
            return null;
        }
    }

    function clear() {
        cache = structuredClone(EMPTY_SESSION);
        if (window.App && typeof App.removeSession === "function") {
            App.removeSession();
        } else {
            storageProvider().removeItem(AUTH_CONFIG.STORAGE_KEY);
            // Hapus juga key legacy
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            localStorage.removeItem("nik");
            localStorage.removeItem("role");
        }
        // Clear via Session
        if (window.Session && typeof Session.clear === "function") {
            Session.clear();
        }
    }

    function token() { return get()?.token || ""; }
    function user() { return get()?.user || {}; }
    function role() { return String(user().role || get()?.role || "").trim().toUpperCase(); }
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
 * AUTH API - FIXED
 * ======================================================
 */
const AuthApi = (() => {
    function getApi() {
        if (window.BCS && window.BCS.Api) {
            return window.BCS.Api;
        }
        if (window.Api) {
            return window.Api;
        }
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

            // Debug log
            console.log("🔍 [LOGIN] Response:", response);
            console.log("🔍 [LOGIN] Response.data:", response?.data);
            console.log("🔍 [LOGIN] Response.success:", response?.success);

            if (!response || !response.success) {
                console.error("❌ [LOGIN] Login gagal:", response?.message);
                return response || { success: false, message: "Login gagal." };
            }

            // Normalisasi data session
            let rawData = response.data || {};
            let sessionData = {
                token: rawData.token || response.token || "",
                user: rawData.user || response.user || {},
                nik: rawData.nik || response.nik || rawData.user?.nik || "",
                role: rawData.role || response.role || rawData.user?.role || ""
            };

            // Pastikan user punya nik dan role
            if (sessionData.nik && !sessionData.user.nik) {
                sessionData.user.nik = sessionData.nik;
            }
            if (sessionData.role && !sessionData.user.role) {
                sessionData.user.role = sessionData.role;
            }

            console.log("✅ [LOGIN] Session data:", sessionData);

            // Simpan session via AuthStore
            const saved = AuthStore.set(sessionData);
            console.log("✅ [LOGIN] Session tersimpan:", saved);
            
            // Verifikasi storage
            const stored = localStorage.getItem("BCS_SESSION");
            console.log("✅ [LOGIN] localStorage BCS_SESSION:", stored ? "ADA" : "TIDAK ADA");

            return response;
        } catch (err) {
            Logger.error("Login Error:", err);
            console.error("❌ [LOGIN] Error:", err);
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

/**
 * ======================================================
 * AUTH ROUTER
 * ======================================================
 */
const AuthRouter = (() => {
    function getRoute(role = "") {
        role = String(role).trim().toUpperCase();
        return ROLE_ROUTE[role] || AUTH_CONFIG.DEFAULT_ROUTE;
    }

    function redirect() {
        const role = AuthStore.role();
        const page = getRoute(role);
        Logger.info("[AUTH ROUTER]", role, "=>", page);
        AuthHelper.redirect(page);
    }

    function byRole(role) { AuthHelper.redirect(getRoute(role)); }
    function is(...roles) { return roles.includes(AuthStore.role()); }
    function allow(...roles) { return roles.length === 0 || is(...roles); }
    function current() { return AuthHelper.page(); }
    function exists(role) { return !!ROLE_ROUTE[String(role).trim().toUpperCase()]; }
    function routes() { return { ...ROLE_ROUTE }; }

    return { redirect, byRole, getRoute, allow, is, current, exists, routes };
})();

Logger.info("Auth Phase 3 Loaded");

/**
 * ======================================================
 * AUTH GUARD
 * ======================================================
 */
const AuthGuard = (() => {
    function isAuthenticated() { return AuthStore.isLogin(); }

    async function login() {
        if (AuthHelper.isLoginPage()) return true;
        if (!isAuthenticated()) {
            Logger.info("[AUTH GUARD]", "Session Not Found");
            AuthHelper.redirect(AUTH_CONFIG.LOGIN_PAGE);
            return false;
        }
        return true;
    }

    function role(...roles) {
        if (roles.length === 0 || AuthRouter.allow(...roles)) return true;
        AuthHelper.toast("Anda tidak memiliki hak akses.", "warning");
        AuthRouter.redirect();
        return false;
    }

    async function session() {
        if (!isAuthenticated()) return false;
        const valid = await AuthApi.verifyWithRetry();
        if (!valid) {
            AuthHelper.toast("Session Expired", "warning");
            await AuthApi.logout();
            return false;
        }
        return true;
    }

    async function protect(roles = []) {
        if (!(await login()) || !(await session())) return false;
        return !(roles.length > 0 && !role(...roles));
    }

    function autoRedirect() {
        if (AuthHelper.isLoginPage() && AuthStore.isLogin()) {
            AuthRouter.redirect();
        }
    }

    return {
        login, role, session, protect, autoRedirect,
        publicPage: () => AuthHelper.isLoginPage(),
        privatePage: () => !AuthHelper.isLoginPage(),
        isAuthenticated
    };
})();

Logger.info("Auth Phase 4 Loaded");

/**
 * ======================================================
 * AUTH UI
 * ======================================================
 */
const AuthUI = (() => {
    let submitting = false;
    let binded = false;

    function form() { return document.getElementById("loginForm"); }
    function nik() { return document.getElementById("nik"); }
    function password() { return document.getElementById("password"); }
    function button() { return document.getElementById("btnLogin") || document.getElementById("loginButton"); }
    function remember() { return document.getElementById("remember") || document.getElementById("rememberMe"); }
    function togglePassword() { return document.getElementById("togglePassword"); }

    function validate() {
        if (!nik()?.value.trim()) {
            AuthHelper.toast("NIK wajib diisi", "warning");
            nik()?.focus();
            return false;
        }
        if (!password()?.value.trim()) {
            AuthHelper.toast("Password wajib diisi", "warning");
            password()?.focus();
            return false;
        }
        return true;
    }

    async function submit(e) {
        if (e) e.preventDefault();
        if (submitting) return;
        if (!validate()) return;

        submitting = true;
        const btn = button();
        if (btn) btn.setAttribute("disabled", "true");

        try {
            const result = await AuthApi.login({
                nik: nik().value.trim(),
                password: password().value.trim()
            });

            if (!result || !result.success) {
                AuthHelper.toast(result?.message || "Login gagal", "danger");
                return;
            }

            saveRemember();
            AuthHelper.toast("Login berhasil", "success");

            await Promise.resolve();
            requestAnimationFrame(() => {
                AuthRouter.redirect();
            });
        } catch (err) {
            Logger.error("Submit UI Fatal Error:", err);
            AuthHelper.toast("Terjadi kesalahan sistem.", "danger");
        } finally {
            submitting = false;
            if (btn) btn.removeAttribute("disabled");
        }
    }

    function saveRemember() {
        if (!remember()) return;
        const storage = AuthStore.storageProvider();
        if (remember().checked) {
            storage.setItem("BCS_REMEMBER", nik().value.trim());
        } else {
            storage.removeItem("BCS_REMEMBER");
        }
    }

    function loadRemember() {
        if (!remember() || !nik()) return;
        const nikSaved = AuthStore.storageProvider().getItem("BCS_REMEMBER");
        if (!nikSaved) return;

        nik().value = nikSaved;
        remember().checked = true;
    }

    function bindTogglePassword() {
        const toggleEl = togglePassword();
        const passEl = password();
        if (!toggleEl || !passEl) return;
        
        toggleEl.addEventListener("click", () => {
            const isPassword = passEl.type === "password";
            passEl.type = isPassword ? "text" : "password";
            
            const iconEl = toggleEl.querySelector("i") || toggleEl;
            if (isPassword) {
                iconEl.className = iconEl.className.replace(/fa-eye|bi-eye/g, match => match.includes("fa") ? "fa-eye-slash" : "bi-eye-slash");
            } else {
                iconEl.className = iconEl.className.replace(/fa-eye-slash|bi-eye-slash/g, match => match.includes("fa") ? "fa-eye" : "bi-eye");
            }
        });
    }

    function bindEnterKey() {
        if (!form()) return; 
        password()?.addEventListener("keypress", e => {
            if (e.key === "Enter") submit(e);
        });
    }

    function init() {
        if (binded) return; 
        binded = true;

        form()?.addEventListener("submit", submit);
        bindEnterKey();
        bindTogglePassword();
        loadRemember();
        nik()?.focus();
        Logger.info("Auth UI Ready");
    }

    return { init, submit, validate };
})();

Logger.info("Auth Phase 5 Loaded");

/**
 * ======================================================
 * AUTH HEARTBEAT
 * ======================================================
 */
const AuthHeartbeat = (() => {
    let timer = null;

    function start() {
        stop();
        timer = setInterval(verifyAndRefresh, AUTH_CONFIG.HEARTBEAT_INTERVAL);
        Logger.info("Heartbeat Started");
    }

    function stop() {
        if (timer) {
            clearInterval(timer);
            timer = null;
            Logger.info("Heartbeat Stopped");
        }
    }

    async function verifyAndRefresh() {
        if (!AuthStore.isLogin()) return;
        
        const valid = await AuthApi.verifyWithRetry();
        if (valid) {
            if (window.App && typeof App.refreshLastActivity === "function") {
                App.refreshLastActivity();
                Logger.info("Session verified & activity timestamp refreshed.");
            }
        } else {
            AuthHelper.toast("Session Expired", "warning");
            await AuthApi.logout();
        }
    }

    return { start, stop, verify: verifyAndRefresh };
})();

Logger.info("Auth Phase 6 Loaded");

/**
 * ======================================================
 * AUTH FACADE
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

    window.Auth = instance;
    return Object.freeze(instance);
})();

/**
 * ======================================================
 * BACKWARD COMPATIBILITY
 * ======================================================
 */
if (!window.Session) {
    window.Session = {
        getUser: () => Auth.user(),
        getToken: () => Auth.token(),
        getRole: () => Auth.role(),
        isLoggedIn: () => Auth.isLogin(),
        get: () => Auth.session(),
        set: (data) => {
            const session = Auth.session();
            Object.assign(session, data);
            // Re-save
            const store = window.Auth;
            if (store && store.session) {
                // AuthStore.set sudah handle save
            }
        },
        clear: () => Auth.clear()
    };
    Logger.info("Legacy window.Session polyfill attached.");
}

Logger.info("Auth Phase 7 Loaded");

/**
 * ======================================================
 * AUTH BOOTSTRAP
 * ======================================================
 */
const AuthBootstrap = (() => {
    let initialized = false;

    async function init() {
        if (initialized) return;
        initialized = true;

        Logger.info("Initializing Authentication Architecture...");

        await new Promise(resolve => setTimeout(resolve, 100));

        AuthGuard.autoRedirect();

        if (AuthGuard.privatePage()) {
            const ok = await AuthGuard.protect();
            if (!ok) return;
            AuthHeartbeat.start();
        }

        if (AuthHelper.isLoginPage()) {
            AuthUI.init();
        }

        Logger.info("Authentication Engine Ready");
    }

    return { init };
})();

// Bootstrap
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', AuthBootstrap.init);
} else {
    AuthBootstrap.init();
}
