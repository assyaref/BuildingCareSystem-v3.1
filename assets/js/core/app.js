// ======================================================
// Building Care System Enterprise v8.0 (Master Architect)
// Ultimate Front-End Enterprise Framework Core
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
    api: "8.0",
    app: "8.0"
});

/**
 * ======================================================
 * 7. CONFIGURATION MANAGER (BCS.Config)
 * ======================================================
 */
BCS.Config = (() => {
    const internalConfig = window.BCS_CONFIG || window.CONFIG || {};

    return Object.freeze({
        get: (path, defaultValue = null) => {
            return path.split('.').reduce((acc, part) => {
                return (acc && acc[part] !== undefined) ? acc[part] : defaultValue;
            }, internalConfig);
        },
        has: (path) => {
            return path.split('.').reduce((acc, part) => {
                return (acc && acc[part] !== undefined) ? acc[part] : undefined;
            }, internalConfig) !== undefined;
        }
    });
})();

const DEBUG = BCS.Config.get("DEBUG", true);

/**
 * ======================================================
 * ENTERPRISE LEVEL LOGGER (BCS.Logger)
 * ======================================================
 */
BCS.Logger = (() => {
    const LEVELS = { TRACE: 0, DEBUG: 1, INFO: 2, WARN: 3, ERROR: 4, OFF: 5 };
    let currentLevel = LEVELS[BCS.Config.get("LOG_LEVEL", "INFO").toUpperCase()] || LEVELS.INFO;

    function shouldLog(level) { return LEVELS[level] >= currentLevel; }

    return Object.freeze({
        trace: (tag, ...args) => { if (shouldLog("TRACE")) console.log(`%c[TRACE:${tag.toUpperCase()}]`, "color:#95a5a6;", ...args); },
        debug: (tag, ...args) => { if (shouldLog("DEBUG")) console.log(`%c[DEBUG:${tag.toUpperCase()}]`, "color:#2980b9;", ...args); },
        info:  (tag, ...args) => { if (shouldLog("INFO"))  console.log(`%c[INFO:${tag.toUpperCase()}]`,  "color:#0d6efd; font-weight:bold;", ...args); },
        warn:  (tag, ...args) => { if (shouldLog("WARN"))  console.warn(`%c[WARN:${tag.toUpperCase()}]`,  "color:#ffc107; font-weight:bold;", ...args); },
        error: (tag, ...args) => { if (shouldLog("ERROR")) console.error(`%c[ERROR:${tag.toUpperCase()}]`, "color:#dc3545; font-weight:bold;", ...args); },
        setLevel: (name) => { if (LEVELS[name.toUpperCase()] !== undefined) currentLevel = LEVELS[name.toUpperCase()]; }
    });
})();

/**
 * ======================================================
 * 8. GLOBAL ERROR BOUNDARY ENGINE (BCS.Error)
 * ======================================================
 */
BCS.Error = (() => {
    const handlers = new Set();

    function handle(err, context = "Global") {
        BCS.Logger.error("ErrorBoundary", `Terjadi kesalahan pada [${context}]:`, err.message || err);
        handlers.forEach(handler => {
            try { handler(err, context); } catch (e) { console.error("Critical Failure di Error Handler:", e); }
        });
        BCS.Events.emit("system:error", { error: err, context });
    }

    return Object.freeze({
        handle,
        registerHandler: (fn) => handlers.add(fn),
        removeHandler: (fn) => handlers.delete(fn)
    });
})();

// Intersepsi error runtime tidak tertangkap di level window global
window.addEventListener("error", (event) => BCS.Error.handle(event.error || event.message, "WindowOnError"));
window.addEventListener("unhandledrejection", (event) => BCS.Error.handle(event.reason, "UnhandledPromiseRejection"));

