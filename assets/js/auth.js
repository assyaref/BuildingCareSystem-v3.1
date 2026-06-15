// =====================================================
// Building Care System Enterprise v3.1
// Authentication Module
// Radiant Group Duri
// Version : 3.1.0-final
// =====================================================

const Auth = {

    // ==========================================
    // LOGIN
    // ==========================================

    async login() {

        const email = document
            .getElementById("email")
            .value
            .trim()
            .toLowerCase();

        const password = document
            .getElementById("password")
            .value
            .trim();

        if (!email) {

            App.toast(
                "Email wajib diisi",
                "warning"
            );

            return;

        }

        if (!password) {

            App.toast(
                "Password wajib diisi",
                "warning"
            );

            return;

        }

        const result = await App.requestGet(

            "login",

            {

                email,

                password

            }

        );

        if (!result.success) {

            App.toast(

                result.message ||

                "Login gagal",

                "error"

            );

            return;

        }

        App.setSession(

            result.data

        );

        const remember = document.getElementById(

            "remember"

        );

        if (

            remember &&

            remember.checked

        ) {

            App.remember(email);

        }

        App.toast(

            "Login berhasil",

            "success"

        );

        setTimeout(() => {

            App.redirect(

                "dashboard.html"

            );

        }, 1000);

    },

    // ==========================================
    // LOGOUT
    // ==========================================

    async logout() {

        const session = App.getSession();

        if (

            session &&

            session.token

        ) {

            await App.requestGet(

                "logout",

                {

                    token:

                    session.token

                }

            );

        }

        App.removeSession();

        App.redirect(

            "login.html"

        );

    },

    // ==========================================
    // VERIFY SESSION
    // ==========================================

    async verify() {

        const session = App.getSession();

        if (

            !session ||

            !session.token

        ) {

            App.redirect(

                "login.html"

            );

            return false;

        }

        const result = await App.requestGet(

            "verifySession",

            {

                token:

                session.token

            }

        );

        if (

            !result.success

        ) {

            App.removeSession();

            App.redirect(

                "login.html"

            );

            return false;

        }

        return true;

    },

    // ==========================================
    // REMEMBER EMAIL
    // ==========================================

    remember() {

        const email = App.getRemember();

        if (!email) {

            return;

        }

        const input = document.getElementById(

            "email"

        );

        const check = document.getElementById(

            "remember"

        );

        if (input) {

            input.value = email;

        }

        if (check) {

            check.checked = true;

        }

    },

    // ==========================================
    // SHOW PASSWORD
    // ==========================================

    togglePassword() {

        const password = document.getElementById(

            "password"

        );

        if (!password) {

            return;

        }

        password.type =

            password.type === "password"

            ? "text"

            : "password";

    }

};

// ==========================================
// INIT
// ==========================================

document.addEventListener(

    "DOMContentLoaded",

    () => {

        Auth.remember();

    }

);
