// =====================================================
// Building Care System Enterprise v3.1
// Global Application
// =====================================================

const App = {

    loading(show = true) {

        const loader = document.getElementById("loading");

        if (!loader) return;

        loader.style.display = show ? "flex" : "none";

    },

    toast(message, type = "success") {

        Swal.fire({

            toast: true,

            position: "top-end",

            icon: type,

            title: message,

            showConfirmButton: false,

            timer: 2500

        });

    },

    async request(action, data = {}) {

        try {

            this.loading(true);

            const response = await fetch(CONFIG.API.URL, {

                method: "POST",

                headers: {

                    "Content-Type": "application/json"

                },

                body: JSON.stringify({

                    action,

                    data

                })

            });

            return await response.json();

        }

        finally {

            this.loading(false);

        }

    },

    setSession(user) {

        localStorage.setItem(

            CONFIG.STORAGE.SESSION,

            JSON.stringify(user)

        );

    },

    getSession() {

        return JSON.parse(

            localStorage.getItem(

                CONFIG.STORAGE.SESSION

            )

        );

    },

    removeSession() {

        localStorage.removeItem(

            CONFIG.STORAGE.SESSION

        );

    },

    checkSession() {

        const session = this.getSession();

        if (!session) {

            window.location.href = "login.html";

        }

    }

};
