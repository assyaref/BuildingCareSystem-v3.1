// ======================================================
// Building Care System Enterprise v10.0
// Service Worker Enterprise
// Radiant Group Duri
// ======================================================

"use strict";

// ==========================================
// CACHE CONFIGURATION
// ==========================================

const VERSION = "10.0.0";

const STATIC_CACHE = `bcs-static-${VERSION}`;

const RUNTIME_CACHE = `bcs-runtime-${VERSION}`;

const OFFLINE_PAGE = "/offline.html";

// ==========================================
// APP SHELL
// ==========================================

const APP_SHELL = [

    "/",

    "/index.html",

    "/assets/css/style.css",

    "/assets/css/dashboard.css",

    "/assets/css/login.css",

    "/assets/js/app.js",

    "/assets/js/config.js",

    "/assets/js/core/api.js",

    "/assets/js/core/offline.js",

    "/assets/js/modules/auth.js",

    "/assets/pwa/manifest.json",

    "/assets/pwa/icons/icon-192.png",

    "/assets/pwa/icons/icon-512.png",

    OFFLINE_PAGE

];
