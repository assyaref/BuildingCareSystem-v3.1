// ======================================================
// Building Care System Enterprise v7.0 (CTO Master Edition)
// Ultimate Core Enterprise Framework & Registry Engine
// Radiant Group Duri
// ======================================================

"use strict";

window.BCS = window.BCS || {};

/**
 * ======================================================
 * 1. FRAMEWORK MANIFEST & VERSION MANAGEMENT
 * ======================================================
 */
BCS.manifest = Object.freeze({
    name: "BCS Enterprise",
    version: "1.0.0",
    author: "Radiant Group",
    environment: window.CONFIG?.ENV || "production",
    build: "2026.06.25",
    modules: ["Auth", "Api", "Storage", "Logger", "Events", "Components", "Modules", "Router", "Validator", "Store"]
});

BCS.version = Object.freeze({
    framework: BCS.manifest.version,
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

    function shouldLog(level) { return LEVELS[level] >= currentLevel; }
    function getLevelName() { return Object.keys(LEVELS).find(key => LEVELS[key] === currentLevel); }

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
        setLevel,
        getLevelName
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
        const handler = (data) => { off(event, handler); callback(data); };
        on(event, handler);
    }

    function emit(event, data) {
        if (!listeners[event]) return;
        listeners[event].forEach(callback => {
            try { callback(data); } catch (e) { BCS.Logger.error("Events", `Handler error pada event ${event}:`, e); }
        });
    }

    async function emitAsync(event, data) {
        if (!listeners[event]) return;
        BCS.Logger.trace("Events", `Memicu Asynchronous Event: ${event}`);
        const promises = listeners[event].map(async (callback) => {
            try { await callback(data); } catch (e) { BCS.Logger.error("Events", `Async Handler error pada event ${event}:`, e); }
        });
        await Promise.all(promises);
    }

    function getListenerCount() {
        return Object.keys(listeners).reduce((acc, key) => acc + listeners[key].length, 0);
    }

    return Object.freeze({ on, off, once, emit, emitAsync, getListenerCount });
})();

/**
 * ======================================================
 * 3 & 10. MULTI-PROVIDER STORAGE LAYER (BCS.Storage & IndexedDB)
 * ======================================================
 */
BCS.Storage = (() => {
    const memoryStore = new Map();
    const MemoryProvider = {
        set: (k, v) => { memoryStore.set(k, v); return true; },
        get: (k) => memoryStore.get(k) || null,
        remove: (k) => memoryStore.delete(k),
        clear: () => { memoryStore.clear(); return true; }
    };

    const LocalProvider = {
        set: (k, v) => { localStorage.setItem(k, JSON.stringify(v)); return true; },
        get: (k) => { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; },
        remove: (k) => localStorage.removeItem(k),
        clear: () => { localStorage.clear(); return true; }
    };

    const SessionProvider = {
        set: (k, v) => { sessionStorage.setItem(k, JSON.stringify(v)); return true; },
        get: (k) => { const v = sessionStorage.getItem(k); return v ? JSON.parse(v) : null; },
        remove: (k) => sessionStorage.removeItem(k),
        clear: () => { sessionStorage.clear(); return true; }
    };

    // PWA-Ready IndexedDB Provider (Asynchronous Wrapper)
    const DB_NAME = "BCS_Enterprise_DB";
    const STORE_NAME = "key_value_pairs";
    
    const getDB = () => new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });

    const IndexedDbProvider = {
        set: async (k, v) => {
            const db = await getDB();
            return new Promise((resolve) => {
                const tx = db.transaction(STORE_NAME, "readwrite");
                tx.objectStore(STORE_NAME).put(v, k);
                tx.oncomplete = () => resolve(true);
            });
        },
        get: async (k) => {
            const db = await getDB();
            return new Promise((resolve) => {
                const tx = db.transaction(STORE_NAME, "readonly");
                const req = tx.objectStore(STORE_NAME).get(k);
                req.onsuccess = () => resolve(req.result || null);
            });
        },
        remove: async (k) => {
            const db = await getDB();
            return new Promise((resolve) => {
                const tx = db.transaction(STORE_NAME, "readwrite");
                tx.objectStore(STORE_NAME).delete(k);
                tx.oncomplete = () => resolve(true);
            });
        },
        clear: async () => {
            const db = await getDB();
            return new Promise((resolve) => {
                const tx = db.transaction(STORE_NAME, "readwrite");
                tx.objectStore(STORE_NAME).clear();
                tx.oncomplete = () => resolve(true);
            });
        }
    };

    const providers = { local: LocalProvider, session: SessionProvider, memory: MemoryProvider, idb: IndexedDbProvider };
    let activeDriver = "local";

    function setDriver(driverName) {
        if (providers[driverName]) {
            activeDriver = driverName;
            BCS.Logger.trace("Storage", `Driver dialihkan ke: ${driverName}`);
        }
    }

    return Object.freeze({
        setDriver,
        getActiveDriver: () => activeDriver,
        set: (key, value) => providers[activeDriver].set(key, value),
        get: (key) => providers[activeDriver].get(key),
        remove: (key) => providers[activeDriver].remove(key),
        clear: () => providers[activeDriver].clear(),
        setSession: (data) => providers.session.set("BCS_SESSION", data),
        getSession: () => providers.session.get("BCS_SESSION"),
        removeSession: () => providers.session.remove("BCS_SESSION")
    });
})();

