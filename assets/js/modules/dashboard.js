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

    let initialized  = false;
    let dashboardData = {};
    let donutChart = null;
    let lineChart = null;
   
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
    setText("userName", session.nama || "-");
    setText("userRole", session.role || "-");
    setText("userNik", session.nik || "-");
    setText(
        "lastLogin",
        session.lastLogin ||
        new Date().toLocaleString("id-ID")
    );
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

setText("totalReport", dashboardData.total || 0);
setText("acTotal", dashboardData.ac || 0);
setText("listrikTotal", dashboardData.listrik || 0);
setText("gedungTotal", dashboardData.gedung || 0);
setText("totalOpen", dashboardData.open || 0);
setText("totalProgress", dashboardData.progress || 0);
setText("totalDone", dashboardData.done || 0);
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

    function getData()             
    { return dashboardData; }
    function getDonutChart() {
    return donutChart;
}
function setDonutChart(instance) {
    donutChart = instance;
}
function getLineChart() {
    return lineChart;
}
function setLineChart(instance) {
    lineChart = instance;
}
    // ==================================================
    // PUBLIC API
    // ==================================================

    return {
    init,
    loadUser,
    loadSummary,
    renderSummary,
    getData,
    getDonutChart,
    setDonutChart,
    getLineChart,
    setLineChart

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

    const cards = document.querySelectorAll(
        ".summary-card,.status-card,.enterprise-card,.user-profile-card"
    );

    cards.forEach((card, index) => {

        card.animate(

            [
                {
                    opacity: 0,
                    transform: "translateY(20px)"
                },
                {
                    opacity: 1,
                    transform: "translateY(0)"
                }

            ],

            {
                duration: 500,
                delay: index * 120,
                fill: "forwards",
                easing: "ease-out"
            }

        );

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
            <div class="text-center text-muted py-4">
                Tidak ada aktivitas terbaru
            </div>
        `;
         return;
    }
   container.innerHTML = list.map(item => {
const status = item.status || "OPEN";
    const icon =
        item.status === "DONE"
            ? "bi-check-circle-fill"
            : item.status === "PROGRESS"
            ? "bi-arrow-repeat"
            : "bi-folder2-open";

    return `

        <div class="activity-item">

            <div class="activity-icon success">

                <i class="bi ${icon}"></i>

            </div>

            <div class="activity-content">

                <strong>${item.kategori || "-"}</strong>

                <small>${item.lokasi || "-"}</small>

            </div>

            <span>${item.waktu || "-"}</span>

        </div>

    `;

}).join("");
    }
    
    // ==================================================
    // CHART
    // ==================================================

    function renderChart() {

        const canvas = document.getElementById("reportChart");

        if (!canvas) return;

      const oldChart = Dashboard.getDonutChart();

        if (oldChart) oldChart.destroy();

        const data = Dashboard.getData();

        const chart = new Chart(canvas, {
            type: "doughnut",
            data: {
                labels: ["AC", "Listrik", "Gedung"],
 datasets: [{
    data: [
        data.ac || 0,
        data.listrik || 0,
        data.gedung || 0
    ],

    backgroundColor:[
    "#2563EB",
    "#F59E0B",
    "#7C3AED"
],

hoverBackgroundColor:[
    "#1D4ED8",
    "#D97706",
    "#6D28D9"
],

    hoverOffset: 8,
    borderWidth: 0
}]
            },
options:{

    responsive:true,

    maintainAspectRatio:false,

    cutout:"72%",

    animation:{

        animateRotate:true,

        duration:1000

    },

    plugins:{

        legend:{

            position:"bottom",

            labels:{

                usePointStyle:true,

                pointStyle:"circle",

                padding:20

            }

        }

    }

}
        });

        Dashboard.setDonutChart(chart);

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
        
  //      renderDonutChart()
  //      renderLineChart()
       

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
DashboardView.renderActivity();
DashboardView.renderChart();
DashboardView.updateLastRefresh();
        updateFooter();
        startClock();
        bindRefreshButton();
        bindLogoutButton();
        bindVisibility();
        bindUnload();
        startAutoRefresh();

    }
// =====================
// Fuunction Start Clock
//======================
let clockInterval = null;
function startClock(){
    if(clockInterval) return;
    updateClock();
    clockInterval = setInterval(updateClock,1000);
}
function updateClock(){
    setFooter(
        "currentTime",
        new Date().toLocaleTimeString("id-ID")
    );
}
// =================
//   Footer KPI
// =================
function updateFooter(){

    const data = Dashboard.getData();

    setFooter(
        "todayDate",
        new Date().toLocaleDateString("id-ID")
    );

    setFooter(
        "currentTime",
        new Date().toLocaleTimeString("id-ID")
    );

    setFooter(
        "onlineUser",
        data.onlineUser || 0
    );

    setFooter(
        "todayReport",
        data.todayReport || 0
    );

    setFooter(
        "pendingApproval",
        data.pendingApproval || 0
    );

}
     
// Helper Lokal
function setFooter(id, value){
    const el = document.getElementById(id);
    if(el){
        el.textContent = value;
    }
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
