// ======================================================
// Building Care System Enterprise v3.1
// assets/js/auth.js
// Version : 3.1.0-final
// Radiant Group Duri
// ======================================================

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

        if (email === "") {

            App.toast("Email wajib diisi", "warning");

            return;

        }

        if (password === "") {

            App.toast("Password wajib diisi", "warning");

            return;

        }

        const btn = document.getElementById("btnLogin");

        if (btn) {

            btn.disabled = true;

            btn.innerHTML = "Loading...";

        }

        try {

            const result = await App.requestGet(

                "login",

                {

                    email: email,

                    password: password

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

                App.remember(

                    email

                );

            }

            App.toast(

                "Login berhasil",

                "success"

            );

            setTimeout(() => {

                window.location.href =

                    "dashboard.html";

            }, 800);

        }

        catch (err) {

            console.error(err);

            App.toast(

                err.message,

                "error"

            );

        }

        finally {

            if (btn) {

                btn.disabled = false;

                btn.innerHTML = "LOGIN";

            }

        }

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

                    token: session.token

                }

            );

        }

        App.removeSession();

        window.location.href =

            "login.html";

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

            window.location.href =

                "login.html";

            return false;

        }

        const result = await App.requestGet(

            "verifySession",

            {

                token: session.token

            }

        );

        if (

            !result.success

        ) {

            App.removeSession();

            window.location.href =

                "login.html";

            return false;

        }

        return true;

    },

    // ==========================================
    // REMEMBER EMAIL
    // ==========================================

    loadRemember() {

        const email = App.getRemember();

        if (!email) {

            return;

        }

        const input = document.getElementById(

            "email"

        );

        const remember = document.getElementById(

            "remember"

        );

        if (input) {

            input.value = email;

        }

        if (remember) {

            remember.checked = true;

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

    function () {

        Auth.loadRemember();

        const btn = document.getElementById(

            "btnLogin"

        );

        if (btn) {

            btn.addEventListener(

                "click",

                Auth.login

            );

        }

    }

);

