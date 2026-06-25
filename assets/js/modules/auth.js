async function login(payload = {}) {
    AuthHelper.loading(true, "Signing In...");
    try {
        Logger.info("Login Request", payload);
        const api = getApi();
        if (!api) {
            throw new Error("API not initialized");
        }
        const response = await api.post("login", payload);
        Logger.info("Login Response", response);

        // Debug
        console.log("🔍 [LOGIN] Response:", response);
        console.log("🔍 [LOGIN] Response.data:", response?.data);
        console.log("🔍 [LOGIN] Response.success:", response?.success);

        if (!response || !response.success) {
            console.error("❌ [LOGIN] Login gagal:", response?.message);
            return response || { success: false, message: "Login gagal." };
        }

        // 🔥 KRITIS: Ambil data dari response
        let rawData = response.data || {};
        
        // 🔥 KRITIS: Session data
        const sessionData = {
            token: rawData.token || response.token || "",
            user: rawData.user || response.user || {},
            nik: rawData.nik || response.nik || rawData.user?.nik || "",
            role: rawData.role || response.role || rawData.user?.role || ""
        };

        console.log("✅ [LOGIN] Session data akan disimpan:", sessionData);

        // 🔥 KRITIS: Simpan ke MULTIPLE tempat
        // 1. Simpan ke localStorage langsung
        try {
            localStorage.setItem("BCS_SESSION", JSON.stringify(sessionData));
            localStorage.setItem("token", sessionData.token);
            localStorage.setItem("user", JSON.stringify(sessionData.user));
            if (sessionData.nik) localStorage.setItem("nik", sessionData.nik);
            if (sessionData.role) localStorage.setItem("role", sessionData.role);
            console.log("✅ [LOGIN] localStorage direct save: OK");
        } catch (e) {
            console.error("❌ [LOGIN] localStorage save error:", e);
        }

        // 2. Simpan via Session
        if (window.Session && typeof Session.set === "function") {
            const saved = Session.set(sessionData);
            console.log("✅ [LOGIN] Session.set() result:", saved);
        } else {
            console.error("❌ [LOGIN] Session tidak tersedia!");
        }

        // 3. Simpan via AuthStore
        if (window.AuthStore && typeof AuthStore.set === "function") {
            AuthStore.set(sessionData);
            console.log("✅ [LOGIN] AuthStore.set() done");
        }

        // 🔥 VERIFIKASI: Cek apakah tersimpan
        setTimeout(() => {
            const verify1 = localStorage.getItem("BCS_SESSION");
            const verify2 = localStorage.getItem("token");
            console.log("✅ [LOGIN] Verifikasi BCS_SESSION:", verify1 ? "ADA" : "TIDAK ADA");
            console.log("✅ [LOGIN] Verifikasi token:", verify2 ? "ADA" : "TIDAK ADA");
            
            if (window.Session) {
                console.log("✅ [LOGIN] Session.isLoggedIn():", Session.isLoggedIn());
                console.log("✅ [LOGIN] Session.getToken():", Session.getToken());
            }
        }, 100);

        AuthHelper.toast("Login berhasil", "success");

        // 🔥 KRITIS: Redirect dengan delay untuk memastikan session tersimpan
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Redirect ke halaman yang sesuai
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
        Logger.error("Login Error:", err);
        console.error("❌ [LOGIN] Error:", err);
        return { success: false, message: err.message || "Server tidak dapat dihubungi." };
    } finally {
        AuthHelper.loading(false);
    }
}
