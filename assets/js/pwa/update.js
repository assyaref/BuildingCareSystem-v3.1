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

        // Observer configuration
        observerDebounce: 300,

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

        // Observer state
        isObserving: false,

        lifecyclePhase: 'idle', // idle | checking | found | installing | installed | waiting | activated

        retryCount: 0,

        lastCheck: null

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
    // 6. OBSERVER ENGINE
    // ==========================================

    const Observer = {

        // Internal observers
        _observers: [],

        _mutationObserver: null,

        _debounceTimer: null,

        /**
         * Initialize observer engine
         */
        init() {

            if (state.isObserving) {

                Logger.debug('Observer already initialized');

                return;

            }

            try {

                // Setup MutationObserver for DOM changes
                if (window.MutationObserver) {

                    this._mutationObserver = new MutationObserver(

                        this._handleMutation.bind(this)

                    );

                    this._mutationObserver.observe(

                        document.documentElement,

                        {

                            childList: true,

                            subtree: true,

                            attributes: true,

                            attributeFilter: ['src', 'href', 'data-version']

                        }

                    );

                }

                // Setup window event listeners
                eventRegistry.add(

                    window,

                    'online',

                    this._handleOnline.bind(this)

                );

                eventRegistry.add(

                    window,

                    'offline',

                    this._handleOffline.bind(this)

                );

                eventRegistry.add(

                    window,

                    'beforeunload',

                    this._handleBeforeUnload.bind(this)

                );

                state.isObserving = true;

                Logger.info('Observer engine initialized');

            } catch (error) {

                Logger.error('Failed to initialize observer:', error);

                throw error;

            }

        },

        /**
         * Handle DOM mutations
         */
        _handleMutation(mutations) {

            clearTimeout(this._debounceTimer);

            this._debounceTimer = setTimeout(() => {

                const hasUpdate = mutations.some(mutation =>

                    mutation.type === 'attributes' &&

                    (mutation.attributeName === 'src' ||

                     mutation.attributeName === 'href' ||

                     mutation.attributeName === 'data-version')

                );

                if (hasUpdate) {

                    Logger.debug('DOM mutation detected, checking for updates');

                    this._notify('pwa:dom-changed', {

                        mutations,

                        timestamp: Date.now()

                    });

                }

            }, runtimeConfig.observerDebounce);

        },

        /**
         * Handle online event
         */
        _handleOnline() {

            Logger.info('Network online, checking for updates');

            this._notify('pwa:online', {

                timestamp: Date.now()

            });

            // Trigger update check when coming online

            if (state.registration) {

                PWAUpdate.checkForUpdates();

            }

        },

        /**
         * Handle offline event
         */
        _handleOffline() {

            Logger.warn('Network offline');

            this._notify('pwa:offline', {

                timestamp: Date.now()

            });

        },

        /**
         * Handle beforeunload event
         */
        _handleBeforeUnload() {

            Logger.debug('Page unloading, cleaning up observers');

            this.destroy();

        },

        /**
         * Add observer callback
         */
        addObserver(callback) {

            if (typeof callback !== 'function') {

                Logger.error('Observer callback must be a function');

                return;

            }

            this._observers.push(callback);

            Logger.debug('Observer added');

        },

        /**
         * Remove observer callback
         */
        removeObserver(callback) {

            this._observers = this._observers.filter(cb => cb !== callback);

            Logger.debug('Observer removed');

        },

        /**
         * Notify all observers
         */
        _notify(eventType, data = {}) {

            const eventData = {

                type: eventType,

                data,

                state: { ...state },

                timestamp: Date.now()

            };

            // Dispatch custom event
            const customEvent = new CustomEvent(eventType, {

                detail: eventData,

                bubbles: true,

                cancelable: true

            });

            document.dispatchEvent(customEvent);

            // Notify registered observers
            this._observers.forEach(callback => {

                try {

                    callback(eventData);

                } catch (error) {

                    Logger.error('Observer callback error:', error);

                }

            });

            Logger.debug(`Event dispatched: ${eventType}`);

        },

        /**
         * Destroy observer engine
         */
        destroy() {

            if (this._mutationObserver) {

                this._mutationObserver.disconnect();

                this._mutationObserver = null;

            }

            clearTimeout(this._debounceTimer);

            eventRegistry.removeAll();

            state.isObserving = false;

            this._observers = [];

            Logger.info('Observer engine destroyed');

        }

    };

    // ==========================================
    // 7. UPDATE ENGINE
    // ==========================================

    const UpdateEngine = {

        /**
         * Check for updates
         */
        async check() {

            if (state.checking) {

                Logger.debug('Update check already in progress');

                return;

            }

            if (!state.registration) {

                Logger.warn('No service worker registration found');

                return;

            }

            state.checking = true;

            state.lifecyclePhase = 'checking';

            try {

                Logger.info('Checking for updates...');

                Observer._notify('pwa:update-checking', {

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

                    Observer._notify('pwa:update-error', {

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

                Observer._notify('pwa:update-installing', {

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

                Observer._notify('pwa:update-error', {

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

                Observer._notify('pwa:update-reloading', {

                    timestamp: Date.now()

                });

                // Small delay to allow event to be processed

                setTimeout(() => {

                    window.location.reload();

                }, 500);

            } else {

                Logger.info('Update ready, manual reload required');

                Observer._notify('pwa:update-ready', {

                    version: state.version,

                    registration: state.registration

                });

            }

        }

    };

    // ==========================================
    // 8. LIFECYCLE MANAGER
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

                    // Get version from controller script

                    if (state.controller) {

                        const versionMatch = state.controller.scriptURL.match(/\?v=([^&]+)/);

                        if (versionMatch) {

                            state.version = versionMatch[1];

                        }

                    }

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

            Observer._notify('pwa:update-found', {

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

            Observer._notify('pwa:update-installing', {

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

            Observer._notify('pwa:update-installed', {

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

            // Extract version from script URL

            const versionMatch = worker.scriptURL.match(/\?v=([^&]+)/);

            if (versionMatch) {

                state.version = versionMatch[1];

            }

            Observer._notify('pwa:update-ready', {

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

            // Extract version

            const versionMatch = worker.scriptURL.match(/\?v=([^&]+)/);

            if (versionMatch) {

                state.version = versionMatch[1];

            }

            Observer._notify('pwa:update-activated', {

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

                    Observer._notify('pwa:update-found', payload);

                    break;

                case 'UPDATE_ACTIVATED':

                    Logger.info('Update activated notification from SW');

                    Observer._notify('pwa:update-activated', payload);

                    break;

                default:

                    Logger.debug('Unknown message type:', type);

            }

        }

    };

    // ==========================================
    // 9. PUBLIC API
    // ==========================================

    const PublicAPI = {

        /**
         * Initialize the update manager
         */
        async init(config = {}) {

            runtimeConfig = {

                ...DEFAULT_CONFIG,

                ...config

            };

            // Initialize observer

            Observer.init();

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
         * Add observer callback
         */
        observe(callback) {

            Observer.addObserver(callback);

        },

        /**
         * Remove observer callback
         */
        unobserve(callback) {

            Observer.removeObserver(callback);

        },

        /**
         * Get current state
         */
        getState() {

            return { ...state };

        },

        /**
         * Get configuration
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

        },

        /**
         * Destroy update manager
         */
        destroy() {

            Observer.destroy();

            state.initialized = false;

            Logger.info('PWA Update Manager destroyed');

        }

    };

    // ==========================================
    // 10. EXPORT
    // ==========================================

    return PublicAPI;

})();

// ======================================================
// Auto-initialization
// ======================================================

if (typeof BCS !== 'undefined' && BCS.config?.pwa?.autoInit !== false) {

    // Wait for DOM ready

    if (document.readyState === 'loading') {

        document.addEventListener('DOMContentLoaded', () => {

            PWAUpdate.init(BCS.config?.pwa);

        });

    } else {

        PWAUpdate.init(BCS.config?.pwa);

    }

}

// ======================================================
// End of update.js
// ======================================================
