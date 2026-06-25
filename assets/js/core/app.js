// ======================================================
// Building Care System Enterprise v6.5 (Architect Level)
// Core Application Framework & Unified Component Pipeline
// Radiant Group Duri
// ======================================================

"use strict";

// Inisialisasi Root Namespace aman dari Overwrite (Sprint 3 Extension Guard)
window.BCS = window.BCS || {};

/**
 * ======================================================
 * CONFIG & GLOBAL CONSTANTS
 * ======================================================
 */
const DEBUG = window.CONFIG?.DEBUG !== false;

/**
 * ======================================================
 * 7. CORE LOGGER SYSTEM (BCS.Logger)
 * ======================================================
 * Menyediakan standardisasi pencatatan log terpusat berdasarkan tag domain.
 */
BCS.Logger = (() => {
    function log(tag, ...args) {
        if (DEBUG) console.log(`%c[BCS:${tag.toUpperCase()}]`, "color:#0d6efd; font-weight:bold;", ...args);
    }
    function success(tag, ...args) {
        if (DEBUG) console.log(`%c[SUCCESS:${tag.toUpperCase()}]`, "color:#198754; font-weight:bold;", ...args);
    }
    function warn(tag, ...args) {
        if (DEBUG) console.warn(`%c[WARN:${tag.toUpperCase()}]`, "color:#ffc107; font-weight:bold;", ...args);
    }
    function error(tag, ...args) {
        console.error(`%c[ERROR:${tag.toUpperCase()}]`, "color:#dc3545; font-weight:bold;", ...args);
    }

    return Object.freeze({ info: log, success, warn, error });
})();

/**
 * ======================================================
 * EVENT BUS ENGINE (BCS.Events)
 * ======================================================
 * Jantung dari Loose Coupling. Seluruh modul berkomunikasi lewat emit/subscribe di sini.
 */
BCS.Events = (() => {
    const listeners = {};

    function on(event, callback) {
        if (!listeners[event]) listeners[event] = [];
        listeners[event].push(callback);
    }

    function off(event, callback) {
        if (!listeners[event]) return;
        listeners[event] = listeners[event].filter(cb => cb !== callback);
    }

    function once(event, callback) {
        const handler = (data) => {
            off(event, handler);
            callback(data);
        };
        on(event, handler);
    }

    function emit(event, data) {
        if (!listeners[event]) return;
        listeners[event].forEach(callback => {
            try { callback(data); } catch (e) { BCS.Logger.error("Events", `Handler error pada event ${event}:`, e); }
        });
    }

    return Object.freeze({ on, off, once, emit });
})();

/**
 * ======================================================
 * 2 & 9. ENTERPRISE STORAGE LAYER (BCS.Storage)
 * ======================================================
 * Gerbang tunggal untuk enkapsulasi localStorage/sessionStorage.
 */
BCS.Storage = (() => {
    const SESSION_KEY = window.CONFIG?.STORAGE?.SESSION || "BCS_SESSION";
    const REMEMBER_KEY = window.CONFIG?.STORAGE?.REMEMBER || "BCS_REMEMBER";

    function set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (err) {
            BCS.Logger.error("Storage", "Gagal menyimpan data ke localStorage:", err);
            return false;
        }
    }

    function get(key) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : null;
        } catch (err) {
            BCS.Logger.error("Storage", "Gagal membaca data dari localStorage:", err);
            return null;
        }
    }

    function remove(key) { localStorage.removeItem(key); }
    function clear() { localStorage.clear(); }

    // Enkapsulasi khusus untuk Session & Remember Me yang dicabut dari App
    return Object.freeze({
        set, get, remove, clear,
        setSession: (sessionData) => set(SESSION_KEY, sessionData),
        getSession: () => get(SESSION_KEY),
        hasSession: () => get(SESSION_KEY) !== null,
        removeSession: () => remove(SESSION_KEY),
        rememberEmail: (email) => set(REMEMBER_KEY, email),
        getRememberedEmail: () => get(REMEMBER_KEY),
        clearRemember: () => remove(REMEMBER_KEY)
    });
})();

/**
 * ======================================================
 * 8. INDUSTRIAL UTILITIES (BCS.Utils)
 * ======================================================
 */
BCS.Utils = (() => {
    return Object.freeze({
        delay: (ms = 300) => new Promise(resolve => setTimeout(resolve, ms)),
        uuid: () => Date.now().toString(36) + Math.random().toString(36).substring(2),
        clone: (obj) => {
            if (typeof structuredClone === "function") return structuredClone(obj);
            return JSON.parse(JSON.stringify(obj));
        }
    });
})();

/**
 * ======================================================
 * 1 & 6. MODERN RUNTIME APPLICATION UI (BCS.App)
 * ======================================================
 * Struktur Modular berbasis Loose Coupling (Event-Driven).
 * Komponen UI tidak lagi dipanggil manual oleh core script API, melainkan bereaksi atas Event pemicu.
 */
