// ======================================================
// Building Care System Enterprise v3.2
// File : assets/js/modules/report.js
// Radiant Group Duri
// ======================================================

"use strict";

const Report = (() => {

    // ============================================
    // PRIVATE STATE
    // ============================================

    let initialized = false;

    let isSubmitting = false;

    let photoFile = null;

    // ============================================
    // INIT
    // ============================================

    async function init() {

        if (initialized) {
            return true;
        }

        App.log("Report Module Loaded");

        bindEvents();

        initialized = true;

        return true;

    }

    // ============================================
    // BIND EVENTS
    // ============================================

    function bindEvents() {

        const form = document.getElementById("reportForm");

        if (form) {

            form.addEventListener("submit", async (event) => {

                event.preventDefault();

                await submit();

            });

        }

        const resetButton =
            document.getElementById("resetReport");

        if (resetButton) {

            resetButton.addEventListener("click", reset);

        }

        const photoInput =
            document.getElementById("photo");

        if (photoInput) {

            photoInput.addEventListener("change", previewImage);

        }

    }

    // ============================================
    // GET FORM DATA
    // ============================================

    function getFormData() {

        return {

            nama:
                document.getElementById("nama")?.value.trim(),

            departemen:
                document.getElementById("departemen")?.value.trim(),

            lokasi:
                document.getElementById("lokasi")?.value.trim(),

            kategori:
                document.getElementById("kategori")?.value,

            prioritas:
                document.getElementById("prioritas")?.value,

            deskripsi:
                document.getElementById("deskripsi")?.value.trim()

        };

    }

    // ============================================
    // VALIDATION
    // ============================================

    function validate(data) {

        if (!data.nama)
            return "Nama wajib diisi.";

        if (!data.departemen)
            return "Departemen wajib diisi.";

        if (!data.lokasi)
            return "Lokasi wajib diisi.";

        if (!data.kategori)
            return "Kategori wajib dipilih.";

        if (!data.prioritas)
            return "Prioritas wajib dipilih.";

        if (!data.deskripsi)
            return "Deskripsi wajib diisi.";

        if (data.deskripsi.length < 10)
            return "Deskripsi minimal 10 karakter.";

        return true;

    }

    // ============================================
    // IMAGE PREVIEW
    // ============================================

    function previewImage(event) {

        const file = event.target.files[0];

        if (!file) return;

        photoFile = file;

        const reader = new FileReader();

        reader.onload = function(e) {

            const preview =
                document.getElementById("previewImage");

            if (preview) {

                preview.src = e.target.result;

                preview.classList.remove("d-none");

            }

        };

        reader.readAsDataURL(file);

    }

    // ============================================
    // SUBMIT
    // ============================================

    async function submit() {

        if (isSubmitting) {

            return;

        }

        isSubmitting = true;

        try {

            const data = getFormData();

            const validation = validate(data);

            if (validation !== true) {

                App.toast(validation, "warning");

                return;

            }

            App.showLoading();

            const session = App.getSession();

            const payload = {

                token: session.token,

                ...data,

                photo: photoFile

            };

            const result = await Api.post(
                "saveReport",
                payload
            );

            if (!result.success) {

                App.toast(
                    result.message ||
                    "Gagal menyimpan laporan.",
                    "error"
                );

                return;

            }

            App.toast(
                "Report berhasil dibuat.",
                "success"
            );

            reset();

            if (typeof DashboardView !== "undefined") {

                DashboardView.refresh();

            }

        }

        catch (err) {

            console.error(err);

            App.handleError(err);

        }

        finally {

            App.hideLoading();

            isSubmitting = false;

        }

    }

    // ============================================
    // RESET
    // ============================================

    function reset() {

        const form =
            document.getElementById("reportForm");

        if (form) {

            form.reset();

        }

        const preview =
            document.getElementById("previewImage");

        if (preview) {

            preview.src = "";

            preview.classList.add("d-none");

        }

        photoFile = null;

    }

    // ============================================
    // PUBLIC
    // ============================================

    return {

        init,

        submit,

        reset

    };

})();
