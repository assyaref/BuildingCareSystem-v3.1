// =====================================================
// Building Care System Enterprise v3.4
// userReport.js
// ROLE USER - MOBILE REPORT
// Radiant Group Duri
// =====================================================

"use strict";

const UserReportModule = (() => {
    let selectedKategori = "";
    let selectedPrioritas = "NORMAL";
    let photoBase64 = "";
    let fileName = "";
    let submitting = false;

    // ==========================================
    // INIT
    // ==========================================
    async function init() {
        loadUser();
        bindKategori();
        bindPrioritas();
        bindCharacterCounter();
        bindPhotoPreview();
        bindSubmit();
    }

    // ==========================================
    // USER INFO
    // ==========================================
    function loadUser() {
        const user = AuthStore.user();

        if (!user || Object.keys(user).length === 0) {
            App.toast("Session Expired", "warning");
            location.replace("login.html");
            return;
        }

        $("#userName").html(`Halo ${user.nama || "User"} 👋`);
        $("#userDept").text(user.departemen || "-");
    }

    // ==========================================
    // KATEGORI
    // ==========================================
    function bindKategori() {
        $(".category-item").on("click", function () {
            $(".category-item").removeClass("active");
            $(this).addClass("active");
            selectedKategori = $(this).data("value");
        });
    }

    // ==========================================
    // PRIORITAS
    // ==========================================
    function bindPrioritas() {
        $(".priority-item").on("click", function () {
            $(".priority-item").removeClass("active");
            $(this).addClass("active");
            selectedPrioritas = $(this).data("priority");
        });
    }

    // ==========================================
    // CHARACTER COUNTER
    // ==========================================
    function bindCharacterCounter() {
        $("#deskripsi").on("input", function () {
            $("#charCount").text($(this).val().length);
        });
    }

    // ==========================================
    // PHOTO PREVIEW
    // ==========================================
    function bindPhotoPreview() {
        $("#photo").on("change", function (e) {
            const file = e.target.files[0];
            if (!file) return;

            fileName = file.name;

            $("#previewImage")
                .removeClass("d-none")
                .attr("src", URL.createObjectURL(file));

            $("#previewPlaceholder").hide();

            const reader = new FileReader();
            reader.onload = function (ev) {
                photoBase64 = ev.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    // ==========================================
    // SUBMIT BUTTON
    // ==========================================
    function bindSubmit() {
        $("#submitReport").on("click", submitReport);
    }

    // ==========================================
    // SAVE REPORT
    // ==========================================
    async function submitReport() {
        if (submitting) return;

        // VALIDASI
        if (!$("#lokasi").val().trim()) {
            App.toast("Lokasi wajib diisi", "warning");
            return;
        }

        if (!selectedKategori) {
            App.toast("Pilih kategori kerusakan", "warning");
            return;
        }

        if (!$("#deskripsi").val().trim()) {
            App.toast("Deskripsi wajib diisi", "warning");
            return;
        }

        submitting = true;

        try {
            App.loading(true, "Mengirim report...");
            
            const user = AuthStore.user();
            const payload = {
                nama: user.nama,
                departemen: user.departemen,
                lokasi: $("#lokasi").val().trim(),
                kategori: selectedKategori,
                prioritas: selectedPrioritas,
                deskripsi: $("#deskripsi").val().trim(),
                photo: photoBase64,
                filename: fileName
            };

            const res = await Api.post("saveReport", payload);

            if (!res.success) {
                App.toast(res.message, "danger");
                return;
            }

            App.toast("Report berhasil dikirim", "success");
            resetForm();
        } catch (err) {
            console.error(err);
            App.toast(err.toString(), "danger");
        } finally {
            submitting = false;
            App.loading(false);
        }
    }

    // ==========================================
    // RESET FORM
    // ==========================================
    function resetForm() {
        $("#lokasi").val("");
        $("#deskripsi").val("");
        $("#charCount").text("0");
        $("#photo").val("");

        $("#previewImage")
            .attr("src", "")
            .addClass("d-none");

        $("#previewPlaceholder").show();
        $(".category-item").removeClass("active");
        $(".priority-item").removeClass("active");
        $(".priority-item[data-priority='NORMAL']").addClass("active");

        selectedKategori = "";
        selectedPrioritas = "NORMAL";
        photoBase64 = "";
        fileName = "";
    }

    return { init };
})();

// ==========================================
// START MODULE
// ==========================================
$(document).ready(() => {
    UserReportModule.init();
});
