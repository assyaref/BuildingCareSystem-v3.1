// ==========================================
// PWA INSTALL MODULE
// ==========================================
// Module pattern seperti BCS lainnya
// Konsisten dengan BCS.Api, BCS.Auth, BCS.Offline, BCS.Notification

const PWAInstall = (() => {
    
    // ==========================================
    // 1. CONFIGURATION (Immutable)
    // ==========================================
    const DEFAULT_CONFIG = Object.freeze({
        debug: false,
        logPrefix: 'PWA'
    });
    
    // Runtime configuration
    let runtimeConfig = { ...DEFAULT_CONFIG };
    
    // ==========================================
    // 2. LOGGER
    // ==========================================
    const Logger = {
        info(...args) {
            if (runtimeConfig.debug) {
                BCS.Logger?.info?.(runtimeConfig.logPrefix, ...args);
            }
        },
        warn(...args) {
            BCS.Logger?.warn?.(runtimeConfig.logPrefix, ...args);
        },
        error(...args) {
            BCS.Logger?.error?.(runtimeConfig.logPrefix, ...args);
        }
    };
    
    // ==========================================
    // 3. STATE FACTORY
    // ==========================================
    const createState = () => ({
        available: false,      // Install prompt available
        installed: false,      // App already installed
        standalone: false,     // Running in standalone mode
        deferred: false,       // Deferred prompt exists
        platform: null,        // Platform detection
        initialized: false     // Module initialized
    });
    
    // ==========================================
    // 4. STATE
    // ==========================================
    const state = createState();
    
    let deferredPrompt = null;
    let mediaQuery = null;
    
    // ==========================================
    // 5. EVENT REGISTRY (For cleanup)
    // ==========================================
    const eventRegistry = {
        listeners: [],
        
        add(element, event, handler, options = {}) {
            element.addEventListener(event, handler, options);
            this.listeners.push({ element, event, handler, options });
        },
        
        removeAll() {
            this.listeners.forEach(({ element, event, handler, options }) => {
                element.removeEventListener(event, handler, options);
            });
            this.listeners = [];
        }
    };
    
    // ==========================================
    // 6. PRIVATE METHODS
    // ==========================================
    
    // Update state and emit events
    const updateState = (key, value) => {
        const oldValue = state[key];
        state[key] = value;
        
        if (oldValue !== value) {
            Logger.info(`State changed: ${key} = ${value}`);
            BCS.Events?.emit?.(`pwa:state:${key}`, { oldValue, newValue: value });
        }
    };
    
    // Check if running as standalone
    const checkStandalone = () => {
        const standalone = window.matchMedia('(display-mode: standalone)').matches;
        updateState('standalone', standalone);
        return standalone;
    };
    
    // ==========================================
    // 7. EVENT REGISTRATION (With registry)
    // ==========================================
    const registerEvents = () => {
        
        // 7a. Before Install Prompt
        eventRegistry.add(
            window,
            'beforeinstallprompt',
            (event) => {
                event.preventDefault();
                
                deferredPrompt = event;
                updateState('available', true);
                updateState('deferred', true);
                
                Logger.info('Install prompt available');
                BCS.Events?.emit?.('pwa:install-available', { event });
            }
        );
        
        // 7b. App Installed
        eventRegistry.add(
            window,
            'appinstalled',
            (event) => {
                deferredPrompt = null;
                updateState('installed', true);
                updateState('available', false);
                updateState('deferred', false);
                
                Logger.info('App installed successfully');
                BCS.Events?.emit?.('pwa:installed', { event });
            }
        );
        
        // 7c. Standalone mode change (watch for changes)
        mediaQuery = window.matchMedia('(display-mode: standalone)');
        eventRegistry.add(
            mediaQuery,
            'change',
            (event) => {
                updateState('standalone', event.matches);
                Logger.info(`Standalone mode: ${event.matches}`);
                BCS.Events?.emit?.('pwa:standalone-change', { standalone: event.matches });
            }
        );
        
        // 7d. iOS Standalone detection
        if (window.navigator.standalone === true) {
            updateState('standalone', true);
            updateState('platform', 'ios');
            Logger.info('Running in iOS standalone mode');
            BCS.Events?.emit?.('pwa:ios-standalone');
        }
        
        // 7e. Initial standalone check
        checkStandalone();
    };
    
    // ==========================================
    // 8. INSTALL ENGINE
    // ==========================================
    const install = async () => {
        if (!deferredPrompt) {
            Logger.warn('No install prompt available');
            return { success: false, reason: 'no_prompt_available' };
        }
        
        try {
            Logger.info('Showing install prompt...');
            const result = await deferredPrompt.prompt();
            const outcome = result.outcome;
            
            if (outcome === 'accepted') {
                Logger.info('User accepted installation');
                deferredPrompt = null;
                updateState('deferred', false);
                return { success: true, outcome: 'accepted' };
            } else {
                Logger.info('User dismissed installation');
                return { success: false, outcome: 'dismissed' };
            }
        } catch (error) {
            Logger.error('Install failed:', error);
            return { success: false, reason: 'error', error };
        }
    };
    
    // ==========================================
    // 9. BRIDGE (Message from Service Worker)
    // ==========================================
    const setupBridge = () => {
        if (!('serviceWorker' in navigator)) {
            Logger.warn('Service Worker not supported');
            return;
        }
        
        eventRegistry.add(
            navigator.serviceWorker,
            'message',
            (event) => {
                // Validation
                if (!event.data || typeof event.data !== 'object') {
                    return;
                }
                
                const { type, payload } = event.data;
                
                if (!type) {
                    return;
                }
                
                Logger.info(`Message received: ${type}`, payload);
                
                // Emit event directly - no switch needed
                BCS.Events?.emit?.(type, payload);
            }
        );
    };
    
    // ==========================================
    // 10. DETECTION
    // ==========================================
    const detect = () => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            updateState('installed', true);
            updateState('standalone', true);
        }
        
        // Check if app is installed (from appinstalled event already handled)
        if (window.navigator.standalone === true) {
            updateState('installed', true);
            updateState('standalone', true);
            updateState('platform', 'ios');
        }
    };
    
    // ==========================================
    // 11. INIT
    // ==========================================
    const init = (config = {}) => {
        if (state.initialized) {
            Logger.warn('Module already initialized');
            return state;
        }
        
        // Merge config
        runtimeConfig = { ...DEFAULT_CONFIG, ...config };
        
        Logger.info('Initializing PWA Install Module...');
        
        // Register all events
        registerEvents();
        
        // Setup message bridge
        setupBridge();
        
        // Run detection
        detect();
        
        // Mark as initialized
        updateState('initialized', true);
        
        Logger.info('PWA Install Module initialized', state);
        
        // Emit initialization event
        BCS.Events?.emit?.('pwa:initialized', { state: { ...state } });
        
        return state;
    };
    
    // ==========================================
    // 12. DESTROY (Cleanup)
    // ==========================================
    const destroy = () => {
        if (!state.initialized) {
            Logger.warn('Module not initialized');
            return;
        }
        
        Logger.info('Destroying PWA Install Module...');
        
        // Remove all event listeners
        eventRegistry.removeAll();
        
        // Reset state using factory
        deferredPrompt = null;
        mediaQuery = null;
        
        // Reset state with factory (maintains consistency)
        Object.assign(state, createState());
        
        Logger.info('PWA Install Module destroyed');
        
        // Emit destroy event
        BCS.Events?.emit?.('pwa:destroyed');
    };
    
    // ==========================================
    // 13. UPDATE CONFIG (Runtime)
    // ==========================================
    const updateConfig = (config = {}) => {
        const oldConfig = { ...runtimeConfig };
        runtimeConfig = { ...runtimeConfig, ...config };
        Logger.info('Config updated', { old: oldConfig, new: runtimeConfig });
        return { ...runtimeConfig };
    };
    
    // ==========================================
    // 14. EXPORT
    // ==========================================
    return Object.freeze({
        init,
        destroy,
        install,
        updateConfig,
        state: () => ({ ...state }),
        config: () => ({ ...runtimeConfig }),
        getDeferredPrompt: () => deferredPrompt,
        isAvailable: () => state.available,
        isInstalled: () => state.installed,
        isStandalone: () => state.standalone,
        isInitialized: () => state.initialized,
        checkStandalone,
        reset: () => {
            if (state.initialized) {
                destroy();
                init(runtimeConfig);
            } else {
                deferredPrompt = null;
                Object.assign(state, createState());
                Logger.info('State reset');
            }
        }
    });
    
})();

