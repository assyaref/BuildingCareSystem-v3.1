// ======================================================
// Building Care System Enterprise v7.0 (CTO Master Edition)
// Ultimate Core Enterprise Framework & Registry Engine
// Radiant Group Duri
// ======================================================

"use strict";

// Inisialisasi Root Namespace aman dari Overwrite (Extension Guard)
window.BCS = window.BCS || {};

/**
 * ======================================================
 * FRAMEWORK VERSION MANAGEMENT
 * ======================================================
 */
BCS.version = Object.freeze({
    framework: "1.0.0",
    auth: "6.0",
    api: "7.0",
    app: "7.0"
});

/**
 * ======================================================
 * 4. ENTERPRISE LEVEL LOGGER (BCS.Logger)
 * ======================================================
 */
BCS.Logger = (() => {
    const LEVELS = { TRACE: 0, DEBUG: 1, INFO: 2, WARN: 3, ERROR: 4, OFF: 5 };
    let currentLevel = window.CONFIG?.LOG_LEVEL ? LEVELS[window.CONFIG.LOG_LEVEL.toUpperCase()] : LEVELS.INFO;

    function shouldLog(level) {
        return LEVELS[level] >= currentLevel;
    }

    function setLevel(levelName) {
        const upper = levelName.toUpperCase();
        if (LEVELS[upper] !== undefined) {
            currentLevel = LEVELS[upper];
            console.log(`%c[LOGGER] Level diubah ke: ${upper}`, "color: #7f8c8d; font-weight: bold;");
        }
    }

    return Object.freeze({
        trace: (tag, ...args) => { if (shouldLog("TRACE")) console.log(`%c[TRACE:${tag.toUpperCase()}]`, "color:#95a5a6;", ...args); },
        debug: (tag, ...args) => { if (shouldLog("DEBUG")) console.log(`%c[DEBUG:${tag.toUpperCase()}]`, "color:#2980b9;", ...args); },
        info:  (tag, ...args) => { if (shouldLog("INFO"))  console.log(`%c[INFO:${tag.toUpperCase()}]`,  "color:#0d6efd; font-weight:bold;", ...args); },
        warn:  (tag, ...args) => { if (shouldLog("WARN"))  console.warn(`%c[WARN:${tag.toUpperCase()}]`,  "color:#ffc107; font-weight:bold;", ...args); },
        error: (tag, ...args) => { if (shouldLog("ERROR")) console.error(`%c[ERROR:${tag.toUpperCase()}]`, "color:#dc3545; font-weight:bold;", ...args); },
        setLevel
    });
})();

/**
 * ======================================================
 * 2. ASYNCHRONOUS EVENT BUS SYSTEM (BCS.Events)
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
            try { callback(data); } catch (e) { BCS.Logger.error("Events", `Handler error pada event ${event}:`, e); }
        });
    }

    // Penambahan emitAsync() untuk mendukung penanganan awaitable tasks (upload/sinkronisasi paralel)
    async function emitAsync(event, data) {
        if (!listeners[event]) return;
        BCS.Logger.trace("Events", `Memicu Asynchronous Event: ${event}`);
        const promises = listeners[event].map(async (callback) => {
            try {
                await callback(data);
            } catch (e) {
                BCS.Logger.error("Events", `Async Handler error pada event ${event}:`, e);
            }
        });
        await Promise.all(promises);
    }

    return Object.freeze({ on, off, once, emit, emitAsync });
})();

/**
 * ======================================================
 * 3. MULTI-PROVIDER STORAGE LAYER (BCS.Storage)
 * ======================================================
 */
BCS.Storage = (() => {
    // Memory Provider Fallback
    const memoryStore = new Map();
    const MemoryProvider = {
        set: (k, v) => { memoryStore.set(k, v); return true; },
        get: (k) => memoryStore.get(k) || null,
        remove: (k) => memoryStore.delete(k),
        clear: () => memoryStore.clear()
    };

    const LocalProvider = {
        set: (k, v) => { localStorage.setItem(k, JSON.stringify(v)); return true; },
        get: (k) => { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; },
        remove: (k) => localStorage.removeItem(k),
        clear: () => localStorage.clear()
    };

    const SessionProvider = {
        set: (k, v) => { sessionStorage.setItem(k, JSON.stringify(v)); return true; },
        get: (k) => { const v = sessionStorage.getItem(k); return v ? JSON.parse(v) : null; },
        remove: (k) => sessionStorage.removeItem(k),
        clear: () => sessionStorage.clear()
    };

    const providers = { local: LocalProvider, session: SessionProvider, memory: MemoryProvider };
    let activeDriver = "local";

    function setDriver(driverName) {
        if (providers[driverName]) {
            activeDriver = driverName;
            BCS.Logger.trace("Storage", `Driver dialihkan ke: ${driverName}`);
        }
    }

    return Object.freeze({
        setDriver,
        set: (key, value) => providers[activeDriver].set(key, value),
        get: (key) => providers[activeDriver].get(key),
        remove: (key) => providers[activeDriver].remove(key),
        clear: () => providers[activeDriver].clear(),
        
        // Shortcut utility session terenkapsulasi
        setSession: (data) => providers.session.set("BCS_SESSION", data),
        getSession: () => providers.session.get("BCS_SESSION"),
        removeSession: () => providers.session.remove("BCS_SESSION")
    });
})();

