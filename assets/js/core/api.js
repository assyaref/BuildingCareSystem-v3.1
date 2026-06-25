// ======================================================
// Building Care System Enterprise v5.0 (Enterprise Framework)
// Core API Framework & Advanced Engine Pipeline
// Radiant Group Duri
// ======================================================

"use strict";

/**
 * ======================================================
 * SYSTEM CONTAINER SETUP (PERBAIKAN BUG 1 & BUG 2 FIXED)
 * ======================================================
 * Container global dikelola tanpa Object.freeze() pada root, 
 * sehingga aman diekspansi di sprint mendatang (misal: BCS.Storage).
 * Pembekuan (Object.freeze) diturunkan secara spesifik ke level modul.
 */
window.BCS = window.BCS || {};

/**
 * ======================================================
 * 1. ENTERPRISE EVENT BUS (PUB/SUB SYSTEM)
 * ======================================================
 */
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
        listeners[event].forEach(callback => {
            try { callback(data); } catch (e) { console.error(`[EVENT ERROR] ${event}:`, e); }
        });
    }

    return Object.freeze({ on, off, emit });
})();

/**
 * ======================================================
 * SYSTEM DEFAULT PROVIDERS & REGISTRY
 * ======================================================
 */
const FetchProvider = {
    async request(config) {
        const { url, method, headers, body, signal } = config;
        const fetchOptions = { method, headers, cache: "no-store", signal, body: method !== "GET" ? body : undefined };
        return await fetch(url, fetchOptions);
    }
};

const MockProvider = {
    async request(config) {
        await new Promise(r => setTimeout(r, 200));
        return { 
            ok: true, 
            status: 200, 
            headers: { get: () => "45" },
            json: async () => ({ success: true, message: "mock_pong", data: {} }) 
        };
    }
};

/**
 * ======================================================
 * 6. CHUNKED UPLOAD PROVIDER (RESUME & PROGRESS ENGINE)
 * ======================================================
 */
const UploadProvider = {
    async uploadChunked(file, action, options = {}) {
        const { chunkSize = 1024 * 1024, onProgress } = options; // Default chunk size 1MB
        const totalChunks = Math.ceil(file.size / chunkSize);
        let currentChunk = 0;
        let result = null;

        BCS.Events.emit("upload:start", { fileName: file.name, totalChunks });

        while (currentChunk < totalChunks) {
            const start = currentChunk * chunkSize;
            const end = Math.min(file.size, start + chunkSize);
            const chunk = file.slice(start, end);

            // Konversi chunk ke Base64 / ArrayBuffer sesuai skema text-plain backend BCS
            const reader = new FileReader();
            const chunkData = await new Promise((resolve) => {
                reader.onloadend = () => resolve(reader.result.split(",")[1]);
                reader.readAsDataURL(chunk);
            });

            const payload = {
                fileName: file.name,
                chunkIndex: currentChunk,
                totalChunks,
                data: chunkData
            };

            result = await Api.post(action, payload);

            if (!result || !result.success) {
                BCS.Events.emit("upload:error", { chunk: currentChunk, result });
                return result;
            }

            currentChunk++;
            if (typeof onProgress === "function") {
                onProgress({
                    percent: Math.round((currentChunk / totalChunks) * 100),
                    currentChunk,
                    totalChunks
                });
            }
        }

        BCS.Events.emit("upload:success", { file: file.name });
        return result;
    }
};

/**
 * ======================================================
 * CORE API ENGINE FRAMEWORK
 * ======================================================
 */
