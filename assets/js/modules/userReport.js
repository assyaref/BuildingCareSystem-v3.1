// =====================================================
// Building Care System Enterprise v7.0 (Enterprise Edition)
// userReport.js
// ROLE USER - MOBILE REPORT
// Radiant Group Duri
// =====================================================

"use strict";

BCS.Modules.register("user-report", (() => {

    // 6. CONSTANTS & CONFIGURATIONS (Anti-Magic String)
    const DEFAULT_PRIORITY = "NORMAL";
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

    // 1. REFACTORED STATE ENGINE (Single Source of Truth)
    const state = {
        user: null,
        kategori: "",
        prioritas: DEFAULT_PRIORITY,
        photo: "",
        filename: "",
        submitting: false
    };

    // 7. CENTRALIZED DOM CACHE ENGINE (High-Performance Selector)
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
    // 3. INITIALIZATION LIFECYCLE
    // ==========================================
    async function init() {
        initDOMCache();
        
        // 1. Auth Dipanggil Sekali & Disimpan ke State
        state.user = BCS.Auth?.user() || BCS.Store.get("BCS_USER");
        if (!checkAuth()) return;

        bindEvents();
        render();
    }

    function checkAuth() {
        if (!state.user || !state.user.nama) {
            BCS.App.Toast.warning("Session Expired");
            BCS.App.Navigate.go("login.html");
            return false;
        }
        return true;
    }

    // ==========================================
    // 4. CENTRALIZED EVENT BINDING
    // ==========================================
    function bindEvents() {
        DOM.categoryItems.on("click", function () {
            state.kategori = $(this).data("value");
            renderCategory();
        });

        DOM.priorityItems.on("click", function () {
            state.prioritas = $(this).data("priority");
            renderPriority();
        });

        DOM.deskripsi.on("input", function () {
            DOM.charCount.text($(this).val().length);
        });

        DOM.photo.on("change", handlePhotoChange);
        DOM.submitReport.on("click", submitReport);
    }

    // ==========================================
    // HANDLERS & 4. PHOTO PROCESSING LAYER
    // ==========================================
    function handlePhotoChange(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Validasi Ukuran Menggunakan Core Validator
        const sizeValidation = BCS.Validator?.validate(file.size, [`max:${MAX_FILE_SIZE}`]);
        if (sizeValidation && !sizeValidation.valid) {
            BCS.App.Toast.warning("Ukuran foto maksimal 5 MB");
            DOM.photo.val("");
            return;
        }

        state.filename = file.name;
        processPhoto(file);
    }

    // Pintu Utama Pemrosesan Foto (PWA / Offline Optimization-ready)
    function processPhoto(file) {
        const reader = new FileReader();
        reader.onload = function (ev) {
            // Tempat kompresi, resize, rotate, atau EXIF parser di masa depan
            state.photo = ev.target.result; 
            renderPreview();
        };
        reader.readAsDataURL(file);
    }

    // ==========================================
    // 2. CENTRALIZED FORM VALIDATION ENGINE
    // ==========================================
    function validateForm() {
        const lokasi = DOM.lokasi.val().trim();
        const deskripsi = DOM.deskripsi.val().trim();

        if (!BCS.Validator) return true; // Fallback jika validator core absen

        if (!BCS.Validator.validate(lokasi, ["required"]).valid) {
            BCS.App.Toast.warning("Lokasi wajib diisi");
            return false;
        }

        if (!BCS.Validator.validate(state.kategori, ["required"]).valid) {
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
    // 3. ENTERPRISE PAYLOAD BUILDER
    // ==========================================
    function buildPayload() {
        return {
            nama: state.user.nama,
            departemen: state.user.departemen || "-",
            lokasi: DOM.lokasi.val().trim(),
            kategori: state.kategori,
            prioritas: state.prioritas,
            deskripsi: DOM.deskripsi.val().trim(),
            photo: state.photo,
            filename: state.filename,
            timestamp: new Date().toISOString(),
            
            // Scalable metadata expansion slots
            telemetry: {
                appVersion: BCS.manifest?.version || BCS.version?.framework || "7.0",
                device: navigator.userAgent,
                gps: null, // Siap diisi GeoLocation API
                battery: null
            }
        };
    }

    // ==========================================
    // API EXECUTION SUBMIT
    // ==========================================
    async function submitReport() {
        if (state.submitting) return;
        if (!checkAuth()) return;
        
        // 2. Encapsulated Form Validation
        if (!validateForm()) return;

        state.submitting = true;
        renderButton(); // Ubah ke state loading

        try {
            BCS.App.Loading.show();

            // 3. Payload Builder Isolation Call
            const payload = buildPayload();
            
            // Pemanggilan Action Terkapsul penuh tanpa string acak
            const res = await BCS.Api.report(payload);

            if (!res) {
                BCS.App.Toast.danger("Tidak ada respon server");
                return;
            }

            if (!res.success) {
                BCS.App.Toast.danger(res.message || "Gagal menyimpan report");
                return;
            }

            BCS.App.Toast.success("Report berhasil dikirim");
            clearState();

        } catch (err) {
            console.error(err);
            BCS.App.Toast.danger(err.toString());
        } finally {
            state.submitting = false;
            BCS.App.Loading.hide();
            renderButton(); // Mengembalikan tombol ke keadaan normal
        }
    }

    // ==========================================
    // 8. DATA STATE CLEARING ENGINE
    // ==========================================
    function clearState() {
        state.kategori = "";
        state.prioritas = DEFAULT_PRIORITY;
        state.photo = "";
        state.filename = "";
        state.submitting = false;

        // Reset elemen nilai teks murni
        DOM.lokasi.val("");
        DOM.deskripsi.val("");
        DOM.charCount.text("0");
        DOM.photo.val("");

        render(); // Sinkronisasi ulang antarmuka grafis
    }

    // ==========================================
    // 5. PIPELINE UNIFIED RENDER LAYER
    // ==========================================
    function render() {
        renderUser();
        renderForm();
    }

    function renderUser() {
        if (state.user) {
            DOM.userName.html(`Halo ${state.user.nama} 👋`);
            DOM.userDept.text(state.user.departemen || "-");
        }
    }

    function renderForm() {
        renderPreview();
        renderPriority();
        renderCategory();
        renderButton();
    }

    function renderPreview() {
        if (state.photo) {
            DOM.previewImage.removeClass("d-none").attr("src", state.photo);
            DOM.previewPlaceholder.hide();
        } else {
            DOM.previewImage.attr("src", "").addClass("d-none");
            DOM.previewPlaceholder.show();
        }
    }

    function renderPriority() {
        DOM.priorityItems.removeClass("active");
        $(`.priority-item[data-priority='${state.prioritas}']`).addClass("active");
    }

    function renderCategory() {
        DOM.categoryItems.removeClass("active");
        if (state.kategori) {
            $(`.category-item[data-value='${state.kategori}']`).addClass("active");
        }
    }

    // 9. State-Driven Button Component Renderer
    function renderButton() {
        if (state.submitting) {
            DOM.submitReport.prop("disabled", true).html(`
                <i class="bi bi-hourglass-split"></i> Mengirim...
            `);
        } else {
            DOM.submitReport.prop("disabled", false).html(`
                <i class="bi bi-send-fill"></i> Kirim Report
            `);
        }
    }

    // ==========================================
    // CLEANUP GARBAGE COLLECTOR
    // ==========================================
    function destroy() {
        // Melakukan unbind semua event listener saat modul dibongkar oleh Core System
        DOM.categoryItems.off("click");
        DOM.priorityItems.off("click");
        DOM.deskripsi.off("input");
        DOM.photo.off("change");
        DOM.submitReport.off("click");
        
        state.user = null;
        BCS.Logger.debug("UserReport", "Modul dihancurkan dengan bersih dari memori.");
    }

    // Return antarmuka publik yang dikenali oleh BCS.Modules Lifecycle Engine
    return {
        init,
        destroy
    };

})());

// ==========================================
// AUTOMATIC TRIGGER VIA BCS CORE SYSTEM
// ==========================================
$(document).ready(() => {
    // Dipanggil melalui Registry Modul Framework BCS Enterprise v7.0
    BCS.Modules.init("user-report");
});
