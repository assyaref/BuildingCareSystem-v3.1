// ======================================================
// Building Care System Enterprise
// File : assets/js/core/session.js
// Desc : Session Manager - Full Compatibility with Auth.js
// Version : 3.0
// ======================================================

"use strict";

const SESSION_KEY = "BCS_SESSION";

/**
 * Session Manager - Single source of truth
 */
const Session = (() => {
    
    /**
     * Ambil session dari storage
     */
    function get() {
        try {
            // Coba baca dari BCS_SESSION dulu
            let data = localStorage.getItem(SESSION_KEY);
            
            if (data) {
                try {
                    const session = JSON.parse(data);
                    if (session && session.token) {
                        // Sync ke key legacy untuk kompatibilitas
                        syncToLegacy(session);
                        return session;
                    }
                } catch (e) {
                    console.warn("[Session] Gagal parse BCS_SESSION:", e);
                }
            }
            
            // Fallback: coba baca dari key lama
            return getLegacySession();
        } catch (e) {
            console.warn("[Session] Gagal membaca session:", e);
            return null;
        }
    }

    /**
     * Sync session ke key legacy
     */
    function syncToLegacy(session) {
        try {
            if (session.token) {
                localStorage.setItem("token", session.token);
            }
            if (session.user) {
                localStorage.setItem("user", JSON.stringify(session.user));
            }
            if (session.nik) {
                localStorage.setItem("nik", session.nik);
            }
            if (session.role) {
                localStorage.setItem("role", session.role);
            }
        } catch (e) {
            // Ignore
        }
    }

    /**
     * Fallback: baca dari key legacy
     */
    function getLegacySession() {
        try {
            const token = localStorage.getItem("token");
            const userStr = localStorage.getItem("user");
            const nik = localStorage.getItem("nik");
            const role = localStorage.getItem("role");

            if (token) {
                const user = userStr ? JSON.parse(userStr) : {};
                const session = {
                    token: token,
                    user: user,
                    nik: nik || user?.nik || "",
                    role: role || user?.role || ""
                };
                
                // Simpan ke format baru
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

            // Normalisasi data
            const normalized = {
                token: session.token,
                user: session.user || {},
                nik: session.nik || session.user?.nik || "",
                role: session.role || session.user?.role || ""
            };

            // Simpan ke BCS_SESSION
            localStorage.setItem(SESSION_KEY, JSON.stringify(normalized));
            
            // Simpan ke key legacy
            localStorage.setItem("token", normalized.token);
            localStorage.setItem("user", JSON.stringify(normalized.user));
            if (normalized.nik) {
                localStorage.setItem("nik", normalized.nik);
            }
            if (normalized.role) {
                localStorage.setItem("role", normalized.role);
            }

            console.log("✅ [Session] Session tersimpan:", {
                token: normalized.token.substring(0, 20) + "...",
                nik: normalized.nik,
                role: normalized.role
            });
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
            console.log("✅ [Session] Session cleared");
            return true;
        } catch (e) {
            console.warn("[Session] Gagal menghapus session:", e);
            return false;
        }
    }

    /**
     * Cek login status
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
     * Ambil user
     */
    function getUser() {
        const session = get();
        return session?.user || {};
    }

    /**
     * Ambil NIK
     */
    function getNik() {
        const session = get();
        return session?.nik || session?.user?.nik || "";
    }

    /**
     * Ambil Role
     */
    function getRole() {
        const session = get();
        return session?.role || session?.user?.role || "";
    }

    /**
     * Ambil Nama
     */
    function getNama() {
        const session = get();
        return session?.user?.nama || session?.user?.name || "";
    }

    /**
     * Ambil Departemen
     */
    function getDept() {
        const session = get();
        return session?.user?.departemen || session?.user?.department || "";
    }

    /**
     * Ambil data lengkap session
     */
    function getFull() {
        return get();
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
        getDept,
        getFull
    };
})();

// Export ke global
window.Session = Session;

console.log("✅ [Session] Session Manager loaded");