/**
 * ======================================================
 * ASYNCHRONOUS EVENT BUS SYSTEM (BCS.Events)
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

    return Object.freeze({
        on, off,
        once: (event, callback) => {
            const handler = (data) => { off(event, handler); callback(data); };
            on(event, handler);
        },
        emit: (event, data) => {
            if (!listeners[event]) return;
            listeners[event].forEach(cb => { try { cb(data); } catch (e) { BCS.Error.handle(e, `Event:${event}`); } });
        },
        emitAsync: async (event, data) => {
            if (!listeners[event]) return;
            const promises = listeners[event].map(async (cb) => {
                try { await cb(data); } catch (e) { BCS.Error.handle(e, `AsyncEvent:${event}`); }
            });
            await Promise.all(promises);
        }
    });
})();

/**
 * ======================================================
 * 2. INVERSION OF CONTROL (IoC) DEPENDENCY CONTAINER (BCS.Container)
 * ======================================================
 */
BCS.Container = (() => {
    const dependencies = new Map();

    return Object.freeze({
        register: (name, definition, isSingleton = true) => {
            dependencies.set(name, { definition, isSingleton, instance: null });
            BCS.Logger.trace("Container", `Dependensi [${name}] terdaftar ke IoC Engine.`);
        },
        resolve: (name) => {
            if (!dependencies.has(name)) throw new Error(`IoC Dependency [${name}] tidak dapat ditemukan.`);
            const dep = dependencies.get(name);
            
            if (dep.isSingleton) {
                if (!dep.instance) {
                    dep.instance = typeof dep.definition === "function" ? dep.definition() : dep.definition;
                }
                return dep.instance;
            }
            return typeof dep.definition === "function" ? dep.definition() : dep.definition;
        },
        clear: () => dependencies.clear()
    });
})();

/**
 * ======================================================
 * 1. LIFECYCLE-AWARE PLUGIN REGISTRY (BCS.Plugin)
 * ======================================================
 */
BCS.Plugin = (() => {
    const activePlugins = new Map();

    return Object.freeze({
        install: async (name, pluginObject, options = {}) => {
            if (activePlugins.has(name)) return;
            BCS.Logger.debug("Plugin", `Menginstal plugin: ${name}`);
            
            if (pluginObject.beforeInstall) await pluginObject.beforeInstall(BCS, options);
            if (pluginObject.install) await pluginObject.install(BCS, options);
            
            activePlugins.set(name, pluginObject);
            BCS.Logger.trace("Plugin", `Plugin [${name}] aktif.`);
        },
        remove: async (name) => {
            if (!activePlugins.has(name)) return;
            const plugin = activePlugins.get(name);
            if (plugin.uninstall) await plugin.uninstall(BCS);
            activePlugins.delete(name);
            BCS.Logger.warn("Plugin", `Plugin [${name}] dilepas.`);
        },
        list: () => Array.from(activePlugins.keys())
    });
})();

/**
 * ======================================================
 * MULTI-PROVIDER STORAGE LAYER (BCS.Storage)
 * ======================================================
 */
BCS.Storage = (() => {
    const memoryStore = new Map();
    const MemoryProvider = {
        set: (k, v) => memoryStore.set(k, v), get: (k) => memoryStore.get(k) || null, remove: (k) => memoryStore.delete(k)
    };
    const LocalProvider = {
        set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
        get: (k) => { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; },
        remove: (k) => localStorage.removeItem(k)
    };
    const SessionProvider = {
        set: (k, v) => sessionStorage.setItem(k, JSON.stringify(v)),
        get: (k) => { const v = sessionStorage.getItem(k); return v ? JSON.parse(v) : null; },
        remove: (k) => sessionStorage.removeItem(k)
    };

    const providers = { local: LocalProvider, session: SessionProvider, memory: MemoryProvider };
    let activeDriver = "local";

    return Object.freeze({
        setDriver: (name) => { if (providers[name]) activeDriver = name; },
        set: (k, v) => providers[activeDriver].set(k, v),
        get: (k) => providers[activeDriver].get(k),
        remove: (k) => providers[activeDriver].remove(k)
    });
})();

/**
 * ======================================================
 * 3. MIDDLEWARE NAVIGATION ROUTER (BCS.Router)
 * ======================================================
 */
