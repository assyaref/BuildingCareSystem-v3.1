// ======================================================
// Building Care System Enterprise
// File : assets/js/core/session.js
// Desc : Session Manager - Compatible with Auth.js
// ======================================================

"use strict";

const SESSION_KEY = "BCS_SESSION";

/**
 * Session Manager - Single source of truth untuk session
 */
const Session = (() => {
    
    /**
     * Ambil session dari storage
     */
    function get() {
        try {
            const data = localStorage.getItem(SESSION_KEY);
            if (!data) {
                // Fallback: coba baca dari key lama
                return getLegacySession();
            }
            const session = JSON.parse(data);
            if (session && session.token) {
                return session;
            }
            return null;
        } catch (e) {
            console.warn("[Session] Gagal membaca session:", e);
            return null;
        }
    }

    /**
     * Fallback untuk kompatibilitas dengan key lama
     */
    function getLegacySession() {
        try {
            const token = localStorage.getItem("token");
            const user = localStorage.getItem("user");
            const nik = localStorage.getItem("nik");
            const role = localStorage.getItem("role");

            if (token) {
                const session = {
                    token: token,
                    user: user ? JSON.parse(user) : {},
                    nik: nik || "",
                    role: role || ""
                };
                // Simpan ke format baru untuk下一次
                localStorage.setItem(SESSION_KEY, JSON.stringify(session));
                return session;
            }
            return null;
        } catch (e) {
            console.warn("[Session] Gagal membaca legacy session:", e);
            return null;
        }
    }

    /**
     * Simpan session
     */
    function set(session) {
        try {
            if (!session || !session.token) {
                console.warn("[Session] Session tidak valid, tidak disimpan");
                return false;
            }
            localStorage.setItem(SESSION_KEY, JSON.stringify(session));
            
            // Simpan juga ke key lama untuk kompatibilitas
            localStorage.setItem("token", session.token);
            localStorage.setItem("user", JSON.stringify(session.user || {}));
            if (session.user?.nik) {
                localStorage.setItem("nik", session.user.nik);
            }
            if (session.user?.role) {
                localStorage.setItem("role", session.user.role);
            }
            
            return true;
        } catch (e) {
            console.error("[Session] Gagal menyimpan session:", e);
            return false;
        }
    }

    /**
     * Hapus session
     */
    function clear() {
        try {
            localStorage.removeItem(SESSION_KEY);
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            localStorage.removeItem("nik");
            localStorage.removeItem("role");
            localStorage.removeItem("BCS_REMEMBER");
            return true;
        } catch (e) {
            console.warn("[Session] Gagal menghapus session:", e);
            return false;
        }
    }

    /**
     * Cek apakah user sudah login
     */
    function isLoggedIn() {
        const session = get();
        return !!(session && session.token && session.token !== "");
    }

    /**
     * Ambil token
     */
    function getToken() {
        const session = get();
        return session?.token || "";
    }

    /**
     * Ambil data user
     */
    function getUser() {
        const session = get();
        return session?.user || {};
    }

    /**
     * Ambil NIK user
     */
    function getNik() {
        const session = get();
        return session?.user?.nik || session?.nik || "";
    }

    /**
     * Ambil role user
     */
    function getRole() {
        const session = get();
        return session?.user?.role || session?.role || "";
    }

    /**
     * Ambil nama user
     */
    function getNama() {
        const session = get();
        return session?.user?.nama || session?.user?.name || "";
    }

    /**
     * Ambil departemen user
     */
    function getDept() {
        const session = get();
        return session?.user?.departemen || session?.user?.department || "";
    }

    return {
        get,
        set,
        clear,
        isLoggedIn,
        getToken,
        getUser,
        getNik,
        getRole,
        getNama,
        getDept
    };
})();

// Export ke global
window.Session = Session;
window.session = Session;

console.log("[Session] ✅ Session Manager loaded");
