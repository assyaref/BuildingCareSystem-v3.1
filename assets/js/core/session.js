// ======================================================
// Building Care System Enterprise
// File : assets/js/core/session.js
// Desc : Simple Session Manager - SINGLE SOURCE OF TRUTH
// Version : 6.0 FINAL STABLE
// ======================================================

"use strict";

/**
 * Session Manager - Simple & Reliable
 * Menggunakan localStorage sebagai single source of truth
 */
const Session = (() => {
    
    // Memory cache (fallback jika storage gagal)
    let memoryCache = null;
    let useMemoryFallback = false;

    /**
     * Cek apakah storage tersedia
     */
    function isStorageAvailable() {
        if (useMemoryFallback) return false;
        try {
            localStorage.setItem("__test__", "1");
            localStorage.removeItem("__test__");
            return true;
        } catch (e) {
            useMemoryFallback = true;
            console.warn("[Session] localStorage tidak tersedia, menggunakan memory fallback");
            return false;
        }
    }

    /**
     * Simpan data ke storage atau memory
     */
    function saveData(key, value) {
        const jsonValue = JSON.stringify(value);
        
        if (isStorageAvailable()) {
            try {
                localStorage.setItem(key, jsonValue);
                // Backup ke sessionStorage
                try {
                    sessionStorage.setItem(key, jsonValue);
                } catch (e) {}
                return true;
            } catch (e) {
                console.error("[Session] Gagal save ke localStorage:", e);
                memoryCache = value;
                return false;
            }
        } else {
            memoryCache = value;
            return true;
        }
    }

    /**
     * Ambil data dari storage atau memory
     */
    function getData(key) {
        // Cek memory cache dulu
        if (memoryCache) return memoryCache;
        
        if (isStorageAvailable()) {
            try {
                const data = localStorage.getItem(key);
                if (data) {
                    try {
                        return JSON.parse(data);
                    } catch (e) {
                        return data;
                    }
                }
            } catch (e) {
                console.error("[Session] Gagal baca dari localStorage:", e);
            }
            
            // Coba dari sessionStorage backup
            try {
                const backup = sessionStorage.getItem(key);
                if (backup) {
                    const parsed = JSON.parse(backup);
                    // Restore ke localStorage
                    localStorage.setItem(key, backup);
                    return parsed;
                }
            } catch (e) {}
        }
        
        return null;
    }

    /**
     * Hapus data dari semua storage
     */
    function removeData(key) {
        try {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        } catch (e) {}
        memoryCache = null;
    }

    // =============================================
    // PUBLIC API
    // =============================================

    /**
     * Set session data
     */
    function set(sessionData) {
        if (!sessionData) {
            console.warn("[Session] set() called with null/undefined");
            return false;
        }

        // Pastikan ada token
        if (!sessionData.token || sessionData.token === "undefined" || sessionData.token === "null") {
            console.warn("[Session] Token tidak valid:", sessionData.token);
            return false;
        }

        // Normalisasi data
        const normalized = {
            token: sessionData.token.trim(),
            user: sessionData.user || {},
            nik: sessionData.nik || sessionData.user?.nik || "",
            role: sessionData.role || sessionData.user?.role || "",
            timestamp: Date.now()
        };

        // Simpan ke BCS_SESSION
        const saved = saveData("BCS_SESSION", normalized);
        
        // Juga simpan ke key individual untuk kompatibilitas
        saveData("token", normalized.token);
        saveData("user", normalized.user);
        if (normalized.nik) saveData("nik", normalized.nik);
        if (normalized.role) saveData("role", normalized.role);
        saveData("session_timestamp", normalized.timestamp);

        console.log("✅ [Session] Data tersimpan:", {
            token: normalized.token.substring(0, 15) + "...",
            nik: normalized.nik,
            role: normalized.role
        });

        // Verifikasi
        const verify = getData("BCS_SESSION");
        if (verify && verify.token) {
            console.log("✅ [Session] Verifikasi: OK");
            return true;
        } else {
            console.warn("⚠️ [Session] Verifikasi: GAGAL, mencoba ulang...");
            // Retry
            setTimeout(() => {
                saveData("BCS_SESSION", normalized);
            }, 100);
            return true;
        }
    }

    /**
     * Get session data
     */
    function get() {
        try {
            // Coba dari BCS_SESSION
            let data = getData("BCS_SESSION");
            if (data && data.token && data.token !== "undefined" && data.token !== "null") {
                return data;
            }

            // Coba dari individual keys
            const token = getData("token");
            if (token && token !== "undefined" && token !== "null") {
                const user = getData("user") || {};
                const nik = getData("nik") || "";
                const role = getData("role") || "";
                const timestamp = getData("session_timestamp") || Date.now();
                
                data = { token, user, nik, role, timestamp };
                // Save ke format baru
                saveData("BCS_SESSION", data);
                return data;
            }

            return null;
        } catch (e) {
            console.error("[Session] Gagal get data:", e);
            return null;
        }
    }

    /**
     * Clear session
     */
    function clear() {
        removeData("BCS_SESSION");
        removeData("token");
        removeData("user");
        removeData("nik");
        removeData("role");
        removeData("session_timestamp");
        removeData("BCS_REMEMBER");
        memoryCache = null;
        console.log("✅ [Session] Data cleared");
        return true;
    }

    /**
     * Check if logged in
     */
    function isLoggedIn() {
        const data = get();
        if (!data) return false;
        if (!data.token) return false;
        if (data.token === "undefined" || data.token === "null") return false;
        if (data.token.trim() === "") return false;
        if (data.token.length < 5) return false;
        return true;
    }

    /**
     * Get token
     */
    function getToken() {
        const data = get();
        if (!data) return "";
        const token = data.token || "";
        if (token === "undefined" || token === "null") return "";
        return token;
    }

    /**
     * Get user
     */
    function getUser() {
        const data = get();
        return data?.user || {};
    }

    /**
     * Get NIK
     */
    function getNik() {
        const data = get();
        return data?.nik || data?.user?.nik || "";
    }

    /**
     * Get Role
     */
    function getRole() {
        const data = get();
        return data?.role || data?.user?.role || "";
    }

    /**
     * Get Nama
     */
    function getNama() {
        const data = get();
        return data?.user?.nama || data?.user?.name || "";
    }

    /**
     * Get Departemen
     */
    function getDept() {
        const data = get();
        return data?.user?.departemen || data?.user?.department || "";
    }

    /**
     * Get timestamp
     */
    function getTimestamp() {
        const data = get();
        return data?.timestamp || 0;
    }

    /**
     * Verify session
     */
    function verify() {
        const data = get();
        if (!data) return false;
        if (!data.token) return false;
        if (data.token === "undefined" || data.token === "null") return false;
        if (data.token.length < 5) return false;
        return true;
    }

    // =============================================
    // EXPORT
    // =============================================

    return {
        set,
        get,
        clear,
        isLoggedIn,
        getToken,
        getUser,
        getNik,
        getRole,
        getNama,
        getDept,
        getTimestamp,
        verify
    };
})();

// Export ke global
window.Session = Session;

console.log("✅ [Session] Session Manager v6.0 FINAL loaded");
