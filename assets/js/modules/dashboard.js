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
    // HELPER
    // ==================================================
    function setText(id, value) {
        const el = document.getElementById(id);
        if (!el) return;
        el.textContent = value;
    }

    // ==================================================
    // LOAD USER
    // ==================================================
    function loadUser() {
        const session = App.getSession();
        if (!session) return false;

        setText("userName", session.nama ?? "-");
        setText("userRole", session.role ?? "-");
        setText("userNik", session.nik ?? "-");
        setText("lastLogin", session.lastLogin ?? new Date().toLocaleString("id-ID"));

        return true;
    }

    // ==================================================
    // LOAD DASHBOARD SUMMARY
    // ==================================================
    async function loadSummary() {
        App.showLoading();

        try {
            const session = App.getSession();
            if (!session || !session.token) {
                App.toast("Session telah berakhir. Silakan login kembali.", "error");
                App.redirect("login.html");
                return false;
            }

            const result = await Api.post("getDashboard", { token: session.token });
            console.log("[Dashboard API]", result);

            if (!result) {
                App.toast("Tidak ada respon dari server.", "error");
                return false;
            }

            if (result.success !== true) {
                App.toast(result.message || "Dashboard gagal dimuat.", "error");
                return false;
            }

            // DATA MAPPING
            const data = result?.data ?? result?.payload ?? result?.result ?? {};
            const toNumber = (value) => {
                const number = Number(value);
                return Number.isFinite(number) ? number : 0;
            };
            const toArray = (value, fallback = []) => {
                return Array.isArray(value) ? [...value] : [...fallback];
            };

            // Update Dashboard State
            dashboardData = {
                ...dashboardData,
                total: toNumber(data.total),
                ac: toNumber(data.ac),
                listrik: toNumber(data.listrik),
                gedung: toNumber(data.gedung),
                open: toNumber(data.open),
                progress: toNumber(data.progress),
                done: toNumber(data.done),
                totalTrend: toNumber(data.totalTrend),
                acTrend: toNumber(data.acTrend),
                listrikTrend: toNumber(data.listrikTrend),
                gedungTrend: toNumber(data.gedungTrend),
                onlineUser: toNumber(data.onlineUser),
                todayReport: toNumber(data.todayReport),
                pendingApproval: toNumber(data.pendingApproval),
                lastUpdate: data.lastUpdate || data.serverTime || new Date().toLocaleString("id-ID"),
                activity: toArray(data.activity),
                monthly: (() => {
                    const monthly = toArray(data.monthly, Array(12).fill(0));
                    while (monthly.length < 12) {
                        monthly.push(0);
                    }
                    return monthly.slice(0, 12);
                })()
            };

            App.log("Dashboard Data Loaded");
            console.table({
                total: dashboardData.total,
                ac: dashboardData.ac,
                listrik: dashboardData.listrik,
                gedung: dashboardData.gedung,
                open: dashboardData.open,
                progress: dashboardData.progress,
                done: dashboardData.done,
                todayReport: dashboardData.todayReport,
                onlineUser: dashboardData.onlineUser,
                pendingApproval: dashboardData.pendingApproval
            });

            renderSummary();
            App.log("Dashboard Summary Loaded");
            return true;

        } catch (err) {
            console.error("[Dashboard Load Summary]", err);
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
            total = 0, ac = 0, listrik = 0, gedung = 0,
            open = 0, progress = 0, done = 0,
            totalTrend = 0, acTrend = 0, listrikTrend = 0, gedungTrend = 0
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
    // INIT
    // ==================================================
    async function init() {
        if (initialized) return true;
        if (initializing) return false;

        initializing = true;
        App.log("Dashboard Module Loaded");

        try {
            const isAuthenticated = await AuthService.guard();
            if (!isAuthenticated) return false;

            const userLoaded = loadUser();
            if (!userLoaded) throw new Error("Data user gagal dimuat.");

            const summaryLoaded = await loadSummary();
            if (!summaryLoaded) throw new Error("Dashboard data gagal dimuat.");

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
    // GETTERS & SETTERS
    // ==================================================
    function getData() {
        return {
            ...dashboardData,
            activity: [...dashboardData.activity],
            monthly: [...dashboardData.monthly]
        };
    }

    const getDonutChart = () => donutChart;
    const setDonutChart = (instance) => { donutChart = instance; };
    const getLineChart = () => lineChart;
    const setLineChart = (instance) => { lineChart = instance; };

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
    const counterTimers = Object.create(null);
    let isRefreshing = false;

    // ==================================================
    // COUNTER ANIMATION
    // ==================================================
    function animateCounter(id, endValue) {
        const element = document.getElementById(id);
        if (!element) return;

        endValue = Number(endValue) || 0;
        let start = Number(element.textContent) || 0;

        if (start === endValue) {
            element.textContent = endValue;
            return;
        }

        if (counterTimers[id]) {
            clearInterval(counterTimers[id]);
        }

        const DURATION = 800;
        const FRAMES = 30;
        const diff = endValue - start;
        const step = diff / FRAMES;

        counterTimers[id] = setInterval(() => {
            start += step;
            const finished = (step > 0 && start >= endValue) || (step < 0 && start <= endValue);

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
        const cards = document.querySelectorAll(".summary-card, .status-card, .enterprise-card, .user-profile-card");
        cards.forEach((card, index) => {
            card.animate([
                { opacity: 0, transform: "translateY(20px)" },
                { opacity: 1, transform: "translateY(0)" }
            ], {
                duration: 500,
                delay: index * 120,
                fill: "forwards",
                easing: "ease-out"
            });
        });
    }

    // ==================================================
    // RERECENT ACTIVITY
    // ==================================================
    function renderActivity() {
        const container = document.getElementById("recentActivity");
        if (!container) return;

        const list = Dashboard.getData()?.activity ?? [];

        if (list.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="bi bi-clock-history fs-1 d-block mb-2"></i>
                    <span>Tidak ada aktivitas terbaru</span>
                </div>`;
            return;
        }

        const STATUS_CONFIG = {
            OPEN: { icon: "bi-folder2-open", color: "primary" },
            PROGRESS: { icon: "bi-arrow-repeat", color: "warning" },
            DONE: { icon: "bi-check-circle-fill", color: "success" }
        };

        const escapeHtml = (value) => {
            const div = document.createElement("div");
            div.textContent = value ?? "";
            return div.innerHTML;
        };

        container.innerHTML = list.map(item => {
            const status = item.status || "OPEN";
            const config = STATUS_CONFIG[status] || STATUS_CONFIG.OPEN;

            return `
                <div class="activity-item">
                    <div class="activity-icon ${config.color}">
                        <i class="bi ${config.icon}"></i>
                    </div>
                    <div class="activity-content">
                        <strong>${escapeHtml(item.kategori || "-")}</strong>
                        <small>${escapeHtml(item.lokasi || "-")}</small>
                    </div>
                    <span>${escapeHtml(item.waktu || "-")}</span>
                </div>`;
        }).join("");
    }

    // ==================================================
    // CHART DOUGHNUT
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
                    data: [data.ac || 0, data.listrik || 0, data.gedung || 0],
                    backgroundColor: ["#2563EB", "#F59E0B", "#7C3AED"],
                    hoverBackgroundColor: ["#1D4ED8", "#D97706", "#6D28D9"],
                    hoverOffset: 8,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: "72%",
                animation: {
                    animateRotate: true,
                    animateScale: true,
                    duration: 1200,
                    easing: "easeOutQuart"
                },
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: {
                            usePointStyle: true,
                            pointStyle: "circle",
                            padding: 20
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

        const oldChart = Dashboard.getLineChart();
        if (oldChart instanceof Chart) {
            oldChart.destroy();
        }

        const data = Dashboard.getData() || {};
        const monthlyData = Array.isArray(data.monthly) ? [...data.monthly] : [];
        while (monthlyData.length < 12) {
            monthlyData.push(0);
        }

        const ctx = canvas.getContext("2d");
        const gradient = ctx.createLinearGradient(0, 0, 0, 320);
        gradient.addColorStop(0, "rgba(37,99,235,0.35)");
        gradient.addColorStop(1, "rgba(37,99,235,0.03)");

        const chart = new Chart(ctx, {
            type: "line",
            data: {
                labels: ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"],
                datasets: [{
                    label: "Total Report",
                    data: monthlyData.slice(0, 12),
                    borderColor: "#2563EB",
                    backgroundColor: gradient,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.45,
                    pointRadius: 4,
                    pointHoverRadius: 8,
                    pointHitRadius: 15,
                    pointBorderWidth: 2,
                    pointBackgroundColor: "#2563EB",
                    pointBorderColor: "#FFFFFF",
                    pointHoverBackgroundColor: "#FFFFFF",
                    pointHoverBorderColor: "#2563EB"
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 1200, easing: "easeOutQuart" },
                interaction: { intersect: false, mode: "index" },
                elements: {
                    line: { borderJoinStyle: "round", borderCapStyle: "round" },
                    point: { hitRadius: 15, hoverRadius: 8 }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: "#1F2937",
                        titleColor: "#FFFFFF",
                        bodyColor: "#FFFFFF",
                        displayColors: false,
                        padding: 12,
                        cornerRadius: 10,
                        callbacks: {
                            label(context) {
                                return "Total Report : " + context.parsed.y;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false, drawBorder: false },
                        ticks: { color: "#64748B", font: { size: 12 } }
                    },
                    y: {
                        beginAtZero: true,
                        suggestedMax: Math.max(...monthlyData, 5) + 5,
                        ticks: { precision: 0, stepSize: 5, color: "#64748B", font: { size: 12 } },
                        grid: { color: "rgba(148,163,184,0.10)", drawBorder: false }
                    }
                }
            }
        });

        Dashboard.setLineChart(chart);
    }

    // ==================================================
    // LAST REFRESH
    // ==================================================
    function updateLastRefresh() {
        const target = document.getElementById("lastUpdate");
        if (!target) return;

        const data = Dashboard.getData() || {};
        target.textContent = data.lastUpdate ?? new Date().toLocaleString("id-ID");
    }

    // ==================================================
    // REFRESH ALL
    // ==================================================
    async function refresh() {
        if (isRefreshing) return false;
        isRefreshing = true;

        App.log("Refreshing Dashboard...");
        try {
            const loaded = await Dashboard.loadSummary();
            if (!loaded) return false;

            renderActivity();
            renderChart();
            renderLineChart();
            updateLastRefresh();

            App.log("Dashboard Refresh Success");
            return true;
        } catch (err) {
            console.error("[Dashboard Refresh]", err);
            App.handleError(err);
            return false;
        } finally {
            isRefreshing = false;
        }
    }

    return {
        animateCounter,
        setTrend,
        animateCards,
        renderActivity,
        renderChart,
        renderLineChart,
        updateLastRefresh,
        refresh
    };
})();

/**
 * =====================================================
 * DASHBOARD MODULE (Bootstrap & Events)
 * Handles: event binding, auto-refresh, visibility
 * =====================================================
 */
const DashboardModule = (() => {
    let refreshInterval = null;
    let clockInterval = null;

    function bindRefreshButton() {
        const button = document.getElementById("refreshDashboard");
        if (!button) return;
        button.addEventListener("click", async (event) => {
            event.preventDefault();
            await DashboardView.refresh();
        });
    }

    function bindLogoutButton() {
        const button = document.getElementById("logoutBtn");
        if (!button) return;
        button.addEventListener("click", async (event) => {
            event.preventDefault();
            const confirmed = await App.confirm("Logout", "Keluar dari aplikasi?");
            if (!confirmed || !confirmed.isConfirmed) return;
            await AuthService.logout();
        });
    }

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

    function bindVisibility() {
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

    function bindUnload() {
        window.addEventListener("beforeunload", () => {
            stopAutoRefresh();
            stopClock();
        });
    }

    async function checkSession() {
        const valid = await AuthService.verifySession();
        if (valid) return true;

        App.removeSession();
        App.redirect("login.html");
        return false;
    }

    // REALTIME CLOCK
    function updateClock() {
        const now = new Date();
        setFooter("todayDate", now.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }));
        setFooter("currentTime", now.toLocaleTimeString("id-ID", { hour12: false }));
    }

    function startClock() {
        if (clockInterval) return;
        updateClock();
        clockInterval = setInterval(updateClock, 1000);
    }

    function stopClock() {
        if (!clockInterval) return;
        clearInterval(clockInterval);
        clockInterval = null;
    }

    // FOOTER HELPERS
    function setFooter(id, value) {
        const element = document.getElementById(id);
        if (!element) {
            console.warn("[Footer] Element tidak ditemukan :", id);
            return;
        }
        element.textContent = value ?? "-";
    }

    function updateFooter() {
        const { onlineUser = 0, todayReport = 0, pendingApproval = 0 } = Dashboard.getData() || {};
        setFooter("onlineUser", onlineUser);
        setFooter("todayReport", todayReport);
        setFooter("pendingApproval", pendingApproval);
    }

    // INITIALIZE
    async function init() {
        App.log("Dashboard Bootstrap");
        try {
            const sessionValid = await checkSession();
            if (!sessionValid) return false;

            const dashboardReady = await Dashboard.init();
            if (!dashboardReady) throw new Error("Dashboard gagal diinisialisasi.");

            // Render UI
            DashboardView.animateCards();
            DashboardView.renderActivity();
            DashboardView.renderChart();
            DashboardView.renderLineChart();
            DashboardView.updateLastRefresh();

            // Footer & Clock
            updateFooter();
            startClock();

            // Event Binding
            bindRefreshButton();
            bindLogoutButton();
            bindVisibility();
            bindUnload();

            // Auto Refresh
            startAutoRefresh();

            App.log("Dashboard Module Ready");
            return true;
        } catch (err) {
            console.error("[DashboardModule Init]", err);
            App.handleError(err);
            return false;
        }
    }

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
