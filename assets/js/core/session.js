// ======================================================
// Building Care System Enterprise v7.1 FINAL
// Session Management - With Heartbeat
// Radiant Group Duri
// ======================================================

"use strict";

// Pastikan BCS tersedia
if (!window.BCS) window.BCS = {};

/**
 * ======================================================
 * SESSION MANAGER
 * ======================================================
 */
const Session = (() => {
    const SESSION_KEY = "BCS_SESSION";
    let _heartbeatInterval = null;

    /**
     * Get session data
     */
    function get() {
        try {
            // Coba dari BCS Storage dulu
            if (BCS.Storage && typeof BCS.Storage.getSession === 'function') {
                const data = BCS.Storage.getSession();
                if (data && data.token) return data;
            }

            // Coba dari localStorage langsung
            const raw = localStorage.getItem(SESSION_KEY);
            if (raw) {
                const data = JSON.parse(raw);
                if (data && data.token) return data;
            }

            // Coba dari sessionStorage
            const sessionRaw = sessionStorage.getItem(SESSION_KEY);
            if (sessionRaw) {
                const data = JSON.parse(sessionRaw);
                if (data && data.token) return data;
            }

            return null;
        } catch (e) {
            console.warn('[Session] Get error:', e);
            return null;
        }
    }

    /**
     * Set session data
     */
    function set(data) {
        try {
            if (!data || !data.token) return false;

            // Simpan ke localStorage
            localStorage.setItem(SESSION_KEY, JSON.stringify(data));
            localStorage.setItem("token", data.token);
            if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
            if (data.nik) localStorage.setItem("nik", data.nik);
            if (data.role) localStorage.setItem("role", data.role);
            if (data.email) localStorage.setItem("userEmail", data.email);

            // Simpan ke sessionStorage
            try {
                sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
                if (data.email) sessionStorage.setItem("userEmail", data.email);
            } catch (e) {}

            // Simpan ke BCS Storage
            if (BCS.Storage && typeof BCS.Storage.setSession === 'function') {
                BCS.Storage.setSession(data);
            }

            // Start heartbeat setelah login
            startHeartbeat();

            console.log('[Session] Saved successfully');
            return true;
        } catch (e) {
            console.error('[Session] Set error:', e);
            return false;
        }
    }

    /**
     * Clear session
     */
    function clear() {
        try {
            // Stop heartbeat
            stopHeartbeat();

            // Hapus semua key
            const keys = [
                SESSION_KEY, "token", "user", "nik", "role", 
                "userEmail", "BCS_REMEMBER", "session_timestamp"
            ];
            keys.forEach(key => {
                localStorage.removeItem(key);
                sessionStorage.removeItem(key);
            });

            if (BCS.Storage && typeof BCS.Storage.removeSession === 'function') {
                BCS.Storage.removeSession();
            }

            console.log('[Session] Cleared');
            return true;
        } catch (e) {
            console.error('[Session] Clear error:', e);
            return false;
        }
    }

    /**
     * Check if user is logged in
     */
    function isLoggedIn() {
        const data = get();
        return data && data.token && data.token !== "undefined" && data.token !== "null";
    }

    /**
     * Get token
     */
    function getToken() {
        const data = get();
        return data ? data.token : null;
    }

    /**
     * Get user data
     */
    function getUser() {
        const data = get();
        return data ? data.user || {} : {};
    }

    /**
     * Get NIK
     */
    function getNik() {
        const data = get();
        return data ? data.nik || '' : '';
    }

    /**
     * Get role
     */
    function getRole() {
        const data = get();
        return data ? data.role || '' : '';
    }

    /**
     * Get nama
     */
    function getNama() {
        const user = getUser();
        return user.nama || user.name || '';
    }

    /**
     * Get email
     */
    function getEmail() {
        const data = get();
        return data ? data.email || data.user?.email || '' : '';
    }

    // =============================================
    // HEARTBEAT - Untuk menjaga session aktif
    // =============================================

    /**
     * Start heartbeat interval (setiap 30 detik)
     */
    function startHeartbeat() {
        // Stop existing heartbeat
        stopHeartbeat();

        // Cek apakah sudah login
        if (!isLoggedIn()) {
            console.log('[Heartbeat] Not logged in, skip');
            return;
        }

        console.log('[Heartbeat] Starting...');

        // Kirim heartbeat setiap 30 detik
        _heartbeatInterval = setInterval(async function() {
            try {
                if (window.BCS.Api && typeof window.BCS.Api.heartbeat === 'function') {
                    const result = await window.BCS.Api.heartbeat();
                    if (!result) {
                        console.warn('[Heartbeat] Failed, session may expire');
                    }
                } else if (window.Api && typeof window.Api.heartbeat === 'function') {
                    const result = await window.Api.heartbeat();
                    if (!result) {
                        console.warn('[Heartbeat] Failed, session may expire');
                    }
                }
            } catch (e) {
                // Silent fail - jangan spam error
            }
        }, 30000);

        console.log('[Heartbeat] Started (every 30s)');
    }

    /**
     * Stop heartbeat interval
     */
    function stopHeartbeat() {
        if (_heartbeatInterval) {
            clearInterval(_heartbeatInterval);
            _heartbeatInterval = null;
            console.log('[Heartbeat] Stopped');
        }
    }

    // =============================================
    // AUTO HEARTBEAT ON LOAD
    // =============================================

    // Auto-start heartbeat jika sudah login
    document.addEventListener('DOMContentLoaded', function() {
        if (isLoggedIn()) {
            setTimeout(startHeartbeat, 1000);
        }
    });

    // Stop heartbeat saat page unload
    window.addEventListener('beforeunload', function() {
        stopHeartbeat();
    });

    // =============================================
    // EXPORT
    // =============================================

    return {
        get: get,
        set: set,
        clear: clear,
        isLoggedIn: isLoggedIn,
        getToken: getToken,
        getUser: getUser,
        getNik: getNik,
        getRole: getRole,
        getNama: getNama,
        getEmail: getEmail,
        startHeartbeat: startHeartbeat,
        stopHeartbeat: stopHeartbeat
    };

})();

// Assign ke global
window.Session = Session;
if (window.BCS) {
    BCS.Session = Session;
}

console.log("✅ [Session] Session Manager loaded with Heartbeat");
