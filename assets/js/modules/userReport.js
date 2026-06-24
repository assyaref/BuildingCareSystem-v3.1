// =====================================================
// Building Care System Enterprise v3.4
// userReport.js
// ROLE USER - MOBILE REPORT
// =====================================================

"use strict";

const UserReportModule = (() => {
    let selectedKategori = "";
    let selectedPrioritas = "NORMAL";
    let photoBase64 = "";
    let fileName = "";

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
        const user = Session.getUser();
        if (!user) {
            window.location.href = "index.html";
            return;
        }

        $("#userName").html(`Halo ${user.nama} 👋`);
        $("#userDept").text(user.departemen || "");
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
    // FOTO PREVIEW
    // ==========================================
    function bindPhotoPreview() {
        $("#photo").on("change", function (e) {
            const file = e.target.files[0];
            if (!file) return;

            fileName = file.name;

            // Preview
            $("#previewImage")
                .removeClass("d-none")
                .attr("src", URL.createObjectURL(file));

            $("#previewPlaceholder").hide();

            // Base64
            const reader = new FileReader();
            reader.onload = function (ev) {
                photoBase64 = ev.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    // ==========================================
    // SUBMIT
    // ==========================================
    function bindSubmit() {
        $("#submitReport").on("click", submitReport);
    }

    // ==========================================
    // SAVE REPORT
    // ==========================================
    async function submitReport() {
        try {
            const user = Session.getUser();
            const payload = {
                nama: user.nama,
                departemen: user.departemen,
                lokasi: $("#lokasi").val(),
                kategori: selectedKategori,
                prioritas: selectedPrioritas,
                deskripsi: $("#deskripsi").val(),
                photo: photoBase64,
                filename: fileName
            };

            App.loading(true, "Mengirim report...");

            const res = await API.post("saveReport", payload);
            App.loading(false);

            if (!res.success) {
                App.toast(res.message, "danger");
                return;
            }

            App.toast("Report berhasil dikirim", "success");
            resetForm();
        } catch (err) {
            App.loading(false);
            console.error(err);
            App.toast(err.toString(), "danger");
        }
    }

    // ==========================================
    // RESET
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
// START
// ==========================================
$(document).ready(() => {
    UserReportModule.init();
});
