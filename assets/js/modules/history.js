// =====================================================
// Building Care System Enterprise v7.1 (Enterprise Edition)
// history.js - Vanilla JS Version (No jQuery Dependency)
// ROLE USER/ADMIN - RESPONSIVE TRANSACTION HISTORY
// Radiant Group Duri
// =====================================================

"use strict";

/**
 * ======================================================
 * DOM HELPER FUNCTIONS (Vanilla JS - No jQuery)
 * ======================================================
 */
const $ = (selector, context = document) => {
    if (typeof selector === 'string') {
        return context.querySelector(selector);
    }
    return selector;
};

const $$ = (selector, context = document) => {
    return Array.from(context.querySelectorAll(selector));
};

// jQuery-like wrapper untuk memudahkan transisi
function q(selector) {
    const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!el) return null;
    
    return {
        el: el,
        // DOM Manipulation
        html: (content) => { if (content !== undefined) { el.innerHTML = content; return q(el); } return el.innerHTML; },
        text: (content) => { if (content !== undefined) { el.textContent = content; return q(el); } return el.textContent; },
        val: (value) => { if (value !== undefined) { el.value = value; return q(el); } return el.value; },
        attr: (name, value) => { if (value !== undefined) { el.setAttribute(name, value); return q(el); } return el.getAttribute(name); },
        data: (name) => el.dataset[name],
        
        // CSS Classes
        addClass: (...classes) => { classes.forEach(c => el.classList.add(c)); return q(el); },
        removeClass: (...classes) => { classes.forEach(c => el.classList.remove(c)); return q(el); },
        toggleClass: (...classes) => { classes.forEach(c => el.classList.toggle(c)); return q(el); },
        hasClass: (className) => el.classList.contains(className),
        
        // Events
        on: (event, selector, handler) => {
            if (typeof selector === 'function') {
                // Direct event binding
                el.addEventListener(event, selector);
                return q(el);
            }
            // Event delegation
            el.addEventListener(event, function(e) {
                const target = e.target.closest(selector);
                if (target) {
                    handler.call(target, e);
                }
            });
            return q(el);
        },
        off: (event, handler) => {
            el.removeEventListener(event, handler);
            return q(el);
        },
        
        // Show/Hide
        show: () => { el.style.display = ''; return q(el); },
        hide: () => { el.style.display = 'none'; return q(el); },
        
        // Parent/Children
        parent: () => q(el.parentElement),
        find: (selector) => q(el.querySelector(selector)),
        findAll: (selector) => $$(selector, el),
        
        // Data
        get: () => el,
        length: el ? 1 : 0
    };
}

// Global $ function untuk kompatibilitas
window.$ = (selector) => q(selector);