BCS.App = (() => {
    // 6. SINGLE RUNTIME LOADING QUEUE ENGINE
    let loadingCounter = 0;

    const Loading = (() => {
        function show() {
            loadingCounter++;
            const loader = document.getElementById("loading");
            if (loader) loader.style.display = "flex";
            BCS.Logger.info("App", `Loading Screen Aktif (Queue: ${loadingCounter})`);
        }

        function hide() {
            loadingCounter = Math.max(0, loadingCounter - 1);
            if (loadingCounter === 0) {
                const loader = document.getElementById("loading");
                if (loader) loader.style.display = "none";
                BCS.Logger.info("App", "Loading Screen Dinonaktifkan.");
            }
        }

        return Object.freeze({ show, hide });
    })();

    const Toast = (() => {
        function fire(message, icon = "success") {
            if (typeof Swal === "undefined") {
                BCS.Logger.info("Toast", `[${icon.toUpperCase()}] ${message}`);
                return;
            }
            Swal.fire({
                toast: true, position: "top-end", icon, title: message,
                timer: 2500, showConfirmButton: false, timerProgressBar: true
            });
        }
        return Object.freeze({
            success: (msg) => fire(msg, "success"),
            warning: (msg) => fire(msg, "warning"),
            danger: (msg) => fire(msg, "error"),
            info: (msg) => fire(msg, "info")
        });
    })();

    const Dialog = (() => {
        return Object.freeze({
            alert: (title, text, icon = "info") => {
                if (typeof Swal === "undefined") { window.alert(text); return Promise.resolve(); }
                return Swal.fire({ title, text, icon });
            },
            confirm: (title, text) => {
                if (typeof Swal === "undefined") { return Promise.resolve(window.confirm(text)); }
                return Swal.fire({
                    title, text, icon: "question", showCancelButton: true,
                    confirmButtonText: "Ya", cancelButtonText: "Batal"
                }).then(result => !!result.isConfirmed);
            }
        });
    })();

    const Navigate = (() => {
        return Object.freeze({
            go: (page) => {
                if (!page) return;
                const current = window.location.pathname.split("/").pop();
                if (current === page) return;
                BCS.Logger.info("App", `Navigasi dialihkan ke => ${page}`);
                window.location.replace(page);
            }
        });
    })();

    // SPRINT 3 PROJECTION: Struktur sub-modul tambahan yang siap dikembangkan mandiri
    const Modal      = Object.freeze({ open: () => {}, close: () => {} });
    const Notify     = Object.freeze({ push: () => {} });
    const Clipboard  = Object.freeze({ copy: () => {} });
    const Download   = Object.freeze({ file: () => {} });
    const Theme      = Object.freeze({ toggle: () => {} });
    const Skeleton   = Object.freeze({ render: () => {} });
    const Fullscreen = Object.freeze({ toggle: () => {} });
    const Progress   = Object.freeze({ set: () => {} });

    // ==========================================
    // INITIALIZE LOOSE COUPLING EVENT LIFECYCLE
    // ==========================================
    function initEventSubscribers() {
        // Otomatisasi Antrean Loading terpusat tanpa memanggil fungsi App dari dalam Api script
        BCS.Events.on("loading:start", Loading.show);
        BCS.Events.on("loading:end", Loading.hide);

        // Langganan Event Notifikasi Global
        BCS.Events.on("notify:toast", (evt) => Toast[evt.type || "info"](evt.message));
        BCS.Events.on("notify:alert", (evt) => Dialog.alert(evt.title, evt.text, evt.icon));
    }

    return Object.freeze({
        initEventSubscribers,
        Loading, Toast, Dialog, Modal, Navigate, Notify, Clipboard, Download, Theme, Skeleton, Fullscreen, Progress
    });
})();

/**
 * ======================================================
 * 10. ECOSYSTEM CENTRAL BOOTSTRAP (BCS.bootstrap)
 * ======================================================
 * Pengendali utama inisialisasi seluruh sub-sistem framework.
 */
BCS.bootstrap = (() => {
    let initialized = false;

    return async function bootstrap() {
        if (initialized) {
            BCS.Logger.warn("System", "Framework BCS telah berjalan sebelumnya.");
            return;
        }
        initialized = true;

        BCS.Logger.success("System", "====================================");
        BCS.Logger.success("System", "Building Care System Enterprise v6.5");
        BCS.Logger.success("System", "Memulai Inisialisasi Seluruh Subsistem...");
        BCS.Logger.success("System", "====================================");

        // 1. Inisialisasi Event Bus untuk UI App Engine
        BCS.App.initEventSubscribers();
        BCS.Logger.success("System", "Subsistem App UI Event Listener: READY");

        // 2. Hubungkan Validasi awal Session Storage
        if (BCS.Storage.hasSession()) {
            BCS.Logger.info("System", "Sesi aktif terdeteksi untuk pengguna.");
        }

        // 3. Trigger global hook setelah ekosistem siap (Bisa dikonsumsi Plugin)
        BCS.Events.emit("system:ready");
        BCS.Logger.success("System", "Ecosystem Bootstrap Done. Aplikasi siap digunakan.");
    };
})();

/**
 * ======================================================
 * AUTO STARTER INITIALIZER
 * ======================================================
 */
document.addEventListener("DOMContentLoaded", () => {
    BCS.bootstrap();
});
