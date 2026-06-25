// ======================================================
// Building Care System Enterprise v11.0
// mobile-ui.js
// Enterprise Mobile UI Engine
// Radiant Group Duri
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
        animationDuration: 250,
        maxPhotoSize: 5 * 1024 * 1024,
        maxDescription: 500
    });

    // ==========================================
    // STATE
    // ==========================================

    const state = {
        initialized: false,
        category: null,
        priority: 'NORMAL',
        photo: null,
        preview: null
    };

    // ==========================================
    // DOM CACHE
    // ==========================================

    const DOM = {};

    function cacheDOM() {
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
    }

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
        },
        warn(...args) {
            if (BCS.Logger?.warn) {
                BCS.Logger.warn('MobileUI', ...args);
            } else {
                console.warn('[MobileUI]', ...args);
            }
        }
    };

    // ==========================================
    // BIND EVENTS
    // ==========================================

    function bindEvents() {
        // Deskripsi input
        DOM.deskripsi.on('input', handleDescriptionInput);
        
        // Photo upload - delegate ke Camera module
        DOM.photo.on('change', handlePhotoUpload);
        
        // Category selection
        DOM.category.on('click', handleCategoryClick);
        
        // Priority selection
        DOM.priority.on('click', handlePriorityClick);
        
        // Submit report - emit event
        DOM.submit.on('click', () => {
            if (BCS.Events) {
                BCS.Events.emit('report:submit', collectFormData());
            } else {
                Logger.error('BCS.Events not available');
            }
        });
        
        // FAB click
        DOM.fab.on('click', handleFabClick);
        
        // Keyboard shortcut - Enter to submit
        DOM.deskripsi.on('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                DOM.submit.click();
            }
        });

        // Listen for reset event
        if (BCS.Events) {
            BCS.Events.on('report:reset', resetForm);
            BCS.Events.on('report:submit:success', handleSubmitSuccess);
            BCS.Events.on('report:submit:error', handleSubmitError);
        }
    }

    // ==========================================
    // EVENT HANDLERS
    // ==========================================

    function handleDescriptionInput() {
        const text = DOM.deskripsi.val();
        const length = text.length;
        DOM.charCount.text(length);
        
        // Warning jika melebihi batas
        if (length > CONFIG.maxDescription) {
            DOM.charCount.css('color', 'red');
            DOM.charCount.text(`${length}/${CONFIG.maxDescription}`);
        } else {
            DOM.charCount.css('color', '');
        }
        
        // Auto-resize textarea
        this.style.height = 'auto';
        this.style.height = this.scrollHeight + 'px';
        
        // Emit event untuk module lain
        if (BCS.Events) {
            BCS.Events.emit('report:description:input', {
                text: text,
                length: length
            });
        }
    }

    function handlePhotoUpload(e) {
        const file = e.target.files[0];
        
        if (!file) {
            return;
        }
        
        // Delegate ke Camera module
        if (BCS.Mobile.Camera) {
            BCS.Mobile.Camera.processPhoto(file, (result) => {
                if (result.success) {
                    state.photo = result.file;
                    state.preview = result.dataUrl;
                    DOM.preview.attr('src', result.dataUrl);
                    DOM.previewWrapper.show();
                    DOM.placeholder.hide();
                    Logger.info('Photo processed:', result.file.name);
                    
                    // Emit event
                    if (BCS.Events) {
                        BCS.Events.emit('report:photo:uploaded', {
                            file: result.file,
                            preview: result.dataUrl
                        });
                    }
                } else {
                    Logger.error('Photo processing failed:', result.error);
                    DOM.photo.val('');
                }
            });
        } else {
            // Fallback jika Camera module tidak tersedia
            processPhotoFallback(file);
        }
    }

    function processPhotoFallback(file) {
        // Validasi ukuran
        if (file.size > CONFIG.maxPhotoSize) {
            BCS.Toast?.error?.('Ukuran foto maksimal 5 MB') || alert('Ukuran foto terlalu besar. Maksimal 5MB.');
            DOM.photo.val('');
            return;
        }
        
        // Validasi tipe file
        if (!file.type.startsWith('image/')) {
            BCS.Toast?.error?.('Hanya file gambar yang diperbolehkan') || alert('Hanya file gambar yang diperbolehkan.');
            DOM.photo.val('');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target.result;
            state.photo = file;
            state.preview = dataUrl;
            DOM.preview.attr('src', dataUrl);
            DOM.previewWrapper.show();
            DOM.placeholder.hide();
            Logger.info('Photo uploaded:', file.name, file.size);
        };
        reader.onerror = () => {
            BCS.Toast?.error?.('Gagal membaca file') || alert('Gagal membaca file.');
        };
        reader.readAsDataURL(file);
    }

    function handleCategoryClick(e) {
        const target = $(e.currentTarget);
        const category = target.data('value'); // Fixed: menggunakan data-value
        
        if (!category) return;
        
        // Remove active class from all
        DOM.category.removeClass('active');
        
        // Add active class to selected
        target.addClass('active');
        
        state.category = category;
        Logger.info('Category selected:', category);
        
        // Emit event
        if (BCS.Events) {
            BCS.Events.emit('report:category:selected', { category });
        }
    }

    function handlePriorityClick(e) {
        const target = $(e.currentTarget);
        const priority = target.data('priority');
        
        if (!priority) return;
        
        // Remove active class from all
        DOM.priority.removeClass('active');
        
        // Add active class to selected
        target.addClass('active');
        
        state.priority = priority;
        Logger.info('Priority selected:', priority);
        
        // Emit event
        if (BCS.Events) {
            BCS.Events.emit('report:priority:selected', { priority });
        }
    }

    function handleFabClick() {
        const form = DOM.reportForm.length ? DOM.reportForm : $('#reportForm');
        
        if (!form.length) {
            Logger.warn('Report form not found');
            return;
        }
        
        // Scroll ke form
        $('html, body').animate({
            scrollTop: form.offset().top - 20
        }, CONFIG.animationDuration);
        
        // Focus ke deskripsi
        setTimeout(() => {
            DOM.deskripsi.focus();
        }, CONFIG.animationDuration + 100);
    }

    function handleSubmitSuccess(data) {
        BCS.Toast?.success?.('Laporan berhasil dikirim!') || alert('Laporan berhasil dikirim!');
        resetForm();
        DOM.submit.prop('disabled', false);
        DOM.submit.text('Kirim Laporan');
        Logger.info('Report submitted successfully', data);
    }

    function handleSubmitError(error) {
        BCS.Toast?.error?.(error?.message || 'Gagal mengirim laporan') || alert('Gagal mengirim laporan.');
        DOM.submit.prop('disabled', false);
        DOM.submit.text('Kirim Laporan');
        Logger.error('Report submission failed:', error);
    }

    // ==========================================
    // COLLECT FORM DATA (No validation)
    // ==========================================

    function collectFormData() {
        // Disable submit button
        DOM.submit.prop('disabled', true);
        DOM.submit.text('Mengirim...');
        
        return {
            category: state.category,
            priority: state.priority,
            location: DOM.lokasi.val().trim(),
            description: DOM.deskripsi.val().trim(),
            photo: state.photo,
            preview: state.preview,
            userName: DOM.userName.val().trim(),
            userDept: DOM.userDept.val().trim()
        };
    }

    // ==========================================
    // RESET
    // ==========================================

    function resetForm() {
        state.category = null;
        state.priority = 'NORMAL';
        state.photo = null;
        state.preview = null;
        
        DOM.deskripsi.val('');
        DOM.charCount.text('0');
        DOM.lokasi.val('');
        DOM.photo.val('');
        DOM.preview.attr('src', '');
        DOM.previewWrapper.hide();
        DOM.placeholder.show();
        
        DOM.category.removeClass('active');
        DOM.priority.removeClass('active');
        
        // Set default priority
        DOM.priority.filter('[data-priority="NORMAL"]').addClass('active');
        
        // Reset textarea height
        DOM.deskripsi.css('height', 'auto');
        
        // Emit reset event
        if (BCS.Events) {
            BCS.Events.emit('report:reset');
        }
        
        Logger.info('Form reset');
    }

    // ==========================================
    // RENDER
    // ==========================================

    function render() {
        DOM.charCount.text(DOM.deskripsi.val().length);
        
        // Set default priority
        DOM.priority.filter('[data-priority="NORMAL"]').addClass('active');
        
        // Inisialisasi textarea height
        DOM.deskripsi.css('height', 'auto');
    }

    // ==========================================
    // DESTROY
    // ==========================================

    function destroy() {
        if (!state.initialized) {
            return;
        }

        // Unbind events
        DOM.deskripsi.off('input');
        DOM.photo.off('change');
        DOM.category.off('click');
        DOM.priority.off('click');
        DOM.submit.off('click');
        DOM.fab.off('click');
        DOM.deskripsi.off('keydown');

        // Remove event listeners
        if (BCS.Events) {
            BCS.Events.off('report:reset', resetForm);
            BCS.Events.off('report:submit:success', handleSubmitSuccess);
            BCS.Events.off('report:submit:error', handleSubmitError);
        }

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

        cacheDOM();
        bindEvents();
        render();
        
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
        getState: () => ({ ...state }),
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
