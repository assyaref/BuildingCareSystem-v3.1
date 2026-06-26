// auth.js - Building Care System v7.1
// Fully compatible with api.js (Google Script integration)

(function() {
    "use strict";

    if (typeof BCS === "undefined") {
        console.error("❌ BCS framework not loaded!");
        return;
    }

    /**
     * Login function
     * @param {Object} payload - { username, password } or { nik, password }
     * @returns {Promise<Object>} response from API
     */
    async function login(payload = {}) {
        // Tampilkan loading (opsional – api.js juga punya overlay sendiri)
        BCS.App.Loading.show();

        try {
            BCS.Logger.info("Login Request", payload);

            // Pastikan BCS.Api tersedia
            if (!BCS.Api || typeof BCS.Api.post !== 'function') {
                throw new Error("API client not available");
            }

            // Panggil endpoint "login" via BCS.Api
            const response = await BCS.Api.post("login", payload);
            BCS.Logger.info("Login Response", response);

            // Debug
            console.log("🔍 [LOGIN] Response:", response);
            console.log("🔍 [LOGIN] Response.data:", response?.data);
            console.log("🔍 [LOGIN] Response.success:", response?.success);

            // Cek sukses
            if (!response || !response.success) {
                console.error("❌ [LOGIN] Login gagal:", response?.message);
                BCS.App.Toast.danger(response?.message || "Login gagal.");
                return response || { success: false, message: "Login gagal." };
            }

            // Ekstrak data session (support berbagai struktur response)
            const rawData = response.data || {};
            const sessionData = {
                token: rawData.token || response.token || "",
                user: rawData.user || response.user || {},
                nik: rawData.nik || response.nik || rawData.user?.nik || "",
                role: rawData.role || response.role || rawData.user?.role || ""
            };

            console.log("✅ [LOGIN] Session data akan disimpan:", sessionData);

            // Simpan session menggunakan BCS.Storage (satu baris!)
            const saved = BCS.Storage.setSession(sessionData);
            console.log("✅ [LOGIN] BCS.Storage.setSession() result:", saved);

            // Verifikasi (opsional)
            setTimeout(() => {
                const session = BCS.Storage.getSession();
                console.log("✅ [LOGIN] Verifikasi session:", session ? "ADA" : "TIDAK ADA");
                console.log("✅ [LOGIN] BCS.Session?.isLoggedIn?.():", BCS.Session?.isLoggedIn?.());
                console.log("✅ [LOGIN] BCS.Session?.getToken?.():", BCS.Session?.getToken?.());
            }, 100);

            // Notifikasi sukses
            BCS.App.Toast.success("Login berhasil");

            // Tunggu sebentar agar session benar-benar tersimpan
            await new Promise(resolve => setTimeout(resolve, 300));

            // Redirect berdasarkan role
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

    /**
     * Logout – hapus session dan redirect
     */
    function logout(redirectTo = "index.html") {
        BCS.Logger.info("Logout");
        BCS.Storage.clearSession();
        BCS.App.Toast.info("Anda telah keluar");
        if (redirectTo) {
            window.location.replace(redirectTo);
        }
    }

    /**
     * Cek status login
     */
    function isLoggedIn() {
        return BCS.Session?.isLoggedIn?.() || false;
    }

    /**
     * Ambil session saat ini
     */
    function getSession() {
        return BCS.Storage.getSession();
    }

    // Ekspos ke global
    window.auth = {
        login,
        logout,
        isLoggedIn,
        getSession
    };

    // Kompatibilitas dengan panggilan `login()` langsung
    window.login = login;

    console.log("✅ auth.js v7.1 loaded (compatible with api.js)");
})();
