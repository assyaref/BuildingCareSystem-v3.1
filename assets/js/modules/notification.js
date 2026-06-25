// ======================================================
// Building Care System Enterprise v9.0
// File : assets/js/modules/notification.js
// Notification Center Enterprise
// Radiant Group Duri
// ======================================================

"use strict";

const NotificationModule = (() => {

    // =====================================================
    // SECTION 1 : CONFIGURATION
    // =====================================================
    const TAG = "Notification";

    const CONFIG = Object.freeze({
        DEBUG: true,
        MAX_ITEMS: 50,
        AUTO_SYNC: 30000,
        DEFAULT_TYPE: "INFO",
        DRAWER_WIDTH: 360
    });

    const TYPE = Object.freeze({
        INFO: "INFO",
        SUCCESS: "SUCCESS",
        WARNING: "WARNING",
        ERROR: "ERROR",
        REPORT: "REPORT",
        WORKORDER: "WORKORDER",
        SYSTEM: "SYSTEM"
    });

    const STATUS = Object.freeze({
        READ: "READ",
        UNREAD: "UNREAD"
    });

    // =====================================================
    // SECTION 2 : LOGGER
    // =====================================================
    const Logger = {
        info(...args) {
            BCS.Logger?.info?.(TAG, ...args);
        },
        warn(...args) {
            BCS.Logger?.warn?.(TAG, ...args);
        },
        error(...args) {
            BCS.Logger?.error?.(TAG, ...args);
        },
        performance(name, time) {
            BCS.Logger?.performance?.(TAG, name, time);
        }
    };

    // =====================================================
    // SECTION 3 : INITIAL STATE
    // =====================================================
    function createInitialState() {
        return {
            notifications: [],
            unread: 0,
            selected: null,
            lastSync: null,
            filters: {
                keyword: "",
                type: "ALL"
            },
            ui: {
                loading: false,
                drawer: false,
                initialized: false,
                syncing: false,
                autoRefresh: null,
                eventUnsubscribers: []
            },
            metrics: {
                syncCount: 0,
                renderTime: 0,
                apiTime: 0
            }
        };
    }

    // =====================================================
    // STORE REGISTRY
    // =====================================================
    if (BCS.Store && typeof BCS.Store.register === "function") {
        BCS.Store.register("notification", createInitialState());
    } else {
        if (!BCS.Store) {
            BCS.Store = {};
        }
        BCS.Store.notification = createInitialState();
    }

    const state = BCS.Store.notification;

    // =====================================================
    // DOM CACHE
    // =====================================================
    const DOM = {
        bell: $("#notificationBell"),
        badge: $("#notificationBadge"),
        drawer: $("#notificationDrawer"),
        overlay: $("#notificationOverlay"),
        list: $("#notificationList"),
        empty: $("#notificationEmpty"),
        loading: $("#notificationLoading"),
        btnClear: $("#btnClearNotification"),
        btnReadAll: $("#btnReadAll"),
        btnClose: $("#btnCloseNotification"),
        search: $("#notificationSearch"),
        filter: $("#notificationFilter")
    };

    // =====================================================
    // SECTION 5 : NOTIFICATION SERVICE
    // =====================================================
    const NotificationService = {
        async load(force = false) {
            if (state.ui.loading) return;
            state.ui.loading = true;
            BCS.App?.Loading?.show();

            const started = performance.now();

            try {
                const res = await BCS.Api.notification({ force });
                
                state.metrics.apiTime = performance.now() - started;
                Logger.performance("Notification API", state.metrics.apiTime);

                if (!res?.success) {
                    BCS.App?.Toast?.error(res?.message || "Gagal memuat notifikasi.");
                    return;
                }

                state.notifications = res.data || [];
                state.lastSync = new Date();
                state.metrics.syncCount++;
                
                calculateUnread();
                NotificationPipeline.render();
            } 
            catch (err) {
                BCS.Error?.handle(err);
            } 
            finally {
                state.ui.loading = false;
                BCS.App?.Loading?.hide();
            }
        },

        async markRead(id) {
            try {
                await BCS.Api.markRead({ id });
            } 
            catch (err) {
                BCS.Error?.handle(err);
            }
        },

        async clearAll() {
            try {
                await BCS.Api.clearNotification();
                state.notifications = [];
                state.unread = 0;
                NotificationPipeline.render();
            } 
            catch (err) {
                BCS.Error?.handle(err);
            }
        }
    };

    // =====================================================
    // SECTION 6 : NOTIFICATION ENGINE
    // =====================================================
    const NotificationEngine = {
        push(payload) {
            state.notifications.unshift({
                id: Date.now(),
                status: STATUS.UNREAD,
                created: new Date(),
                ...payload
            });

            if (state.notifications.length > CONFIG.MAX_ITEMS) {
                state.notifications.pop();
            }

            calculateUnread();
            NotificationPipeline.render();
        },

        remove(id) {
            state.notifications = state.notifications.filter(x => x.id !== id);
            calculateUnread();
            NotificationPipeline.render();
        },

        markRead(id) {
            const item = state.notifications.find(x => x.id === id);
            if (item) {
                item.status = STATUS.READ;
            }
            calculateUnread();
            NotificationPipeline.render();
        }
    };

    // =====================================================
    // UNREAD COUNTER
    // =====================================================
    function calculateUnread() {
        state.unread = state.notifications.filter(n => n.status === STATUS.UNREAD).length;
    }

    // =====================================================
    // AUTO SYNC
    // =====================================================
    function startAutoSync() {
        stopAutoSync();
        state.ui.autoRefresh = setInterval(() => {
            NotificationService.load();
        }, CONFIG.AUTO_SYNC);
    }

    // =====================================================
    // AUTO SYNC STOPPER
    // =====================================================
    function stopAutoSync() {
        if (!state.ui.autoRefresh) return;
        clearInterval(state.ui.autoRefresh);
        state.ui.autoRefresh = null;
    }

    // =====================================================
    // EVENT BUS
    // =====================================================
    function registerEvents() {
        const bind = (event, title, type) => {
            const unsub = BCS.Events.on(event, data => {
                NotificationEngine.push({
                    title,
                    message: data?.message || event,
                    type
                });
            });
            state.ui.eventUnsubscribers.push(unsub);
        };

        bind("report:created", "Report Baru", TYPE.REPORT);
        bind("report:updated", "Status Report", TYPE.REPORT);
        bind("workorder:assigned", "Work Order Assigned", TYPE.WORKORDER);
        bind("workorder:completed", "Work Order Selesai", TYPE.WORKORDER);
    }

    // =====================================================
    // PHASE 2 EXPORT
    // =====================================================
    return {
        async init() {
            Logger.info("Notification Module Loaded");
            state.ui.initialized = true;
            
            registerEvents();
            await NotificationService.load();
            startAutoSync();
        }
    };

})();

$(document).ready(() => {
    NotificationModule.init();
});
