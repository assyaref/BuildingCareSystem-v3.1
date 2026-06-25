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

        info(...args){

            BCS.Logger?.info?.(

                runtimeConfig.logPrefix,

                ...args

            );

        },

        warn(...args){

            BCS.Logger?.warn?.(

                runtimeConfig.logPrefix,

                ...args

            );

        },

        error(...args){

            BCS.Logger?.error?.(

                runtimeConfig.logPrefix,

                ...args

            );

        }

    };

    // ==========================================
    // STATE
    // ==========================================

    const createState = () => ({

        initialized:false,

        ready:false,

        install:false,

        update:false

    });

    const state = createState();

    // ==========================================
    // EXPORT BELOW
    // ==========================================

})();
    // ==========================================
    // MODULE REGISTRY
    // ==========================================

    const modules = {

        install: null,

        update: null

    };

    // ==========================================
    // UPDATE STATE
    // ==========================================

    function updateState(key, value) {

        state[key] = value;

        BCS.Events?.emit?.("pwa:state", {

            key,

            value,

            state: getState()

        });

    }

    function getState() {

        return {

            ...state

        };

    }

    // ==========================================
    // LOAD MODULES
    // ==========================================

    function loadModules() {

        modules.install =

            BCS.PWA?.Install ||

            window.PWAInstall ||

            null;

        modules.update =

            BCS.PWA?.Update ||

            window.PWAUpdate ||

            null;

        Logger.info(

            "Modules loaded",

            {

                install: !!modules.install,

                update: !!modules.update

            }

        );

    }

    // ==========================================
    // INIT MODULES
    // ==========================================

    async function initModules() {

        loadModules();

        if (modules.install?.init) {

            await modules.install.init();

            updateState(

                "install",

                true

            );

        }

        if (modules.update?.init) {

            await modules.update.init();

            updateState(

                "update",

                true

            );

        }

    }
    // ==========================================
    // INIT
    // ==========================================

    async function init(config = {}) {

        if (state.initialized) {

            return;

        }

        runtimeConfig = {

            ...runtimeConfig,

            ...config

        };

        Logger.info(

            "Initializing PWA..."

        );

        try {

            if (

                runtimeConfig.autoInitModules

            ) {

                await initModules();

            }

            updateState(

                "initialized",

                true

            );

            updateState(

                "ready",

                true

            );

            BCS.Events?.emit?.(

                "pwa:ready"

            );

            Logger.info(

                "PWA Ready"

            );

        }

        catch (err) {

            Logger.error(err);

            BCS.Events?.emit?.(

                "pwa:error",

                err

            );

            throw err;

        }

    }
