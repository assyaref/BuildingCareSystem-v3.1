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

        VERSION: 1,

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

    // =====================================================
    // SECTION 2 : LOGGER
    // =====================================================

    const Logger = {

        info(...args){

            BCS.Logger?.info?.(TAG,...args);

        },

        warn(...args){

            BCS.Logger?.warn?.(TAG,...args);

        },

        error(...args){

            BCS.Logger?.error?.(TAG,...args);

        },

        performance(name,time){

            BCS.Logger?.performance?.(

                TAG,

                name,

                time

            );

        }

    };

    // =====================================================
    // SECTION 3 : INITIAL STATE
    // =====================================================

    function createInitialState(){

        return{

            queue:[],

            online:navigator.onLine,

            syncing:false,

            lastSync:null,

            retry:0,

            database:null,

            ui:{

                initialized:false,

                autoSync:null,

                eventUnsubscribers:[]

            },

            metrics:{

                queueCount:0,

                syncCount:0,

                failedCount:0,

                successCount:0,

                retryCount:0,

                apiTime:0,

                syncTime:0

            }

        };

    }

    // =====================================================
    // STORE REGISTRY
    // =====================================================

    if(

        BCS.Store

        &&

        typeof BCS.Store.register==="function"

    ){

        BCS.Store.register(

            "offline",

            createInitialState()

        );

    }else{

        if(!BCS.Store){

            BCS.Store={};

        }

        BCS.Store.offline=

            createInitialState();

    }

    const state=

        BCS.Store.offline;

    // =====================================================
    // SECTION 4 : QUEUE MODEL
    // =====================================================

    function createQueueItem(action,payload){

        return{

            id:crypto.randomUUID(),

            action,

            payload,

            status:STATUS.PENDING,

            retry:0,

            createdAt:new Date().toISOString(),

            updatedAt:new Date().toISOString()

        };

    }

    // =====================================================
    // SECTION 5 : HELPERS
    // =====================================================

    const Helpers={

        timestamp(){

            return new Date().toISOString();

        },

        isOnline(){

            return navigator.onLine;

        },

        uuid(){

            if(window.crypto?.randomUUID){

                return crypto.randomUUID();

            }

            return "BCS-"+Date.now()+"-"+Math.random();

        }

    };

    // =====================================================
    // PHASE 1 EXPORT
    // =====================================================

    return{

        init(){

            Logger.info(

                "Offline Engine Loaded"

            );

            state.ui.initialized=true;

        }

    };

})();

