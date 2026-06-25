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
            // Penyempurnaan 6: Menambahkan pushCount, markReadCount, clearCount ke Metrics
            metrics: {
                syncCount: 0,
                renderTime: 0,
                apiTime: 0,
                pushCount: 0,
                markReadCount: 0,
                clearCount: 0
            }
        };
    }

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
    // HELPERS & UTILITIES
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

        // Penyempurnaan 2: Ditambahkan helper timestamp() untuk keseragaman project
        timestamp() {
            return new Date().toISOString();
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
    // PENYEMPURNAAN 1: UI COMPONENTS (NotificationCard)
    // =====================================================
    const NotificationCard = {
        render(item) {
            return `
                <div class="notification-item ${item.status === STATUS.UNREAD ? 'unread' : ''}" data-id="${item.id}">
                    <div class="noti-badge-type type-${item.type.toLowerCase()}"></div>
                    <div class="noti-content">
                        <div class="noti-title">${Helpers.escape(item.title)}</div>
                        ${item.message ? `<div class="noti-message">${Helpers.escape(item.message)}</div>` : ''}
                        <div class="noti-time">${Helpers.relativeTime(item.createdAt)}</div>
                    </div>
                </div>
            `;
        }
    };

    // =====================================================
    // PENYEMPURNAAN 7: UI COMPONENTS (NotificationDrawer)
    // =====================================================
    const NotificationDrawer = {
        open() {
            state.ui.drawer = true;
            DOM.drawer.addClass("active").show();
            DOM.overlay.fadeIn(200);
            Logger.info("Notification Drawer Opened");
        },
        close() {
            state.ui.drawer = false;
            DOM.drawer.removeClass("active").hide();
            DOM.overlay.fadeOut(200);
            Logger.info("Notification Drawer Closed");
        }
    };

    // =====================================================
    // NOTIFICATION PIPELINE (RENDERER)
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
                
                if (state.unread > 0) {
                    DOM.badge.show().text(state.unread > 99 ? "99+" : state.unread);
                } else {
                    DOM.badge.hide();
                }

                // Penyempurnaan 5: Filter pencarian diperluas ke title, message, type, dan role
                const filtered = state.notifications.filter(n => {
                    const matchType = state.filters.type === "ALL" || n.type === state.filters.type;
                    
                    const searchKey = state.filters.keyword.toLowerCase();
                    const matchKey = !searchKey || 
                        (n.title && n.title.toLowerCase().includes(searchKey)) ||
                        (n.message && n.message.toLowerCase().includes(searchKey)) ||
                        (n.type && n.type.toLowerCase().includes(searchKey)) ||
                        (n.role && n.role.toLowerCase().includes(searchKey));

                    return matchType && matchKey;
                });

                // Penyempurnaan 1: pipeline memanggil NotificationCard.render()
                let html = "";
                filtered.forEach(item => {
                    html += NotificationCard.render(item);
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
            state.metrics.pushCount++; // Penyempurnaan 6
            this.recalculateUnread();
            NotificationPipeline.render();
        },

        remove(id) {
            state.notifications = state.notifications.filter(n => n.id !== id);
            this.recalculateUnread();
            NotificationPipeline.render();
        },

        markRead(id) {
            const item = state.notifications.find(n => n.id === id);
            if (item && item.status !== STATUS.READ) {
                item.status = STATUS.READ;
                state.metrics.markReadCount++; // Penyempurnaan 6
                this.recalculateUnread();
                NotificationPipeline.render();
            }
        },

        recalculateUnread() {
            state.unread = state.notifications.filter(n => n.status === STATUS.UNREAD).length;
        }
    };

    // =====================================================
    // SERVICE (API INTEGRATION)
    // =====================================================
    const NotificationService = {
        async load(forceNoCache = false) {
            state.ui.loading = true;
            DOM.loading.show();
            const start = performance.now();

            try {
                // Penyempurnaan 4: Menggunakan kontrak API final BCS.Api.notification()
                if (BCS.Api && typeof BCS.Api.notification === "function") {
                    const res = await BCS.Api.notification({ force: forceNoCache });
                    if (res && res.success) {
                        state.notifications = res.data || [];
                        NotificationEngine.recalculateUnread();
                    }
                }
                
                state.lastSync = Helpers.timestamp();
                state.metrics.syncCount++;
                NotificationPipeline.render();
            } catch (err) {
                Logger.error("Failed to load notifications via BCS.Api.notification", err);
            } finally {
                state.ui.loading = false;
                DOM.loading.hide();
                state.metrics.apiTime = performance.now() - start;
            }
        },

        async markRead(id) {
            try {
                if (BCS.Api?.markRead) {
                    const res = await BCS.Api.markRead(id);
                    if (res && res.success) {
                        NotificationEngine.markRead(id);
                    }
                } else {
                    NotificationEngine.markRead(id);
                }
            } catch (err) {
                Logger.error(`Failed to mark read for ID: ${id}`, err);
            }
        },

        async clearAll() {
            try {
                if (BCS.Api?.clearAll) {
                    await BCS.Api.clearAll();
                }
                state.notifications = [];
                state.unread = 0;
                state.lastSync = Helpers.timestamp();
                state.metrics.clearCount++; // Penyempurnaan 6
                NotificationPipeline.render();
            } catch (err) {
                Logger.error("Failed to clear notifications", err);
            }
        }
    };

    // =====================================================
    // EVENTS & AUTO SYNC MANAGEMENT
    // =====================================================
    
    // Penyempurnaan 3: Penyeragaman menggunakan global event bus BCS.Events.on()
    function subscribe(event, title, type) {
        if (BCS.Events && typeof BCS.Events.on === "function") {
            BCS.Events.on(event, (data) => {
                Logger.info(`Event Triggered via BCS.Events: ${event}`);
                NotificationEngine.push({
                    id: data?.id || Date.now(),
                    title: data?.title || title,
                    message: data?.message || "",
                    type: data?.type || type,
                    role: data?.role || "ALL",
                    status: STATUS.UNREAD,
                    createdAt: Helpers.timestamp() // Penyempurnaan 2
                });
            });

            // Menyimpan referensi fungsi pembatalan jika architecture core mendukung unsubscriber token/name
            state.ui.eventUnsubscribers.push({ event: event });
        }
    }

    function registerEvents() {
        subscribe("user:login", "User Logged In", TYPE.SYSTEM);
        subscribe("system:error", "System Error Detected", TYPE.ERROR);
        subscribe("system:warning", "System Warning Issued", TYPE.WARNING);
        subscribe("workorder:new", "New Work Order assigned", TYPE.WORKORDER);

        $(document).on("visibilitychange.notification", () => {
            if (document.hidden) {
                stopAutoSync();
            } else {
                Logger.info("Tab active, syncing notifications once...");
                NotificationService.load(false);
                startAutoSync();
            }
        });
    }

    function startAutoSync() {
        if (state.ui.autoRefresh) return;
        state.ui.autoRefresh = setInterval(() => {
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

    function destroy() {
        Logger.info("Destroying Notification Module...");
        stopAutoSync();

        // Penyempurnaan 3: Handler pembersihan event off jika bus core menyediakannya
        if (BCS.Events && typeof BCS.Events.off === "function") {
            state.ui.eventUnsubscribers.forEach(sub => {
                BCS.Events.off(sub.event);
            });
        }
        state.ui.eventUnsubscribers = [];

        $(document).off(".notification");
        state.ui.initialized = false;
    }

    // =====================================================
    // INTERACTION / DOM EVENTS
    // =====================================================
    function bindUIEvents() {
        // Penyempurnaan 7: Menggunakan NotificationDrawer component API
        DOM.bell.on("click.notification", () => {
            if (state.ui.drawer) {
                NotificationDrawer.close();
            } else {
                NotificationDrawer.open();
            }
        });

        DOM.btnClose.on("click.notification", () => {
            NotificationDrawer.close();
        });

        // Event handler pencarian dan filter untuk pipeline data yang diperluas
        DOM.search.on("input.notification", function() {
            state.filters.keyword = $(this).val();
            NotificationPipeline.render();
        });

        DOM.filter.on("change.notification", function() {
            state.filters.type = $(this).val();
            NotificationPipeline.render();
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
            
            await NotificationService.load(true);
            
            startAutoSync();
            state.ui.initialized = true;
        },
        destroy: destroy
    };

})();

$(document).ready(() => {
    NotificationModule.init();
});
