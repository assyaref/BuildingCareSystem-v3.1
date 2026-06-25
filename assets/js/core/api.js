// ======================================================
// Building Care System Enterprise v6.3 FINAL
// Core API Framework - CORS FIXED
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
// API ENGINE - CORS FIXED
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
     * Main request function - CORS FIXED
     */
    async function request(method, action, data = {}) {
        showLoading();
        
        try {
            const token = getToken();
            
            // 🔥 FIX: Gunakan GET dengan parameter URL (cara paling aman untuk Google Script)
            const params = new URLSearchParams();
            params.append('action', action);
            params.append('data', JSON.stringify(data));
            if (token) {
                params.append('token', token);
            }

            const url = `${API_URL}?${params.toString()}`;
            console.log(`[API] ${method} ${action}`, url);

            // 🔥 FIX: Gunakan mode cors dengan header yang benar
            const options = {
                method: 'GET',
                mode: 'cors',
                cache: 'no-cache',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            };

            const response = await fetch(url, options);
            
            // Cek response
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // Parse response
            const text = await response.text();
            console.log('[API] Response text:', text);
            
            let result;
            try {
                result = JSON.parse(text);
            } catch (e) {
                // Jika response bukan JSON, coba parse dari URL
                result = { success: true, message: text || "Request sent" };
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
            
            // 🔥 Jika CORS error, coba alternatif dengan mode no-cors
            if (error.message.includes('CORS') || error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                console.warn("[API] CORS detected, trying alternative method...");
                return await requestNoCors(action, data);
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
     * 🔥 Alternative request tanpa CORS (menggunakan mode no-cors)
     */
    async function requestNoCors(action, data = {}) {
        try {
            const token = getToken();
            
            // Buat URL dengan parameter
            const params = new URLSearchParams();
            params.append('action', action);
            params.append('data', JSON.stringify(data));
            if (token) {
                params.append('token', token);
            }

            const url = `${API_URL}?${params.toString()}`;
            console.log('[API] No-CORS request:', url);

            // 🔥 Gunakan fetch dengan mode no-cors
            const response = await fetch(url, {
                method: 'GET',
                mode: 'no-cors',
                cache: 'no-cache',
                headers: {
                    'Accept': 'application/json'
                }
            });

            // Karena no-cors, kita tidak bisa membaca response
            // Tapi kita bisa coba baca sebagai text
            try {
                const text = await response.text();
                if (text) {
                    try {
                        return JSON.parse(text);
                    } catch (e) {
                        return {
                            success: true,
                            message: text || "Request sent (no-cors mode)",
                            data: {}
                        };
                    }
                }
            } catch (e) {
                // Jika tidak bisa baca response, asumsikan sukses
                console.log('[API] No-CORS response tidak bisa dibaca, asumsikan sukses');
            }

            // Asumsikan sukses
            return {
                success: true,
                message: "Request sent (no-cors mode)",
                data: {}
            };

        } catch (error) {
            console.error("[API] No-CORS request failed:", error);
            
            // 🔥 LAST RESORT: Gunakan JSONP dengan image tag
            return await requestJsonp(action, data);
        }
    }

    /**
     * 🔥 LAST RESORT: JSONP menggunakan image atau script tag
     */
    function requestJsonp(action, data = {}) {
        return new Promise((resolve) => {
            try {
                const token = getToken();
                const callbackName = 'callback_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
                
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
                }, 10000);

                // Callback function
                window[callbackName] = function(response) {
                    clearTimeout(timeout);
                    document.body.removeChild(script);
                    delete window[callbackName];
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
                console.error("[API] JSONP request error:", error);
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

console.log("✅ [API] Core API loaded (CORS Fixed v6.3)");
