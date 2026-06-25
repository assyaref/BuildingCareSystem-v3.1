// ======================================================
// Building Care System Enterprise v6.2 FINAL
// Core API Framework
// Radiant Group Duri
// ======================================================

"use strict";

// Pastikan BCS dan BCS.Events tersedia
if (!window.BCS) window.BCS = {};
if (!BCS.Events) {
    BCS.Events = (() => {
        const listeners = {};
        function on(event, callback) {
            if (!listeners[event]) listeners[event] = [];
            listeners[event].push(callback);
        }
        function off(event, callback) {
            if (!listeners[event]) return;
            listeners[event] = listeners[event].filter(cb => cb !== callback);
        }
        function emit(event, data) {
            if (!listeners[event]) return;
            listeners[event].forEach(cb => { try { cb(data); } catch (e) {} });
        }
        return Object.freeze({ on, off, emit });
    })();
}

// ======================================================
// API CONFIG
// ======================================================
const API_URL = (typeof CONFIG !== 'undefined' && CONFIG.API?.URL) || 
                (window.CONFIG?.API?.URL) || 
                "https://script.google.com/macros/s/AKfycbzN3jSKv-RywufMhzub5SAbReV0ES31_4AMZP7Us4UxhskijtydQYpOWmPgCKQ9GmzH2w/exec";

// ======================================================
// API ENGINE
// ======================================================
const Api = (() => {
    let loadingCounter = 0;

    function showLoading() {
        loadingCounter++;
        if (loadingCounter === 1) {
            BCS.Events.emit("loading:start");
        }
    }

    function hideLoading() {
        loadingCounter = Math.max(0, loadingCounter - 1);
        if (loadingCounter === 0) {
            BCS.Events.emit("loading:end");
        }
    }

    /**
     * Get token from any available source
     */
    function getToken() {
        // Coba dari Session
        if (window.Session && typeof Session.getToken === 'function') {
            const token = Session.getToken();
            if (token && token !== "undefined" && token !== "null") {
                return token;
            }
        }
        
        // Coba dari localStorage langsung
        try {
            const token = localStorage.getItem("token");
            if (token && token !== "undefined" && token !== "null") {
                return token;
            }
        } catch (e) {}
        
        // Coba dari BCS_SESSION
        try {
            const session = localStorage.getItem("BCS_SESSION");
            if (session) {
                const data = JSON.parse(session);
                if (data && data.token) {
                    return data.token;
                }
            }
        } catch (e) {}
        
        return null;
    }

    async function request(method, action, data = {}) {
        showLoading();
        
        try {
            // Get token
            const token = getToken();
            
            const payload = { action, ...data };
            if (token) {
                payload.token = token;
            }

            const options = {
                method: method,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            };

            // Build URL with action param for GET
            let url = API_URL;
            if (method === "GET") {
                const params = new URLSearchParams({ action, ...data });
                url = `${API_URL}?${params.toString()}`;
                delete options.body;
            }

            console.log(`[API] ${method} ${action}`, { url, payload });

            const response = await fetch(url, options);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            // Handle session expired
            if (result && result.success === false && result.message === "Session expired") {
                console.warn("[API] Session expired, clearing...");
                if (window.Session && typeof Session.clear === 'function') {
                    Session.clear();
                }
                localStorage.removeItem("token");
                localStorage.removeItem("BCS_SESSION");
                // Redirect to login
                if (!window.location.pathname.includes('login.html')) {
                    window.location.href = 'login.html';
                }
                return result;
            }

            return result;

        } catch (error) {
            console.error("[API] Request failed:", error);
            return {
                success: false,
                message: error.message || "Request failed"
            };
        } finally {
            hideLoading();
        }
    }

    return {
        post: (action, data) => request("POST", action, data),
        get: (action, data) => request("GET", action, data),
        request: request
    };
})();

// Assign to global
window.BCS.Api = Api;
window.Api = Api;

console.log("✅ [API] Core API loaded");
