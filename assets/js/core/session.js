// ======================================================
// Building Care System Enterprise v7.2 FINAL
// Session Management - Heartbeat + Device/IP Detection
// Radiant Group Duri
// ======================================================

"use strict";
if (!window.BCS) window.BCS = {};

const Session = (() => {
    const SESSION_KEY = "BCS_SESSION";
    const CLIENT_INFO_KEY = "BCS_CLIENT_INFO";
    let _heartbeatInterval = null;
    let _clientInfoPromise = null;

    function get() {
        try {
            if (BCS.Storage && typeof BCS.Storage.getSession === 'function') {
                const data = BCS.Storage.getSession();
                if (data && data.token) return data;
            }
            const raw = localStorage.getItem(SESSION_KEY);
            if (raw) {
                const data = JSON.parse(raw);
                if (data && data.token) return data;
            }
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

    function set(data) {
        try {
            if (!data || !data.token) return false;
            localStorage.setItem(SESSION_KEY, JSON.stringify(data));
            localStorage.setItem("token", data.token);
            if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
            if (data.nik) localStorage.setItem("nik", data.nik);
            if (data.role) localStorage.setItem("role", data.role);
            if (data.email) localStorage.setItem("userEmail", data.email);
            try {
                sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
                if (data.email) sessionStorage.setItem("userEmail", data.email);
            } catch (e) {}
            if (BCS.Storage && typeof BCS.Storage.setSession === 'function') BCS.Storage.setSession(data);
            detectClientInfo(true).finally(startHeartbeat);
            console.log('[Session] Saved successfully');
            return true;
        } catch (e) {
            console.error('[Session] Set error:', e);
            return false;
        }
    }

    function clear() {
        try {
            stopHeartbeat();
            [SESSION_KEY,"token","user","nik","role","userEmail","BCS_REMEMBER","session_timestamp",CLIENT_INFO_KEY]
                .forEach(key => { localStorage.removeItem(key); sessionStorage.removeItem(key); });
            if (BCS.Storage && typeof BCS.Storage.removeSession === 'function') BCS.Storage.removeSession();
            return true;
        } catch (e) {
            console.error('[Session] Clear error:', e);
            return false;
        }
    }

    function isLoggedIn() {
        const data = get();
        return !!(data && data.token && data.token !== "undefined" && data.token !== "null");
    }

    function getToken() { const data = get(); return data ? data.token : null; }
    function getUser() { const data = get(); return data ? data.user || {} : {}; }
    function getNik() { const data = get(); return data ? data.nik || data.user?.nik || '' : ''; }
    function getRole() { const data = get(); return data ? data.role || data.user?.role || '' : ''; }
    function getNama() { const u = getUser(); return u.nama || u.name || ''; }
    function getEmail() { const data = get(); return data ? data.email || data.user?.email || '' : ''; }

    function detectBrowser(ua) {
        if (/Edg\//i.test(ua)) return 'Microsoft Edge';
        if (/OPR\//i.test(ua)) return 'Opera';
        if (/Chrome\//i.test(ua)) return 'Google Chrome';
        if (/Firefox\//i.test(ua)) return 'Mozilla Firefox';
        if (/Safari\//i.test(ua)) return 'Safari';
        return 'Unknown';
    }

    function detectOS(ua) {
        if (/Windows NT 10.0/i.test(ua)) return 'Windows 10/11';
        if (/Windows/i.test(ua)) return 'Windows';
        if (/Android/i.test(ua)) return 'Android';
        if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
        if (/Mac OS X/i.test(ua)) return 'macOS';
        if (/Linux/i.test(ua)) return 'Linux';
        return 'Unknown';
    }

    function detectDevice(ua) {
        if (/iPad|Tablet/i.test(ua)) return 'Tablet';
        if (/Mobile|Android|iPhone|iPod/i.test(ua)) return 'Mobile';
        return 'Desktop';
    }

    async function detectClientInfo(force = false) {
        if (!force) {
            try {
                const cached = JSON.parse(localStorage.getItem(CLIENT_INFO_KEY) || 'null');
                if (cached && cached.detected_at && Date.now() - cached.detected_at < 6 * 60 * 60 * 1000) return cached;
            } catch (e) {}
        }

        if (_clientInfoPromise) return _clientInfoPromise;

        _clientInfoPromise = (async () => {
            const ua = navigator.userAgent || '';
            const info = {
                device: detectDevice(ua),
                browser: detectBrowser(ua),
                os: detectOS(ua),
                ip_address: '',
                user_agent: ua,
                detected_at: Date.now()
            };

            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 5000);
                const response = await fetch('https://api.ipify.org?format=json', {
                    cache: 'no-store',
                    signal: controller.signal
                });
                clearTimeout(timeout);
                if (response.ok) {
                    const json = await response.json();
                    info.ip_address = json.ip || '';
                }
            } catch (e) {
                console.warn('[Session] Public IP detection unavailable:', e.message);
            }

            try { localStorage.setItem(CLIENT_INFO_KEY, JSON.stringify(info)); } catch (e) {}
            return info;
        })();

        try { return await _clientInfoPromise; }
        finally { _clientInfoPromise = null; }
    }

    async function sendHeartbeat() {
        if (!isLoggedIn()) return false;
        try {
            const clientInfo = await detectClientInfo(false);
            if (window.BCS.Api && typeof window.BCS.Api.heartbeat === 'function') {
                return await window.BCS.Api.heartbeat(clientInfo);
            }
            if (window.Api && typeof window.Api.heartbeat === 'function') {
                return await window.Api.heartbeat(clientInfo);
            }
            return false;
        } catch (e) {
            console.warn('[Heartbeat] Failed:', e.message);
            return false;
        }
    }

    function startHeartbeat() {
        stopHeartbeat();
        if (!isLoggedIn()) return;
        console.log('[Heartbeat] Starting with Device/IP detection...');
        sendHeartbeat();
        _heartbeatInterval = setInterval(sendHeartbeat, 30000);
        console.log('[Heartbeat] Started (every 30s)');
    }

    function stopHeartbeat() {
        if (_heartbeatInterval) {
            clearInterval(_heartbeatInterval);
            _heartbeatInterval = null;
            console.log('[Heartbeat] Stopped');
        }
    }

    document.addEventListener('DOMContentLoaded', function() {
        if (isLoggedIn()) setTimeout(startHeartbeat, 1000);
    });

    window.addEventListener('beforeunload', stopHeartbeat);

    return {
        get, set, clear, isLoggedIn, getToken, getUser, getNik, getRole, getNama, getEmail,
        detectClientInfo, sendHeartbeat, startHeartbeat, stopHeartbeat
    };
})();

window.Session = Session;
BCS.Session = Session;
console.log("✅ [Session] Session Manager v7.2 loaded with Device/IP Heartbeat");
