// =====================================================
// Building Care System Enterprise v7.0 (Enterprise Edition)
// userReport.js
// ROLE USER - MOBILE REPORT
// Radiant Group Duri
// =====================================================

"use strict";

const UserReportModule = (() => {

    // 1. STATE MANAGEMENT TERPUSAT
    const state = {
        kategori: "",
        prioritas: "NORMAL",
        photo: "",
        filename: "",
        submitting: false
    };

    // ==========================================
    // INIT & LIFECYCLE
    // ==========================================
    async function init() {
        checkAuth();
        renderUser();
        renderPriority(); // Render initial state prioritas
        bindEvents();
    }

    // ==========================================
    // AUTH CHECK & ROUTING
    // ==========================================
    function checkAuth() {
        // 2. MIGRASI KE BCS.Auth
        const user = BCS.Auth?.user() || BCS.Store.get("BCS_USER");

        if (!user || !user.nama) {
            // 4 & 6. MIGRASI TOAST & NAVIGATION GO
            BCS.App.Toast.warning("Session Expired");
            BCS.App.Navigate.go("login.html");
            return false;
        }
        return user;
    }

    // ==========================================
    // CENTRALIZED EVENT BINDING (9. bindEvents)
    // ==========================================
    function bindEvents() {
        // Kategori Selection
        $(".category-item").on("click", function () {
            state.kategori = $(this).data("value");
            renderCategory();
        });

        // Prioritas Selection
        $(".priority-item").on("click", function () {
            state.prioritas = $(this).data("priority");
            renderPriority();
        });

        // Character Counter Deskripsi
        $("#deskripsi").on("input", function () {
            $("#charCount").text($(this).val().length);
        });

        // Photo Upload & Preview Processing
        $("#photo").on("change", handlePhotoChange);

        // Submit Button Trigger
        $("#submitReport").on("click", submitReport);
    }

    // ==========================================
    // HANDLERS
    // ==========================================
    function handlePhotoChange(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Validasi ukuran file menggunakan BCS.Validator (Max 5MB)
        const sizeValidation = BCS.Validator.validate(file.size, ["max:5242880"]);
        if (!sizeValidation.valid) {
            BCS.App.Toast.warning("Ukuran foto maksimal 5 MB");
            $("#photo").val("");
            return;
        }

        state.filename = file.name;

        const reader = new FileReader();
        reader.onload = function (ev) {
            state.photo = ev.target.result;
            renderPreview();
        };
        reader.readAsDataURL(file);
    }

    // ==========================================
    // SAVE REPORT WITH VALIDATOR & API ADAPTER
    // ==========================================
    async function submitReport() {
        if (state.submitting) return;

        const user = checkAuth();
        if (!user) return;

        const lokasi = $("#lokasi").val().trim();
        const deskripsi = $("#deskripsi").val().trim();

        // 7. MULTI-RULE CHAINING VALIDATION VIA BCS.Validator
        const lokasiValid = BCS.Validator.validate(lokasi, ["required"]);
        if (!lokasiValid.valid) {
            BCS.App.Toast.warning("Lokasi wajib diisi");
            return;
        }

        const kategoriValid = BCS.Validator.validate(state.kategori, ["required"]);
        if (!kategoriValid.valid) {
            BCS.App.Toast.warning("Pilih kategori kerusakan");
            return;
        }

        const deskripsiValid = BCS.Validator.validate(deskripsi, ["required", "min:5"]);
        if (!deskripsiValid.valid) {
            const hasValue = BCS.Validator.validate(deskripsi, ["required"]).valid;
            BCS.App.Toast.warning(hasValue ? "Deskripsi terlalu pendek" : "Deskripsi wajib diisi");
            return;
        }

        // Lock state submitting
        state.submitting = true;
        setSubmitButtonLoading(true);

        try {
            // 5. MIGRASI APPS LOADING SHOW
            BCS.App.Loading.show();

            const payload = {
                nama: user.nama,
                departemen: user.departemen || "-",
                lokasi: lokasi,
                kategori: state.kategori,
                prioritas: state.prioritas,
                deskripsi: deskripsi,
                photo: state.photo,
                filename: state.filename,
                timestamp: new Date().toISOString()
            };

            // 3. MIGRASI KE ENKAPSULASI API EXPLICIT ACTION BCS.Api.report
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
            BCS.App.Loading.hide(); // Hide Loader
            setSubmitButtonLoading(false);
        }
    }

    // ==========================================
    // 8. STATE RESET & STATE CLEARING
    // ==========================================
    function clearState() {
        state.kategori = "";
        state.prioritas = "NORMAL";
        state.photo = "";
        state.filename = "";
        state.submitting = false;

        // Reset Form input text element
        $("#lokasi").val("");
        $("#deskripsi").val("");
        $("#charCount").text("0");
        $("#photo").val("");

        // Trigger UI Sinkronisasi Rendering
        render();
    }

    // ==========================================
    // 10. UI STATE-DRIVEN RENDERING LAYER
    // ==========================================
    function render() {
        renderPreview();
        renderPriority();
        renderCategory();
    }

    function renderUser() {
        const user = BCS.Auth?.user() || BCS.Store.get("BCS_USER");
        if (user) {
            $("#userName").html(`Halo ${user.nama} 👋`);
            $("#userDept").text(user.departemen || "-");
        }
    }

    function renderPreview() {
        if (state.photo) {
            $("#previewImage")
                .removeClass("d-none")
                .attr("src", state.photo);
            $("#previewPlaceholder").hide();
        } else {
            $("#previewImage")
                .attr("src", "")
                .addClass("d-none");
            $("#previewPlaceholder").show();
        }
    }

    function renderPriority() {
        $(".priority-item").removeClass("active");
        $(`.priority-item[data-priority='${state.prioritas}']`).addClass("active");
    }

    function renderCategory() {
        $(".category-item").removeClass("active");
        if (state.kategori) {
            $(`.category-item[data-value='${state.kategori}']`).addClass("active");
        }
    }

    function setSubmitButtonLoading(isLoading) {
        const btn = $("#submitReport");
        if (isLoading) {
            btn.prop("disabled", true).html(`
                <i class="bi bi-hourglass-split"></i> Mengirim...
            `);
        } else {
            btn.prop("disabled", false).html(`
                <i class="bi bi-send-fill"></i> Kirim Report
            `);
        }
    }

    return {
        init
    };

})();

// ==========================================
// RUNNING ARCHITECTURE DOM
// ==========================================
$(document).ready(() => {
    UserReportModule.init();
});