const Api = (() => {
    const BASE_URL = window.CONFIG?.API?.URL || "";
    if (!BASE_URL) throw new Error("CONFIG.API.URL belum dikonfigurasi.");

    const TIMEOUT = window.CONFIG?.API?.TIMEOUT || 30000;
    const RETRY = window.CONFIG?.API?.RETRY || 2;

    let loadingCounter = 0;
    const interceptors = { request: [], response: [] };

    // 5. Abort Duplicate Tracking Store
    const pendingRequests = new Map();

    // 8. Provider Registry Storage
    const providerRegistry = { fetch: FetchProvider, mock: MockProvider };
    let activeProvider = "fetch";

    // ==========================================
    // 3. CIRCUIT BREAKER STORAGE & STATE
    // ==========================================
    const circuitBreaker = {
        state: "CLOSED", // CLOSED, OPEN, HALF-OPEN
        failureCount: 0,
        failureThreshold: 3, // Buka sirkuit setelah 3x gagal berturut-turut
        cooldownWindow: 30000, // 30 detik durasi cooldown
        nextAttemptTime: 0
    };

    // ==========================================
    // 4. CACHE LAYER STORAGE
    // ==========================================
    const cacheStore = new Map();

    // ==========================================
    // LOGGER & UI HELPERS
    // ==========================================
    const isDebug = () => window.CONFIG?.DEBUG !== false;
    function info(logData) { if (isDebug()) console.log("[API INFO]", logData); }
    function warn(...args) { if (isDebug()) console.warn("[API WARN]", ...args); }

    function showLoading() {
        loadingCounter++;
        if (loadingCounter === 1 && window.App && typeof App.loading === "function") App.loading(true);
    }

    function hideLoading() {
        loadingCounter = Math.max(0, loadingCounter - 1);
        if (loadingCounter === 0 && window.App && typeof App.loading === "function") App.loading(false);
    }

    // ==========================================
    // PIPELINE ENGINE REQUEST
    // ==========================================
    async function requestEngine(method, action, payload = {}, retry = RETRY, cacheConfig = null) {
        // --- CHECK CACHE LAYER (GET ONLY) ---
        const cacheKey = `${method}:${action}:${JSON.stringify(payload)}`;
        if (method === "GET" && cacheConfig?.ttl) {
            const cached = cacheStore.get(cacheKey);
            if (cached && Date.now() < cached.expiresAt) {
                info({ message: "Returning Cached Response", action, cacheKey });
                return cached.data;
            }
        }

        // --- CHECK CIRCUIT BREAKER ---
        if (circuitBreaker.state === "OPEN") {
            if (Date.now() > circuitBreaker.nextAttemptTime) {
                circuitBreaker.state = "HALF-OPEN";
                warn("Circuit Breaker beralih ke HALF-OPEN. Mencoba tes request...");
            } else {
                BCS.Events.emit("api:circuit-open", { action, method });
                return { success: false, message: `Circuit is OPEN. Request diblokir sementara. Silakan coba lagi nanti.` };
            }
        }

        if (!navigator.onLine) {
            return { success: false, message: "Tidak ada koneksi internet." };
        }

        // --- 5. ABORT DUPLICATE REQUESTS ENGINE ---
        const requestFingerprint = `${method}:${action}`;
        if (pendingRequests.has(requestFingerprint)) {
            info({ message: "Aborting Duplicate Active Request", fingerprint: requestFingerprint });
            const oldController = pendingRequests.get(requestFingerprint);
            oldController.abort();
        }
        const currentController = new AbortController();
        pendingRequests.set(requestFingerprint, currentController);

        showLoading();
        const startTime = performance.now(); // Mulai hitung durasi metrics

        let config = {
            url: BASE_URL, method, timeout: TIMEOUT, action,
            headers: method === "POST" ? { "Content-Type": "text/plain;charset=utf-8" } : {},
            payload: { ...payload },
            signal: currentController.signal
        };

        // Run Interceptors Request
        for (const interceptor of interceptors.request) { config = interceptor(config) || config; }

        if (!config.payload.token && window.Auth?.token) { config.payload.token = Auth.token(); }

        if (config.method === "POST") {
            config.body = JSON.stringify({ action: config.action, data: config.payload });
        } else {
            const params = new URLSearchParams({ action: config.action, ...config.payload });
            config.url = `${config.url}?${params.toString()}`;
        }

        // Timeout controller wrapper link
        const timeoutId = setTimeout(() => currentController.abort(), config.timeout);

        try {
            const provider = providerRegistry[activeProvider] || FetchProvider;
            const response = await provider.request(config);
            clearTimeout(timeoutId);

            // Handle HTTP Status Validation
            if (!response.ok) {
                throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
            }

            // Parse & Validate Format JSON
            let result = await (typeof response.json === "function" ? response.json() : response);
            if (!result || typeof result.success !== "boolean") {
                result = { success: false, message: "Invalid API Format" };
            }

            // Run Interceptors Response
            for (const interceptor of interceptors.response) { result = interceptor(result) || result; }

            // --- RECOVERY CIRCUIT IF SUCCESS ---
            if (circuitBreaker.state === "HALF-OPEN" || circuitBreaker.state === "CLOSED") {
                circuitBreaker.state = "CLOSED";
                circuitBreaker.failureCount = 0;
            }

            // --- 2. METRICS GENERATION & LOGGING ---
            const duration = Math.round(performance.now() - startTime);
            const size = response.headers ? parseInt(response.headers.get("content-length") || "0", 10) : 0;
            
            info({
                message: `${config.method} ${config.action} -> ${response.status || 200} OK`,
                metrics: { duration: `${duration}ms`, size: `${size} bytes`, status: response.status || 200 },
                time: new Date()
            });

            // Write Cache Layer (If Configured)
            if (method === "GET" && cacheConfig?.ttl && result.success) {
                cacheStore.set(cacheKey, { data: result, expiresAt: Date.now() + cacheConfig.ttl });
            }

            BCS.Events.emit("api:success", { action: config.action, result });
            return result;

        } catch (err) {
            clearTimeout(timeoutId);
            const duration = Math.round(performance.now() - startTime);

            if (err.name === "AbortError") {
                // Jangan track sirkuit atau jalankan retry jika dibatalkan secara sengaja oleh duplicate controller
                if (!currentController.signal.aborted) {
                    return { success: false, message: `Request Timeout melebihi batas ${config.timeout / 1000}s.` };
                }
                return { success: false, message: "Request Aborted (Duplicate Safeguard)." };
            }

            // --- EXECUTING CIRCUIT BREAKER RULES ---
            circuitBreaker.failureCount++;
            warn(`Request Gagal. Kegagalan beruntun: ${circuitBreaker.failureCount}/${circuitBreaker.failureThreshold}`);
            
            if (circuitBreaker.failureCount >= circuitBreaker.failureThreshold) {
                circuitBreaker.state = "OPEN";
                circuitBreaker.nextAttemptTime = Date.now() + circuitBreaker.cooldownWindow;
                error(`[CIRCUIT BREAKER OPENED] Terlalu banyak kegagalan. Lock sistem selama ${circuitBreaker.cooldownWindow / 1000} detik.`);
            }

            // Exponential Backoff Retry Pipeline
            if (retry > 0 && circuitBreaker.state !== "OPEN") {
                const backoffDelay = (RETRY - retry + 1) * 1000;
                await new Promise(r => setTimeout(r, backoffDelay));
                return await requestEngine(method, action, payload, retry - 1, cacheConfig);
            }

            BCS.Events.emit("api:error", { action: config.action, error: err.message });
            return { success: false, duration, message: err.message || "Request Failed" };

        } finally {
            if (pendingRequests.get(requestFingerprint) === currentController) {
                pendingRequests.delete(requestFingerprint);
            }
            hideLoading();
        }
    }

    // ==========================================
    // MODULE INTERFACE EXPANSION
    // ==========================================
    return {
        post: (action, data = {}) => requestEngine("POST", action, data),
        get: (action, data = {}, cacheConfig = null) => requestEngine("GET", action, data, RETRY, cacheConfig),
        use: (obj) => {
            if (obj.request) interceptors.request.push(obj.request);
            if (obj.response) interceptors.response.push(obj.response);
        },
        // 8. Provider Registry Methods
        registerProvider: (name, provider) => {
            if (provider && typeof provider.request === "function") providerRegistry[name] = provider;
        },
        useProvider: (name) => {
            if (providerRegistry[name]) activeProvider = name;
        },
        upload: (file, action, options) => UploadProvider.uploadChunked(file, action, options),
        clearCache: () => cacheStore.clear()
    };
})();

