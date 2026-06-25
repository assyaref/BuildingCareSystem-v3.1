// ======================================================
// Building Care System Enterprise v3.5 Stable
// File : assets/js/modules/auth.js
// Phase 1 : Header + Helper + AuthStore
// Radiant Group Duri
// ======================================================

"use strict";

/**
 * ======================================================
 * AUTH CONFIG
 * ======================================================
 */
const AUTH_CONFIG = {
    HEARTBEAT_INTERVAL: 5 * 60 * 1000,
    LOGIN_PAGE: "login.html",
    DEFAULT_ROUTE: "dashboard.html",
    STORAGE_KEY: "BCS_SESSION"
};

/**
 * ======================================================
 * AUTH HELPER
 * ======================================================
 */
const AuthHelper = (() => {
    function log(...args) {
        if (window.App && App.log) {
            App.log(...args);
        } else {
            console.log(...args);
        }
    }

    function toast(message, type = "info") {
        if (window.App && App.toast) {
            App.toast(message, type);
        } else {
            console.log(message);
        }
    }

    function loading(show, text = "Loading...") {
        if (window.App && App.loading) {
            App.loading(show, text);
        }
    }

    function redirect(page) {
        location.replace(page);
    }

    function page() {
        return location.pathname.split("/").pop();
    }

    function isLoginPage() {
        return page() === AUTH_CONFIG.LOGIN_PAGE;
    }

    return {
        log,
        toast,
        loading,
        redirect,
        page,
        isLoginPage
    };
})();

/**
 * ======================================================
 * AUTH STORE
 * Single Source of Truth
 * ======================================================
 */
const AuthStore = (() => {
    let cache = null;

    function get() {
        if (cache) return cache;
        cache = App.getSession() || {};
        return cache;
    }

    function set(session) {
        cache = session || {};
        App.setSession(cache);
        return cache;
    }

    function clear() {
        cache = null;
        App.removeSession();
    }

    function token() {
        return get()?.token || "";
    }

    function user() {
        return get()?.user || {};
    }

    function role() {
        return String(user().role || "").trim().toUpperCase();
    }

    function isLogin() {
        return token() !== "";
    }

    function hasRole(...roles) {
        return roles.includes(role());
    }

    function updateUser(data = {}) {
        const session = get();
        session.user = {
            ...session.user,
            ...data
        };
        set(session);
    }

    function updateToken(newToken) {
        const session = get();
        session.token = newToken;
        set(session);
    }

    return {
        get,
        set,
        clear,
        token,
        user,
        role,
        isLogin,
        hasRole,
        updateUser,
        updateToken
    };
})();

AuthHelper.log("Auth Phase 1 Loaded");

/**
 * ======================================================
 * AUTH API
 * Enterprise v3.5 Stable
 * ======================================================
 */
const AuthApi = (() => {
    /**
     * LOGIN
     */
    async function login(payload = {}) {
        AuthHelper.loading(true, "Signing In...");
        try {
            AuthHelper.log("[AUTH]", "Login Request", payload);
            const response = await Api.post("login", payload);
            AuthHelper.log("[AUTH]", response);

            if (!response.success) {
                return response;
            }

            AuthStore.set(response.data);
            return response;
        } catch (err) {
            console.error(err);
            return {
                success: false,
                message: "Server tidak dapat dihubungi."
            };
        } finally {
            AuthHelper.loading(false);
        }
    }

    /**
     * LOGOUT
     */
    async function logout() {
        try {
            await Api.post("logout", {
                token: AuthStore.token()
            });
        } catch (err) {
            console.warn(err);
        }
        AuthStore.clear();
        AuthHelper.redirect(AUTH_CONFIG.LOGIN_PAGE);
    }

    /**
     * VERIFY SESSION
     */
    async function verify() {
        if (!AuthStore.isLogin()) {
            return false;
        }
        try {
            const response = await Api.post("verifySession", {
                token: AuthStore.token()
            });
            return response.success;
        } catch (err) {
            console.warn(err);
            return false;
        }
    }

    /**
     * REFRESH SESSION
     */
    async function refresh() {
        const valid = await verify();
        if (!valid) {
            AuthHelper.toast("Session Expired", "warning");
            await logout();
        }
        return valid;
    }

    /**
     * CHANGE SESSION
     */
    function updateUser(data) {
        AuthStore.updateUser(data);
    }

    /**
     * CHANGE TOKEN
     */
    function updateToken(token) {
        AuthStore.updateToken(token);
    }

    return {
        login,
        logout,
        verify,
        refresh,
        updateUser,
        updateToken
    };
})();

AuthHelper.log("Auth Phase 2 Loaded");

/**
 * ======================================================
 * AUTH ROUTER
 * Enterprise v3.5 Stable
 * ======================================================
 */
