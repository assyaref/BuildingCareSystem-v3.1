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
    
    // Runtime configuration (mutable but controlled)
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
    // 3. STATE
    // ==========================================
    const state = {
        available: false,      // Install prompt available
        installed: false,      // App already installed
        standalone: false,     // Running in standalone mode
        deferred: false,       // Deferred prompt exists
        platform: null,        // Platform detection
        initialized: false     // Module initialized
    };
    
    let deferredPrompt = null;
    let mediaQuery = null;
    
    // ==========================================
    // 4. EVENT REGISTRY (For cleanup)
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
    // 5. PRIVATE METHODS
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
    // 6. EVENT REGISTRATION (With registry)
    // ==========================================
    const registerEvents = () => {
        
        // 6a. Before Install Prompt
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
        
        // 6b. App Installed
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
        
        // 6c. Standalone mode change (watch for changes)
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
        
        // 6d. iOS Standalone detection
        if (window.navigator.standalone === true) {
            updateState('standalone', true);
            updateState('platform', 'ios');
            Logger.info('Running in iOS standalone mode');
            BCS.Events?.emit?.('pwa:ios-standalone');
        }
        
        // 6e. Initial standalone check
        checkStandalone();
    };
    
    // ==========================================
    // 7. INSTALL ENGINE
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
    // 8. BRIDGE (Message from Service Worker)
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
    // 9. DETECTION
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
    // 10. INIT
    // ==========================================
    const init = (config = {}) => {
        if (state.initialized) {
            Logger.warn('Module already initialized');
            return state;
        }
        
        // Merge config (runtime config, not immutable)
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
    // 11. DESTROY (Cleanup)
    // ==========================================
    const destroy = () => {
        if (!state.initialized) {
            Logger.warn('Module not initialized');
            return;
        }
        
        Logger.info('Destroying PWA Install Module...');
        
        // Remove all event listeners
        eventRegistry.removeAll();
        
        // Reset state
        deferredPrompt = null;
        mediaQuery = null;
        
        Object.keys(state).forEach(key => {
            if (key === 'platform') {
                state[key] = null;
            } else if (key === 'initialized') {
                state[key] = false;
            } else {
                state[key] = false;
            }
        });
        
        Logger.info('PWA Install Module destroyed');
        
        // Emit destroy event
        BCS.Events?.emit?.('pwa:destroyed');
    };
    
    // ==========================================
    // 12. CONFIG UPDATE (Runtime)
    // ==========================================
    const updateConfig = (config = {}) => {
        const oldConfig = { ...runtimeConfig };
        runtimeConfig = { ...runtimeConfig, ...config };
        Logger.info('Config updated', { old: oldConfig, new: runtimeConfig });
        return { ...runtimeConfig };
    };
    
    // ==========================================
    // 13. EXPORT
    // ==========================================
    return Object.freeze({
        init,
        destroy,
        install,
        updateConfig,
        state: () => ({ ...state }), // Return copy to prevent mutation
        config: () => ({ ...runtimeConfig }), // Return copy
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
                Object.keys(state).forEach(key => {
                    if (key === 'platform') {
                        state[key] = null;
                    } else {
                        state[key] = false;
                    }
                });
                Logger.info('State reset');
            }
        }
    });
    
})();

// ==========================================
// REGISTER TO BCS NAMESPACE
// ==========================================
// BCS.PWA sebagai façade utama
// BCS.PWA.Install, BCS.PWA.Cache, BCS.PWA.Update, BCS.PWA.Sync

if (typeof BCS !== 'undefined') {
    // Create PWA namespace if not exists
    BCS.PWA = BCS.PWA || {};
    
    // Register Install module
    BCS.PWA.Install = PWAInstall;
    
    // Placeholder for other modules (will be implemented later)
    BCS.PWA.Cache = BCS.PWA.Cache || null;
    BCS.PWA.Update = BCS.PWA.Update || null;
    BCS.PWA.Sync = BCS.PWA.Sync || null;
    
    // Façade methods
    BCS.PWA.init = (config = {}) => {
        return BCS.PWA.Install.init(config);
    };
    
    BCS.PWA.destroy = () => {
        return BCS.PWA.Install.destroy();
    };
    
    BCS.PWA.state = () => {
        return BCS.PWA.Install.state();
    };
    
    BCS.PWA.install = () => {
        return BCS.PWA.Install.install();
    };
    
    BCS.PWA.isAvailable = () => {
        return BCS.PWA.Install.isAvailable();
    };
    
    BCS.PWA.isInstalled = () => {
        return BCS.PWA.Install.isInstalled();
    };
    
    BCS.PWA.isStandalone = () => {
        return BCS.PWA.Install.isStandalone();
    };
    
    // NOTE: Auto-initialization moved to bootstrap.js
    // No longer auto-initialize here
    
    Logger.info('BCS.PWA façade registered');
    
} else {
    // Fallback: simpan untuk nanti
    window.__PWAInstall = PWAInstall;
    console.warn('[PWA] BCS not found, module stored in window.__PWAInstall');
}

// ==========================================
// USAGE EXAMPLES
// ==========================================
/*
// 1. In bootstrap.js - Control initialization
// bootstrap.js
import { BCS } from './bcs.js';
import './install.js';

// Initialize PWA at the right time in startup sequence
BCS.PWA.init({
    debug: BCS.config?.debug || false
});

// 2. Install PWA
const result = await BCS.PWA.install();
if (result.success) {
    console.log('PWA installed!');
}

// 3. Check state
const state = BCS.PWA.state();
console.log('Available:', state.available);
console.log('Installed:', state.installed);
console.log('Standalone:', state.standalone);

// 4. Listen to events
BCS.Events.on('pwa:install-available', () => {
    console.log('Show install button!');
});

BCS.Events.on('pwa:installed', () => {
    console.log('App installed!');
});

BCS.Events.on('pwa:standalone-change', ({ standalone }) => {
    console.log('Standalone mode:', standalone);
});

// 5. Cleanup (if needed)
BCS.PWA.destroy();

// 6. Update config at runtime
BCS.PWA.Install.updateConfig({ debug: true });
*/
