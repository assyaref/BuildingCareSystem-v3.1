// ======================================================
// Building Care System Enterprise v3.2
// File : assets/js/modules/dashboard.js
// Radiant Group Duri
// Refactored to Enterprise Target Architecture v1.1 Enhancement
// ======================================================

"use strict";

(async () => {
    // ==================================================
    // 1. CONSTANTS & CONFIGURATION (Rekomendasi 1: Unified & Deep Frozen)
    // ==================================================
    const MODULE_NAME = "Dashboard";
    
    const CONFIG = Object.freeze({
        POLLING_ACTIVE: 30000,     // 30 detik saat tab aktif
        POLLING_HIDDEN: 300000,    // 5 menit saat tab tidak aktif (Adaptive Polling)
        ANIMATION_DURATION: 800,
        ANIMATION_FRAMES: 30,
        CACHE_TTL: 10000,          // Throttling Cache 10 detik (Rekomendasi 3)
        CHART_COLORS: Object.freeze({
            ac: Object.freeze({ normal: "#2563EB", hover: "#1D4ED8" }),
            listrik: Object.freeze({ normal: "#F59E0B", hover: "#D97706" }),
            gedung: Object.freeze({ normal: "#7C3AED", hover: "#6D28D9" }),
            line: "#2563EB"
        })
    });

    Object.freeze(MODULE_NAME);

    // Initial State Factory untuk mempermudah reset state saat Destroy
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
            onlineUser: 0,
            todayReport: 0,
            pendingApproval: 0,
            lastUpdate: null,
            todayDate: "-",
            currentTime: "-"
        },
        charts: {
            donut: null,
            line: null
        },
        ui: {
            initialized: false,
            initializing: false,
            isRefreshing: false,
            refreshInterval: null,
            clockInterval: null,
            counterTimers: Object.create(null),
            eventUnsubscribers: []
        },
        // Rekomendasi 3: Simple Client Cache State
        cache: {
            summaryPayload: null,
            slaPayload: null,
            timestamp: 0
        },
        // Rekomendasi 4: Internal Performance Metrics
        metrics: {
            refreshCount: 0,
            apiTime: 0,
            renderTime: 0
        }
    });

    // ==================================================
    // 2. STATE INITIALIZATION
    // ==================================================
    let state = createInitialState();

    // ==================================================
    // 3. DOM CACHE
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
            total: document.getElementById("totalTrend"),
            totalIcon: document.getElementById("totalTrendIcon"),
            ac: document.getElementById("acTrend"),
            acIcon: document.getElementById("acTrendIcon"),
            listrik: document.getElementById("listrikTrend"),
            listrikIcon: document.getElementById("listrikTrendIcon"),
            gedung: document.getElementById("gedungTrend"),
            gedungIcon: document.getElementById("gedungTrendIcon")
        },
        sla: {
            fastCount: document.getElementById("fastCount"),
            normalCount: document.getElementById("normalCount"),
            lateCount: document.getElementById("lateCount"),
            fastPercent: document.getElementById("fastPercent"),
            normalPercent: document.getElementById("normalPercent"),
            latePercent: document.getElementById("latePercent")
        },
        chart: {
            report: document.getElementById("reportChart"),
            monthly: document.getElementById("monthlyChart")
        },
        activity: document.getElementById("recentActivity"),
        footer: {
            onlineUser: document.getElementById("onlineUser"),
            todayReport: document.getElementById("todayReport"),
            pendingApproval: document.getElementById("pendingApproval"),
            lastUpdate: document.getElementById("lastUpdate"),
            todayDate: document.getElementById("todayDate"),
            currentTime: document.getElementById("currentTime")
        },
        buttons: {
            refresh: document.getElementById("refreshDashboard"),
            logout: document.getElementById("logoutBtn")
        },
        cards: document.querySelectorAll(".summary-card, .status-card, .enterprise-card, .user-profile-card")
    };

    // ==================================================
    // 4. SERVICE REGISTRATION (Rekomendasi 2: Consistent Registry Pattern)
    // ==================================================
    if (typeof BCS === "undefined") window.BCS = {};
    if (!BCS.Services) BCS.Services = {};
    
    // Fallback registry method jika belum di-define di core framework
    if (typeof BCS.Services.register !== "function") {
        BCS.Services.register = function(name, serviceObject) {
            this[name.charAt(0).toUpperCase() + name.slice(1)] = serviceObject;
        };
    }

    BCS.Services.register("dashboard", {
        async fetchDashboardData(token) {
            return await BCS.Api.dashboard({ token });
        },
        async fetchSLAAnalytics() {
            return await BCS.Api.post("getSLAAnalytics");
        }
    });

    // ==================================================
    // 5. PROCESSING
    // ==================================================
    function processDashboardPayload(result) {
        const data = result?.data ?? result?.payload ?? result?.result ?? {};
        
        const toNumber = (val) => {
            const num = Number(val);
            return Number.isFinite(num) ? num : 0;
        };

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
    // 6. SUMMARY COMPONENT
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
            if (state.ui.counterTimers[id]) {
                clearInterval(state.ui.counterTimers[id]);
            }

            const diff = endValue - start;
            const step = diff / CONFIG.ANIMATION_FRAMES;

            state.ui.counterTimers[id] = setInterval(() => {
                start += step;
                const finished = (step > 0 && start >= endValue) || (step < 0 && start <= endValue);

                if (finished) {
                    start = endValue;
                    clearInterval(state.ui.counterTimers[id]);
                    delete state.ui.counterTimers[id];
                }
                element.textContent = Math.round(start);
            }, CONFIG.ANIMATION_DURATION / CONFIG.ANIMATION_FRAMES);
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
    // 7. CHART COMPONENT
    // ==================================================
    const DashboardChart = {
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
                        backgroundColor: [CONFIG.CHART_COLORS.ac.normal, CONFIG.CHART_COLORS.listrik.normal, CONFIG.CHART_COLORS.gedung.normal],
                        hoverBackgroundColor: [CONFIG.CHART_COLORS.ac.hover, CONFIG.CHART_COLORS.listrik.hover, CONFIG.CHART_COLORS.gedung.hover],
                        hoverOffset: 8,
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: "72%",
                    animation: { animateRotate: true, animateScale: true, duration: 1200, easing: "easeOutQuart" },
                    plugins: {
                        legend: { position: "bottom", labels: { usePointStyle: true, pointStyle: "circle", padding: 20 } }
                    }
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
                        label: "Total Report",
                        data: [...state.monthly],
                        borderColor: CONFIG.CHART_COLORS.line,
                        backgroundColor: gradient,
                        borderWidth: 3,
                        fill: true,
                        tension: 0.45,
                        pointRadius: 4,
                        pointHoverRadius: 8,
                        pointHitRadius: 15,
                        pointBorderWidth: 2,
                        pointBackgroundColor: CONFIG.CHART_COLORS.line,
                        pointBorderColor: "#FFFFFF",
                        pointHoverBackgroundColor: "#FFFFFF",
                        pointHoverBorderColor: CONFIG.CHART_COLORS.line
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
                            callbacks: { label: (context) => "Total Report : " + context.parsed.y }
                        }
                    },
                    scales: {
                        x: { grid: { display: false, drawBorder: false }, ticks: { color: "#64748B", font: { size: 12 } } },
                        y: {
                            beginAtZero: true,
                            suggestedMax: Math.max(...state.monthly, 5) + 5,
                            ticks: { precision: 0, stepSize: 5, color: "#64748B", font: { size: 12 } },
                            grid: { color: "rgba(148,163,184,0.10)", drawBorder: false }
                        }
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
    // 8. ACTIVITY COMPONENT
    // ==================================================
    const DashboardActivity = {
        escapeHtml(value) {
            const div = document.createElement("div");
            div.textContent = value ?? "";
            return div.innerHTML;
        },

        render() {
            if (!DOM.activity) return;

            if (state.activity.length === 0) {
                DOM.activity.innerHTML = `
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

            DOM.activity.innerHTML = state.activity.map(item => {
                const status = item.status || "OPEN";
                const config = STATUS_CONFIG[status] || STATUS_CONFIG.OPEN;

                return `
                    <div class="activity-item">
                        <div class="activity-icon ${config.color}">
                            <i class="bi ${config.icon}"></i>
                        </div>
                        <div class="activity-content">
                            <strong>${this.escapeHtml(item.kategori || "-")}</strong>
                            <small>${this.escapeHtml(item.lokasi || "-")}</small>
                        </div>
                        <span>${this.escapeHtml(item.waktu || "-")}</span>
                    </div>`;
            }).join("");
        }
    };

    // ==================================================
    // 9. FOOTER COMPONENT
    // ==================================================
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

    // ==================================================
    // 10. RENDER PIPELINE
    // ==================================================
    const Render = {
        animateCards() {
            if (typeof BCS !== "undefined" && BCS.Animation && typeof BCS.Animation.fadeUp === "function") {
                BCS.Animation.fadeUp(DOM.cards);
            } else {
                DOM.cards.forEach((card, index) => {
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
        },

        all() {
            const tStart = performance.now();
            DashboardSummary.render();
            DashboardChart.render();
            DashboardActivity.render();
            DashboardFooter.render();
            
            // Rekomendasi 4: Log Render Metrics
            state.metrics.renderTime = performance.now() - tStart;
            BCS.Logger.performance(MODULE_NAME, `UI Rendered in ${state.metrics.renderTime.toFixed(2)}ms`, tStart);
        }
    };

    // ==================================================
    // CORE PIPELINES (Rekomendasi 3 & 4: Cached and Monitored Pipelines)
    // ==================================================
    async function loadSummary(forceRefresh = false) {
        const now = Date.now();
        
        // Rekomendasi 3: Cek validitas Cache (< 10 detik) jika bukan paksaan sistem event stream
        if (!forceRefresh && state.cache.summaryPayload && (now - state.cache.timestamp < CONFIG.CACHE_TTL)) {
            console.log(`[${MODULE_NAME}] Serving Summary Data from Client Cache.`);
            processDashboardPayload(state.cache.summaryPayload);
            return true;
        }

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
            
            // Rekomendasi 4: Simpan statistik API Time
            state.metrics.apiTime = performance.now() - t0;
            BCS.Logger.performance(MODULE_NAME, "Load Summary API Fetch", t0);

            if (!result || result.success !== true) {
                BCS.App.toast(result?.message || "Dashboard gagal dimuat.", "error");
                return false;
            }

            // Simpan ke Cache
            state.cache.summaryPayload = result;
            state.cache.timestamp = now;

            processDashboardPayload(result);
            return true;
        } catch (err) {
            BCS.Error.handle(err);
            return false;
        } finally {
            BCS.App.Loading.hide();
        }
    }

    async function loadSLAAnalytics(forceRefresh = false) {
        const now = Date.now();
        
        // Rekomendasi 3: Implementasi Cache untuk SLA Analytics
        if (!forceRefresh && state.cache.slaPayload && (now - state.cache.timestamp < CONFIG.CACHE_TTL)) {
            console.log(`[${MODULE_NAME}] Serving SLA Analytics from Client Cache.`);
            processSLAPayload(state.cache.slaPayload);
            return;
        }

        try {
            const response = await BCS.Services.Dashboard.fetchSLAAnalytics();
            if (response && response.success) {
                state.cache.slaPayload = response;
            }
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

    // Centered Entrance Guard
    async function refresh(forceRefresh = false) {
        if (state.ui.isRefreshing) return false; 
        state.ui.isRefreshing = true;

        // Rekomendasi 4: Increment Refresh Count Metric
        state.metrics.refreshCount++;

        BCS.Logger.performance(MODULE_NAME, `Refresh Pipeline Initiated (Run #${state.metrics.refreshCount})`, performance.now());
        try {
            const summaryLoaded = await loadSummary(forceRefresh);
            if (!summaryLoaded) return false;

            await loadSLAAnalytics(forceRefresh);

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
    // 11. EVENTS & ADAPTIVE POLLING SYSTEM
    // ==================================================
    function startAutoRefresh(customMs = null) {
        stopAutoRefresh();
        
        const currentInterval = customMs || (document.hidden ? CONFIG.POLLING_HIDDEN : CONFIG.POLLING_ACTIVE);

        state.ui.refreshInterval = setInterval(async () => {
            try {
                // Polling otomatis tidak memaksa bypass cache, biarkan mekanisme TTL berjalan
                await refresh(false);
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
                // User menekan tombol secara manual -> Paksa bypass cache (forceRefresh = true)
                await refresh(true);
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
                startAutoRefresh(CONFIG.POLLING_HIDDEN);
                return;
            }
            // Tab kembali aktif: Instant refresh (Bypass cache untuk menjamin data paling aktual setelah ditinggal)
            await refresh(true);
            startAutoRefresh(CONFIG.POLLING_ACTIVE);
        });

        window.addEventListener("beforeunload", () => destroy());

        if (typeof BCS !== "undefined" && BCS.Events) {
            const unsubCreated = BCS.Events.on("report:created", async () => {
                BCS.Logger.performance(MODULE_NAME, "Event: report:created -> Realtime Force Refresh Triggered", performance.now());
                await refresh(true);
            });
            if (typeof unsubCreated === "function") state.ui.eventUnsubscribers.push(unsubCreated);

            const unsubUpdated = BCS.Events.on("report:updated", async () => {
                BCS.Logger.performance(MODULE_NAME, "Event: report:updated -> Realtime Force Refresh Triggered", performance.now());
                await refresh(true);
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

            // Inisialisasi awal selalu paksa ambil data dari server
            const summaryLoaded = await loadSummary(true);
            if (!summaryLoaded) throw new Error("Dashboard data gagal dimuat.");

            await loadSLAAnalytics(true);

            Render.animateCards();
            Render.all();

            startClock();
            bindEvents();
            startAutoRefresh();

            state.ui.initialized = true;
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
    // 13. DESTROY (Rekomendasi 5: Reset State Complete)
    // ==================================================
    function destroy() {
        stopAutoRefresh();
        stopClock();
        
        while (state.ui.eventUnsubscribers.length > 0) {
            const unsubscribe = state.ui.eventUnsubscribers.pop();
            if (typeof unsubscribe === "function") {
                unsubscribe();
            }
        }

        Object.keys(state.ui.counterTimers).forEach(id => {
            clearInterval(state.ui.counterTimers[id]);
        });

        if (state.charts.donut instanceof Chart) state.charts.donut.destroy();
        if (state.charts.line instanceof Chart) state.charts.line.destroy();
        
        // Rekomendasi 5: Reset State ke kondisi factory default awal secara bersih
        state = createInitialState();
        
        console.log(`[${MODULE_NAME}] Destroy pipeline executed clean. State returned to baseline definition.`);
    }

    // Dom Ready Runner
    document.addEventListener("DOMContentLoaded", async () => {
        await init();
    });
})();
