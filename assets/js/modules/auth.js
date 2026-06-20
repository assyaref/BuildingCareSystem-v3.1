// ======================================================
// Building Care System Enterprise v3.3.1
// File : assets/js/modules/auth.js
// PART 1 : AUTH UI
// Radiant Group Duri
// ======================================================

"use strict";

/**
 * =====================================================
 * AUTH UI
 *
 * Handles :
 * - Remember Me
 * - Auto Login
 * - Session Cache
 * - Login Button State
 * - Password Toggle
 * - Loading State
 * =====================================================
 */

const Auth = (() => {
    // ==================================================
    // PRIVATE STATE
    // ==================================================
    let loginProcess = false;
    let sessionCache = null;

    // ==================================================
    // INIT
    // ==================================================
    function init() {
        App.log("Authentication UI Loaded");
        loadRemember();
        autoLogin();
        bindRemember();
        bindPasswordToggle();
    }

    // ==================================================
    // SESSION CACHE
    // ==================================================
    function getSession() {
        if (sessionCache) {
            return sessionCache;
        }
        const session = App.getSession();
        if (session) {
            sessionCache = session;
        }
        return session;
    }

    function setSession(data) {
        sessionCache = data;
    }

    function clearSession() {
        sessionCache = null;
    }

    function refreshSession() {
        sessionCache = App.getSession();
        return sessionCache;
    }

    // ==================================================
    // AUTO LOGIN
    // ==================================================
    function autoLogin() {
        const page = currentPage();
        if (page !== "login.html") {
            return;
        }
        const session = getSession();
        if (!session) {
            return;
        }
        if (!session.token) {
            App.removeSession();
            clearSession();
            return;
        }
        App.log("Auto Login Success");
        App.redirect("dashboard.html");
    }

    // ==================================================
    // REMEMBER ME
    // ==================================================
    function loadRemember() {
        const remember = document.getElementById("remember");
        const nik = document.getElementById("nik");

        if (!remember || !nik) {
            return;
        }

        const saved = App.getRemember();
        if (!saved) {
            return;
        }

        remember.checked = true;
        nik.value = saved;
    }

    function saveRemember() {
        const remember = document.getElementById("remember");
        const nik = document.getElementById("nik");

        if (!remember || !nik) {
            return;
        }

        if (remember.checked) {
            App.remember(nik.value.trim());
            return;
        }
        App.clearRemember();
    }

    function bindRemember() {
        const remember = document.getElementById("remember");
        if (!remember) {
            return;
        }
        remember.addEventListener("change", saveRemember);
    }

    // ==================================================
    // PASSWORD TOGGLE
    // ==================================================
    function bindPasswordToggle() {
        const password = document.getElementById("password");
        const toggle = document.getElementById("togglePassword");

        if (!password || !toggle) {
            return;
        }

        toggle.addEventListener("click", () => {
            if (password.type === "password") {
                password.type = "text";
                toggle.classList.remove("bi-eye");
                toggle.classList.add("bi-eye-slash");
            } else {
                password.type = "password";
                toggle.classList.remove("bi-eye-slash");
                toggle.classList.add("bi-eye");
            }
        });
    }

    // ==================================================
    // LOGIN PROCESS LOCK
    // ==================================================
    function isLoading() {
        return loginProcess;
    }

    function lock() {
        loginProcess = true;
    }

    function unlock() {
        loginProcess = false;
    }

    // ==================================================
    // BUTTON STATE
    // ==================================================
    function disableButton() {
        const button = document.getElementById("loginButton");
        if (!button) {
            return;
        }
        button.disabled = true;
        button.innerHTML = `
            <span class="spinner-border spinner-border-sm me-2"></span>
            Signing In...
        `;
    }

    function enableButton() {
        const button = document.getElementById("loginButton");
        if (!button) {
            return;
        }
        button.disabled = false;
        button.innerHTML = `
            <i class="fa-solid fa-right-to-bracket me-2"></i>
            LOGIN
        `;
    }

    // ==================================================
    // PAGE HELPER
    // ==================================================
    function currentPage() {
        return window.location.pathname.split("/").pop();
    }

    // ==================================================
    // PUBLIC API
    // ==================================================
    return {
        init,
        autoLogin,
        loadRemember,
        saveRemember,
        bindRemember,
        bindPasswordToggle,
        getSession,
        setSession,
        clearSession,
        refreshSession,
        isLoading,
        lock,
        unlock,
        disableButton,
        enableButton,
        currentPage
    };
})();

