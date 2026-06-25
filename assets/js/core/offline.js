// ======================================================
// Building Care System Enterprise v10.0
// File : assets/js/core/offline.js
// Offline Engine Enterprise
// Radiant Group Duri
// ======================================================

"use strict";

const Offline = (() => {

    // =====================================================
    // SECTION 1 : CONFIGURATION
    // =====================================================
    const TAG = "Offline";

    const CONFIG = Object.freeze({
        DEBUG: true,
        DATABASE: "BCS_OFFLINE_DB",
        VERSION: 2,
        STORE: "QUEUE",
        MAX_RETRY: 5,
        RETRY_DELAY: 5000,
        AUTO_SYNC: 15000,
        MAX_QUEUE: 500
    });

    const STATUS = Object.freeze({
        PENDING: "PENDING",
        SYNCING: "SYNCING",
        SUCCESS: "SUCCESS",
        FAILED: "FAILED"
    });

    const PRIORITY = Object.freeze({
        HIGH: "HIGH",
        NORMAL: "NORMAL",
        LOW: "LOW"
    });

    // =====================================================
    // SECTION 2 : LOGGER
    // =====================================================
    const Logger = {
        info(...args) {
            if (CONFIG.DEBUG) BCS.Logger?.info?.(TAG, ...args);
        },
        warn(...args) {
            BCS.Logger?.warn?.(TAG, ...args);
        },
        error(...args) {
            BCS.Logger?.error?.(TAG, ...args);
        },
        performance(name, time) {
            if (CONFIG.DEBUG) BCS.Logger?.performance?.(TAG, name, time);
        }
    };

    // =====================================================
    // SECTION 3 : STATE
    // =====================================================
    function createInitialState() {
        return {
            queue: [],
            online: navigator.onLine,
            syncing: false,
            lastSync: null,
            database: null,
            ui: {
                initialized: false,
                autoSync: null,
                eventUnsubscribers: []
            },
            metrics: {
                queueCount: 0,
                syncCount: 0,
                failedCount: 0,
                successCount: 0,
                retryCount: 0,
                apiTime: 0,
                syncTime: 0,
                averageSync: 0,
                averageApi: 0
            }
        };
    }

    // =====================================================
    // SECTION 4 : STORE (Registry Connection)
    // =====================================================
    if (BCS.Store && typeof BCS.Store.register === "function") {
        BCS.Store.register("offline", createInitialState());
    } else {
        if (!BCS.Store) BCS.Store = {};
        BCS.Store.offline = createInitialState();
    }

    const state = BCS.Store.offline;

    // =====================================================
    // SECTION 5 : HELPERS
    // =====================================================
    const Helpers = {
        timestamp() {
            return new Date().toISOString();
        },
        isOnline() {
            return navigator.onLine;
        },
        uuid() {
            if (window.crypto?.randomUUID) {
                return crypto.randomUUID();
            }
            return "BCS-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9);
        },
        createQueueItem(action, payload, priority = PRIORITY.NORMAL) {
            return {
                id: this.uuid(),
                action,
                payload,
                priority: priority.toUpperCase() in PRIORITY ? priority.toUpperCase() : PRIORITY.NORMAL,
                status: STATUS.PENDING,
                retry: 0,
                createdAt: this.timestamp(),
                updatedAt: this.timestamp()
            };
        },
        sortPriority(a, b) {
            const weights = { [PRIORITY.HIGH]: 3, [PRIORITY.NORMAL]: 2, [PRIORITY.LOW]: 1 };
            const weightA = weights[a.priority] || 2;
            const weightB = weights[b.priority] || 2;
            
            if (weightA !== weightB) {
                return weightB - weightA;
            }
            return new Date(a.createdAt) - new Date(b.createdAt);
        }
    };

    // =====================================================
    // SECTION 6 : INDEXEDDB (Database Engine)
    // =====================================================
    const Database = {
        async open() {
            return new Promise((resolve, reject) => {
                if (state.database) return resolve(state.database);

                const request = indexedDB.open(CONFIG.DATABASE, CONFIG.VERSION);

                request.onupgradeneeded = event => {
                    const db = event.target.result;
                    if (!db.objectStoreNames.contains(CONFIG.STORE)) {
                        const store = db.createObjectStore(CONFIG.STORE, { keyPath: "id" });
                        store.createIndex("status", "status", { unique: false });
                        store.createIndex("priority", "priority", { unique: false });
                        store.createIndex("createdAt", "createdAt", { unique: false });
                    }
                };

                request.onsuccess = event => {
                    state.database = event.target.result;
                    Logger.info(`IndexedDB Connected (v${CONFIG.VERSION})`);
                    resolve(state.database);
                };

                request.onerror = event => {
                    Logger.error("IndexedDB Error", event.target.error);
                    reject(event.target.error);
                };
            });
        }
    };

    const Storage = {
        async execute(mode, callback) {
            await Database.open();
            return new Promise((resolve, reject) => {
                const tx = state.database.transaction(CONFIG.STORE, mode);
                const store = tx.objectStore(CONFIG.STORE);
                const request = callback(store);

                request.onsuccess = () => resolve(request.result !== undefined ? request.result : true);
                request.onerror = e => reject(e.target.error);
            });
        },
        async add(item) {
            return this.execute("readwrite", store => store.add(item));
        },
        async update(item) {
            return this.execute("readwrite", store => store.put(item));
        },
        async remove(id) {
            return this.execute("readwrite", store => store.delete(id));
        },
        async clear() {
            return this.execute("readwrite", store => store.clear());
        },
        async getAll() {
            return this.execute("readonly", store => store.getAll());
        }
    };

    // =====================================================
    // SECTION 7 : QUEUE
    // =====================================================
    const Queue = {
        async add(action, payload, priority) {
            if (state.queue.length >= CONFIG.MAX_QUEUE) {
                throw new Error("Queue Full: Maximum limit reached.");
            }
            const item = Helpers.createQueueItem(action, payload, priority);
            await Storage.add(item);
            state.queue.push(item);
            state.queue.sort(Helpers.sortPriority);
            state.metrics.queueCount = state.queue.length;
            
            Logger.info(`Queue Added [${item.priority}]`, item.id);
            BCS.Events?.emit("queue:added", item);
            
            return item;
        },
        async load() {
            const items = await Storage.getAll();
            state.queue = items.sort(Helpers.sortPriority);
            state.metrics.queueCount = state.queue.length;
            Logger.info("Queue Loaded & Sorted from Storage:", state.queue.length);
        },
        async remove(id) {
            await Storage.remove(id);
            state.queue = state.queue.filter(x => x.id !== id);
            state.metrics.queueCount = state.queue.length;
            BCS.Events?.emit("queue:removed", id);
        },
        async update(item) {
            item.updatedAt = Helpers.timestamp();
            await Storage.update(item);
            const index = state.queue.findIndex(x => x.id === item.id);
            if (index !== -1) {
                state.queue[index] = item;
                state.queue.sort(Helpers.sortPriority);
            }
        },
        async clear() {
            await Storage.clear();
            const oldQueue = [...state.queue];
            state.queue = [];
            state.metrics.queueCount = 0;
            oldQueue.forEach(item => BCS.Events?.emit("queue:removed", item.id));
        },
        pending() {
            return state.queue.filter(q => q.status === STATUS.PENDING || q.status === STATUS.FAILED);
        }
    };

    // =====================================================
    // SECTION 8 : RETRY (Saran 1: Exponential Backoff)
    // =====================================================
    const RetryManager = {
        schedule(item) {
            if (item.retry >= CONFIG.MAX_RETRY) {
                Logger.error(`Item ${item.id} mencapai batas maksimum retry. Sync dihentikan.`);
                return;
            }
            
            // Formula Exponential Backoff
            const delay = CONFIG.RETRY_DELAY * Math.pow(2, item.retry);
            Logger.warn(`Retry #${item.retry} dalam ${delay} ms`);
            
            setTimeout(async () => {
                if (!Helpers.isOnline() || state.syncing) return;
                
                state.metrics.retryCount++;
                await SyncManager.process(item);
            }, delay);
        }
    };

    // =====================================================
    // SECTION 9 : SYNC (Sync Manager)
    // =====================================================
    const SyncManager = {
        async sync(force = false) {
            if (state.syncing) return;
            if (!Helpers.isOnline() && !force) {
                Logger.warn("Offline. Sync dibatalkan.");
                return;
            }

            const started = performance.now();
            state.syncing = true;

            try {
                const items = Queue.pending();
                if (!items.length) {
                    Logger.info("Queue kosong.");
                    return;
                }

                Logger.info(`Sync ${items.length} item berdasarkan urutan prioritas...`);
                state.metrics.syncCount++;

                for (const item of items) {
                    await this.process(item);
                }

                state.lastSync = Helpers.timestamp();
                
                const currentSyncTime = performance.now() - started;
                state.metrics.syncTime = currentSyncTime;
                state.metrics.averageSync = state.metrics.averageSync === 0 
                    ? currentSyncTime 
                    : (state.metrics.averageSync + currentSyncTime) / 2;

                Logger.performance("Sync Complete Duration", currentSyncTime);
                BCS.Events?.emit("sync:success", { total: items.length });
            } catch (err) {
                Logger.error(err);
                BCS.Events?.emit("sync:failed", err);
            } finally {
                state.syncing = false;
            }
        },

        async process(item) {
            try {
                item.status = STATUS.SYNCING;
                await Queue.update(item);

                const started = performance.now();
                const response = await ApiAdapter.send(item);
                
                const currentApiTime = performance.now() - started;
                state.metrics.apiTime = currentApiTime;
                state.metrics.averageApi = state.metrics.averageApi === 0 
                    ? currentApiTime 
                    : (state.metrics.averageApi + currentApiTime) / 2;

                if (response && response.success) {
                    item.status = STATUS.SUCCESS;
                    await Queue.remove(item.id);
                    state.metrics.successCount++;
                    BCS.Events?.emit("queue:processed", item);
                    Logger.info("Queue Processed Successfully", item.id);
                } else {
                    throw new Error(response?.message || "Sync gagal");
                }
            } catch (err) {
                item.retry++;
                item.status = STATUS.FAILED;
                await Queue.update(item);
                state.metrics.failedCount++;
                Logger.warn(`Queue Processing Failed (${item.retry}):`, item.id);
                RetryManager.schedule(item);
            }
        }
    };

    // =====================================================
    // SECTION 10 : NETWORK (Saran 2: Tab Visibility Change)
    // =====================================================
    const Network = {
        init() {
            window.addEventListener("online", this.handleOnline);
            window.addEventListener("offline", this.handleOffline);
            document.addEventListener("visibilitychange", this.handleVisibility);
        },
        destroy() {
            window.removeEventListener("online", this.handleOnline);
            window.removeEventListener("offline", this.handleOffline);
            document.removeEventListener("visibilitychange", this.handleVisibility);
        },
        handleOnline() {
            state.online = true;
            Logger.info("Aplikasi kembali Online. Memicu Auto-Sync...");
            BCS.Events?.emit("network:online");
            SyncManager.sync();
        },
        handleOffline() {
            state.online = false;
            Logger.warn("Aplikasi beralih ke Offline mode.");
            BCS.Events?.emit("network:offline");
        },
        handleVisibility() {
            if (document.hidden) return;
            Logger.info("Tab aktif kembali.");
            SyncManager.sync();
        }
    };

    // =====================================================
    // SECTION 11 : METRICS
    // =====================================================
    const Metrics = {
        get() {
            return { ...state.metrics };
        },
        reset() {
            Object.keys(state.metrics).forEach(key => state.metrics[key] = 0);
            state.metrics.queueCount = state.queue.length;
        }
    };

    // =====================================================
    // SECTION 12 : API & ADAPTER
    // =====================================================
    const ApiAdapter = {
        async send(item) {
            return await BCS.Api.post(item.action, item.payload);
        }
    };

    const OfflineAPI = {
        async enqueue(action, payload, priority = PRIORITY.NORMAL) {
            if (Helpers.isOnline()) {
                try {
                    const mockItem = { action, payload };
                    const res = await ApiAdapter.send(mockItem);
                    if (res?.success) return res;
                } catch (err) {
                    Logger.warn("API langsung gagal, dialihkan masuk antrean lokal.");
                }
            }

            const item = await Queue.add(action, payload, priority);
            Events.triggerNotification(item);

            return {
                success: true,
                offline: true,
                message: `Data disimpan ke Offline Queue [Prioritas: ${item.priority}]`,
                id: item.id
            };
        },
        async flush() {
            await SyncManager.sync(true);
        },
        status() {
            return {
                online: state.online,
                syncing: state.syncing,
                queue: state.queue.length,
                lastSync: state.lastSync
            };
        },
        pending() {
            return Queue.pending();
        },
        // Saran 3: Penambahan Queue Inspector Sesuai Parameter Spesifik Anda
        inspect() {
            return {
                total: state.queue.length,
                pending: state.queue.filter(q => q.status === STATUS.PENDING).length,
                syncing: state.queue.filter(q => q.status === STATUS.SYNCING).length,
                failed: state.queue.filter(q => q.status === STATUS.FAILED).length,
                success: state.metrics.successCount,
                online: state.online,
                syncingNow: state.syncing
            };
        }
    };

    // =====================================================
    // SECTION 13 : EVENTS (Subscribers & Emitters)
    // =====================================================
    const Events = {
        init() {
            if (BCS.Events) {
                const unsub = BCS.Events.on("app:ready", () => SyncManager.sync());
                state.ui.eventUnsubscribers.push(unsub);
            }
        },
        triggerNotification(item) {
            if (typeof BCS.Notification?.show === "function") {
                BCS.Notification.show(
                    `Mode Offline (${item.priority})`, 
                    "Koneksi terputus. Data disimpan di antrean lokal."
                );
            }
        },
        destroy() {
            state.ui.eventUnsubscribers.forEach(unsub => typeof unsub === "function" && unsub());
            state.ui.eventUnsubscribers = [];
        }
    };

    // =====================================================
    // SECTION 14 : DESTROY (Saran 4: State Volatile Deep Reset)
    // =====================================================
    const DestroyManager = {
        execute() {
            if (state.ui.autoSync) {
                clearInterval(state.ui.autoSync);
                state.ui.autoSync = null;
            }

            Network.destroy();
            Events.destroy();

            if (state.database) {
                state.database.close();
                state.database = null;
            }

            // Deep Reset State
            state.queue = [];
            state.syncing = false;
            state.lastSync = null;
            state.online = navigator.onLine;
            Metrics.reset();
            
            state.ui.initialized = false;
            Logger.warn("Offline Engine Destroyed & Volatile State Reset");
        }
    };

    // =====================================================
    // SECTION 15 : EXPORT (Saran 5: Developer DevTools Expose)
    // =====================================================
    return {
        async init() {
            if (state.ui.initialized) return;

            Logger.info("Initializing Offline Engine...");
            
            try {
                await Queue.load();
                Network.init();
                Events.init();

                if (CONFIG.AUTO_SYNC > 0) {
                    state.ui.autoSync = setInterval(() => {
                        SyncManager.sync();
                    }, CONFIG.AUTO_SYNC);
                }

                state.ui.initialized = true;
                Logger.info("Offline Engine Fully Ready with Priority Core");

                if (Helpers.isOnline()) SyncManager.sync();

            } catch (error) {
                Logger.error("Gagal menginisialisasi Offline Engine:", error);
            }
        },
        enqueue: OfflineAPI.enqueue,
        flush: OfflineAPI.flush,
        status: OfflineAPI.status,
        pending: OfflineAPI.pending,
        getMetrics: Metrics.get,
        resetMetrics: Metrics.reset,
        destroy: DestroyManager.execute,
        
        // Expose untuk kemudahan debugging via DevTools Console
        inspect: OfflineAPI.inspect,
        queue: Queue,
        sync: SyncManager.sync,
        database: Database
    };

})();

// Initialization Trigger
document.addEventListener(
    "DOMContentLoaded",
    () => Offline.init()
);
