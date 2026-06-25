// =====================================================
// Building Care System Enterprise v7.0 (Enterprise Edition)
// userReport.js
// ROLE USER - MOBILE REPORT
// Radiant Group Duri
// =====================================================

"use strict";

BCS.Modules.register("user-report", (() => {

    // CONFIGURATIONS & CONSTANTS
    const TAG = "UserReport";
    const DEFAULT_PRIORITY = "NORMAL";
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    
    // 4. MIME VALIDATION EXTENSION (Including iOS High-Efficiency Image Container)
    const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

    // 1. SCALABLE STATE ENGINE
    const state = {
        user: {},
        form: {
            kategori: "",
            prioritas: DEFAULT_PRIORITY,
            photo: "",
            filename: ""
        },
        ui: {
            submitting: false
        }
    };

    // DOM CACHE CONTAINER
    let DOM = {};
    function initDOMCache() {
        DOM = {
            userName: $("#userName"),
            userDept: $("#userDept"),
            lokasi: $("#lokasi"),
            deskripsi: $("#deskripsi"),
            charCount: $("#charCount"),
            photo: $("#photo"),
            previewImage: $("#previewImage"),
            previewPlaceholder: $("#previewPlaceholder"),
            submitReport: $("#submitReport"),
            categoryItems: $(".category-item"),
            priorityItems: $(".priority-item")
        };
    }

    // ==========================================
    // INITIALIZATION LIFECYCLE
    // ==========================================
    async function init() {
        BCS.Logger.debug(TAG, "Memulai inisialisasi modul.");
        initDOMCache();
        
        state.user = BCS.Auth?.user() || BCS.Store.get("BCS_USER");
        if (!checkAuth()) return;

        bindEvents();
        render();
        BCS.Logger.info(TAG, "Lifecycle Init selesai dijalankan.");
    }

    // ==========================================
    // AUTHENTICATION GUARD
    // ==========================================
    function checkAuth() {
        if (!state.user || !state.user.nama) {
            BCS.Logger.warn(TAG, "Autentikasi gagal: Sesi kedaluwarsa.");
            BCS.App.Toast.warning("Session Expired");
            BCS.App.Navigate.go("login.html");
            return false;
        }
        return true;
    }

    // ==========================================
    // CENTRALIZED EVENT BINDING
    // ==========================================
    function bindEvents() {
        BCS.Logger.trace(TAG, "Melakukan binding event listener.");

        DOM.categoryItems.on("click", function () {
            state.form.kategori = $(this).data("value");
            renderForm();
        });

        DOM.priorityItems.on("click", function () {
            state.form.prioritas = $(this).data("priority");
            renderForm();
        });

        DOM.deskripsi.on("input", function () {
            DOM.charCount.text($(this).val().length);
        });

        DOM.photo.on("change", handlePhotoChange);
        DOM.submitReport.on("click", submitReport);
    }

    // ==========================================
    // HANDLERS & PHOTO PROCESSING
    // ==========================================
    function handlePhotoChange(e) {
        const file = e.target.files[0];
        if (!file) return;

        // 4. Multi-Criteria Photo Validation (Size & Mime Guard)
        if (file.size > MAX_FILE_SIZE) {
            BCS.Logger.warn(TAG, `File ditolak: Ukuran ${file.size} melebihi batas.`);
            BCS.App.Toast.warning("Ukuran foto maksimal 5 MB");
            DOM.photo.val("");
            return;
        }

        if (!ALLOWED_MIMES.includes(file.type)) {
            BCS.Logger.warn(TAG, `File ditolak: Format MIME '${file.type}' tidak diizinkan.`);
            BCS.App.Toast.warning("Format file harus JPEG, PNG, WEBP, atau HEIC/HEIF");
            DOM.photo.val("");
            return;
        }

        state.form.filename = file.name;
        processPhoto(file);
    }

    function processPhoto(file) {
        BCS.Logger.trace(TAG, `Memproses file foto: ${file.name}`);
        const reader = new FileReader();
        reader.onload = function (ev) {
            state.form.photo = ev.target.result; 
            renderForm();
        };
        reader.readAsDataURL(file);
    }

    // ==========================================
    // FORM VALIDATION ENGINE
    // ==========================================
    function validateForm() {
        const lokasi = DOM.lokasi.val().trim();
        const deskripsi = DOM.deskripsi.val().trim();

        if (!BCS.Validator) {
            BCS.Logger.warn(TAG, "Core Validator tidak ditemukan, melewati validasi.");
            return true;
        }

        if (!BCS.Validator.validate(lokasi, ["required"]).valid) {
            BCS.App.Toast.warning("Lokasi wajib diisi");
            return false;
        }

        if (!BCS.Validator.validate(state.form.kategori, ["required"]).valid) {
            BCS.App.Toast.warning("Pilih kategori kerusakan");
            return false;
        }

        const deskripsiValid = BCS.Validator.validate(deskripsi, ["required", "min:5"]);
        if (!deskripsiValid.valid) {
            const hasValue = BCS.Validator.validate(deskripsi, ["required"]).valid;
            BCS.App.Toast.warning(hasValue ? "Deskripsi terlalu pendek" : "Deskripsi wajib diisi");
            return false;
        }

        return true;
    }

    // ==========================================
    // PAYLOAD BUILDER LAYER
    // ==========================================
    function buildPayload() {
        const payload = {
            nama: state.user.nama,
            departemen: state.user.departemen || "-",
            lokasi: DOM.lokasi.val().trim(),
            kategori: state.form.kategori,
            prioritas: state.form.prioritas,
            deskripsi: DOM.deskripsi.val().trim(),
            photo: state.form.photo,
            filename: state.form.filename,
            timestamp: new Date().toISOString()
        };

        // Telemetry Isolation Call
        payload.telemetry = buildTelemetry();

        return payload;
    }

    function buildTelemetry() {
        // 5. EXTENDED HARDENED TELEMETRY DIAGNOSTICS
        return {
            appVersion: BCS.manifest?.version || BCS.version?.framework || "7.0",
            device: navigator.userAgent,
            gps: null,
            battery: null,
            screen: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language
        };
    }

    // ==========================================
    // API EXECUTION SUBMIT
    // ==========================================
    async function submitReport() {
        if (state.ui.submitting) return;
        if (!checkAuth()) return;
        if (!validateForm()) return;

        BCS.Logger.info(TAG, "Memulai pengiriman submit report form.");
        state.ui.submitting = true;
        Button.render();

        try {
            // 3. SAFE COUNTER GUARD FOR PARALLEL REQUESTS
            BCS.App.Loading.show();

            const payload = buildPayload();
            const res = await BCS.Api.report(payload);

            if (!res) {
                BCS.App.Toast.danger("Tidak ada respon server");
                return;
            }

            if (!res.success) {
                BCS.App.Toast.danger(res.message || "Gagal menyimpan report");
                return;
            }

            BCS.Logger.info(TAG, "Laporan sukses terkirim ke server API.");
            BCS.App.Toast.success("Report berhasil dikirim");

            // 2. FULLY ENHANCED PAYLOAD EMISSION FOR DASHBOARD/HISTORY SYNC
            BCS.Events.emit("report:created", {
                report: payload,
                response: res,
                timestamp: Date.now()
            });

            clearState();

        } catch (err) {
            BCS.Error.handle(err);
        } finally {
            state.ui.submitting = false;
            
            // 3. INTERNAL COUNTER SINKRONISASI CO-RELATION GUARD
            BCS.App.Loading.hide();
            Button.render();
        }
    }

    // ==========================================
    // 1. DATA STATE RESET & CLEARING ENGINE
    // ==========================================
    function resetState() {
        state.form.kategori = "";
        state.form.prioritas = DEFAULT_PRIORITY;
        state.form.photo = "";
        state.form.filename = "";
        state.ui.submitting = false;
    }

    function clearState() {
        resetState();

        DOM.lokasi.val("");
        DOM.deskripsi.val("");
        DOM.charCount.text("0");
        DOM.photo.val("");

        render();
    }

    // ==========================================
    // PIPELINE UNIFIED RENDER LAYER
    // ==========================================
    function render() {
        renderHeader();
        renderForm();
        renderFooter();
    }

    function renderHeader() {
        if (state.user) {
            DOM.userName.html(`Halo ${state.user.nama} 👋`);
            DOM.userDept.text(state.user.departemen || "-");
        }
    }

    function renderForm() {
        // Render Preview Photo
        if (state.form.photo) {
            DOM.previewImage.removeClass("d-none").attr("src", state.form.photo);
            DOM.previewPlaceholder.hide();
        } else {
            DOM.previewImage.attr("src", "").addClass("d-none");
            DOM.previewPlaceholder.show();
        }

        // Render Priority Active Items
        DOM.priorityItems.removeClass("active");
        $(`.priority-item[data-priority='${state.form.prioritas}']`).addClass("active");

        // Render Category Active Items
        DOM.categoryItems.removeClass("active");
        if (state.form.kategori) {
            $(`.category-item[data-value='${state.form.kategori}']`).addClass("active");
        }

        // Render Component Button State
        Button.render();
    }

    function renderFooter() {
        // Slot untuk render metadata status, badge, last login, atau copyright footer
    }

    // ==========================================
    // GLOBAL BUTTON COMPONENT OBJECT
    // ==========================================
    const Button = {
        render() {
            if (state.ui.submitting) {
                DOM.submitReport.prop("disabled", true).html(`
                    <i class="bi bi-hourglass-split"></i> Mengirim...
                `);
            } else {
                DOM.submitReport.prop("disabled", false).html(`
                    <i class="bi bi-send-fill"></i> Kirim Report
                `);
            }
        }
    };

    // ==========================================
    // CLEANUP GARBAGE COLLECTOR
    // ==========================================
    function destroy() {
        BCS.Logger.debug(TAG, "Mengeksekusi rutin pembongkaran modul destroy().");
        
        // Unbind event listeners
        DOM.categoryItems.off("click");
        DOM.priorityItems.off("click");
        DOM.deskripsi.off("input");
        DOM.photo.off("change");
        DOM.submitReport.off("click");
        
        // 1. RE-INITIALIZE SAFE MEMORY INSTEAD OF NULLIFYING THE ROOT OBJECT
        resetState();
        state.user = {};
        
        DOM = {};
        BCS.Logger.info(TAG, "Modul berhasil dihancurkan & memori dibersihkan untuk siklus berikutnya.");
    }

    return {
        init,
        destroy
    };

})());

// ==========================================
// AUTOMATIC LIFECYCLE TRIGGER
// ==========================================
$(document).ready(() => {
    BCS.Modules.init("user-report");
});
