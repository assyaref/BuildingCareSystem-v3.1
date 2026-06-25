// =====================================================
// Building Care System Enterprise v7.0 (Enterprise Edition)
// history.js
// ROLE USER/ADMIN - RESPONSIVE TRANSACTION HISTORY
// Radiant Group Duri
// =====================================================

"use strict";

BCS.Modules.register("history", (() => {

    // CONSTANTS & CONFIGURATIONS
    const TAG = "HistoryModule";
    const SELECTOR_ACTIVE_CLASS = "active";

    // 1. STATE ENGINE ENTERPRISE
    const state = {
        reports: [],
        filtered: [],
        summary: {
            total: 0,
            open: 0,
            progress: 0,
            done: 0
        },
        search: "",
        status: "",
        sort: "desc",
        pagination: {
            page: 1,
            perPage: 10
        },
        ui: {
            loading: false
        }
    };

    // 2. CENTRALIZED DOM CACHE ENGINE
    let DOM = {};
    function initDOMCache() {
        DOM = {
            // Container & Wrappers
            tableBody: $("#historyTableBody"), // Sisi Desktop
            mobileContainer: $("#historyMobileContainer"), // Sisi Mobile Card
            emptyState: $("#historyEmptyState"),
            paginationContainer: $("#historyPagination"),
            
            // Filtering & Inputs
            searchField: $("#historySearch"),
            statusFilter: $("#historyStatusFilter"),
            sortTrigger: $("#historySortTrigger"),
            
            // Summary Widgets
            cardTotal: $("#cardTotal"),
            cardOpen: $("#cardOpen"),
            cardProgress: $("#cardProgress"),
            cardDone: $("#cardDone"),
            
            // Modals Form Cache
            photoModal: $("#photoModal"),
            detailModal: $("#detailModal"),
            updateModal: $("#updateModal"),
            
            // Modal Inputs & Fields
            photoImg: $("#photoImg"),
            detailContent: $("#detailContent"),
            updateId: $("#updateId"),
            updateStatus: $("#updateStatus"),
            updateTeknisi: $("#updateTeknisi"),
            updateCatatan: $("#updateCatatan"),
            btnSaveUpdate: $("#btnSaveUpdate")
        };
    }

    // ==========================================
    // INITIALIZATION LIFECYCLE
    // ==========================================
    async function init() {
        BCS.Logger.debug(TAG, "Memulai inisialisasi modul history.");
        initDOMCache();
        
        // 9. Event Bus Listener Subscriber (Realtime Sync tanpa reload)
        BCS.Events.on("report:created", handleReportCreated);
        
        bindEvents();
        await loadReports();
        BCS.Logger.info(TAG, "Lifecycle Init history selesai.");
    }

    // ==========================================
    // EVENTS BINDING ENGINE
    // ==========================================
    function bindEvents() {
        BCS.Logger.trace(TAG, "Melakukan binding event listener filters.");

        // 12. Search Trigger
        DOM.searchField.on("input", function () {
            state.search = $(this).val().toLowerCase();
            state.pagination.page = 1; // Reset ke halaman pertama
            executeProcessingPipeline();
        });

        // Filter Status Trigger
        DOM.statusFilter.on("change", function () {
            state.status = $(this).val();
            state.pagination.page = 1;
            executeProcessingPipeline();
        });

        // 13. Sort Sorting Order Trigger
        DOM.sortTrigger.on("click", function () {
            state.sort = state.sort === "desc" ? "asc" : "desc";
            executeProcessingPipeline();
        });

        // Modal Action Trigger (Delegation untuk performa tinggi)
        $(document).on("click", ".btn-show-photo", function () { openPhotoModal($(this).data("src")); });
        $(document).on("click", ".btn-show-detail", function () { openDetailModal($(this).data("id")); });
        $(document).on("click", ".btn-show-update", function () { openUpdateModal($(this).data("id")); });

        DOM.btnSaveUpdate.on("click", saveUpdate);
    }

    // 9. Realtime Event Bus Callback Handler
    async function handleReportCreated(eventData) {
        BCS.Logger.info(TAG, "Event 'report:created' terdeteksi, merefresh data saji.", eventData);
        await loadReports();
    }

    // ==========================================
    // API CONNECTOR LAYER
    // ==========================================
    async function loadReports() {
        if (state.ui.loading) return;
        
        // 5. Unified Loading Counter Guard
        state.ui.loading = true;
        BCS.App.Loading.show();

        try {
            // 4. Encapsulated Action API Call
            const response = await BCS.Api.history();

            if (!response || !response.success) {
                BCS.App.Toast.error(response?.message || "Gagal memuat riwayat");
                return;
            }

            state.reports = response.data?.reports || [];
            executeProcessingPipeline();

        } catch (err) {
            BCS.Error.handle(err);
        } finally {
            state.ui.loading = false;
            BCS.App.Loading.hide();
        }
    }

    // ==========================================
    // FILTER EXECUTION ENGINE
    // ==========================================
    function applyFilter() {
        state.filtered = state.reports.filter(report => {
            const matchSearch = !state.search || 
                (report.lokasi && report.lokasi.toLowerCase().includes(state.search)) ||
                (report.deskripsi && report.deskripsi.toLowerCase().includes(state.search)) ||
                (report.kategori && report.kategori.toLowerCase().includes(state.search));
                
            const matchStatus = !state.status || report.status === state.status;

            return matchSearch && matchStatus;
        });
        
        BCS.Logger.debug(TAG, `Filter diterapkan. Hasil: ${state.filtered.length} entri.`);
    }

    // ==========================================
    // 13. SORT EXECUTION ENGINE
    // ==========================================
    function applySort() {
        state.filtered.sort((a, b) => {
            const dateA = new Date(a.tanggal || a.timestamp);
            const dateB = new Date(b.tanggal || b.timestamp);
            return state.sort === "desc" ? dateB - dateA : dateA - dateB;
        });
    }

    // Processing Central Pipeline Sync
    function executeProcessingPipeline() {
        applyFilter();
        applySort();
        buildSummary(); // 11. Hitung statistika summary data
        render();
    }

    // ==========================================
    // 14. PAGINATION CONTROLLER ENGINE
    // ==========================================
    const Pagination = {
        getPaginatedData() {
            const start = (state.pagination.page - 1) * state.pagination.perPage;
            const end = start + state.pagination.perPage;
            return state.filtered.slice(start, end);
        },
        getTotalPages() {
            return Math.ceil(state.filtered.length / state.pagination.perPage) || 1;
        },
        next() {
            if (state.pagination.page < this.getTotalPages()) {
                state.pagination.page++;
                render();
            }
        },
        prev() {
            if (state.pagination.page > 1) {
                state.pagination.page--;
                render();
            }
        },
        first() {
            if (state.pagination.page !== 1) {
                state.pagination.page = 1;
                render();
            }
        },
        last() {
            const lastPage = this.getTotalPages();
            if (state.pagination.page !== lastPage) {
                state.pagination.page = lastPage;
                render();
            }
        },
        goPage(pageNum) {
            const target = parseInt(pageNum, 10);
            if (target >= 1 && target <= this.getTotalPages()) {
                state.pagination.page = target;
                render();
            }
        }
    };

    // ==========================================
    // 11. SUMMARY CALCULATOR BUILDER
    // ==========================================
    function buildSummary() {
        state.summary.total = state.reports.length;
        state.summary.open = state.reports.filter(r => r.status === "OPEN").length;
        state.summary.progress = state.reports.filter(r => r.status === "PROGRESS").length;
        state.summary.done = state.reports.filter(r => r.status === "DONE").length;
    }

    // ==========================================
    // 10. PIPELINE STRUCTURED RENDER LAYER
    // ==========================================
    function render() {
        renderSummary();
        
        if (state.filtered.length === 0) {
            renderEmpty();
            return;
        }

        DOM.emptyState.addClass("d-none");
        renderTable();       // Render View Desktop
        renderMobileCards(); // Render View Mobile Card Adaptive View
        renderPagination();
    }

    function renderSummary() {
        DOM.cardTotal.text(state.summary.total);
        DOM.cardOpen.text(state.summary.open);
        DOM.cardProgress.text(state.summary.progress);
        DOM.cardDone.text(state.summary.done);
    }

    // Render Mode Desktop (Table HTML View)
    function renderTable() {
        const paginatedData = Pagination.getPaginatedData();
        let html = "";

        paginatedData.forEach((report, index) => {
            const globalIndex = (state.pagination.page - 1) * state.pagination.perPage + index + 1;
            html += `
                <tr>
                    <td>${globalIndex}</td>
                    <td>${formatBadge(report.status)}</td>
                    <td><strong>${escapeHtml(report.lokasi)}</strong></td>
                    <td>${escapeHtml(report.kategori)}</td>
                    <td>${formatPriority(report.prioritas)}</td>
                    <td>${formatDate(report.tanggal || report.timestamp)}</td>
                    <td>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary btn-show-detail" data-id="${report.id}"><i class="bi bi-eye"></i></button>
                            ${report.photo ? `<button class="btn btn-outline-secondary btn-show-photo" data-src="${report.photo}"><i class="bi bi-image"></i></button>` : ""}
                            <button class="btn btn-outline-warning btn-show-update" data-id="${report.id}"><i class="bi bi-pencil-square"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        });

        DOM.tableBody.html(html);
    }

    // Target UI Mobile Adaptive View Implementation
    function renderMobileCards() {
        const paginatedData = Pagination.getPaginatedData();
        let html = "";

        paginatedData.forEach(report => {
            html += `
                <div class="card mb-2 shadow-sm border-start-0 border-top-0 border-bottom-0">
                    <div class="card-body p-3">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            ${formatBadge(report.status)}
                            <small class="text-muted"><i class="bi bi-clock-history"></i> ${formatRelativeTime(report.tanggal || report.timestamp)}</small>
                        </div>
                        <h6 class="card-title fw-bold mb-1">${escapeHtml(report.kategori || "General Report")}</h6>
                        <p class="card-text text-secondary small mb-2"><i class="bi bi-geo-alt-fill"></i> ${escapeHtml(report.lokasi)}</p>
                        <div class="d-flex justify-content-between align-items-center mt-2 pt-2 border-top">
                            <div>${formatPriority(report.prioritas)}</div>
                            <div class="btn-group btn-group-sm">
                                <button class="btn btn-light text-primary btn-show-detail" data-id="${report.id}"><i class="bi bi-info-circle"></i> Detail</button>
                                <button class="btn btn-light text-warning btn-show-update" data-id="${report.id}"><i class="bi bi-gear"></i> Status</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        DOM.mobileContainer.html(html);
    }

    function renderPagination() {
        const totalPages = Pagination.getTotalPages();
        let html = "";

        // First & Prev Buttons
        html += `<li class="page-item ${state.pagination.page === 1 ? 'disabled' : ''}"><a class="page-link" href="#" onclick="BCS.Modules.get('history').Pagination.first()"><i class="bi bi-chevron-double-left"></i></a></li>`;
        html += `<li class="page-item ${state.pagination.page === 1 ? 'disabled' : ''}"><a class="page-link" href="#" onclick="BCS.Modules.get('history').Pagination.prev()"><i class="bi bi-chevron-left"></i></a></li>`;

        // Page Numbers Loop
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= state.pagination.page - 1 && i <= state.pagination.page + 1)) {
                html += `<li class="page-item ${state.pagination.page === i ? 'active' : ''}"><a class="page-link" href="#" onclick="BCS.Modules.get('history').Pagination.goPage(${i})">${i}</a></li>`;
            } else if (i === state.pagination.page - 2 || i === state.pagination.page + 2) {
                html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
        }

        // Next & Last Buttons
        html += `<li class="page-item ${state.pagination.page === totalPages ? 'disabled' : ''}"><a class="page-link" href="#" onclick="BCS.Modules.get('history').Pagination.goPage(${state.pagination.page + 1})"><i class="bi bi-chevron-right"></i></a></li>`;
        html += `<li class="page-item ${state.pagination.page === totalPages ? 'disabled' : ''}"><a class="page-link" href="#" onclick="BCS.Modules.get('history').Pagination.last()"><i class="bi bi-chevron-double-right"></i></a></li>`;

        DOM.paginationContainer.html(html);
    }

    function renderEmpty() {
        DOM.tableBody.html("");
        DOM.mobileContainer.html("");
        DOM.emptyState.removeClass("d-none");
        DOM.paginationContainer.html("");
    }

    // ==========================================
    // MODAL WINDOW HANDLING & ACTION ENGINE
    // ==========================================
    function openPhotoModal(src) {
        DOM.photoImg.attr("src", src);
        BCS.App.Modal.open("photoModal");
    }

    function openDetailModal(id) {
        const report = state.reports.find(r => r.id == id);
        if (!report) return;

        let detailHtml = `
            <table class="table table-sm table-striped small">
                <tr><th>ID Report</th><td>#${report.id}</td></tr>
                <tr><th>Status</th><td>${formatBadge(report.status)}</td></tr>
                <tr><th>Lokasi</th><td><strong>${escapeHtml(report.lokasi)}</strong></td></tr>
                <tr><th>Kategori</th><td>${escapeHtml(report.kategori)}</td></tr>
                <tr><th>Prioritas</th><td>${formatPriority(report.prioritas)}</td></tr>
                <tr><th>Deskripsi</th><td>${escapeHtml(report.deskripsi || "-")}</td></tr>
                <tr><th>Teknisi</th><td>${escapeHtml(report.teknisi || "-")}</td></tr>
                <tr><th>Catatan Teknisi</th><td>${escapeHtml(report.catatanTeknisi || "-")}</td></tr>
            </table>
        `;
        DOM.detailContent.html(detailHtml);
        BCS.App.Modal.open("detailModal");
    }

    function openUpdateModal(id) {
        const report = state.reports.find(r => r.id == id);
        if (!report) return;

        DOM.updateId.val(report.id || "");
        DOM.updateStatus.val(report.status || "OPEN");
        DOM.updateTeknisi.val(report.teknisi || "");
        DOM.updateCatatan.val(report.catatanTeknisi || "");

        BCS.App.Modal.open("updateModal");
    }

    async function saveUpdate() {
        BCS.Logger.info(TAG, "Mengeksekusi penyimpanan update status report.");
        try {
            const payload = {
                id: DOM.updateId.val(),
                status: DOM.updateStatus.val(),
                teknisi: DOM.updateTeknisi.val(),
                catatan: DOM.updateCatatan.val()
            };

            // 4. API Explicit Adapter Mapping Update Call
            const response = await BCS.Api.reportUpdate(payload);

            if (!response.success) {
                BCS.App.Toast.error(response.message);
                return;
            }

            BCS.App.Toast.success("Status berhasil diperbarui");
            
            // Tutup Modal via Native CSS/Bootstrap Integration
            const updateModalEl = document.getElementById("updateModal");
            if (updateModalEl) bootstrap.Modal.getInstance(updateModalEl)?.hide();

            await loadReports();

        } catch (err) {
            BCS.Error.handle(err);
        }
    }

    // ==========================================
    // UTILITIES LOCAL HELPERS
    // ==========================================
    function formatBadge(status) {
        const config = {
            OPEN: { bg: "bg-light-primary text-primary", label: "🔵 OPEN" },
            PROGRESS: { bg: "bg-light-warning text-warning", label: "🟡 PROGRESS" },
            DONE: { bg: "bg-light-success text-success", label: "🟢 DONE" }
        };
        const current = config[status] || { bg: "bg-secondary text-white", label: status };
        return `<span class="badge ${current.bg} border-0 px-2.5 py-1">${current.label}</span>`;
    }

    function formatPriority(priority) {
        const badges = {
            TINGGI: '<span class="badge bg-danger">TINGGI</span>',
            NORMAL: '<span class="badge bg-info">NORMAL</span>',
            RENDAH: '<span class="badge bg-secondary">RENDAH</span>'
        };
        return badges[priority] || `<span class="badge bg-light">${priority}</span>`;
    }

    function formatDate(dateStr) {
        if (!dateStr) return "-";
        const d = new Date(dateStr);
        return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
    }

    function formatRelativeTime(dateStr) {
        if (!dateStr) return "-";
        const now = new Date();
        const past = new Date(dateStr);
        const diffMs = now - past;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return "Hari ini";
        if (diffDays === 1) return "Kemarin";
        return `${diffDays} hari lalu`;
    }

    function escapeHtml(str) {
        if (!str) return "";
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    // ==========================================
    // CLEANUP GARBAGE COLLECTOR
    // ==========================================
    function destroy() {
        BCS.Logger.debug(TAG, "Membongkar modul history, membersihkan event listeners.");
        
        DOM.searchField.off("input");
        DOM.statusFilter.off("change");
        DOM.sortTrigger.off("click");
        DOM.btnSaveUpdate.off("click");
        $(document).off("click", ".btn-show-photo");
        $(document).off("click", ".btn-show-detail");
        $(document).off("click", ".btn-show-update");

        // Unsubscribe Event Bus
        BCS.Events.off("report:created", handleReportCreated);

        // Nullify Cache Containers
        DOM = {};
        state.reports = [];
        state.filtered = [];
    }

    // Publikasi Antarmuka Internal Modul
    return {
        init,
        destroy,
        Pagination // Mengekspos objek Pagination agar onclick HTML dapat menjangkau scope
    };

})());

// ==========================================
// AUTOMATIC TRIGGER VIA BCS CORE SYSTEM
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    BCS.Modules.init("history");
});
