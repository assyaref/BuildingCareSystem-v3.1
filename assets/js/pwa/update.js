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

        logPrefix: "PWA.Update",

        // Throttle configuration
        checkThrottle: 60000, // 1 minute minimum between checks

        maxRetries: 3,

        retryDelay: 1000

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

        },

        debug(...args) {

            if (runtimeConfig.debug) {

                BCS.Logger?.debug?.(

                    runtimeConfig.logPrefix,

                    ...args

                );

            }

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

        version: null,

        lifecyclePhase: 'idle', // idle | checking | found | installing | installed | waiting | activated

        retryCount: 0,

        lastCheck: null

    });

    // ==========================================
    // 4. STATE
    // ==========================================

    let state = createState();

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

        },

        remove(target, event, handler) {

            if (!target) return;

            target.removeEventListener(event, handler);

            this.listeners = this.listeners.filter(item =>

                !(item.target === target &&

                  item.event === event &&

                  item.handler === handler)

            );

        }

    };

    // ==========================================
    // 6. LIFECYCLE MANAGER
    // ==========================================

    const Lifecycle = {

        /**
         * Initialize service worker lifecycle
         */
        async init() {

            try {

                // Check if service worker is supported

                if (!('serviceWorker' in navigator)) {

                    Logger.warn('Service Worker not supported');

                    return;

                }

                // Get current registration

                const registration = await navigator.serviceWorker.getRegistration();

                if (registration) {

                    state.registration = registration;

                    state.controller = navigator.serviceWorker.controller;

                    // Get version from BCS config or manifest

                    state.version = this._getVersion();

                }

                // Setup service worker lifecycle listeners

                this._setupLifecycleListeners();

                state.initialized = true;

                Logger.info('Lifecycle manager initialized');

                // Initial update check

                if (runtimeConfig.checkOnInit) {

                    await UpdateEngine.check();

                }

            } catch (error) {

                Logger.error('Lifecycle initialization failed:', error);

                throw error;

            }

        },

        /**
         * Get version from BCS config or manifest
         */
        _getVersion() {

            // Priority 1: BCS config
            if (typeof BCS !== 'undefined' && BCS.config?.version) {

                return BCS.config.version;

            }

            // Priority 2: Manifest
            try {

                const manifest = document.querySelector('link[rel="manifest"]');

                if (manifest && manifest.href) {

                    // Fetch manifest to get version
                    // This is simplified - in production you'd cache this
                    const manifestUrl = manifest.href;

                    // Return a hash or use manifest URL as version
                    return manifestUrl.split('/').pop() || null;

                }

            } catch (error) {

                Logger.debug('Could not read manifest:', error);

            }

            // Priority 3: Meta tag
            try {

                const metaVersion = document.querySelector('meta[name="version"]');

                if (metaVersion) {

                    return metaVersion.getAttribute('content');

                }

            } catch (error) {

                Logger.debug('Could not read meta version:', error);

            }

            return null;

        },

        /**
         * Setup lifecycle event listeners
         */
        _setupLifecycleListeners() {

            // Service worker registration event

            navigator.serviceWorker.addEventListener(

                'controllerchange',

                this._handleControllerChange.bind(this)

            );

            // Service worker message events

            navigator.serviceWorker.addEventListener(

                'message',

                this._handleMessage.bind(this)

            );

            // Handle registration events

            if (state.registration) {

                // Check if registration already has waiting worker

                if (state.registration.waiting) {

                    this._handleWaiting(state.registration.waiting);

                }

                // Listen for updates

                this._observeRegistration(state.registration);

            }

        },

        /**
         * Observe registration for updates
         */
        _observeRegistration(registration) {

            // Check for new service worker

            if (registration.installing) {

                this._handleInstalling(registration.installing);

            }

            if (registration.waiting) {

                this._handleWaiting(registration.waiting);

            }

            if (registration.active) {

                this._handleActive(registration.active);

            }

            // Listen for update found

            registration.addEventListener(

                'updatefound',

                this._handleUpdateFound.bind(this)

            );

        },

        /**
         * Handle update found event
         */
        _handleUpdateFound(event) {

            const registration = event.target || state.registration;

            Logger.info('Update found for service worker');

            state.updateAvailable = true;

            state.lifecyclePhase = 'found';

            this._emit('pwa:update-found', {

                registration,

                version: state.version

            });

            // Track the new service worker

            const newWorker = registration.installing;

            if (newWorker) {

                this._handleInstalling(newWorker);

            }

        },

        /**
         * Handle installing service worker
         */
        _handleInstalling(worker) {

            Logger.info('Service worker installing');

            state.lifecyclePhase = 'installing';

            this._emit('pwa:update-installing', {

                worker,

                registration: state.registration

            });

            // Listen for state changes on installing worker

            worker.addEventListener('statechange', () => {

                if (worker.state === 'installed') {

                    this._handleInstalled(worker);

                }

            });

        },

        /**
         * Handle installed service worker
         */
        _handleInstalled(worker) {

            Logger.info('Service worker installed');

            state.lifecyclePhase = 'installed';

            this._emit('pwa:update-installed', {

                worker,

                registration: state.registration,

                version: state.version

            });

            // Check if waiting

            if (worker.state === 'installed' &&

                navigator.serviceWorker.controller) {

                // New worker is waiting

                this._handleWaiting(worker);

            }

        },

        /**
         * Handle waiting service worker
         */
        _handleWaiting(worker) {

            Logger.info('Service worker waiting');

            state.waiting = true;

            state.lifecyclePhase = 'waiting';

            state.controller = worker;

            this._emit('pwa:update-ready', {

                worker,

                registration: state.registration,

                version: state.version

            });

            // Auto-install if configured

            if (runtimeConfig.autoReload) {

                Logger.info('Auto-installing waiting worker');

                UpdateEngine.install();

            }

        },

        /**
         * Handle active service worker
         */
        _handleActive(worker) {

            Logger.info('Service worker activated');

            state.activated = true;

            state.waiting = false;

            state.lifecyclePhase = 'activated';

            state.controller = worker;

            this._emit('pwa:update-activated', {

                worker,

                registration: state.registration,

                version: state.version

            });

        },

        /**
         * Handle controller change
         */
        _handleControllerChange(event) {

            Logger.info('Service worker controller changed');

            const newController = navigator.serviceWorker.controller;

            if (newController) {

                state.controller = newController;

                // Check if new controller is active

                if (newController.state === 'activated') {

                    this._handleActive(newController);

                }

                // Reload if auto-reload enabled

                if (runtimeConfig.autoReload && state.updateAvailable) {

                    Logger.info('Reloading due to controller change');

                    UpdateEngine.reload();

                }

            }

        },

        /**
         * Handle service worker messages
         */
        _handleMessage(event) {

            Logger.debug('Service worker message received:', event.data);

            const { type, payload } = event.data || {};

            switch (type) {

                case 'UPDATE_AVAILABLE':

                    Logger.info('Update available notification from SW');

                    this._emit('pwa:update-found', payload);

                    break;

                case 'UPDATE_ACTIVATED':

                    Logger.info('Update activated notification from SW');

                    this._emit('pwa:update-activated', payload);

                    break;

                default:

                    Logger.debug('Unknown message type:', type);

            }

        },

        /**
         * Emit event through BCS event system if available
         */
        _emit(eventType, data = {}) {

            const eventData = {

                type: eventType,

                data,

                state: { ...state },

                timestamp: Date.now()

            };

            // Use BCS Events if available
            if (typeof BCS !== 'undefined' && BCS.Events) {

                BCS.Events.emit(eventType, eventData);

                Logger.debug(`Event emitted via BCS.Events: ${eventType}`);

                return;

            }

            // Fallback to CustomEvent
            const customEvent = new CustomEvent(eventType, {

                detail: eventData,

                bubbles: true,

                cancelable: true

            });

            document.dispatchEvent(customEvent);

            Logger.debug(`Event dispatched: ${eventType}`);

        }

    };

    // ==========================================
    // 7. UPDATE ENGINE
    // ==========================================

    const UpdateEngine = {

        /**
         * Check for updates with throttling
         */
        async check() {

            // Throttle check
            if (state.lastCheck && 

                Date.now() - state.lastCheck < runtimeConfig.checkThrottle) {

                Logger.debug('Update check throttled');

                return false;

            }

            if (state.checking) {

                Logger.debug('Update check already in progress');

                return false;

            }

            if (!state.registration) {

                Logger.warn('No service worker registration found');

                return false;

            }

            state.checking = true;

            state.lifecyclePhase = 'checking';

            try {

                Logger.info('Checking for updates...');

                Lifecycle._emit('pwa:update-checking', {

                    registration: state.registration

                });

                // Force update check

                await state.registration.update();

                state.lastCheck = Date.now();

                state.retryCount = 0;

                Logger.info('Update check completed');

                return true;

            } catch (error) {

                Logger.error('Update check failed:', error);

                state.retryCount++;

                // Retry logic

                if (state.retryCount < runtimeConfig.maxRetries) {

                    Logger.debug(`Retry ${state.retryCount}/${runtimeConfig.maxRetries}`);

                    setTimeout(() => {

                        this.check();

                    }, runtimeConfig.retryDelay * state.retryCount);

                } else {

                    Logger.error('Max retries reached');

                    Lifecycle._emit('pwa:update-error', {

                        error,

                        retries: state.retryCount

                    });

                }

                return false;

            } finally {

                state.checking = false;

            }

        },

        /**
         * Install update
         */
        async install() {

            if (!state.waiting) {

                Logger.warn('No waiting service worker to install');

                return false;

            }

            state.installing = true;

            state.lifecyclePhase = 'installing';

            try {

                Logger.info('Installing update...');

                Lifecycle._emit('pwa:update-installing', {

                    registration: state.registration,

                    version: state.version

                });

                // Post message to waiting service worker

                if (state.controller) {

                    state.controller.postMessage({

                        type: 'SKIP_WAITING'

                    });

                }

                Logger.info('Update installation initiated');

                return true;

            } catch (error) {

                Logger.error('Update installation failed:', error);

                Lifecycle._emit('pwa:update-error', {

                    error,

                    phase: 'install'

                });

                return false;

            } finally {

                state.installing = false;

            }

        },

        /**
         * Reload application
         */
        reload() {

            if (runtimeConfig.autoReload) {

                Logger.info('Auto-reloading application...');

                Lifecycle._emit('pwa:update-reloading', {

                    timestamp: Date.now()

                });

                // Small delay to allow event to be processed

                setTimeout(() => {

                    window.location.reload();

                }, 500);

            } else {

                Logger.info('Update ready, manual reload required');

                Lifecycle._emit('pwa:update-ready', {

                    version: state.version,

                    registration: state.registration

                });

            }

        }

    };

    // ==========================================
    // 8. PUBLIC API
    // ==========================================

    const PublicAPI = Object.freeze({

        /**
         * Initialize the update manager
         */
        async init(config = {}) {

            if (state.initialized) {

                Logger.debug('Update manager already initialized');

                return this;

            }

            runtimeConfig = {

                ...DEFAULT_CONFIG,

                ...config

            };

            // Initialize lifecycle

            await Lifecycle.init();

            Logger.info('PWA Update Manager initialized');

            return this;

        },

        /**
         * Check for updates
         */
        async checkForUpdates() {

            return UpdateEngine.check();

        },

        /**
         * Install waiting update
         */
        async installUpdate() {

            return UpdateEngine.install();

        },

        /**
         * Reload application
         */
        reload() {

            UpdateEngine.reload();

        },

        /**
         * Listen to update events
         */
        on(event, callback) {

            if (typeof BCS !== 'undefined' && BCS.Events) {

                BCS.Events.on(event, callback);

            } else {

                document.addEventListener(event, callback);

            }

            return this;

        },

        /**
         * Remove event listener
         */
        off(event, callback) {

            if (typeof BCS !== 'undefined' && BCS.Events) {

                BCS.Events.off(event, callback);

            } else {

                document.removeEventListener(event, callback);

            }

            return this;

        },

        /**
         * Get current state (immutable copy)
         */
        getState() {

            return { ...state };

        },

        /**
         * Get configuration (immutable copy)
         */
        getConfig() {

            return { ...runtimeConfig };

        },

        /**
         * Update configuration
         */
        setConfig(config) {

            runtimeConfig = {

                ...runtimeConfig,

                ...config

            };

            Logger.debug('Configuration updated');

            return this;

        },

        /**
         * Reset state to initial
         */
        reset() {

            // Remove all event listeners
            eventRegistry.removeAll();

            // Reset state to factory defaults
            state = createState();

            Logger.info('Update manager state reset');

            return this;

        },

        /**
         * Destroy update manager
         */
        destroy() {

            eventRegistry.removeAll();

            state = createState();

            Logger.info('PWA Update Manager destroyed');

            return this;

        }

    });

    // ==========================================
    // 9. EXPORT
    // ==========================================

    return PublicAPI;

})();

// ======================================================
// End of update.js
// ======================================================
