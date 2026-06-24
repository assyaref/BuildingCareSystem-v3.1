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
 * Handles : Remember Me, Auto Login, Session Cache,
 * Login Button State, Password Toggle, Loading State
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
        if (page !== "login.html") return;

        const session = getSession();
        if (!session) return;

        if (!session.token) {
            App.removeSession();
            clearSession();
            return;
        }
        
        App.log("Auto Login Success");
        redirectByRole(session);
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

        remember.checked = true;
        nik.value = saved;
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
    // PASSWORD TOGGLE
    // ==================================================
    function bindPasswordToggle() {
        const password = document.getElementById("password");
        const toggle = document.getElementById("togglePassword");
        if (!password || !toggle) return;

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
    function isLoading() { return loginProcess; }
    function lock() { loginProcess = true; }
    function unlock() { loginProcess = false; }

    // ==================================================
    // BUTTON STATE
    // ==================================================
    function disableButton() {
        const button = document.getElementById("loginButton");
        if (!button) return;
        button.disabled = true;
        button.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Signing In...`;
    }

    function enableButton() {
        const button = document.getElementById("loginButton");
        if (!button) return;
        button.disabled = false;
        button.innerHTML = `<i class="fa-solid fa-right-to-bracket me-2"></i> LOGIN`;
    }

    // ==================================================
    // PAGE HELPER
    // ==================================================
    function currentPage() {
        return window.location.pathname.split("/").pop();
    }

    return {
        init, autoLogin, loadRemember, saveRemember, bindRemember, bindPasswordToggle,
        getSession, setSession, clearSession, refreshSession, isLoading, lock, unlock,
        disableButton, enableButton, currentPage
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

    function get() {
        if (memory) return memory;
        const session = App.getSession();
        if (session) memory = session;
        return session;
    }

    function set(session) {
        memory = session;
        App.setSession(session);
        return session;
    }

    function refresh() {
        memory = App.getSession();
        return memory;
    }

    function clear() {
        memory = null;
        App.removeSession();
    }

    function token() {
        return get()?.token || null;
    }

    function user() {
        return get() || null;
    }

    return { get, set, refresh, clear, token, user };
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
        if (!result?.success) return result;

        // Langsung ambil data dari GAS respons
        const session = result.data;

        AuthStorage.set(session);
        Auth.setSession(session);

        return { success: true, data: session };
    }

    // ================================================
    // VERIFY SESSION
    // ================================================
    async function verifySession() {
        const session = AuthStorage.get();
        if (!session) return false;
        
        if (!session.token) {
            AuthStorage.clear();
            Auth.clearSession();
            return false;
        }

        try {
            const result = await Api.post("verifySession", { token: session.token });
            if (result?.success) return true;
            console.warn("[AUTH] API VERIFY FAILED");
            return true;
        } catch (err) {
            console.warn("[AUTH] LOCAL FALLBACK", err);
            return true;
        }
    }

    // ================================================
    // SESSION GUARD
    // ================================================
    async function guard() {
        const valid = await verifySession();
        if (valid) return true;
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
            if (token) await Api.post("logout", { token });
        } catch (err) {
            console.warn(err);
        } finally {
            AuthStorage.clear();
            Auth.clearSession();
            App.redirect("login.html");
        }
    }

    function currentUser() { return AuthStorage.user(); }
    function currentToken() { return AuthStorage.token(); }
    function isLoggedIn() { return !!currentToken(); }

    return { login, logout, verifySession, guard, currentUser, currentToken, isLoggedIn };
})();

/**
 * =====================================================
 * AUTH GUARD
 * Enterprise v3.3.1
 * =====================================================
 */
const AuthGuard = (() => {
    const PUBLIC_PAGES = ["login.html", "index.html"];
    const PRIVATE_PAGES = [
        "dashboard.html", "report.html", "monitoring.html", "history.html", "setting.html",
        "user-report.html", "user-history.html", "user-profile.html", "workorder.html"
    ];

    function currentPage() {
        return window.location.pathname.split("/").pop().toLowerCase() || "index.html";
    }

    const isPublic = () => PUBLIC_PAGES.includes(currentPage());
    const isPrivate = () => PRIVATE_PAGES.includes(currentPage());
    const isLoginPage = () => currentPage() === "login.html";
    const isDashboardPage = () => currentPage() === "dashboard.html";

    function hasSession() {
        const session = AuthStorage.get();
        return !!session?.token;
    }

    async function check() {
        const page = currentPage();
        App.log("[AUTH]", page);

        if (isLoginPage()) {
            if (hasSession()) {
                App.log("Already Login");
                redirectByRole(AuthStorage.user());
                return false;
            }
            return true;
        }

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

    async function safe() {
        try {
            return await check();
        } catch (err) {
            console.error("[AUTH GUARD]", err);
            return true;
        }
    }

    return { check, safe, hasSession, currentPage, isPublic, isPrivate, isLoginPage, isDashboardPage };
})();

/**
 * =====================================================
 * AUTH HEARTBEAT
 * Enterprise v3.3.1
 * =====================================================
 */
const AuthHeartbeat = (() => {
    let heartbeat = null;
    let running = false;
    let verifying = false;
    const INTERVAL = 5 * 60 * 1000;

    function start() {
        stop();
        running = true;
        App.log("[Heartbeat] Started");
        heartbeat = setInterval(async () => { await verify(); }, INTERVAL);
    }

    function stop() {
        if (!heartbeat) return;
        clearInterval(heartbeat);
        heartbeat = null;
        running = false;
        App.log("[Heartbeat] Stopped");
    }

    async function verify() {
        if (verifying) return true;
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

    function bindFocus() {
        window.addEventListener("focus", async () => { await verify(); });
    }

    function bindUnload() {
        window.addEventListener("beforeunload", () => { stop(); });
    }

    function init() {
        bindVisibility();
        bindFocus();
        bindUnload();
        start();
    }

    return { init, start, stop, verify };
})();

// ======================================================
// ROUTER HELPER (Redirect By Role)
// ======================================================
function redirectByRole(user) {
    if (!user) {
        App.redirect("login.html");
        return;
    }

    // Menampilkan log sebelum proses redirect dieksekusi
    console.log("SESSION :", user);
    console.log("ROLE :", user.role);

    const role = String(user.role || "").trim().toUpperCase();
    App.log("[ROLE]", role);

    switch (role) {
        // REPORTER
        case "USER":
        case "GENERAL AFFAIR":
            App.redirect("user-report.html");
            break;

        // TECHNICIAN
        case "TECHNICIAN":
            App.redirect("workorder.html");
            break;

        // ADMIN
        case "ADMIN":
        case "ADMINISTRATOR":
        case "LEAD BRANCH SUPPORT":
            App.redirect("dashboard.html");
            break;

        // UNKNOWN ROLE
        default:
            App.toast("Role tidak dikenali", "warning");
            App.redirect("login.html");
    }
}

/**
 * =====================================================
 * AUTH BOOTSTRAP
 * Enterprise v3.3.1
 * =====================================================
 */
const AuthModule = (() => {
    let initialized = false;

    function bindLoginForm() {
        const form = document.getElementById("loginForm");
        if (!form) return;

        form.addEventListener("submit", async (event) => {
            event.preventDefault();
            if (Auth.isLoading()) return;

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
                setTimeout(() => { redirectByRole(result.data); }, 400);
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

    function bindLogout() {
        const button = document.getElementById("logoutBtn");
        if (!button) return;

        button.addEventListener("click", async (event) => {
            event.preventDefault();
            const confirmLogout = await App.confirm("Logout", "Keluar dari aplikasi?");
            if (!confirmLogout || !confirmLogout.isConfirmed) return;
            await AuthService.logout();
        });
    }

    async function init() {
        if (initialized) return true;
        initialized = true;

        App.log("=================================");
        App.log("Building Care Enterprise");
        App.log("Authentication Bootstrap");
        App.log("=================================");

        Auth.init();
        const valid = await AuthGuard.safe();
        if (!valid) return false;

        bindLoginForm();
        bindLogout();
        AuthHeartbeat.init();

        App.log("Authentication Ready");
        return true;
    }

    return { init, bindLoginForm, bindLogout };
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
 * Enterprise v3.3.1
 * =====================================================
 */
const EnterpriseAuth = (() => {
    function session() {
        return AuthStorage.get() || Auth.getSession() || App.getSession() || null;
    }

    const token = () => session()?.token || "";
    const user = () => session() || {};
    const isLogin = () => !!token();

    function refresh() {
        AuthStorage.refresh();
        Auth.refreshSession();
        return session();
    }

    function clear() {
        AuthStorage.clear();
        Auth.clearSession();
        App.removeSession();
    }

    function sync() {
        const appSession = App.getSession();
        const authSession = Auth.getSession();

        if (!authSession && appSession) {
            Auth.setSession(appSession);
            AuthStorage.set(appSession);
        }
        return session();
    }

    return { session, token, user, refresh, sync, clear, isLogin };
})();