document.addEventListener(

    "DOMContentLoaded",

    ()=>Offline.init()

);
    // =====================================================
    // SECTION 6 : INDEXED DB ENGINE
    // =====================================================

    const Database = {

        async open() {

            return new Promise((resolve, reject) => {

                const request = indexedDB.open(
                    CONFIG.DATABASE,
                    CONFIG.VERSION
                );

                request.onupgradeneeded = event => {

                    const db = event.target.result;

                    if (!db.objectStoreNames.contains(CONFIG.STORE)) {

                        const store = db.createObjectStore(
                            CONFIG.STORE,
                            {
                                keyPath: "id"
                            }
                        );

                        store.createIndex(
                            "status",
                            "status",
                            {
                                unique: false
                            }
                        );

                        store.createIndex(
                            "createdAt",
                            "createdAt",
                            {
                                unique: false
                            }
                        );

                    }

                };

                request.onsuccess = event => {

                    state.database = event.target.result;

                    Logger.info("IndexedDB Connected");

                    resolve(state.database);

                };

                request.onerror = event => {

                    Logger.error(
                        "IndexedDB Error",
                        event.target.error
                    );

                    reject(event.target.error);

                };

            });

        }

    };

    // =====================================================
    // SECTION 7 : STORAGE ENGINE
    // =====================================================

    const Storage = {

        async add(item) {

            return new Promise((resolve, reject) => {

                const tx = state.database.transaction(

                    CONFIG.STORE,

                    "readwrite"

                );

                const store = tx.objectStore(CONFIG.STORE);

                const request = store.add(item);

                request.onsuccess = () => resolve(true);

                request.onerror = e => reject(e);

            });

        },

        async update(item) {

            return new Promise((resolve, reject) => {

                const tx = state.database.transaction(

                    CONFIG.STORE,

                    "readwrite"

                );

                const store = tx.objectStore(CONFIG.STORE);

                const request = store.put(item);

                request.onsuccess = () => resolve(true);

                request.onerror = e => reject(e);

            });

        },

        async remove(id) {

            return new Promise((resolve, reject) => {

                const tx = state.database.transaction(

                    CONFIG.STORE,

                    "readwrite"

                );

                const store = tx.objectStore(CONFIG.STORE);

                const request = store.delete(id);

                request.onsuccess = () => resolve(true);

                request.onerror = e => reject(e);

            });

        },

        async clear() {

            return new Promise((resolve, reject) => {

                const tx = state.database.transaction(

                    CONFIG.STORE,

                    "readwrite"

                );

                const store = tx.objectStore(CONFIG.STORE);

                const request = store.clear();

                request.onsuccess = () => resolve(true);

                request.onerror = e => reject(e);

            });

        },

        async getAll() {

            return new Promise((resolve, reject) => {

                const tx = state.database.transaction(

                    CONFIG.STORE,

                    "readonly"

                );

                const store = tx.objectStore(CONFIG.STORE);

                const request = store.getAll();

                request.onsuccess = () => {

                    resolve(request.result || []);

                };

                request.onerror = e => reject(e);

            });

        }

    };

    // =====================================================
    // SECTION 8 : QUEUE ENGINE
    // =====================================================

    const Queue = {

        async add(action, payload) {

            const item = createQueueItem(

                action,

                payload

            );

            await Storage.add(item);

            state.queue.push(item);

            state.metrics.queueCount =

                state.queue.length;

            Logger.info(

                "Queue Added",

                item.id

            );

            return item;

        },

        async load() {

            state.queue =

                await Storage.getAll();

            state.metrics.queueCount =

                state.queue.length;

        },

        async remove(id) {

            await Storage.remove(id);

            state.queue =

                state.queue.filter(

                    x => x.id !== id

                );

            state.metrics.queueCount =

                state.queue.length;

        },

        async update(item) {

            item.updatedAt =

                Helpers.timestamp();

            await Storage.update(item);

        },

        async clear() {

            await Storage.clear();

            state.queue = [];

            state.metrics.queueCount = 0;

        },

        pending() {

            return state.queue.filter(

                q =>

                q.status === STATUS.PENDING ||

                q.status === STATUS.FAILED

            );

        }

    };
    // =====================================================
    // SECTION 9 : SYNC MANAGER
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

                Logger.info(

                    `Sync ${items.length} item...`

                );

                for (const item of items) {

                    await this.process(item);

                }

                state.lastSync = Helpers.timestamp();

                state.metrics.syncTime =

                    performance.now() - started;

                Logger.performance(

                    "Sync",

                    state.metrics.syncTime

                );

                BCS.Events?.emit(

                    "sync:success",

                    {

                        total: items.length

                    }

                );

            }

            catch(err){

                Logger.error(err);

                BCS.Events?.emit(

                    "sync:failed",

                    err

                );

            }

            finally{

                state.syncing=false;

            }

        },

        async process(item){

            try{

                item.status=STATUS.SYNCING;

                await Queue.update(item);

                const started=performance.now();

                const response=

                    await BCS.Api.post(

                        item.action,

                        item.payload

                    );

                state.metrics.apiTime=

                    performance.now()-started;

                if(

                    response

                    &&

                    response.success

                ){

                    item.status=

                        STATUS.SUCCESS;

                    await Queue.remove(item.id);

                    state.metrics.successCount++;

                    BCS.Events?.emit(

                        "queue:processed",

                        item

                    );

                    Logger.info(

                        "Queue Success",

                        item.id

                    );

                }

                else{

                    throw new Error(

                        response?.message ||

                        "Sync gagal"

                    );

                }

            }

            catch(err){

                item.retry++;

                item.status=

                    STATUS.FAILED;

                await Queue.update(item);

                state.metrics.failedCount++;

                Logger.warn(

                    "Queue Failed",

                    item.id

                );

                RetryManager.schedule(item);

            }

        }

    };
    // =====================================================
    // SECTION 13 : PUBLIC API
    // =====================================================

    const OfflineAPI = {

        async enqueue(action, payload) {

            if (Helpers.isOnline()) {

                try {

                    const res = await BCS.Api.post(action, payload);

                    if (res?.success) {

                        return res;

                    }

                } catch (err) {

                    Logger.warn(
                        "API gagal, masuk queue."
                    );

                }

            }

            await Queue.add(action, payload);

            Notification();

            return {

                success: true,

                offline: true,

                message: "Data disimpan ke Offline Queue"

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

        }

    };