/**
 * ======================================================
 * UTILITIES EXTENSION LAYER (BCS.Utils)
 * ======================================================
 */
BCS.Utils = (() => {
    return Object.freeze({
        delay: (ms = 300) => new Promise(res => setTimeout(res, ms)),
        uuid: () => Date.now().toString(36) + Math.random().toString(36).substring(2),
        clone: (obj) => typeof structuredClone === "function" ? structuredClone(obj) : JSON.parse(JSON.stringify(obj))
    });
})();

/**
 * ======================================================
 * 10. ENTERPRISE COMPONENT LIFECYCLE REGISTRY
 * ======================================================
 */
BCS.Components = (() => {
    const registry = new Map();

    return Object.freeze({
        register: (name, componentFactory) => {
            registry.set(name, componentFactory);
            BCS.Logger.trace("Registry", `Component Blueprint [${name}] Terdaftar.`);
        },
        create: (name, elementSelector, options = {}) => {
            if (!registry.has(name)) throw new Error(`Component [${name}] belum terdaftar.`);
            const factory = registry.get(name);
            const instance = typeof factory === "function" ? factory(elementSelector, options) : Object.create(factory);
            if (instance.init) instance.init(elementSelector, options);
            return instance;
        },
        destroy: (instance) => {
            if (instance && typeof instance.destroy === "function") {
                instance.destroy();
                BCS.Logger.trace("Registry", "Component Instance Berhasil Di-destroy.");
            }
        }
    });
})();

/**
 * ======================================================
 * 11. ENTERPRISE MODULE LIFECYCLE REGISTRY
 * ======================================================
 */
BCS.Modules = (() => {
    const modules = new Map();
    const activeInstances = new Map();

    return Object.freeze({
        register: (name, moduleDefinition) => {
            modules.set(name, moduleDefinition);
            BCS.Logger.trace("Registry", `Module [${name}] Berhasil Terdaftar.`);
        },
        init: async (name, options = {}) => {
            if (!modules.has(name)) return;
            if (activeInstances.has(name)) return activeInstances.get(name);

            const mod = modules.get(name);
            BCS.Logger.debug("Registry", `Memulai Lifecycle Init Module: ${name}`);
            if (mod.beforeInit) await mod.beforeInit(options);
            if (mod.init) await mod.init(options);
            if (mod.afterInit) await mod.afterInit(options);
            
            activeInstances.set(name, mod);
            return mod;
        },
        destroy: async (name) => {
            if (!activeInstances.has(name)) return;
            const mod = activeInstances.get(name);
            if (mod.destroy) await mod.destroy();
            activeInstances.delete(name);
            BCS.Logger.debug("Registry", `Module [${name}] Dieksekusi Keluar & Terbakar.`);
        }
    });
})();

/**
 * ======================================================
 * ENTERPRISE APP UI COMPONENTS (BCS.App.*)
 * ======================================================
 */
