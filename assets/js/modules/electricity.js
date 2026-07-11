/**
 * =====================================================
 * Building Care System Enterprise
 * Electricity Module
 * Version 1.3 (dengan ChartDataLabels & format angka)
 * =====================================================
 */

// Referensi ke plugin ChartDataLabels (di-load dari CDN)
const ChartDataLabels = window.ChartDataLabels || {
    id: 'datalabels',
    // fallback jika plugin tidak tersedia
};

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
        // Inisialisasi pageSize dari dropdown
        const pageSizeEl = document.getElementById('cmbPageSize');
        if (pageSizeEl) {
            this.state.filter.pageSize = parseInt(pageSizeEl.value, 10) || 10;
        }
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
    // LOAD DASHBOARD (Dashboard + List terpisah)
    // ==========================================================

    async loadDashboard(forceRefresh = false) {
        try {
            this.showLoading(true);

            if (forceRefresh) {
                const refreshRes = await BCS.Api.refreshElectricityCache();
                if (!refreshRes.success) {
                    this.showError(refreshRes.message || "Gagal refresh cache.");
                    return;
                }
            }

            const dashboardRes = await BCS.Api.getElectricityDashboard();
            if (!dashboardRes.success) {
                this.showError(dashboardRes.message || "Gagal memuat dashboard.");
                return;
            }

            const listRes = await BCS.Api.getElectricityList();

            const data = dashboardRes.data || {};
            this.state.dashboard = data;
            this.state.records = listRes.success ? listRes.data : [];
            this.state.benchmark = data.benchmark ?? [];
            this.state.alerts = data.alerts ?? [];
            this.state.topConsumer = data.topConsumer ?? [];
            this.state.trend = data.trend ?? [];

            this.render();

            if (!listRes.success) {
                console.warn('[Electricity] List data gagal dimuat:', listRes.message);
            }

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
        this.renderStatusSummary();
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

        this.setText("totalKwh", this.formatNumber(data.totalKwh, 2));
        this.setText("totalNominal", this.formatCurrency(data.totalNominal));
        this.setText("totalMeter", this.formatNumber(data.totalMeter, 0));
        this.setText("avgKwh", this.formatNumber(data.averageKwh, 2));

        this.renderQuickInformation(data);
    },

    renderQuickInformation(data) {
        // Quick info cards
        this.setText("growthInfo", data.growth ? data.growth.toFixed(1) + '%' : '-');
        this.setText("alertSummary", data.alerts ? data.alerts.length + ' alert' : 'Tidak ada alert');

        // Summary trend badges
        const growth = data.growth || 0;
        const trendEl = document.getElementById("totalTrend");
        if (trendEl) {
            const icon = growth >= 0 ? 'bi-arrow-up-short' : 'bi-arrow-down-short';
            const cls = growth >= 0 ? 'trend-up' : 'trend-down';
            trendEl.className = `badge-trend ${cls}`;
            trendEl.innerHTML = `<i class="bi ${icon}"></i> ${growth.toFixed(1)}%`;
        }

        const nominalTrend = document.getElementById("nominalTrend");
        if (nominalTrend) {
            const icon = growth >= 0 ? 'bi-arrow-up-short' : 'bi-arrow-down-short';
            const cls = growth >= 0 ? 'trend-up' : 'trend-down';
            nominalTrend.className = `badge-trend ${cls}`;
            nominalTrend.innerHTML = `<i class="bi ${icon}"></i> ${growth.toFixed(1)}%`;
        }

        // Avg month label
        const avgLabel = document.getElementById("avgMonthLabel");
        if (avgLabel) {
            const latestMonth = data.highestMonth || '-';
            avgLabel.textContent = latestMonth !== '-' ? latestMonth : '-';
        }
    },

    // ==========================================================
    // HELPER
    // ==========================================================

    setText(id, value) {
        const el = document.getElementById(id);
        if (!el) return;
        el.textContent = value;
    },

    formatNumber(value, decimals = 2) {
        const num = Number(value || 0);
        return num.toLocaleString('id-ID', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    },

    formatCurrency(value) {
        const num = Number(value || 0);
        return 'Rp ' + num.toLocaleString('id-ID', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
    },

    formatPercent(value) {
        const num = Number(value || 0);
        return num.toFixed(1) + '%';
    },

    getStatusBadge(status) {
        const map = {
            'NORMAL': 'badge-normal',
            'MAINTENANCE': 'badge-warning',
            'NEGATIVE': 'badge-danger',
            'GANTI_METER': 'badge-danger',
            'NO_READING': 'badge-info',
            'ALERT': 'badge-danger'
        };
        return map[status] || 'badge-secondary';
    },

    // ==========================================================
    // MONTHLY CHART (dengan angka di atas batang)
    // ==========================================================

    renderMonthlyChart() {
        const canvas = document.getElementById('monthlyChart');
        if (!canvas) return;

        if (this.chartMonthly) {
            this.chartMonthly.destroy();
        }

        const monthly = this.state.dashboard.monthly || [];
        const labels = monthly.map(item => item.month);
        const values = monthly.map(item => item.value);

        this.chartMonthly = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Pemakaian (kWh)',
                    data: values,
                    backgroundColor: '#1565C0',
                    borderRadius: 4,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    datalabels: {
                        anchor: 'end',
                        align: 'end',
                        color: '#1a1a1a',
                        font: { weight: 'bold', size: 10 },
                        formatter: (value) => {
                            return value > 0 ? this.formatNumber(value, 0) : '';
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => this.formatNumber(value, 0),
                            font: { size: 10 }
                        }
                    },
                    x: {
                        ticks: {
                            font: { size: 10 }
                        }
                    }
                }
            },
            plugins: [ChartDataLabels]
        });
    },

    // ==========================================================
    // ENTITY CHART (donut dengan persentase + legend nilai)
    // ==========================================================

    renderEntityChart() {
        const canvas = document.getElementById('entityChart');
        if (!canvas) return;

        if (this.chartEntity) {
            this.chartEntity.destroy();
        }

        const entity = this.state.dashboard.entity || [];
        const total = entity.reduce((sum, item) => sum + item.totalKwh, 0);
        const colors = ['#1565C0', '#2E7D32', '#F9A825', '#D32F2F', '#0288D1', '#8E24AA', '#546E7A'];

        this.chartEntity = new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: entity.map(item => item.entitas),
                datasets: [{
                    data: entity.map(item => item.totalKwh),
                    backgroundColor: colors.slice(0, entity.length),
                    borderWidth: 0,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                    legend: { display: false },
                    datalabels: {
                        color: '#fff',
                        font: { weight: 'bold', size: 11 },
                        formatter: (value, ctx) => {
                            const percentage = total > 0 ? ((value / total) * 100) : 0;
                            return percentage > 5 ? `${percentage.toFixed(1)}%` : '';
                        },
                        anchor: 'center',
                        align: 'center',
                    }
                }
            },
            plugins: [ChartDataLabels]
        });

        // Legend dengan nilai kWh
        const legendContainer = document.getElementById('entityLegend');
        if (legendContainer) {
            legendContainer.innerHTML = entity.map((item, idx) => {
                const percentage = total > 0 ? ((item.totalKwh / total) * 100) : 0;
                return `
                    <div class="d-flex align-items-center gap-2 py-1 border-bottom border-light">
                        <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${colors[idx % colors.length]};"></span>
                        <span class="fw-medium">${item.entitas}</span>
                        <span class="ms-auto fw-bold">${this.formatNumber(item.totalKwh, 0)} kWh</span>
                        <span class="text-muted" style="font-size:0.7rem;">(${percentage.toFixed(1)}%)</span>
                    </div>
                `;
            }).join('');
        }
    },

    // ==========================================================
    // STATUS SUMMARY (Ringkasan Status)
    // ==========================================================

    renderStatusSummary() {
        // Ini akan diisi dari data status yang diambil dari alert/statistics
        // Untuk sementara kita gunakan data dari state.alerts
        const alerts = this.state.alerts || [];
        const stats = {
            NORMAL: 0,
            MAINTENANCE: 0,
            GANTI_METER: 0,
            NEGATIVE: 0,
            ALERT: 0
        };

        // Jika ada data records, hitung status dari records
        const records = this.state.records || [];
        records.forEach(r => {
            const status = r.status || 'NORMAL';
            if (stats[status] !== undefined) stats[status]++;
            else stats[status] = 1;
        });

        // Update elemen status di HTML
        const statusItems = document.querySelectorAll('.status-list-item');
        if (statusItems.length >= 4) {
            // Normal
            const normalCount = statusItems[0]?.querySelector('.count');
            if (normalCount) normalCount.textContent = `${stats.NORMAL || 0} Meter →`;

            // Maintenance
            const maintenanceCount = statusItems[1]?.querySelector('.count');
            if (maintenanceCount) maintenanceCount.textContent = `${stats.MAINTENANCE || 0} Meter →`;

            // Ganti Meter
            const gantiCount = statusItems[2]?.querySelector('.count');
            if (gantiCount) gantiCount.textContent = `${stats.GANTI_METER || 0} Meter →`;

            // Negatif
            const negatifCount = statusItems[3]?.querySelector('.count');
            if (negatifCount) negatifCount.textContent = `${stats.NEGATIVE || 0} Meter →`;
        }
    },

    // ==========================================================
    // TREND (tidak digunakan di UI baru, tapi tetap ada untuk kompatibilitas)
    // ==========================================================

    renderTrend() {
        // Trend sudah digabung ke quick info
        // Fungsi ini dibiarkan kosong agar tidak error
    },

    // ==========================================================
    // BENCHMARK (tidak digunakan di UI baru)
    // ==========================================================

    renderBenchmark() {
        // Tidak digunakan di UI baru
    },

    // ==========================================================
    // TOP CONSUMER (diganti entity chart)
    // ==========================================================

    renderTopConsumer() {
        // Tidak digunakan di UI baru
    },

    // ==========================================================
    // ALERT (digabung ke quick info)
    // ==========================================================

    renderAlert() {
        // Tidak digunakan di UI baru
    },

    // ==========================================================
    // TABLE (menggunakan state.records)
    // ==========================================================

    renderTable() {
        const tbody = document.querySelector("#tblElectricity tbody");
        if (!tbody) return;

        tbody.innerHTML = "";
        let rows = [...this.state.records];

        const keyword = this.state.filter.keyword.toLowerCase().trim();
        const status = this.state.filter.status;

        if (keyword) {
            rows = rows.filter(r => {
                const entitas = String(r.entitas || '').toLowerCase();
                const id = String(r.idPelanggan || '').toLowerCase();
                return entitas.includes(keyword) || id.includes(keyword);
            });
        }

        if (status !== "ALL") {
            rows = rows.filter(r => r.status === status);
        }

        const totalRows = rows.length;
        const pageSize = this.state.filter.pageSize;
        const totalPage = Math.max(1, Math.ceil(totalRows / pageSize));
        if (this.state.filter.page > totalPage) {
            this.state.filter.page = totalPage;
        }

        const start = (this.state.filter.page - 1) * pageSize;
        const end = Math.min(start + pageSize, totalRows);
        const pageRows = rows.slice(start, end);

        if (!pageRows.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" class="text-center text-muted py-4">
                        Tidak ada data
                    </td>
                </tr>
            `;
            this.setText("tableInfo", "Menampilkan 0 data");
            this.renderPagination(0);
            return;
        }

        pageRows.forEach((item, idx) => {
            const badgeClass = this.getStatusBadge(item.status);
            const isNegative = item.pemakaian < 0;
            tbody.insertAdjacentHTML("beforeend", `
                <tr>
                    <td class="text-start ps-4">${start + idx + 1}</td>
                    <td class="text-start">${item.bulan || '-'}</td>
                    <td class="text-start"><code>${item.idPelanggan || '-'}</code></td>
                    <td class="text-start">${item.entitas || '-'}</td>
                    <td class="text-end">${this.formatNumber(item.awal, 2)}</td>
                    <td class="text-end">${this.formatNumber(item.akhir, 2)}</td>
                    <td class="text-end ${isNegative ? 'text-danger fw-bold' : ''}">${this.formatNumber(item.pemakaian, 2)}</td>
                    <td class="text-end ${item.nominal < 0 ? 'text-danger' : ''}">${this.formatCurrency(item.nominal)}</td>
                    <td>${item.keterangan || '-'}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary btn-detail" data-id="${item.idPelanggan}" title="Detail">
                            <i class="bi bi-eye"></i>
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

        if (totalPage <= 1) {
            ul.innerHTML = `<li class="page-item disabled"><span class="page-link">1</span></li>`;
            return;
        }

        // Previous
        ul.insertAdjacentHTML("beforeend", `
            <li class="page-item ${this.state.filter.page === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${this.state.filter.page - 1}">&laquo;</a>
            </li>
        `);

        // Page numbers
        const maxVisible = 5;
        let startPage = Math.max(1, this.state.filter.page - Math.floor(maxVisible / 2));
        let endPage = Math.min(totalPage, startPage + maxVisible - 1);
        if (endPage - startPage < maxVisible - 1) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        if (startPage > 1) {
            ul.insertAdjacentHTML("beforeend", `<li class="page-item"><a class="page-link" href="#" data-page="1">1</a></li>`);
            if (startPage > 2) {
                ul.insertAdjacentHTML("beforeend", `<li class="page-item disabled"><span class="page-link">…</span></li>`);
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            ul.insertAdjacentHTML("beforeend", `
                <li class="page-item ${i === this.state.filter.page ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `);
        }

        if (endPage < totalPage) {
            if (endPage < totalPage - 1) {
                ul.insertAdjacentHTML("beforeend", `<li class="page-item disabled"><span class="page-link">…</span></li>`);
            }
            ul.insertAdjacentHTML("beforeend", `
                <li class="page-item"><a class="page-link" href="#" data-page="${totalPage}">${totalPage}</a></li>
            `);
        }

        // Next
        ul.insertAdjacentHTML("beforeend", `
            <li class="page-item ${this.state.filter.page === totalPage ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${this.state.filter.page + 1}">&raquo;</a>
            </li>
        `);

        ul.querySelectorAll(".page-link").forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                const page = parseInt(btn.dataset.page, 10);
                if (page && page >= 1 && page <= totalPage) {
                    this.state.filter.page = page;
                    this.renderTable();
                }
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
        if (!id) {
            this.showToast("ID meter tidak valid.", "error");
            return;
        }

        try {
            this.showLoading(true);
            const response = await BCS.Api.getElectricityDetail(id);

            if (!response.success) {
                this.showToast(response.message || "Data tidak ditemukan.", "error");
                return;
            }

            const data = response.data || {};

            this.setText("detailMeterId", data.id || "-");
            this.setText("detailEntity", data.entity || "-");
            this.setText("detailTotalKwh", this.formatNumber(data.totalKwh, 2));
            this.setText("detailTotalNominal", this.formatCurrency(data.totalNominal));

            this.renderDetailChart(data.history || []);
            this.renderDetailTable(data.history || []);

            const modalEl = document.getElementById("meterDetailModal");
            if (modalEl) {
                const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
                modal.show();
            }

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

        const labels = history.map(x => x.month || x.bulan || '');
        const values = history.map(x => x.kwh || x.pemakaian || 0);

        this.chartDetail = new Chart(canvas, {
            type: "line",
            data: {
                labels: labels,
                datasets: [{
                    label: "kWh",
                    data: values,
                    borderColor: "#1565C0",
                    backgroundColor: "rgba(21,101,192,.15)",
                    fill: true,
                    tension: .35,
                    pointBackgroundColor: "#1565C0"
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    datalabels: {
                        anchor: 'end',
                        align: 'end',
                        color: '#1a1a1a',
                        font: { weight: 'bold', size: 9 },
                        formatter: (value) => {
                            return value > 0 ? this.formatNumber(value, 0) : '';
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => this.formatNumber(value, 0),
                            font: { size: 9 }
                        }
                    },
                    x: {
                        ticks: {
                            font: { size: 9 }
                        }
                    }
                }
            },
            plugins: [ChartDataLabels]
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
                    <td colspan="6" class="text-center text-muted py-3">
                        Tidak ada histori.
                    </td>
                </tr>
            `;
            return;
        }

        history.forEach(item => {
            const bulan = item.month || item.bulan || '-';
            const awal = item.awal || 0;
            const akhir = item.akhir || 0;
            const kwh = item.kwh || item.pemakaian || 0;
            const nominal = item.nominal || 0;
            const status = item.status || 'NORMAL';
            const badgeClass = this.getStatusBadge(status);

            tbody.insertAdjacentHTML("beforeend", `
                <tr>
                    <td>${bulan}</td>
                    <td>${this.formatNumber(awal, 2)}</td>
                    <td>${this.formatNumber(akhir, 2)}</td>
                    <td class="${kwh < 0 ? 'text-danger fw-bold' : ''}">${this.formatNumber(kwh, 2)}</td>
                    <td>${this.formatCurrency(nominal)}</td>
                    <td><span class="badge ${badgeClass}">${status}</span></td>
                </tr>
            `);
        });
    },

    // ==========================================================
    // EVENT
    // ==========================================================

    registerEvent() {
        // Refresh
        document.getElementById("btnRefresh")?.addEventListener("click", () => {
            this.loadDashboard(true);
        });

        // Search
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

        // Status filter
        document.getElementById("cmbStatus")?.addEventListener("change", e => {
            this.state.filter.status = e.target.value;
            this.state.filter.page = 1;
            this.renderTable();
        });

        // Reset
        document.getElementById("btnReset")?.addEventListener("click", () => {
            document.getElementById("txtSearch").value = "";
            document.getElementById("cmbStatus").value = "ALL";
            this.state.filter.keyword = "";
            this.state.filter.status = "ALL";
            this.state.filter.page = 1;
            this.renderTable();
        });

        // Page size
        document.getElementById("cmbPageSize")?.addEventListener("change", e => {
            this.state.filter.pageSize = parseInt(e.target.value, 10) || 10;
            this.state.filter.page = 1;
            this.renderTable();
        });

        // Add Data (placeholder)
        document.getElementById("btnAddData")?.addEventListener("click", () => {
            this.showToast("Fitur tambah data sedang dalam pengembangan.", "info");
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
