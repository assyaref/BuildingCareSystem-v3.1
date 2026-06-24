// =====================================================
// Building Care System Enterprise v3.4
// userHistory.js
// ROLE USER
// =====================================================

"use strict";

const UserHistoryModule = (() => {
    let reports = [];
    let filteredReports = [];

    // ==========================================
    // INIT
    // ==========================================
    async function init() {
        await loadReports();
        bindSearch();
    }

    // ==========================================
    // LOAD REPORT
    // ==========================================
    async function loadReports() {
        try {
            const user = Session.getUser();
            if (!user) {
                window.location.href = "index.html";
                return;
            }

            App.loading(true, "Memuat riwayat...");
            const res = await API.post("getReport", {});
            App.loading(false);

            if (!res.success) {
                App.toast(res.message, "danger");
                return;
            }

            // Filter laporan milik user
            reports = res.data.filter(r =>
                String(r.pelapor || "").toLowerCase() === String(user.nama || "").toLowerCase()
            );

            filteredReports = [...reports];
            render();
        } catch (err) {
            App.loading(false);
            console.error(err);
            App.toast(err.toString(), "danger");
        }
    }

    // ==========================================
    // SEARCH
    // ==========================================
    function bindSearch() {
        $("#searchHistory").on("keyup", function () {
            const keyword = $(this).val().toLowerCase();

            filteredReports = reports.filter(r =>
                (r.lokasi || "").toLowerCase().includes(keyword) ||
                (r.kategori || "").toLowerCase().includes(keyword)
            );

            render();
        });
    }

    // ==========================================
    // RENDER
    // ==========================================
    function render() {
        let html = "";

        if (!filteredReports.length) {
            html = `
            <div class="user-card text-center">
                <i class="bi bi-inbox" style="font-size:60px; color:#CBD5E1"></i>
                <h6 class="mt-3">Belum ada laporan</h6>
            </div>`;
            
            $("#historyList").html(html);
            return;
        }

        filteredReports.forEach(r => {
            html += `
            <div class="history-card">
                <div class="history-id">${r.id}</div>
                <h6 class="mt-3">${getIcon(r.kategori)} ${r.kategori}</h6>
                <small>📍 ${r.lokasi}</small>
                <br><br>
                <span class="${getStatusClass(r.status)} history-status">${r.status}</span>
                <div class="mt-3">
                    <small>${r.tanggal}</small>
                </div>
                <div class="mt-3">
                    <button class="btn btn-light btn-sm" onclick="UserHistoryModule.showPhoto('${r.foto}')">
                        <i class="bi bi-eye"></i> Foto
                    </button>
                </div>
            </div>`;
        });

        $("#historyList").html(html);
    }

    // ==========================================
    // STATUS
    // ==========================================
    function getStatusClass(status) {
        switch (String(status).toUpperCase()) {
            case "DONE":
                return "status-done";
            case "PROGRESS":
                return "status-progress";
            default:
                return "status-open";
        }
    }

    // ==========================================
    // ICON
    // ==========================================
    function getIcon(kategori) {
        switch (String(kategori).toUpperCase()) {
            case "LISTRIK":
                return "⚡";
            case "AC":
                return "❄";
            case "AIR":
                return "🚰";
            default:
                return "🏢";
        }
    }

    // ==========================================
    // PHOTO MODAL
    // ==========================================
    function showPhoto(url) {
        if (!url) {
            App.toast("Foto tidak tersedia", "warning");
            return;
        }

        $("#photoPreview").attr("src", url);
        new bootstrap.Modal(document.getElementById("photoModal")).show();
    }

    return {
        init,
        showPhoto
    };
})();

// ==========================================
// START
// ==========================================
$(document).ready(() => {
    UserHistoryModule.init();
});
