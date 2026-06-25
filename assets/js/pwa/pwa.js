// ======================================================
// Building Care System Enterprise v10.0
// pwa.js
// Enterprise PWA Orchestrator
// Radiant Group Duri
// ======================================================

"use strict";

const PWA = (() => {

    // ==========================================
    // CONFIGURATION
    // ==========================================
    const DEFAULT_CONFIG = Object.freeze({
        debug: false,
        autoInitModules: true,
        logPrefix: "PWA"
    });

    let runtimeConfig = {
        ...DEFAULT_CONFIG
    };

    // ==========================================
    // LOGGER
    // ==========================================
    const Logger = {
        info(...args) {
            BCS.Logger?.info?.(runtimeConfig.logPrefix, ...args);
        },
        warn(...args) {
            BCS.Logger?.warn?.(runtimeConfig.logPrefix, ...args);
        },
        error(...args) {
            BCS.Logger?.error?.(runtimeConfig.logPrefix, ...args);
        }
    };

    // ==========================================
    // STATE
    // ==========================================
    const createState = () => ({
        initialized: false,
        ready: false,
        install: false,
        update: false
    });

    const state = createState();

    function getState() {
        return {
            ...state
        };
    }

    function setState(key, value) {
        if (!(key in state)) {
            Logger.warn(`Unknown state: ${key}`);
            return;
        }

        state[key] = value;

        BCS.Events?.emit?.("pwa:state", {
            key,
            value,
            state: getState()
        });
    }

    // ==========================================
    // MODULE REGISTRY
    // ==========================================
    const modules = Object.seal({
        install: null,
        update: null
    });

    // ==========================================
    // MODULE LOADER & INITIALIZER
    // ==========================================
    function loadModules() {
        // Hanya menggunakan BCS.PWA, tanpa fallback window
        modules.install = BCS.PWA?.Install ?? null;
        modules.update = BCS.PWA?.Update ?? null;

        if (!modules.install) {
            Logger.warn("Install module belum terdaftar.");
        }
        if (!modules.update) {
            Logger.warn("Update module belum terdaftar.");
        }

        Logger.info("Module Registry", {
            install: !!modules.install,
            update: !!modules.update
        });
    }

    async function initModules() {
        loadModules();

        if (modules.install?.init) {
            Logger.info("Initialize Install Module");
            await modules.install.init();
            setState("install", true);
        }

        if (modules.update?.init) {
            Logger.info("Initialize Update Module");
            await modules.update.init();
            setState("update", true);
        }

        // Validasi ready state berdasarkan status modul
        const ready = state.install && state.update;
        setState("ready", ready);
        
        if (!ready) {
            Logger.warn("PWA tidak sepenuhnya ready - salah satu modul gagal init");
        }
    }

    // ==========================================
    // PUBLIC INITIALIZATION
    // ==========================================
    async function init(config = {}) {
        if (state.initialized) {
            Logger.warn("PWA sudah diinisialisasi");
            return;
        }

        // Validasi EventBus
        if (!BCS.Events) {
            Logger.warn("BCS.Events belum tersedia. Event akan tidak berfungsi.");
        }

        runtimeConfig = {
            ...runtimeConfig,
            ...config
        };

        Logger.info("Initializing PWA...");

        try {
            if (runtimeConfig.autoInitModules) {
                await initModules();
            }

            setState("initialized", true);

            BCS.Events?.emit?.("pwa:ready");
            Logger.info("PWA Ready", getState());
        } catch (err) {
            Logger.error(err);
            BCS.Events?.emit?.("pwa:error", err);
            throw err;
        }
    }

    // ==========================================
    // DESTROY
    // ==========================================
    function destroy() {
        Logger.info("Destroying PWA...");

        // Destroy modules jika memiliki method destroy
        if (modules.install?.destroy) {
            modules.install.destroy();
        }
        if (modules.update?.destroy) {
            modules.update.destroy();
        }

        // Reset state
        Object.assign(state, createState());

        // Clear module references
        modules.install = null;
        modules.update = null;

        BCS.Events?.emit?.("pwa:destroy");
        Logger.info("PWA destroyed");
    }

    // ==========================================
    // FACADE API
    // ==========================================
    function install() {
        if (!modules.install) {
            Logger.warn("Install module tidak tersedia");
            return Promise.reject(new Error("Install module not available"));
        }
        return modules.install.install?.() ?? Promise.resolve();
    }

    function checkUpdate() {
        if (!modules.update) {
            Logger.warn("Update module tidak tersedia");
            return Promise.reject(new Error("Update module not available"));
        }
        return modules.update.check?.() ?? Promise.resolve();
    }

    function reload() {
        if (!modules.update) {
            Logger.warn("Update module tidak tersedia");
            return;
        }
        return modules.update.reload?.();
    }

    function skipWaiting() {
        if (!modules.update) {
            Logger.warn("Update module tidak tersedia");
            return Promise.reject(new Error("Update module not available"));
        }
        return modules.update.skipWaiting?.() ?? Promise.resolve();
    }

    // ==========================================
    // EXPORT PUBLIC API (FROZEN)
    // ==========================================
    return Object.freeze({
        init,
        destroy,
        getState,
        install,
        checkUpdate,
        reload,
        skipWaiting
    });

})();
