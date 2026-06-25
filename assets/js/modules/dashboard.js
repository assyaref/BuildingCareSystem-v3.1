// ======================================================
// Building Care System Enterprise v2.0-Alpha.1 Roadmap
// File : assets/js/modules/dashboard.js
// Radiant Group Duri
// Target Specification: Unified Store, Lazy Charts, Idle Interceptor, Realtime Metrics Panel
// ======================================================

"use strict";

(async () => {
    // ==================================================
    // 1. CONSTANTS & INITIAL BASES
    // ==================================================
    const MODULE_NAME = "Dashboard";
    const POLLING_ACTIVE = 30000;    
    const POLLING_HIDDEN = 300000;  
    const ANIMATION_DURATION = 800;
    const ANIMATION_FRAMES = 30;
    const IDLE_THRESHOLD = 300000; // 5 Menit Idle (Rekomendasi 4)
    
    const CHART_COLORS = Object.freeze({
        ac: Object.freeze({ normal: "#2563EB", hover: "#1D4ED8" }),
        listrik: Object.freeze({ normal: "#F59E0B", hover: "#D97706" }),
        gedung: Object.freeze({ normal: "#7C3AED", hover: "#6D28D9" }),
        line: "#2563EB"
    });

    Object.freeze(MODULE_NAME);

    // Initial Factory State untuk kemudahan isolasi arsitektur v2 Store
    const createInitialState = () => ({
        summary: {
            total: 0, ac: 0, listrik: 0, gedung: 0,
            open: 0, progress: 0, done: 0,
            totalTrend: 0, acTrend: 0, listrikTrend: 0, gedungTrend: 0,
            fast: 0, normal: 0, late: 0,
            fastPercent: "0%", normalPercent: "0%", latePercent: "0%"
        },
        activity: [],
        monthly: Array(12).fill(0),
        footer: {
            onlineUser: 0, todayReport: 0, pendingApproval: 0,
            lastUpdate: null, todayDate: "-", currentTime: "-"
        },
        charts: { donut: null, line: null },
        ui: {
            initialized: false, initializing: false, isRefreshing: false,
            refreshInterval: null, clockInterval: null, idleTimeout: null,
            isIdle: false,
            counterTimers: Object.create(null),
            eventUnsubscribers: [] 
        },
        // Rekomendasi 5: Internal Realtime Performance Node Metrics
        metrics: {
            openCount: 0,
            refreshCount: 0,
            apiTime: 0,
            renderTime: 0,
            cacheHits: 0,
            memoryEstimate: "0 MB"
        }
    });

    // ==================================================
    // 2. STATE INTERCEPTION / RECONCILIATION (Rekomendasi 1: Dashboard Store)
    // ==================================================
    if (typeof BCS === "undefined") window.BCS = {};
    if (!BCS.Store) BCS.Store = {};

    // Mengikat state lokal langsung ke namespace global Store BCS Enterprise
    BCS.Store.dashboard = createInitialState();
    const state = BCS.Store.dashboard;

    // ==================================================
    // 3. ANALYTICS FALLBACK STUB (Rekomendasi 2: Dashboard Analytics Framework)
    // ==================================================
    if (!BCS.Analytics) {
        BCS.Analytics = {
            track(eventName, payload = {}) {
                console.groupCollapsed(`[BCS Analytics v2 Tracking: ${eventName}]`);
                console.log("Payload:", payload);
                console.log("Timestamp:", new Date().toISOString());
                console.groupEnd();
            }
        };
    }

    // ==================================================
    // 4. DOM CACHE & DYNAMIC DEV PANEL CREATION
    // ==================================================
    const DOM = {
        user: {
            name: document.getElementById("userName"),
            role: document.getElementById("userRole"),
            nik: document.getElementById("userNik"),
            lastLogin: document.getElementById("lastLogin")
        },
        total: document.getElementById("totalReport"),
        open: document.getElementById("totalOpen"),
        progress: document.getElementById("totalProgress"),
        done: document.getElementById("totalDone"),
        categories: {
            ac: document.getElementById("acTotal"),
            listrik: document.getElementById("listrikTotal"),
            gedung: document.getElementById("gedungTotal")
        },
        trends: {
            total: document.getElementById("totalTrend"), totalIcon: document.getElementById("totalTrendIcon"),
            ac: document.getElementById("acTrend"), acIcon: document.getElementById("acTrendIcon"),
            listrik: document.getElementById("listrikTrend"), listrikIcon: document.getElementById("listrikTrendIcon"),
            gedung: document.getElementById("gedungTrend"), gedungIcon: document.getElementById("gedungTrendIcon")
        },
        sla: {
            fastCount: document.getElementById("fastCount"), normalCount: document.getElementById("normalCount"), lateCount: document.getElementById("lateCount"),
            fastPercent: document.getElementById("fastPercent"), normalPercent: document.getElementById("normalPercent"), latePercent: document.getElementById("latePercent")
        },
        chart: {
            report: document.getElementById("reportChart"),
            monthly: document.getElementById("monthlyChart")
        },
        activity: document.getElementById("recentActivity"),
        footer: {
            onlineUser: document.getElementById("onlineUser"), todayReport: document.getElementById("todayReport"),
            pendingApproval: document.getElementById("pendingApproval"), lastUpdate: document.getElementById("lastUpdate"),
            todayDate: document.getElementById("todayDate"), currentTime: document.getElementById("currentTime")
        },
        buttons: {
            refresh: document.getElementById("refreshDashboard"),
            logout: document.getElementById("logoutBtn")
        },
        cards: document.querySelectorAll(".summary-card, .status-card, .enterprise-card, .user-profile-card")
    };

    // ==================================================
    // 5. SERVICES REGISTRATION
    // ==================================================
    if (!BCS.Services) BCS.Services = {};
    BCS.Services.Dashboard = {
        async fetchDashboardData(token) { return await BCS.Api.dashboard({ token }); },
        async fetchSLAAnalytics() { return await BCS.Api.post("getSLAAnalytics"); }
    };

    // ==================================================
    // 6. PROCESSING
    // ==================================================
    function processDashboardPayload(result) {
        const data = result?.data ?? result?.payload ?? result?.result ?? {};
        const toNumber = (val) => { const num = Number(val); return Number.isFinite(num) ? num : 0; };

        state.summary.total = toNumber(data.total);
        state.summary.ac = toNumber(data.ac);
        state.summary.listrik = toNumber(data.listrik);
        state.summary.gedung = toNumber(data.gedung);
        state.summary.open = toNumber(data.open);
        state.summary.progress = toNumber(data.progress);
        state.summary.done = toNumber(data.done);
        state.summary.totalTrend = toNumber(data.totalTrend);
        state.summary.acTrend = toNumber(data.acTrend);
        state.summary.listrikTrend = toNumber(data.listrikTrend);
        state.summary.gedungTrend = toNumber(data.gedungTrend);

        state.activity = Array.isArray(data.activity) ? [...data.activity] : [];
        state.monthly = (() => {
            const monthly = Array.isArray(data.monthly) ? [...data.monthly] : Array(12).fill(0);
            while (monthly.length < 12) monthly.push(0);
            return monthly.slice(0, 12);
        })();

        state.footer.onlineUser = toNumber(data.onlineUser);
        state.footer.todayReport = toNumber(data.todayReport);
        state.footer.pendingApproval = toNumber(data.pendingApproval);
        state.footer.lastUpdate = data.lastUpdate || data.serverTime || new Date().toLocaleString("id-ID");
    }

    function processSLAPayload(response) {
        if (!response || !response.success) return;
        const data = response.data || {};
        state.summary.fast = data.fast || 0;
        state.summary.normal = data.normal || 0;
        state.summary.late = data.late || 0;
        state.summary.fastPercent = (data.fastPercent || 0) + "%";
        state.summary.normalPercent = (data.normalPercent || 0) + "%";
        state.summary.latePercent = (data.latePercent || 0) + "%";
    }

    // ==================================================
    // 7. SUMMARY COMPONENT
    // ==================================================
    const DashboardSummary = {
        animateCounter(element, endValue) {
            if (!element) return;
            endValue = Number(endValue) || 0;
            let start = Number(element.textContent) || 0;

            if (start === endValue) {
                element.textContent = endValue;
                return;
            }

            const id = element.id || Math.random().toString(36).substr(2, 9);
            if (state.ui.counterTimers[id]) clearInterval(state.ui.counterTimers[id]);

            const diff = endValue - start;
            const step = diff / ANIMATION_FRAMES;

            state.ui.counterTimers[id] = setInterval(() => {
                start += step;
                const finished = (step > 0 && start >= endValue) || (step < 0 && start <= endValue);
                if (finished) {
                    start = endValue;
                    clearInterval(state.ui.counterTimers[id]);
                    delete state.ui.counterTimers[id];
                }
                element.textContent = Math.round(start);
            }, ANIMATION_DURATION / ANIMATION_FRAMES);
        },

        setTrendStyle(textEl, iconEl, value) {
            if (!textEl || !iconEl) return;
            textEl.textContent = Math.abs(value);
            if (value >= 0) {
                iconEl.className = "bi bi-arrow-up";
                textEl.parentElement.className = "summary-trend success";
            } else {
                iconEl.className = "bi bi-arrow-down";
                textEl.parentElement.className = "summary-trend danger";
            }
        },

        render() {
            this.animateCounter(DOM.total, state.summary.total);
            this.animateCounter(DOM.open, state.summary.open);
            this.animateCounter(DOM.progress, state.summary.progress);
            this.animateCounter(DOM.done, state.summary.done);
            this.animateCounter(DOM.categories.ac, state.summary.ac);
            this.animateCounter(DOM.categories.listrik, state.summary.listrik);
            this.animateCounter(DOM.categories.gedung, state.summary.gedung);

            this.setTrendStyle(DOM.trends.total, DOM.trends.totalIcon, state.summary.totalTrend);
            this.setTrendStyle(DOM.trends.ac, DOM.trends.acIcon, state.summary.acTrend);
            this.setTrendStyle(DOM.trends.listrik, DOM.trends.listrikIcon, state.summary.listrikTrend);
            this.setTrendStyle(DOM.trends.gedung, DOM.trends.gedungIcon, state.summary.gedungTrend);

            if (DOM.sla.fastCount) DOM.sla.fastCount.textContent = state.summary.fast;
            if (DOM.sla.normalCount) DOM.sla.normalCount.textContent = state.summary.normal;
            if (DOM.sla.lateCount) DOM.sla.lateCount.textContent = state.summary.late;
            if (DOM.sla.fastPercent) DOM.sla.fastPercent.textContent = state.summary.fastPercent;
            if (DOM.sla.normalPercent) DOM.sla.normalPercent.textContent = state.summary.normalPercent;
            if (DOM.sla.latePercent) DOM.sla.latePercent.textContent = state.summary.latePercent;
        }
    };

    // ==================================================
    // 8. CHART COMPONENT (Rekomendasi 3: Intersection Observer Lazy Loading)
    // ==================================================
    const DashboardChart = {
        lazyLoader: null,

        initLazyLoaders() {
            if (!("IntersectionObserver" in window)) {
                // Fallback jika browser usang
                this.render();
                return;
            }

            this.lazyLoader = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        if (entry.target === DOM.chart.report) this.renderDonut();
                        if (entry.target === DOM.chart.monthly) this.renderLine();
                        this.lazyLoader.unobserve(entry.target); // Hanya trigger sekali saja
                    }
                });
            }, { rootMargin: "50px 0px", threshold: 0.05 });

            if (DOM.chart.report) this.lazyLoader.observe(DOM.chart.report);
            if (DOM.chart.monthly) this.lazyLoader.observe(DOM.chart.monthly);
        },

        renderDonut() {
            if (!DOM.chart.report) return;
            const nextData = [state.summary.ac, state.summary.listrik, state.summary.gedung];

            if (state.charts.donut instanceof Chart) {
                state.charts.donut.data.datasets[0].data = nextData;
                state.charts.donut.update("active");
                return;
            }

            state.charts.donut = new Chart(DOM.chart.report, {
                type: "doughnut",
                data: {
                    labels: ["AC", "Listrik", "Gedung"],
                    datasets: [{
                        data: nextData,
                        backgroundColor: [CHART_COLORS.ac.normal, CHART_COLORS.listrik.normal, CHART_COLORS.gedung.normal],
                        hoverBackgroundColor: [CHART_COLORS.ac.hover, CHART_COLORS.listrik.hover, CHART_COLORS.gedung.hover],
                        hoverOffset: 8, borderWidth: 0
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false, cutout: "72%",
                    animation: { animateRotate: true, animateScale: true, duration: 1200, easing: "easeOutQuart" },
                    plugins: { legend: { position: "bottom", labels: { usePointStyle: true, pointStyle: "circle", padding: 20 } } }
                }
            });
        },

        renderLine() {
            if (!DOM.chart.monthly) return;

            if (state.charts.line instanceof Chart) {
                state.charts.line.data.datasets[0].data = [...state.monthly];
                state.charts.line.update("active");
                return;
            }

            const ctx = DOM.chart.monthly.getContext("2d");
            const gradient = ctx.createLinearGradient(0, 0, 0, 320);
            gradient.addColorStop(0, "rgba(37,99,235,0.35)");
            gradient.addColorStop(1, "rgba(37,99,235,0.03)");

            state.charts.line = new Chart(ctx, {
                type: "line",
                data: {
                    labels: ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"],
                    datasets: [{
                        label: "Total Report", data: [...state.monthly],
                        borderColor: CHART_COLORS.line, backgroundColor: gradient, borderWidth: 3, fill: true, tension: 0.45,
                        pointRadius: 4, pointHoverRadius: 8, pointHitRadius: 15, pointBorderWidth: 2,
                        pointBackgroundColor: CHART_COLORS.line, pointBorderColor: "#FFFFFF", pointHoverBackgroundColor: "#FFFFFF", pointHoverBorderColor: CHART_COLORS.line
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    animation: { duration: 1200, easing: "easeOutQuart" },
                    interaction: { intersect: false, mode: "index" },
                    elements: { line: { borderJoinStyle: "round", borderCapStyle: "round" }, point: { hitRadius: 15, hoverRadius: 8 } },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: "#1F2937", titleColor: "#FFFFFF", bodyColor: "#FFFFFF", displayColors: false, padding: 12, cornerRadius: 10,
                            callbacks: { label: (context) => "Total Report : " + context.parsed.y }
                        }
                    },
                    scales: {
                        x: { grid: { display: false, drawBorder: false }, ticks: { color: "#64748B", font: { size: 12 } } },
                        y: { beginAtZero: true, suggestedMax: Math.max(...state.monthly, 5) + 5, ticks: { precision: 0, stepSize: 5, color: "#64748B", font: { size: 12 } }, grid: { color: "rgba(148,163,184,0.10)", drawBorder: false } }
                    }
                }
            });
        },

        render() {
            this.renderDonut();
            this.renderLine();
        }
    };

    // ==================================================
    // 9. ACTIVITY, FOOTER & PERFORMANCE PANEL
    // ==================================================
    const DashboardActivity = {
        escapeHtml(value) { const div = document.createElement("div"); div.textContent = value ?? ""; return div.innerHTML; },
        render() {
            if (!DOM.activity) return;
            if (state.activity.length === 0) {
                DOM.activity.innerHTML = `<div class="text-center text-muted py-4"><i class="bi bi-clock-history fs-1 d-block mb-2"></i><span>Tidak ada aktivitas terbaru</span></div>`;
                return;
            }
            const STATUS_CONFIG = { OPEN: { icon: "bi-folder2-open", color: "primary" }, PROGRESS: { icon: "bi-arrow-repeat", color: "warning" }, DONE: { icon: "bi-check-circle-fill", color: "success" } };
            DOM.activity.innerHTML = state.activity.map(item => {
                const status = item.status || "OPEN"; const config = STATUS_CONFIG[status] || STATUS_CONFIG.OPEN;
                return `<div class="activity-item"><div class="activity-icon ${config.color}"><i class="bi ${config.icon}"></i></div><div class="activity-content"><strong>${this.escapeHtml(item.kategori || "-")}</strong><small>${this.escapeHtml(item.lokasi || "-")}</small></div><span>${this.escapeHtml(item.waktu || "-")}</span></div>`;
            }).join("");
        }
    };

    const DashboardFooter = {
        updateClock() {
            const now = new Date();
            state.footer.todayDate = now.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
            state.footer.currentTime = now.toLocaleTimeString("id-ID", { hour12: false });
            this.renderClockOnly();
        },
        renderClockOnly() {
            if (DOM.footer.todayDate) DOM.footer.todayDate.textContent = state.footer.todayDate;
            if (DOM.footer.currentTime) DOM.footer.currentTime.textContent = state.footer.currentTime;
        },
        render() {
            if (DOM.footer.onlineUser) DOM.footer.onlineUser.textContent = state.footer.onlineUser;
            if (DOM.footer.todayReport) DOM.footer.todayReport.textContent = state.footer.todayReport;
            if (DOM.footer.pendingApproval) DOM.footer.pendingApproval.textContent = state.footer.pendingApproval;
            if (DOM.footer.lastUpdate) DOM.footer.lastUpdate.textContent = state.footer.lastUpdate;
            this.renderClockOnly();
        }
    };

    // Rekomendasi 5: Realtime Embedded Performance Panel View 
    const PerformancePanel = {
        containerId: "bcs-perf-panel",
        render() {
            // Kalkulasi perkiraan heap memory jika didukung engine v8 browser
            if (window.performance && window.performance.memory) {
                state.metrics.memoryEstimate = `${Math.round(window.performance.memory.usedJSHeapSize / (1024 * 1024))} MB`;
            } else {
                state.metrics.memoryEstimate = "N/A (Non-V8)";
            }

            let panel = document.getElementById(this.containerId);
            if (!panel) {
                panel = document.createElement("div");
                panel.id = this.containerId;
                panel.style = "position:fixed;bottom:10px;right:10px;background:rgba(31,41,55,0.95);color:#10B981;font-family:monospace;padding:12px;border-radius:8px;font-size:11px;z-index:9999;border:1px solid #374151;box-shadow:0 4px 6px -1px rgba(0,0,0,0.5);width:220px;pointer-events:none;";
                document.body.appendChild(panel);
            }

            panel.innerHTML = `
                <div style="font-weight:bold;border-bottom:1px solid #374151;padding-bottom:4px;margin-bottom:6px;color:#F3F4F6">⚙️ BCS DEVELOPER PERFORMANCE</div>
                <div>API Latency   : <span style="color:#FFF">${state.metrics.apiTime.toFixed(1)} ms</span></div>
                <div>Render Engine : <span style="color:#FFF">${state.metrics.renderTime.toFixed(1)} ms</span></div>
                <div>Refresh Run   : <span style="color:#FFF">${state.metrics.refreshCount}</span></div>
                <div>Memory Heap   : <span style="color:#FFF">${state.metrics.memoryEstimate}</span></div>
                <div style="margin-top:4px;font-size:10px;color:${state.ui.isIdle ? '#EF4444' : '#6EE7B7'}">System status: ${state.ui.isIdle ? 'IDLE (PAUSED)' : 'ACTIVE'}</div>
            `;
        }
    };

    // ==================================================
    // 10. RENDER PIPELINE
    // ==================================================
    const Render = {
        animateCards() {
            if (typeof BCS !== "undefined" && BCS.Animation && typeof BCS.Animation.fadeUp === "function") {
                BCS.Animation.fadeUp(DOM.cards);
            } else {
                DOM.cards.forEach((card, index) => {
                    card.animate([{ opacity: 0, transform: "translateY(20px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 500, delay: index * 120, fill: "forwards", easing: "ease-out" });
                });
            }
        },

        all() {
            const tStart = performance.now();
            
            DashboardSummary.render();
            DashboardActivity.render();
            DashboardFooter.render();

            // Jika observer sudah berjalan, charts akan merender dirinya sendiri on-scroll.
            // Di v2 ini kita gunakan fallback update paksa jika instance Chart sudah terlanjur dirender
            if (state.charts.donut instanceof Chart) DashboardChart.renderDonut();
            if (state.charts.line instanceof Chart) DashboardChart.renderLine();

            state.metrics.renderTime = performance.now() - tStart;
            
            // Render Realtime Metrics Panel View
            PerformancePanel.render();
            BCS.Logger.performance(MODULE_NAME, "Full Engine UI Synchronized", tStart);
        }
    };

    // ==================================================
    // CORE PIPELINES & TELEMETRY
    // ==================================================
    async function loadSummary() {
        BCS.App.Loading.show();
        try {
            const session = BCS.App.getSession();
            if (!session || !session.token) {
                BCS.App.toast("Session telah berakhir. Silakan login kembali.", "error");
                BCS.App.redirect("login.html");
                return false;
            }

            const t0 = performance.now();
            const result = await BCS.Services.Dashboard.fetchDashboardData(session.token);
            
            state.metrics.apiTime = performance.now() - t0;
            BCS.Logger.performance(MODULE_NAME, "Load Summary API", t0);

            if (!result || result.success !== true) {
                BCS.App.toast(result?.message || "Dashboard gagal dimuat.", "error");
                return false;
            }

            processDashboardPayload(result);
            return true;
        } catch (err) {
            BCS.Error.handle(err);
            return false;
        } finally {
            BCS.App.Loading.hide();
        }
    }

    async function loadSLAAnalytics() {
        try {
            const response = await BCS.Services.Dashboard.fetchSLAAnalytics();
            processSLAPayload(response);
        } catch (err) {
            console.error("[SLA Analytics System Failure]", err);
        }
    }

    function loadUser() {
        const session = BCS.App.getSession();
        if (!session) return false;
        if (DOM.user.name) DOM.user.name.textContent = session.nama ?? "-";
        if (DOM.user.role) DOM.user.role.textContent = session.role ?? "-";
        if (DOM.user.nik) DOM.user.nik.textContent = session.nik ?? "-";
        if (DOM.user.lastLogin) DOM.user.lastLogin.textContent = session.lastLogin ?? new Date().toLocaleString("id-ID");
        return true;
    }

    async function refresh() {
        // Rekomendasi 4: Interseptor Polling jika status User sedang Idle
        if (state.ui.isIdle) {
            console.warn(`[${MODULE_NAME}] Pipeline refresh di-pause: User terdeteksi Idle.`);
            return false;
        }

        if (state.ui.isRefreshing) return false; 
        state.ui.isRefreshing = true;

        // Rekomendasi 2 & 4: Increment & Track Telemetry Engine v2
        state.metrics.refreshCount++;
        BCS.Analytics.track("dashboard_refresh", {
            runNumber: state.metrics.refreshCount,
            lastApiTime: state.metrics.apiTime,
            lastRenderTime: state.metrics.renderTime
        });

        BCS.Logger.performance(MODULE_NAME, "Refresh Pipeline Initiated", performance.now());
        try {
            const summaryLoaded = await loadSummary();
            if (!summaryLoaded) return false;

            await loadSLAAnalytics();
            Render.all();
            return true;
        } catch (err) {
            BCS.Error.handle(err);
            return false;
        } finally {
            state.ui.isRefreshing = false;
        }
    }

    // ==================================================
    // 11. EVENTS, ADAPTIVE POLLING & IDLE TRACKER
    // ==================================================
    function startAutoRefresh(customMs = null) {
        stopAutoRefresh();
        const currentInterval = customMs || (document.hidden ? POLLING_HIDDEN : POLLING_ACTIVE);

        state.ui.refreshInterval = setInterval(async () => {
            try {
                await refresh();
            } catch (err) {
                console.error(err);
            }
        }, currentInterval);
    }

    function stopAutoRefresh() {
        if (state.ui.refreshInterval) {
            clearInterval(state.ui.refreshInterval);
            state.ui.refreshInterval = null;
        }
    }

    // Rekomendasi 4: Mekanisme Interseptor Idle Activity
    function resetIdleTimer() {
        if (state.ui.isIdle) {
            state.ui.isIdle = false;
            console.log(`[${MODULE_NAME}] User kembali aktif. Melanjutkan engine polling.`);
            BCS.Analytics.track("user_active");
            refresh(); // Ambil data teranyar instan saat user kembali bekerja
            PerformancePanel.render();
        }

        clearTimeout(state.ui.idleTimeout);
        state.ui.idleTimeout = setTimeout(() => {
            state.ui.isIdle = true;
            console.warn(`[${MODULE_NAME}] Polling Auto Refresh ditangguhkan karena user tidak aktif > 5 menit.`);
            BCS.Analytics.track("user_idle_paused");
            PerformancePanel.render();
        }, IDLE_THRESHOLD);
    }

    function startClock() {
        if (state.ui.clockInterval) return;
        DashboardFooter.updateClock();
        state.ui.clockInterval = setInterval(() => DashboardFooter.updateClock(), 1000);
    }

    function stopClock() {
        if (state.ui.clockInterval) {
            clearInterval(state.ui.clockInterval);
            state.ui.clockInterval = null;
        }
    }

    function bindEvents() {
        if (DOM.buttons.refresh) {
            DOM.buttons.refresh.addEventListener("click", async (e) => {
                e.preventDefault();
                resetIdleTimer();
                await refresh();
            });
        }

        if (DOM.buttons.logout) {
            DOM.buttons.logout.addEventListener("click", async (e) => {
                e.preventDefault();
                const confirmed = await BCS.App.confirm("Logout", "Keluar dari aplikasi?");
                if (!confirmed || !confirmed.isConfirmed) return;
                await BCS.Auth.logout();
            });
        }

        document.addEventListener("visibilitychange", async () => {
            if (document.hidden) {
                startAutoRefresh(POLLING_HIDDEN);
                return;
            }
            if (!state.ui.isIdle) await refresh();
            startAutoRefresh(POLLING_ACTIVE);
        });

        // Pasang pendengar aktivitas pengguna demi fungsionalitas Idle Checking
        ["mousemove", "keydown", "click", "touchstart", "scroll"].forEach(eventName => {
            document.addEventListener(eventName, resetIdleTimer, { passive: true });
        });

        window.addEventListener("beforeunload", () => destroy());

        if (typeof BCS !== "undefined" && BCS.Events) {
            const unsubCreated = BCS.Events.on("report:created", async () => {
                if (!state.ui.isIdle) await refresh();
            });
            if (typeof unsubCreated === "function") state.ui.eventUnsubscribers.push(unsubCreated);

            const unsubUpdated = BCS.Events.on("report:updated", async () => {
                if (!state.ui.isIdle) await refresh();
            });
            if (typeof unsubUpdated === "function") state.ui.eventUnsubscribers.push(unsubUpdated);
        }
    }

    // ==================================================
    // 12. INIT
    // ==================================================
    async function init() {
        if (state.ui.initialized) return true;
        if (state.ui.initializing) return false;

        state.ui.initializing = true;
        const tInit = performance.now();

        try {
            const isAuthenticated = await BCS.Auth.guard();
            if (!isAuthenticated) {
                BCS.App.removeSession();
                BCS.App.redirect("login.html");
                return false;
            }

            const userLoaded = loadUser();
            if (!userLoaded) throw new Error("Data user gagal dimuat.");

            const summaryLoaded = await loadSummary();
            if (!summaryLoaded) throw new Error("Dashboard data gagal dimuat.");

            await loadSLAAnalytics();

            Render.animateCards();
            Render.all();

            // Bootstrap arsitektur v2 spesifik
            DashboardChart.initLazyLoaders(); // Rekomendasi 3
            resetIdleTimer();                 // Rekomendasi 4
            
            startClock();
            bindEvents();
            startAutoRefresh(); 

            state.ui.initialized = true;
            state.metrics.openCount = 1;
            
            BCS.Analytics.track("dashboard_open", { renderInitTime: performance.now() - tInit });
            BCS.Logger.performance(MODULE_NAME, "Module Fully Bootstrapped & Ready", tInit);
            return true;

        } catch (err) {
            state.ui.initialized = false;
            BCS.Error.handle(err);
            return false;
        } finally {
            state.ui.initializing = false;
        }
    }

    // ==================================================
    // 13. DESTROY & STATE UNBINDING
    // ==================================================
    function destroy() {
        stopAutoRefresh();
        stopClock();
        clearTimeout(state.ui.idleTimeout);
        
        if (DashboardChart.lazyLoader) {
            DashboardChart.lazyLoader.disconnect();
        }
        
        while (state.ui.eventUnsubscribers.length > 0) {
            const unsubscribe = state.ui.eventUnsubscribers.pop();
            if (typeof unsubscribe === "function") unsubscribe();
        }

        Object.keys(state.ui.counterTimers).forEach(id => { clearInterval(state.ui.counterTimers[id]); });
        state.ui.counterTimers = Object.create(null);

        if (state.charts.donut instanceof Chart) state.charts.donut.destroy();
        if (state.charts.line instanceof Chart) state.charts.line.destroy();
        
        // Lepas pemantau event idle activity
        ["mousemove", "keydown", "click", "touchstart", "scroll"].forEach(eventName => {
            document.removeEventListener(eventName, resetIdleTimer);
        });

        const panel = document.getElementById(PerformancePanel.containerId);
        if (panel) panel.remove();
        
        state.ui.initialized = false;
        console.log(`[${MODULE_NAME}] Core v2 Store module unmounted completely.`);
    }

    // Dom Ready Runner
    document.addEventListener("DOMContentLoaded", async () => {
        await init();
    });
})();
