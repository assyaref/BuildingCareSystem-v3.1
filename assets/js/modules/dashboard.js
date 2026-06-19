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

let initialized = false;
let initializing = false;

let dashboardData = {

    activity: [],
    monthly: [],

    total: 0,
    ac: 0,
    listrik: 0,
    gedung: 0,

    open: 0,
    progress: 0,
    done: 0,

    totalTrend: 0,
    acTrend: 0,
    listrikTrend: 0,
    gedungTrend: 0,

    onlineUser: 0,
    todayReport: 0,
    pendingApproval: 0,

    lastUpdate: null

};

let donutChart = null;
let lineChart = null;



// ==================================================
// INIT
// ==================================================

async function init() {

    // Mencegah multiple initialization
    if (initialized || initializing) {
        return false;
    }

    initializing = true;

    App.log("Dashboard Module Loaded");

    try {

        const valid = await AuthService.guard();

        if (!valid) {
            return false;
        }

        loadUser();

        const loaded = await loadSummary();

        if (!loaded) {
            throw new Error("Dashboard data gagal dimuat.");
        }

        initialized = true;

        App.log("Dashboard Initialized Successfully");

        return true;

    } catch (err) {

        initialized = false;

        console.error("[Dashboard Init]", err);

        App.handleError(err);

        return false;

    } finally {

        initializing = false;

    }

}



// ==================================================
// LOAD USER
// ==================================================

function loadUser() {

    const session = App.getSession();

    if (!session) {
        return false;
    }

    setText("userName", session.nama ?? "-");
    setText("userRole", session.role ?? "-");
    setText("userNik", session.nik ?? "-");

    setText(
        "lastLogin",
        session.lastLogin ??
        new Date().toLocaleString("id-ID")
    );

    return true;

}


// ==================================================
// LOAD DASHBOARD SUMMARY
// ==================================================

async function loadSummary() {

    App.showLoading();

    try {

        const session = App.getSession();

        if (!session?.token) {
            throw new Error("Session tidak ditemukan.");
        }

        const result = await Api.get("getDashboard", {
            token: session.token
        });

        if (!result?.success) {

            App.toast(
                result?.message || "Dashboard gagal dimuat.",
                "error"
            );

            return false;
        }

dashboardData = {
    ...dashboardData,
    ...(result.data || {}),
    activity: Array.isArray(result.data?.activity)
        ? result.data.activity
        : [],
    monthly: Array.isArray(result.data?.monthly)
        ? result.data.monthly
        : []
};

        renderSummary();

        return true;

    } catch (err) {

        console.error("Load Summary Error:", err);

        App.handleError(err);

        return false;

    } finally {

        App.hideLoading();

    }

}

// ==================================================
// RENDER SUMMARY
// ==================================================

