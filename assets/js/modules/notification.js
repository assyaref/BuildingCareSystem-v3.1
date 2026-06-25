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

            notifications:[],

            unread:0,

            selected:null,

            lastSync:null,

            filters:{

                keyword:"",

                type:"ALL"

            },

            ui:{

                loading:false,

                drawer:false,

                initialized:false,

                syncing:false,

                autoRefresh:null,

                eventUnsubscribers:[]

            },

            metrics:{

                syncCount:0,

                renderTime:0,

                apiTime:0

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

            "notification",

            createInitialState()

        );

    }else{

        if(!BCS.Store){

            BCS.Store={};

        }

        BCS.Store.notification=

            createInitialState();

    }

    const state=

        BCS.Store.notification;

    // =====================================================
    // DOM CACHE
    // =====================================================

    const DOM={

        bell:$("#notificationBell"),

        badge:$("#notificationBadge"),

        drawer:$("#notificationDrawer"),

        overlay:$("#notificationOverlay"),

        list:$("#notificationList"),

        empty:$("#notificationEmpty"),

        loading:$("#notificationLoading"),

        btnClear:$("#btnClearNotification"),

        btnReadAll:$("#btnReadAll"),

        btnClose:$("#btnCloseNotification"),

        search:$("#notificationSearch"),

        filter:$("#notificationFilter")

    };

    // =====================================================
    // PHASE 1 EXPORT
    // =====================================================

    return{

        init(){

            Logger.info(

                "Notification Module Loaded"

            );

            state.ui.initialized=true;

        }

    };

})();

$(document).ready(()=>{

    NotificationModule.init();

});
