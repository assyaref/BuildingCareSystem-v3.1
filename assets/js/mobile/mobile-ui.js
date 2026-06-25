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
        maxDescription: 500,
        categories: ['Kebersihan', 'Kerusakan', 'Kelistrikan', 'Lainnya']
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
        DOM.priorityLabels = $('.priority-label');
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
        
        // Photo upload
        DOM.photo.on('change', handlePhotoUpload);
        
        // Category selection
        DOM.category.on('click', handleCategoryClick);
        
        // Priority selection
        DOM.priority.on('click', handlePriorityClick);
        
        // Submit report
        DOM.submit.on('click', handleSubmit);
        
        // FAB click
        DOM.fab.on('click', handleFabClick);
        
        // Keyboard shortcut - Enter to submit
        DOM.deskripsi.on('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
            }
        });
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
    }

    function handlePhotoUpload(e) {
        const file = e.target.files[0];
        
        if (!file) {
            return;
        }
        
        // Validasi ukuran
        if (file.size > CONFIG.maxPhotoSize) {
            Logger.warn('Photo size exceeds limit:', file.size);
            alert('Ukuran foto terlalu besar. Maksimal 5MB.');
            DOM.photo.val('');
            return;
        }
        
        // Validasi tipe file
        if (!file.type.startsWith('image/')) {
            Logger.warn('Invalid file type:', file.type);
            alert('Hanya file gambar yang diperbolehkan.');
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
            Logger.error('Failed to read photo');
            alert('Gagal membaca file.');
        };
        reader.readAsDataURL(file);
    }

    function handleCategoryClick(e) {
        const target = $(e.currentTarget);
        const category = target.data('category');
        
        if (!category) return;
        
        // Remove active class from all
        DOM.category.removeClass('active');
        
        // Add active class to selected
        target.addClass('active');
        
        state.category = category;
        Logger.info('Category selected:', category);
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
    }

    function handleSubmit() {
        // Validasi data
        if (!validateForm()) {
            return;
        }
        
        // Prepare data
        const reportData = {
            category: state.category,
            priority: state.priority,
            location: DOM.lokasi.val().trim(),
            description: DOM.deskripsi.val().trim(),
            photo: state.photo,
            timestamp: new Date().toISOString()
        };
        
        Logger.info('Submitting report:', reportData);
        
        // Disable submit button
        DOM.submit.prop('disabled', true);
        DOM.submit.text('Mengirim...');
        
        // Simulate API call - Replace with actual API call
        setTimeout(() => {
            alert('Laporan berhasil dikirim!');
            resetForm();
            DOM.submit.prop('disabled', false);
            DOM.submit.text('Kirim Laporan');
            Logger.info('Report submitted successfully');
        }, 1500);
    }

    function handleFabClick() {
        // Scroll ke form
        $('html, body').animate({
            scrollTop: $('#reportForm').offset().top - 20
        }, CONFIG.animationDuration);
        
        // Focus ke deskripsi
        setTimeout(() => {
            DOM.deskripsi.focus();
        }, CONFIG.animationDuration + 100);
    }

    // ==========================================
    // VALIDATION
    // ==========================================

    function validateForm() {
        // Reset error states
        clearErrors();
        
        let isValid = true;
        
        // Validate category
        if (!state.category) {
            showError('category', 'Pilih kategori laporan');
            isValid = false;
        }
        
        // Validate location
        const location = DOM.lokasi.val().trim();
        if (!location || location.length < 3) {
            showError('lokasi', 'Masukkan lokasi (min. 3 karakter)');
            isValid = false;
        }
        
        // Validate description
        const description = DOM.deskripsi.val().trim();
        if (!description || description.length < 10) {
            showError('deskripsi', 'Masukkan deskripsi (min. 10 karakter)');
            isValid = false;
        } else if (description.length > CONFIG.maxDescription) {
            showError('deskripsi', `Deskripsi maksimal ${CONFIG.maxDescription} karakter`);
            isValid = false;
        }
        
        if (!isValid) {
            Logger.warn('Form validation failed');
        }
        
        return isValid;
    }

    function showError(field, message) {
        const input = $(`#${field}`);
        input.addClass('error');
        
        // Tampilkan pesan error
        const errorMsg = $(`#${field}Error`);
        if (errorMsg.length) {
            errorMsg.text(message).show();
        } else {
            // Buat pesan error jika belum ada
            input.after(`<div id="${field}Error" class="error-message">${message}</div>`);
        }
        
        // Highlight dengan animasi
        input.css('border-color', 'red');
    }

    function clearErrors() {
        $('.error-message').remove();
        $('.error').removeClass('error');
        $('input, textarea, select').css('border-color', '');
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
        
        clearErrors();
        
        // Reset textarea height
        DOM.deskripsi.css('height', 'auto');
        
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
        resetForm,
        getState: () => ({ ...state }),
        validateForm
    });

})();

// ==========================================
// AUTO-INIT
// ==========================================

$(function() {
    BCS.Mobile.UI.init();
});
