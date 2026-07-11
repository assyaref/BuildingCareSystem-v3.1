/**
 * =====================================================
 * Building Care System Enterprise
 * Electricity Module
 * Version 1.1 (kompatibel dengan mapping API)
 * =====================================================
 */

const ElectricityController = {
    chartMonthly: null,
    chartEntity: null,
    chartDetail: null,
    refreshTimer: null,

    state: {
        dashboard: null,
        records: [],
        benchmark: [],
        alerts: [],
        topConsumer: [],
        trend: [],
        filter: {
            keyword: "",
            status: "ALL",
            page: 1,
            pageSize: 10
        }
    },

    init() {
        this.registerEvent();
        this.loadDashboard();
        this.startAutoRefresh();
    },

    // ==========================================================
    // LOADING / ERROR / NOTIFICATION
    // ==========================================================

    showLoading(show) {
        const el = document.getElementById("loadingOverlay");
        if (!el) return;
        el.classList.toggle("d-none", !show);
    },

    showError(message) {
        this.showToast(message, "error");
    },

    showToast(message, type = "info") {
        if (window.BCS && BCS.UI && typeof BCS.UI.toast === "function") {
            BCS.UI.toast(message, type);
            return;
        }
        console.log(type.toUpperCase(), message);
    },

    // ==========================================================
    // AUTO REFRESH
    // ==========================================================

    startAutoRefresh() {
        if (this.refreshTimer) clearInterval(this.refreshTimer);
        this.refreshTimer = setInterval(() => {
            this.loadDashboard(false);
        }, 300000); // 5 menit
    },

    // ==========================================================
    // LOAD DASHBOARD
    // ==========================================================

    async loadDashboard(forceRefresh = false) {
        try {
            this.showLoading(true);
            let response;
            if (forceRefresh) {
                response = await BCS.Api.refreshElectricityCache();
                if (response.success) {
                    response = await BCS.Api.getElectricityDashboard();
                } else {
                    this.showError(response.message || "Gagal refresh cache.");
                    return;
                }
            } else {
                response = await BCS.Api.getElectricityDashboard();
            }

            if (!response.success) {
                this.showError(response.message || "Gagal memuat dashboard.");
                return;
            }

            const data = response.data || {};
            this.state.dashboard = data;
            this.state.records = data.records ?? [];
            this.state.benchmark = data.benchmark ?? [];
            this.state.alerts = data.alerts ?? [];
            this.state.topConsumer = data.topConsumer ?? [];
            this.state.trend = data.trend ?? [];

            this.render();
        } catch (err) {
            console.error(err);
            this.showError(err.message);
        } finally {
            this.showLoading(false);
        }
    },

    // ==========================================================
    // RENDER
    // ==========================================================

    render() {
        this.renderSummary();
        this.renderMonthlyChart();
        this.renderTrend();
        this.renderEntityChart();
        this.renderBenchmark();
        this.renderTopConsumer();
        this.renderAlert();
        this.renderTable();
        this.updateLastUpdate();
    },

    updateLastUpdate() {
        const el = document.getElementById("lblLastUpdate");
        if (!el) return;
        el.textContent = new Date().toLocaleString("id-ID");
    },

    // ==========================================================
    // SUMMARY
    // ==========================================================

    renderSummary() {
        const data = this.state.dashboard || {};

        this.setText("totalKwh", this.formatNumber(data.totalKwh || 0));
        this.setText("totalNominal", this.formatCurrency(data.totalNominal || 0));
        this.setText("totalMeter", this.formatNumber(data.totalMeter || 0));
        this.setText("avgKwh", this.formatNumber(data.averageKwh || 0));

        this.renderQuickInformation(data);
    },

    renderQuickInformation(data) {
        this.setText("highestMonth", data.highestMonth || "-");
        this.setText("lowestMonth", data.lowestMonth || "-");
        this.setText("avgMonth", this.formatNumber(data.averageMonth || 0) + " kWh");
        this.setText("lblEfficiency", (data.efficiency || 0) + "%");
        this.setText("lblGrowth", (data.growth || 0) + "%");
        this.setText("lblHighestEntity", data.highestEntity || "-");
        this.setText("lblLowestEntity", data.lowestEntity || "-");
    },

    // ==========================================================
    // HELPER
    // ==========================================================

    setText(id, value) {
        const el = document.getElementById(id);
        if (!el) return;
        el.textContent = value;
    },

    formatNumber(value) {
        return Number(value || 0).toLocaleString("id-ID");
    },

    formatCurrency(value) {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0
        }).format(value || 0);
    },

    getStatusBadge(status) {
        switch (status) {
            case "NORMAL": return "badge-normal";
            case "MAINTENANCE": return "badge-warning";
            case "NEGATIVE": return "badge-danger";
            case "GANTI_METER": return "badge-danger";
            case "NO_READING": return "badge-info";
            default: return "badge-info";
        }
    },

    // ==========================================================
    // MONTHLY CHART
    // ==========================================================

    renderMonthlyChart() {
        const canvas = document.getElementById("monthlyChart");
        if (!canvas) return;

        if (this.chartMonthly) {
            this.chartMonthly.destroy();
        }

        const monthly = this.state.dashboard.monthly || [];
        const labels = monthly.map(item => item.month);
        const values = monthly.map(item => item.value);

        this.chartMonthly = new Chart(canvas, {
            type: "bar",
            data: {
                labels,
                datasets: [{
                    label: "Pemakaian (kWh)",
                    data: values,
                    borderRadius: 8,
                    borderWidth: 0,
                    backgroundColor: "#1565C0"
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 600
                },
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    },

    // ==========================================================
    // ENTITY CHART
    // ==========================================================

    renderEntityChart() {
        const canvas = document.getElementById("entityChart");
        if (!canvas) return;

        if (this.chartEntity) {
            this.chartEntity.destroy();
        }

        const entity = this.state.dashboard.entity || [];

        this.chartEntity = new Chart(canvas, {
            type: "doughnut",
            data: {
                labels: entity.map(item => item.entitas),
                datasets: [{
                    data: entity.map(item => item.totalKwh),
                    backgroundColor: [
                        "#1565C0", "#2E7D32", "#F9A825",
                        "#D32F2F", "#0288D1", "#8E24AA", "#546E7A"
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                cutout: "65%",
                animation: {
                    animateRotate: true
                },
                plugins: {
                    legend: {
                        position: "bottom"
                    }
                }
            }
        });
    },

    // ==========================================================
    // TREND
    // ==========================================================

    renderTrend() {
        const container = document.getElementById("trendContainer");
        if (!container) return;

        container.innerHTML = "";
        const trends = this.state.trend || [];

        if (!trends.length) {
            container.innerHTML = `
                <div class="text-center text-muted py-4">
                    Tidak ada data trend.
                </div>
            `;
            return;
        }

        trends.forEach(item => {
            let cls = "trend-flat";
            let icon = "bi-dash-circle";

            if (item.trendType === "UP") {
                cls = "trend-up";
                icon = "bi-arrow-up-circle-fill";
            } else if (item.trendType === "DOWN") {
                cls = "trend-down";
                icon = "bi-arrow-down-circle-fill";
            }

            container.insertAdjacentHTML("beforeend", `
                <div class="trend-item fade-up">
                    <div>
                        <div class="trend-title">${item.month}</div>
                        <small class="text-muted">${item.value} kWh</small>
                    </div>
                    <div class="${cls}">
                        <i class="bi ${icon}"></i>
                        ${item.change > 0 ? '+' : ''}${item.change} (${item.percentChange}%)
                    </div>
                </div>
            `);
        });
    },

    // ==========================================================
    // BENCHMARK
    // ==========================================================

    renderBenchmark() {
        const tbody = document.querySelector("#tblBenchmark tbody");
        if (!tbody) return;

        tbody.innerHTML = "";
        const rows = this.state.benchmark || [];

        if (!rows.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="table-empty">
                        Tidak ada data benchmark.
                    </td>
                </tr>
            `;
            return;
        }

        rows.forEach(item => {
            tbody.insertAdjacentHTML("beforeend", `
                <tr>
                    <td><strong>${item.entitas}</strong></td>
                    <td class="text-end">${this.formatNumber(item.totalKwh)}</td>
                    <td class="text-end">${item.totalMeter}</td>
                    <td class="text-end">${this.formatNumber(item.avgPerMeter)}</td>
                    <td>
                        <div class="benchmark-bar">
                            <div class="benchmark-fill" style="width:${item.benchmark}%"></div>
                        </div>
                    </td>
                </tr>
            `);
        });
    },

    // ==========================================================
    // TOP CONSUMER
    // ==========================================================

    renderTopConsumer() {
        const container = document.getElementById("topConsumerContainer");
        if (!container) return;

        container.innerHTML = "";
        const list = this.state.topConsumer || [];

        this.setText("topConsumerCount", list.length);

        if (!list.length) {
            container.innerHTML = `
                <div class="text-center text-muted py-5">
                    Tidak ada data.
                </div>
            `;
            return;
        }

        list.forEach((item, index) => {
            container.insertAdjacentHTML("beforeend", `
                <div class="consumer-card fade-up">
                    <div class="consumer-rank">${index + 1}</div>
                    <div class="consumer-info">
                        <div class="consumer-name">${item.entitas}</div>
                        <div class="consumer-meter">Meter : ${item.id}</div>
                    </div>
                    <div class="consumer-value">
                        <div class="consumer-kwh">${this.formatNumber(item.totalKwh)}</div>
                        <div class="consumer-cost">${this.formatCurrency(item.totalNominal)}</div>
                    </div>
                </div>
            `);
        });
    },

    // ==========================================================
    // ALERT
    // ==========================================================

    renderAlert() {
        const container = document.getElementById("alertContainer");
        if (!container) return;

        container.innerHTML = "";
        const alerts = this.state.alerts || [];

        this.setText("alertCount", alerts.length + " Alert");

        if (!alerts.length) {
            container.innerHTML = `
                <div class="text-center text-success py-4">
                    <i class="bi bi-check-circle-fill"></i>
                    Tidak ada alert.
                </div>
            `;
            return;
        }

        alerts.forEach(item => {
            const title = item.idPelanggan || item.id || 'Meter';
            const desc = `${item.entitas || ''} - ${item.keterangan || item.status || ''}`;
            container.insertAdjacentHTML("beforeend", `
                <div class="alert-card fade-up">
                    <div class="alert-icon">
                        <i class="bi bi-exclamation-triangle-fill"></i>
                    </div>
                    <div class="flex-grow-1">
                        <div class="alert-title">${title}</div>
                        <div class="alert-description">${desc}</div>
                        <div class="alert-time">${item.bulan || ''}</div>
                    </div>
                </div>
            `);
        });
    },

    // ==========================================================
    // TABLE
    // ==========================================================

    renderTable() {
        const tbody = document.querySelector("#tblElectricity tbody");
        if (!tbody) return;

        tbody.innerHTML = "";
        let rows = [...this.state.records];

        const keyword = this.state.filter.keyword.toLowerCase();
        const status = this.state.filter.status;

        if (keyword) {
            rows = rows.filter(r => {
                return (
                    String(r.entitas).toLowerCase().includes(keyword) ||
                    String(r.idPelanggan).toLowerCase().includes(keyword)
                );
            });
        }

        if (status !== "ALL") {
            rows = rows.filter(r => r.status === status);
        }

        const totalRows = rows.length;
        const totalPage = Math.max(1, Math.ceil(totalRows / this.state.filter.pageSize));
        if (this.state.filter.page > totalPage) {
            this.state.filter.page = totalPage;
        }

        const start = (this.state.filter.page - 1) * this.state.filter.pageSize;
        const end = Math.min(start + this.state.filter.pageSize, totalRows);
        const pageRows = rows.slice(start, end);

        if (!pageRows.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="table-empty">
                        Tidak ada data.
                    </td>
                </tr>
            `;
            this.setText("tableInfo", "Menampilkan 0 data");
            this.renderPagination(0);
            return;
        }

        pageRows.forEach(item => {
            const badgeClass = this.getStatusBadge(item.status);
            tbody.insertAdjacentHTML("beforeend", `
                <tr>
                    <td>${item.bulan}</td>
                    <td>${item.entitas}</td>
                    <td>${item.idPelanggan}</td>
                    <td class="text-end">${this.formatNumber(item.awal)}</td>
                    <td class="text-end">${this.formatNumber(item.akhir)}</td>
                    <td class="text-end">${this.formatNumber(item.pemakaian)}</td>
                    <td class="text-end">${this.formatCurrency(item.nominal)}</td>
                    <td>
                        <span class="badge ${badgeClass}">${item.status}</span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-primary btn-detail" data-id="${item.idPelanggan}">
                            Detail
                        </button>
                    </td>
                </tr>
            `);
        });

        this.setText(
            "tableInfo",
            `Menampilkan ${pageRows.length} dari ${totalRows} data`
        );
        this.renderPagination(totalRows);
        this.bindDetailButton();
    },

    // ==========================================================
    // PAGINATION
    // ==========================================================

    renderPagination(total) {
        const ul = document.getElementById("pagination");
        if (!ul) return;

        ul.innerHTML = "";

        const pageSize = this.state.filter.pageSize;
        const totalPage = Math.ceil(total / pageSize);

        for (let i = 1; i <= totalPage; i++) {
            ul.insertAdjacentHTML("beforeend", `
                <li class="page-item ${i === this.state.filter.page ? "active" : ""}">
                    <a class="page-link" href="#" data-page="${i}">
                        ${i}
                    </a>
                </li>
            `);
        }

        ul.querySelectorAll(".page-link").forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                this.state.filter.page = Number(btn.dataset.page);
                this.renderTable();
            };
        });
    },

    bindDetailButton() {
        document.querySelectorAll(".btn-detail").forEach(btn => {
            btn.onclick = () => {
                this.showDetail(btn.dataset.id);
            };
        });
    },

    // ==========================================================
    // DETAIL
    // ==========================================================

    async showDetail(id) {
        try {
            this.showLoading(true);
            const response = await BCS.Api.getElectricityDetail(id);

            if (!response.success) {
                this.showToast(
                    response.message || "Data tidak ditemukan.",
                    "error"
                );
                return;
            }

            const data = response.data || {};

            this.setText("detailMeterId", data.id || "-");
            this.setText("detailEntity", data.entity || "-");
            this.setText("detailTotalKwh", this.formatNumber(data.totalKwh || 0));
            this.setText("detailTotalNominal", this.formatCurrency(data.totalNominal || 0));

            this.renderDetailChart(data.history || []);
            this.renderDetailTable(data.history || []);

            const modal = bootstrap.Modal.getOrCreateInstance(
                document.getElementById("meterDetailModal")
            );
            modal.show();

        } catch (err) {
            console.error(err);
            this.showToast(err.message, "error");
        } finally {
            this.showLoading(false);
        }
    },

    // ==========================================================
    // DETAIL CHART
    // ==========================================================

    renderDetailChart(history) {
        const canvas = document.getElementById("detailChart");
        if (!canvas) return;

        if (this.chartDetail) {
            this.chartDetail.destroy();
        }

        this.chartDetail = new Chart(canvas, {
            type: "line",
            data: {
                labels: history.map(x => x.month),
                datasets: [{
                    label: "kWh",
                    data: history.map(x => x.kwh),
                    borderColor: "#1565C0",
                    backgroundColor: "rgba(21,101,192,.15)",
                    fill: true,
                    tension: .35
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    },

    // ==========================================================
    // DETAIL TABLE
    // ==========================================================

    renderDetailTable(history) {
        const tbody = document.getElementById("detailTable");
        if (!tbody) return;

        tbody.innerHTML = "";

        if (!history || !history.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">
                        Tidak ada histori.
                    </td>
                </tr>
            `;
            return;
        }

        history.forEach(item => {
            tbody.insertAdjacentHTML("beforeend", `
                <tr>
                    <td>${item.month}</td>
                    <td>${this.formatNumber(item.awal)}</td>
                    <td>${this.formatNumber(item.akhir)}</td>
                    <td>${this.formatNumber(item.kwh)}</td>
                    <td>${this.formatCurrency(item.nominal)}</td>
                    <td>${item.status}</td>
                </tr>
            `);
        });
    },

    // ==========================================================
    // EVENT
    // ==========================================================

    registerEvent() {
        document.getElementById("btnRefresh")?.addEventListener("click", () => {
            this.loadDashboard(true);
        });

        document.getElementById("btnSearch")?.addEventListener("click", () => {
            this.state.filter.keyword = document.getElementById("txtSearch").value.trim();
            this.state.filter.page = 1;
            this.renderTable();
        });

        document.getElementById("txtSearch")?.addEventListener("keydown", e => {
            if (e.key === "Enter") {
                document.getElementById("btnSearch").click();
            }
        });

        document.getElementById("cmbStatus")?.addEventListener("change", e => {
            this.state.filter.status = e.target.value;
            this.state.filter.page = 1;
            this.renderTable();
        });

        document.getElementById("btnReset")?.addEventListener("click", () => {
            document.getElementById("txtSearch").value = "";
            document.getElementById("cmbStatus").value = "ALL";

            this.state.filter = {
                keyword: "",
                status: "ALL",
                page: 1,
                pageSize: 10
            };

            this.renderTable();
        });
    },

    // ==========================================================
    // DESTROY
    // ==========================================================

    destroyCharts() {
        if (this.chartMonthly) {
            this.chartMonthly.destroy();
            this.chartMonthly = null;
        }
        if (this.chartEntity) {
            this.chartEntity.destroy();
            this.chartEntity = null;
        }
        if (this.chartDetail) {
            this.chartDetail.destroy();
            this.chartDetail = null;
        }
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
    }
};

window.addEventListener("beforeunload", () => {
    ElectricityController.destroyCharts();
});

document.addEventListener("DOMContentLoaded", () => {
    if (window.Session && typeof Session.isLoggedIn === 'function' && !Session.isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }
    ElectricityController.init();
});