/**
 * ======================================================
 * 9. STATE MANAGEMENT (BCS.Store)
 * ======================================================
 */
BCS.Store = (() => {
    const state = new Map();

    return Object.freeze({
        set: (key, value) => { state.set(key, value); BCS.Events.emit(`store:changed:${key}`, value); },
        get: (key) => state.get(key) || null,
        has: (key) => state.has(key),
        remove: (key) => { const res = state.delete(key); BCS.Events.emit(`store:removed:${key}`); return res; },
        clear: () => state.clear(),
        getAll: () => Object.fromEntries(state)
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
 * 7. UTILITY ROUTER (BCS.Router)
 * ======================================================
 */
BCS.Router = (() => {
    let historyStack = BCS.Storage.get("BCS_ROUTER_HISTORY") || [];
    
    function trackNavigation() {
        const currentPath = window.location.pathname + window.location.search;
        if (historyStack[historyStack.length - 1] !== currentPath) {
            historyStack.push(currentPath);
            if (historyStack.length > 10) historyStack.shift(); // Batasi cache history 10 entri
            BCS.Storage.set("BCS_ROUTER_HISTORY", historyStack);
        }
    }

    return Object.freeze({
        init: () => {
            trackNavigation();
            window.addEventListener("popstate", trackNavigation);
        },
        current: () => window.location.pathname + window.location.search,
        previous: () => historyStack[historyStack.length - 2] || null,
        getHistory: () => [...historyStack]
    });
})();

/**
 * ======================================================
 * 8. RULE-CHAINING VALIDATOR (BCS.Validator)
 * ======================================================
 */
BCS.Validator = (() => {
    const rules = {
        required: (val) => val !== undefined && val !== null && val.toString().trim() !== "",
        nik: (val) => /^\d{16}$/.test(val),
        min: (val, len) => String(val).length >= parseInt(len, 10),
        max: (val, len) => String(val).length <= parseInt(len, 10),
        regex: (val, expr) => {
            const matches = expr.match(/^\/(.*)\/([gimy]*)$/);
            const nativeReg = matches ? new RegExp(matches[1], matches[2]) : new RegExp(expr);
            return nativeReg.test(val);
        }
    };

    return Object.freeze({
        validate: (value, ruleChain) => {
            const errors = [];
            for (const rule of ruleChain) {
                let ruleName = rule;
                let param = null;

                if (rule.includes(":")) {
                    [ruleName, param] = rule.split(":");
                }

                if (rules[ruleName]) {
                    const isValid = rules[ruleName](value, param);
                    if (!isValid) {
                        errors.push(`Gagal validasi aturan: ${rule}`);
                    }
                } else {
                    BCS.Logger.warn("Validator", `Aturan [${ruleName}] tidak ditemukan.`);
                }
            }
            return { valid: errors.length === 0, errors };
        }
    });
})();

/**
 * ======================================================
 * 5. ADVANCED COMPONENT LIFECYCLE REGISTRY
 * ======================================================
 */
BCS.Components = (() => {
    const registry = new Map();
    const activeComponents = new Set();

    return Object.freeze({
        register: (name, componentFactory) => {
            registry.set(name, componentFactory);
            BCS.Logger.trace("Registry", `Component Blueprint [${name}] Terdaftar.`);
        },
        create: async (name, elementSelector, options = {}) => {
            if (!registry.has(name)) throw new Error(`Component [${name}] belum terdaftar.`);
            const factory = registry.get(name);
            const instance = typeof factory === "function" ? factory(elementSelector, options) : Object.create(factory);
            
            // Sequential Lifecycle Execution
            if (instance.beforeCreate) await instance.beforeCreate(options);
            if (instance.create) await instance.create(options);
            if (instance.mount) await instance.mount(elementSelector);
            
            instance.__meta = { name, selector: elementSelector };
            activeComponents.add(instance);
            return instance;
        },
        update: async (instance, newData) => {
            if (instance && typeof instance.update === "function") {
                await instance.update(newData);
                BCS.Logger.trace("Registry", `Component Instance [${instance.__meta?.name}] Diperbarui.`);
            }
        },
        destroy: async (instance) => {
            if (instance && typeof instance.destroy === "function") {
                await instance.destroy();
                activeComponents.delete(instance);
                BCS.Logger.trace("Registry", `Component Instance [${instance.__meta?.name || "Unknown"}] Berhasil Di-destroy.`);
            }
        },
        getActiveCount: () => activeComponents.size,
        getActiveComponents: () => Array.from(activeComponents).map(c => c.__meta?.name)
    });
})();

/**
 * ======================================================
 * 6. ADVANCED MODULE LIFECYCLE REGISTRY
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
            
            BCS.Logger.debug("Registry", `Memulai Pembongkaran Lifecycle Module: ${name}`);
            if (mod.beforeDestroy) await mod.beforeDestroy();
            if (mod.destroy) await mod.destroy();
            if (mod.afterDestroy) await mod.afterDestroy();
            
            activeInstances.delete(name);
            BCS.Logger.debug("Registry", `Module [${name}] Dieksekusi Keluar & Terbakar.`);
        },
        getRunningModules: () => Array.from(activeInstances.keys())
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

    const Theme = (() => {
        function apply(themeName) {
            const root = document.documentElement;
            let targetTheme = themeName;
            
            if (themeName === "system") {
                targetTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
            }
            
            root.setAttribute("data-bs-theme", targetTheme);
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

    const Clipboard = Object.freeze({
        copy: async (text) => {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                try { await navigator.clipboard.writeText(text); return true; } catch (e) { }
            }
            const textArea = document.createElement("textarea");
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            const success = document.execCommand("copy");
            document.body.removeChild(textArea);
            return success;
        }
    });

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
 * 2, 3, 4. TELEMETRY, HEALTH ENGINE, DIAGNOSTICS & DEVTOOLS
 * ======================================================
 */
BCS.health = () => {
    return [
        { Core: "Framework", Status: "OK" },
        { Core: "Logger", Status: BCS.Logger ? "OK" : "FAILED" },
        { Core: "Storage", Status: BCS.Storage ? "OK" : "FAILED" },
        { Core: "Api", Status: BCS.version.api ? "OK" : "FAILED" },
        { Core: "Events", Status: BCS.Events ? "OK" : "FAILED" },
        { Core: "Router", Status: BCS.Router ? "OK" : "FAILED" },
        { Core: "Module", Status: BCS.Modules ? "OK" : "FAILED" }
    ];
};

BCS.diagnostics = () => {
    return {
        "Storage Driver": BCS.Storage.getActiveDriver(),
        "Logger Level": BCS.Logger.getLevelName(),
        "Memory (State Count)": BCS.Store.getAll(),
        "Plugin/Manifest": BCS.manifest.name,
        "Active Components Count": BCS.Components.getActiveCount(),
        "Running Modules": BCS.Modules.getRunningModules(),
        "Current Route": BCS.Router.current(),
        "Previous Route": BCS.Router.previous(),
        "Total Active Event Listeners": BCS.Events.getListenerCount()
    };
};

BCS.dev = () => {
    console.group("%c🛠️ BCS ENTERPRISE DEVTOOLS 🛠️", "color: #2c3e50; font-size: 14px; font-weight: bold;");
    console.log("%c[Framework Version]", "color: #2980b9; font-weight: bold;", BCS.version);
    console.log("%c[Plugin/Manifest]", "color: #16a085; font-weight: bold;", BCS.manifest);
    console.log("%c[Running Modules]", "color: #8e44ad; font-weight: bold;", BCS.Modules.getRunningModules());
    console.log("%c[Storage State]", "color: #d35400; font-weight: bold;", { current_driver: BCS.Storage.getActiveDriver() });
    console.log("%c[State/Store Entries]", "color: #27ae60; font-weight: bold;", BCS.Store.getAll());
    console.log("%c[Active Components]", "color: #c0392b; font-weight: bold;", BCS.Components.getActiveComponents());
    console.log("%c[Event Router Status]", "color: #f39c12; font-weight: bold;", { current: BCS.Router.current(), prev: BCS.Router.previous() });
    console.groupEnd();
};

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

        await BCS.Events.emitAsync("system:before-bootstrap");
        
        BCS.Logger.info("System", `Initializing Framework Components [v${BCS.version.framework}]`);
        BCS.App.initEventSubscribers();
        BCS.App.Theme.init();
        BCS.Router.init(); // Aktifkan router tracker

        await BCS.Events.emitAsync("system:bootstrap");
        await BCS.Events.emitAsync("system:after-bootstrap");
        
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
