// ======================================================
// Building Care System Enterprise v6.4 FINAL
// Core API Framework - Direct Google Script Integration
// Radiant Group Duri
// ======================================================

"use strict";

// Pastikan BCS dan BCS.Events tersedia
if (!window.BCS) window.BCS = {};
if (!BCS.Events) {
    BCS.Events = {
        on: () => {},
        off: () => {},
        emit: (event) => {
            if (event === "loading:start") {
                const loader = document.getElementById('loading');
                if (loader) loader.style.display = "flex";
            } else if (event === "loading:end") {
                const loader = document.getElementById('loading');
                if (loader) loader.style.display = "none";
            }
        }
    };
}

// ======================================================
// API CONFIG
// ======================================================
const API_URL = (typeof CONFIG !== 'undefined' && CONFIG.API?.URL) || 
                (window.CONFIG?.API?.URL) || 
                "https://script.google.com/macros/s/AKfycbzN3jSKv-RywufMhzub5SAbReV0ES31_4AMZP7Us4UxhskijtydQYpOWmPgCKQ9GmzH2w/exec";

// ======================================================
// API ENGINE - DIRECT GOOGLE SCRIPT
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
     * Get token dari berbagai sumber
     */
    function getToken() {
        // Coba dari Session
        if (window.Session && typeof Session.getToken === 'function') {
            const token = Session.getToken();
            if (token && token !== "undefined" && token !== "null" && token !== "") {
                return token;
            }
        }
        
        // Coba dari localStorage langsung
        try {
            const token = localStorage.getItem("token");
            if (token && token !== "undefined" && token !== "null" && token !== "") {
                return token;
            }
        } catch (e) {}
        
        // Coba dari BCS_SESSION
        try {
            const session = localStorage.getItem("BCS_SESSION");
            if (session) {
                const data = JSON.parse(session);
                if (data && data.token && data.token !== "undefined" && data.token !== "null") {
                    return data.token;
                }
            }
        } catch (e) {}
        
        return null;
    }

    /**
     * 🔥 Main request - Direct to Google Script
     * Google Script menerima request dengan method POST dan body JSON
     */
    async function request(method, action, data = {}) {
        showLoading();
        
        try {
            const token = getToken();
            
            // 🔥 Buat payload untuk Google Script
            const payload = {
                action: action,
                data: data
            };
            
            // Tambahkan token jika ada
            if (token) {
                payload.token = token;
            }

            console.log(`[API] ${method} ${action}`, payload);

            // 🔥 Google Script menerima POST dengan Content-Type: text/plain
            const options = {
                method: 'POST',
                mode: 'cors',
                cache: 'no-cache',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            };

            const response = await fetch(API_URL, options);
            
            // Cek response
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // Parse response
            const text = await response.text();
            console.log('[API] Response:', text);
            
            let result;
            try {
                result = JSON.parse(text);
            } catch (e) {
                // Jika response bukan JSON, coba parse
                result = { 
                    success: true, 
                    message: text || "Request sent",
                    data: {}
                };
            }

            // Handle session expired
            if (result && result.success === false && result.message === "Session expired") {
                console.warn("[API] Session expired, clearing...");
                if (window.Session && typeof Session.clear === 'function') {
                    Session.clear();
                }
                localStorage.removeItem("token");
                localStorage.removeItem("BCS_SESSION");
                if (!window.location.pathname.includes('login.html')) {
                    window.location.href = 'login.html';
                }
                return result;
            }

            return result;

        } catch (error) {
            console.error("[API] Request failed:", error);
            
            // 🔥 Jika CORS error, coba alternatif
            if (error.message.includes('CORS') || error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                console.warn("[API] CORS detected, trying JSONP fallback...");
                return await requestJsonp(action, data);
            }
            
            return {
                success: false,
                message: error.message || "Request failed"
            };
        } finally {
            hideLoading();
        }
    }

    /**
     * 🔥 Fallback: JSONP menggunakan script tag
     * Google Script mendukung JSONP dengan parameter ?callback=
     */
    function requestJsonp(action, data = {}) {
        return new Promise((resolve) => {
            try {
                const token = getToken();
                const callbackName = 'callback_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
                
                // 🔥 Buat URL dengan parameter untuk Google Script
                const params = new URLSearchParams();
                params.append('action', action);
                params.append('data', JSON.stringify(data));
                if (token) {
                    params.append('token', token);
                }
                params.append('callback', callbackName);

                const url = `${API_URL}?${params.toString()}`;
                console.log('[API] JSONP request:', url);

                // Buat script tag
                const script = document.createElement('script');
                script.src = url;
                script.async = true;

                // Timeout
                const timeout = setTimeout(() => {
                    document.body.removeChild(script);
                    delete window[callbackName];
                    resolve({
                        success: false,
                        message: "JSONP request timeout"
                    });
                }, 15000);

                // Callback function
                window[callbackName] = function(response) {
                    clearTimeout(timeout);
                    document.body.removeChild(script);
                    delete window[callbackName];
                    
                    console.log('[API] JSONP response:', response);
                    resolve(response || { success: true, data: {} });
                };

                // Error handler
                script.onerror = function() {
                    clearTimeout(timeout);
                    document.body.removeChild(script);
                    delete window[callbackName];
                    resolve({
                        success: false,
                        message: "JSONP request failed"
                    });
                };

                document.body.appendChild(script);

            } catch (error) {
                console.error("[API] JSONP error:", error);
                resolve({
                    success: false,
                    message: error.message || "JSONP request failed"
                });
            }
        });
    }

    return {
        post: (action, data) => request("POST", action, data),
        get: (action, data) => request("GET", action, data),
        request: request
    };
})();

// Assign ke global
window.BCS.Api = Api;
window.Api = Api;

console.log("✅ [API] Core API loaded (Direct Google Script v6.4)");
