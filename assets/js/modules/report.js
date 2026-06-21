// ======================================================
// Building Care System Enterprise v3.2
// assets/js/modules/report.js
// Sprint 4.3 - Part 1
// ======================================================

"use strict";

const ReportModule = (() => {
    let loadingModal = null;
    let successModal = null;
    let toast = null;
    const DRAFT_KEY = "BCS_REPORT_DRAFT";

    // ============================================
    // INIT
    // ============================================
   async function init() {

    App.log("Report Module Loaded");

    initComponent();
    loadUser();
    loadDraft();

    bindSubmit();
    bindResetButton();
    bindImagePreview();
    bindDropArea();
    bindCharacterCounter();
    bindDraft();

}
    // ============================================
    // COMPONENT
    // ============================================
    function initComponent() {
        loadingModal = new bootstrap.Modal(document.getElementById("loadingModal"));
        successModal = new bootstrap.Modal(document.getElementById("successModal"));
        toast = new bootstrap.Toast(document.getElementById("reportToast"));
    }

    // ============================================
    // USER SESSION
    // ============================================
    function loadUser() {
        const session = App.getSession();
        if (!session) return;

        document.getElementById("userName").textContent = session.nama || "-";
        document.getElementById("userRole").textContent = session.role || "-";
        document.getElementById("nama").value = session.nama || "";
        document.getElementById("departemen").value = session.departemen || "";
    }

    // ============================================
    // IMAGE PREVIEW & DROP AREA
    // ============================================
    function bindImagePreview() {
        const input = document.getElementById("photo");
        if (!input) return;
        input.addEventListener("change", previewImage);
    }

    function previewImage(event) {
        const file = event.target.files[0];
        if (!file) {
            document.getElementById("previewImage").classList.add("d-none");
            document.getElementById("previewPlaceholder").classList.remove("d-none");
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById("previewImage").src = e.target.result;
            document.getElementById("previewImage").classList.remove("d-none");
            document.getElementById("previewPlaceholder").classList.add("d-none");
        };
        reader.readAsDataURL(file);
    }

    function bindDropArea() {
        const wrapper = document.querySelector(".preview-wrapper");
        const input = document.getElementById("photo");
        if (!wrapper || !input) return;

        wrapper.addEventListener("dragover", (event) => {
            event.preventDefault();
            wrapper.classList.add("dragging");
        });

        wrapper.addEventListener("dragleave", () => {
            wrapper.classList.remove("dragging");
        });

        wrapper.addEventListener("drop", (event) => {
            event.preventDefault();
            wrapper.classList.remove("dragging");

            if (!event.dataTransfer.files.length) return;
            input.files = event.dataTransfer.files;
            previewImage({ target: input });
        });
    }

    // ============================================
    // CHARACTER COUNTER
    // ============================================
    function bindCharacterCounter() {
        const textarea = document.getElementById("deskripsi");
        if (!textarea) return;

        let counter = document.getElementById("charCounter");
        if (!counter) {
            counter = document.createElement("small");
            counter.id = "charCounter";
            counter.className = "text-muted float-end mt-2";
            textarea.parentNode.appendChild(counter);
        }

        const update = () => {
            counter.textContent = textarea.value.length + " / 500 karakter";
        };

        textarea.addEventListener("input", update);
        update();
    }

    // ============================================
    // AUTO SAVE DRAFT
    // ============================================
    function saveDraft() {
        const draft = {
            nama: document.getElementById("nama").value,
            departemen: document.getElementById("departemen").value,
            lokasi: document.getElementById("lokasi").value,
            kategori: document.getElementById("kategori").value,
            prioritas: document.getElementById("prioritas").value,
            deskripsi: document.getElementById("deskripsi").value
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    }

    function loadDraft() {
        const draft = localStorage.getItem(DRAFT_KEY);
        if (!draft) return;

        const data = JSON.parse(draft);
        Object.keys(data).forEach((key) => {
            const element = document.getElementById(key);
            if (element) {
                element.value = data[key];
            }
        });
    }

    function bindDraft() {
        ["lokasi", "kategori", "prioritas", "deskripsi"].forEach((id) => {
            const element = document.getElementById(id);
            if (!element) return;
            element.addEventListener("input", saveDraft);
        });
    }

    // ============================================
    // RESET BUTTON
    // ============================================
    function bindResetButton() {
        const button = document.getElementById("resetReport");
        if (!button) return;

        button.addEventListener("click", () => {
            localStorage.removeItem(DRAFT_KEY);
            formReset();
            showToast("Form berhasil direset", "success");
        });
    }

    function formReset() {
        document.getElementById("reportForm").reset();
        document.getElementById("previewImage").classList.add("d-none");
        document.getElementById("previewPlaceholder").classList.remove("d-none");
        loadUser();
    }

    // ============================================
    // TOAST & MODAL UTILITIES
    // ============================================
    function showToast(message) {
        document.getElementById("toastMessage").textContent = message;
        toast.show();
    }

    function showLoading() { loadingModal.show(); }
    function hideLoading() { loadingModal.hide(); }
    function showSuccess() { successModal.show(); }

    // ============================================
    // VALIDATION
    // ============================================
    function validateForm() {
        const required = ["nama", "departemen", "lokasi", "kategori", "prioritas", "deskripsi"];

        for (const id of required) {
            const element = document.getElementById(id);
            if (!element.value.trim()) {
                App.toast("Mohon lengkapi seluruh form.", "warning");
                element.focus();
                return false;
            }
        }
        return true;
    }

    // ============================================
    // IMAGE TO BASE64
    // ============================================
    function imageToBase64(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                resolve("");
                return;
            }
            const reader = new FileReader();
            reader.onload = () => {
                resolve(reader.result.split(",")[1]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // ============================================
    // SUBMIT REPORT
    // ============================================
    function bindSubmit() {
        const form = document.getElementById("reportForm");
        if (!form) return;

        form.addEventListener("submit", async (event) => {
            event.preventDefault();
            await submitReport();
        });
    }

    async function submitReport() {
        try {
            if (!validateForm()) return;

            showLoading();

            const photoFile = document.getElementById("photo").files[0];
            const image = await imageToBase64(photoFile);

            const payload = {
                token: App.getSession().token,
                nama: document.getElementById("nama").value,
                departemen: document.getElementById("departemen").value,
                lokasi: document.getElementById("lokasi").value,
                kategori: document.getElementById("kategori").value,
                prioritas: document.getElementById("prioritas").value,
                deskripsi: document.getElementById("deskripsi").value,
                photo: image,
                filename: photoFile ? photoFile.name : ""
            };

            console.log("[REPORT]", payload);

            const response = await Api.post("createReport", payload);
            hideLoading();

            if (!response || response.success !== true) {
                App.toast(response?.message || "Report gagal dikirim.", "error");
                return;
            }

            showSuccess();
            localStorage.removeItem(DRAFT_KEY); // Hapus draft jika submit berhasil
            formReset();
            App.log("Report Success");
        } catch (error) {
            hideLoading();
            console.error(error);
            App.handleError(error);
        }
    }

    // ============================================
    // PUBLIC API
    // ============================================
    return {
        init,
        previewImage,
        submitReport,
        formReset
    };
})();

// ======================================================
// START
// ======================================================
document.addEventListener("DOMContentLoaded", async () => {
    await ReportModule.init();
});
