// =====================================================
// Building Care System Enterprise v3.1
// Authentication Frontend
// Radiant Group Duri
// =====================================================

const Auth = {

    /**
     * Login
     */
    async login() {

        const email = document
            .getElementById("email")
            .value
            .trim();

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

        try {

            const result = await App.request(

                "login",

                {

                    email,

                    password

                }

            );

            if (!result.success) {

                App.toast(

                    result.message,

                    "error"

                );

                return;

            }

            App.setSession(

                result.data

            );

            if (

                document.getElementById("remember")

                    ?.checked

            ) {

                localStorage.setItem(

                    CONFIG.STORAGE.REMEMBER,

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

            }, 1000);

        }

        catch (err) {

            App.toast(

                err.message,

                "error"

            );

        }

    },

    /**
     * Logout
     */
    async logout() {

        const session = App.getSession();

        if (session) {

            await App.request(

                "logout",

                {

                    token: session.token

                }

            );

        }

        App.removeSession();

        window.location.replace(

            "login.html"

        );

    },

    /**
     * Check Login
     */
    check() {

        const session = App.getSession();

        if (!session) {

            window.location.replace(

                "login.html"

            );

        }

    },

    /**
     * Remember Email
     */
    remember() {

        const email = localStorage.getItem(

            CONFIG.STORAGE.REMEMBER

        );

        if (email) {

            document.getElementById(

                "email"

            ).value = email;

            document.getElementById(

                "remember"

            ).checked = true;

        }

    },

    /**
     * Show Password
     */
    togglePassword() {

        const password = document.getElementById(

            "password"

        );

        password.type =

            password.type === "password"

            ? "text"

            : "password";

    }

};

document.addEventListener(

    "DOMContentLoaded",

    () => {

        Auth.remember();

    }

);
