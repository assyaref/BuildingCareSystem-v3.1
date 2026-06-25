// ======================================================
// Building Care System Enterprise
// File : assets/js/core/session.js
// Desc : Session Manager with Multi-Layer Storage
// Version : 4.0 FINAL
// ======================================================

"use strict";

const SESSION_KEY = "BCS_SESSION";
const SESSION_BACKUP_KEY = "BCS_SESSION_BACKUP";

/**
 * Session Manager - Multi-Layer Storage
 */
const Session = (() => {
    
    // Cache in memory
    let memoryCache = null;
    let cacheTimestamp = 0;
    const CACHE_TTL = 5000; // 5 detik

    /**
     * Get storage with fallback
     */
    function getStorage() {
        try {
            localStorage.setItem("__test__", "1");
            localStorage.removeItem("__test__");
            return localStorage;
        } catch (e) {
            try {
                sessionStorage.setItem("__test__", "1");
                sessionStorage.removeItem("__test__");
                return sessionStorage;
            } catch (err) {
                return null;
            }
        }
    }

    /**
     * Save to all available storage
     */
    function saveToAllStorages(key, value) {
        const storage = getStorage();
        if (storage) {
            try {
                storage.setItem(key, value);
            } catch (e) {
                console.warn("[Session] Gagal save ke storage:", e);
            }
        }
        
        // Juga simpan ke sessionStorage sebagai backup
        try {
            sessionStorage.setItem(key, value);
        } catch (e) {
            // Ignore
        }
        
        // Update memory cache
        memoryCache = JSON.parse(value);
        cacheTimestamp = Date.now();
    }

    /**
     * Read from all available storage
     */
    function readFromAllStorages(key) {
        // Cek memory cache dulu
        if (memoryCache && (Date.now() - cacheTimestamp) < CACHE_TTL) {
            return JSON.stringify(memoryCache);
        }
        
        // Coba dari localStorage
        const storage = getStorage();
        if (storage) {
            try {
                const data = storage.getItem(key);
                if (data) {
                    memoryCache = JSON.parse(data);
                    cacheTimestamp = Date.now();
                    return data;
                }
            } catch (e) {
                console.warn("[Session] Gagal baca dari storage:", e);
            }
        }
        
        // Coba dari sessionStorage
        try {
            const data = sessionStorage.getItem(key);
            if (data) {
                memoryCache = JSON.parse(data);
                cacheTimestamp = Date.now();
                return data;
            }
        } catch (e) {
            // Ignore
        }
        
        return null;
    }

    /**
     * Remove from all storages
     */
    function removeFromAllStorages(key) {
        try {
            const storage = getStorage();
            if (storage) {
                storage.removeItem(key);
            }
            sessionStorage.removeItem(key);
        } catch (e) {
            // Ignore
        }
        memoryCache = null;
        cacheTimestamp = 0;
    }

    /**
     * Ambil session
     */
    function get() {
        try {
            // Coba baca dari BCS_SESSION
            let data = readFromAllStorages(SESSION_KEY);
            
            if (data) {
                try {
                    const session = JSON.parse(data);
                    if (session && session.token) {
                        // Validasi token tidak kosong
                        if (session.token && session.token !== "undefined" && session.token !== "null") {
                            syncToLegacy(session);
                            return session;
                        }
                    }
                } catch (e) {
                    console.warn("[Session] Gagal parse session:", e);
                }
            }
            
            // Coba dari backup
            const backupData = readFromAllStorages(SESSION_BACKUP_KEY);
            if (backupData) {
                try {
                    const session = JSON.parse(backupData);
                    if (session && session.token) {
                        // Restore dari backup
                        saveToAllStorages(SESSION_KEY, backupData);
                        return session;
                    }
                } catch (e) {
                    console.warn("[Session] Gagal parse backup:", e);
                }
            }
            
            // Fallback ke legacy
            return getLegacySession();
        } catch (e) {
            console.error("[Session] Gagal get session:", e);
            return null;
        }
    }

    /**
     * Sync ke key legacy
     */
    function syncToLegacy(session) {
        try {
            if (session && session.token) {
                localStorage.setItem("token", session.token);
                localStorage.setItem("user", JSON.stringify(session.user || {}));
                if (session.nik) localStorage.setItem("nik", session.nik);
                if (session.role) localStorage.setItem("role", session.role);
            }
        } catch (e) {
            // Ignore
        }
    }

    /**
     * Get from legacy keys
     */
    function getLegacySession() {
        try {
            const token = localStorage.getItem("token");
            const userStr = localStorage.getItem("user");
            const nik = localStorage.getItem("nik");
            const role = localStorage.getItem("role");

            if (token && token !== "undefined" && token !== "null") {
                const user = userStr ? JSON.parse(userStr) : {};
                const session = {
                    token: token,
                    user: user,
                    nik: nik || user?.nik || "",
                    role: role || user?.role || ""
                };
                
                // Save ke format baru
                const jsonData = JSON.stringify(session);
                saveToAllStorages(SESSION_KEY, jsonData);
                saveToAllStorages(SESSION_BACKUP_KEY, jsonData);
                syncToLegacy(session);
                
                return session;
            }
            return null;
        } catch (e) {
            console.warn("[Session] Gagal baca legacy:", e);
            return null;
        }
    }

    /**
     * Simpan session - MULTI LAYER
     */
    function set(session) {
        try {
            if (!session || !session.token) {
                console.warn("[Session] Session tidak valid");
                return false;
            }

            // Validasi token
            if (session.token === "undefined" || session.token === "null" || session.token === "") {
                console.warn("[Session] Token tidak valid:", session.token);
                return false;
            }

            // Normalisasi
            const normalized = {
                token: session.token,
                user: session.user || {},
                nik: session.nik || session.user?.nik || "",
                role: session.role || session.user?.role || ""
            };

            const jsonData = JSON.stringify(normalized);
            
            // Simpan ke MULTIPLE STORAGE
            saveToAllStorages(SESSION_KEY, jsonData);
            saveToAllStorages(SESSION_BACKUP_KEY, jsonData);
            
            // Simpan ke legacy
            syncToLegacy(normalized);

            console.log("✅ [Session] Session tersimpan di MULTIPLE storage:", {
                token: normalized.token.substring(0, 20) + "...",
                nik: normalized.nik,
                role: normalized.role
            });

            // Verifikasi
            const verify = readFromAllStorages(SESSION_KEY);
            if (verify) {
                console.log("✅ [Session] Verifikasi storage: OK");
            } else {
                console.warn("⚠️ [Session] Verifikasi storage: GAGAL - akan retry");
                // Retry sekali
                setTimeout(() => {
                    saveToAllStorages(SESSION_KEY, jsonData);
                    saveToAllStorages(SESSION_BACKUP_KEY, jsonData);
                }, 100);
            }

            return true;
        } catch (e) {
            console.error("[Session] Gagal menyimpan:", e);
            return false;
        }
    }

    /**
     * Hapus session dari semua storage
     */
    function clear() {
        try {
            removeFromAllStorages(SESSION_KEY);
            removeFromAllStorages(SESSION_BACKUP_KEY);
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            localStorage.removeItem("nik");
            localStorage.removeItem("role");
            localStorage.removeItem("BCS_REMEMBER");
            console.log("✅ [Session] Session cleared dari semua storage");
            return true;
        } catch (e) {
            console.warn("[Session] Gagal clear:", e);
            return false;
        }
    }

    /**
     * Cek login - VALIDASI TOKEN
     */
    function isLoggedIn() {
        const session = get();
        if (!session) return false;
        if (!session.token) return false;
        if (session.token === "undefined" || session.token === "null") return false;
        if (session.token.length < 10) return false; // Token minimal 10 karakter
        return true;
    }

    /**
     * Get token dengan validasi
     */
    function getToken() {
        const session = get();
        if (!session) return "";
        const token = session.token || "";
        if (token === "undefined" || token === "null") return "";
        return token;
    }

    /**
     * Get user
     */
    function getUser() {
        const session = get();
        return session?.user || {};
    }

    /**
     * Get NIK
     */
    function getNik() {
        const session = get();
        return session?.nik || session?.user?.nik || "";
    }

    /**
     * Get Role
     */
    function getRole() {
        const session = get();
        return session?.role || session?.user?.role || "";
    }

    /**
     * Get Nama
     */
    function getNama() {
        const session = get();
        return session?.user?.nama || session?.user?.name || "";
    }

    /**
     * Get Departemen
     */
    function getDept() {
        const session = get();
        return session?.user?.departemen || session?.user?.department || "";
    }

    /**
     * Get full session
     */
    function getFull() {
        return get();
    }

    /**
     * Verify session integrity
     */
    function verify() {
        const session = get();
        if (!session) return false;
        if (!session.token) return false;
        if (session.token === "undefined" || session.token === "null") return false;
        
        // Cek apakah data di semua storage konsisten
        const storage = getStorage();
        if (storage) {
            const main = storage.getItem(SESSION_KEY);
            const backup = storage.getItem(SESSION_BACKUP_KEY);
            if (main && backup) {
                try {
                    const mainData = JSON.parse(main);
                    const backupData = JSON.parse(backup);
                    if (mainData.token !== backupData.token) {
                        console.warn("⚠️ [Session] Inkonsistensi data: main vs backup");
                        // Restore dari yang valid
                        if (mainData.token) {
                            saveToAllStorages(SESSION_BACKUP_KEY, main);
                        } else if (backupData.token) {
                            saveToAllStorages(SESSION_KEY, backup);
                        }
                    }
                } catch (e) {
                    // Ignore
                }
            }
        }
        
        return true;
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
        getFull,
        verify
    };
})();

// Export ke global
window.Session = Session;

console.log("✅ [Session] Session Manager v4.0 FINAL loaded");
