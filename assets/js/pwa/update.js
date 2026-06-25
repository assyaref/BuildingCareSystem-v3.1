// ======================================================
// Building Care System Enterprise v10.0
// update.js
// Enterprise Update Manager
// Radiant Group Duri
// ======================================================

"use strict";

const PWAUpdate = (() => {

    // ==========================================
    // 1. CONFIGURATION
    // ==========================================

    const DEFAULT_CONFIG = Object.freeze({

        debug: false,

        checkOnInit: true,

        autoReload: false,

        logPrefix: "PWA.Update"

    });

    let runtimeConfig = {

        ...DEFAULT_CONFIG

    };

    // ==========================================
    // 2. LOGGER
    // ==========================================

    const Logger = {

        info(...args) {

            BCS.Logger?.info?.(

                runtimeConfig.logPrefix,

                ...args

            );

        },

        warn(...args) {

            BCS.Logger?.warn?.(

                runtimeConfig.logPrefix,

                ...args

            );

        },

        error(...args) {

            BCS.Logger?.error?.(

                runtimeConfig.logPrefix,

                ...args

            );

        }

    };

    // ==========================================
    // 3. STATE FACTORY
    // ==========================================

    const createState = () => ({

        initialized: false,

        checking: false,

        updateAvailable: false,

        installing: false,

        waiting: false,

        activated: false,

        controller: null,

        registration: null,

        version: null

    });

    // ==========================================
    // 4. STATE
    // ==========================================

    const state = createState();

    // ==========================================
    // 5. EVENT REGISTRY
    // ==========================================

    const eventRegistry = {

        listeners: [],

        add(target, event, handler, options = {}) {

            if (!target) return;

            target.addEventListener(

                event,

                handler,

                options

            );

            this.listeners.push({

                target,

                event,

                handler,

                options

            });

        },

        removeAll() {

            this.listeners.forEach(item => {

                item.target.removeEventListener(

                    item.event,

                    item.handler,

                    item.options

                );

            });

            this.listeners = [];

        }

    };

