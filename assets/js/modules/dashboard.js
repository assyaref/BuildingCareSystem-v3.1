// ======================================================
// Building Care System Enterprise v3.1
// dashboard.js
// Radiant Group Duri
// ======================================================

const Dashboard = {

    chart: null,

    // ==========================================
    // INIT
    // ==========================================

    async init() {

        const valid = await Auth.verify();

        if (!valid) {

            return;

        }

        this.loadUser();

        await this.loadSummary();

        this.bindEvent();

    },

    // ==========================================
    // USER
    // ==========================================

    loadUser() {

        const session = App.getSession();

        if (!session) {

            return;

        }

        const userName = document.getElementById(

            "userName"

        );

        if (userName) {

            userName.innerHTML =

                session.nama ||

                session.name ||

                session.email ||

                "Administrator";

        }

    },

    // ==========================================
    // DASHBOARD SUMMARY
    // ==========================================

    async loadSummary() {

        const session = App.getSession();

        const result = await App.requestGet(

            "getDashboard",

            {

                token: session.token

            }

        );

        if (!result.success) {

            console.log(result);

            return;

        }

        const data = result.data || {};

        document.getElementById("totalReport").innerHTML =
            data.total || 0;

        document.getElementById("totalAC").innerHTML =
            data.ac || 0;

        document.getElementById("totalListrik").innerHTML =
            data.listrik || 0;

        document.getElementById("totalGedung").innerHTML =
            data.gedung || 0;

        this.renderActivity(

            data.activity || []

        );

        this.renderChart(

            data

        );

    },

    // ==========================================
    // RECENT ACTIVITY
    // ==========================================

    renderActivity(list) {

        const container = document.getElementById(

            "recentActivity"

        );

        if (!container) {

            return;

        }

        if (!list.length) {

            container.innerHTML =

                "<p>Tidak ada aktivitas.</p>";

            return;

        }

        let html = "";

        list.forEach(item => {

            html += `

            <div class="border-bottom pb-2 mb-2">

                <strong>${item.kategori}</strong>

                <br>

                <small>

                ${item.lokasi}

                </small>

                <br>

                <span class="badge bg-primary">

                ${item.status}

                </span>

            </div>

            `;

        });

        container.innerHTML = html;

    },

    // ==========================================
    // CHART
    // ==========================================

    renderChart(data) {

        const ctx = document.getElementById(

            "reportChart"

        );

        if (!ctx) {

            return;

        }

        if (this.chart) {

            this.chart.destroy();

        }

        this.chart = new Chart(

            ctx,

            {

                type: "doughnut",

                data: {

                    labels: [

                        "AC",

                        "Listrik",

                        "Gedung"

                    ],

                    datasets: [

                        {

                            data: [

                                data.ac || 0,

                                data.listrik || 0,

                                data.gedung || 0

                            ]

                        }

                    ]

                },

                options: {

                    responsive: true,

                    plugins: {

                        legend: {

                            position: "bottom"

                        }

                    }

                }

            }

        );

    },

    // ==========================================
    // EVENT
    // ==========================================

    bindEvent() {

        const logout = document.getElementById(

            "logoutBtn"

        );

        if (logout) {

            logout.addEventListener(

                "click",

                function (e) {

                    e.preventDefault();

                    Auth.logout();

                }

            );

        }

    }

};

// ==========================================
// START
// ==========================================

document.addEventListener(

    "DOMContentLoaded",

    function () {

        Dashboard.init();

    }

);
