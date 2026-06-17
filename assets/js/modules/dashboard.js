// ======================================================
// Building Care System Enterprise v3.2
// File : assets/js/modules/dashboard.js
// Radiant Group Duri
// ======================================================

"use strict";

/**
 * =====================================================
 * DASHBOARD — CORE
 * Handles: init, session guard, user profile, summary data
 * =====================================================
 */

const Dashboard = (() => {

    // ==================================================
    // PRIVATE STATE
    // ==================================================

    let chart        = null;
    let initialized  = false;
    let dashboardData = {};

    // ==================================================
    // INIT
    // ==================================================

    async function init() {

        if (initialized) return;

        initialized = true;

        App.log("Dashboard Module Loaded");

        const valid = await AuthService.guard();

        if (!valid) return;

        loadUser();

        await loadSummary();

    }

    // ==================================================
    // LOAD USER
    // ==================================================

    function loadUser() {

        const session = App.getSession();

        if (!session) return;

        setText("userName",  session.nama  || session.name || "Administrator");
        setText("userEmail", session.email || "-");
        setText("userRole",  session.role  || "-");

    }

    // ==================================================
    // LOAD DASHBOARD SUMMARY
    // ==================================================

    async function loadSummary() {

        try {

            App.showLoading();

            const session = App.getSession();

            const result = await Api.get("getDashboard", {
                token: session.token
            });

            if (!result.success) {
                App.toast(result.message || "Dashboard gagal dimuat.", "error");
                return;
            }

            dashboardData = result.data || {};

            renderSummary();

        } catch (err) {

            App.handleError(err);

        } finally {

            App.hideLoading();

        }

    }

    // ==================================================
    // RENDER SUMMARY
    // ==================================================

    function renderSummary() {

        setText("totalReport",   dashboardData.total    || 0);
        setText("totalAC",       dashboardData.ac       || 0);
        setText("totalListrik",  dashboardData.listrik  || 0);
        setText("totalGedung",   dashboardData.gedung   || 0);
        setText("totalOpen",     dashboardData.open     || 0);
        setText("totalProgress", dashboardData.progress || 0);
        setText("totalDone",     dashboardData.done     || 0);

    }

    // ==================================================
    // HELPER
    // ==================================================

    function setText(id, value) {

        const el = document.getElementById(id);

        if (!el) return;

        el.textContent = value;

    }

    // ==================================================
    // GETTERS & SETTERS
    // ==================================================

    function getData()             { return dashboardData; }
    function getChart()            { return chart;         }
    function setChart(instance)    { chart = instance;     }

    // ==================================================
    // PUBLIC
    // ==================================================

    return {
        init,
        loadUser,
        loadSummary,
        renderSummary,
        getData,
        getChart,
        setChart
    };

})();


/**
 * =====================================================
 * DASHBOARD VIEW
 * Handles: card animation, activity list, chart, last refresh
 * =====================================================
 */

