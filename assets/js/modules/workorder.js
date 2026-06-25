// ======================================================
// Building Care System Enterprise v8.0
// workorder.js
// ROLE : ADMIN | GENERAL AFFAIR | TECHNICIAN
// Radiant Group Duri
// ======================================================

"use strict";

const WorkOrderModule = (() => {

    // =====================================================
    // CONSTANTS
    // =====================================================

    const TAG = "WorkOrder";

    const CONFIG = Object.freeze({

        PER_PAGE: 10,

        DEFAULT_STATUS: "ALL",

        DEFAULT_PRIORITY: "ALL",

        DEFAULT_TECHNICIAN: "ALL",

        DEFAULT_SORT: "DESC",

        REFRESH_INTERVAL: 30000

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
    // INITIAL STATE
    // =====================================================

    function createInitialState() {

        return {

            user: {},

            workorders: [],

            filtered: [],

            technicians: [],

            selected: null,

            summary: {

                total: 0,

                open: 0,

                assigned: 0,

                progress: 0,

                waiting: 0,

                done: 0,

                archived: 0

            },

            filters: {

                keyword: "",

                status: CONFIG.DEFAULT_STATUS,

                priority: CONFIG.DEFAULT_PRIORITY,

                technician: CONFIG.DEFAULT_TECHNICIAN,

                sort: CONFIG.DEFAULT_SORT

            },

            pagination: {

                page: 1,

                perPage: CONFIG.PER_PAGE,

                totalPages: 1

            },

            ui: {

                loading: false,

                submitting: false,

                autoRefresh: null,

                initialized: false

            }

        };

    }

    let state = createInitialState();

    // =====================================================
    // DOM CACHE
    // =====================================================

    const DOM = {

        // Summary
        total: $("#woTotal"),
        open: $("#woOpen"),
        assigned: $("#woAssigned"),
        progress: $("#woProgress"),
        waiting: $("#woWaiting"),
        done: $("#woDone"),

        // Filters
        search: $("#searchWorkOrder"),
        filterStatus: $("#filterStatus"),
        filterPriority: $("#filterPriority"),
        filterTechnician: $("#filterTechnician"),

        // Table
        table: $("#workorderTableBody"),
        empty: $("#emptyState"),

        // Pagination
        pagination: $("#pagination"),

        // Buttons
        refresh: $("#btnRefresh"),
        assign: $("#btnAssign"),
        update: $("#btnUpdate"),

        // Modal
        detailModal: $("#workorderModal"),
        timeline: $("#timelineContainer"),

        // Loading
        loading: $("#loadingOverlay")

    };

    // =====================================================
    // PHASE 1 END
    // =====================================================

    return {

        init() {

            BCS.Logger?.info(TAG, "Phase 1 Loaded");

        }

    };

})();

$(document).ready(() => {

    WorkOrderModule.init();

});
    // =====================================================
    // LIFECYCLE
    // =====================================================

    async function init() {

        BCS.Logger?.info(TAG, "Initializing WorkOrder Module");

        try {

            state.user = checkAuth();

            if (!state.user) return;

            bindEvents();

            await loadTechnicians();

            await loadWorkOrders();

            state.ui.initialized = true;

            startAutoRefresh();

            BCS.Logger?.success?.(TAG, "WorkOrder Ready");

        }

        catch (err) {

            BCS.Error?.handle(err);

        }

    }

    // =====================================================
    // AUTH CHECK
    // =====================================================

    function checkAuth() {

        const user =
            BCS.Auth?.user?.() ||
            BCS.Store?.get?.("BCS_USER");

        if (!user) {

            BCS.App.Toast.warning("Session Expired");

            BCS.App.Navigate.go("login.html");

            return null;

        }

        return user;

    }

    // =====================================================
    // ROLE GUARD
    // =====================================================

    const RoleGuard = {

        isAdmin() {

            return [

                ROLE.ADMIN,

                ROLE.ADMINISTRATOR,

                ROLE.LEAD_BRANCH_SUPPORT

            ].includes(state.user.role);

        },

        isGA() {

            return state.user.role === ROLE.GENERAL_AFFAIR;

        },

        isTechnician() {

            return state.user.role === ROLE.TECHNICIAN;

        },

        canAssign() {

            return this.isAdmin() || this.isGA();

        },

        canUpdateStatus() {

            return this.isAdmin()

                || this.isGA()

                || this.isTechnician();

        },

        canDelete() {

            return this.isAdmin();

        }

    };

    // =====================================================
    // EVENT BINDING
    // =====================================================

    function bindEvents() {

        DOM.search.on("input", debounce(handleSearch, 300));

        DOM.filterStatus.on("change", handleFilter);

        DOM.filterPriority.on("change", handleFilter);

        DOM.filterTechnician.on("change", handleFilter);

        DOM.refresh.on("click", () => {

            loadWorkOrders(true);

        });

        DOM.table.on(

            "click",

            ".btn-detail",

            handleDetail

        );

        DOM.table.on(

            "click",

            ".btn-assign",

            handleAssign

        );

        DOM.table.on(

            "click",

            ".btn-status",

            handleStatus

        );

        BCS.Events.on(

            "report:created",

            () => loadWorkOrders(true)

        );

        BCS.Events.on(

            "report:updated",

            () => loadWorkOrders(true)

        );

    }

    // =====================================================
    // INITIAL LOAD
    // =====================================================

    async function loadTechnicians() {

        try {

            const res = await BCS.Api.user({

                role: "TECHNICIAN"

            });

            if (!res.success) return;

            state.technicians = res.data || [];

        }

        catch (err) {

            BCS.Error.handle(err);

        }

    }

    async function loadWorkOrders(force = false) {

        if (state.ui.loading) return;

        state.ui.loading = true;

        BCS.App.Loading.show();

        try {

            const res = await BCS.Api.workorder({

                force

            });

            if (!res.success) {

                BCS.App.Toast.error(

                    res.message

                );

                return;

            }

            state.workorders =

                res.data || [];

            processData();

        }

        catch (err) {

            BCS.Error.handle(err);

        }

        finally {

            state.ui.loading = false;

            BCS.App.Loading.hide();

        }

    }

    // =====================================================
    // AUTO REFRESH
    // =====================================================

    function startAutoRefresh() {

        stopAutoRefresh();

        state.ui.autoRefresh = setInterval(() => {

            loadWorkOrders();

        }, CONFIG.REFRESH_INTERVAL);

    }

    function stopAutoRefresh() {

        if (!state.ui.autoRefresh) return;

        clearInterval(state.ui.autoRefresh);

        state.ui.autoRefresh = null;

    }

    // =====================================================
    // HELPERS
    // =====================================================

    function debounce(callback, delay = 300) {

        let timer;

        return (...args) => {

            clearTimeout(timer);

            timer = setTimeout(() => {

                callback(...args);

            }, delay);

        };

    }
    // =====================================================
    // WORKFLOW ENGINE
    // =====================================================

    const Workflow = (() => {

        const FLOW = Object.freeze({

            [STATUS.OPEN]: [
                STATUS.ASSIGNED
            ],

            [STATUS.ASSIGNED]: [
                STATUS.PROGRESS,
                STATUS.OPEN
            ],

            [STATUS.PROGRESS]: [
                STATUS.WAITING_APPROVAL
            ],

            [STATUS.WAITING_APPROVAL]: [
                STATUS.DONE,
                STATUS.PROGRESS
            ],

            [STATUS.DONE]: [
                STATUS.ARCHIVED
            ],

            [STATUS.ARCHIVED]: []

        });

        function canTransition(from, to) {

            return (FLOW[from] || []).includes(to);

        }

        function next(status) {

            return FLOW[status] || [];

        }

        return {

            canTransition,
            next

        };

    })();

    // =====================================================
    // ASSIGNMENT ENGINE
    // =====================================================

    async function assignTechnician(id, technicianId) {

        if (!RoleGuard.canAssign()) {

            BCS.App.Toast.warning(
                "Anda tidak memiliki hak melakukan assignment."
            );

            return;

        }

        try {

            BCS.App.Loading.show();

            const res = await BCS.Api.assign({

                id,
                technician: technicianId

            });

            if (!res.success) {

                BCS.App.Toast.error(res.message);

                return;

            }

            BCS.App.Toast.success(
                "Teknisi berhasil ditugaskan."
            );

            BCS.Events.emit(
                "workorder:assigned",
                res.data
            );

            await loadWorkOrders(true);

        }

        catch (err) {

            BCS.Error.handle(err);

        }

        finally {

            BCS.App.Loading.hide();

        }

    }

    // =====================================================
    // STATUS ENGINE
    // =====================================================

    async function updateStatus(id, currentStatus, nextStatus) {

        if (!RoleGuard.canUpdateStatus()) {

            BCS.App.Toast.warning(
                "Akses ditolak."
            );

            return;

        }

        if (!Workflow.canTransition(currentStatus, nextStatus)) {

            BCS.App.Toast.warning(
                "Perubahan status tidak diperbolehkan."
            );

            return;

        }

        try {

            BCS.App.Loading.show();

            const res = await BCS.Api.updateStatus({

                id,
                status: nextStatus

            });

            if (!res.success) {

                BCS.App.Toast.error(res.message);

                return;

            }

            BCS.App.Toast.success(
                "Status berhasil diperbarui."
            );

            BCS.Events.emit(
                "report:updated",
                res.data
            );

            await loadWorkOrders(true);

        }

        catch (err) {

            BCS.Error.handle(err);

        }

        finally {

            BCS.App.Loading.hide();

        }

    }

    // =====================================================
    // APPROVAL ENGINE
    // =====================================================

    async function approveWorkOrder(id) {

        await updateStatus(

            id,

            STATUS.WAITING_APPROVAL,

            STATUS.DONE

        );

    }

    // =====================================================
    // TIMELINE ENGINE
    // =====================================================

    async function loadTimeline(id) {

        try {

            const res = await BCS.Api.timeline({

                id

            });

            if (!res.success) {

                return [];

            }

            return res.data || [];

        }

        catch (err) {

            BCS.Error.handle(err);

            return [];

        }

    }

    // =====================================================
    // DETAIL HANDLER
    // =====================================================

    async function handleDetail(e) {

        const id = $(e.currentTarget).data("id");

        state.selected = state.workorders.find(

            item => item.id === id

        );

        if (!state.selected) return;

        state.selected.timeline = await loadTimeline(id);

        renderTimeline();

        BCS.App.Modal.open(
            "#workorderModal"
        );

    }

    // =====================================================
    // ASSIGN HANDLER
    // =====================================================

    function handleAssign(e) {

        const id = $(e.currentTarget).data("id");

        const technician = prompt(
            "Masukkan ID Teknisi"
        );

        if (!technician) return;

        assignTechnician(id, technician);

    }

    // =====================================================
    // STATUS HANDLER
    // =====================================================

    function handleStatus(e) {

        const id = $(e.currentTarget).data("id");

        const current = $(e.currentTarget).data("status");

        const next = Workflow.next(current);

        if (!next.length) {

            BCS.App.Toast.warning(
                "Status akhir."
            );

            return;

        }

        updateStatus(

            id,

            current,

            next[0]

        );

    }
    // =====================================================
    // DATA PROCESSING
    // =====================================================

    function processData() {

        applyFilter();

        buildSummary();

        buildPagination();

        render();

    }

    // =====================================================
    // FILTER ENGINE
    // =====================================================

    function applyFilter() {

        const keyword = state.filters.keyword.toLowerCase();

        state.filtered = state.workorders.filter(item => {

            const matchKeyword =
                !keyword ||
                item.id.toLowerCase().includes(keyword) ||
                item.lokasi.toLowerCase().includes(keyword) ||
                item.kategori.toLowerCase().includes(keyword);

            const matchStatus =
                state.filters.status === "ALL" ||
                item.status === state.filters.status;

            const matchPriority =
                state.filters.priority === "ALL" ||
                item.prioritas === state.filters.priority;

            const matchTechnician =
                state.filters.technician === "ALL" ||
                item.technician === state.filters.technician;

            return (
                matchKeyword &&
                matchStatus &&
                matchPriority &&
                matchTechnician
            );

        });

    }

    // =====================================================
    // SUMMARY ENGINE
    // =====================================================

    function buildSummary() {

        state.summary = {

            total: state.filtered.length,

            open: 0,

            assigned: 0,

            progress: 0,

            waiting: 0,

            done: 0,

            archived: 0

        };

        state.filtered.forEach(item => {

            switch (item.status) {

                case STATUS.OPEN:
                    state.summary.open++;
                    break;

                case STATUS.ASSIGNED:
                    state.summary.assigned++;
                    break;

                case STATUS.PROGRESS:
                    state.summary.progress++;
                    break;

                case STATUS.WAITING_APPROVAL:
                    state.summary.waiting++;
                    break;

                case STATUS.DONE:
                    state.summary.done++;
                    break;

                case STATUS.ARCHIVED:
                    state.summary.archived++;
                    break;

            }

        });

    }

    // =====================================================
    // PAGINATION
    // =====================================================

    function buildPagination() {

        state.pagination.totalPages = Math.max(

            1,

            Math.ceil(

                state.filtered.length /

                state.pagination.perPage

            )

        );

        if (

            state.pagination.page >

            state.pagination.totalPages

        ) {

            state.pagination.page = 1;

        }

    }

    function currentData() {

        const start =

            (state.pagination.page - 1)

            *

            state.pagination.perPage;

        return state.filtered.slice(

            start,

            start + state.pagination.perPage

        );

    }

    // =====================================================
    // FILTER HANDLER
    // =====================================================

    function handleSearch(e) {

        state.filters.keyword = e.target.value;

        processData();

    }

    function handleFilter() {

        state.filters.status =

            DOM.filterStatus.val();

        state.filters.priority =

            DOM.filterPriority.val();

        state.filters.technician =

            DOM.filterTechnician.val();

        processData();

    }

    // =====================================================
    // API WRAPPER
    // =====================================================

    const WorkOrderApi = {

        async refresh(force = false) {

            return await loadWorkOrders(force);

        },

        async assign(id, technician) {

            return await assignTechnician(

                id,

                technician

            );

        },

        async update(id, from, to) {

            return await updateStatus(

                id,

                from,

                to

            );

        },

        async timeline(id) {

            return await loadTimeline(id);

        }

    };

    // =====================================================
    // EVENT ENGINE
    // =====================================================

    function registerEvents() {

        BCS.Events.on(

            "report:created",

            () => WorkOrderApi.refresh(true)

        );

        BCS.Events.on(

            "report:updated",

            () => WorkOrderApi.refresh(true)

        );

        BCS.Events.on(

            "workorder:assigned",

            () => WorkOrderApi.refresh(true)

        );

        BCS.Events.on(

            "workorder:completed",

            () => WorkOrderApi.refresh(true)

        );

    }

    // =====================================================
    // STATE RESET
    // =====================================================

    function resetState() {

        state = createInitialState();

    }
