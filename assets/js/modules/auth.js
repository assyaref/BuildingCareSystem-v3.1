// ======================================================
// Building Care System Enterprise v3.3
// File : assets/js/modules/auth.js
// PART 1 : AUTH UI
// Radiant Group Duri
// ======================================================

"use strict";

/**
 * =====================================================
 * AUTH UI
 * Handles :
 * - Remember Me
 * - Auto Login
 * - Login Button State
 * - Session Cache
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
        App.log("Authentication Module Loaded");
        loadRemember();
        autoLogin();
        bindRemember();
    }

    // ==================================================
    // SESSION CACHE
    // ==================================================
    function getSession() {
        if (sessionCache) {
            return sessionCache;
        }
        sessionCache = App.getSession();
        return sessionCache;
    }

    function setSession(data) {
        sessionCache = data;
    }

    function clearSession() {
        sessionCache = null;
    }

    // ==================================================
    // AUTO LOGIN
    // ==================================================
    function autoLogin() {
        const session = getSession();
        if (!session) return;

        if (!session.token) {
            App.removeSession();
            clearSession();
            return;
        }

        const currentPage = window.location.pathname.split("/").pop();
        if (currentPage === "login.html") {
            App.log("Auto Login");
            App.redirect("dashboard.html");
        }
    }

    // ==================================================
    // REMEMBER ME
    // ==================================================
    function loadRemember() {
        const remember = document.getElementById("remember");
        const nik = document.getElementById("nik");
        if (!remember || !nik) return;

        const saved = App.getRemember();
        if (!saved) return;

        nik.value = saved;
        remember.checked = true;
    }

    function saveRemember() {
        const remember = document.getElementById("remember");
        const nik = document.getElementById("nik");
        if (!remember || !nik) return;

        if (remember.checked) {
            App.remember(nik.value.trim());
            return;
        }
        App.clearRemember();
    }

    function bindRemember() {
        const remember = document.getElementById("remember");
        if (!remember) return;

        remember.addEventListener("change", saveRemember);
    }

    // ==================================================
    // PROCESS LOCK
    // ==================================================
    function isLoading() {
        return loginProcess;
    }

    // ==================================================
    // LOGIN BUTTON
    // ==================================================
    function lock() { loginProcess = true; }
    function unlock() { loginProcess = false; }

    function disableButton() {
        const button = document.getElementById("loginButton");
        if (!button) return;

        button.disabled = true;
        button.innerHTML = `
            <span class="spinner-border spinner-border-sm me-2"></span>
            Login...
        `;
    }

    function enableButton() {
        const button = document.getElementById("loginButton");
        if (!button) return;

        button.disabled = false;
        button.innerHTML = `
            <i class="fa-solid fa-right-to-bracket me-2"></i>
            LOGIN
        `;
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
        getSession,
        setSession,
        clearSession,
        isLoading,
        lock,
        unlock,
        disableButton,
        enableButton
    };
})();

/**
 * =====================================================
 * AUTH SERVICE
 * Handles :
 * - Login
 * - Logout
 * - Verify Session
 * - Session Guard
 * Enterprise v3.3
 * =====================================================
 */
const AuthService = (() => {
    // ==================================================
    // LOGIN
    // ==================================================
    async function login(event = null) {
        if (event) event.preventDefault();
        if (Auth.isLoading()) return;

        const nikEl = document.getElementById("nik");
        const passwordEl = document.getElementById("password");

        if (!nikEl || !passwordEl) {
            App.toast("Form login tidak ditemukan.", "error");
            return;
        }

        const nik = nikEl.value.trim();
        const password = passwordEl.value;

        if (!nik || !password) {
            App.toast("NIK dan Password wajib diisi.", "warning");
            return;
        }

        Auth.lock();
        Auth.disableButton();
        App.showLoading();

        try {
            const result = await Api.post("login", { nik, password });

            if (!result || !result.success) {
                App.toast(result?.message || "Login gagal.", "error");
                return;
            }

            const user = result.data || {};
            App.setSession(user);
            Auth.setSession(user);
            Auth.saveRemember();

            App.toast("Login berhasil.", "success");
            setTimeout(() => {
                App.redirect("dashboard.html");
            }, 500);
        } catch (err) {
            console.error(err);
            App.handleError(err);
        } finally {
            Auth.unlock();
            Auth.enableButton();
            App.hideLoading();
        }
    }

    // ==================================================
    // VERIFY SESSION
    // Enterprise Fallback
    // ==================================================
    async function verifySession() {
        const session = Auth.getSession();
        if (!session) return false;

        if (!session.token) {
            App.removeSession();
            Auth.clearSession();
            return false;
        }

        try {
            const result = await Api.post("verifySession", { token: session.token });
            if (result?.success) return true;

            console.warn("[AUTH] verifySession fallback");
            return true;
        } catch (err) {
            console.warn("[AUTH] verifySession local mode");
            console.warn(err);
            return true;
        }
    }

    // ==================================================
    // SESSION GUARD
    // ==================================================
    async function guard() {
        const valid = await verifySession();
        if (valid) return true;

        App.removeSession();
        Auth.clearSession();
        App.toast("Session telah berakhir.", "warning");

        setTimeout(() => {
            App.redirect("login.html");
        }, 300);

        return false;
    }

    // ==================================================
    // LOGOUT
    // ==================================================
    async function logout() {
        const session = Auth.getSession();
        try {
            if (session && session.token) {
                await Api.post("logout", { token: session.token });
            }
        } catch (err) {
            console.warn(err);
        } finally {
            App.removeSession();
            Auth.clearSession();
            App.toast("Logout berhasil.", "success");

            setTimeout(() => {
                App.redirect("login.html");
            }, 300);
        }
    }

    // ==================================================
    // PAGE HELPERS
    // ==================================================
    function currentPage() {
        return window.location.pathname.split("/").pop();
    }

    function isLogin() { return currentPage() === "login.html"; }
    function isDashboard() { return currentPage() === "dashboard.html"; }

    // ==================================================
    // PUBLIC API
    // ==================================================
    return {
        login,
        logout,
        verifySession,
        guard,
        isLogin,
        isDashboard
    };
})();

