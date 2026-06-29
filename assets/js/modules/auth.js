// auth.js - Building Care System v7.4 (fixed logout with server sync & better logging)

(function() {
    "use strict";

    if (typeof BCS === "undefined") {
        console.error("❌ BCS framework not loaded!");
        return;
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

            console.log("🔍 [LOGIN] Response:", response);
            console.log("🔍 [LOGIN] Response.data:", response?.data);
            console.log("🔍 [LOGIN] Response.success:", response?.success);

            if (!response || !response.success) {
                console.error("❌ [LOGIN] Login gagal:", response?.message);
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

            console.log("✅ [LOGIN] Session data akan disimpan:", sessionData);

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
            console.log(`✅ [LOGIN] Redirecting to: ${targetPage}`);

            window.location.replace(targetPage);
            return response;

        } catch (err) {
            BCS.Logger.error("Login Error:", err);
            console.error("❌ [LOGIN] Error:", err);
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

        // 1. Get token from session before clearing
        let token = '';
        try {
            const session = BCS.Storage.getSession();
            if (session && session.token) {
                token = session.token;
                console.log("📤 Token found:", token.substring(0, 12) + "...");
            } else {
                console.warn("⚠️ No session found, skipping server logout");
            }
        } catch (e) {
            console.warn("Failed to get token:", e);
        }

        // 2. Send logout request to server (if token exists)
        if (token && BCS.Api && typeof BCS.Api.post === 'function') {
            try {
                console.log("📤 Sending logout request to server...");
                const response = await BCS.Api.post('logout', { token: token });
                console.log('📤 Logout response from server:', response);

                if (response && response.success) {
                    console.log('✅ Logout recorded on server');
                } else {
                    console.warn('⚠️ Server logout failed:', response?.message);
                    // Continue with local cleanup anyway
                }
            } catch (e) {
                console.warn('⚠️ Logout API call failed (continuing local cleanup):', e);
                // Continue with local logout anyway
            }
        } else {
            console.warn('⚠️ No token or API available, skipping server logout');
        }

        // 3. Clear local session (always)
        try {
            if (BCS.Storage && typeof BCS.Storage.removeSession === 'function') {
                BCS.Storage.removeSession();
            }
            if (window.Session && typeof Session.clear === 'function') {
                Session.clear();
            }
        } catch (e) {
            console.warn("Logout fallback error:", e);
        }

        // 4. Clear all keys (redundant but safe)
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

    window.auth = { login, logout, isLoggedIn, getSession };
    window.login = login;

    console.log("✅ auth.js v7.4 loaded (fixed logout with server sync)");
})();