const ROLE_ROUTE = {
    USER: "user-report.html",
    "GENERAL AFFAIR": "user-report.html",
    TECHNICIAN: "workorder.html",
    ADMIN: "dashboard.html",
    ADMINISTRATOR: "dashboard.html",
    "LEAD BRANCH SUPPORT": "dashboard.html"
};

const AuthRouter = (() => {
    /**
     * GET ROUTE BY ROLE
     */
    function getRoute(role = "") {
        role = String(role).trim().toUpperCase();
        return ROLE_ROUTE[role] || AUTH_CONFIG.DEFAULT_ROUTE;
    }

    /**
     * REDIRECT CURRENT USER
     */
    function redirect() {
        const role = AuthStore.role();
        const page = getRoute(role);
        AuthHelper.log("[AUTH ROUTER]", role, "=>", page);
        AuthHelper.redirect(page);
    }

    /**
     * REDIRECT BY ROLE
     */
    function byRole(role) {
        AuthHelper.redirect(getRoute(role));
    }

    /**
     * CHECK ROLE
     */
    function is(...roles) {
        return roles.includes(AuthStore.role());
    }

    /**
     * PAGE VALIDATION
     */
    function allow(...roles) {
        if (roles.length === 0) return true;
        return is(...roles);
    }

    /**
     * CURRENT PAGE
     */
    function current() {
        return AuthHelper.page();
    }

    /**
     * ROUTE EXISTS
     */
    function exists(role) {
        role = String(role).trim().toUpperCase();
        return !!ROLE_ROUTE[role];
    }

    /**
     * GET ALL ROUTES
     */
    function routes() {
        return { ...ROLE_ROUTE };
    }

    return {
        redirect,
        byRole,
        getRoute,
        allow,
        is,
        current,
        exists,
        routes
    };
})();

AuthHelper.log("Auth Phase 3 Loaded");

/**
 * ======================================================
 * AUTH GUARD
 * Enterprise v3.5 Stable
 * ======================================================
 */
const AuthGuard = (() => {
    /**
     * CHECK LOGIN SESSION
     */
    function isAuthenticated() {
        return AuthStore.isLogin();
    }

    /**
     * REQUIRE LOGIN
     */
    async function login() {
        if (AuthHelper.isLoginPage()) {
            return true;
        }
        if (!isAuthenticated()) {
            AuthHelper.log("[AUTH GUARD]", "Session Not Found");
            AuthHelper.redirect(AUTH_CONFIG.LOGIN_PAGE);
            return false;
        }
        return true;
    }

    /**
     * REQUIRE ROLE
     */
    function role(...roles) {
        if (roles.length === 0) {
            return true;
        }
        if (AuthRouter.allow(...roles)) {
            return true;
        }
        AuthHelper.toast("Anda tidak memiliki hak akses.", "warning");
        AuthRouter.redirect();
        return false;
    }

    /**
     * VERIFY SESSION
     */
    async function session() {
        if (!isAuthenticated()) {
            return false;
        }
        const valid = await AuthApi.verify();
        if (!valid) {
            AuthHelper.toast("Session Expired", "warning");
            await AuthApi.logout();
            return false;
        }
        return true;
    }

    /**
     * PAGE GUARD
     */
    async function protect(roles = []) {
        const logged = await login();
        if (!logged) {
            return false;
        }
        const valid = await session();
        if (!valid) {
            return false;
        }
        if (roles.length > 0 && !role(...roles)) {
            return false;
        }
        return true;
    }

    /**
     * AUTO REDIRECT
     */
    function autoRedirect() {
        if (AuthHelper.isLoginPage() && AuthStore.isLogin()) {
            AuthRouter.redirect();
        }
    }

    /**
     * PUBLIC PAGE
     */
    function publicPage() {
        return AuthHelper.isLoginPage();
    }

    /**
     * PRIVATE PAGE
     */
    function privatePage() {
        return !publicPage();
    }

    return {
        login,
        role,
        session,
        protect,
        autoRedirect,
        publicPage,
        privatePage,
        isAuthenticated
    };
})();

AuthHelper.log("Auth Phase 4 Loaded");

/**
 * ======================================================
 * AUTH UI
 * Enterprise v3.5 Stable
 * ======================================================
 */
