// ======================================================
// MOBILE UI - USER DATA LOADER (FIXED)
// ======================================================

/**
 * Load user data dari session dengan retry
 */
function loadUserData(retryCount = 0) {
    console.log(`🔍 [MobileUI] Loading user data... (attempt ${retryCount + 1})`);
    
    const userName = document.getElementById('userName');
    const userDept = document.getElementById('userDept');
    const userAvatar = document.getElementById('userAvatar');

    // Cek apakah Session tersedia
    if (typeof Session === 'undefined') {
        console.error("❌ [MobileUI] Session tidak tersedia!");
        if (retryCount < 3) {
            setTimeout(() => loadUserData(retryCount + 1), 500);
        }
        return;
    }

    // Verifikasi session
    Session.verify();

    // Cek login status
    if (Session.isLoggedIn()) {
        const user = Session.getUser();
        const nik = Session.getNik();
        const nama = Session.getNama() || user?.nama || user?.name || "User";
        const dept = Session.getDept() || user?.departemen || user?.department || "";

        console.log("✅ [MobileUI] User ditemukan:", { nama, dept, nik });

        if (userName) {
            userName.textContent = `Halo ${nama} 👋`;
        }
        if (userDept) {
            userDept.textContent = dept || nik || "Building Care";
        }
        if (userAvatar) {
            userAvatar.textContent = nama.charAt(0).toUpperCase() || "👤";
        }
        
        // Sembunyikan loading jika ada
        const loading = document.getElementById('loading');
        if (loading) loading.style.display = 'none';
        
    } else {
        console.warn(`⚠️ [MobileUI] User tidak login (attempt ${retryCount + 1})`);
        
        if (retryCount < 3) {
            // Retry dengan delay
            console.log(`🔄 [MobileUI] Retry load user data in 500ms...`);
            setTimeout(() => loadUserData(retryCount + 1), 500);
        } else {
            // Redirect ke login setelah 3 kali gagal
            console.error("❌ [MobileUI] Gagal load user data setelah 3 attempt, redirect ke login");
            window.location.href = 'login.html';
        }
    }
}

// Jalankan saat DOM ready
document.addEventListener('DOMContentLoaded', function() {
    // Tunggu sebentar agar auth.js selesai inisialisasi
    setTimeout(() => {
        loadUserData();
    }, 300);
});

// ======================================================
// END OF USER DATA LOADER
// ======================================================
// ======================================================
// Building Care System Enterprise v11.0
// mobile-ui.js
// Enterprise Mobile UI Engine - Facade Layer
// ======================================================
// ======================================================
// MOBILE UI - USER DATA LOADER (FIX)
// ======================================================

/**
 * Load user data dari session
 */
function loadUserData() {
    console.log("🔍 [MobileUI] Loading user data...");
    
    const userName = document.getElementById('userName');
    const userDept = document.getElementById('userDept');
    const userAvatar = document.getElementById('userAvatar');

    // Cek apakah Session tersedia
    if (typeof Session === 'undefined') {
        console.error("❌ [MobileUI] Session tidak tersedia!");
        return;
    }

    // Cek login status
    if (Session.isLoggedIn()) {
        const user = Session.getUser();
        const nik = Session.getNik();
        const nama = Session.getNama() || user?.nama || user?.name || "User";
        const dept = Session.getDept() || user?.departemen || user?.department || "";

        console.log("✅ [MobileUI] User ditemukan:", { nama, dept, nik, user });

        if (userName) {
            userName.textContent = `Halo ${nama} 👋`;
        }
        if (userDept) {
            userDept.textContent = dept || nik || "Building Care";
        }
        if (userAvatar) {
            userAvatar.textContent = nama.charAt(0).toUpperCase() || "👤";
        }
    } else {
        console.warn("⚠️ [MobileUI] User tidak login, redirect ke login");
        // Redirect ke login jika tidak ada session
        window.location.href = 'login.html';
    }
}

// Jalankan saat DOM ready
document.addEventListener('DOMContentLoaded', function() {
    loadUserData();
});

// ======================================================
// END OF USER DATA LOADER
// ======================================================
"use strict";

// Pastikan BCS dan BCS.Mobile sudah terdefinisi
if (typeof BCS === 'undefined') {
    window.BCS = {};
}
if (typeof BCS.Mobile === 'undefined') {
    BCS.Mobile = {};
}
if (typeof BCS.Events === 'undefined') {
    BCS.Events = {
        on: () => {},
        off: () => {},
        emit: () => {}
    };
}

