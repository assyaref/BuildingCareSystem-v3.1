// ======================================================
// Building Care System Enterprise v3.2
// File : assets/js/core/app.js
// Part 1 : Header, Core, Logger, Loading, Toast
// Radiant Group Duri
// ======================================================

"use strict";

/**
 * =====================================================
 * GLOBAL APPLICATION CORE
 * =====================================================
 */

const App = (() => {

    // =================================================
    // PRIVATE STATE
    // =================================================

    const VERSION = "3.2.0";

    let loadingCounter = 0;

    let initialized = false;

    // =================================================
    // LOGGER
    // =================================================

    const Logger = {

        enable: true,

        info(...args) {

            if (!this.enable) return;

            console.log(

                "%c[BCS]",

                "color:#0d6efd;font-weight:bold;",

                ...args

            );

        },

        success(...args) {

            if (!this.enable) return;

            console.log(

                "%c[SUCCESS]",

                "color:#198754;font-weight:bold;",

                ...args

            );

        },

        warning(...args) {

            if (!this.enable) return;

            console.warn(

                "%c[WARNING]",

                "color:#ffc107;font-weight:bold;",

                ...args

            );

        },

        error(...args) {

            console.error(

                "%c[ERROR]",

                "color:#dc3545;font-weight:bold;",

                ...args

            );

        }

    };

    // =================================================
    // INIT
    // =================================================

    function init() {

        if (initialized) {

            Logger.warning(

                "App already initialized."

            );

            return;

        }

        initialized = true;

        Logger.success(

            "Building Care System Enterprise",

            VERSION,

            "Initialized"

        );

    }

    // =================================================
    // LOADING
    // =================================================

    function loading(show = true) {

        const loader = document.getElementById(

            "loading"

        );

        if (!loader) {

            return;

        }

        if (show) {

            loadingCounter++;

            loader.style.display = "flex";

            return;

        }

        loadingCounter--;

        if (loadingCounter <= 0) {

            loadingCounter = 0;

            loader.style.display = "none";

        }

    }

    // =================================================
    // SHOW LOADER
    // =================================================

    function showLoading() {

        loading(true);

    }

    // =================================================
    // HIDE LOADER
    // =================================================

    function hideLoading() {

        loading(false);

    }

    // =================================================
    // TOAST
    // =================================================

    function toast(

        message = "",

        icon = "success"

    ) {

        if (

            typeof Swal === "undefined"

        ) {

            Logger.info(message);

            return;

        }

        Swal.fire({

            toast: true,

            position: "top-end",

            icon: icon,

            title: message,

            timer: 2500,

            showConfirmButton: false,

            timerProgressBar: true

        });

    }

    // =================================================
    // ALERT
    // =================================================

    function alert(

        title,

        text,

        icon = "info"

    ) {

        if (

            typeof Swal === "undefined"

        ) {

            window.alert(text);

            return;

        }

        return Swal.fire({

            title,

            text,

            icon

        });

    }

    // =================================================
    // CONFIRM
    // =================================================

    function confirm(

        title,

        text

    ) {

        if (

            typeof Swal === "undefined"

        ) {

            return Promise.resolve(

                window.confirm(text)

            );

        }

        return Swal.fire({

            title,

            text,

            icon: "question",

            showCancelButton: true,

            confirmButtonText: "Ya",

            cancelButtonText: "Batal"

        });

    }

    // =================================================
    // LOG SHORTCUT
    // =================================================

    function log(...args) {

        Logger.info(...args);

    }

    function success(...args) {

        Logger.success(...args);

    }

    function warning(...args) {

        Logger.warning(...args);

    }

    function error(...args) {

        Logger.error(...args);

    }

    // =================================================
    // PUBLIC API (PART 1)
    // =================================================

    return {

        VERSION,

        init,

        loading,

        showLoading,

        hideLoading,

        toast,

        alert,

        confirm,

        log,

        success,

        warning,

        error

    };

})();

/**
 * =====================================================
 * AUTO INIT
 * =====================================================
 */

