// ==========================================
// PWA INSTALL MODULE
// ==========================================
// Module pattern seperti BCS lainnya
// Konsisten dengan BCS.Api, BCS.Auth, BCS.Offline, BCS.Notification

const PWAInstall = (() => {
    
    // ==========================================
    // 1. CONFIGURATION
    // ==========================================
    const CONFIG = {
        debug: false,
        logPrefix: 'PWA'
    };
    
    // ==========================================
    // 2. LOGGER
    // ==========================================
    const Logger = {
        info(...args) {
            if (CONFIG.debug) {
                BCS.Logger?.info?.(CONFIG.logPrefix, ...args);
            }
        },
        warn(...args) {
            BCS.Logger?.warn?.(CONFIG.logPrefix, ...args);
        },
        error(...args) {
            BCS.Logger?.error?.(CONFIG.logPrefix, ...args);
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
        platform: null         // Platform detection
    };
    
    let deferredPrompt = null;
    let mediaQuery = null;
    
    // ==========================================
    // 4. PRIVATE METHODS
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
    // 5. EVENT REGISTRATION
    // ==========================================
    const registerEvents = () => {
        
        // 5a. Before Install Prompt
        window.addEventListener('beforeinstallprompt', (event) => {
            event.preventDefault();
            
            deferredPrompt = event;
            updateState('available', true);
            updateState('deferred', true);
            
            Logger.info('Install prompt available');
            BCS.Events?.emit?.('pwa:install-available', { event });
        });
        
        // 5b. App Installed
        window.addEventListener('appinstalled', (event) => {
            deferredPrompt = null;
            updateState('installed', true);
            updateState('available', false);
            updateState('deferred', false);
            
            Logger.info('App installed successfully');
            BCS.Events?.emit?.('pwa:installed', { event });
        });
        
        // 5c. Standalone mode change (watch for changes)
        mediaQuery = window.matchMedia('(display-mode: standalone)');
        mediaQuery.addEventListener('change', (event) => {
            updateState('standalone', event.matches);
            Logger.info(`Standalone mode: ${event.matches}`);
            BCS.Events?.emit?.('pwa:standalone-change', { standalone: event.matches });
        });
        
        // 5d. iOS Standalone detection
        if (window.navigator.standalone === true) {
            updateState('standalone', true);
            updateState('platform', 'ios');
            Logger.info('Running in iOS standalone mode');
            BCS.Events?.emit?.('pwa:ios-standalone');
        }
        
        // 5e. Initial standalone check
        checkStandalone();
    };
    
    // ==========================================
    // 6. INSTALL ENGINE
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
    // 7. BRIDGE (Message from Service Worker)
    // ==========================================
    const setupBridge = () => {
        if (!('serviceWorker' in navigator)) {
            Logger.warn('Service Worker not supported');
            return;
        }
        
        navigator.serviceWorker.addEventListener('message', (event) => {
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
            // Service Worker sends: { type: "pwa:activated", payload: {...} }
            BCS.Events?.emit?.(type, payload);
        });
    };
    
    // ==========================================
    // 8. DETECTION
    // ==========================================
    const detect = () => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            updateState('installed', true);
            updateState('standalone', true);
        }
        
        // Check if app is installed (from appinstalled event already handled)
        // Additional check for installation status
        if (window.navigator.standalone === true) {
            updateState('installed', true);
            updateState('standalone', true);
            updateState('platform', 'ios');
        }
    };
    
    // ==========================================
    // 9. INIT
    // ==========================================
    const init = (config = {}) => {
        // Merge config
        Object.assign(CONFIG, config);
        
        Logger.info('Initializing PWA Install Module...');
        
        // Register all events
        registerEvents();
        
        // Setup message bridge
        setupBridge();
        
        // Run detection
        detect();
        
        Logger.info('PWA Install Module initialized', state);
        
        // Emit initialization event
        BCS.Events?.emit?.('pwa:initialized', { state });
        
        return state;
    };
    
    // ==========================================
    // 10. EXPORT
    // ==========================================
    return Object.freeze({
        init,
        install,
        state: () => ({ ...state }), // Return copy to prevent mutation
        getDeferredPrompt: () => deferredPrompt,
        isAvailable: () => state.available,
        isInstalled: () => state.installed,
        isStandalone: () => state.standalone,
        checkStandalone,
        reset: () => {
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
    });
    
})();

// ==========================================
// REGISTER TO BCS NAMESPACE
// ==========================================
// Konsisten dengan BCS.Api, BCS.Auth, BCS.Offline, BCS.Notification

if (typeof BCS !== 'undefined') {
    BCS.PWA = BCS.PWA || {};
    BCS.PWA.Install = PWAInstall;
    
    // Auto-initialize jika BCS sudah siap
    if (BCS.isReady) {
        PWAInstall.init({ debug: BCS.debug || false });
    } else {
        // Tunggu BCS siap
        document.addEventListener('BCS:ready', () => {
            PWAInstall.init({ debug: BCS.debug || false });
        });
    }
} else {
    // Fallback: simpan untuk nanti
    window.__PWAInstall = PWAInstall;
    console.warn('[PWA] BCS not found, module stored in window.__PWAInstall');
}

// ==========================================
// USAGE EXAMPLES
// ==========================================
/*
// 1. Install PWA
const result = await BCS.PWA.Install.install();
if (result.success) {
    console.log('PWA installed!');
}

// 2. Check state
const state = BCS.PWA.Install.state();
console.log('Available:', state.available);
console.log('Installed:', state.installed);
console.log('Standalone:', state.standalone);

// 3. Listen to events
BCS.Events.on('pwa:install-available', () => {
    console.log('Show install button!');
});

BCS.Events.on('pwa:installed', () => {
    console.log('App installed!');
});

BCS.Events.on('pwa:standalone-change', ({ standalone }) => {
    console.log('Standalone mode:', standalone);
});

// 4. Check if install is available
if (BCS.PWA.Install.isAvailable()) {
    // Show install button
}
*/
