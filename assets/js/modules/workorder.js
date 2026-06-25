// ======================================================
// Building Care System Enterprise v8.1
// File : assets/js/modules/workorder.js
// ROLE : ADMIN | GENERAL AFFAIR | TECHNICIAN
// Radiant Group Duri
// Refactored to Internal Architectural Sections Blueprint v2
// ======================================================

"use strict";

const WorkOrderModule = (() => {

    // =====================================================
    // 1. SECTION: SYSTEM CONFIG & CONSTANTS
    // =====================================================
    const TAG = "WorkOrder";
    const IDLE_THRESHOLD = 300000; // 5 Menit Idle Activity Interceptor

    const CONFIG = Object.freeze({
        DEBUG: true, // Set ke false di Production untuk mematikan Performance HUD & Debug Log
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
    // 2. SECTION: CORE STANDARDIZED LOGGER
    // =====================================================
    const Logger = {
        info: (tag, msg) => BCS.Logger?.info?.(tag, msg) || console.log(`[INFO][${tag}] ${msg}`),
        warn: (tag, msg) => BCS.Logger?.warn?.(tag, msg) || console.warn(`[WARN][${tag}] ${msg}`),
        error: (tag, msg) => BCS.Logger?.error?.(tag, msg) || console.error(`[ERROR][${tag}] ${msg}`),
        performance: (tag, metric, time) => {
            if (CONFIG.DEBUG) {
                console.log(`%c[PERF][${tag}] ${metric}: ${time.toFixed(2)} ms`, "color: #10B981; font-weight: bold;");
            }
        }
    };

    // =====================================================
    // 3. SECTION: STORE INITIALIZER & UNIFIED REGISTRY
    // =====================================================
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
            initialized: false,
            eventUnsubscribers: [] // Kolektor fungsi unbind event listener
        },
        metrics: {
            refreshCount: 0,
            apiTime: 0,
            renderTime: 0,
            memoryEstimate: "0 MB"
        }
    });

    // Registrasi Store melalui Unified Service Registry Pattern
    if (BCS.Store && typeof BCS.Store.register === "function") {
        BCS.Store.register("workorder", createInitialState());
    } else {
        if (!BCS.Store) BCS.Store = {};
        BCS.Store.workorder = createInitialState();
        BCS.Store.reset = (key) => { if (BCS.Store[key]) BCS.Store[key] = createInitialState(); };
    }

    const state = BCS.Store.workorder;

    // Core Analytics Core-Abstraction Safe Guard (Bukan lagi internal WorkOrder)
    const Analytics = {
        track: (eventName, payload = {}) => BCS.Analytics?.track?.(eventName, payload) || console.log(`[Analytics Stub] ${eventName}`, payload)
    };

    // =====================================================
    // 4. SECTION: DOM CACHE MAPPING
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
    // 5. SECTION: UI HELPERS & SECURITY GUARD
    // =====================================================
    const escapeHtml = (val) => { const d = document.createElement("div"); d.textContent = val ?? ""; return d.innerHTML; };

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
        isAdmin() { return [ROLE.ADMIN, ROLE.ADMINISTRATOR, ROLE.LEAD_BRANCH_SUPPORT].includes(state.user.role); },
        isGA() { return state.user.role === ROLE.GENERAL_AFFAIR; },
        isTechnician() { return state.user.role === ROLE.TECHNICIAN; },
        canAssign() { return this.isAdmin() || this.isGA(); },
        canUpdateStatus() { return this.isAdmin() || this.isGA() || this.isTechnician(); },
        canDelete() { return this.isAdmin(); }
    };

    // =====================================================
    // 6. SECTION: ENGINE (WORKFLOW, FILTER, PAGINATION CALCULATOR)
    // =====================================================
    const WorkflowEngine = (() => {
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

    const DataProcessingEngine = {
        process() {
            this.applyFilters();
            this.buildSummaryMetrics();
            this.buildPagination();
        },
        applyFilters() {
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
        },
        buildSummaryMetrics() {
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
        },
        buildPagination() {
            state.pagination.totalPages = Math.max(1, Math.ceil(state.filtered.length / state.pagination.perPage));
            if (state.pagination.page > state.pagination.totalPages) {
                state.pagination.page = 1;
            }
        },
        getCurrentPageData() {
            const start = (state.pagination.page - 1) * state.pagination.perPage;
            return state.filtered.slice(start, start + state.pagination.perPage);
        }
    };

    // =====================================================
    // 7. SECTION: SERVICES (REMOTE API ACCESSORS)
    // =====================================================
    const WorkOrderService = {
        async loadTechnicians() {
            try {
                const res = await BCS.Api.user({ role: "TECHNICIAN" });
                if (res?.success) state.technicians = res.data || [];
            } catch (err) {
                BCS.Error?.handle(err);
            }
        },
        async loadWorkOrders(force = false) {
            if (state.ui.isIdle) {
                Logger.warn(TAG, "Request Aborted: Engine berada dalam status IDLE.");
                return;
            }
            if (state.ui.loading) return;
            
            state.ui.loading = true;
            BCS.App?.Loading?.show();
            const tStart = performance.now();

            try {
                const res = await BCS.Api.workorder({ force });
                state.metrics.apiTime = performance.now() - tStart;
                Logger.performance(TAG, "API Latency WorkOrder", state.metrics.apiTime);

                if (!res?.success) {
                    BCS.App?.Toast?.error(res?.message || "Gagal mengambil data Work Order.");
                    return;
                }
                state.workorders = res.data || [];
                state.metrics.refreshCount++;

                Analytics.track("workorder_refresh", { runNumber: state.metrics.refreshCount });
                DataProcessingEngine.process();
                UIPipelineComponent.render();
            } catch (err) {
                BCS.Error?.handle(err);
            } finally {
                state.ui.loading = false;
                BCS.App?.Loading?.hide();
            }
        },
        async assignTechnician(id, technicianId) {
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
                await this.loadWorkOrders(true);
            } catch (err) {
                BCS.Error?.handle(err);
            } finally {
                BCS.App?.Loading?.hide();
            }
        },
        async updateStatus(id, currentStatus, nextStatus) {
            if (!RoleGuard.canUpdateStatus()) {
                BCS.App?.Toast?.warning("Akses ditolak.");
                return;
            }
            if (!WorkflowEngine.canTransition(currentStatus, nextStatus)) {
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
                await this.loadWorkOrders(true);
            } catch (err) {
                BCS.Error?.handle(err);
            } finally {
                BCS.App?.Loading?.hide();
            }
        },
        async loadTimeline(id) {
            try {
                const res = await BCS.Api.timeline({ id });
                return res?.success ? (res.data || []) : [];
            } catch (err) {
                BCS.Error?.handle(err);
                return [];
            }
        }
    };

    // =====================================================
    // 8. SECTION: COMPONENTS (MODALS, BADGES & INTERFACE ELEMENTS)
    // =====================================================
    const BadgesComponent = {
        status(status) {
            const color = { OPEN: "primary", ASSIGNED: "secondary", PROGRESS: "warning", "WAITING APPROVAL": "info", DONE: "success", ARCHIVED: "dark" };
            return `<span class="badge bg-${color[status] || "secondary"}">${status}</span>`;
        },
        priority(priority) {
            const color = { LOW: "secondary", NORMAL: "primary", HIGH: "warning", URGENT: "danger" };
            return `<span class="badge bg-${color[priority] || "secondary"}">${priority}</span>`;
        }
    };

    const ActionButtonsComponent = {
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

    // Penyempurnaan Object Terisolasi Sesuai Rekomendasi 2
    const AssignmentComponent = {
        selectedId: null,
        open(workorderId) {
            this.selectedId = workorderId;
            const select = $("#assignTechnicianSelect");
            if (!select.length) {
                Logger.warn(TAG, "assignTechnicianSelect DOM tidak ditemukan, beralih ke prompt fallback.");
                const fallbackTech = prompt("Masukkan ID Teknisi:");
                if (fallbackTech) WorkOrderService.assignTechnician(workorderId, fallbackTech);
                return;
            }
            this.reset();
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
            WorkOrderService.assignTechnician(this.selectedId, technician);
            this.close();
        },
        close() {
            this.selectedId = null;
            BCS.App?.Modal?.close("#assignModal");
        },
        reset() {
            $("#assignTechnicianSelect").empty().append('<option value="">-- Pilih Teknisi --</option>');
        }
    };

    // =====================================================
    // 9. SECTION: METRICS (PERFORMANCE HUD MONITOR PANEL)
    // =====================================================
    const PerformancePanel = {
        containerId: "bcs-wo-perf-panel",
        render() {
            if (!CONFIG.DEBUG) {
                this.destroy();
                return;
            }

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
        },
        destroy() {
            const panel = document.getElementById(this.containerId);
            if (panel) panel.remove();
        }
    };

    // =====================================================
    // 10. SECTION: UI PIPELINE RENDER ENGINE
    // =====================================================
    const UIPipelineComponent = {
        render() {
            const tStart = performance.now();
            
            this.renderSummary();
            this.renderTable();
            this.renderMobileCards();
            this.renderTimeline();
            this.renderPagination();
            this.renderEmptyState();
            
            state.metrics.renderTime = performance.now() - tStart;
            Logger.performance(TAG, "Interface Repaint Pipeline", state.metrics.renderTime);

            // Kondisional Render Berdasarkan CONFIG.DEBUG (Rekomendasi 3)
            if (CONFIG.DEBUG) {
                PerformancePanel.render();
            }
        },
        renderSummary() {
            DOM.summary.total.text(state.summary.total);
            DOM.summary.open.text(state.summary.open);
            DOM.summary.assigned.text(state.summary.assigned);
            DOM.summary.progress.text(state.summary.progress);
            DOM.summary.waiting.text(state.summary.waiting);
            DOM.summary.done.text(state.summary.done);
        },
        renderTable() {
            DOM.table.empty();
            DataProcessingEngine.getCurrentPageData().forEach(item => {
                DOM.table.append(`
                    <tr>
                        <td>${escapeHtml(item.id)}</td>
                        <td>${escapeHtml(item.lokasi)}</td>
                        <td>${escapeHtml(item.kategori)}</td>
                        <td>${BadgesComponent.priority(item.prioritas)}</td>
                        <td>${escapeHtml(item.technician || "-")}</td>
                        <td>${BadgesComponent.status(item.status)}</td>
                        <td>${ActionButtonsComponent.render(item)}</td>
                    </tr>
                `);
            });
        },
        renderMobileCards() {
            if (!DOM.mobileContainer.length) return;
            DOM.mobileContainer.empty();
            DataProcessingEngine.getCurrentPageData().forEach(item => {
                DOM.mobileContainer.append(`
                    <div class="wo-card shadow-sm border p-3 rounded mb-2 bg-white">
                        <div class="d-flex justify-content-between">
                            ${BadgesComponent.status(item.status)}
                            ${BadgesComponent.priority(item.prioritas)}
                        </div>
                        <h6 class="mt-3">${escapeHtml(item.lokasi)}</h6>
                        <div class="text-muted small">${escapeHtml(item.kategori)}</div>
                        <div class="small mt-2"><i class="bi bi-person"></i> ${escapeHtml(item.technician || "Belum Assigned")}</div>
                        <div class="mt-3 d-flex gap-1">${ActionButtonsComponent.render(item)}</div>
                    </div>
                `);
            });
        },
        renderTimeline() {
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
        },
        renderPagination() {
            DOM.pagination.empty();
            const total = state.pagination.totalPages;
            for (let i = 1; i <= total; i++) {
                DOM.pagination.append(`
                    <button class="btn btn-sm ${i === state.pagination.page ? "btn-primary" : "btn-light"} page-number" data-page="${i}">
                        ${i}
                    </button>
                `);
            }
        },
        renderEmptyState() {
            if (!DOM.empty.length) return;
            if (state.filtered.length === 0) {
                DOM.empty.removeClass("d-none");
                DOM.table.closest("table").hide();
            } else {
                DOM.empty.addClass("d-none");
                DOM.table.closest("table").show();
            }
        }
    };

    // =====================================================
    // 11. SECTION: REACTION HANDLERS (CONTROLLERS)
    // =====================================================
    function handleSearch(e) {
        state.filters.keyword = e.target.value;
        state.pagination.page = 1;
        DataProcessingEngine.process();
        UIPipelineComponent.render();
    }

    function handleFilter() {
        state.filters.status = DOM.filters.status.val();
        state.filters.priority = DOM.filters.priority.val();
        state.filters.technician = DOM.filters.technician.val();
        state.pagination.page = 1;
        DataProcessingEngine.process();
        UIPipelineComponent.render();
    }

    async function handleDetail(e) {
        const id = $(e.currentTarget).data("id");
        state.selected = state.workorders.find(item => item.id === id);
        if (!state.selected) return;

        state.selected.timeline = await WorkOrderService.loadTimeline(id);
        UIPipelineComponent.render();
        BCS.App?.Modal?.open("#workorderModal");
    }

    function handleStatusUpdateEvent(e) {
        const id = $(e.currentTarget).data("id");
        const current = $(e.currentTarget).data("status");
        const nextPossibleStates = WorkflowEngine.next(current);

        if (!nextPossibleStates.length) {
            BCS.App?.Toast?.warning("Work Order telah berada pada ujung siklus status.");
            return;
        }
        WorkOrderService.updateStatus(id, current, nextPossibleStates[0]);
    }

    // =====================================================
    // 12. SECTION: POLLING & ADAPTIVE IDLE INTERCEPTOR
    // =====================================================
    function startAutoRefresh() {
        stopAutoRefresh();
        const intervalTime = document.hidden ? CONFIG.REFRESH_HIDDEN : CONFIG.REFRESH_ACTIVE;
        state.ui.autoRefresh = setInterval(() => WorkOrderService.loadWorkOrders(), intervalTime);
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
            Analytics.track("user_active_workorder");
            WorkOrderService.loadWorkOrders(true);
        }
        clearTimeout(state.ui.idleTimeout);
        state.ui.idleTimeout = setTimeout(() => {
            state.ui.isIdle = true;
            Analytics.track("user_idle_workorder_paused");
            if (CONFIG.DEBUG) PerformancePanel.render();
        }, IDLE_THRESHOLD);
    }

    function debounce(fn, delay) {
        let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
    }

    // =====================================================
    // 13. SECTION: EVENT WIRE & CLEAN SUBSCRIPTION LOGIC
    // =====================================================
    function bindEvents() {
        DOM.filters.search.on("input", debounce(handleSearch, 300));
        DOM.filters.status.on("change", handleFilter);
        DOM.filters.priority.on("change", handleFilter);
        DOM.filters.technician.on("change", handleFilter);

        DOM.buttons.refresh.on("click", () => { resetIdleTimer(); WorkOrderService.loadWorkOrders(true); });
        
        DOM.table.on("click", ".btn-detail", handleDetail);
        DOM.table.on("click", ".btn-assign", (e) => AssignmentComponent.open($(e.currentTarget).data("id")));
        DOM.table.on("click", ".btn-status", handleStatusUpdateEvent);

        DOM.pagination.on("click", ".page-number", (e) => {
            state.pagination.page = $(e.currentTarget).data("page");
            DataProcessingEngine.process();
            UIPipelineComponent.render();
        });

        $("#btnSubmitAssign").on("click", () => AssignmentComponent.submit());

        // Adaptive document visibility event listener
        const onVisibilityChange = () => startAutoRefresh();
        document.addEventListener("visibilitychange", onVisibilityChange);
        state.ui.eventUnsubscribers.push(() => document.removeEventListener("visibilitychange", onVisibilityChange));

        // Anti-idle event listener register
        const onUserActivity = () => resetIdleTimer();
        ["mousemove", "keydown", "click", "touchstart", "scroll"].forEach(ev => {
            document.addEventListener(ev, onUserActivity, { passive: true });
            state.ui.eventUnsubscribers.push(() => document.removeEventListener(ev, onUserActivity));
        });

        // Global Event Bus Safe Multi-listener Avoidance Mechanism (Rekomendasi 8)
        if (typeof BCS !== "undefined" && BCS.Events) {
            const eventsToBind = ["report:created", "report:updated", "workorder:assigned", "workorder:completed"];
            eventsToBind.forEach(evt => {
                const unsubscribe = BCS.Events.on(evt, () => WorkOrderService.loadWorkOrders(true));
                if (typeof unsubscribe === "function") {
                    state.ui.eventUnsubscribers.push(unsubscribe);
                }
            });
        }
    }

    // =====================================================
    // 14. SECTION: MODULAR SYSTEM LIFECYCLE (INIT & DESTROY)
    // =====================================================
    return {
        async init() {
            Logger.info(TAG, "Memuat Section Modul WorkOrder...");
            try {
                state.user = checkAuth();
                if (!state.user) return;

                bindEvents();
                await WorkOrderService.loadTechnicians();
                await WorkOrderService.loadWorkOrders();

                state.ui.initialized = true;
                resetIdleTimer();
                startAutoRefresh();

                Analytics.track("workorder_module_open", { nodeBootstrapTime: performance.now() });
                Logger.info(TAG, "Siklus Pemuatan Modul WorkOrder Selesai.");
            } catch (err) {
                BCS.Error?.handle(err);
            }
        },
        destroy() {
            stopAutoRefresh();
            clearTimeout(state.ui.idleTimeout);
            
            // 1. Eksekusi Pencabutan Seluruh Event Listener Global (Mencegah Listener Ganda - Rekomendasi 8)
            while (state.ui.eventUnsubscribers.length > 0) {
                const unsubscribe = state.ui.eventUnsubscribers.pop();
                if (typeof unsubscribe === "function") {
                    unsubscribe();
                }
            }

            PerformancePanel.destroy();

            // 2. Reset Total State via Unified Store Registry (Rekomendasi 7)
            if (BCS.Store && typeof BCS.Store.reset === "function") {
                BCS.Store.reset("workorder");
            } else {
                state.workorders = [];
                state.filtered = [];
                state.technicians = [];
                state.selected = null;
                state.summary = { total: 0, open: 0, assigned: 0, progress: 0, waiting: 0, done: 0, archived: 0 };
                state.ui.initialized = false;
            }

            console.log(`[${TAG}] Pipeline Module Unmounted & Memory Cleared Clean.`);
        }
    };
})();

// Document Ready Bootstrap Invoker
$(document).ready(() => {
    WorkOrderModule.init();
});
