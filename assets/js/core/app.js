// ======================================================
// Building Care System Enterprise v3.2
// assets/js/core/app.js
// Radiant Group Duri
// ======================================================

"use strict";

const App = (() => {

    // ==================================================
    // PRIVATE
    // ==================================================

    let loadingCounter = 0;

    // ==================================================
    // LOADING
    // ==================================================

    function loading(show = true) {

        const loader = document.getElementById("loading");

        if (!loader) return;

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

    // ==================================================
    // TOAST
    // ==================================================

    function toast(message = "", icon = "success") {

        if (typeof Swal === "undefined") {

            console.log(message);

            return;

        }

        Swal.fire({

            toast: true,

            position: "top-end",

            icon: icon,

            title: message,

            showConfirmButton: false,

            timer: 2500

        });

    }

    // ==================================================
    // LOGGER
    // ==================================================

    function log(...args) {

        console.log(

            "[BCS]",

            ...args

        );

    }

    function error(...args) {

        console.error(

            "[BCS ERROR]",

            ...args

        );

    }

    // ==================================================
    // API GET
    // ==================================================

    async function requestGet(action, data = {}) {

        loading(true);

        try {

            const params = new URLSearchParams({

                action,

                ...data

            });

            const response = await fetch(

                CONFIG.API.URL + "?" + params.toString(),

                {

                    method: "GET",

                    cache: "no-store"

                }

            );

            if (!response.ok) {

                throw new Error(

                    "HTTP " + response.status

                );

            }

            return await response.json();

        }

        catch (err) {

            error(err);

            return {

                success: false,

                message: err.message

            };

        }

        finally {

            loading(false);

        }

    }

    // ==================================================
    // API POST
    // ==================================================

    async function requestPost(action, data = {}) {

        loading(true);

        try {

            const response = await fetch(

                CONFIG.API.URL,

                {

                    method: "POST",

                    headers: {

                        "Content-Type": "application/json"

                    },

                    body: JSON.stringify({

                        action,

                        data

                    })

                }

            );

            if (!response.ok) {

                throw new Error(

                    "HTTP " + response.status

                );

            }

            return await response.json();

        }

        catch (err) {

            error(err);

            return {

                success: false,

                message: err.message

            };

        }

        finally {

            loading(false);

        }

    }

    // ==================================================
    // SESSION
    // ==================================================

    function setSession(user) {

        localStorage.setItem(

            CONFIG.STORAGE.SESSION,

            JSON.stringify(user)

        );

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

            error(err);

            return null;

        }

    }

    function removeSession() {

        localStorage.removeItem(

            CONFIG.STORAGE.SESSION

        );

    }

    // ==================================================
    // REMEMBER
    // ==================================================

    function remember(email) {

        localStorage.setItem(

            CONFIG.STORAGE.REMEMBER,

            email

        );

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

    // ==================================================
    // REDIRECT
    // ==================================================

    function redirect(page) {

        if (

            window.location.pathname.endsWith(page)

        ) {

            return;

        }

        window.location.replace(page);

    }

    // ==================================================
    // SESSION CHECK
    // ==================================================

    function checkSession() {

        const session = getSession();

        if (

            !session ||

            !session.token

        ) {

            redirect("login.html");

            return false;

        }

        return true;

    }

    // ==================================================
    // CLEAR
    // ==================================================

    function clear() {

        removeSession();

        clearRemember();

    }

    // ==================================================
    // PUBLIC
    // ==================================================

    return {

        loading,

        toast,

        log,

        error,

        requestGet,

        requestPost,

        setSession,

        getSession,

        removeSession,

        remember,

        getRemember,

        clearRemember,

        redirect,

        checkSession,

        clear

    };

})();