// Pembekuan Modul Terisolasi untuk Keamanan Runtime (Bug 2 Fixed Layer)
Object.freeze(Api);

/**
 * ======================================================
 * 7. SERVICE REGISTRY ARCHITECTURE
 * ======================================================
 */
BCS.Services = (() => {
    const registry = new Map();

    return Object.freeze({
        register: (name, serviceInstance) => {
            registry.set(name, serviceInstance);
            if (isDebug()) console.log(`[SERVICE REGISTRY] Modul "${name}" berhasil terdaftar.`);
        },
        get: (name) => {
            if (!registry.has(name)) throw new Error(`Service "${name}" belum terdaftar di Core BCS.`);
            return registry.get(name);
        }
    });
})();

/**
 * ======================================================
 * CONCRETE DOMAIN SERVICES DEFINITIONS
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
    getHistory: payload => Api.get("getHistory", payload),
    // 6. Integrasi dengan UploadProvider Chunked Upload
    upload: (file, options) => Api.upload(file, "uploadReportAttachment", options)
};

const SystemService = {
    getDashboard: payload => Api.post("dashboard", payload),
    getWorkOrder: payload => Api.post("workorder", payload),
    getUserManagement: payload => Api.post("user", payload)
};

// Registrasikan Layanan secara dinamis ke Service Registry
BCS.Services.register("auth", AuthService);
BCS.Services.register("report", ReportService);
BCS.Services.register("system", SystemService);

// Kaitkan entitas inti framework ke Object Penampung BCS Global (Bug 1 & 2 Guard)
Object.assign(window.BCS, {
    Api,
    AuthService,
    ReportService,
    SystemService
});
