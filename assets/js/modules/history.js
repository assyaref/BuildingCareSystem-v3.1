// =====================================================
// Building Care System Enterprise v7.1 (Enterprise Edition)
// history.js - Vanilla JS Version (No jQuery Dependency)
// ROLE USER/ADMIN - RESPONSIVE TRANSACTION HISTORY
// Radiant Group Duri
// =====================================================

"use strict";

BCS.Modules.register("history", (() => {

    // 4. CENTRALIZED CONSTANTS ENGINE (Anti-Magic String & Object Freeze)
    const TAG = "HistoryModule";
    const SELECTOR_ACTIVE_CLASS = "active";
    
    const STATUS = Object.freeze({
        OPEN: "OPEN",
        PROGRESS: "PROGRESS",
        DONE: "DONE"
    });

    const PRIORITY = Object.freeze({
        TINGGI: "TINGGI",
        NORMAL: "NORMAL",
        RENDAH: "RENDAH"
    });

    // STATE ENGINE ENTERPRISE
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

    // DOM CACHE CONTAINER
    let DOM = {};
    
    /**
     * ==========================================
     * DOM HELPER FUNCTIONS (Vanilla JS)
     * ==========================================
     */
    function $(selector, context = document) {
        return context.querySelector(selector);
    }

    function $$(selector, context = document) {
        return Array.from(context.querySelectorAll(selector));
    }

    function getElement(id) {
        return document.getElementById(id);
    }

    function qs(selector) {
        return document.querySelector(selector);
    }

    function qsa(selector) {
        return document.querySelectorAll(selector);
    }

    function initDOMCache() {
        DOM = {
            // Container & Wrappers
            tableBody: getElement("historyTableBody"),
            mobileContainer: getElement("historyMobileContainer"),
            emptyState: getElement("historyEmptyState"),
            paginationContainer: getElement("historyPagination"),
            
            // Filtering & Inputs
            searchField: getElement("historySearch"),
            statusFilter: getElement("historyStatusFilter"),
            sortTrigger: getElement("historySortTrigger"),
            
            // Summary Widgets
            cardTotal: getElement("cardTotal"),
            cardOpen: getElement("cardOpen"),
            cardProgress: getElement("cardProgress"),
            cardDone: getElement("cardDone"),
            
            // Modals Form Cache
            photoModal: getElement("photoModal"),
            detailModal: getElement("detailModal"),
            updateModal: getElement("updateModal"),
            
            // Modal Inputs & Fields
            photoImg: getElement("photoImg"),
            detailContent: getElement("detailContent"),
            updateId: getElement("updateId"),
            updateStatus: getElement("updateStatus"),
            updateTeknisi: getElement("updateTeknisi"),
            updateCatatan: getElement("updateCatatan"),
            btnSaveUpdate: getElement("btnSaveUpdate")
        };
    }

    // ==========================================
    // INITIALIZATION LIFECYCLE
    // ==========================================
    async function init() {
        BCS.Logger.debug(TAG, "Memulai inisialisasi modul history.");
        initDOMCache();
        
        // Event Bus Listener Subscriber
        BCS.Events.on("report:created", handleReportCreated);
        
        bindEvents();
        await loadReports();
        BCS.Logger.info(TAG, "Lifecycle Init history selesai.");
    }

    // ==========================================
    // EVENTS BINDING ENGINE (Vanilla JS)
    // ==========================================
    function bindEvents() {
        BCS.Logger.trace(TAG, "Melakukan binding event listener filters.");

        // Search Trigger
        if (DOM.searchField) {
            DOM.searchField.addEventListener("input", function() {
                state.search = this.value.toLowerCase();
                state.pagination.page = 1;
                executeProcessingPipeline();
            });
        }

        // Filter Status Trigger
        if (DOM.statusFilter) {
            DOM.statusFilter.addEventListener("change", function() {
                state.status = this.value;
                state.pagination.page = 1;
                executeProcessingPipeline();
            });
        }

        // Sort Sorting Order Trigger
        if (DOM.sortTrigger) {
            DOM.sortTrigger.addEventListener("click", function() {
                state.sort = state.sort === "desc" ? "asc" : "desc";
                executeProcessingPipeline();
            });
        }

        // 1. HIGH-PERFORMANCE EVENT DELEGATION (CSP-Ready Security compliance)
        if (DOM.paginationContainer) {
            DOM.paginationContainer.addEventListener("click", function(e) {
                const target = e.target.closest(".page-link-nav");
                if (!target) return;
                
                e.preventDefault();
                const action = target.dataset.action;
                const pageNum = target.dataset.page;

                if (pageNum !== undefined) {
                    Pagination.goPage(parseInt(pageNum, 10));
                } else if (action && typeof Pagination[action] === "function") {
                    Pagination[action]();
                }
            });
        }

        // Modal Action Trigger via Document Delegation
        document.addEventListener("click", function(e) {
            const target = e.target.closest(".btn-show-photo");
            if (target) {
                openPhotoModal(target.dataset.src);
                return;
            }
            
            const detailTarget = e.target.closest(".btn-show-detail");
            if (detailTarget) {
                openDetailModal(detailTarget.dataset.id);
                return;
            }
            
            const updateTarget = e.target.closest(".btn-show-update");
            if (updateTarget) {
                openUpdateModal(updateTarget.dataset.id);
                return;
            }
        });

        if (DOM.btnSaveUpdate) {
            DOM.btnSaveUpdate.addEventListener("click", saveUpdate);
        }
    }

    // Realtime Event Bus Callback Handler
    async function handleReportCreated(eventData) {
        BCS.Logger.info(TAG, "Event 'report:created' terdeteksi, merefresh data saji.", eventData);
        await loadReports();
    }

    // ==========================================
    // API CONNECTOR LAYER
    // ==========================================
    async function loadReports() {
        if (state.ui.loading) return;
        
        state.ui.loading = true;
        BCS.App.Loading.show();
        
        // 5. PERFORMANCE BENCHMARK LOGGER START
        const startTime = performance.now();

        try {
            const response = await BCS.Api.history();

            if (!response || !response.success) {
                BCS.App.Toast.error(response?.message || "Gagal memuat riwayat");
                return;
            }

            state.reports = response.data?.reports || [];
            
            // 5. PERFORMANCE BENCHMARK LOGGER END
            const elapsedTime = (performance.now() - startTime).toFixed(2);
            BCS.Logger.performance(TAG, `Data riwayat berhasil dimuat dari API.`, `${elapsedTime}ms`);

            executeProcessingPipeline();

        } catch (err) {
            BCS.Error.handle(err);
        } finally {
            state.ui.loading = false;
            BCS.App.Loading.hide();
        }
    }

    // ==========================================
    // FILTER & SORT ENGINE
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
    }

    function applySort() {
        state.filtered.sort((a, b) => {
            const dateA = new Date(a.tanggal || a.timestamp);
            const dateB = new Date(b.tanggal || b.timestamp);
            return state.sort === "desc" ? dateB - dateA : dateA - dateB;
        });
    }

    function executeProcessingPipeline() {
        applyFilter();
        applySort();
        buildSummary(); 
        render();
    }

    // ==========================================
    // PAGINATION CONTROLLER ENGINE
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
    // 3. OPTIMIZED SUMMARY BUILDER (Single-Loop Algorithm O(N))
    // ==========================================
    function buildSummary() {
        let total = state.reports.length;
        let open = 0;
        let progress = 0;
        let done = 0;

        // Eksekusi iterasi tunggal linear berskala besar untuk menghindari multi-filtering array
        for (let i = 0; i < total; i++) {
            const currentStatus = state.reports[i].status;
            if (currentStatus === STATUS.OPEN) open++;
            else if (currentStatus === STATUS.PROGRESS) progress++;
            else if (currentStatus === STATUS.DONE) done++;
        }

        state.summary.total = total;
        state.summary.open = open;
        state.summary.progress = progress;
        state.summary.done = done;
    }

    // ==========================================
    // PIPELINE UNIFIED RENDER LAYER
    // ==========================================
    function render() {
        renderSummary();
        
        if (state.filtered.length === 0) {
            renderEmpty();
            return;
        }

        if (DOM.emptyState) DOM.emptyState.classList.add("d-none");
        renderTable();       
        renderMobileCards(); 
        renderPagination();
    }

    function renderSummary() {
        if (DOM.cardTotal) DOM.cardTotal.textContent = state.summary.total;
        if (DOM.cardOpen) DOM.cardOpen.textContent = state.summary.open;
        if (DOM.cardProgress) DOM.cardProgress.textContent = state.summary.progress;
        if (DOM.cardDone) DOM.cardDone.textContent = state.summary.done;
    }

    function renderTable() {
        if (!DOM.tableBody) return;
        
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
                            <button class="btn btn-outline-primary btn-show-detail" data-id="${escapeHtml(report.id)}"><i class="bi bi-eye"></i></button>
                            ${report.photo ? `<button class="btn btn-outline-secondary btn-show-photo" data-src="${escapeHtml(report.photo)}"><i class="bi bi-image"></i></button>` : ""}
                            <button class="btn btn-outline-warning btn-show-update" data-id="${escapeHtml(report.id)}"><i class="bi bi-pencil-square"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        });

        DOM.tableBody.innerHTML = html;
    }

    function renderMobileCards() {
        if (!DOM.mobileContainer) return;
        
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
                                <button class="btn btn-light text-primary btn-show-detail" data-id="${escapeHtml(report.id)}"><i class="bi bi-info-circle"></i> Detail</button>
                                <button class="btn btn-light text-warning btn-show-update" data-id="${escapeHtml(report.id)}"><i class="bi bi-gear"></i> Status</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        DOM.mobileContainer.innerHTML = html;
    }

    // 1. DATA-ATTRIBUTE SPECIFIC PAGISTRATION (Inline Onclick Removal)
    function renderPagination() {
        if (!DOM.paginationContainer) return;
        
        const totalPages = Pagination.getTotalPages();
        let html = "";

        // First & Prev Buttons
        html += `<li class="page-item ${state.pagination.page === 1 ? 'disabled' : ''}"><a class="page-link page-link-nav" href="#" data-action="first"><i class="bi bi-chevron-double-left"></i></a></li>`;
        html += `<li class="page-item ${state.pagination.page === 1 ? 'disabled' : ''}"><a class="page-link page-link-nav" href="#" data-action="prev"><i class="bi bi-chevron-left"></i></a></li>`;

        // Page Numbers Loop
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= state.pagination.page - 1 && i <= state.pagination.page + 1)) {
                html += `<li class="page-item ${state.pagination.page === i ? 'active' : ''}"><a class="page-link page-link-nav" href="#" data-page="${i}">${i}</a></li>`;
            } else if (i === state.pagination.page - 2 || i === state.pagination.page + 2) {
                html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
        }

        // Next & Last Buttons
        html += `<li class="page-item ${state.pagination.page === totalPages ? 'disabled' : ''}"><a class="page-link page-link-nav" href="#" data-page="${state.pagination.page + 1}"><i class="bi bi-chevron-right"></i></a></li>`;
        html += `<li class="page-item ${state.pagination.page === totalPages ? 'disabled' : ''}"><a class="page-link page-link-nav" href="#" data-action="last"><i class="bi bi-chevron-double-right"></i></a></li>`;

        DOM.paginationContainer.innerHTML = html;
    }

    function renderEmpty() {
        if (DOM.tableBody) DOM.tableBody.innerHTML = "";
        if (DOM.mobileContainer) DOM.mobileContainer.innerHTML = "";
        if (DOM.emptyState) DOM.emptyState.classList.remove("d-none");
        if (DOM.paginationContainer) DOM.paginationContainer.innerHTML = "";
    }

    // ==========================================
    // MODAL WINDOW HANDLING & 6. PROVIDER API MATCH
    // ==========================================
    function openPhotoModal(src) {
        if (DOM.photoImg) DOM.photoImg.src = src;
        BCS.App.Modal.open("photoModal");
    }

    function openDetailModal(id) {
        const report = state.reports.find(r => r.id == id);
        if (!report) return;

        // 2. STALWART INJECTION ESCAPING COMPLIANCE ON ALL SERVED DYNAMIC TEXT FIELDS
        let detailHtml = `
            <table class="table table-sm table-striped small">
                <tr><th>ID Report</th><td>#${escapeHtml(report.id)}</td></tr>
                <tr><th>Status</th><td>${formatBadge(report.status)}</td></tr>
                <tr><th>Lokasi</th><td><strong>${escapeHtml(report.lokasi)}</strong></td></tr>
                <tr><th>Kategori</th><td>${escapeHtml(report.kategori)}</td></tr>
                <tr><th>Prioritas</th><td>${formatPriority(report.prioritas)}</td></tr>
                <tr><th>Deskripsi</th><td>${escapeHtml(report.deskripsi || "-")}</td></tr>
                <tr><th>Teknisi</th><td>${escapeHtml(report.teknisi || "-")}</td></tr>
                <tr><th>Catatan Teknisi</th><td>${escapeHtml(report.catatanTeknisi || "-")}</td></tr>
            </table>
        `;
        if (DOM.detailContent) DOM.detailContent.innerHTML = detailHtml;
        BCS.App.Modal.open("detailModal");
    }

    function openUpdateModal(id) {
        const report = state.reports.find(r => r.id == id);
        if (!report) return;

        if (DOM.updateId) DOM.updateId.value = report.id || "";
        if (DOM.updateStatus) DOM.updateStatus.value = report.status || STATUS.OPEN;
        if (DOM.updateTeknisi) DOM.updateTeknisi.value = report.teknisi || "";
        if (DOM.updateCatatan) DOM.updateCatatan.value = report.catatanTeknisi || "";

        BCS.App.Modal.open("updateModal");
    }

    async function saveUpdate() {
        BCS.Logger.info(TAG, "Mengeksekusi penyimpanan update status report.");
        try {
            const payload = {
                id: DOM.updateId ? DOM.updateId.value : "",
                status: DOM.updateStatus ? DOM.updateStatus.value : "",
                teknisi: DOM.updateTeknisi ? DOM.updateTeknisi.value : "",
                catatan: DOM.updateCatatan ? DOM.updateCatatan.value : ""
            };

            const response = await BCS.Api.reportUpdate(payload);

            if (!response.success) {
                BCS.App.Toast.error(response.message);
                return;
            }

            BCS.App.Toast.success("Status berhasil diperbarui");
            
            // 6. Unified Modal Architecture Provider close execution call
            if (typeof BCS.App.Modal.close === "function") {
                BCS.App.Modal.close("updateModal");
            } else {
                const updateModalEl = document.getElementById("updateModal");
                if (updateModalEl) {
                    const modal = bootstrap.Modal.getInstance(updateModalEl);
                    if (modal) modal.hide();
                }
            }

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
            [STATUS.OPEN]: { bg: "bg-light-primary text-primary", label: "🔵 OPEN" },
            [STATUS.PROGRESS]: { bg: "bg-light-warning text-warning", label: "🟡 PROGRESS" },
            [STATUS.DONE]: { bg: "bg-light-success text-success", label: "🟢 DONE" }
        };
        const current = config[status] || { bg: "bg-secondary text-white", label: status };
        return `<span class="badge ${current.bg} border-0 px-2.5 py-1">${current.label}</span>`;
    }

    function formatPriority(priority) {
        const badges = {
            [PRIORITY.TINGGI]: '<span class="badge bg-danger">TINGGI</span>',
            [PRIORITY.NORMAL]: '<span class="badge bg-info">NORMAL</span>',
            [PRIORITY.RENDAH]: '<span class="badge bg-secondary">RENDAH</span>'
        };
        return badges[priority] || `<span class="badge bg-light">${escapeHtml(priority)}</span>`;
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

    // 2. SECURITY ENHANCED SECURE ESCAPER FOR SERVER DATA
    function escapeHtml(str) {
        if (!str) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // ==========================================
    // CLEANUP GARBAGE COLLECTOR
    // ==========================================
    function destroy() {
        BCS.Logger.debug(TAG, "Membongkar modul history, membersihkan event listeners.");
        
        // Remove event listeners - cleanup
        // Note: With Vanilla JS, we need to use removeEventListener with same function reference
        // For simplicity, we'll just clear DOM references
        
        // Unsubscribe Event Bus
        BCS.Events.off("report:created", handleReportCreated);

        // 6. Close All Open Active Modals via Unified Provider interface if available
        if (typeof BCS.App.Modal.closeAll === "function") {
            BCS.App.Modal.closeAll();
        }

        // Nullify Cache Containers
        DOM = {};
        state.reports = [];
        state.filtered = [];
    }

    return {
        init,
        destroy
    };

})());

// ==========================================
// AUTOMATIC TRIGGER VIA BCS CORE SYSTEM
// ==========================================
// Tunggu BCS siap sebelum inisialisasi
if (window.BCS && window.BCS.Modules) {
    document.addEventListener("DOMContentLoaded", () => {
        // Beri waktu untuk BCS siap
        setTimeout(() => {
            if (BCS.Modules && typeof BCS.Modules.init === "function") {
                BCS.Modules.init("history");
            }
        }, 100);
    });
}