document.addEventListener(

    "DOMContentLoaded",

    () => {

        App.init();

    }

);
    // =================================================
    // SESSION
    // =================================================

    function setSession(user = {}) {

        try {

            if (!user) {

                return false;

            }

            localStorage.setItem(

                CONFIG.STORAGE.SESSION,

                JSON.stringify(user)

            );

            Logger.success(

                "Session Saved",

                user.email || ""

            );

            return true;

        }

        catch (err) {

            Logger.error(err);

            return false;

        }

    }

    function getSession() {

        try {

            const value = localStorage.getItem(

                CONFIG.STORAGE.SESSION

            );

            if (!value) {

                return null;

            }

            return JSON.parse(value);

        }

        catch (err) {

            Logger.error(err);

            return null;

        }

    }

    function hasSession() {

        const session = getSession();

        return (

            session !== null &&

            session.token

        );

    }

    function removeSession() {

        try {

            localStorage.removeItem(

                CONFIG.STORAGE.SESSION

            );

            Logger.info(

                "Session Removed"

            );

        }

        catch (err) {

            Logger.error(err);

        }

    }

    // =================================================
    // REMEMBER EMAIL
    // =================================================

    function remember(email = "") {

        try {

            localStorage.setItem(

                CONFIG.STORAGE.REMEMBER,

                email

            );

        }

        catch (err) {

            Logger.error(err);

        }

    }

    function getRemember() {

        return localStorage.getItem(

            CONFIG.STORAGE.REMEMBER

        );

    }

    function clearRemember() {

        localStorage.removeItem(

            CONFIG.STORAGE.REMEMBER

        );

    }

    // =================================================
    // STORAGE HELPER
    // =================================================

    function set(key, value) {

        try {

            localStorage.setItem(

                key,

                JSON.stringify(value)

            );

            return true;

        }

        catch (err) {

            Logger.error(err);

            return false;

        }

    }

    function get(key) {

        try {

            const value = localStorage.getItem(key);

            if (!value) {

                return null;

            }

            return JSON.parse(value);

        }

        catch (err) {

            Logger.error(err);

            return null;

        }

    }

    function remove(key) {

        localStorage.removeItem(key);

    }

    function clearStorage() {

        localStorage.clear();

    }

    // =================================================
    // REDIRECT
    // =================================================

    function redirect(page) {

        if (!page) {

            return;

        }

        const current = window.location.pathname
            .split("/")
            .pop();

        if (current === page) {

            return;

        }

        Logger.info(

            "Redirect =>",

            page

        );

        window.location.replace(page);

    }

    // =================================================
    // CHECK LOGIN
    // =================================================

    function checkSession() {

        if (!hasSession()) {

            redirect(

                "login.html"

            );

            return false;

        }

        return true;

    }

    // =================================================
    // LOGOUT
    // =================================================

    function logout() {

        removeSession();

        redirect(

            "login.html"

        );

    }

    // =================================================
    // UPDATE EXPORT
    // =================================================

    return {

        VERSION,

        init,

        loading,

        showLoading,

        hideLoading,

        toast,

        alert,

        confirm,

        log,

        success,

        warning,

        error,

        // Session

        setSession,

        getSession,

        hasSession,

        removeSession,

        checkSession,

        logout,

        // Remember

        remember,

        getRemember,

        clearRemember,

        // Storage

        set,

        get,

        remove,

        clearStorage,

        // Navigation

        redirect

    };

})();
    // =================================================
    // API GET
    // =================================================

    async function requestGet(action, data = {}) {

        try {

            loading(true);

            return await Api.get(

                action,

                data

            );

        }

        catch (err) {

            Logger.error(err);

            return {

                success: false,

                message: err.message || "Request Failed"

            };

        }

        finally {

            loading(false);

        }

    }

    // =================================================
    // API POST
    // =================================================

    async function requestPost(action, data = {}) {

        try {

            loading(true);

            return await Api.post(

                action,

                data

            );

        }

        catch (err) {

            Logger.error(err);

            return {

                success: false,

                message: err.message || "Request Failed"

            };

        }

        finally {

            loading(false);

        }

    }

    // =================================================
    // HTTP ERROR
    // =================================================

    function handleError(error) {

        Logger.error(error);

        toast(

            error.message ||

            "Terjadi kesalahan.",

            "error"

        );

    }

    // =================================================
    // SAFE EXECUTION
    // =================================================

    async function safe(callback) {

        try {

            loading(true);

            return await callback();

        }

        catch (err) {

            handleError(err);

            return null;

        }

        finally {

            loading(false);

        }

    }

    // =================================================
    // DELAY
    // =================================================

    function delay(ms = 300) {

        return new Promise(

            resolve =>

                setTimeout(

                    resolve,

                    ms

                )

        );

    }

    // =================================================
    // UUID
    // =================================================

    function uuid() {

        return Date.now().toString(36) +

            Math.random()

                .toString(36)

                .substring(2);

    }

    // =================================================
    // CLONE
    // =================================================

    function clone(obj) {

        return JSON.parse(

            JSON.stringify(obj)

        );

    }

    // =================================================
    // RESET APPLICATION
    // =================================================

    function reset() {

        removeSession();

        clearRemember();

        clearStorage();

    }

    // =================================================
    // VERSION
    // =================================================

    function version() {

        return VERSION;

    }

    // =================================================
    // BOOTSTRAP
    // =================================================

    function bootstrap() {

        Logger.success(

            "===================================="

        );

        Logger.success(

            "Building Care System Enterprise"

        );

        Logger.success(

            "Version :",

            VERSION

        );

        Logger.success(

            "Bootstrap Success"

        );

        Logger.success(

            "===================================="

        );

    }

    // =================================================
    // FINAL EXPORT
    // =================================================

    return {

        VERSION,

        version,

        init,

        bootstrap,

        // Loading

        loading,

        showLoading,

        hideLoading,

        // UI

        toast,

        alert,

        confirm,

        // Logger

        log,

        success,

        warning,

        error,

        // Session

        setSession,

        getSession,

        hasSession,

        removeSession,

        checkSession,

        logout,

        // Remember

        remember,

        getRemember,

        clearRemember,

        // Storage

        set,

        get,

        remove,

        clearStorage,

        // Navigation

        redirect,

        // API

        requestGet,

        requestPost,

        safe,

        // Utils

        delay,

        uuid,

        clone,

        reset,

        handleError

    };

})();

// ======================================================
// AUTO BOOTSTRAP
// ======================================================

document.addEventListener(

    "DOMContentLoaded",

    () => {

        App.bootstrap();

    }

);
