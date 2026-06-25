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
        // Mencari di BCS.PWA terlebih dahulu, fallback ke window jika diperlukan
        modules.install = BCS.PWA?.Install ?? window.PWAInstall ?? null;
        modules.update = BCS.PWA?.Update ?? window.PWAUpdate ?? null;

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
    }

    // ==========================================
    // PUBLIC INITIALIZATION
    // ==========================================
    async function init(config = {}) {
        if (state.initialized) {
            return;
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
            setState("ready", true);

            BCS.Events?.emit?.("pwa:ready");
            Logger.info("PWA Ready");
        } catch (err) {
            Logger.error(err);
            BCS.Events?.emit?.("pwa:error", err);
            throw err;
        }
    }

    // ==========================================
    // EXPORT PUBLIC API
    // ==========================================
    return {
        init,
        getState
    };

})();
