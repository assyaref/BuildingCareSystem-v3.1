// ======================================================
// Building Care System Enterprise v6.1 (CTO Level Framework)
// Core API Framework & Modular Core Plugin Architecture
// Radiant Group Duri
// ======================================================

"use strict";

/**
 * ======================================================
 * SYSTEM CONFIG & CONTAINERS SETUP (BUG 1 & BUG 2 SYSTEM GUARD)
 * ======================================================
 */
// PERBAIKAN 1: Definisi DEBUG di scope global teratas agar dapat diakses semua modul & registry
const DEBUG = window.CONFIG?.DEBUG !== false;

window.BCS = window.BCS || {};

/**
 * ======================================================
 * 1. ENHANCED EVENT BUS (PUB/SUB SYSTEM WITH ONCE METHOD)
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

    // PERBAIKAN 2: Penambahan metode once() untuk subscribe event satu kali eksekusi langsung otomatis mati
    function once(event, callback) {
        const handler = (data) => {
            off(event, handler);
            callback(data);
        };
        on(event, handler);
    }

    function emit(event, data) {
        if (!listeners[event]) return;
        listeners[event].forEach(callback => {
            try { callback(data); } catch (e) { console.error(`[EVENT ERROR] ${event}:`, e); }
        });
    }

    // FIX: Tambahkan emitAsync untuk kompatibilitas
    async function emitAsync(event, data) {
        emit(event, data);
        return Promise.resolve();
    }

    return Object.freeze({ on, off, once, emit, emitAsync });
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
            headers: { get: () => "0" },
            json: async () => ({ success: true, message: "mock_pong", data: {} }) 
        };
    }
};

/**
 * ======================================================
 * CHUNKED UPLOAD PROVIDER (RESUME & PROGRESS ENGINE)
 * ======================================================
 */
