// ======================================================
// Building Care System Enterprise v4.5 (Refactored)
// Core API Framework & Provider Engine
// Radiant Group Duri
// ======================================================

"use strict";

/**
 * ======================================================
 * SYSTEM DEFAULT PROVIDERS (PROVIDER PATTERN)
 * ======================================================
 */

// Default Fetch Provider (Dapat digunakan untuk Laravel, Node, dll)
const FetchProvider = {
    async request(config) {
        const { url, method, headers, body, timeout, signal } = config;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout || 30000);
        
        if (signal) {
            signal.addEventListener('abort', () => controller.abort());
        }

        try {
            const fetchOptions = {
                method,
                headers,
                cache: "no-store",
                signal: controller.signal,
                body: method !== "GET" ? body : undefined
            };

            const response = await fetch(url, fetchOptions);
            clearTimeout(timeoutId);
            return response;
        } catch (err) {
            clearTimeout(timeoutId);
            throw err;
        }
    }
};

// Mock Provider untuk keperluan testing lokal tanpa backend
const MockProvider = {
    async request(config) {
        await new Promise(r => setTimeout(r, 500)); // Simulasi network delay
        const urlParams = new URL(config.url).searchParams;
        const action = config.method === "GET" ? urlParams.get("action") : JSON.parse(config.body || "{}").action;

        if (action === "ping") {
            return { ok: true, status: 200, json: async () => ({ success: true, message: "pong" }) };
        }
        return { ok: true, status: 200, json: async () => ({ success: true, data: {} }) };
    }
};


/**
 * ======================================================
 * CORE API FRAMEWORK
 * ======================================================
 */
