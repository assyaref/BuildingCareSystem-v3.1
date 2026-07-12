/**
 * =====================================================
 * Building Care System Enterprise
 * Electricity Module
 * Version 2.7 (Fix auto-fill override bulan)
 * =====================================================
 */

const ElectricityController = {
    chartMonthly: null,
    chartEntity: null,
    chartDetail: null,
    refreshTimer: null,
    clockInterval: null,

    // Flag untuk menonaktifkan auto-fill sementara
    _suppressAutoFill: false,

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

    // ==========================================================
    // INIT
    // ==========================================================

    init() {
        this.registerEvent();
        this.loadDashboard({ showLoading: true, showToast: false });
        this.startAutoRefresh();
        this.startClock();
    },

    // ==========================================================
    // CLOCK REAL-TIME
    // ==========================================================

    startClock() {
        if (this.clockInterval) clearInterval(this.clockInterval);
        this.updateClock();
        this.clockInterval = setInterval(() => {
            this.updateClock();
        }, 1000);
    },

    updateClock() {
        const el = document.getElementById("lblLastUpdate");
        if (!el) return;
        const now = new Date();
        const options = {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        };
        el.textContent = now.toLocaleString('id-ID', options);
    },

    // ==========================================================
    // LOADING / ERROR / NOTIFICATION (Toast Tengah + Overlay)
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
        const iconMap = {
            success: 'success',
            error: 'error',
            warning: 'warning',
            info: 'info'
        };

        const titleMap = {
            success: 'Berhasil!',
            error: 'Gagal!',
            warning: 'Perhatian!',
            info: 'Informasi'
        };

        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: iconMap[type] || 'info',
                title: titleMap[type] || 'Informasi',
                text: message,
                timer: 3000,
                timerProgressBar: true,
                showConfirmButton: false,
                position: 'center',
                backdrop: 'rgba(0,0,0,0.4)',
                width: '420px',
                padding: '1.5rem',
                customClass: {
                    popup: 'rounded-4 shadow-lg',
                    title: 'fw-bold fs-5',
                    htmlContainer: 'text-muted'
                }
            });
            return;
        }

        console.log(`[${type.toUpperCase()}] ${message}`);
    },

    // ==========================================================
    // AUTO REFRESH
    // ==========================================================

    startAutoRefresh() {
        if (this.refreshTimer) clearInterval(this.refreshTimer);
        this.refreshTimer = setInterval(() => {
            this.loadDashboard({ showLoading: false, showToast: true });
        }, 300000);
    },

    // ==========================================================
    // LOAD DASHBOARD
    // ==========================================================

    async loadDashboard(options = {}) {
        const { showLoading = false, showToast = false } = options;

        try {
            if (showLoading) this.showLoading(true);

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

            if (showToast) {
                this.showToast('Data berhasil diperbarui.', 'success');
            }

        } catch (err) {
            console.error(err);
            if (showToast) {
                this.showError(err.message || 'Gagal memperbarui data.');
            } else {
                this.showError(err.message || 'Gagal memuat data.');
            }
        } finally {
            if (showLoading) this.showLoading(false);
        }
    },

    // ==========================================================
    // RENDER
    // ==========================================================

    render() {
        this.renderSummary();
        this.renderStatusSummary();
        this.renderMonthlyChart();
        this.renderEntityChart();
        this.renderTable();
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
        this.setText("growthInfo", (data.growth || 0) + "%");

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

        const avgLabel = document.getElementById("avgMonthLabel");
        if (avgLabel) {
            avgLabel.textContent = data.highestMonth || '-';
        }
    },

    // ==========================================================
    // STATUS SUMMARY
    // ==========================================================

    renderStatusSummary() {
        const records = this.state.records || [];
        const total = records.length;

        const counts = {
            'NORMAL': 0,
            'MAINTENANCE': 0,
            'GANTI_METER': 0,
            'NEGATIVE': 0,
            'NO_READING': 0,
            'ALERT': 0
        };

        records.forEach(r => {
            const status = r.status || 'NORMAL';
            if (counts[status] !== undefined) {
                counts[status]++;
            } else {
                counts['NORMAL']++;
            }
        });

        const normal = counts['NORMAL'] || 0;
        const quality = total > 0 ? Math.round((normal / total) * 100) : 100;

        const qualityEl = document.getElementById('dataQuality');
        const qualityBar = document.getElementById('qualityBar');
        if (qualityEl) qualityEl.textContent = quality + '%';
        if (qualityBar) qualityBar.style.width = quality + '%';

        const qualityBadge = document.querySelector('.summary-card .badge.bg-primary.bg-opacity-10');
        if (qualityBadge) {
            if (quality >= 90) {
                qualityBadge.textContent = 'Excellent';
                qualityBadge.className = 'badge bg-success bg-opacity-10 text-success border border-success-subtle rounded-pill';
            } else if (quality >= 70) {
                qualityBadge.textContent = 'Good';
                qualityBadge.className = 'badge bg-primary bg-opacity-10 text-primary border border-primary-subtle rounded-pill';
            } else if (quality >= 50) {
                qualityBadge.textContent = 'Fair';
                qualityBadge.className = 'badge bg-warning bg-opacity-10 text-warning border border-warning-subtle rounded-pill';
            } else {
                qualityBadge.textContent = 'Poor';
                qualityBadge.className = 'badge bg-danger bg-opacity-10 text-danger border border-danger-subtle rounded-pill';
            }
        }

        const statusItems = {
            'Normal': counts['NORMAL'] || 0,
            'Maintenance': counts['MAINTENANCE'] || 0,
            'Ganti Meter': counts['GANTI_METER'] || 0,
            'Negatif (kWh)': counts['NEGATIVE'] || 0
        };

        const statusList = document.querySelectorAll('.status-list-item .count');
        if (statusList.length >= 4) {
            const keys = ['Normal', 'Maintenance', 'Ganti Meter', 'Negatif (kWh)'];
            statusList.forEach((el, idx) => {
                if (idx < keys.length) {
                    const key = keys[idx];
                    const count = statusItems[key] || 0;
                    el.innerHTML = `${count} <span class="fw-normal text-muted" style="font-size:0.75rem;">Meter →</span>`;
                }
            });
        }

        const totalAlert = counts['MAINTENANCE'] + counts['GANTI_METER'] + counts['NEGATIVE'] + counts['ALERT'] + counts['NO_READING'];
        const alertEl = document.getElementById('alertSummary');
        if (alertEl) {
            alertEl.textContent = totalAlert > 0 ? totalAlert + ' Meter' : 'Tidak ada';
        }

        const declineEl = document.getElementById('declineInfo');
        if (declineEl) {
            declineEl.textContent = counts['NEGATIVE'] > 0 ? counts['NEGATIVE'] + ' Meter' : '0';
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

    formatNumber(value, decimals = 0) {
        return Number(value || 0).toLocaleString('id-ID', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    },

    formatCurrency(value) {
        return 'Rp ' + Number(value || 0).toLocaleString('id-ID', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
    },

    getStatusBadge(status) {
        const map = {
            'NORMAL': 'badge-normal',
            'MAINTENANCE': 'badge-warning',
            'NEGATIVE': 'badge-danger',
            'GANTI_METER': 'badge-danger',
            'NO_READING': 'badge-info',
            'ALERT': 'badge-dark'
        };
        return map[status] || 'badge-info';
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
                animation: { duration: 600 },
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => this.formatNumber(value, 0)
                        }
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
        const total = entity.reduce((sum, item) => sum + item.totalKwh, 0);
        const colors = ['#1565C0', '#2E7D32', '#F9A825', '#D32F2F', '#0288D1', '#8E24AA', '#546E7A'];

        this.chartEntity = new Chart(canvas, {
            type: "doughnut",
            data: {
                labels: entity.map(item => item.entitas),
                datasets: [{
                    data: entity.map(item => item.totalKwh),
                    backgroundColor: colors.slice(0, entity.length),
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: "65%",
                animation: { animateRotate: true },
                plugins: {
                    legend: { display: false }
                }
            }
        });

        const legendContainer = document.getElementById('entityLegend');
        if (legendContainer) {
            legendContainer.innerHTML = entity.map((item, idx) => `
                <div class="d-flex align-items-center gap-2 py-1 border-bottom border-light">
                    <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${colors[idx % colors.length]};"></span>
                    <span class="fw-medium">${item.entitas}</span>
                    <span class="ms-auto fw-bold">${this.formatNumber(item.totalKwh, 0)} kWh</span>
                    <span class="text-muted" style="font-size:0.7rem;">(${total > 0 ? ((item.totalKwh / total) * 100).toFixed(1) : 0}%)</span>
                </div>
            `).join('');
        }
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
            rows = rows.filter(r =>
                String(r.entitas).toLowerCase().includes(keyword) ||
                String(r.idPelanggan).toLowerCase().includes(keyword) ||
                String(r.no).toLowerCase().includes(keyword)
            );
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
            tbody.innerHTML = `<tr><td colspan="11" class="table-empty">Tidak ada data.</td></tr>`;
            this.setText("tableInfo", "Menampilkan 0 data");
            this.renderPagination(0);
            return;
        }

        pageRows.forEach((item, idx) => {
            const badgeClass = this.getStatusBadge(item.status);
            const isNegative = item.pemakaian < 0;
            const posisi = (item.no && item.no !== '-' && item.no !== 'null') ? item.no : '-';
            tbody.insertAdjacentHTML("beforeend", `
                <tr>
                    <td class="text-start ps-4">${start + idx + 1}</td>
                    <td class="text-start">${item.bulan}</td>
                    <td class="text-start"><strong>${posisi}</strong></td>
                    <td class="text-start">${item.idPelanggan}</td>
                    <td class="text-start">${item.entitas}</td>
                    <td class="text-end">${this.formatNumber(item.awal, 2)}</td>
                    <td class="text-end">${this.formatNumber(item.akhir, 2)}</td>
                    <td class="text-end ${isNegative ? 'text-danger' : ''}">${this.formatNumber(item.pemakaian, 2)}</td>
                    <td class="text-end">${this.formatCurrency(item.nominal)}</td>
                    <td>${item.keterangan || '-'}</td>
                    <td>
                        <div class="btn-group btn-group-sm" role="group">
                            <button class="btn btn-outline-primary btn-detail" data-id="${item.idPelanggan}" title="Detail">
                                <i class="bi bi-eye"></i>
                            </button>
                            <button class="btn btn-outline-warning btn-edit" data-id="${item.idPelanggan}" title="Edit">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-outline-danger btn-delete" data-id="${item.idPelanggan}" title="Hapus">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `);
        });

        this.setText("tableInfo", `Menampilkan ${pageRows.length} dari ${totalRows} data`);
        this.renderPagination(totalRows);
        this.bindDetailButton();
        this.bindEditButton();
        this.bindDeleteButton();
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
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
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

    // ==========================================================
    // BIND BUTTONS
    // ==========================================================

    bindDetailButton() {
        document.querySelectorAll(".btn-detail").forEach(btn => {
            btn.onclick = () => this.showDetail(btn.dataset.id);
        });
    },

    bindEditButton() {
        document.querySelectorAll(".btn-edit").forEach(btn => {
            btn.onclick = () => {
                const id = btn.dataset.id;
                const record = this.state.records.find(r => r.idPelanggan === id);
                if (record) {
                    this.openForm({
                        id: record.idPelanggan,
                        bulan: record.bulan,
                        posisi: record.no || '',
                        idPelanggan: record.idPelanggan,
                        entitas: record.entitas,
                        awal: record.awal,
                        akhir: record.akhir,
                        pemakaian: record.pemakaian,
                        nominal: record.nominal,
                        keterangan: record.keterangan
                    });
                } else {
                    this.showToast('Data tidak ditemukan.', 'error');
                }
            };
        });
    },

    bindDeleteButton() {
        document.querySelectorAll(".btn-delete").forEach(btn => {
            btn.onclick = () => this.deleteRecord(btn.dataset.id);
        });
    },

    // ==========================================================
    // CRUD (dengan dropdown posisi & auto-calc)
    // ==========================================================

    openForm(data = null) {
        const modal = new bootstrap.Modal(document.getElementById('formModal'));
        const title = document.getElementById('formModalTitle');
        const btnSave = document.getElementById('btnSaveRecord');

        // --- Populasi dropdown posisi meteran ---
        const posisiSelect = document.getElementById('formPosisi');
        if (posisiSelect) {
            const posisiSet = new Set();
            this.state.records.forEach(r => {
                if (r.no && r.no !== '-' && r.no !== 'null' && r.no.trim() !== '') {
                    posisiSet.add(r.no);
                }
            });
            const posisiList = [...posisiSet].sort();
            const currentVal = posisiSelect.value;
            posisiSelect.innerHTML = '<option value="">Pilih Posisi</option>';
            posisiList.forEach(p => {
                posisiSelect.insertAdjacentHTML('beforeend', `<option value="${p}">${p}</option>`);
            });
            if (data && data.posisi) {
                posisiSelect.value = data.posisi;
            } else if (currentVal && posisiList.includes(currentVal)) {
                posisiSelect.value = currentVal;
            }
        }

        // --- Populasi datalist ID Pelanggan ---
        const datalist = document.getElementById('idPelangganList');
        if (datalist) {
            const ids = [...new Set(this.state.records.map(r => r.idPelanggan).filter(Boolean))];
            datalist.innerHTML = ids.map(id => `<option value="${id}">`).join('');
        }

        // ==========================================================
        // PERBAIKAN: Gunakan flag untuk menonaktifkan auto-fill sementara
        // ==========================================================
        this._suppressAutoFill = true;

        // --- EVENT: Posisi Meteran -> Auto-fill (TIDAK MENGUBAH BULAN) ---
        const posisiSelect2 = document.getElementById('formPosisi');
        if (posisiSelect2) {
            const newPosisi = posisiSelect2.cloneNode(true);
            posisiSelect2.parentNode.replaceChild(newPosisi, posisiSelect2);
            newPosisi.id = 'formPosisi';

            newPosisi.addEventListener('change', function(e) {
                // Abaikan jika sedang suppress
                if (ElectricityController._suppressAutoFill) return;

                const selectedPosisi = this.value.trim();
                if (!selectedPosisi) return;

                const bulanSelect = document.getElementById('formBulan');
                const selectedBulan = bulanSelect ? bulanSelect.value.trim() : '';

                // Cari record dengan kombinasi posisi + bulan (jika bulan terisi)
                let record = null;
                if (selectedBulan) {
                    record = ElectricityController.state.records.find(r => 
                        r.no === selectedPosisi && r.bulan === selectedBulan
                    );
                }

                // Jika tidak ditemukan, cari record dengan posisi saja (untuk ID & Entitas)
                if (!record) {
                    record = ElectricityController.state.records.find(r => r.no === selectedPosisi);
                }

                const idInput = document.getElementById('formIdPelanggan');
                const entitasSelect = document.getElementById('formEntitas');
                const awalInput = document.getElementById('formAwal');
                const akhirInput = document.getElementById('formAkhir');
                const pemakaianInput = document.getElementById('formPemakaian');
                const nominalInput = document.getElementById('formNominal');
                const keteranganInput = document.getElementById('formKeterangan');

                if (record) {
                    // Isi field lain, tapi JANGAN sentuh bulan (biarkan tetap)
                    if (idInput) idInput.value = record.idPelanggan || '';
                    if (entitasSelect) entitasSelect.value = record.entitas || '';
                    if (awalInput) awalInput.value = record.awal || '';
                    if (akhirInput) akhirInput.value = record.akhir || '';
                    if (pemakaianInput) pemakaianInput.value = record.pemakaian || '';
                    if (nominalInput) nominalInput.value = record.nominal || '';
                    if (keteranganInput) keteranganInput.value = record.keterangan || '';
                } else {
                    // Tidak ada data, kosongkan field lain (bulan tetap)
                    if (idInput) idInput.value = '';
                    if (entitasSelect) entitasSelect.value = '';
                    if (awalInput) awalInput.value = '';
                    if (akhirInput) akhirInput.value = '';
                    if (pemakaianInput) pemakaianInput.value = '';
                    if (nominalInput) nominalInput.value = '';
                    if (keteranganInput) keteranganInput.value = '';
                }

                // Trigger kalkulasi
                ElectricityController.calculateForm();
            });
        }

        // --- EVENT: ID Pelanggan -> Auto-fill (TIDAK MENGUBAH BULAN) ---
        const idInput = document.getElementById('formIdPelanggan');
        if (idInput) {
            const newInput = idInput.cloneNode(true);
            idInput.parentNode.replaceChild(newInput, idInput);
            newInput.id = 'formIdPelanggan';
            newInput.addEventListener('input', function(e) {
                if (ElectricityController._suppressAutoFill) return;

                const val = this.value.trim();
                if (!val) return;
                const record = ElectricityController.state.records.find(r => r.idPelanggan === val);
                if (record) {
                    const bulanSelect = document.getElementById('formBulan');
                    const entitasSelect = document.getElementById('formEntitas');
                    const posisiSelect = document.getElementById('formPosisi');
                    const awalInput = document.getElementById('formAwal');
                    const akhirInput = document.getElementById('formAkhir');
                    const pemakaianInput = document.getElementById('formPemakaian');
                    const nominalInput = document.getElementById('formNominal');
                    const keteranganInput = document.getElementById('formKeterangan');

                    // Isi field, tapi JANGAN sentuh bulan
                    if (entitasSelect) entitasSelect.value = record.entitas || '';
                    if (posisiSelect) posisiSelect.value = record.no || '';
                    if (awalInput) awalInput.value = record.awal || '';
                    if (akhirInput) akhirInput.value = record.akhir || '';
                    if (pemakaianInput) pemakaianInput.value = record.pemakaian || '';
                    if (nominalInput) nominalInput.value = record.nominal || '';
                    if (keteranganInput) keteranganInput.value = record.keterangan || '';

                    ElectricityController.calculateForm();
                }
            });
        }

        // --- Event listener untuk auto-calc (awal & akhir) ---
        const awalInput = document.getElementById('formAwal');
        const akhirInput = document.getElementById('formAkhir');
        if (awalInput && akhirInput) {
            const newAwal = awalInput.cloneNode(true);
            awalInput.parentNode.replaceChild(newAwal, awalInput);
            newAwal.id = 'formAwal';
            newAwal.addEventListener('input', () => this.calculateForm());

            const newAkhir = akhirInput.cloneNode(true);
            akhirInput.parentNode.replaceChild(newAkhir, akhirInput);
            newAkhir.id = 'formAkhir';
            newAkhir.addEventListener('input', () => this.calculateForm());
        }

        // ==========================================================
        // ISI DATA (dengan suppress aktif, agar event tidak terpicu)
        // ==========================================================
        if (data) {
            title.innerHTML = `<i class="bi bi-pencil-square text-warning me-2"></i> Edit Data`;
            btnSave.textContent = 'Update';
            document.getElementById('formId').value = data.id || '';
            document.getElementById('formBulan').value = data.bulan || '';
            document.getElementById('formPosisi').value = data.posisi || '';
            document.getElementById('formIdPelanggan').value = data.idPelanggan || '';
            document.getElementById('formEntitas').value = data.entitas || '';
            document.getElementById('formAwal').value = data.awal || '';
            document.getElementById('formAkhir').value = data.akhir || '';
            document.getElementById('formPemakaian').value = data.pemakaian || '';
            document.getElementById('formNominal').value = data.nominal || '';
            document.getElementById('formKeterangan').value = data.keterangan || '';
            this.calculateForm();
        } else {
            title.innerHTML = `<i class="bi bi-plus-circle text-success me-2"></i> Tambah Data`;
            btnSave.textContent = 'Simpan';
            document.getElementById('electricityForm').reset();
            document.getElementById('formId').value = '';
            document.getElementById('formPosisi').value = '';
            document.getElementById('formIdPelanggan').value = '';
            this.calculateForm();
        }

        // Aktifkan kembali auto-fill setelah selesai mengisi
        this._suppressAutoFill = false;

        modal.show();
    },

    // ==========================================================
    // AUTO-CALCULATE
    // ==========================================================

    calculateForm() {
        const awal = parseFloat(document.getElementById('formAwal')?.value) || 0;
        const akhir = parseFloat(document.getElementById('formAkhir')?.value) || 0;
        const pemakaian = akhir - awal;
        const hargaPerKwh = 1480;

        const pemakaianInput = document.getElementById('formPemakaian');
        const nominalInput = document.getElementById('formNominal');
        const notesEl = document.getElementById('calcNotes');

        if (pemakaianInput) {
            pemakaianInput.value = pemakaian.toFixed(2);
        }

        const nominal = pemakaian * hargaPerKwh;
        if (nominalInput) {
            nominalInput.value = nominal.toFixed(0);
        }

        if (notesEl) {
            if (pemakaian !== 0) {
                const formattedKwh = pemakaian.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
                const formattedNominal = nominal.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
                notesEl.innerHTML = `
                    <div class="alert alert-info mt-2 mb-0 py-2">
                        <i class="bi bi-calculator me-1"></i>
                        <strong>Perhitungan:</strong>
                        ${formattedKwh} kWh × Rp ${hargaPerKwh.toLocaleString('id-ID')} = 
                        <strong>Rp ${formattedNominal}</strong>
                    </div>
                `;
            } else {
                notesEl.innerHTML = `
                    <div class="alert alert-secondary mt-2 mb-0 py-2">
                        <i class="bi bi-info-circle me-1"></i>
                        Masukkan Awal dan Akhir untuk menghitung otomatis.
                    </div>
                `;
            }
        }
    },

    async saveRecord() {
        const formData = {
            id: document.getElementById('formId').value,
            bulan: document.getElementById('formBulan').value,
            posisiMeteran: document.getElementById('formPosisi').value,
            idPelanggan: document.getElementById('formIdPelanggan').value,
            entitas: document.getElementById('formEntitas').value,
            awal: parseFloat(document.getElementById('formAwal').value) || 0,
            akhir: parseFloat(document.getElementById('formAkhir').value) || 0,
            pemakaian: parseFloat(document.getElementById('formPemakaian').value) || 0,
            nominal: parseFloat(document.getElementById('formNominal').value) || 0,
            keterangan: document.getElementById('formKeterangan').value
        };

        if (!formData.bulan || !formData.posisiMeteran || !formData.idPelanggan || !formData.entitas) {
            this.showToast('Bulan, Posisi Meteran, ID Pelanggan, dan Entitas wajib diisi.', 'warning');
            return;
        }

        try {
            this.showLoading(true);
            const action = formData.id ? 'updateElectricityRecord' : 'createElectricityRecord';
            const response = await BCS.Api.request('POST', action, formData);
            if (response.success) {
                this.showToast('Data berhasil disimpan.', 'success');
                bootstrap.Modal.getInstance(document.getElementById('formModal')).hide();
                this.loadDashboard({ showLoading: false, showToast: false });
            } else {
                this.showError(response.message || 'Gagal menyimpan data.');
            }
        } catch (err) {
            console.error(err);
            this.showError(err.message);
        } finally {
            this.showLoading(false);
        }
    },

    async deleteRecord(id) {
        if (!id) return;
        const confirmed = await Swal.fire({
            title: 'Hapus Data?',
            text: 'Data yang dihapus tidak dapat dikembalikan.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal'
        });
        if (!confirmed.isConfirmed) return;

        try {
            this.showLoading(true);
            const response = await BCS.Api.request('POST', 'deleteElectricityRecord', { id });
            if (response.success) {
                this.showToast('Data berhasil dihapus.', 'success');
                this.loadDashboard({ showLoading: false, showToast: false });
            } else {
                this.showError(response.message || 'Gagal menghapus data.');
            }
        } catch (err) {
            console.error(err);
            this.showError(err.message);
        } finally {
            this.showLoading(false);
        }
    },

    // ==========================================================
    // DETAIL METER
    // ==========================================================

    async showDetail(id) {
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
                plugins: { legend: { display: false } }
            }
        });
    },

    renderDetailTable(history) {
        const tbody = document.getElementById("detailTable");
        if (!tbody) return;
        tbody.innerHTML = "";

        if (!history || !history.length) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center">Tidak ada histori.</td></tr>`;
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
            this.loadDashboard({ showLoading: false, showToast: true });
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
            this.state.filter = { keyword: "", status: "ALL", page: 1, pageSize: 10 };
            this.renderTable();
        });

        document.getElementById("cmbPageSize")?.addEventListener("change", (e) => {
            this.state.filter.pageSize = parseInt(e.target.value, 10);
            this.state.filter.page = 1;
            this.renderTable();
        });

        document.getElementById("btnAddData")?.addEventListener("click", () => {
            this.openForm(null);
        });

        document.getElementById("btnSaveRecord")?.addEventListener("click", () => {
            this.saveRecord();
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
        if (this.clockInterval) {
            clearInterval(this.clockInterval);
            this.clockInterval = null;
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
