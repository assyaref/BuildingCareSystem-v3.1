// ======================================================
// Building Care System Enterprise v3.1
// Global Application Framework
// ======================================================

const App = {

    // ===============================
    // Loading
    // ===============================

    loading(show = true) {

        const loader = document.getElementById("loading");

        if (!loader) return;

        loader.style.display = show ? "flex" : "none";

    },

    // ===============================
    // Toast
    // ===============================

    toast(message, icon = "success") {

        Swal.fire({
            toast: true,
            position: "top-end",
            icon: icon,
            title: message,
            showConfirmButton: false,
            timer: 2500
        });

    },

    // ===============================
    // GET API
    // ===============================

    async requestGet(action, data = {}) {

        try {

            this.loading(true);

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

                throw new Error("HTTP " + response.status);

            }

            return await response.json();

        }

        catch (err) {

            console.error(err);

            return {

                success: false,
                message: err.message

            };

        }

        finally {

            this.loading(false);

        }

    },

    // ===============================
    // POST API
    // ===============================

    async requestPost(action, data = {}) {

        try {

            this.loading(true);

            const response = await fetch(

                CONFIG.API.URL,

                {

                    method: "POST",

                    headers: {

                        "Content-Type": "text/plain;charset=utf-8"

                    },

                    body: JSON.stringify({

                        action,
                        data

                    })

                }

            );

            return await response.json();

        }

        catch (err) {

            console.error(err);

            return {

                success: false,
                message: err.message

            };

        }

        finally {

            this.loading(false);

        }

    },

    // ===============================
    // SESSION
    // ===============================

    setSession(user) {

        localStorage.setItem(

            CONFIG.STORAGE.SESSION,

            JSON.stringify(user)

        );

    },

    getSession() {

        try {

            const session = localStorage.getItem(

                CONFIG.STORAGE.SESSION

            );

            if (!session) {

                return null;

            }

            return JSON.parse(session);

        }

        catch (e) {

            console.error(e);

            return null;

        }

    },

    removeSession() {

        localStorage.removeItem(

            CONFIG.STORAGE.SESSION

        );

    },

    // ===============================
    // REMEMBER EMAIL
    // ===============================

    remember(email) {

        localStorage.setItem(

            CONFIG.STORAGE.REMEMBER,

            email

        );

    },

    getRemember() {

        return localStorage.getItem(

            CONFIG.STORAGE.REMEMBER

        );

    },

    // ===============================
    // REDIRECT
    // ===============================

    redirect(page) {

        window.location.href = page;

    },

    // ===============================
    // CHECK SESSION
    // ===============================

    checkSession() {

        const session = this.getSession();

        if (!session) {

            this.redirect("login.html");

        }

    }

};
