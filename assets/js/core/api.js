// ======================================================
// Building Care System Enterprise v6.2 FINAL
// Core API Framework - FIXED
// Radiant Group Duri
// ======================================================

"use strict";

// Pastikan BCS.Events sudah ada (dari app.js)
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

const API_TIMEOUT = window.CONFIG?.API?.TIMEOUT || 30000;

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

    async function request(method, action, data = {}) {
        showLoading();
        
        try {
            // Get token from Session or Auth
            let token = null;
            if (window.Session && typeof Session.getToken === 'function') {
                token = Session.getToken();
            } else if (window.Auth && typeof Auth.token === 'function') {
                token = Auth.token();
            } else {
                token = localStorage.getItem("token");
            }
            
            const payload = { action, ...data };
            if (token && token !== "undefined" && token !== "null") {
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
            }

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
                if (window.Auth && typeof Auth.clear === 'function') {
                    Auth.clear();
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