BCS.Router = (() => {
    const routes = new Map();
    const beforeGuards = new Set();
    const afterGuards = new Set();

    return Object.freeze({
        register: (path, config = {}) => routes.set(path, config),
        beforeEach: (fn) => beforeGuards.add(fn),
        afterEach: (fn) => afterGuards.add(fn),
        go: async (path) => {
            BCS.Logger.debug("Router", `Mencoba navigasi ke: ${path}`);
            const toRoute = routes.get(path) || { path };
            const fromRoute = { path: window.location.pathname.split("/").pop() };

            // Jalankan Before Guards Pipeline
            for (const guard of beforeGuards) {
                const proceed = await guard(toRoute, fromRoute);
                if (proceed === false) {
                    BCS.Logger.warn("Router", `Navigasi ke [${path}] diblokir oleh guard middleware.`);
                    return;
                }
            }

            // Eksekusi Perpindahan Halaman
            if (window.location.pathname.split("/").pop() !== path) {
                window.location.replace(path);
            }

            // Jalankan After Guards Pipeline
            for (const guard of afterGuards) { guard(toRoute, fromRoute); }
        }
    });
})();

/**
 * ======================================================
 * 4. PERFORMANCE TASK SCHEDULER ENGINE (BCS.Task)
 * ======================================================
 */
