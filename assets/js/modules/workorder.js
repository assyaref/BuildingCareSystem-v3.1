// ======================================================
// Building Care System Enterprise v8.0
// File : assets/js/modules/workorder.js
// ROLE : ADMIN | GENERAL AFFAIR | TECHNICIAN
// Radiant Group Duri
// Target Specification: Unified Store v2, Adaptive Polling, Performance Panels
// ======================================================

"use strict";

const WorkOrderModule = (() => {

    // =====================================================
    // 1. CONSTANTS & SYSTEM CONFIG
    // =====================================================
    const TAG = "WorkOrder";
    const IDLE_THRESHOLD = 300000; // 5 Menit Idle Activity Interceptor

    const CONFIG = Object.freeze({
        PER_PAGE: 10,
        DEFAULT_STATUS: "ALL",
        DEFAULT_PRIORITY: "ALL",
        DEFAULT_TECHNICIAN: "ALL",
        DEFAULT_SORT: "DESC",
        REFRESH_ACTIVE: 30000,   // Polling saat tab aktif
        REFRESH_HIDDEN: 300000   // Polling saat tab background (Adaptive Polling)
    });

    const STATUS = Object.freeze({
        OPEN: "OPEN",
        ASSIGNED: "ASSIGNED",
        PROGRESS: "PROGRESS",
        WAITING_APPROVAL: "WAITING APPROVAL",
        DONE: "DONE",
        ARCHIVED: "ARCHIVED"
    });

    const PRIORITY = Object.freeze({
        LOW: "LOW",
        NORMAL: "NORMAL",
        HIGH: "HIGH",
        URGENT: "URGENT"
    });

    const ROLE = Object.freeze({
        USER: "USER",
        GENERAL_AFFAIR: "GENERAL AFFAIR",
        TECHNICIAN: "TECHNICIAN",
        ADMIN: "ADMIN",
        ADMINISTRATOR: "ADMINISTRATOR",
        LEAD_BRANCH_SUPPORT: "LEAD BRANCH SUPPORT"
    });

    // =====================================================
    // 2. UNIFIED STORE ENGINE (BCS Enterprise v2 Integration)
    // =====================================================
    if (typeof BCS === "undefined") window.BCS = {};
    if (!BCS.Store) BCS.Store = {};

    const createInitialState = () => ({
        user: {},
        workorders: [],
        filtered: [],
        technicians: [],
        selected: null,
        summary: { total: 0, open: 0, assigned: 0, progress: 0, waiting: 0, done: 0, archived: 0 },
        filters: {
            keyword: "",
            status: CONFIG.DEFAULT_STATUS,
            priority: CONFIG.DEFAULT_PRIORITY,
            technician: CONFIG.DEFAULT_TECHNICIAN,
            sort: CONFIG.DEFAULT_SORT
        },
        pagination: { page: 1, perPage: CONFIG.PER_PAGE, totalPages: 1 },
        ui: {
            loading: false,
            submitting: false,
            autoRefresh: null,
            idleTimeout: null,
            isIdle: false,
            initialized: false
        },
        metrics: {
            openCount: 0,
            refreshCount: 0,
            apiTime: 0,
            renderTime: 0,
            memoryEstimate: "0 MB"
        }
    });

    // Binding local reference langsung ke namespace global Store BCS v2
    BCS.Store.workorder = createInitialState();
    const state = BCS.Store.workorder;

    // Analytics Stub Telemetry Fallback
    if (!BCS.Analytics) {
        BCS.Analytics = {
            track(eventName, payload = {}) {
                console.groupCollapsed(`[BCS Analytics v2 Telemetry: ${eventName}]`);
                console.log("Payload:", payload);
                console.groupEnd();
            }
        };
    }

    // =====================================================
    // 3. DOM CACHE
    // =====================================================
    const DOM = {
        summary: {
            total: $("#woTotal"), open: $("#woOpen"), assigned: $("#woAssigned"),
            progress: $("#woProgress"), waiting: $("#woWaiting"), done: $("#woDone")
        },
        filters: {
            search: $("#searchWorkOrder"), status: $("#filterStatus"),
            priority: $("#filterPriority"), technician: $("#filterTechnician")
        },
        table: $("#workorderTableBody"),
        empty: $("#emptyState"),
        pagination: $("#pagination"),
        mobileContainer: $("#mobileWorkOrderContainer"), 
        buttons: { refresh: $("#btnRefresh"), assign: $("#btnAssign"), update: $("#btnUpdate") },
        modals: { detail: $("#workorderModal"), assign: $("#assignModal") },
        timeline: $("#timelineContainer")
    };

    // =====================================================
    // 4. SECURITY & ROLE GUARD SYSTEM
    // =====================================================
    function checkAuth() {
        const user = BCS.Auth?.user?.() || BCS.Store?.get?.("BCS_USER");
        if (!user) {
            BCS.App?.Toast?.warning("Session Expired");
            BCS.App?.Navigate?.go("login.html");
            return null;
        }
        return user;
    }

    const RoleGuard = {
        isAdmin() {
            return [ROLE.ADMIN, ROLE.ADMINISTRATOR, ROLE.LEAD_BRANCH_SUPPORT].includes(state.user.role);
        },
        isGA() { return state.user.role === ROLE.GENERAL_AFFAIR; },
        isTechnician() { return state.user.role === ROLE.TECHNICIAN; },
        canAssign() { return this.isAdmin() || this.isGA(); },
        canUpdateStatus() { return this.isAdmin() || this.isGA() || this.isTechnician(); },
        canDelete() { return this.isAdmin(); }
    };

    // =====================================================
    // 5. WORKFLOW & TRANSACTION ENGINE
    // =====================================================
    const Workflow = (() => {
        const FLOW = Object.freeze({
            [STATUS.OPEN]: [STATUS.ASSIGNED],
            [STATUS.ASSIGNED]: [STATUS.PROGRESS, STATUS.OPEN],
            [STATUS.PROGRESS]: [STATUS.WAITING_APPROVAL],
            [STATUS.WAITING_APPROVAL]: [STATUS.DONE, STATUS.PROGRESS],
            [STATUS.DONE]: [STATUS.ARCHIVED],
            [STATUS.ARCHIVED]: []
        });
        return {
            canTransition: (from, to) => (FLOW[from] || []).includes(to),
            next: (status) => FLOW[status] || []
        };
    })();

    // =====================================================
    // 6. SERVICES & REMOTE DATA ACCESSORS
    // =====================================================
    async function loadTechnicians() {
        try {
            const res = await BCS.Api.user({ role: "TECHNICIAN" });
            if (res?.success) state.technicians = res.data || [];
        } catch (err) {
            BCS.Error?.handle(err);
        }
    }

    async function loadWorkOrders(force = false) {
        if (state.ui.isIdle) {
            console.warn(`[${TAG}] Request Aborted: Engine in IDLE state.`);
            return;
        }
        if (state.ui.loading) return;
        
        state.ui.loading = true;
        BCS.App?.Loading?.show();
        const tStart = performance.now();

        try {
            const res = await BCS.Api.workorder({ force });
            state.metrics.apiTime = performance.now() - tStart;

            if (!res?.success) {
                BCS.App?.Toast?.error(res?.message || "Gagal memuat data Work Order.");
                return;
            }
            state.workorders = res.data || [];
            state.metrics.refreshCount++;

            BCS.Analytics.track("workorder_refresh", { runNumber: state.metrics.refreshCount });
            processDataPipeline();
        } catch (err) {
            BCS.Error?.handle(err);
        } finally {
            state.ui.loading = false;
            BCS.App?.Loading?.hide();
        }
    }

    async function assignTechnician(id, technicianId) {
        if (!RoleGuard.canAssign()) {
            BCS.App?.Toast?.warning("Anda tidak memiliki hak melakukan assignment.");
            return;
        }
        try {
            BCS.App?.Loading?.show();
            const res = await BCS.Api.assign({ id, technician: technicianId });
            if (!res?.success) {
                BCS.App?.Toast?.error(res?.message);
                return;
            }
            BCS.App?.Toast?.success("Teknisi berhasil ditugaskan.");
            BCS.Events?.emit("workorder:assigned", res.data);
            await loadWorkOrders(true);
        } catch (err) {
            BCS.Error?.handle(err);
        } finally {
            BCS.App?.Loading?.hide();
        }
    }

    async function updateStatus(id, currentStatus, nextStatus) {
        if (!RoleGuard.canUpdateStatus()) {
            BCS.App?.Toast?.warning("Akses ditolak.");
            return;
        }
        if (!Workflow.canTransition(currentStatus, nextStatus)) {
            BCS.App?.Toast?.warning("Perubahan status tidak diperbolehkan.");
            return;
        }
        try {
            BCS.App?.Loading?.show();
            const res = await BCS.Api.updateStatus({ id, status: nextStatus });
            if (!res?.success) {
                BCS.App?.Toast?.error(res?.message);
                return;
            }
            BCS.App?.Toast?.success("Status berhasil diperbarui.");
            BCS.Events?.emit("report:updated", res.data);
            await loadWorkOrders(true);
        } catch (err) {
            BCS.Error?.handle(err);
        } finally {
            BCS.App?.Loading?.hide();
        }
    }

    async function loadTimeline(id) {
        try {
            const res = await BCS.Api.timeline({ id });
            return res?.success ? (res.data || []) : [];
        } catch (err) {
            BCS.Error?.handle(err);
            return [];
        }
    }

    // =====================================================
    // 7. COMPUTE PIPELINES (DATA PROCESSING)
    // =====================================================
    function processDataPipeline() {
        applyFilters();
        buildSummaryMetrics();
        buildPaginationEngine();
        renderPipeline();
    }

    function applyFilters() {
        const keyword = state.filters.keyword.toLowerCase();
        state.filtered = state.workorders.filter(item => {
            const matchKeyword = !keyword ||
                item.id.toLowerCase().includes(keyword) ||
                item.lokasi.toLowerCase().includes(keyword) ||
                item.kategori.toLowerCase().includes(keyword);

            const matchStatus = state.filters.status === "ALL" || item.status === state.filters.status;
            const matchPriority = state.filters.priority === "ALL" || item.prioritas === state.filters.priority;
            const matchTechnician = state.filters.technician === "ALL" || item.technician === state.filters.technician;

            return matchKeyword && matchStatus && matchPriority && matchTechnician;
        });
    }

    function buildSummaryMetrics() {
        state.summary = { total: state.filtered.length, open: 0, assigned: 0, progress: 0, waiting: 0, done: 0, archived: 0 };
        state.filtered.forEach(item => {
            switch (item.status) {
                case STATUS.OPEN: state.summary.open++; break;
                case STATUS.ASSIGNED: state.summary.assigned++; break;
                case STATUS.PROGRESS: state.summary.progress++; break;
                case STATUS.WAITING_APPROVAL: state.summary.waiting++; break;
                case STATUS.DONE: state.summary.done++; break;
                case STATUS.ARCHIVED: state.summary.archived++; break;
            }
        });
    }

    function buildPaginationEngine() {
        state.pagination.totalPages = Math.max(1, Math.ceil(state.filtered.length / state.pagination.perPage));
        if (state.pagination.page > state.pagination.totalPages) {
            state.pagination.page = 1;
        }
    }

    function getCurrentPageData() {
        const start = (state.pagination.page - 1) * state.pagination.perPage;
        return state.filtered.slice(start, start + state.pagination.perPage);
    }

    // =====================================================
    // 8. INTERFACE COMPONENT PAINTERS (RENDERING)
    // =====================================================
    const escapeHtml = (val) => { const d = document.createElement("div"); d.textContent = val ?? ""; return d.innerHTML; };

    const Badges = {
        status(status) {
            const color = { OPEN: "primary", ASSIGNED: "secondary", PROGRESS: "warning", "WAITING APPROVAL": "info", DONE: "success", ARCHIVED: "dark" };
            return `<span class="badge bg-${color[status] || "secondary"}">${status}</span>`;
        },
        priority(priority) {
            const color = { LOW: "secondary", NORMAL: "primary", HIGH: "warning", URGENT: "danger" };
            return `<span class="badge bg-${color[priority] || "secondary"}">${priority}</span>`;
        }
    };

    const ActionButtons = {
        render(item) {
            let html = `<button class="btn btn-primary btn-sm btn-detail" data-id="${item.id}"><i class="bi bi-eye"></i></button>`;
            if (RoleGuard.canAssign() && item.status === STATUS.OPEN) {
                html += ` <button class="btn btn-success btn-sm btn-assign" data-id="${item.id}"><i class="bi bi-person-plus"></i></button>`;
            }
            if (RoleGuard.canUpdateStatus() && item.status !== STATUS.ARCHIVED) {
                html += ` <button class="btn btn-warning btn-sm btn-status" data-id="${item.id}" data-status="${item.status}"><i class="bi bi-arrow-repeat"></i></button>`;
            }
            return html;
        }
    };

    const WorkOrderSummary = {
        render() {
            DOM.summary.total.text(state.summary.total);
            DOM.summary.open.text(state.summary.open);
            DOM.summary.assigned.text(state.summary.assigned);
            DOM.summary.progress.text(state.summary.progress);
            DOM.summary.waiting.text(state.summary.waiting);
            DOM.summary.done.text(state.summary.done);
        }
    };

    const WorkOrderTable = {
        render() {
            DOM.table.empty();
            getCurrentPageData().forEach(item => {
                DOM.table.append(`
                    <tr>
                        <td>${escapeHtml(item.id)}</td>
                        <td>${escapeHtml(item.lokasi)}</td>
                        <td>${escapeHtml(item.kategori)}</td>
                        <td>${Badges.priority(item.prioritas)}</td>
                        <td>${escapeHtml(item.technician || "-")}</td>
                        <td>${Badges.status(item.status)}</td>
                        <td>${ActionButtons.render(item)}</td>
                    </tr>
                `);
            });
        }
    };

    const WorkOrderCard = {
        render() {
            if (!DOM.mobileContainer.length) return;
            DOM.mobileContainer.empty();
            getCurrentPageData().forEach(item => {
                DOM.mobileContainer.append(`
                    <div class="wo-card shadow-sm border p-3 rounded mb-2 bg-white">
                        <div class="d-flex justify-content-between">
                            ${Badges.status(item.status)}
                            ${Badges.priority(item.prioritas)}
                        </div>
                        <h6 class="mt-3">${escapeHtml(item.lokasi)}</h6>
                        <div class="text-muted small">${escapeHtml(item.kategori)}</div>
                        <div class="small mt-2"><i class="bi bi-person"></i> ${escapeHtml(item.technician || "Belum Assigned")}</div>
                        <div class="mt-3 d-flex gap-1">${ActionButtons.render(item)}</div>
                    </div>
                `);
            });
        }
    };

    const WorkOrderTimeline = {
        render() {
            if (!DOM.timeline.length) return;
            DOM.timeline.empty();
            if (!state.selected?.timeline) return;

            state.selected.timeline.forEach(item => {
                DOM.timeline.append(`
                    <div class="timeline-item d-flex gap-3 mb-2">
                        <div class="timeline-dot border bg-primary rounded-circle" style="width:12px; height:12px; margin-top:5px;"></div>
                        <div class="timeline-content">
                            <div class="fw-bold">${escapeHtml(item.status)}</div>
                            <div class="small">${escapeHtml(item.user)}</div>
                            <div class="small text-muted">${escapeHtml(item.datetime)}</div>
                        </div>
                    </div>
                `);
            });
        }
    };

    function renderPagination() {
        DOM.pagination.empty();
        const total = state.pagination.totalPages;
        for (let i = 1; i <= total; i++) {
            DOM.pagination.append(`
                <button class="btn btn-sm ${i === state.pagination.page ? "btn-primary" : "btn-light"} page-number" data-page="${i}">
                    ${i}
                </button>
            `);
        }
    }

    function renderEmptyState() {
        if (!DOM.empty.length) return;
        if (state.filtered.length === 0) {
            DOM.empty.removeClass("d-none");
            DOM.table.closest("table").hide();
        } else {
            DOM.empty.addClass("d-none");
            DOM.table.closest("table").show();
        }
    }

    // Embedded Dev-hud realtime metrics panel node (v5 Core System Spec)
    const PerformancePanel = {
        containerId: "bcs-wo-perf-panel",
        render() {
            if (window.performance && window.performance.memory) {
                state.metrics.memoryEstimate = `${Math.round(window.performance.memory.usedJSHeapSize / (1024 * 1024))} MB`;
            } else {
                state.metrics.memoryEstimate = "N/A";
            }

            let panel = document.getElementById(this.containerId);
            if (!panel) {
                panel = document.createElement("div");
                panel.id = this.containerId;
                panel.style = "position:fixed;bottom:10px;left:10px;background:rgba(31,41,55,0.95);color:#10B981;font-family:monospace;padding:12px;border-radius:8px;font-size:11px;z-index:9999;border:1px solid #374151;width:220px;pointer-events:none;";
                document.body.appendChild(panel);
            }

            panel.innerHTML = `
                <div style="font-weight:bold;border-bottom:1px solid #374151;padding-bottom:4px;margin-bottom:6px;color:#F3F4F6">⚙️ BCS WO DEV METRICS</div>
                <div>API Latency   : <span style="color:#FFF">${state.metrics.apiTime.toFixed(1)} ms</span></div>
                <div>Render Engine : <span style="color:#FFF">${state.metrics.renderTime.toFixed(1)} ms</span></div>
                <div>Refresh Run   : <span style="color:#FFF">${state.metrics.refreshCount}</span></div>
                <div>Memory Heap   : <span style="color:#FFF">${state.metrics.memoryEstimate}</span></div>
                <div style="margin-top:4px;font-size:10px;color:${state.ui.isIdle ? '#EF4444' : '#6EE7B7'}">Status: ${state.ui.isIdle ? 'IDLE (PAUSED)' : 'ACTIVE'}</div>
            `;
        }
    };

    function renderPipeline() {
        const tStart = performance.now();
        WorkOrderSummary.render();
        WorkOrderTable.render();
        WorkOrderCard.render();
        WorkOrderTimeline.render();
        renderPagination();
        renderEmptyState();
        
        state.metrics.renderTime = performance.now() - tStart;
        PerformancePanel.render();
    }

    // =====================================================
    // 9. REACTION HANDLERS & INTERNAL CONTROLLERS
    // =====================================================
    function handleSearch(e) {
        state.filters.keyword = e.target.value;
        state.pagination.page = 1;
        processDataPipeline();
    }

    function handleFilter() {
        state.filters.status = DOM.filters.status.val();
        state.filters.priority = DOM.filters.priority.val();
        state.filters.technician = DOM.filters.technician.val();
        state.pagination.page = 1;
        processDataPipeline();
    }

    async function handleDetail(e) {
        const id = $(e.currentTarget).data("id");
        state.selected = state.workorders.find(item => item.id === id);
        if (!state.selected) return;

        state.selected.timeline = await loadTimeline(id);
        renderPipeline();
        BCS.App?.Modal?.open("#workorderModal");
    }

    // Modal Builder untuk Teknisi Assignment (v8 Assignment Object)
    const AssignmentModal = {
        open(workorderId) {
            this.selectedId = workorderId;
            const select = $("#assignTechnicianSelect");
            if (!select.length) {
                // Fallback prompt jika komponen Modal UI belum siap sepenuhnya
                const fallbackTech = prompt("Masukkan ID Teknisi:");
                if (fallbackTech) assignTechnician(workorderId, fallbackTech);
                return;
            }
            select.empty().append('<option value="">-- Pilih Teknisi --</option>');
            state.technicians.forEach(tech => {
                select.append(`<option value="${tech.id}">${escapeHtml(tech.nama)}</option>`);
            });
            BCS.App?.Modal?.open("#assignModal");
        },
        submit() {
            const technician = $("#assignTechnicianSelect").val();
            if (!technician) {
                BCS.App?.Toast?.warning("Pilih teknisi terlebih dahulu.");
                return;
            }
            assignTechnician(this.selectedId, technician);
            this.close();
        },
        close() {
            this.selectedId = null;
            BCS.App?.Modal?.close("#assignModal");
        }
    };

    function handleStatusUpdateEvent(e) {
        const id = $(e.currentTarget).data("id");
        const current = $(e.currentTarget).data("status");
        const nextPossibleStates = Workflow.next(current);

        if (!nextPossibleStates.length) {
            BCS.App?.Toast?.warning("Work Order telah mencapai siklus status akhir.");
            return;
        }
        // Maju otomatis ke transisi ideal sekuensial terdekat
        updateStatus(id, current, nextPossibleStates[0]);
    }

    // =====================================================
    // 10. TIME CONTEXT & INTERCEPTOR CONTROLLERS
    // =====================================================
    function startAutoRefresh() {
        stopAutoRefresh();
        const intervalTime = document.hidden ? CONFIG.REFRESH_HIDDEN : CONFIG.REFRESH_ACTIVE;
        state.ui.autoRefresh = setInterval(() => loadWorkOrders(), intervalTime);
    }

    function stopAutoRefresh() {
        if (state.ui.autoRefresh) {
            clearInterval(state.ui.autoRefresh);
            state.ui.autoRefresh = null;
        }
    }

    function resetIdleTimer() {
        if (state.ui.isIdle) {
            state.ui.isIdle = false;
            BCS.Analytics.track("user_active_workorder");
            loadWorkOrders(true);
        }
        clearTimeout(state.ui.idleTimeout);
        state.ui.idleTimeout = setTimeout(() => {
            state.ui.isIdle = true;
            BCS.Analytics.track("user_idle_workorder_paused");
            PerformancePanel.render();
        }, IDLE_THRESHOLD);
    }

    // Utilities Debouncer
    function debounce(fn, delay) {
        let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
    }

    // =====================================================
    // 11. BINDING & ECO-SYSTEM WIRES
    // =====================================================
    function bindEvents() {
        DOM.filters.search.on("input", debounce(handleSearch, 300));
        DOM.filters.status.on("change", handleFilter);
        DOM.filters.priority.on("change", handleFilter);
        DOM.filters.technician.on("change", handleFilter);

        DOM.buttons.refresh.on("click", () => { resetIdleTimer(); loadWorkOrders(true); });
        
        DOM.table.on("click", ".btn-detail", handleDetail);
        DOM.table.on("click", ".btn-assign", (e) => AssignmentModal.open($(e.currentTarget).data("id")));
        DOM.table.on("click", ".btn-status", handleStatusUpdateEvent);

        DOM.pagination.on("click", ".page-number", (e) => {
            state.pagination.page = $(e.currentTarget).data("page");
            processDataPipeline();
        });

        // Trigger Submit pada penugasan teknisi modal
        $("#btnSubmitAssign").on("click", () => AssignmentModal.submit());

        // Adaptive document lifecycle tab listener
        document.addEventListener("visibilitychange", () => startAutoRefresh());

        // User Input Interceptors (Anti-idle system)
        ["mousemove", "keydown", "click", "touchstart", "scroll"].forEach(ev => {
            document.addEventListener(ev, resetIdleTimer, { passive: true });
        });

        // Global Event Bus Synchronizer
        if (typeof BCS !== "undefined" && BCS.Events) {
            BCS.Events.on("report:created", () => loadWorkOrders(true));
            BCS.Events.on("report:updated", () => loadWorkOrders(true));
            BCS.Events.on("workorder:assigned", () => loadWorkOrders(true));
            BCS.Events.on("workorder:completed", () => loadWorkOrders(true));
        }
    }

    // =====================================================
    // 12. LIFECYCLE INITIALIZER & EXPOSURE
    // =====================================================
    return {
        async init() {
            BCS.Logger?.info?.(TAG, "Initializing WorkOrder Module v8.0");
            try {
                state.user = checkAuth();
                if (!state.user) return;

                bindEvents();
                await loadTechnicians();
                await loadWorkOrders();

                state.ui.initialized = true;
                state.metrics.openCount = 1;
                resetIdleTimer();
                startAutoRefresh();

                BCS.Analytics.track("workorder_module_open", { initNodeTime: performance.now() });
                BCS.Logger?.success?.(TAG, "WorkOrder System Matrix Deployment Complete");
            } catch (err) {
                BCS.Error?.handle(err);
            }
        },
        destroy() {
            stopAutoRefresh();
            clearTimeout(state.ui.idleTimeout);
            const panel = document.getElementById(PerformancePanel.containerId);
            if (panel) panel.remove();
            console.log(`[${TAG}] Pipeline unmounted clean.`);
        }
    };
})();

// Document Ready Bootstrap Invoker
$(document).ready(() => {
    WorkOrderModule.init();
});