const Api = (() => {

    // ==========================================
    // REKOMENDASI 1: BASE_URL VALIDATION
    // ==========================================
    const BASE_URL = window.CONFIG?.API?.URL || "";
    if (!BASE_URL) {
        throw new Error("CONFIG.API.URL belum dikonfigurasi.");
    }

    const TIMEOUT = window.CONFIG?.API?.TIMEOUT || 30000;
    const RETRY = window.CONFIG?.API?.RETRY || 2;

    let loadingCounter = 0;
    let currentProvider = FetchProvider; // Default Provider

    // Interceptor Storage (Axios Style)
    const interceptors = {
        request: [],
        response: []
    };

    // ==========================================
    // REKOMENDASI 7: ENHANCED LOGGER
    // ==========================================
    const isDebug = () => window.CONFIG?.DEBUG !== false;

    function info(logData) { 
        if (isDebug()) console.log("[API INFO]", { ...logData, time: new Date() }); 
    }
    function warn(...args) { if (isDebug()) console.warn("[API WARN]", ...args); }
    function error(...args) { if (isDebug()) console.error("[API ERROR]", ...args); }

    // ==========================================
    // REKOMENDASI 2: SAFE LOADING QUEUE
    // ==========================================
    function showLoading() {
        loadingCounter++;
        if (loadingCounter === 1 && window.App && typeof App.loading === "function") {
            App.loading(true);
        }
    }

    function hideLoading() {
        // Menggunakan Math.max untuk menghindari nilai negatif akibat race condition / throw
        loadingCounter = Math.max(0, loadingCounter - 1);
        if (loadingCounter === 0 && window.App && typeof App.loading === "function") {
            App.loading(false);
        }
    }

    // ==========================================
    // REKOMENDASI 6: OFFLINE & ONLINE DETECTION
    // ==========================================
    window.addEventListener("offline", () => {
        warn("Koneksi terputus. Aplikasi berjalan dalam mode Offline.");
        if (window.App && typeof App.toast === "function") {
            App.toast("📡 Anda sedang Offline. Beberapa fitur API mungkin tidak tersedia.", "danger");
        }
    });

    window.addEventListener("online", () => {
        info({ message: "Koneksi kembali terhubung. Mode Online." });
        if (window.App && typeof App.toast === "function") {
            App.toast("🟢 Anda kembali Online. Koneksi dipulihkan.", "success");
        }
    });

    // ==========================================
    // REKOMENDASI 4: RESPONSE STRUCTURE VALIDATION
    // ==========================================
    async function parse(response) {
        try {
            if (typeof response.json !== "function") return response; // Jika mock langsung return object
            const result = await response.json();
            
            if (!result || typeof result.success !== "boolean") {
                return {
                    success: false,
                    message: "Invalid API Format: Properti 'success' (boolean) tidak ditemukan."
                };
            }
            return result;
        } catch (err) {
            warn("Gagal melakukan parse respons data:", err);
            return {
                success: false,
                message: "Server mengirimkan format respons yang tidak valid (Bukan JSON)."
            };
        }
    }

    // ==========================================
    // CENTRAL PIPELINE REQUEST (WITH RETRY BACKOFF)
    // ==========================================
    async function requestEngine(method, action, payload = {}, retry = RETRY) {
        if (!navigator.onLine) {
            return {
                success: false,
                message: "Tidak ada koneksi internet. Silakan periksa jaringan Anda."
            };
        }

        showLoading();

        // Inisialisasi awal konfigurasi request (Bisa diubah oleh interceptor)
        let config = {
            url: BASE_URL,
            method,
            headers: method === "POST" ? { "Content-Type": "text/plain;charset=utf-8" } : {},
            payload: { ...payload },
            action,
            timeout: TIMEOUT
        };

        // 1. RUN REQUEST INTERCEPTORS
        for (const interceptor of interceptors.request) {
            config = interceptor(config) || config;
        }

        // Ambil token dari Auth jika payload belum memilikinya setelah interceptor berjalan
        if (!config.payload.token && window.Auth && typeof Auth.token === "function" && Auth.token()) {
            config.payload.token = Auth.token();
        }

        // Finalisasi skema payload ke bentuk format url atau body plain text
        if (config.method === "POST") {
            config.body = JSON.stringify({
                action: config.action,
                data: config.payload
            });
        } else {
            const params = new URLSearchParams({ action: config.action, ...config.payload });
            config.url = `${config.url}?${params.toString()}`;
        }

        try {
            // REKOMENDASI 7: Enhanced Log Format
            info({ method: config.method, action: config.action, payload: config.payload });

            // Eksekusi request via Provider Terpilih
            const response = await currentProvider.request(config);

            // REKOMENDASI 3: HTTP STATUS VALIDATION (404, 403, 500, dll)
            if (!response.ok) {
                return {
                    success: false,
                    status: response.status,
                    message: response.statusText || `HTTP Error ${response.status}`
                };
            }

            let result = await parse(response);

            // 2. RUN RESPONSE INTERCEPTORS
            for (const interceptor of interceptors.response) {
                result = interceptor(result) || result;
            }

            // Global Auto Logout Hook
            if (result?.message === "Session Expired" && window.Auth && typeof Auth.logout === "function") {
                warn("Sesi kedaluwarsa terdeteksi dari respons server. Memulai auto-logout...");
                await Auth.logout();
            }

            return result;
        } catch (err) {
            warn(`Request gagal (${method} : ${action}). Sisa retry: ${retry}. Error:`, err.message);

            if (retry > 0) {
                // REKOMENDASI 5: RETRY WITH EXPONENTIAL BACKOFF
                const delayMs = (RETRY - retry + 1) * 1000;
                info({ message: `Melakukan retry dalam ${delayMs}ms...` });
                await new Promise(resolve => setTimeout(resolve, delayMs));
                
                return await requestEngine(method, action, payload, retry - 1);
            }

            return {
                success: false,
                message: err.name === "AbortError" 
                    ? `Koneksi terputus: Melebihi batas waktu ${TIMEOUT / 1000} detik.` 
                    : err.message || "Gagal menghubungi server."
            };
        } finally {
            hideLoading();
        }
    }

    // ==========================================
    // INTERFACE MANAGEMENT & CORE METHODS
    // ==========================================
    function post(action, data = {}) { return requestEngine("POST", action, data); }
    function get(action, data = {})  { return requestEngine("GET", action, data); }

    // Menambahkan Interceptor Baru (Axios Style API)
    function use(interceptorObject) {
        if (interceptorObject.request) interceptors.request.push(interceptorObject.request);
        if (interceptorObject.response) interceptors.response.push(interceptorObject.response);
    }

    // Mengganti Driver/Provider Komunikasi Data (Provider Pattern)
    function setProvider(provider) {
        if (provider && typeof provider.request === "function") {
            currentProvider = provider;
            info({ message: "API Network Provider berhasil dialihkan." });
        } else {
            throw new Error("Provider yang didaftarkan harus memiliki fungsi 'request(config)'.");
        }
    }

    return {
        get,
        post,
        use,
        setProvider,
        providers: { FetchProvider, MockProvider }
    };

})();

/**
 * ======================================================
 * REKOMENDASI 8: ENTERPRISE SERVICE LAYER ARCHITECTURE
 * ======================================================
 */
const AuthService = {
    login: payload => Api.post("login", payload),
    logout: payload => Api.post("logout", payload),
    verify: payload => Api.post("verifySession", payload),
    ping: () => Api.post("ping")
};

const ReportService = {
    save: payload => Api.post("saveReport", payload),
    update: payload => Api.post("updateReport", payload),
    delete: payload => Api.post("deleteReport", payload),
    approve: payload => Api.post("approveReport", payload),
    reject: payload => Api.post("rejectReport", payload),
    upload: payload => Api.post("uploadReportAttachment", payload),
    getHistory: payload => Api.get("getHistory", payload)
};

const SystemService = {
    getDashboard: payload => Api.post("dashboard", payload),
    getWorkOrder: payload => Api.post("workorder", payload),
    getUserManagement: payload => Api.post("user", payload)
};

// Satukan ekspor dalam interface utama yang immutable
const BCS = Object.freeze({
    Api,
    AuthService,
    ReportService,
    SystemService
});

// Menjaga backward compatibility dengan skrip lama yang langsung memanggil Api.login() dll.
if (typeof window !== "undefined") {
    window.Api = Api;
    window.BCS = BCS;
}
