// ======================================================
// Building Care System Enterprise v3.3.1
// File : assets/js/modules/auth.js
// PART 1 : AUTH UI
// Radiant Group Duri
// ======================================================

"use strict";

/**
 * =====================================================
 * AUTH UI
 *
 * Handles :
 * - Remember Me
 * - Login Button State
 * - Password Toggle
 * - Loading State
 * =====================================================
 */

const Auth = (() => {

    // ==================================================
    // PRIVATE STATE
    // ==================================================

    let loginProcess = false;

    // ==================================================
    // INIT
    // ==================================================

    function init() {

        App.log("Authentication UI Loaded");

        loadRemember();

        bindRemember();

        bindPasswordToggle();

    }

    // ==================================================
    // REMEMBER ME
    // ==================================================

    function loadRemember() {

        const remember = document.getElementById("remember");

        const nik = document.getElementById("nik");

        if (!remember || !nik) {

            return;

        }

        const saved = App.getRemember();

        if (!saved) {

            return;

        }

        remember.checked = true;

        nik.value = saved;

    }

    function saveRemember() {

        const remember = document.getElementById("remember");

        const nik = document.getElementById("nik");

        if (!remember || !nik) {

            return;

        }

        if (remember.checked) {

            App.remember(nik.value.trim());

            return;

        }

        App.clearRemember();

    }

    function bindRemember() {

        const remember = document.getElementById("remember");

        if (!remember) {

            return;

        }

        remember.addEventListener("change", saveRemember);

    }

    // ==================================================
    // PASSWORD TOGGLE
    // ==================================================

    function bindPasswordToggle() {

        const password = document.getElementById("password");

        const toggle = document.getElementById("togglePassword");

        if (!password || !toggle) {

            return;

        }

        toggle.addEventListener("click", () => {

            if (password.type === "password") {

                password.type = "text";

                toggle.classList.remove("bi-eye");

                toggle.classList.add("bi-eye-slash");

            } else {

                password.type = "password";

                toggle.classList.remove("bi-eye-slash");

                toggle.classList.add("bi-eye");

            }

        });

    }

    // ==================================================
    // LOGIN PROCESS LOCK
    // ==================================================

    function isLoading() {

        return loginProcess;

    }

    function lock() {

        loginProcess = true;

    }

    function unlock() {

        loginProcess = false;

    }

    // ==================================================
    // BUTTON STATE
    // ==================================================

    function disableButton() {

        const button = document.getElementById("loginButton");

        if (!button) {

            return;

        }

        button.disabled = true;

        button.innerHTML = `
            <span class="spinner-border spinner-border-sm me-2"></span>
            Signing In...
        `;

    }

    function enableButton() {

        const button = document.getElementById("loginButton");

        if (!button) {

            return;

        }

        button.disabled = false;

        button.innerHTML = `
            <i class="fa-solid fa-right-to-bracket me-2"></i>
            LOGIN
        `;

    }

    // ==================================================
    // PAGE HELPER
    // ==================================================

    function currentPage() {

        return window.location.pathname
            .split("/")
            .pop();

    }

    // ==================================================
    // PUBLIC API
    // ==================================================

    return {

        init,

        loadRemember,

        saveRemember,

        bindRemember,

        bindPasswordToggle,

        isLoading,

        lock,

        unlock,

        disableButton,

        enableButton,

        currentPage

    };

})();