/**
 * =====================================================
 * AUTH STORAGE
 * Enterprise v3.3.1
 * =====================================================
 */
const AuthStorage = (() => {
    let memory = null;

    // ================================================
    // GET SESSION
    // ================================================
    function get() {
        if (memory) {
            return memory;
        }
        const session = App.getSession();
        if (session) {
            memory = session;
        }
        return session;
    }

    // ================================================
    // SET SESSION
    // ================================================
    function set(session) {
        memory = session;
        App.setSession(session);
        return session;
    }

    // ================================================
    // REFRESH SESSION
    // ================================================
    function refresh() {
        memory = App.getSession();
        return memory;
    }

    // ================================================
    // REMOVE SESSION
    // ================================================
    function clear() {
        memory = null;
        App.removeSession();
    }

    // ================================================
    // TOKEN
    // ================================================
    function token() {
        const session = get();
        return session?.token || null;
    }

    // ================================================
    // USER
    // ================================================
    function user() {
        return get() || null;
    }

    return {
        get,
        set,
        refresh,
        clear,
        token,
        user
    };
})();

/**
 * =====================================================
 * AUTH SERVICE
 * Enterprise v3.3.1
 * =====================================================
 */
const AuthService = (() => {
    // ================================================
    // LOGIN
    // ================================================
    async function login(payload) {
        const result = await Api.post("login", payload);
        if (!result?.success) {
            return result;
        }

        const user = result.data || {};
        AuthStorage.set(user);
        Auth.setSession(user);

        return {
            success: true,
            data: user
        };
    }

    // ================================================
    // VERIFY SESSION
    // ================================================
    async function verifySession() {
        const session = AuthStorage.get();
        if (!session) {
            return false;
        }
        if (!session.token) {
            AuthStorage.clear();
            Auth.clearSession();
            return false;
        }

        try {
            const result = await Api.post("verifySession", { token: session.token });
            if (result?.success) {
                return true;
            }
            console.warn("[AUTH] API VERIFY FAILED");
            return true;
        } catch (err) {
            console.warn("[AUTH] LOCAL FALLBACK");
            console.warn(err);
            return true;
        }
    }

    // ================================================
    // SESSION GUARD
    // ================================================
    async function guard() {
        const valid = await verifySession();
        if (valid) {
            return true;
        }
        AuthStorage.clear();
        Auth.clearSession();
        return false;
    }

    // ================================================
    // LOGOUT
    // ================================================
    async function logout() {
        const token = AuthStorage.token();
        try {
            if (token) {
                await Api.post("logout", { token });
            }
        } catch (err) {
            console.warn(err);
        } finally {
            AuthStorage.clear();
            Auth.clearSession();
            App.redirect("login.html");
        }
    }

    // ================================================
    // USER INFO
    // ================================================
    function currentUser() {
        return AuthStorage.user();
    }

    function currentToken() {
        return AuthStorage.token();
    }

    // ================================================
    // STATUS
    // ================================================
    function isLoggedIn() {
        return !!currentToken();
    }

    return {
        login,
        logout,
        verifySession,
        guard,
        currentUser,
        currentToken,
        isLoggedIn
    };
})();

/**
 * =====================================================
 * AUTH GUARD
 * Enterprise v3.3.1
 * Radiant Group Duri
 * =====================================================
 */
