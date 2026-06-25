// ======================================================
// Building Care System Enterprise v4.0 (Refactored)
// Core API Framework
// Radiant Group Duri
// ======================================================

"use strict";

const Api = (() => {

    // ==========================================
    // CONFIG & IMMUTABLE STATE
    // ==========================================
    const BASE_URL = window.CONFIG?.API?.URL || "";
    const TIMEOUT = window.CONFIG?.API?.TIMEOUT || 30000;
    const RETRY = window.CONFIG?.API?.RETRY || 2;

    let loadingCounter = 0;

    // ==========================================
    // LOGGER SYSTEM (DEBUG CONTROL)
    // ==========================================
    const isDebug = () => window.CONFIG?.DEBUG !== false;

    function info(...args) { if (isDebug()) console.log("[API]", ...args); }
    function warn(...args) { if (isDebug()) console.warn("[API]", ...args); }
    function error(...args) { if (isDebug()) console.error("[API]", ...args); }

    // ==========================================
    // LOADING QUEUE
    // ==========================================
    function showLoading() {
        loadingCounter++;
        if (loadingCounter === 1 && window.App && typeof App.loading === "function") {
            App.loading(true);
        }
    }

    function hideLoading() {
        loadingCounter--;
        if (loadingCounter <= 0) {
            loadingCounter = 0;
            if (window.App && typeof App.loading === "function") {
                App.loading(false);
            }
        }
    }

    // ==========================================
    // PARSE JSON SAFEGUARD
    // ==========================================
    async function parse(response) {
        try {
            if (!response) throw new Error("No response object");
            return await response.json();
        } catch (err) {
            warn("Gagal melakukan parse JSON server response:", err);
            return {
                success: false,
                message: "Server mengirimkan format respons yang tidak valid."
            };
        }
    }

    // ==========================================
    // FETCH WITH TIMEOUT
    // ==========================================
    async function fetchTimeout(url, options = {}) {
        const controller = new AbortController();
        const timeout = setTimeout(() => {
            controller.abort();
        }, TIMEOUT);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeout);
            return response;
        } catch (err) {
            clearTimeout(timeout);
            if (err.name === "AbortError") {
                throw new Error(`Koneksi terputus: Melebihi batas waktu ${TIMEOUT / 1000} detik.`);
            }
            throw err;
        }
    }

    // ==========================================
    // CENTRAL REQUEST ENGINE (POST & GET UNIFIED)
    // ==========================================
    async function request(method, action, payload = {}, retry = RETRY) {
        if (!navigator.onLine) {
            return {
                success: false,
                message: "Tidak ada koneksi internet. Silakan periksa jaringan Anda."
            };
        }

        showLoading();

        try {
            let fetchUrl = BASE_URL;
            const options = {
                method,
                cache: "no-store",
                headers: {}
            };

            // Auto Token Injection dari modul Auth
            if (window.Auth && typeof Auth.token === "function" && Auth.token()) {
                payload.token = Auth.token();
            }

            if (method === "POST") {
                options.headers["Content-Type"] = "text/plain;charset=utf-8";
                options.body = JSON.stringify({
                    action,
                    data: payload
                });
            } else {
                // Method GET: Memindahkan payload ke query URL params secara aman
                const params = new URLSearchParams({ action, ...payload });
                fetchUrl = `${BASE_URL}?${params.toString()}`;
            }

            info(`${method} Request ->`, action);
            const response = await fetchTimeout(fetchUrl, options);
            const result = await parse(response);

            // Auto Logout Terpusat jika Sesi Kedaluwarsa
            if (result?.message === "Session Expired" && window.Auth && typeof Auth.logout === "function") {
                warn("Sesi terdeteksi expired. Melakukan auto-logout...");
                await Auth.logout();
            }

            return result;
        } catch (err) {
            warn(`Request gagal (${method} : ${action}). Sisa retry: ${retry}. Error:`, err.message);

            if (retry > 0) {
                return await request(method, action, payload, retry - 1);
            }

            return {
                success: false,
                message: err.message || "Gagal menghubungi server."
            };
        } finally {
            hideLoading();
        }
    }

    // ==========================================
    // PUBLIC HTTP METHODS
    // ==========================================
    function post(action, data = {}) {
        return request("POST", action, data);
    }

    function get(action, data = {}) {
        return request("GET", action, data);
    }

    // ==========================================
    // SERVICE API SHORTCUTS
    // ==========================================
    const login     = payload => post("login", payload);
    const logout    = payload => post("logout", payload);
    const report    = payload => post("saveReport", payload);
    const history   = payload => post("getHistory", payload);
    const dashboard = payload => post("dashboard", payload);
    const workorder = payload => post("workorder", payload);
    const user      = payload => post("user", payload);
    const verify    = payload => post("verifySession", payload);
    const ping      = () => post("ping");

    // Facade API yang di-freeze demi keamanan runtime
    return Object.freeze({
        get,
        post,
        login,
        logout,
        report,
        history,
        dashboard,
        workorder,
        user,
        verify,
        ping
    });

})();
