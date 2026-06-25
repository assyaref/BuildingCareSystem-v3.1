// =====================================================
// Building Care System Enterprise v7.1 (Enterprise Edition)
// userReport.js - ROLE USER - MOBILE REPORT
// Radiant Group Duri
// =====================================================

"use strict";

/**
 * User Report Module
 */
const UserReportModule = (() => {

    // ==========================================
    // CONFIGURATION
    // ==========================================
    const TAG = "UserReport";
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

    // ==========================================
    // STATE
    // ==========================================
    const state = {
        user: {},
        form: {
            kategori: "",
            prioritas: "NORMAL",
            photo: "",
            filename: ""
        },
        ui: {
            submitting: false
        }
    };

    // ==========================================
    // DOM CACHE
    // ==========================================
    let DOM = {};

    function initDOM() {
        DOM = {
            userName: document.getElementById('userName'),
            userDept: document.getElementById('userDept'),
            userAvatar: document.getElementById('userAvatar'),
            lokasi: document.getElementById('lokasi'),
            deskripsi: document.getElementById('deskripsi'),
            charCount: document.getElementById('charCount'),
            photo: document.getElementById('photo'),
            previewImage: document.getElementById('previewImage'),
            previewPlaceholder: document.getElementById('previewPlaceholder'),
            photoRemove: document.getElementById('photoRemove'),
            submitReport: document.getElementById('submitReport'),
            categoryCards: document.querySelectorAll('.category-card'),
            prioritySelect: document.getElementById('prioritySelect'),
            previewWrapper: document.getElementById('previewWrapper')
        };
    }

    // ==========================================
    // INITIALIZATION
    // ==========================================
    function init() {
        console.log(`[${TAG}] Initializing...`);
        
        initDOM();
        loadUserData();
        bindEvents();
        renderForm();
        
        console.log(`[${TAG}] Ready`);
    }

    // ==========================================
    // LOAD USER DATA
    // ==========================================
    function loadUserData() {
        try {
            if (window.Session && Session.isLoggedIn()) {
                state.user = Session.getUser();
                const nama = Session.getNama() || state.user?.nama || state.user?.name || "User";
                const dept = Session.getDept() || state.user?.departemen || state.user?.department || "";

                if (DOM.userName) {
                    DOM.userName.textContent = `Halo ${nama} 👋`;
                }
                if (DOM.userDept) {
                    DOM.userDept.textContent = dept || Session.getNik() || "Building Care";
                }
                if (DOM.userAvatar) {
                    const initial = nama.charAt(0).toUpperCase();
                    DOM.userAvatar.textContent = /[A-Z]/.test(initial) ? initial : "👤";
                }
            } else {
                console.warn(`[${TAG}] User not logged in`);
                window.location.href = 'login.html';
            }
        } catch (e) {
            console.error(`[${TAG}] Failed to load user:`, e);
        }
    }

    // ==========================================
    // BIND EVENTS
    // ==========================================
    function bindEvents() {
        // Kategori - click
        DOM.categoryCards.forEach(card => {
            card.addEventListener('click', function() {
                const value = this.dataset.value;
                state.form.kategori = value;
                renderForm();
            });
        });

        // Prioritas - change dropdown
        if (DOM.prioritySelect) {
            DOM.prioritySelect.addEventListener('change', function() {
                state.form.prioritas = this.value;
                renderForm();
            });
        }

        // Deskripsi - char counter
        if (DOM.deskripsi) {
            DOM.deskripsi.addEventListener('input', function() {
                if (DOM.charCount) {
                    DOM.charCount.textContent = this.value.length;
                }
            });
        }

        // Photo - change
        if (DOM.photo) {
            DOM.photo.addEventListener('change', handlePhotoChange);
        }

        // Photo Remove
        if (DOM.photoRemove) {
            DOM.photoRemove.addEventListener('click', removePhoto);
        }

        // Submit
        if (DOM.submitReport) {
            DOM.submitReport.addEventListener('click', submitReport);
        }
    }

    // ==========================================
    // PHOTO HANDLING
    // ==========================================
    function handlePhotoChange(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Validasi ukuran
        if (file.size > MAX_FILE_SIZE) {
            alert('Ukuran foto maksimal 5 MB');
            DOM.photo.value = '';
            return;
        }

        // Validasi format
        if (!ALLOWED_MIMES.includes(file.type)) {
            alert('Format file harus JPEG, PNG, WEBP, atau HEIC/HEIF');
            DOM.photo.value = '';
            return;
        }

        state.form.filename = file.name;
        processPhoto(file);
    }

    function processPhoto(file) {
        const reader = new FileReader();
        reader.onload = function(ev) {
            state.form.photo = ev.target.result;
            renderForm();
        };
        reader.readAsDataURL(file);
    }

    function removePhoto() {
        state.form.photo = '';
        state.form.filename = '';
        DOM.photo.value = '';
        renderForm();
    }

    // ==========================================
    // RENDER FORM
    // ==========================================
    function renderForm() {
        // Kategori
        DOM.categoryCards.forEach(card => {
            card.classList.toggle('active', card.dataset.value === state.form.kategori);
        });

        // Prioritas dropdown
        if (DOM.prioritySelect) {
            DOM.prioritySelect.value = state.form.prioritas;
        }

        // Preview Photo
        if (state.form.photo) {
            DOM.previewImage.src = state.form.photo;
            DOM.previewImage.classList.remove('d-none');
            if (DOM.previewPlaceholder) DOM.previewPlaceholder.style.display = 'none';
            if (DOM.photoRemove) DOM.photoRemove.classList.remove('d-none');
        } else {
            DOM.previewImage.src = '';
            DOM.previewImage.classList.add('d-none');
            if (DOM.previewPlaceholder) DOM.previewPlaceholder.style.display = 'flex';
            if (DOM.photoRemove) DOM.photoRemove.classList.add('d-none');
        }

        // Submit button state
        renderButton();
    }

    // ==========================================
    // RENDER BUTTON
    // ==========================================
    function renderButton() {
        if (!DOM.submitReport) return;
        
        if (state.ui.submitting) {
            DOM.submitReport.disabled = true;
            DOM.submitReport.innerHTML = `<i class="bi bi-hourglass-split"></i> Mengirim...`;
        } else {
            DOM.submitReport.disabled = false;
            DOM.submitReport.innerHTML = `<i class="bi bi-send-fill"></i> Kirim Report`;
        }
    }

    // ==========================================
    // VALIDATION
    // ==========================================
    function validateForm() {
        const lokasi = DOM.lokasi?.value?.trim() || '';
        const deskripsi = DOM.deskripsi?.value?.trim() || '';

        if (!lokasi) {
            alert('Lokasi wajib diisi');
            DOM.lokasi?.focus();
            return false;
        }

        if (!state.form.kategori) {
            alert('Pilih kategori kerusakan');
            return false;
        }

        if (!deskripsi || deskripsi.length < 5) {
            alert('Deskripsi wajib diisi minimal 5 karakter');
            DOM.deskripsi?.focus();
            return false;
        }

        return true;
    }

    // ==========================================
    // BUILD PAYLOAD
    // ==========================================
    function buildPayload() {
        return {
            nama: state.user?.nama || state.user?.name || "User",
            nik: Session?.getNik() || state.user?.nik || "",
            departemen: state.user?.departemen || state.user?.department || "-",
            lokasi: DOM.lokasi?.value?.trim() || "",
            kategori: state.form.kategori,
            prioritas: state.form.prioritas,
            deskripsi: DOM.deskripsi?.value?.trim() || "",
            photo: state.form.photo || "",
            filename: state.form.filename || "",
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        };
    }

    // ==========================================
    // SUBMIT REPORT
    // ==========================================
    async function submitReport() {
        if (state.ui.submitting) return;
        if (!validateForm()) return;

        state.ui.submitting = true;
        renderButton();

        try {
            const payload = buildPayload();
            console.log(`[${TAG}] Submitting report:`, payload);

            // 🔥 Kirim ke API
            const response = await BCS.Api.post('saveReport', payload);
            console.log(`[${TAG}] Response:`, response);

            if (response && response.success) {
                alert('✅ Report berhasil dikirim!');
                clearForm();
            } else {
                alert('❌ Gagal mengirim report: ' + (response?.message || 'Unknown error'));
            }

        } catch (error) {
            console.error(`[${TAG}] Submit error:`, error);
            alert('❌ Terjadi kesalahan saat mengirim report');
        } finally {
            state.ui.submitting = false;
            renderButton();
        }
    }

    // ==========================================
    // CLEAR FORM
    // ==========================================
    function clearForm() {
        state.form.kategori = '';
        state.form.prioritas = 'NORMAL';
        state.form.photo = '';
        state.form.filename = '';

        if (DOM.lokasi) DOM.lokasi.value = '';
        if (DOM.deskripsi) DOM.deskripsi.value = '';
        if (DOM.charCount) DOM.charCount.textContent = '0';
        if (DOM.photo) DOM.photo.value = '';

        renderForm();
    }

    // ==========================================
    // DESTROY
    // ==========================================
    function destroy() {
        console.log(`[${TAG}] Destroying...`);
        // Cleanup events jika perlu
    }

    // ==========================================
    // EXPORT
    // ==========================================
    return {
        init,
        destroy
    };

})();

// ==========================================
// AUTO INIT
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    // Tunggu auth selesai
    setTimeout(() => {
        UserReportModule.init();
    }, 300);
});

// Export ke global
window.UserReport = UserReportModule;
