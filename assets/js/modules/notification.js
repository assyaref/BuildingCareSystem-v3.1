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
        info(...args) { BCS.Logger?.info?.(TAG, ...args); },
        warn(...args) { BCS.Logger?.warn?.(TAG, ...args); },
        error(...args) { BCS.Logger?.error?.(TAG, ...args); },
        performance(name, time) { BCS.Logger?.performance?.(TAG, name, time); }
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

    // Saran 10: Optimasi Store Registration agar lebih elegan
    let state;
    if (BCS.Store && typeof BCS.Store.register === "function") {
        state = BCS.Store.register("notification", createInitialState());
    } else {
        if (!BCS.Store) BCS.Store = {};
        BCS.Store.notification = createInitialState();
        state = BCS.Store.notification;
    }

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
    // SARAN 6: MISSING HELPERS
    // =====================================================
    const Helpers = {
        escape(str) {
            if (!str) return "";
            return str.replace(/[&<>"']/g, m => {
                switch (m) {
                    case '&': return '&amp;';
                    case '<': return '&lt;';
                    case '>': return '&gt;';
                    case '"': return '&quot;';
                    case "'": return '&#039;';
                    default: return m;
                }
            });
        },

        formatDate(dateObj) {
            if (!dateObj) return "";
            const d = new Date(dateObj);
            return d.toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' });
        },

        relativeTime(dateObj) {
            if (!dateObj) return "";
            const now = new Date();
            const past = new Date(dateObj);
            const msPerMinute = 60 * 1000;
            const msPerHour = msPerMinute * 60;
            const msPerDay = msPerHour * 24;
            const elapsed = now - past;

            if (elapsed < msPerMinute) return 'Baru saja';
            if (elapsed < msPerHour) return Math.round(elapsed / msPerMinute) + ' menit yang lalu';
            if (elapsed < msPerDay) return Math.round(elapsed / msPerHour) + ' jam yang lalu';
            return Math.round(elapsed / msPerDay) + ' hari yang lalu';
        }
    };

    // =====================================================
    // SARAN 1: NOTIFICATION PIPELINE (RENDERER)
    // =====================================================
    const NotificationPipeline = {
        render() {
            const start = performance.now();
            Logger.info("Rendering notifications...");

            if (!state.notifications || state.notifications.length === 0) {
                DOM.list.hide();
                DOM.empty.show();
                DOM.badge.hide().text("0");
            } else {
                DOM.empty.hide();
                DOM.list.show();
                
                // Update Badge
                if (state.unread > 0) {
                    DOM.badge.show().text(state.unread > 99 ? "99+" : state.unread);
                } else {
                    DOM.badge.hide();
                }

                // Render List Loop (Placeholder untuk Phase 3 UI)
                let html = "";
                const filtered = state.notifications.filter(n => {
                    const matchType = state.filters.type === "ALL" || n.type === state.filters.type;
                    const matchKey = !state.filters.keyword || n.title.toLowerCase().includes(state.filters.keyword.toLowerCase());
                    return matchType && matchKey;
                });

                filtered.forEach(item => {
                    html += `
                        <div class="notification-item ${item.status === STATUS.UNREAD ? 'unread' : ''}" data-id="${item.id}">
                            <div class="noti-title">${Helpers.escape(item.title)}</div>
                            <div class="noti-time">${Helpers.relativeTime(item.createdAt)}</div>
                        </div>
                    `;
                });
                DOM.list.html(html);
            }

            state.metrics.renderTime = performance.now() - start;
        }
    };

    // =====================================================
    // ENGINE (LOCAL STATE MANIPULATION)
    // =====================================================
    const NotificationEngine = {
        push(item) {
            state.notifications.unshift(item);
            if (state.notifications.length > CONFIG.MAX_ITEMS) {
                state.notifications.pop();
            }
            this.recalculateUnread();
            NotificationPipeline.render();
        },

        remove(id) {
            state.notifications = state.notifications.filter(n => n.id !== id);
            this.recalculateUnread();
            NotificationPipeline.render();
        },

        // Saran 3: Local state management untuk markRead
        markRead(id) {
            const item = state.notifications.find(n => n.id === id);
            if (item && item.status !== STATUS.READ) {
                item.status = STATUS.READ;
                this.recalculateUnread();
                NotificationPipeline.render();
            }
        },

        recalculateUnread() {
            state.unread = state.notifications.filter(n => n.status === STATUS.UNREAD).length;
        }
    };

    // =====================================================
    // SERVICE (API & CORE DATA FETCH)
    // =====================================================
    const NotificationService = {
        async load(forceNoCache = false) {
            state.ui.loading = true;
            DOM.loading.show();
            const start = performance.now();

            try {
                // Mock API / Integrasi API asli BCS
                // const res = await BCS.Api.getNotifications({ force: forceNoCache });
                // state.notifications = res.data;
                // this.recalculateUnread();
                
                state.lastSync = new Date(); // Update sync timestamp
                NotificationPipeline.render();
            } catch (err) {
                Logger.error("Failed to load notifications", err);
            } finally {
                state.ui.loading = false;
                DOM.loading.hide();
                state.metrics.apiTime = performance.now() - start;
            }
        },

        // Saran 3: Sinkronisasi markRead local & server
        async markRead(id) {
            try {
                // Pastikan BCS.Api tersedia sebelum dipanggil
                if (BCS.Api?.markRead) {
                    const res = await BCS.Api.markRead(id);
                    if (res && res.success) {
                        NotificationEngine.markRead(id);
                    }
                } else {
                    // Fallback jika API belum siap
                    NotificationEngine.markRead(id);
                }
            } catch (err) {
                Logger.error(`Failed to mark read for ID: ${id}`, err);
            }
        },

        // Saran 4: Update lastSync saat clearAll
        async clearAll() {
            try {
                // await BCS.Api.clearAll();
                state.notifications = [];
                state.unread = 0;
                state.lastSync = new Date(); // Saran 4
                NotificationPipeline.render();
            } catch (err) {
                Logger.error("Failed to clear notifications", err);
            }
        }
    };

    // =====================================================
    // SARAN 5, 7, & 8: EVENTS & AUTO SYNC MANAGEMENT
    // =====================================================
    
    // Saran 5: Helper untuk mempermudah subscribe event
    function subscribe(event, title, type) {
        if (BCS.Event && typeof BCS.Event.subscribe === "function") {
            const unsub = BCS.Event.subscribe(event, (data) => {
                Logger.info(`Event Triggered: ${event}`);
                NotificationEngine.push({
                    id: data?.id || Date.now(),
                    title: data?.message || title,
                    type: type,
                    status: STATUS.UNREAD,
                    createdAt: new Date()
                });
            });
            state.ui.eventUnsubscribers.push(unsub);
        }
    }

    function registerEvents() {
        // Saran 7: Tambahan bind/subscribe untuk system error & warning
        subscribe("user:login", "User Logged In", TYPE.SYSTEM);
        subscribe("system:error", "System Error Detected", TYPE.ERROR);
        subscribe("system:warning", "System Warning Issued", TYPE.WARNING);
        subscribe("workorder:new", "New Work Order assigned", TYPE.WORKORDER);

        // Saran 8: Handling visibilitychange agar hemat request
        $(document).on("visibilitychange.notification", () => {
            if (document.hidden) {
                stopAutoSync();
            } else {
                Logger.info("Tab active, syncing notifications once...");
                NotificationService.load(false); // Sync sekali saat tab dibuka kembali
                startAutoSync();
            }
        });
    }

    function startAutoSync() {
        if (state.ui.autoRefresh) return;
        state.ui.autoRefresh = setInterval(() => {
            // Saran 8: Proteksi ekstra jika running background tapi interval lolos
            if (!document.hidden) {
                Logger.info("Auto syncing notifications...");
                NotificationService.load(false);
            }
        }, CONFIG.AUTO_SYNC);
    }

    function stopAutoSync() {
        if (state.ui.autoRefresh) {
            clearInterval(state.ui.autoRefresh);
            state.ui.autoRefresh = null;
        }
    }

    // =====================================================
    // SARAN 2: MEMORY CLEANUP (DESTROY)
    // =====================================================
    function destroy() {
        Logger.info("Destroying Notification Module...");
        
        // 1. Stop auto sync
        stopAutoSync();

        // 2. Clear event unsubscribers
        state.ui.eventUnsubscribers.forEach(fn => {
            if (typeof fn === "function") fn();
        });
        state.ui.eventUnsubscribers = [];

        // 3. Unbind DOM events namespace
        $(document).off(".notification");
        
        state.ui.initialized = false;
    }

    // =====================================================
    // INTERACTION / DOM EVENTS
    // =====================================================
    function bindUIEvents() {
        DOM.bell.on("click.notification", () => {
            state.ui.drawer = !state.ui.drawer;
            DOM.drawer.toggle(state.ui.drawer);
        });

        DOM.btnClose.on("click.notification", () => {
            state.ui.drawer = false;
            DOM.drawer.hide();
        });

        DOM.list.on("click.notification", ".notification-item", function() {
            const id = $(this).data("id");
            NotificationService.markRead(id);
        });

        DOM.btnClear.on("click.notification", () => {
            NotificationService.clearAll();
        });
    }

    // =====================================================
    // PHASE 1 EXPORT
    // =====================================================
    return {
        async init() {
            if (state.ui.initialized) return;

            Logger.info("Notification Module Loading...");
            
            bindUIEvents();
            registerEvents();
            
            // Saran 9: Load dengan forceNoCache = true saat inisialisasi pertama
            await NotificationService.load(true);
            
            startAutoSync();
            state.ui.initialized = true;
        },
        destroy: destroy // Saran 2 Export
    };

})();

$(document).ready(() => {
    NotificationModule.init();
});