// ==========================================
// REGISTER TO BCS NAMESPACE (Inside IIFE)
// ==========================================
// Semua proses registrasi namespace di dalam IIFE
// sehingga dapat mengakses Logger

(() => {
    
    // Check if BCS is available
    if (typeof BCS === 'undefined') {
        window.__PWAInstall = PWAInstall;
        console.warn('[PWA] BCS not found, module stored in window.__PWAInstall');
        return;
    }
    
    // ==========================================
    // Create PWA namespace
    // ==========================================
    BCS.PWA = BCS.PWA || {};
    
    // Register Install module
    BCS.PWA.Install = PWAInstall;
    
    // Placeholder for other modules
    BCS.PWA.Cache = BCS.PWA.Cache || null;
    BCS.PWA.Update = BCS.PWA.Update || null;
    BCS.PWA.Sync = BCS.PWA.Sync || null;
    
    // ==========================================
    // Façade methods with validation
    // ==========================================
    
    BCS.PWA.init = (config = {}) => {
        if (!BCS.PWA.Install) {
            throw new Error('[PWA] Install module not available.');
        }
        return BCS.PWA.Install.init(config);
    };
    
    BCS.PWA.destroy = () => {
        if (!BCS.PWA.Install) {
            throw new Error('[PWA] Install module not available.');
        }
        return BCS.PWA.Install.destroy();
    };
    
    BCS.PWA.install = () => {
        if (!BCS.PWA.Install) {
            throw new Error('[PWA] Install module not available.');
        }
        return BCS.PWA.Install.install();
    };
    
    BCS.PWA.state = () => {
        if (!BCS.PWA.Install) {
            throw new Error('[PWA] Install module not available.');
        }
        return BCS.PWA.Install.state();
    };
    
    BCS.PWA.config = () => {
        if (!BCS.PWA.Install) {
            throw new Error('[PWA] Install module not available.');
        }
        return BCS.PWA.Install.config();
    };
    
    BCS.PWA.updateConfig = (config) => {
        if (!BCS.PWA.Install) {
            throw new Error('[PWA] Install module not available.');
        }
        return BCS.PWA.Install.updateConfig(config);
    };
    
    BCS.PWA.isAvailable = () => {
        if (!BCS.PWA.Install) {
            return false;
        }
        return BCS.PWA.Install.isAvailable();
    };
    
    BCS.PWA.isInstalled = () => {
        if (!BCS.PWA.Install) {
            return false;
        }
        return BCS.PWA.Install.isInstalled();
    };
    
    BCS.PWA.isStandalone = () => {
        if (!BCS.PWA.Install) {
            return false;
        }
        return BCS.PWA.Install.isStandalone();
    };
    
    BCS.PWA.isInitialized = () => {
        if (!BCS.PWA.Install) {
            return false;
        }
        return BCS.PWA.Install.isInitialized();
    };
    
    BCS.PWA.checkStandalone = () => {
        if (!BCS.PWA.Install) {
            throw new Error('[PWA] Install module not available.');
        }
        return BCS.PWA.Install.checkStandalone();
    };
    
    BCS.PWA.reset = () => {
        if (!BCS.PWA.Install) {
            throw new Error('[PWA] Install module not available.');
        }
        return BCS.PWA.Install.reset();
    };
    
    // ==========================================
    // Log using BCS.Logger (outside IIFE scope)
    // ==========================================
    // Use BCS.Logger directly since Logger from IIFE is not accessible
    if (BCS.Logger) {
        BCS.Logger.info?.('PWA', 'BCS.PWA façade registered');
    } else if (console) {
        console.info('[PWA] BCS.PWA façade registered');
    }
    
    // ==========================================
    // NO AUTO-INITIALIZATION HERE
    // Control from bootstrap.js
    // ==========================================
    
})();

// ==========================================
// USAGE EXAMPLES
// ==========================================
/*
// 1. In bootstrap.js - Control initialization
// bootstrap.js
import { BCS } from './bcs.js';
import './install.js';

// Initialize PWA at the right time
try {
    BCS.PWA.init({ debug: BCS.config?.debug || false });
} catch (error) {
    console.error('Failed to initialize PWA:', error);
}

// 2. Install PWA with validation
try {
    const result = await BCS.PWA.install();
    if (result.success) {
        console.log('PWA installed!');
    }
} catch (error) {
    console.error('Install failed:', error.message);
}

// 3. Check state safely
const state = BCS.PWA.state();
console.log('Available:', state.available);
console.log('Installed:', state.installed);

// 4. Listen to events
BCS.Events.on('pwa:install-available', () => {
    console.log('Show install button!');
});

// 5. Cleanup
BCS.PWA.destroy();

// 6. Update config at runtime
BCS.PWA.updateConfig({ debug: true });
*/
