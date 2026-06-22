// ======================================================
// Building Care System Enterprise v3.7
// assets/js/modules/history.js
// ======================================================

"use strict";

const HistoryModule = (() => {
    let reports = [];
    let filteredReports = [];
    let currentPage = 1;
    const PER_PAGE = 10;

    // ==========================================
    // INIT
    // ==========================================
    async function init() {
        App.log("History Module Loaded");
        await loadReports();
        bindSearch();
        bindSort();
    }

    // ==========================================
    // LOAD REPORTS
    // ==========================================
    async function loadReports() {
        try {
            const response = await Api.post("getReport");
            console.log("[HISTORY]", response);

            if (!response.success) {
                App.toast(response.message, "error");
                return;
            }

            reports = response.data.reports || [];
            reports.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
            filteredReports = [...reports];

            updateSummary();
            renderTable();
        } catch (err) {
            console.error(err);
            App.handleError(err);
        }
    }

    // ==========================================
    // SUMMARY
    // ==========================================
    function updateSummary() {
        setText("cardTotal", reports.length);
        setText("cardOpen", reports.filter(x => x.status === "OPEN").length);
        setText("cardProgress", reports.filter(x => x.status === "PROGRESS").length);
        setText("cardDone", reports.filter(x => x.status === "DONE").length);
    }

    function setText(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    // ==========================================
    // RENDER TABLE
    // ==========================================
    function renderTable() {
        const tbody = document.getElementById("historyTable");
        if (!tbody) return;

        tbody.innerHTML = "";
        const start = (currentPage - 1) * PER_PAGE;
        const end = start + PER_PAGE;
        const pageData = filteredReports.slice(start, end);

        if (!pageData.length) {
            tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-5 text-muted">
                    <i class="bi bi-inbox fs-1"></i>
                    <br>Tidak ada data
                </td>
            </tr>`;
            return;
        }

        const rows = [];
        pageData.forEach(report => {
            const photoContent = report.foto
                ? `<img src="${report.foto}" loading="lazy" width="55" height="55" class="rounded shadow-sm border" style="object-fit:cover; cursor:pointer;" onclick="HistoryModule.showPhoto('${report.foto}')" onerror="this.onerror=null; this.src='https://placehold.co/55x55?text=No+Image';">`
                : `<div class="bg-light border rounded d-flex align-items-center justify-content-center mx-auto" style="width:55px; height:55px;"><i class="bi bi-image text-secondary"></i></div>`;

            rows.push(`
            <tr>
                <td><strong>${report.id || "-"}</strong></td>
                <td>${report.tanggal || "-"}</td>
                <td>
                    <div class="fw-semibold">${report.nama || "-"}</div>
                    <small class="text-muted">${report.departemen || ""}</small>
                </td>
                <td>${report.kategori || "-"}</td>
                <td>${report.lokasi || "-"}</td>
                <td style="max-width:300px;">
                    <div class="text-truncate" title="${report.deskripsi || "-"}">
                        ${report.deskripsi || "-"}
                    </div>
                </td>
                <td>${badge(report.status)}</td>
                <td class="text-center">${photoContent}</td>
            </tr>`);
        });

        tbody.innerHTML = rows.join("");
        setText("totalReport", filteredReports.length);
        renderPagination();
    }

    // ==========================================
    // BADGE
    // ==========================================
    function badge(status) {
        switch (status) {
            case "OPEN":
                return `<span class="badge rounded-pill bg-warning text-dark">OPEN</span>`;
            case "PROGRESS":
                return `<span class="badge rounded-pill bg-primary">PROGRESS</span>`;
            case "DONE":
                return `<span class="badge rounded-pill bg-success">DONE</span>`;
            default:
                return `<span class="badge bg-secondary">${status || "-"}</span>`;
        }
    }

    // ==========================================
    // SEARCH & FILTER
    // ==========================================
    function bindSearch() {
        document.getElementById("searchReport")?.addEventListener("keyup", filterData);
        document.getElementById("filterStatus")?.addEventListener("change", filterData);
    }

    function filterData() {
        const keyword = document.getElementById("searchReport")?.value.toLowerCase() || "";
        const status = document.getElementById("filterStatus")?.value || "";

        filteredReports = reports.filter(r => {
            const text = [r.id, r.nama, r.departemen, r.kategori, r.lokasi, r.deskripsi].join(" ").toLowerCase();
            return text.includes(keyword) && (status === "" || r.status === status);
        });

        currentPage = 1;
        renderTable();
    }

    // ==========================================
    // SORT
    // ==========================================
    function bindSort() {
        document.getElementById("sortReport")?.addEventListener("change", e => {
            if (e.target.value === "desc") {
                filteredReports.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
            } else {
                filteredReports.sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));
            }
            renderTable();
        });
    }

    // ==========================================
    // PAGINATION
    // ==========================================
    function renderPagination() {
        const pagination = document.getElementById("pagination");
        if (!pagination) return;

        pagination.innerHTML = "";
        const totalPages = Math.ceil(filteredReports.length / PER_PAGE);
        let html = "";

        for (let i = 1; i <= totalPages; i++) {
            html += `
            <li class="page-item ${i === currentPage ? "active" : ""}">
                <a href="#" class="page-link" onclick="HistoryModule.goPage(${i});return false">${i}</a>
            </li>`;
        }
        pagination.innerHTML = html;
    }

    function goPage(page) {
        currentPage = page;
        renderTable();
    }

    // ==========================================
    // PHOTO MODAL
    // ==========================================
    function showPhoto(url) {
        const modalPhoto = document.getElementById("modalPhoto");
        const photoModal = document.getElementById("photoModal");
        if (!modalPhoto || !photoModal) return;

        modalPhoto.src = url;
        modalPhoto.onerror = function () {
            this.src = "https://placehold.co/1200x800?text=Image+Not+Available";
        };

        bootstrap.Modal.getOrCreateInstance(photoModal).show();
    }

    return { init, showPhoto, goPage };
})();

document.addEventListener("DOMContentLoaded", () => HistoryModule.init());
