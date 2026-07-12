// auth.js - Building Care System v7.8 FINAL
// Centralized role-based access control with clean URLs

(function() {
    "use strict";

    if (typeof BCS === "undefined") {
        console.error("❌ BCS framework not loaded!");
        if (!window.BCS) window.BCS = {};
        if (!BCS.Storage) BCS.Storage = {
            getSession: function() { return null; },
            removeSession: function() { localStorage.removeItem('BCS_SESSION'); },
            setSession: function() {}
        };
        if (!BCS.App) BCS.App = { Toast: { info: function() {}, success: function() {}, danger: function() {}, warning: function() {} } };
        if (!BCS.Logger) BCS.Logger = { info: console.log, error: console.error, warn: console.warn };
    }

    // =============================================
    // CHECK ROLE - CENTRALIZED GUARD
    // =============================================
    function checkRole(allowedRoles) {
        try {
            var session = BCS.Storage.getSession();
            if (!session || !session.token) {
                window.location.href = '/login';
                return false;
            }
            var role = (session.role || (session.user && session.user.role) || '').toUpperCase();
            
            if (!allowedRoles.includes(role)) {
                if (allowedRoles.includes('USER') && ['ADMINISTRATOR','SUPER ADMIN','LEAD BRANCH SUPPORT'].includes(role)) {
                    window.location.href = '/dashboard';
                } else {
                    window.location.href = '/login';
                }
                return false;
            }
            return true;
        } catch (e) {
            console.warn('[checkRole] Error:', e);
            window.location.href = '/login';
            return false;
        }
    }

    // =============================================
    // LOGIN - store email explicitly & use targetPage from backend
    // =============================================
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
            const userData = rawData.user || {};
            const email = userData.email || rawData.email || "";

            const sessionData = {
                token: rawData.token || response.token || "",
                user: userData,
                nik: userData.nik || rawData.nik || payload.nik || "",
                role: userData.role || rawData.role || "",
                email: email
            };

            if (email) {
                localStorage.setItem('userEmail', email);
                sessionStorage.setItem('userEmail', email);
            }

            BCS.Storage.setSession(sessionData);
            BCS.App.Toast.success("Login berhasil");

            await new Promise(resolve => setTimeout(resolve, 300));

            // ===========================================
            // 🔥 PRIORITAS: targetPage dari backend
            // ===========================================
            let targetPage = rawData.targetPage; // dari backend
            if (!targetPage) {
                // fallback ke routeMap lengkap
                const routeMap = {
                    "USER": "user-report.html",
                    "GENERAL AFFAIR": "user-report.html",
                    "TECHNICIAN": "workorder.html",
                    "ADMIN": "dashboard.html",
                    "ADMINISTRATOR": "dashboard.html",
                    "SUPER ADMIN": "dashboard.html",
                    "LEAD BRANCH SUPPORT": "dashboard.html"
                };
                const role = sessionData.role || "USER";
                targetPage = routeMap[role.toUpperCase()] || "user-report.html";
            }

            return {
                ...response,
                success: true,
                targetPage: targetPage,
                user: userData,
                session: sessionData
            };

        } catch (err) {
            BCS.Logger.error("Login Error:", err);
            BCS.App.Toast.danger(err.message || "Server tidak dapat dihubungi.");
            return { success: false, message: err.message || "Server tidak dapat dihubungi." };
        } finally {
            BCS.App.Loading.hide();
        }
    }

    // =============================================
    // LOGOUT - ULTRA ROBUST EMAIL CAPTURE
    // =============================================
    async function logout(redirectTo = "/login") {
        BCS.Logger.info("Logout");

        let email = '';

        try {
            const session = BCS.Storage.getSession();
            if (session) {
                email = session.user?.email || session.email || '';
                if (!email && session.user && typeof session.user === 'object') {
                    email = session.user.email || '';
                }
            }
        } catch (e) {}

        if (!email) {
            try {
                const stored = localStorage.getItem('userEmail');
                if (stored) email = stored;
            } catch (e) {}
        }

        if (!email) {
            try {
                const stored = sessionStorage.getItem('userEmail');
                if (stored) email = stored;
            } catch (e) {}
        }

        if (!email) {
            try {
                const userStr = localStorage.getItem('user');
                if (userStr) {
                    const user = JSON.parse(userStr);
                    if (user && user.email) email = user.email;
                }
            } catch (e) {}
        }

        if (!email) {
            try {
                const bcsSession = localStorage.getItem('BCS_SESSION');
                if (bcsSession) {
                    const data = JSON.parse(bcsSession);
                    if (data && data.user && data.user.email) email = data.user.email;
                    else if (data && data.email) email = data.email;
                }
            } catch (e) {}
        }

        console.log('📧 Email captured for logout:', email || '(empty)');

        let token = '';
        try {
            const session = BCS.Storage.getSession();
            if (session) token = session.token || '';
            if (!token) {
                token = localStorage.getItem('token') || '';
            }
        } catch (e) {}

        if (BCS.Api && typeof BCS.Api.post === 'function') {
            try {
                const payload = { token: token };
                if (email) payload.email = email;
                const response = await BCS.Api.post('logout', payload);
                console.log('✅ Logout recorded on server', response);
            } catch (e) {
                console.warn('⚠️ Server logout failed:', e);
            }
        } else {
            console.warn('⚠️ API not available, skipping server logout');
        }

        try {
            if (BCS.Storage && typeof BCS.Storage.removeSession === 'function') {
                BCS.Storage.removeSession();
            }
            if (window.Session && typeof Session.clear === 'function') {
                Session.clear();
            }
        } catch (e) {}

        const keys = ['BCS_SESSION', 'token', 'user', 'nik', 'role', 'session_timestamp', 'BCS_REMEMBER', 'userEmail'];
        keys.forEach(key => {
            try { localStorage.removeItem(key); } catch(e) {}
            try { sessionStorage.removeItem(key); } catch(e) {}
        });

        BCS.App.Toast.info("Anda telah keluar");
        if (redirectTo) {
            if (redirectTo.startsWith('/')) {
                window.location.replace(redirectTo);
            } else {
                window.location.replace('/' + redirectTo);
            }
        }
    }

    function isLoggedIn() {
        return BCS.Session?.isLoggedIn?.() || false;
    }

    function getSession() {
        return BCS.Storage.getSession();
    }

    // Ekspos ke global
    window.auth = {
        login: login,
        logout: logout,
        isLoggedIn: isLoggedIn,
        getSession: getSession,
        checkRole: checkRole
    };
    window.login = login;
    window.checkRole = checkRole;

    console.log("✅ auth.js v7.8 with clean URL routeMap & backend targetPage loaded");
})();

// Fallback
if (typeof window.auth === 'undefined') {
    window.auth = {
        login: function() { console.warn('auth.js not loaded'); },
        logout: function(redirectTo) {
            console.warn('⚠️ Fallback logout');
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = redirectTo || '/login';
        },
        isLoggedIn: function() { return false; },
        getSession: function() { return null; },
        checkRole: function() { return true; }
    };
}
if (typeof window.checkRole === 'undefined') {
    window.checkRole = window.auth.checkRole;
}
