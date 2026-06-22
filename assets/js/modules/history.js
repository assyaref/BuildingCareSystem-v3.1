// ======================================================
// Building Care System Enterprise v3.5
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
    // SUMMARY CARD
    // ==========================================
    function updateSummary() {
        const setCardValue = (id, value) => {
            const element = document.getElementById(id);
            if (element) {
                element.replaceChildren(document.createTextNode(value));
            }
        };

        setCardValue("cardTotal", reports.length);
        setCardValue("cardOpen", reports.filter(r => r.status === "OPEN").length);
        setCardValue("cardProgress", reports.filter(r => r.status === "PROGRESS").length);
        setCardValue("cardDone", reports.filter(r => r.status === "DONE").length);
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
                    <td colspan="6" class="text-center py-5 text-muted">
                        <i class="bi bi-inbox fs-1"></i>
                        <br>Tidak ada data
                    </td>
                </tr>
            `;
            return;
        }

        const rows = [];
        pageData.forEach(report => {
            const photoContent = report.foto
                ? `<img src="${report.foto}" width="55" height="55" class="rounded shadow-sm" style="object-fit:cover; cursor:pointer" onclick="HistoryModule.showPhoto('${report.foto}')">`
                : `<i class="bi bi-image text-secondary"></i>`;

            rows.push(`
                <tr>
                    <td><strong>${report.id}</strong></td>
                    <td>${report.tanggal}</td>
                    <td>${report.kategori}</td>
                    <td>${report.lokasi}</td>
                    <td>${badge(report.status)}</td>
                    <td class="text-center">${photoContent}</td>
                </tr>
            `);
        });

        tbody.innerHTML = rows.join("");

        const totalReportEl = document.getElementById("totalReport");
        if (totalReportEl) totalReportEl.textContent = filteredReports.length;

        renderPagination();
    }

    // ==========================================
    // BADGE STATUS
    // ==========================================
    function badge(status) {
        switch (status) {
            case "OPEN":
                return `<span class="badge bg-warning">OPEN</span>`;
            case "PROGRESS":
                return `<span class="badge bg-primary">PROGRESS</span>`;
            case "DONE":
                return `<span class="badge bg-success">DONE</span>`;
            default:
                return status;
        }
    }

    // ==========================================
    // SEARCH
    // ==========================================
    function bindSearch() {
        document.getElementById("searchReport")?.addEventListener("keyup", filterData);
        document.getElementById("filterStatus")?.addEventListener("change", filterData);
    }

    // ==========================================
    // FILTER DATA
    // ==========================================
    function filterData() {
        const keyword = document.getElementById("searchReport")?.value.toLowerCase() || "";
        const status = document.getElementById("filterStatus")?.value || "";

        filteredReports = reports.filter(r => {
            const matchKeyword = (r.id?.toLowerCase().includes(keyword) || false)
                || (r.kategori?.toLowerCase().includes(keyword) || false)
                || (r.lokasi?.toLowerCase().includes(keyword) || false);

            const matchStatus = status === "" || r.status === status;

            return matchKeyword && matchStatus;
        });

        currentPage = 1;
        renderTable();
    }

    // ==========================================
    // SORT
    // ==========================================
    function bindSort() {
        document.getElementById("sortReport")?.addEventListener("change", e => {
            const mode = e.target.value;

            if (mode === "desc") {
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

        const pages = [];
        for (let i = 1; i <= totalPages; i++) {
            const activeClass = i === currentPage ? "active" : "";
            pages.push(`
                <li class="page-item ${activeClass}">
                    <a href="#" class="page-link" onclick="HistoryModule.goPage(${i}); return false;">
                        ${i}
                    </a>
                </li>
            `);
        }

        pagination.innerHTML = pages.join("");
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
        const photoModalEl = document.getElementById("photoModal");

        if (modalPhoto) modalPhoto.src = url;
        if (photoModalEl) {
            new bootstrap.Modal(photoModalEl).show();
        }
    }

    // ==========================================
    // EXPORT
    // ==========================================
    return {
        init,
        showPhoto,
        goPage
    };
})();

// ==========================================
// START
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    HistoryModule.init();
});