BCS.App = (() => {
    let loadingCounter = 0;

    const Loading = Object.freeze({
        show: () => {
            loadingCounter++;
            const loader = document.getElementById("loading");
            if (loader) loader.style.display = "flex";
        },
        hide: () => {
            loadingCounter = Math.max(0, loadingCounter - 1);
            if (loadingCounter === 0) {
                const loader = document.getElementById("loading");
                if (loader) loader.style.display = "none";
            }
        }
    });

    const Toast = Object.freeze({
        fire: (msg, icon) => {
            if (typeof Swal !== "undefined") {
                Swal.fire({ toast: true, position: "top-end", icon, title: msg, timer: 2000, showConfirmButton: false });
            } else {
                BCS.Logger.info("Toast", `[${icon.toUpperCase()}] ${msg}`);
            }
        },
        success: (m) => Toast.fire(m, "success"),
        warning: (m) => Toast.fire(m, "warning"),
        danger:  (m) => Toast.fire(m, "error"),
        info:    (m) => Toast.fire(m, "info")
    });

    const Dialog = Object.freeze({
        alert: (title, text, icon = "info") => typeof Swal !== "undefined" ? Swal.fire({ title, text, icon }) : window.alert(text),
        confirm: (title, text) => {
            if (typeof Swal !== "undefined") {
                return Swal.fire({ title, text, icon: "question", showCancelButton: true }).then(r => !!r.isConfirmed);
            }
            return Promise.resolve(window.confirm(text));
        }
    });

    // 6. NATIVE BOOTSTRAP CONTROLLED MODAL ENGINE
    const Modal = Object.freeze({
        open: (id) => {
            const el = document.getElementById(id);
            if (!el) return;
            if (typeof bootstrap !== "undefined" && bootstrap.Modal) {
                let modalInstance = bootstrap.Modal.getInstance(el) || new bootstrap.Modal(el);
                modalInstance.show();
            } else {
                el.style.display = "block";
            }
            BCS.Logger.trace("App", `Modal Open: #${id}`);
        },
        close: (id) => {
            const el = document.getElementById(id);
            if (!el) return;
            if (typeof bootstrap !== "undefined" && bootstrap.Modal) {
                const modalInstance = bootstrap.Modal.getInstance(el);
                if (modalInstance) modalInstance.hide();
            } else {
                el.style.display = "none";
            }
        }
    });

    const Navigate = Object.freeze({
        go: (page) => {
            if (!page || window.location.pathname.split("/").pop() === page) return;
            BCS.Logger.debug("App", `Redirecting => ${page}`);
            window.location.replace(page);
        }
    });

    // 5. THEME SYSTEM IMPLEMENTATION (LIGHT, DARK, SYSTEM)
    const Theme = (() => {
        function apply(themeName) {
            const root = document.documentElement;
            let targetTheme = themeName;
            
            if (themeName === "system") {
                targetTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
            }
            
            root.setAttribute("data-bs-theme", targetTheme); // Jalur bootstrap 5.3+ native dark mode
            root.className = `theme-${targetTheme}`;
            BCS.Storage.set("BCS_THEME", themeName);
            BCS.Logger.trace("App", `Tema diterapkan: ${themeName}`);
        }

        return Object.freeze({
            set: (type) => apply(type),
            init: () => {
                const saved = BCS.Storage.get("BCS_THEME") || "system";
                apply(saved);
                if (saved === "system") {
                    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => apply("system"));
                }
            }
        });
    })();

    // 7. SECURE CLIPBOARD PROVIDER WITH FALLBACK
    const Clipboard = Object.freeze({
        copy: async (text) => {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                try {
                    await navigator.clipboard.writeText(text);
                    return true;
                } catch (e) { /* fallback if blocked */ }
            }
            // Fallback ExecCommand Legacy
            const textArea = document.createElement("textarea");
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            const success = document.execCommand("copy");
            document.body.removeChild(textArea);
            return success;
        }
    });

    // 8. UNIFIED INDUSTRIAL DOWNLOAD ENGINE
    const Download = Object.freeze({
        blob: (content, filename, mimeType) => {
            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        },
        json: (obj, filename) => Download.blob(JSON.stringify(obj, null, 2), filename, "application/json"),
        csv: (csvString, filename) => Download.blob(csvString, filename, "text/csv;charset=utf-8;")
    });

    // 9. CROSS-BROWSER FULLSCREEN CONTROLLER
    const Fullscreen = Object.freeze({
        toggle: (element = document.documentElement) => {
            if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
                if (element.requestFullscreen) element.requestFullscreen();
                else if (element.webkitRequestFullscreen) element.webkitRequestFullscreen();
                else if (element.msRequestFullscreen) element.msRequestFullscreen();
            } else {
                if (document.exitFullscreen) document.exitFullscreen();
                else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
                else if (document.msExitFullscreen) document.msExitFullscreen();
            }
        }
    });

    const Notify = Object.freeze({ push: () => {} });
    const Skeleton = Object.freeze({ render: () => {} });
    const Progress = Object.freeze({ set: () => {} });

    return Object.freeze({
        initEventSubscribers: () => {
            BCS.Events.on("loading:start", Loading.show);
            BCS.Events.on("loading:end", Loading.hide);
        },
        Loading, Toast, Dialog, Modal, Navigate, Theme, Clipboard, Download, Fullscreen, Notify, Skeleton, Progress
    });
})();

/**
 * ======================================================
 * 1. LIFECYCLE GLOBAL BOOTSTRAP (BCS.bootstrap)
 * ======================================================
 */
BCS.bootstrap = (() => {
    let initialized = false;

    return async function bootstrap() {
        if (initialized) return;
        initialized = true;

        // Pipeline Urutan Jalur Lifecycle Framework 
        await BCS.Events.emitAsync("system:before-bootstrap");
        
        BCS.Logger.info("System", `Initializing Framework Components [v${BCS.version.framework}]`);
        BCS.App.initEventSubscribers();
        BCS.App.Theme.init();

        await BCS.Events.emitAsync("system:bootstrap");
        await BCS.Events.emitAsync("system:after-bootstrap");
        
        // Final State Ready
        await BCS.Events.emitAsync("system:ready");
        BCS.Logger.info("System", "Ecosystem Bootstrap Lifecycle Fully Loaded.");
    };
})();

/**
 * ======================================================
 * AUTOMATIC LIFECYCLE TRIGGER
 * ======================================================
 */
document.addEventListener("DOMContentLoaded", () => {
    BCS.bootstrap();
});
