// ======================================================
// Building Care System Enterprise v3.2
// assets/js/modules/auth.js
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

        if (!email) {

            App.toast("Email wajib diisi", "warning");
            return;

        }

        if (!password) {

            App.toast("Password wajib diisi", "warning");
            return;

        }

        const btn = document.getElementById("btnLogin");

        if (btn) {

            btn.disabled = true;
            btn.innerHTML = "Loading...";

        }

        try {

            const result = await App.requestPost(

                "login",

                {

                    email: email,
                    password: password

                }

            );

            console.log("LOGIN RESULT :", result);

            if (!result.success) {

                App.toast(

                    result.message || "Login gagal",

                    "error"

                );

                return;

            }

            // =====================================
            // Simpan Session
            // =====================================

            const session = result.data || result;

            App.setSession(session);

            // =====================================
            // Remember Email
            // =====================================

            const remember = document.getElementById("remember");

            if (remember && remember.checked) {

                App.remember(email);

            }

            App.toast(

                "Login berhasil",

                "success"

            );

            setTimeout(() => {

                window.location.href = "dashboard.html";

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
    // AUTO LOGIN
    // ==========================================

    autoLogin() {

        const session = App.getSession();

        if (

            session &&

            session.token

        ) {

            window.location.href = "dashboard.html";

        }

    },

    // ==========================================
    // VERIFY SESSION
    // ==========================================

    verify() {

        const session = App.getSession();

        if (

            !session ||

            !session.token

        ) {

            window.location.href = "login.html";

            return false;

        }

        return true;

    },

    // ==========================================
    // LOGOUT
    // ==========================================

    async logout() {

        try {

            const session = App.getSession();

            if (

                session &&

                session.token

            ) {

                await App.requestPost(

                    "logout",

                    {

                        token: session.token

                    }

                );

            }

        }

        catch (e) {

            console.log(e);

        }

        App.removeSession();

        window.location.href = "login.html";

    },

    // ==========================================
    // REMEMBER EMAIL
    // ==========================================

    loadRemember() {

        const email = App.getRemember();

        if (!email) {

            return;

        }

        const input = document.getElementById("email");

        const remember = document.getElementById("remember");

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

        const password = document.getElementById("password");

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

        Auth.loadRemember();

        Auth.autoLogin();

        const btn = document.getElementById("btnLogin");

        if (btn) {

            btn.addEventListener(

                "click",

                () => {

                    Auth.login();

                }

            );

        }

    }

);