// Event Constants
BCS.Events.Type = Object.freeze({
    REPORT_SUBMIT: 'report:submit',
    REPORT_RESET: 'report:reset',
    REPORT_SUCCESS: 'report:submit:success',
    REPORT_ERROR: 'report:submit:error',
    CAMERA_CAPTURED: 'camera:photo:captured',
    MODULE_READY: 'module:ready',
    CONNECTION_CHANGE: 'connection:change'
});

BCS.Mobile.UI = (() => {

    // ==========================================
    // CONFIG
    // ==========================================

    const CONFIG = Object.freeze({
        animationDuration: 300
    });

    // ==========================================
    // STATE
    // ==========================================

    const state = {
        initialized: false,
        loading: false,
        photo: null,
        preview: null,
        connection: 'online'
    };

    // ==========================================
    // EVENT SUBSCRIPTIONS
    // ==========================================

    const subscriptions = [];
    const windowListeners = {
        online: null,
        offline: null
    };

    // ==========================================
    // DOM CACHE
    // ==========================================

    const DOM = Object.seal({
        userName: null,
        userDept: null,
        lokasi: null,
        deskripsi: null,
        charCount: null,
        photo: null,
        preview: null,
        placeholder: null,
        previewWrapper: null,
        category: null,
        priority: null,
        submit: null,
        fab: null,
        reportForm: null,
        connectionStatus: null
    });

    // ==========================================
    // DEPENDENCIES
    // ==========================================

    let Renderer = null;
    let Binder = null;
    let Animation = null;

    // ==========================================
    // LOGGER
    // ==========================================

    const Logger = {
        info(...args) {
            if (BCS.Logger?.info) {
                BCS.Logger.info('MobileUI', ...args);
            } else {
                console.log('[MobileUI]', ...args);
            }
        },
        warn(...args) {
            if (BCS.Logger?.warn) {
                BCS.Logger.warn('MobileUI', ...args);
            } else {
                console.warn('[MobileUI]', ...args);
            }
        },
        error(...args) {
            if (BCS.Logger?.error) {
                BCS.Logger.error('MobileUI', ...args);
            } else {
                console.error('[MobileUI]', ...args);
            }
        }
    };

    // ==========================================
    // PRIVATE METHODS
    // ==========================================

    function setupEventSubscriptions() {
        const events = BCS.Events;
        if (!events) return;

        // Subscribe ke event-event yang diperlukan
        const offSubmit = events.on(BCS.Events.Type.REPORT_RESET, resetForm);
        const offSuccess = events.on(BCS.Events.Type.REPORT_SUCCESS, () => {
            resetForm();
        });
        const offError = events.on(BCS.Events.Type.REPORT_ERROR, () => {
            // Loading sudah di-handle oleh Renderer
        });
        const offCamera = events.on(BCS.Events.Type.CAMERA_CAPTURED, (data) => {
            if (data.file && data.dataUrl) {
                setPhoto(data.file, data.dataUrl);
            }
        });

        subscriptions.push(offSubmit, offSuccess, offError, offCamera);
    }

    function setupWindowListeners() {
        if (navigator.onLine === undefined) return;

        const onlineHandler = () => {
            state.connection = 'online';
            if (Renderer?.update) {
                Renderer.update({ connection: 'online' });
            }
            BCS.Events?.emit(BCS.Events.Type.CONNECTION_CHANGE, 'online');
        };

        const offlineHandler = () => {
            state.connection = 'offline';
            if (Renderer?.update) {
                Renderer.update({ connection: 'offline' });
            }
            BCS.Events?.emit(BCS.Events.Type.CONNECTION_CHANGE, 'offline');
        };

        windowListeners.online = onlineHandler;
        windowListeners.offline = offlineHandler;

        window.addEventListener('online', onlineHandler);
        window.addEventListener('offline', offlineHandler);
    }

    function removeWindowListeners() {
        if (windowListeners.online) {
            window.removeEventListener('online', windowListeners.online);
            windowListeners.online = null;
        }
        if (windowListeners.offline) {
            window.removeEventListener('offline', windowListeners.offline);
            windowListeners.offline = null;
        }
    }

    function clearSubscriptions() {
        subscriptions.forEach(off => {
            if (typeof off === 'function') off();
        });
        subscriptions.length = 0;
    }

    // ==========================================
    // PUBLIC METHODS
    // ==========================================

    function init(options = {}) {
        if (state.initialized) {
            Logger.warn('Mobile UI already initialized');
            return;
        }

        // Inject dependencies
        Renderer = options.renderer || BCS.Mobile.Renderer;
        Binder = options.binder || BCS.Mobile.Binder;
        Animation = options.animation || BCS.Mobile.Animation;

        if (!Renderer || !Binder) {
            Logger.error('Renderer or Binder not available');
            return;
        }

        // Cache DOM
        DOM.userName = $('#userName');
        DOM.userDept = $('#userDept');
        DOM.lokasi = $('#lokasi');
        DOM.deskripsi = $('#deskripsi');
        DOM.charCount = $('#charCount');
        DOM.photo = $('#photo');
        DOM.preview = $('#previewImage');
        DOM.placeholder = $('#previewPlaceholder');
        DOM.previewWrapper = $('#previewWrapper');
        DOM.category = $('.category-card');
        DOM.priority = $('.priority-card');
        DOM.submit = $('#submitReport');
        DOM.fab = $('#fabReport');
        DOM.reportForm = $('#reportForm');
        DOM.connectionStatus = $('#connectionStatus');

        // Initialize Renderer dengan dependency injection
        if (Renderer.init) {
            Renderer.init({
                dom: DOM,
                animation: Animation,
                events: BCS.Events
            });
        }

        // Initialize Binder dengan dependency injection
        if (Binder.init) {
            Binder.init({
                dom: DOM,
                renderer: Renderer,
                animation: Animation,
                events: BCS.Events,
                handlers: {
                    submitClick: () => {
                        BCS.Events?.emit(BCS.Events.Type.REPORT_SUBMIT);
                    }
                }
            });
        }

        // Setup event subscriptions
        setupEventSubscriptions();

        // Setup window listeners
        setupWindowListeners();

        // Set initial connection status
        if (Renderer?.update) {
            const status = navigator.onLine ? 'online' : 'offline';
            state.connection = status;
            Renderer.update({ connection: status });
        }

        state.initialized = true;
        Logger.info('Mobile UI Ready');

        // Notify module ready
        BCS.Events?.emit(BCS.Events.Type.MODULE_READY, 'MobileUI');
    }

    function destroy() {
        if (!state.initialized) {
            return;
        }

        // Destroy binder
        if (Binder?.destroy) {
            Binder.destroy();
        }

        // Destroy renderer
        if (Renderer?.destroy) {
            Renderer.destroy();
        }

        // Cleanup event subscriptions
        clearSubscriptions();

        // Cleanup window listeners
        removeWindowListeners();

        // Reset state
        state.initialized = false;
        state.loading = false;
        state.photo = null;
        state.preview = null;
        state.connection = 'online';

        Logger.info('Mobile UI destroyed');
    }

    function resetForm() {
        state.photo = null;
        state.preview = null;
        
        if (Renderer?.update) {
            Renderer.update({ reset: true });
        }
        
        Logger.info('Form reset');
    }

    function collectFormData() {
        const userName = DOM.userName ? DOM.userName.text().trim() : '';
        const userDept = DOM.userDept ? DOM.userDept.text().trim() : '';
        const location = DOM.lokasi ? DOM.lokasi.val().trim() : '';
        const description = DOM.deskripsi ? DOM.deskripsi.val().trim() : '';
        
        // Get form state dari Renderer
        let formState = {};
        if (Renderer?.getFormState) {
            formState = Renderer.getFormState();
        }

        return {
            category: formState.category || '',
            priority: formState.priority || '',
            location: location,
            description: description,
            photo: state.photo || null,
            preview: state.preview || null,
            userName: userName,
            userDept: userDept
        };
    }

    function setPhoto(file, preview) {
        state.photo = file;
        state.preview = preview;
        
        if (Renderer?.update) {
            Renderer.update({ preview: preview });
        }
    }

    function setLoading(loading) {
        state.loading = loading;
        
        if (Renderer?.update) {
            Renderer.update({ loading: loading });
        }
    }

    function setConnection(status) {
        if (status !== 'online' && status !== 'offline') {
            return;
        }
        
        state.connection = status;
        
        if (Renderer?.update) {
            Renderer.update({ connection: status });
        }
    }

    function render() {
        if (Renderer?.render) {
            Renderer.render();
        }
    }

    function getState() {
        return {
            initialized: state.initialized,
            loading: state.loading,
            photo: state.photo,
            preview: state.preview,
            connection: state.connection
        };
    }

    function getDOM() {
        return { ...DOM };
    }

    // ==========================================
    // PUBLIC API
    // ==========================================

    return Object.freeze({
        init,
        destroy,
        resetForm,
        collectFormData,
        setPhoto,
        setLoading,
        setConnection,
        render,
        getState,
        getDOM
    });

})();

// ==========================================
// BOOTSTRAP
// ==========================================

// Register module untuk bootstrap
if (typeof BCS !== 'undefined' && BCS.Module) {
    BCS.Module.register('MobileUI', BCS.Mobile.UI);
}
