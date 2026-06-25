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
