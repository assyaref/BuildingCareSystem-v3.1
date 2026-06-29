// auth.js - Building Care System v7.3 (fixed logout with server sync)

(function() {
    "use strict";

    if (typeof BCS === "undefined") {
        console.error("❌ BCS framework not loaded!");
        // Fallback: buat BCS sementara
        if (!window.BCS) window.BCS = {};
        if (!BCS.Storage) BCS.Storage = {
            getSession: function() { return null; },
            removeSession: function() { localStorage.removeItem('BCS_SESSION'); },
            setSession: function() {}
        };
        if (!BCS.App) BCS.App = { Toast: { info: function() {}, success: function() {}, danger: function() {}, warning: function() {} } };
        if (!BCS.Logger) BCS.Logger = { info: console.log, error: console.error, warn: console.warn };
    }

    async function login(nikOrPayload, password) {
        let payload = {};
        if (typeof nikOrPayload === 'string') {
            payload.nik = nikOrPayload;
            payload.password = password || '';
        } else if (typeof nikOrPayload === 'object' && nikOrPayload !== null) {
            payload = { ...nikOrPayload };
        } else {
            payload = { nik: '', password: '' };
        }
        payload.nik = String(payload.nik || '');
        payload.password = String(payload.password || '');

        if (!payload.nik || !payload.password) {
            BCS.App.Toast.danger("NIK dan Password wajib diisi.");
            return { success: false, message: "NIK dan Password wajib diisi." };
        }

        BCS.App.Loading.show();

        try {
            BCS.Logger.info("Login Request", payload);
            if (!BCS.Api || typeof BCS.Api.post !== 'function') {
                throw new Error("API client not available");
            }
            const response = await BCS.Api.post("login", payload);
            BCS.Logger.info("Login Response", response);

            if (!response || !response.success) {
                BCS.App.Toast.danger(response?.message || "Login gagal.");
                return response || { success: false, message: "Login gagal." };
            }

            const rawData = response.data || {};
            const sessionData = {
                token: rawData.token || response.token || "",
                user: rawData.user || response.user || {},
                nik: rawData.nik || response.nik || rawData.user?.nik || payload.nik || "",
                role: rawData.role || response.role || rawData.user?.role || ""
            };

            BCS.Storage.setSession(sessionData);
            BCS.App.Toast.success("Login berhasil");

            await new Promise(resolve => setTimeout(resolve, 300));

            const role = sessionData.role || sessionData.user?.role || "USER";
            const routeMap = {
                "USER": "user-report.html",
                "GENERAL AFFAIR": "user-report.html",
                "TECHNICIAN": "workorder.html",
                "ADMIN": "dashboard.html",
                "ADMINISTRATOR": "dashboard.html"
            };
            const targetPage = routeMap[role.toUpperCase()] || "user-report.html";
            window.location.replace(targetPage);
            return response;

        } catch (err) {
            BCS.Logger.error("Login Error:", err);
            BCS.App.Toast.danger(err.message || "Server tidak dapat dihubungi.");
            return { success: false, message: err.message || "Server tidak dapat dihubungi." };
        } finally {
            BCS.App.Loading.hide();
        }
    }

    // =============================================
    // LOGOUT - Sync with server before clearing
    // =============================================
    async function logout(redirectTo = "login.html") {
        BCS.Logger.info("Logout");

        let token = '';
        try {
            const session = BCS.Storage.getSession();
            if (session && session.token) {
                token = session.token;
            }
        } catch (e) {}

        // Kirim ke server
        if (token && BCS.Api && typeof BCS.Api.post === 'function') {
            try {
                await BCS.Api.post('logout', { token: token });
                console.log('✅ Logout recorded on server');
            } catch (e) {
                console.warn('⚠️ Server logout failed:', e);
            }
        }

        // Clear local
        try {
            if (BCS.Storage && typeof BCS.Storage.removeSession === 'function') {
                BCS.Storage.removeSession();
            }
            if (window.Session && typeof Session.clear === 'function') {
                Session.clear();
            }
        } catch (e) {}

        const keys = ['BCS_SESSION', 'token', 'user', 'nik', 'role', 'session_timestamp', 'BCS_REMEMBER'];
        keys.forEach(key => {
            try { localStorage.removeItem(key); } catch(e) {}
            try { sessionStorage.removeItem(key); } catch(e) {}
        });

        BCS.App.Toast.info("Anda telah keluar");
        if (redirectTo) {
            window.location.replace(redirectTo);
        }
    }

    function isLoggedIn() {
        return BCS.Session?.isLoggedIn?.() || false;
    }

    function getSession() {
        return BCS.Storage.getSession();
    }

    // =============================================
    // EKSPOS KE GLOBAL DENGAN GUARD
    // =============================================
    window.auth = {
        login: login,
        logout: logout,
        isLoggedIn: isLoggedIn,
        getSession: getSession
    };
    window.login = login;

    // ❗ GUARD: Pastikan window.auth selalu tersedia
    if (!window.auth.logout) {
        window.auth.logout = logout;
    }

    console.log("✅ auth.js v7.3 loaded (with guard)");
})();

// ❗ EXTRA GUARD: Jika window.auth masih undefined (misal error di atas), buat fallback
if (typeof window.auth === 'undefined') {
    window.auth = {
        login: function() { console.warn('auth.js not loaded'); },
        logout: function(redirectTo) {
            console.warn('⚠️ Fallback logout');
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = redirectTo || 'login.html';
        },
        isLoggedIn: function() { return false; },
        getSession: function() { return null; }
    };
    console.warn('⚠️ auth.js loaded with fallback');
}