const AuthUI = (() => {
    let submitting = false;

    /**
     * ELEMENT
     */
    function form() { return document.getElementById("loginForm"); }
    function nik() { return document.getElementById("nik"); }
    function password() { return document.getElementById("password"); }
    function button() { return document.getElementById("btnLogin"); }
    function remember() { return document.getElementById("rememberMe"); }
    function togglePassword() { return document.getElementById("togglePassword"); }

    /**
     * VALIDASI
     */
    function validate() {
        if (!nik()?.value.trim()) {
            AuthHelper.toast("NIK wajib diisi", "warning");
            nik().focus();
            return false;
        }
        if (!password()?.value.trim()) {
            AuthHelper.toast("Password wajib diisi", "warning");
            password().focus();
            return false;
        }
        return true;
    }

    /**
     * LOGIN
     */
    async function submit(e) {
        if (e) e.preventDefault();
        if (submitting) return;
        if (!validate()) return;

        submitting = true;
        button()?.setAttribute("disabled", true);

        try {
            const result = await AuthApi.login({
                nik: nik().value.trim(),
                password: password().value.trim()
            });

            if (!result.success) {
                AuthHelper.toast(result.message, "danger");
                return;
            }

            saveRemember();
            AuthHelper.toast("Login berhasil", "success");
            AuthRouter.redirect();
        } finally {
            submitting = false;
            button()?.removeAttribute("disabled");
        }
    }

    /**
     * REMEMBER ME
     */
    function saveRemember() {
        if (!remember()) return;
        if (remember().checked) {
            localStorage.setItem("BCS_REMEMBER", nik().value.trim());
        } else {
            localStorage.removeItem("BCS_REMEMBER");
        }
    }

    function loadRemember() {
        if (!remember()) return;
        const nikSaved = localStorage.getItem("BCS_REMEMBER");
        if (!nikSaved) return;

        nik().value = nikSaved;
        remember().checked = true;
    }

    /**
     * SHOW PASSWORD
     */
    function bindTogglePassword() {
        if (!togglePassword()) return;
        togglePassword().addEventListener("click", () => {
            password().type = password().type === "password" ? "text" : "password";
        });
    }

    /**
     * ENTER KEY
     */
    function bindEnterKey() {
        password()?.addEventListener("keypress", e => {
            if (e.key === "Enter") {
                submit(e);
            }
        });
    }

    /**
     * AUTO FOCUS
     */
    function autoFocus() {
        if (nik()) {
            nik().focus();
        }
    }

    /**
     * BIND FORM
     */
    function bindForm() {
        if (!form()) return;
        form().addEventListener("submit", submit, { once: false });
    }

    /**
     * INIT
     */
    function init() {
        bindForm();
        bindEnterKey();
        bindTogglePassword();
        loadRemember();
        autoFocus();
        AuthHelper.log("Auth UI Ready");
    }

    return {
        init,
        submit,
        validate
    };
})();

AuthHelper.log("Auth Phase 5 Loaded");

/**
 * ======================================================
 * AUTH HEARTBEAT
 * Enterprise v3.5 Stable
 * ======================================================
 */
const AuthHeartbeat = (() => {
    let timer = null;

    function start() {
        stop();
        timer = setInterval(verify, AUTH_CONFIG.HEARTBEAT_INTERVAL);
        AuthHelper.log("Heartbeat Started");
    }

    function stop() {
        if (timer) {
            clearInterval(timer);
            timer = null;
        }
    }

    async function verify() {
        if (!AuthStore.isLogin()) return;
        const valid = await AuthApi.verify();
        if (!valid) {
            AuthHelper.toast("Session Expired", "warning");
            await AuthApi.logout();
        }
    }

    return {
        start,
        stop,
        verify
    };
})();

/**
 * ======================================================
 * AUTH FACADE
 * Enterprise v3.5 Stable
 * ======================================================
 */
const Auth = (() => {
    async function login(payload) { return await AuthApi.login(payload); }
    async function logout() { return await AuthApi.logout(); }
    async function verify() { return await AuthApi.verify(); }
    async function guard(roles = []) { return await AuthGuard.protect(roles); }
    
    function user() { return AuthStore.user(); }
    function token() { return AuthStore.token(); }
    function role() { return AuthStore.role(); }
    function session() { return AuthStore.get(); }
    function isLogin() { return AuthStore.isLogin(); }
    function redirect() { AuthRouter.redirect(); }
    function clear() { AuthStore.clear(); }
    
    function startHeartbeat() { AuthHeartbeat.start(); }
    function stopHeartbeat() { AuthHeartbeat.stop(); }

    return {
        login,
        logout,
        verify,
        guard,
        user,
        token,
        role,
        session,
        isLogin,
        redirect,
        clear,
        startHeartbeat,
        stopHeartbeat
    };
})();

AuthHelper.log("Auth Phase 6 Loaded");

/**
 * ======================================================
 * AUTH BOOTSTRAP
 * Enterprise v3.5 Stable
 * ======================================================
 */
const AuthBootstrap = (() => {
    let initialized = false;

    async function init() {
        if (initialized) return;
        initialized = true;

        AuthHelper.log("Initializing Authentication...");

        // AUTO REDIRECT LOGIN PAGE
        AuthGuard.autoRedirect();

        // PROTECT PRIVATE PAGE
        if (AuthGuard.privatePage()) {
            const ok = await AuthGuard.protect();
            if (!ok) return;
            Auth.startHeartbeat();
        }

        // LOGIN FORM
        if (AuthHelper.isLoginPage()) {
            AuthUI.init();
        }

        AuthHelper.log("Authentication Ready");
    }

    return {
        init
    };
})();