BCS.Task = (() => {
    return Object.freeze({
        debounce: (fn, delay = 300) => {
            let timer;
            return (...args) => {
                clearTimeout(timer);
                timer = setTimeout(() => fn(...args), delay);
            };
        },
        throttle: (fn, limit = 300) => {
            let inThrottle;
            return (...args) => {
                if (!inThrottle) {
                    fn(...args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },
        queue: () => {
            const tasks = [];
            let running = false;
            const next = async () => {
                if (tasks.length === 0) { running = false; return; }
                running = true;
                const currentTask = tasks.shift();
                try { await currentTask(); } catch (e) { BCS.Error.handle(e, "TaskQueue"); }
                next();
            };
            return {
                add: (fn) => { tasks.push(fn); if (!running) next(); }
            };
        }
    });
})();

/**
 * ======================================================
 * 5. DATA VALIDATION ENGINE (BCS.Validator)
 * ======================================================
 */
BCS.Validator = (() => {
    const rules = {
        required: (v) => (v !== undefined && v !== null && v.toString().trim() !== "") || "Kolom wajib diisi.",
        email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || "Format surel tidak valid.",
        number: (v) => !isNaN(parseFloat(v)) && isFinite(v) || "Harus berupa nilai numerik.",
        phone: (v) => /^[0-9+]{9,15}$/.test(v) || "Nomor telepon tidak valid.",
        nik: (v) => /^[0-9]{16}$/.test(v) || "NIK harus tepat 16 digit angka."
    };

    return Object.freeze({
        validate: (value, ruleList) => {
            for (const rule of ruleList) {
                const check = typeof rule === "string" ? rules[rule] : rule;
                if (check) {
                    const res = check(value);
                    if (res !== true) return res; // Kembalikan string pesan error pertama yang gagal
                }
            }
            return true;
        },
        extend: (name, fn) => { rules[name] = fn; }
    });
})();

/**
 * ======================================================
 * 6. REACTIVE STATE WATCHER STORAGE (BCS.Store)
 * ======================================================
 */
BCS.Store = (() => {
    const state = new Map();
    const watchers = new Map();

    return Object.freeze({
        set: (key, value) => {
            const oldValue = state.get(key);
            if (JSON.stringify(oldValue) === JSON.stringify(value)) return;
            
            state.set(key, value);
            BCS.Logger.trace("Store", `State [${key}] bermutasi.`);
            
            if (watchers.has(key)) {
                watchers.get(key).forEach(callback => {
                    try { callback(value, oldValue); } catch (e) { BCS.Error.handle(e, `StoreWatcher:${key}`); }
                });
            }
        },
        get: (key, fallback = null) => state.has(key) ? state.get(key) : fallback,
        watch: (key, callback) => {
            if (!watchers.has(key)) watchers.set(key, new Set());
            watchers.get(key).add(callback);
            return () => watchers.get(key).delete(callback); // Return unsubscribe unwatch hook
        }
    });
})();

/**
 * ======================================================
 * COMPONENT & MODULE REGISTRY (BCS.Components & BCS.Modules)
 * ======================================================
 */
BCS.Components = (() => {
    const registry = new Map();
    return Object.freeze({
        register: (name, comp) => registry.set(name, comp),
        create: (name, sel, opts = {}) => {
            const comp = registry.get(name);
            if (!comp) return null;
            const inst = typeof comp === "function" ? comp(sel, opts) : Object.create(comp);
            if (inst.init) inst.init(sel, opts);
            return inst;
        }
    });
})();

BCS.Modules = (() => {
    const modules = new Map();
    const instances = new Map();
    return Object.freeze({
        register: (name, mod) => modules.set(name, mod),
        init: async (name, opts = {}) => {
            if (!modules.has(name) || instances.has(name)) return;
            const mod = modules.get(name);
            if (mod.beforeInit) await mod.beforeInit(opts);
            if (mod.init) await mod.init(opts);
            instances.set(name, mod);
        },
        destroy: async (name) => {
            if (!instances.has(name)) return;
            const mod = instances.get(name);
            if (mod.destroy) await mod.destroy();
            instances.delete(name);
        }
    });
})();

/**
 * ======================================================
 * RUNTIME APPLICATION UI WRAPPER ENGINE (BCS.App)
 * ======================================================
 */
BCS.App = (() => {
    let loadingCounter = 0;
    const Loading = {
        show: () => { loadingCounter++; const el = document.getElementById("loading"); if (el) el.style.display = "flex"; },
        hide: () => { loadingCounter = Math.max(0, loadingCounter - 1); if (loadingCounter === 0) { const el = document.getElementById("loading"); if (el) el.style.display = "none"; } }
    };
    const Toast = {
        fire: (msg, icon) => { if (typeof Swal !== "undefined") Swal.fire({ toast: true, position: "top-end", icon, title: msg, timer: 2000, showConfirmButton: false }); },
        success: (m) => Toast.fire(m, "success"), danger: (m) => Toast.fire(m, "error")
    };
    return Object.freeze({
        initEventSubscribers: () => { BCS.Events.on("loading:start", Loading.show); BCS.Events.on("loading:end", Loading.hide); },
        Loading, Toast,
        Dialog: { alert: (t, txt) => window.alert(txt) },
        Modal: { open: (id) => { const el = document.getElementById(id); if (el) el.style.display = "block"; } }
    });
})();

/**
 * ======================================================
 * DEPENDENCY INJECTION REGISTER INITIALIZER
 * ======================================================
 */
BCS.Container.register("Storage", BCS.Storage);
BCS.Container.register("Events", BCS.Events);
BCS.Container.register("Config", BCS.Config);
BCS.Container.register("Logger", BCS.Logger);

/**
 * ======================================================
 * FRAMEWORK ECOSYSTEM LIFECYCLE BOOTSTRAP
 * ======================================================
 */
BCS.bootstrap = (() => {
    let initialized = false;

    return async function bootstrap() {
        if (initialized) return;
        initialized = true;

        try {
            await BCS.Events.emitAsync("system:before-bootstrap");
            BCS.Logger.info("System", `Booting Engine Core v${BCS.version.framework}`);
            
            BCS.App.initEventSubscribers();

            await BCS.Events.emitAsync("system:bootstrap");
            await BCS.Events.emitAsync("system:after-bootstrap");
            await BCS.Events.emitAsync("system:ready");
        } catch (err) {
            BCS.Error.handle(err, "FrameworkBootstrap");
        }
    };
})();

document.addEventListener("DOMContentLoaded", BCS.bootstrap);