function renderSummary() {

    const {

        total = 0,
        ac = 0,
        listrik = 0,
        gedung = 0,

        open = 0,
        progress = 0,
        done = 0,

        totalTrend = 0,
        acTrend = 0,
        listrikTrend = 0,
        gedungTrend = 0

    } = dashboardData;

    const counters = [
        ["totalReport", total],
        ["acTotal", ac],
        ["listrikTotal", listrik],
        ["gedungTotal", gedung],
        ["totalOpen", open],
        ["totalProgress", progress],
        ["totalDone", done]
    ];

    counters.forEach(([id, value]) => {
        DashboardView.animateCounter(id, value);
    });

    const trends = [
        ["total", totalTrend],
        ["ac", acTrend],
        ["listrik", listrikTrend],
        ["gedung", gedungTrend]
    ];

    trends.forEach(([id, value]) => {
        DashboardView.setTrend(id, value);
    });

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

function getData() {

    // Mengembalikan salinan object agar tidak bisa dimodifikasi dari luar
    return {

        ...dashboardData,

        activity: [...dashboardData.activity],

        monthly: [...dashboardData.monthly]

    };

}

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
// COUNTER ANIMATION
// ==================================================

const counterTimers = Object.create(null);

function animateCounter(id, endValue) {

    const element = document.getElementById(id);

    if (!element) return;

    // Validasi nilai
    endValue = Number(endValue);

    if (isNaN(endValue)) {
        endValue = 0;
    }

    let start = Number(element.textContent) || 0;

    // Jika nilai sama, tidak perlu animasi
    if (start === endValue) {
        element.textContent = endValue;
        return;
    }

    // Hentikan animasi sebelumnya jika ada
    if (counterTimers[id]) {
        clearInterval(counterTimers[id]);
    }

    const DURATION = 800;
    const FRAMES = 30;

    const diff = endValue - start;
    const step = diff / FRAMES;

    counterTimers[id] = setInterval(() => {

        start += step;

        const finished =
            (step > 0 && start >= endValue) ||
            (step < 0 && start <= endValue);

        if (finished) {

            start = endValue;

            clearInterval(counterTimers[id]);

            delete counterTimers[id];

        }

        element.textContent = Math.round(start);

    }, DURATION / FRAMES);

}
    // ==================================================
    // TREND INDICATOR
    // ==================================================

    function setTrend(id, value) {

        const trendText = document.getElementById(id + "Trend");
        const trendIcon = document.getElementById(id + "TrendIcon");

        if (!trendText || !trendIcon) return;

        trendText.textContent = Math.abs(value);

        if (value >= 0) {

            trendIcon.className = "bi bi-arrow-up";
            trendText.parentElement.className = "summary-trend success";

        } else {

            trendIcon.className = "bi bi-arrow-down";
            trendText.parentElement.className = "summary-trend danger";

        }

    }

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

    const list = Dashboard.getData()?.activity ?? [];

    // Empty State
    if (list.length === 0) {

        container.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="bi bi-clock-history fs-1 d-block mb-2"></i>
                <span>Tidak ada aktivitas terbaru</span>
            </div>
        `;

        return;

    }

    // Status Configuration
    const STATUS_CONFIG = {

        OPEN: {
            icon: "bi-folder2-open",
            color: "primary"
        },

        PROGRESS: {
            icon: "bi-arrow-repeat",
            color: "warning"
        },

        DONE: {
            icon: "bi-check-circle-fill",
            color: "success"
        }

    };

    // Escape HTML (Prevent XSS)
    const escapeHtml = (value) => {

        const div = document.createElement("div");

        div.textContent = value ?? "";

        return div.innerHTML;

    };

    container.innerHTML = list.map(item => {

        const status = item.status || "OPEN";

        const config =
            STATUS_CONFIG[status] || STATUS_CONFIG.OPEN;

        return `

            <div class="activity-item">

                <div class="activity-icon ${config.color}">

                    <i class="bi ${config.icon}"></i>

                </div>

                <div class="activity-content">

                    <strong>
                        ${escapeHtml(item.kategori || "-")}
                    </strong>

                    <small>
                        ${escapeHtml(item.lokasi || "-")}
                    </small>

                </div>

                <span>
                    ${escapeHtml(item.waktu || "-")}
                </span>

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

        if (oldChart instanceof Chart) {
    oldChart.destroy();
}

        const data = Dashboard.getData() || {};

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

animation: {

    animateRotate: true,

    animateScale: true,

    duration: 1200,

    easing: "easeOutQuart"

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
// MONTHLY LINE CHART
// ==================================================

function renderLineChart() {

    const canvas = document.getElementById("monthlyChart");

    if (!canvas) return;

    // Destroy chart lama
    const oldChart = Dashboard.getLineChart();

    if (oldChart instanceof Chart) {
        oldChart.destroy();
    }

    const data = Dashboard.getData() || {};

    // Validasi data bulanan
    const monthlyData = Array.isArray(data.monthly)
        ? [...data.monthly]
        : [];

    // Pastikan selalu 12 bulan
    while (monthlyData.length < 12) {
        monthlyData.push(0);
    }

    const chart = new Chart(canvas, {

        type: "line",

        data: {

            labels: [
                "Jan", "Feb", "Mar", "Apr",
                "Mei", "Jun", "Jul", "Agu",
                "Sep", "Okt", "Nov", "Des"
            ],

            datasets: [{

                label: "Total Report",

                data: monthlyData.slice(0, 12),

                borderColor: "#2563EB",

                backgroundColor: "rgba(37,99,235,0.15)",

                borderWidth: 3,

                fill: true,

                tension: 0.35,

                pointRadius: 4,

                pointHoverRadius: 7,

                pointHitRadius: 15

            }]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            animation: {

                duration: 1000,

                easing: "easeOutQuart"

            },

            interaction: {

                intersect: false,

                mode: "index"

            },

            plugins: {

                legend: {

                    display: false

                },

                tooltip: {

                    displayColors: false,

                    callbacks: {

                        label(context) {

                            return `Total Report : ${context.parsed.y}`;

                        }

                    }

                }

            },

            scales: {

                x: {

                    grid: {

                        display: false

                    }

                },

                y: {

                    beginAtZero: true,

                    ticks: {

                        precision: 0,

                        stepSize: 1

                    },

                    grid: {

                        color: "rgba(0,0,0,0.05)"

                    }

                }

            }

        }

    });

    Dashboard.setLineChart(chart);

}
    // ==================================================
    // LAST REFRESH
    // ==================================================

   function updateLastRefresh(){
    const target = document.getElementById("lastUpdate");
    if(!target) return;
    const data = Dashboard.getData() || {};
target.textContent =
    data.lastUpdate ??
    new Date().toLocaleString("id-ID");
}

    // ==================================================
    // REFRESH ALL
    // ==================================================

    async function refresh(){

    App.log("Refreshing Dashboard...");

    await Dashboard.loadSummary();
    renderActivity();

    renderChart();

    renderLineChart();

    updateLastRefresh();

}
     // ... function lainnya ...

    return {
        animateCards,
        animateCounter,
        setTrend,
        renderActivity,
        renderChart,
        renderLineChart,
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

        App.log("Realtime Dashboard Refresh");

        try {

            await DashboardView.refresh();

            updateFooter();

        } catch (err) {

            console.error(err);

        }

    }, 30000);

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

   function bindVisibility(){
document.addEventListener("visibilitychange", async () => {

    if (document.hidden) {

        App.log("Pause Refresh");
        stopAutoRefresh();
        return;

    }

    App.log("Resume Refresh");

    try {

        await DashboardView.refresh();
        startAutoRefresh();

    } catch (err) {

        console.error(err);

    }

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
DashboardView.renderLineChart();
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
function updateFooter() {

    const {
        onlineUser = 0,
        todayReport = 0,
        pendingApproval = 0
    } = Dashboard.getData() || {};

    setFooter("onlineUser", onlineUser);
    setFooter("todayReport", todayReport);
    setFooter("pendingApproval", pendingApproval);

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