// Register module ke BCS
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
    function initDOMCache() {
        DOM = {
            // Container & Wrappers
            tableBody: q("#historyTableBody"),
            mobileContainer: q("#historyMobileContainer"),
            emptyState: q("#historyEmptyState"),
            paginationContainer: q("#historyPagination"),
            
            // Filtering & Inputs
            searchField: q("#historySearch"),
            statusFilter: q("#historyStatusFilter"),
            sortTrigger: q("#historySortTrigger"),
            
            // Summary Widgets
            cardTotal: q("#cardTotal"),
            cardOpen: q("#cardOpen"),
            cardProgress: q("#cardProgress"),
            cardDone: q("#cardDone"),
            
            // Modals Form Cache
            photoModal: q("#photoModal"),
            detailModal: q("#detailModal"),
            updateModal: q("#updateModal"),
            
            // Modal Inputs & Fields
            photoImg: q("#photoImg"),
            detailContent: q("#detailContent"),
            updateId: q("#updateId"),
            updateStatus: q("#updateStatus"),
            updateTeknisi: q("#updateTeknisi"),
            updateCatatan: q("#updateCatatan"),
            btnSaveUpdate: q("#btnSaveUpdate")
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
    // EVENTS BINDING ENGINE
    // ==========================================
    function bindEvents() {
        BCS.Logger.trace(TAG, "Melakukan binding event listener filters.");

        // Search Trigger
        if (DOM.searchField && DOM.searchField.el) {
            DOM.searchField.el.addEventListener("input", function() {
                state.search = this.value.toLowerCase();
                state.pagination.page = 1;
                executeProcessingPipeline();
            });
        }

        // Filter Status Trigger
        if (DOM.statusFilter && DOM.statusFilter.el) {
            DOM.statusFilter.el.addEventListener("change", function() {
                state.status = this.value;
                state.pagination.page = 1;
                executeProcessingPipeline();
            });
        }

        // Sort Sorting Order Trigger
        if (DOM.sortTrigger && DOM.sortTrigger.el) {
            DOM.sortTrigger.el.addEventListener("click", function() {
                state.sort = state.sort === "desc" ? "asc" : "desc";
                executeProcessingPipeline();
            });
        }

        // 1. HIGH-PERFORMANCE EVENT DELEGATION (CSP-Ready Security compliance)
        if (DOM.paginationContainer && DOM.paginationContainer.el) {
            DOM.paginationContainer.el.addEventListener("click", function(e) {
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

        if (DOM.btnSaveUpdate && DOM.btnSaveUpdate.el) {
            DOM.btnSaveUpdate.el.addEventListener("click", saveUpdate);
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
            // Pastikan BCS.Api tersedia
            const api = window.BCS.Api || window.Api;
            if (!api) {
                throw new Error("API tidak tersedia");
            }

            const response = await api.post("getHistory", {});

            if (!response || !response.success) {
                BCS.App.Toast.error(response?.message || "Gagal memuat riwayat");
                return;
            }

            state.reports = response.data?.reports || [];
            
            // 5. PERFORMANCE BENCHMARK LOGGER END
            const elapsedTime = (performance.now() - startTime).toFixed(2);
            BCS.Logger.info(TAG, `Data riwayat berhasil dimuat dari API. ${elapsedTime}ms`);

            executeProcessingPipeline();

        } catch (err) {
            BCS.Logger.error(TAG, "Error loading reports:", err);
            BCS.App.Toast.error("Gagal memuat data riwayat");
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

        if (DOM.emptyState && DOM.emptyState.el) {
            DOM.emptyState.el.classList.remove("d-none");
        }
        renderTable();       
        renderMobileCards(); 
        renderPagination();
    }

    function renderSummary() {
        if (DOM.cardTotal && DOM.cardTotal.el) DOM.cardTotal.el.textContent = state.summary.total;
        if (DOM.cardOpen && DOM.cardOpen.el) DOM.cardOpen.el.textContent = state.summary.open;
        if (DOM.cardProgress && DOM.cardProgress.el) DOM.cardProgress.el.textContent = state.summary.progress;
        if (DOM.cardDone && DOM.cardDone.el) DOM.cardDone.el.textContent = state.summary.done;
    }

    function renderTable() {
        if (!DOM.tableBody || !DOM.tableBody.el) return;
        
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

        DOM.tableBody.el.innerHTML = html;
    }

    function renderMobileCards() {
        if (!DOM.mobileContainer || !DOM.mobileContainer.el) return;
        
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

        DOM.mobileContainer.el.innerHTML = html;
    }

    function renderPagination() {
        if (!DOM.paginationContainer || !DOM.paginationContainer.el) return;
        
        const totalPages = Pagination.getTotalPages();
        let html = "";

        html += `<li class="page-item ${state.pagination.page === 1 ? 'disabled' : ''}"><a class="page-link page-link-nav" href="#" data-action="first"><i class="bi bi-chevron-double-left"></i></a></li>`;
        html += `<li class="page-item ${state.pagination.page === 1 ? 'disabled' : ''}"><a class="page-link page-link-nav" href="#" data-action="prev"><i class="bi bi-chevron-left"></i></a></li>`;

        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= state.pagination.page - 1 && i <= state.pagination.page + 1)) {
                html += `<li class="page-item ${state.pagination.page === i ? 'active' : ''}"><a class="page-link page-link-nav" href="#" data-page="${i}">${i}</a></li>`;
            } else if (i === state.pagination.page - 2 || i === state.pagination.page + 2) {
                html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
        }

        html += `<li class="page-item ${state.pagination.page === totalPages ? 'disabled' : ''}"><a class="page-link page-link-nav" href="#" data-page="${state.pagination.page + 1}"><i class="bi bi-chevron-right"></i></a></li>`;
        html += `<li class="page-item ${state.pagination.page === totalPages ? 'disabled' : ''}"><a class="page-link page-link-nav" href="#" data-action="last"><i class="bi bi-chevron-double-right"></i></a></li>`;

        DOM.paginationContainer.el.innerHTML = html;
    }

    function renderEmpty() {
        if (DOM.tableBody && DOM.tableBody.el) DOM.tableBody.el.innerHTML = "";
        if (DOM.mobileContainer && DOM.mobileContainer.el) DOM.mobileContainer.el.innerHTML = "";
        if (DOM.emptyState && DOM.emptyState.el) DOM.emptyState.el.classList.remove("d-none");
        if (DOM.paginationContainer && DOM.paginationContainer.el) DOM.paginationContainer.el.innerHTML = "";
    }

    // ==========================================
    // MODAL WINDOW HANDLING
    // ==========================================
    function openPhotoModal(src) {
        if (DOM.photoImg && DOM.photoImg.el) DOM.photoImg.el.src = src;
        BCS.App.Modal.open("photoModal");
    }

    function openDetailModal(id) {
        const report = state.reports.find(r => r.id == id);
        if (!report) return;

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
        if (DOM.detailContent && DOM.detailContent.el) DOM.detailContent.el.innerHTML = detailHtml;
        BCS.App.Modal.open("detailModal");
    }

    function openUpdateModal(id) {
        const report = state.reports.find(r => r.id == id);
        if (!report) return;

        if (DOM.updateId && DOM.updateId.el) DOM.updateId.el.value = report.id || "";
        if (DOM.updateStatus && DOM.updateStatus.el) DOM.updateStatus.el.value = report.status || STATUS.OPEN;
        if (DOM.updateTeknisi && DOM.updateTeknisi.el) DOM.updateTeknisi.el.value = report.teknisi || "";
        if (DOM.updateCatatan && DOM.updateCatatan.el) DOM.updateCatatan.el.value = report.catatanTeknisi || "";

        BCS.App.Modal.open("updateModal");
    }

    async function saveUpdate() {
        BCS.Logger.info(TAG, "Mengeksekusi penyimpanan update status report.");
        try {
            const payload = {
                id: DOM.updateId ? DOM.updateId.el.value : "",
                status: DOM.updateStatus ? DOM.updateStatus.el.value : "",
                teknisi: DOM.updateTeknisi ? DOM.updateTeknisi.el.value : "",
                catatan: DOM.updateCatatan ? DOM.updateCatatan.el.value : ""
            };

            const api = window.BCS.Api || window.Api;
            if (!api) {
                throw new Error("API tidak tersedia");
            }

            const response = await api.post("updateReport", payload);

            if (!response || !response.success) {
                BCS.App.Toast.error(response?.message || "Gagal update status");
                return;
            }

            BCS.App.Toast.success("Status berhasil diperbarui");
            
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
            BCS.Logger.error(TAG, "Error saving update:", err);
            BCS.App.Toast.error("Terjadi kesalahan saat update");
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
        
        // Unsubscribe Event Bus
        BCS.Events.off("report:created", handleReportCreated);

        if (typeof BCS.App.Modal.closeAll === "function") {
            BCS.App.Modal.closeAll();
        }

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
document.addEventListener("DOMContentLoaded", () => {
    // Tunggu BCS siap
    setTimeout(() => {
        if (BCS.Modules && typeof BCS.Modules.init === "function") {
            BCS.Modules.init("history").catch(err => {
                BCS.Logger.error("History", "Failed to initialize:", err);
            });
        }
    }, 100);
});
