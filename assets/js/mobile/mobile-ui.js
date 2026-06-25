// ======================================================
// Building Care System Enterprise v11.0
// mobile-ui.js
// Enterprise Mobile UI Engine - Refactored
// ======================================================

"use strict";

// Pastikan BCS dan BCS.Mobile sudah terdefinisi
if (typeof BCS === 'undefined') {
    window.BCS = {};
}
if (typeof BCS.Mobile === 'undefined') {
    BCS.Mobile = {};
}

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
        initialized: false
    };

    // ==========================================
    // DOM CACHE (Immutable - Sealed)
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
        error(...args) {
            if (BCS.Logger?.error) {
                BCS.Logger.error('MobileUI', ...args);
            } else {
                console.error('[MobileUI]', ...args);
            }
        }
    };

    // ==========================================
    // COLLECT FORM DATA (No UI manipulation)
    // ==========================================

    function collectFormData() {
        // Gunakan text() untuk non-input elements
        const userName = DOM.userName ? DOM.userName.text().trim() : '';
        const userDept = DOM.userDept ? DOM.userDept.text().trim() : '';
        const location = DOM.lokasi ? DOM.lokasi.val().trim() : '';
        const description = DOM.deskripsi ? DOM.deskripsi.val().trim() : '';
        
        return {
            category: BCS.Mobile.Renderer.getState().category,
            priority: BCS.Mobile.Renderer.getState().priority,
            location: location,
            description: description,
            photo: state.photo || null,
            preview: state.preview || null,
            userName: userName,
            userDept: userDept
        };
    }

    // ==========================================
    // SET PHOTO (For upload handling)
    // ==========================================

    function setPhoto(file, preview) {
        state.photo = file;
        state.preview = preview;
        BCS.Mobile.Renderer.renderPreview(preview);
    }

    // ==========================================
    // RESET (Pure reset, no emit)
    // ==========================================

    function resetForm() {
        state.photo = null;
        state.preview = null;
        BCS.Mobile.Renderer.renderReset();
        Logger.info('Form reset (pure)');
    }

    // ==========================================
    // DESTROY
    // ==========================================

    function destroy() {
        if (!state.initialized) {
            return;
        }

        BCS.Mobile.Binder.unbind();
        BCS.Mobile.Renderer.destroy();

        state.initialized = false;
        Logger.info('Mobile UI destroyed');
    }

    // ==========================================
    // INIT
    // ==========================================

    function init() {
        if (state.initialized) {
            Logger.warn('Mobile UI already initialized');
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

        // Initialize Renderer
        BCS.Mobile.Renderer.init({
            userName: DOM.userName,
            userDept: DOM.userDept,
            lokasi: DOM.lokasi,
            deskripsi: DOM.deskripsi,
            charCount: DOM.charCount,
            photo: DOM.photo,
            preview: DOM.preview,
            placeholder: DOM.placeholder,
            previewWrapper: DOM.previewWrapper,
            category: DOM.category,
            priority: DOM.priority,
            submit: DOM.submit,
            fab: DOM.fab,
            reportForm: DOM.reportForm,
            connectionStatus: DOM.connectionStatus
        });

        // Initialize Binder
        BCS.Mobile.Binder.bind({
            deskripsi: DOM.deskripsi,
            photo: DOM.photo,
            category: DOM.category,
            priority: DOM.priority,
            submit: DOM.submit,
            fab: DOM.fab,
            reportForm: DOM.reportForm
        }, {
            // Custom handlers
            submitClick: () => {
                if (BCS.Events) {
                    BCS.Events.emit('report:submit');
                }
            },
            // Gunakan default handlers untuk yang lain
        });

        // Listen untuk reset dari luar (tanpa emit dari UI)
        if (BCS.Events) {
            // Hanya listen, tidak emit
            BCS.Events.on('report:reset', resetForm);
            BCS.Events.on('report:submit:success', () => {
                resetForm();
            });
            BCS.Events.on('report:submit:error', () => {
                // Loading sudah di-handle oleh Renderer
            });
            
            // Listen untuk photo dari Camera module
            BCS.Events.on('camera:photo:captured', (data) => {
                if (data.file && data.dataUrl) {
                    setPhoto(data.file, data.dataUrl);
                }
            });
        }

        // Initialize Connection Status
        if (navigator.onLine !== undefined) {
            BCS.Mobile.Renderer.renderConnection(navigator.onLine ? 'online' : 'offline');
            
            window.addEventListener('online', () => {
                BCS.Mobile.Renderer.renderConnection('online');
            });
            window.addEventListener('offline', () => {
                BCS.Mobile.Renderer.renderConnection('offline');
            });
        }

        state.initialized = true;
        Logger.info('Mobile UI Ready');
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
        getState: () => ({ 
            ...state, 
            photo: state.photo,
            preview: state.preview,
            rendererState: BCS.Mobile.Renderer.getState()
        }),
        getDOM: () => ({ ...DOM })
    });

})();

// ==========================================
// AUTO-INIT
// ==========================================

$(function() {
    if (BCS.Events) {
        // Tunggu sampai UserReportModule siap
        BCS.Events.on('module:ready', (module) => {
            if (module === 'UserReport') {
                BCS.Mobile.UI.init();
            }
        });
        
        // Jika module sudah ready, langsung init
        if (BCS.UserReport?.initialized) {
            BCS.Mobile.UI.init();
        }
    } else {
        // Fallback jika Events tidak tersedia
        BCS.Mobile.UI.init();
    }
});
