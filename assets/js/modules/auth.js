// auth.js - Framework v7.1 compatible

(function() {
    "use strict";

    // Pastikan BCS dan komponennya tersedia
    if (typeof BCS === "undefined") {
        console.error("❌ BCS framework not loaded!");
        return;
    }

    // --- API client (pastikan getApi() didefinisikan di core/api.js) ---
    // Jika belum ada, kita buat fallback sederhana (gunakan BCS.Api jika ada)
    function getApi() {
        if (typeof BCS !== "undefined" && BCS.Api) {
            return BCS.Api; // asumsikan BCS.Api adalah instance axios
        }
        // fallback: coba ambil dari window.api atau buat sendiri
        if (window.api) return window.api;
        // Jika tidak ada, throw error
        throw new Error("API client not found. Please ensure assets/js/core/api.js is loaded.");
    }

    // --- Fungsi login ---
    async function login(payload = {}) {
        BCS.App.Loading.show(); // tanpa teks

        try {
            BCS.Logger.info("Login Request", payload);

            const api = getApi();
            if (!api) {
                throw new Error("API not initialized");
            }

            const response = await api.post("login", payload);
            BCS.Logger.info("Login Response", response);

            // Debug
            console.log("🔍 [LOGIN] Response:", response);
            console.log("🔍 [LOGIN] Response.data:", response?.data);
            console.log("🔍 [LOGIN] Response.success:", response?.success);

            if (!response || !response.success) {
                console.error("❌ [LOGIN] Login gagal:", response?.message);
                BCS.App.Toast.danger(response?.message || "Login gagal.");
                return response || { success: false, message: "Login gagal." };
            }

            // Ambil data dari response (fleksibel terhadap struktur)
            let rawData = response.data || {};

            // Bangun session data
            const sessionData = {
                token: rawData.token || response.token || "",
                user: rawData.user || response.user || {},
                nik: rawData.nik || response.nik || rawData.user?.nik || "",
                role: rawData.role || response.role || rawData.user?.role || ""
            };

            console.log("✅ [LOGIN] Session data akan disimpan:", sessionData);

            // 🚀 SIMPAN SESSION dengan satu method framework
            const saved = BCS.Storage.setSession(sessionData);
            console.log("✅ [LOGIN] BCS.Storage.setSession() result:", saved);

            // Verifikasi (opsional)
            setTimeout(() => {
                const session = BCS.Storage.getSession();
                console.log("✅ [LOGIN] Verifikasi session:", session ? "ADA" : "TIDAK ADA");
                console.log("✅ [LOGIN] BCS.Session.isLoggedIn():", BCS.Session?.isLoggedIn?.());
                console.log("✅ [LOGIN] BCS.Session.getToken():", BCS.Session?.getToken?.());
            }, 100);

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

    // --- Fungsi logout ---
    function logout(redirectTo = "index.html") {
        BCS.Logger.info("Logout");
        BCS.Storage.clearSession(); // hapus semua session
        BCS.App.Toast.info("Anda telah keluar");
        if (redirectTo) {
            window.location.replace(redirectTo);
        }
    }

    // --- Fungsi cek status login ---
    function isLoggedIn() {
        return BCS.Session?.isLoggedIn?.() || false;
    }

    function getSession() {
        return BCS.Storage.getSession();
    }

    // --- Ekspos ke global (untuk penggunaan di HTML inline) ---
    window.auth = {
        login,
        logout,
        isLoggedIn,
        getSession
    };

    // Jika sebelumnya sudah ada window.login, kita timpa dengan yang baru
    window.login = login; // biar kompatibel dengan panggilan lama

    console.log("✅ auth.js v7.1 loaded");

})();