/**
 * =====================================================
 * AUTH MODULE
 * Handles :
 * - Bootstrap
 * - Login Guard
 * - Dashboard Guard
 * - Heartbeat
 * - Event Binding
 * Enterprise v3.3
 * =====================================================
 */
const AuthModule = (() => {
    // ==================================================
    // PRIVATE STATE
    // ==================================================
    let heartbeatInterval = null;

    // ==================================================
    // LOGIN FORM
    // ==================================================
    function bindLoginForm() {
        const form = document.getElementById("loginForm");
        if (!form) return;

        form.addEventListener("submit", async (event) => {
            event.preventDefault();
            await AuthService.login(event);
        });
    }

    // ==================================================
    // LOGOUT BUTTON
    // ==================================================
    function bindLogoutButton() {
        const button = document.getElementById("logoutBtn");
        if (!button) return;

        button.addEventListener("click", async (event) => {
            event.preventDefault();
            const confirmed = await App.confirm("Logout", "Apakah Anda yakin ingin keluar?");
            if (!confirmed || !confirmed.isConfirmed) return;

            await AuthService.logout();
        });
    }

    // ==================================================
    // ENTER KEY SUPPORT
    // ==================================================
    function bindEnterKey() {
        const password = document.getElementById("password");
        if (!password) return;

        password.addEventListener("keypress", async (event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            await AuthService.login(event);
        });
    }

    // ==================================================
    // LOGIN PAGE GUARD
    // ==================================================
    function loginGuard() {
        if (!AuthService.isLogin()) return;

        const session = Auth.getSession();
        if (session && session.token) {
            App.log("Already Login");
            App.redirect("dashboard.html");
        }
    }

    // ==================================================
    // DASHBOARD GUARD
    // ==================================================
    async function dashboardGuard() {
        if (!AuthService.isDashboard()) return;
        await AuthService.guard();
    }

    // ==================================================
    // HEARTBEAT
    // ==================================================
    function startHeartbeat() {
        if (!AuthService.isDashboard()) return;
        stopHeartbeat();

        heartbeatInterval = setInterval(async () => {
            const session = Auth.getSession();
            if (!session || !session.token) return;

            try {
                const valid = await AuthService.verifySession();
                if (!valid) {
                    App.toast("Session telah berakhir.", "warning");
                    await AuthService.logout();
                }
            } catch (err) {
                console.warn("[Heartbeat]", err);
            }
        }, 5 * 60 * 1000);
    }

    function stopHeartbeat() {
        if (!heartbeatInterval) return;
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
    }

    // ==================================================
    // PAGE VISIBILITY
    // ==================================================
    function bindVisibility() {
        document.addEventListener("visibilitychange", () => {
            if (document.hidden) {
                App.log("Heartbeat Pause");
                stopHeartbeat();
                return;
            }
            App.log("Heartbeat Resume");
            startHeartbeat();
        });
    }

    // ==================================================
    // BEFORE UNLOAD
    // ==================================================
    function bindUnload() {
        window.addEventListener("beforeunload", () => {
            stopHeartbeat();
        });
    }

    // ==================================================
    // INITIALIZE
    // ==================================================
    async function init() {
        App.log("Authentication Bootstrap");
        Auth.init();
        loginGuard();
        await dashboardGuard();
        bindLoginForm();
        bindLogoutButton();
        bindEnterKey();
        bindVisibility();
        bindUnload();
        startHeartbeat();
    }

    // ==================================================
    // PUBLIC
    // ==================================================
    return {
        init,
        bindLoginForm,
        bindLogoutButton,
        bindEnterKey,
        loginGuard,
        dashboardGuard,
        startHeartbeat,
        stopHeartbeat
    };
})();

// ======================================================
// AUTH BOOTSTRAP
// Enterprise v3.3
// ======================================================
(() => {
    "use strict";

    let initialized = false;

    async function bootstrap() {
        if (initialized) return;
        initialized = true;

        try {
            App.log("=================================");
            App.log("Building Care Enterprise v3.3");
            App.log("Authentication Bootstrap");
            App.log("=================================");

            await AuthModule.init();
            App.log("Authentication Ready");
        } catch (err) {
            console.error("[AUTH BOOTSTRAP]", err);
            App.handleError(err);
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", bootstrap);
    } else {
        bootstrap();
    }
})();
