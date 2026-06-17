// ======================================================
// Building Care System Enterprise v3.2
// File : assets/js/modules/auth.js
// Radiant Group Duri
// ======================================================

"use strict";

/**
 * =====================================================
 * AUTH — UI STATE
 * Handles: remember me, auto-login redirect, button state
 * =====================================================
 */

const Auth = (() => {

    // ==================================================
    // PRIVATE STATE
    // ==================================================

    let loginProcess = false;

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
    // AUTO LOGIN
    // ==================================================

    function autoLogin() {

        const session = App.getSession();

        if (!session) return;

        if (!session.token) {
            App.removeSession();
            return;
        }

        const currentPage = window.location.pathname.split("/").pop();

        if (currentPage === "login.html") {
            App.log("Auto Login — redirecting to dashboard");
            App.redirect("dashboard.html");
        }

    }

    // ==================================================
    // REMEMBER ME
    // ==================================================

    function loadRemember() {

        const remember = document.getElementById("remember");
        const email    = document.getElementById("email");

        if (!remember || !email) return;

        const saved = App.getRemember();

        if (!saved) return;

        email.value      = saved;
        remember.checked = true;

    }

    function saveRemember() {

        const remember = document.getElementById("remember");
        const email    = document.getElementById("email");

        if (!remember || !email) return;

        if (remember.checked) {
            App.remember(email.value.trim());
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

    function isLoading()  { return loginProcess; }
    function lock()       { loginProcess = true;  }
    function unlock()     { loginProcess = false; }

    // ==================================================
    // BUTTON STATE
    // Note: id="loginButton" — matches login.html
    // ==================================================

    function disableButton() {

        const button = document.getElementById("loginButton");

        if (!button) return;

        button.disabled  = true;
        button.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Login...';

    }

    function enableButton() {

        const button = document.getElementById("loginButton");

        if (!button) return;

        button.disabled  = false;
        button.innerHTML = '<i class="fa-solid fa-right-to-bracket me-2"></i>LOGIN';

    }

    // ==================================================
    // PUBLIC
    // ==================================================

    return {
        init,
        autoLogin,
        loadRemember,
        saveRemember,
        bindRemember,
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
 * Handles: login, logout, session verify, guards
 * =====================================================
 */

const AuthService = (() => {

    // ==================================================
    // LOGIN
    // ==================================================

    async function login(event = null) {

        if (event) event.preventDefault();

        if (Auth.isLoading()) return;

        const emailEl    = document.getElementById("email");
        const passwordEl = document.getElementById("password");

        if (!emailEl || !passwordEl) {
            App.toast("Form login tidak ditemukan.", "error");
            return;
        }

        const email    = emailEl.value.trim().toLowerCase();
        const password = passwordEl.value;

        if (!email || !password) {
            App.toast("Email dan Password wajib diisi.", "warning");
            return;
        }

        Auth.lock();
        Auth.disableButton();
        App.showLoading();

        try {

            const result = await Api.post("login", { email, password });

            if (!result.success) {
                App.toast(result.message || "Login gagal.", "error");
                return;
            }

            const user = result.data || {};

            App.setSession(user);
            Auth.saveRemember();
            App.toast("Login berhasil.", "success");

            setTimeout(() => App.redirect("dashboard.html"), 500);

        } catch (err) {

            App.handleError(err);

        } finally {

            Auth.unlock();
            Auth.enableButton();
            App.hideLoading();

        }

    }

    // ==================================================
    // VERIFY SESSION
    // ==================================================

    async function verifySession() {

        const session = App.getSession();

        if (!session) return false;

        if (!session.token) {
            App.removeSession();
            return false;
        }

        try {

            const result = await Api.post("verifySession", { token: session.token });

            if (!result.success) {
                App.removeSession();
                return false;
            }

            return true;

        } catch (err) {

            App.error(err);
            return false;

        }

    }

    // ==================================================
    // SESSION GUARD
    // ==================================================

    async function guard() {

        const valid = await verifySession();

        if (valid) return true;

        App.toast("Session telah berakhir.", "warning");
        App.removeSession();

        setTimeout(() => App.redirect("login.html"), 300);

        return false;

    }

    // ==================================================
    // LOGOUT
    // ==================================================

    async function logout() {

        const session = App.getSession();

        try {

            if (session && session.token) {
                await Api.post("logout", { token: session.token });
            }

        } catch (err) {

            App.error(err);

        } finally {

            App.removeSession();
            App.toast("Logout berhasil.", "success");

            setTimeout(() => App.redirect("login.html"), 300);

        }

    }

    // ==================================================
    // PAGE HELPERS
    // ==================================================

    function currentPage() {
        return window.location.pathname.split("/").pop();
    }

    function isLogin()     { return currentPage() === "login.html";     }
    function isDashboard() { return currentPage() === "dashboard.html"; }

    // ==================================================
    // PUBLIC
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
 * Handles: event binding, page guards, heartbeat, bootstrap
 * =====================================================
 */

const AuthModule = (() => {

    // ==================================================
    // BIND LOGIN FORM
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
    // BIND LOGOUT BUTTON
    // ==================================================

    function bindLogoutButton() {

        const logoutBtn = document.getElementById("logoutBtn");

        if (!logoutBtn) return;

        logoutBtn.addEventListener("click", async (event) => {

            event.preventDefault();

            const confirmed = await App.confirm(
                "Logout",
                "Apakah Anda yakin ingin keluar?"
            );

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
    // Redirect to dashboard if already logged in
    // ==================================================

    function loginGuard() {

        if (!AuthService.isLogin()) return;

        const session = App.getSession();

        if (session && session.token) {
            App.redirect("dashboard.html");
        }

    }

    // ==================================================
    // DASHBOARD GUARD
    // Redirect to login if session is invalid
    // ==================================================

    async function dashboardGuard() {

        if (!AuthService.isDashboard()) return;

        const valid = await AuthService.verifySession();

        if (!valid) {
            App.removeSession();
            App.redirect("login.html");
        }

    }

    // ==================================================
    // HEARTBEAT — verify session every 5 minutes
    // ==================================================

    function startHeartbeat() {

        if (!AuthService.isDashboard()) return;

        setInterval(async () => {

            const session = App.getSession();

            if (!session || !session.token) return;

            const valid = await AuthService.verifySession();

            if (!valid) {
                App.toast("Session telah berakhir.", "warning");
                setTimeout(() => App.redirect("login.html"), 300);
            }

        }, 5 * 60 * 1000);

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
        startHeartbeat
    };

})();

// ======================================================
// APPLICATION START
// ======================================================

document.addEventListener("DOMContentLoaded", async () => {
    await AuthModule.init();
});