const AuthGuard = (() => {
    // ==================================================
    // ROUTE CONFIG
    // ==================================================
    const PUBLIC_PAGES = ["login.html", "index.html"];
    const PRIVATE_PAGES = ["dashboard.html", "report.html", "monitoring.html", "history.html", "setting.html"];

    // ==================================================
    // CURRENT PAGE
    // ==================================================
    function currentPage() {
        const page = window.location.pathname.split("/").pop().toLowerCase();
        return page || "index.html";
    }

    // ==================================================
    // PUBLIC PAGE
    // ==================================================
    function isPublic() {
        return PUBLIC_PAGES.includes(currentPage());
    }

    // ==================================================
    // PRIVATE PAGE
    // ==================================================
    function isPrivate() {
        return PRIVATE_PAGES.includes(currentPage());
    }

    // ==================================================
    // LOGIN PAGE
    // ==================================================
    function isLoginPage() {
        return currentPage() === "login.html";
    }

    // ==================================================
    // DASHBOARD PAGE
    // ==================================================
    function isDashboardPage() {
        return currentPage() === "dashboard.html";
    }

    // ==================================================
    // CHECK SESSION
    // ==================================================
    function hasSession() {
        const session = AuthStorage.get();
        if (!session) {
            return false;
        }
        return !!session.token;
    }

    // ==================================================
    // PAGE GUARD
    // ==================================================
    async function check() {
        const page = currentPage();
        App.log("[AUTH]", page);

        // --------------------------
        // LOGIN PAGE
        // --------------------------
        if (isLoginPage()) {
            if (hasSession()) {
                App.log("Already Login");
                App.redirect("dashboard.html");
                return false;
            }
            return true;
        }

        // --------------------------
        // PRIVATE PAGE
        // --------------------------
        if (isPrivate()) {
            if (!hasSession()) {
                App.log("No Session");
                App.redirect("login.html");
                return false;
            }

            const valid = await AuthService.verifySession();
            if (!valid) {
                AuthStorage.clear();
                Auth.clearSession();
                App.redirect("login.html");
                return false;
            }
            return true;
        }

        return true;
    }

    // ==================================================
    // SAFE CHECK
    // ==================================================
    async function safe() {
        try {
            return await check();
        } catch (err) {
            console.error("[AUTH GUARD]", err);
            return true;
        }
    }

    // ==================================================
    // PUBLIC API
    // ==================================================
    return {
        check,
        safe,
        hasSession,
        currentPage,
        isPublic,
        isPrivate,
        isLoginPage,
        isDashboardPage
    };
})();

/**
 * =====================================================
 * AUTH HEARTBEAT
 * Enterprise v3.3.1
 * Radiant Group Duri
 * =====================================================
 */
const AuthHeartbeat = (() => {
    // ==================================================
    // PRIVATE STATE
    // ==================================================
    let heartbeat = null;
    let running = false;
    let verifying = false;
    const INTERVAL = 5 * 60 * 1000;

    // ==================================================
    // START
    // ==================================================
    function start() {
        if (running) {
            return;
        }
        running = true;
        App.log("[Heartbeat] Started");
        stop();
        heartbeat = setInterval(async () => {
            await verify();
        }, INTERVAL);
    }

    // ==================================================
    // STOP
    // ==================================================
    function stop() {
        if (!heartbeat) {
            return;
        }
        clearInterval(heartbeat);
        heartbeat = null;
        running = false;
        App.log("[Heartbeat] Stopped");
    }

    // ==================================================
    // VERIFY
    // ==================================================
    async function verify() {
        if (verifying) {
            return true;
        }
        verifying = true;

        try {
            const session = AuthStorage.get();
            if (!session || !session.token) {
                AuthStorage.clear();
                Auth.clearSession();
                verifying = false;
                return false;
            }

            const valid = await AuthService.verifySession();
            if (!valid) {
                App.toast("Session telah berakhir.", "warning");
                await AuthService.logout();
                verifying = false;
                return false;
            }
            return true;
        } catch (err) {
            console.warn("[Heartbeat]", err);
            return true;
        } finally {
            verifying = false;
        }
    }

    // ==================================================
    // VISIBILITY API
    // ==================================================
    function bindVisibility() {
        document.addEventListener("visibilitychange", async () => {
            if (document.hidden) {
                App.log("[Heartbeat] Pause");
                stop();
                return;
            }
            App.log("[Heartbeat] Resume");
            await verify();
            start();
        });
    }

    // ==================================================
    // WINDOW FOCUS
    // ==================================================
    function bindFocus() {
        window.addEventListener("focus", async () => {
            await verify();
        });
    }

    // ==================================================
    // BEFORE UNLOAD
    // ==================================================
    function bindUnload() {
        window.addEventListener("beforeunload", () => {
            stop();
        });
    }

    // ==================================================
    // INITIALIZE
    // ==================================================
    function init() {
        bindVisibility();
        bindFocus();
        bindUnload();
        start();
    }

    // ==================================================
    // PUBLIC API
    // ==================================================
    return {
        init,
        start,
        stop,
        verify
    };
})();