const UploadProvider = {
    async uploadChunked(file, action, options = {}) {
        const { chunkSize = 1024 * 1024, onProgress } = options;
        const totalChunks = Math.ceil(file.size / chunkSize);
        let currentChunk = 0;
        let result = null;

        BCS.Events.emit("upload:start", { fileName: file.name, totalChunks });

        while (currentChunk < totalChunks) {
            const start = currentChunk * chunkSize;
            const end = Math.min(file.size, start + chunkSize);
            const chunk = file.slice(start, end);

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

            result = await BCS.Api.post(action, payload);

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
    // FIX: Gunakan CONFIG dari global, bukan window.CONFIG?.API?.URL
    const BASE_URL = (typeof CONFIG !== 'undefined' && CONFIG.API?.URL) || 
                     (window.CONFIG?.API?.URL) || 
                     "https://script.google.com/macros/s/AKfycbzN3jSKv-RywufMhzub5SAbReV0ES31_4AMZP7Us4UxhskijtydQYpOWmPgCKQ9GmzH2w/exec";
    
    // Jangan throw error jika URL tidak ada, gunakan default
    if (!BASE_URL) throw new Error("CONFIG.API.URL belum dikonfigurasi.");

    const TIMEOUT = window.CONFIG?.API?.TIMEOUT || 30000;
    const RETRY = window.CONFIG?.API?.RETRY || 2;

    let loadingCounter = 0;
    const interceptors = { request: [], response: [] };
    const pendingRequests = new Map();
    const providerRegistry = { fetch: FetchProvider, mock: MockProvider };
    let activeProvider = "fetch";

    const circuitBreaker = {
        state: "CLOSED",
        failureCount: 0,
        failureThreshold: 3,
        cooldownWindow: 30000,
        nextAttemptTime: 0
    };

    const cacheStore = new Map();

    function info(logData) { if (DEBUG) console.log("[API INFO]", logData); }
    function warn(...args) { if (DEBUG) console.warn("[API WARN]", ...args); }
    function error(...args) { if (DEBUG) console.error("[API ERROR]", ...args); }

    function showLoading() {
        loadingCounter++;
        if (loadingCounter === 1 && window.App && typeof App.loading === "function") App.loading(true);
    }

    function hideLoading() {
        loadingCounter = Math.max(0, loadingCounter - 1);
        if (loadingCounter === 0 && window.App && typeof App.loading === "function") App.loading(false);
    }

    async function requestEngine(method, action, payload = {}, retry = RETRY, cacheConfig = null) {
        const cacheKey = `${method}:${action}:${JSON.stringify(payload)}`;
        if (method === "GET" && cacheConfig?.ttl) {
            const cached = cacheStore.get(cacheKey);
            if (cached && Date.now() < cached.expiresAt) {
                info({ message: "Returning Cached Response", action, cacheKey });
                return cached.data;
            }
        }

        if (circuitBreaker.state === "OPEN") {
            if (Date.now() > circuitBreaker.nextAttemptTime) {
                circuitBreaker.state = "HALF-OPEN";
                warn("Circuit Breaker beralih ke HALF-OPEN. Mencoba tes request...");
            } else {
                BCS.Events.emit("api:circuit-open", { action, method });
                return { success: false, message: `Circuit is OPEN. Request diblokir sementara.` };
            }
        }

        if (!navigator.onLine) {
            return { success: false, message: "Tidak ada koneksi internet." };
        }

        const requestFingerprint = `${method}:${action}`;
        if (pendingRequests.has(requestFingerprint)) {
            info({ message: "Aborting Duplicate Active Request", fingerprint: requestFingerprint });
            const oldController = pendingRequests.get(requestFingerprint);
            oldController.abort();
        }
        const currentController = new AbortController();
        pendingRequests.set(requestFingerprint, currentController);

        showLoading();
        const startTime = performance.now();

        let config = {
            url: BASE_URL, method, timeout: TIMEOUT, action,
            headers: method === "POST" ? { "Content-Type": "text/plain;charset=utf-8" } : {},
            payload: { ...payload },
            signal: currentController.signal
        };

        for (const interceptor of interceptors.request) { config = interceptor(config) || config; }

        if (!config.payload.token && window.Auth?.token) { config.payload.token = Auth.token(); }

        if (config.method === "POST") {
            config.body = JSON.stringify({ action: config.action, data: config.payload });
        } else {
            const params = new URLSearchParams({ action: config.action, ...config.payload });
            config.url = `${config.url}?${params.toString()}`;
        }

        const timeoutId = setTimeout(() => currentController.abort(), config.timeout);

        try {
            const provider = providerRegistry[activeProvider] || FetchProvider;
            const response = await provider.request(config);
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
            }

            let result = await (typeof response.json === "function" ? response.json() : response);
            if (!result || typeof result.success !== "boolean") {
                result = { success: false, message: "Invalid API Format" };
            }

            for (const interceptor of interceptors.response) { result = interceptor(result) || result; }

            if (circuitBreaker.state === "HALF-OPEN" || circuitBreaker.state === "CLOSED") {
                circuitBreaker.state = "CLOSED";
                circuitBreaker.failureCount = 0;
            }

            const duration = Math.round(performance.now() - startTime);
            const size = response.headers ? parseInt(response.headers.get("content-length") || "0", 10) : 0;
            
            info({
                message: `${config.method} ${config.action} -> ${response.status || 200} OK`,
                metrics: { duration: `${duration}ms`, size: `${size} bytes`, status: response.status || 200 },
                time: new Date()
            });

            if (method === "GET" && cacheConfig?.ttl && result.success) {
                cacheStore.set(cacheKey, { data: result, expiresAt: Date.now() + cacheConfig.ttl });
            }

            BCS.Events.emit("api:success", { action: config.action, result });
            return result;

        } catch (err) {
            clearTimeout(timeoutId);
            const duration = Math.round(performance.now() - startTime);

            if (err.name === "AbortError") {
                if (!currentController.signal.aborted) {
                    return { success: false, message: `Request Timeout melebihi batas ${config.timeout / 1000}s.` };
                }
                return { success: false, message: "Request Aborted (Duplicate Safeguard)." };
            }

            circuitBreaker.failureCount++;
            warn(`Request Gagal. Kegagalan beruntun: ${circuitBreaker.failureCount}/${circuitBreaker.failureThreshold}`);
            
            if (circuitBreaker.failureCount >= circuitBreaker.failureThreshold) {
                circuitBreaker.state = "OPEN";
                circuitBreaker.nextAttemptTime = Date.now() + circuitBreaker.cooldownWindow;
                error(`[CIRCUIT BREAKER OPENED] Lock sistem selama ${circuitBreaker.cooldownWindow / 1000} detik.`);
            }

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

    return {
        post: (action, data = {}) => requestEngine("POST", action, data),
        get: (action, data = {}, cacheConfig = null) => requestEngine("GET", action, data, RETRY, cacheConfig),
        use: (obj) => {
            if (obj.request) interceptors.request.push(obj.request);
            if (obj.response) interceptors.response.push(obj.response);
        },
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

// FIX: Assign ke BCS.Api agar bisa diakses global
window.BCS.Api = Api;
Object.freeze(Api);

/**
 * ======================================================
 * 3. ADVANCED SERVICE REGISTRY ARCHITECTURE
 * ======================================================
 */
BCS.Services = (() => {
    const registry = new Map();

    return Object.freeze({
        register: (name, serviceInstance) => {
            registry.set(name, serviceInstance);
            if (DEBUG) console.log(`[SERVICE REGISTRY] Modul "${name}" berhasil terdaftar.`);
        },
        get: (name) => {
            if (!registry.has(name)) throw new Error(`Service "${name}" belum terdaftar di Core BCS.`);
            return registry.get(name);
        },
        has: (name) => registry.has(name)
    });
})();

/**
 * ======================================================
 * INTERPRISE PLUGIN ENGINE SYSTEM (CORE EXTENSION POINT)
 * ======================================================
 */
BCS.use = (() => {
    const installedPlugins = new Set();

    return function use(plugin, options = {}) {
        if (!plugin || typeof plugin !== "object" && typeof plugin !== "function") {
            throw new Error("Plugin yang didaftarkan harus berbentuk Objek atau Fungsi.");
        }

        const pluginName = plugin.name || plugin.id || "AnonymousPlugin";

        if (installedPlugins.has(pluginName)) {
            if (DEBUG) console.warn(`[PLUGIN ENGINE] Plugin "${pluginName}" sudah terpasang.`);
            return BCS;
        }

        if (DEBUG) console.log(`[PLUGIN ENGINE] Memasang dan menginisialisasi plugin: "${pluginName}"...`);

        if (typeof plugin === "function") {
            plugin(BCS, options);
        } else if (typeof plugin.install === "function") {
            plugin.install(BCS, options);
        } else {
            throw new Error(`Plugin "${pluginName}" tidak menyediakan entrypoint install() atau callable constructor.`);
        }

        installedPlugins.add(pluginName);
        return BCS;
    };
})();

/**
 * ======================================================
 * INITIAL CORE CONCRETE DOMAIN SERVICES
 * ======================================================
 */
// FIX: Gunakan BCS.Api bukan Api
const AuthService = {
    login: payload => BCS.Api.post("login", payload),
    logout: payload => BCS.Api.post("logout", payload),
    verify: payload => BCS.Api.post("verifySession", payload),
    ping: () => BCS.Api.post("ping")
};

const ReportService = {
    save: payload => BCS.Api.post("saveReport", payload),
    update: payload => BCS.Api.post("updateReport", payload),
    delete: payload => BCS.Api.post("deleteReport", payload),
    approve: payload => BCS.Api.post("approveReport", payload),
    reject: payload => BCS.Api.post("rejectReport", payload),
    getHistory: payload => BCS.Api.get("getHistory", payload),
    upload: (file, options) => BCS.Api.upload(file, "uploadReportAttachment", options)
};

const SystemService = {
    getDashboard: payload => BCS.Api.post("dashboard", payload),
    getWorkOrder: payload => BCS.Api.post("workorder", payload),
    getUserManagement: payload => BCS.Api.post("user", payload)
};

// Auto-register core service bawaan sistem
BCS.Services.register("auth", AuthService);
BCS.Services.register("report", ReportService);
BCS.Services.register("system", SystemService);

// Bind entitas ke namespace BCS global penampung utama (Bug 1 & 2 Guard Safe Extensible)
Object.assign(window.BCS, {
    Api: BCS.Api,
    AuthService,
    ReportService,
    SystemService
});

// FIX: Tambahkan alias window.Api untuk kompatibilitas
window.Api = BCS.Api;

console.log("[BCS] Core API Framework initialized");
