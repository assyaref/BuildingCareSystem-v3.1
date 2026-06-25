// ======================================================
// Building Care System Enterprise v3.5 Stable (Refactored)
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
 * REKOMENDASI 1: AUTH CONFIG FROM CONFIG.JS
 * ======================================================
 */
const AUTH_CONFIG = {
    HEARTBEAT_INTERVAL: window.CONFIG?.AUTH?.HEARTBEAT || 300000,
    LOGIN_PAGE: window.CONFIG?.AUTH?.LOGIN || "login.html",
    DEFAULT_ROUTE: window.CONFIG?.AUTH?.DEFAULT || "dashboard.html",
    STORAGE_KEY: "BCS_SESSION"
};

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

    // BUG 3 FIXED: Cegah redirect ke halaman yang sama
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
 * REKOMENDASI 2 & 8: AUTH STORE (SAFE SESSION & ONE-GATE STORAGE)
 * ======================================================
 */
const AuthStore = (() => {
    let cache = null;

    const EMPTY_SESSION = {
        token: "",
        user: {}
    };

    const storageProvider = () => {
        if (window.App && typeof App.storage === "function") {
            return App.storage();
        }
        return localStorage;
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

    // BUG 1 FIXED: Fungsi dideklarasikan secara eksplisit dengan hoisting yang aman
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
 */
const AuthApi = (() => {
    async function login(payload = {}) {
        AuthHelper.loading(true, "Signing In...");
        try {
            Logger.info("Login Request", payload);
            const response = await Api.post("login", payload);
            Logger.info("Login Response", response);

            if (!response || !response.success) {
                return response || { success: false, message: "Login gagal." };
            }

            AuthStore.set(response.data);
            return response;
        } catch (err) {
            Logger.error("Login Error:", err);
            return { success: false, message: "Server tidak dapat dihubungi." };
        } finally {
            AuthHelper.loading(false);
        }
    }

    async function logout() {
        AuthHeartbeat.stop();
        try {
            if (AuthStore.isLogin()) {
                await Api.post("logout", { token: AuthStore.token() });
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
            const response = await Api.post("verifySession", { token: AuthStore.token() });
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

    // BUG 2 FIXED: Fungsi refresh/refreshToken aman dari crash manipulasi token ilegal
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
 * REKOMENDASI 9 & 10: AUTH UI (DUPLICATION GUARD & TOGGLE ICON)
 * ======================================================
 */
const AuthUI = (() => {
    let submitting = false;
    let binded = false;

    function form() { return document.getElementById("loginForm"); }
    function nik() { return document.getElementById("nik"); }
    function password() { return document.getElementById("password"); }
    function button() { return document.getElementById("btnLogin"); }
    function remember() { return document.getElementById("rememberMe"); }
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
        button()?.setAttribute("disabled", "true");

        // BUG 4 FIXED: Pembungkusan try...finally menyeluruh agar state submitting aman jika terjadi throw error
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
            button()?.removeAttribute("disabled");
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
        if (form()) return; 
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
 * REKOMENDASI 11: AUTH HEARTBEAT WITH ACTIVITY REFRESH
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

    return Object.freeze(instance);
})();

/**
 * ======================================================
 * REKOMENDASI 14: BACKWARD COMPATIBILITY FOR OLD SCRIPTS
 * ======================================================
 */
if (!window.Session) {
    window.Session = {
        getUser: () => Auth.user(),
        getToken: () => Auth.token(),
        getRole: () => Auth.role(),
        isLoggedIn: () => Auth.isLogin()
    };
    Logger.info("Legacy window.Session polyfill attached.");
}

Logger.info("Auth Phase 6 Loaded");

/**
 * ======================================================
 * AUTH BOOTSTRAP (REKOMENDASI 12: WINDOW LOAD BIND)
 * ======================================================
 */
const AuthBootstrap = (() => {
    let initialized = false;

    async function init() {
        if (initialized) return;
        initialized = true;

        Logger.info("Initializing Authentication Architecture...");

        AuthGuard.autoRedirect();

        if (AuthGuard.privatePage()) {
            const ok = await AuthGuard.protect();
            if (!ok) return;
            Auth.startHeartbeat();
        }

        if (AuthHelper.isLoginPage()) {
            AuthUI.init();
        }

        Logger.info("Authentication Engine Ready");
    }

    return { init };
})();

window.addEventListener("load", AuthBootstrap.init);
