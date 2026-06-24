// ======================================================
// Building Care System Enterprise v3.3.2 Enterprise Stable
// File : assets/js/modules/auth.js
// Radiant Group Duri
// ======================================================

"use strict";

// ======================================================
// STORE
// ======================================================
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

    return { get, set, clear, token, user };
})();

// ======================================================
// ROLE ROUTE
// ======================================================
const ROLE_ROUTE = {
    USER: "user-report.html",
    "GENERAL AFFAIR": "user-report.html",
    TECHNICIAN: "workorder.html",
    ADMIN: "dashboard.html",
    ADMINISTRATOR: "dashboard.html",
    "LEAD BRANCH SUPPORT": "dashboard.html"
};

// ======================================================
// ROUTER
// ======================================================
const AuthRouter = (() => {
    function byRole() {
        const user = AuthStore.user();
        const role = String(user.role || "").trim().toUpperCase();
        App.log("[ROLE]", role);

        const page = ROLE_ROUTE[role];
        if (!page) {
            App.toast("Role tidak dikenali", "warning");
            AuthStore.clear();
            location.replace("login.html");
            return;
        }

        location.replace(page);
    }

    return { byRole };
})();

// ======================================================
// API
// ======================================================
const AuthApi = (() => {
    async function login(payload) {
        App.loading(true);
        try {
            const res = await Api.post("login", payload);
            if (res.success) {
                AuthStore.set(res.data);
            }
            return res;
        } finally {
            App.loading(false);
        }
    }

    async function logout() {
        try {
            await Api.post("logout", { token: AuthStore.token() });
        } catch (err) {
            console.warn(err);
        }

        AuthStore.clear();
        location.replace("login.html");
    }

    async function verify() {
        try {
            const res = await Api.post("verifySession", { token: AuthStore.token() });
            return res.success;
        } catch (err) {
            return true;
        }
    }

    return { login, logout, verify };
})();

// ======================================================
// GUARD
// ======================================================
const AuthGuard = (() => {
    async function check() {
        const page = location.pathname.split("/").pop();
        const hasToken = AuthStore.token();

        // login page
        if (page === "login.html") {
            if (hasToken) {
                AuthRouter.byRole();
                return false;
            }
            return true;
        }

        // other page
        if (!hasToken) {
            location.replace("login.html");
            return false;
        }

        return true;
    }

    return { check };
})();

// ======================================================
// HEARTBEAT
// ======================================================
const AuthHeartbeat = (() => {
    let timer = null;

    function start() {
        stop();
        timer = setInterval(verify, 300000);
    }

    function stop() {
        clearInterval(timer);
    }

    async function verify() {
        const valid = await AuthApi.verify();
        if (!valid) {
            App.toast("Session expired", "warning");
            AuthApi.logout();
        }
    }

    return { start, stop };
})();

// ======================================================
// LOGIN FORM
// ======================================================
function bindLoginForm() {
    const form = document.getElementById("loginForm");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const nik = document.getElementById("nik").value.trim();
        const password = document.getElementById("password").value.trim();

        if (!nik || !password) {
            App.toast("NIK dan Password wajib diisi", "warning");
            return;
        }

        const res = await AuthApi.login({ nik, password });
        if (!res.success) {
            App.toast(res.message, "danger");
            return;
        }

        App.toast("Login berhasil", "success");
        AuthRouter.byRole();
    });
}

// ======================================================
// MODULE
// ======================================================
const AuthModule = (() => {
    async function init() {
        App.log("Authentication Bootstrap");

        const valid = await AuthGuard.check();
        if (!valid) return;

        bindLoginForm();
        AuthHeartbeat.start();

        App.log("Authentication Ready");
    }

    return { init };
})();

// ======================================================
// AUTO START
// ======================================================
document.addEventListener("DOMContentLoaded", () => {
    AuthModule.init();
});