/**
 * =====================================================
 * AUTH BOOTSTRAP
 * Enterprise v3.3.1
 * Radiant Group Duri
 * =====================================================
 */
const AuthModule = (() => {
    // ==================================================
    // PRIVATE STATE
    // ==================================================
    let initialized = false;

    // ==================================================
    // LOGIN FORM
    // ==================================================
    function bindLoginForm() {
        const form = document.getElementById("loginForm");
        if (!form) {
            return;
        }

        form.addEventListener("submit", async (event) => {
            event.preventDefault();
            if (Auth.isLoading()) {
                return;
            }

            const nik = document.getElementById("nik")?.value?.trim();
            const password = document.getElementById("password")?.value;

            if (!nik || !password) {
                App.toast("NIK dan Password wajib diisi.", "warning");
                return;
            }

            try {
                Auth.lock();
                Auth.disableButton();
                App.showLoading();

                const result = await AuthService.login({ nik, password });
                if (!result.success) {
                    App.toast(result.message || "Login gagal.", "error");
                    return;
                }

                Auth.saveRemember();
                App.toast("Login berhasil.", "success");

                setTimeout(() => {
                    App.redirect("dashboard.html");
                }, 400);
            } catch (err) {
                console.error(err);
                App.handleError(err);
            } finally {
                Auth.unlock();
                Auth.enableButton();
                App.hideLoading();
            }
        });
    }

    // ==================================================
    // LOGOUT
    // ==================================================
    function bindLogout() {
        const button = document.getElementById("logoutBtn");
        if (!button) {
            return;
        }

        button.addEventListener("click", async (event) => {
            event.preventDefault();
            const confirmLogout = await App.confirm("Logout", "Keluar dari aplikasi?");
            if (!confirmLogout || !confirmLogout.isConfirmed) {
                return;
            }
            await AuthService.logout();
        });
    }

    // ==================================================
    // INITIALIZE
    // ==================================================
    async function init() {
        if (initialized) {
            return true;
        }
        initialized = true;

        App.log("=================================");
        App.log("Building Care Enterprise");
        App.log("Authentication Bootstrap");
        App.log("=================================");

        Auth.init();
        const valid = await AuthGuard.safe();
        if (!valid) {
            return false;
        }

        bindLoginForm();
        bindLogout();
        AuthHeartbeat.init();

        App.log("Authentication Ready");
        return true;
    }

    // ==================================================
    // PUBLIC
    // ==================================================
    return {
        init,
        bindLoginForm,
        bindLogout
    };
})();

/**
 * =====================================================
 * APPLICATION START
 * =====================================================
 */
(() => {
    async function bootstrap() {
        try {
            await AuthModule.init();
        } catch (err) {
            console.error("[BOOTSTRAP]", err);
            App.handleError(err);
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", bootstrap);
    } else {
        bootstrap();
    }
})();

/**
 * =====================================================
 * ENTERPRISE COMPATIBILITY LAYER
 * Building Care System Enterprise v3.3.1
 * =====================================================
 */
const EnterpriseAuth = (() => {
    /**
     * Singleton Session
     */
    function session() {
        return (
            AuthStorage.get() ||
            Auth.getSession() ||
            App.getSession() ||
            null
        );
    }

    /**
     * Token
     */
    function token() {
        return session()?.token || "";
    }

    /**
     * User
     */
    function user() {
        return session() || {};
    }

    /**
     * Is Login
     */
    function isLogin() {
        return !!token();
    }

    /**
     * Refresh Session
     */
    function refresh() {
        AuthStorage.refresh();
        Auth.refreshSession();
        return session();
    }

    /**
     * Clear
     */
    function clear() {
        AuthStorage.clear();
        Auth.clearSession();
        App.removeSession();
    }

    /**
     * Sync Session
     */
    function sync() {
        const appSession = App.getSession();
        const authSession = Auth.getSession();

        if (!authSession && appSession) {
            Auth.setSession(appSession);
            AuthStorage.set(appSession);
        }
        return session();
    }

    return {
        session,
        token,
        user,
        refresh,
        sync,
        clear,
        isLogin
    };
})();