const DashboardView = (() => {

    // ==================================================
    // CARD ANIMATION
    // ==================================================

    function animateCards() {

        const cards = document.querySelectorAll(".dashboard-card");

        cards.forEach((card, index) => {

            card.style.opacity   = "0";
            card.style.transform = "translateY(20px)";

            setTimeout(() => {
                card.style.transition = "all .4s ease";
                card.style.opacity    = "1";
                card.style.transform  = "translateY(0px)";
            }, index * 120);

        });

    }

    // ==================================================
    // RECENT ACTIVITY
    // ==================================================

    function renderActivity() {

        const container = document.getElementById("recentActivity");

        if (!container) return;

        const data = Dashboard.getData();
        const list = data.activity || [];

        if (!list.length) {
            container.innerHTML = `
                <div class="text-center text-muted p-3">
                    Tidak ada aktivitas terbaru.
                </div>`;
            return;
        }

        container.innerHTML = list.map(item => `
            <div class="border-bottom py-2">
                <div class="fw-bold">${item.kategori || "-"}</div>
                <small class="text-muted">${item.lokasi || "-"}</small><br>
                <span class="badge bg-primary">${item.status || "-"}</span>
            </div>`
        ).join("");

    }

    // ==================================================
    // CHART
    // ==================================================

    function renderChart() {

        const canvas = document.getElementById("reportChart");

        if (!canvas) return;

        const oldChart = Dashboard.getChart();

        if (oldChart) oldChart.destroy();

        const data = Dashboard.getData();

        const chart = new Chart(canvas, {
            type: "doughnut",
            data: {
                labels: ["AC", "Listrik", "Gedung"],
                datasets: [{
                    data: [
                        data.ac      || 0,
                        data.listrik || 0,
                        data.gedung  || 0
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: "bottom" }
                }
            }
        });

        Dashboard.setChart(chart);

    }

    // ==================================================
    // LAST REFRESH
    // ==================================================

    function updateLastRefresh() {

        const target = document.getElementById("lastUpdate");

        if (!target) return;

        target.textContent = new Date().toLocaleString("id-ID");

    }

    // ==================================================
    // REFRESH ALL
    // ==================================================

    async function refresh() {

        App.log("Refreshing Dashboard...");

        await Dashboard.loadSummary();

        renderActivity();
        renderChart();
        updateLastRefresh();

    }

    // ==================================================
    // PUBLIC
    // ==================================================

    return {
        animateCards,
        renderActivity,
        renderChart,
        updateLastRefresh,
        refresh
    };

})();


/**
 * =====================================================
 * DASHBOARD MODULE
 * Handles: event binding, auto-refresh, visibility, bootstrap
 * =====================================================
 */

const DashboardModule = (() => {

    // ==================================================
    // PRIVATE STATE
    // ==================================================

    let refreshInterval = null;

    // ==================================================
    // BIND REFRESH BUTTON
    // ==================================================

    function bindRefreshButton() {

        const button = document.getElementById("refreshDashboard");

        if (!button) return;

        button.addEventListener("click", async (event) => {
            event.preventDefault();
            await DashboardView.refresh();
        });

    }

    // ==================================================
    // BIND LOGOUT BUTTON
    // ==================================================

    function bindLogoutButton() {

        const button = document.getElementById("logoutBtn");

        if (!button) return;

        button.addEventListener("click", async (event) => {

            event.preventDefault();

            const confirmed = await App.confirm(
                "Logout",
                "Keluar dari aplikasi?"
            );

            if (!confirmed || !confirmed.isConfirmed) return;

            await AuthService.logout();

        });

    }

    // ==================================================
    // AUTO REFRESH
    // ==================================================

    function startAutoRefresh() {

        stopAutoRefresh();

        refreshInterval = setInterval(async () => {

            App.log("Dashboard Auto Refresh");

            await DashboardView.refresh();

        }, 60000);

    }

    function stopAutoRefresh() {

        if (!refreshInterval) return;

        clearInterval(refreshInterval);

        refreshInterval = null;

    }

    // ==================================================
    // PAGE VISIBILITY
    // Pause auto-refresh when tab is hidden, resume on focus
    // ==================================================

    function bindVisibility() {

        document.addEventListener("visibilitychange", () => {

            if (document.hidden) {
                stopAutoRefresh();
                return;
            }

            startAutoRefresh();

        });

    }

    // ==================================================
    // BEFORE UNLOAD — cleanup
    // ==================================================

    function bindUnload() {

        window.addEventListener("beforeunload", () => {
            stopAutoRefresh();
        });

    }

    // ==================================================
    // SESSION CHECK
    // ==================================================

    async function checkSession() {

        const valid = await AuthService.verifySession();

        if (valid) return true;

        App.removeSession();
        App.redirect("login.html");

        return false;

    }

    // ==================================================
    // INITIALIZE
    // ==================================================

    async function init() {

        App.log("Dashboard Bootstrap");

        const valid = await checkSession();

        if (!valid) return;

        await Dashboard.init();

        DashboardView.animateCards();
        DashboardView.renderActivity();
        DashboardView.renderChart();
        DashboardView.updateLastRefresh();

        bindRefreshButton();
        bindLogoutButton();
        bindVisibility();
        bindUnload();

        startAutoRefresh();

    }

    // ==================================================
    // PUBLIC
    // ==================================================

    return {
        init,
        bindRefreshButton,
        bindLogoutButton,
        startAutoRefresh,
        stopAutoRefresh,
        checkSession
    };

})();

// ======================================================
// APPLICATION START
// ======================================================

document.addEventListener("DOMContentLoaded", async () => {
    await DashboardModule.init();
});
