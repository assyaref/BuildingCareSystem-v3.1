// ======================================================
// Building Care System Enterprise v3.3.1
// File : assets/js/modules/auth.js
// PART 1 : AUTH UI
// Radiant Group Duri
// ======================================================

"use strict";

const AuthStore = (() => {
    let cache = null;

    function get() {
        if (cache) return cache;
        cache = App.getSession();
        return cache;
    }

    function set(session) {
        cache = session;
        App.setSession(session);
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

    return { get, set, clear, token, user };
})();

const ROLE_ROUTE = {
    USER: "user-report.html",
    "GENERAL AFFAIR": "user-report.html",
    TECHNICIAN: "workorder.html",
    ADMIN: "dashboard.html",
    ADMINISTRATOR: "dashboard.html",
    "LEAD BRANCH SUPPORT": "dashboard.html"
};

const AuthRouter = (() => {
    function byRole() {
        const role = String(AuthStore.user().role || "").trim().toUpperCase();
        App.log("[ROLE]", role);

        const target = ROLE_ROUTE[role];
        if (!target) {
            App.toast("Role tidak dikenali", "warning");
            AuthStore.clear();
            location.replace("login.html");
            return;
        }
        location.replace(target);
    }

    return { byRole };
})();

const AuthApi = (() => {
    async function login(payload) {
        const result = await Api.post("login", payload);
        if (!result.success) return result;

        AuthStore.set(result.data);
        return result;
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
            const result = await Api.post("verifySession", { token: AuthStore.token() });
            return result.success;
        } catch {
            return true;
        }
    }

    return { login, logout, verify };
})();

const AuthGuard = (() => {
    async function check() {
        const page = location.pathname.split("/").pop();

        if (page === "login.html") {
            if (AuthStore.token()) {
                AuthRouter.byRole();
                return false;
            }
            return true;
        }

        if (!AuthStore.token()) {
            location.replace("login.html");
            return false;
        }

        return true;
    }

    return { check };
})();

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

function bindLoginForm() {
    const form = document.getElementById("loginForm");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const nik = document.getElementById("nik").value;
        const password = document.getElementById("password").value;

        const result = await AuthApi.login({ nik, password });
        if (!result.success) {
            App.toast(result.message, "error");
            return;
        }

        AuthRouter.byRole();
    });
}

const AuthModule = (() => {
    async function init() {
        // Catatan: Pastikan object 'Auth' sudah dideklarasikan di file lain 
        // karena tidak ada modul internal 'Auth' di dalam potongan skrip ini.
        if (typeof Auth !== "undefined" && Auth.init) {
            Auth.init();
        }

        const valid = await AuthGuard.check();
        if (!valid) return;

        bindLoginForm();
        AuthHeartbeat.start();

        App.log("Authentication Ready");
    }

    return { init };
})();
