// ======================================================
// Building Care System Enterprise v7.1
// dashboard.js - Full Dynamic Dashboard with Charts & Trends
// Radiant Group Duri
// ======================================================

"use strict";

(function() {
    if (typeof BCS === 'undefined') {
        console.error('❌ BCS framework not loaded');
        return;
    }

    // =============================================
    // DOM REFS
    // =============================================
    const DOM = {
        totalReport: document.getElementById('totalReport'),
        acTotal: document.getElementById('acTotal'),
        listrikTotal: document.getElementById('listrikTotal'),
        gedungTotal: document.getElementById('gedungTotal'),
        totalOpen: document.getElementById('totalOpen'),
        totalProgress: document.getElementById('totalProgress'),
        totalDone: document.getElementById('totalDone'),
        fastCount: document.getElementById('fastCount'),
        normalCount: document.getElementById('normalCount'),
        lateCount: document.getElementById('lateCount'),
        todayDate: document.getElementById('todayDate'),
        currentTime: document.getElementById('currentTime'),
        onlineUser: document.getElementById('onlineUser'),
        todayReport: document.getElementById('todayReport'),
        pendingApproval: document.getElementById('pendingApproval'),
        lastUpdate: document.getElementById('lastUpdate'),
        recentActivity: document.getElementById('recentActivity'),
        userName: document.getElementById('userName'),
        userNik: document.getElementById('userNik'),
        userRole: document.getElementById('userRole'),
        lastLogin: document.getElementById('lastLogin'),
        // Trend elements
        totalTrend: document.getElementById('totalTrend'),
        acTrend: document.getElementById('acTrend'),
        listrikTrend: document.getElementById('listrikTrend'),
        gedungTrend: document.getElementById('gedungTrend'),
        // Trend icons
        totalTrendIcon: document.getElementById('totalTrendIcon'),
        acTrendIcon: document.getElementById('acTrendIcon'),
        listrikTrendIcon: document.getElementById('listrikTrendIcon'),
        gedungTrendIcon: document.getElementById('gedungTrendIcon'),
        // Percent elements
        fastPercent: document.getElementById('fastPercent'),
        normalPercent: document.getElementById('normalPercent'),
        latePercent: document.getElementById('latePercent')
    };

    // Chart instances
    let categoryChart = null;
    let reportChart = null;
    let monthlyChart = null;

    // =============================================
    // DEFAULT VALUES
    // =============================================
    function setDefaults() {
        const defaults = {
            totalReport: '0',
            acTotal: '0',
            listrikTotal: '0',
            gedungTotal: '0',
            totalOpen: '0',
            totalProgress: '0',
            totalDone: '0',
            fastCount: '0',
            normalCount: '0',
            lateCount: '0',
            todayReport: '0',
            pendingApproval: '0',
            onlineUser: '1',
            totalTrend: '0',
            acTrend: '0',
            listrikTrend: '0',
            gedungTrend: '0'
        };
        Object.keys(defaults).forEach(key => {
            if (DOM[key]) DOM[key].textContent = defaults[key];
        });

        // Set default SLA percentages
        if (DOM.fastPercent) DOM.fastPercent.textContent = '0%';
        if (DOM.normalPercent) DOM.normalPercent.textContent = '0%';
        if (DOM.latePercent) DOM.latePercent.textContent = '0%';
    }

    // =============================================
    // LOAD USER INFO
    // =============================================
    function loadUser() {
        try {
            const session = BCS.Storage.getSession();
            if (session && session.user) {
                const user = session.user;
                if (DOM.userName) DOM.userName.textContent = user.nama || user.name || 'User';
                if (DOM.userNik) DOM.userNik.textContent = session.nik || user.nik || '-';
                if (DOM.userRole) DOM.userRole.textContent = user.role || 'User';
                if (DOM.lastLogin) DOM.lastLogin.textContent = user.lastLogin || '-';
            }
        } catch (e) {
            console.warn('Load user error:', e);
        }
    }

    // =============================================
    // UPDATE DATE & TIME
    // =============================================
    function updateDateTime() {
        const now = new Date();
        if (DOM.todayDate) {
            DOM.todayDate.textContent = now.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        }
        if (DOM.currentTime) {
            DOM.currentTime.textContent = now.toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        }
    }

    // =============================================
    // CALCULATE TRENDS (from localStorage)
    // =============================================
    function calculateTrends(currentData) {
        const STORAGE_KEY = 'bcs_dashboard_prev';
        let prevData = null;

        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                prevData = JSON.parse(stored);
            }
        } catch (e) {
            console.warn('Failed to read previous data:', e);
        }

        if (!prevData) {
            // First time loading, no previous data
            return {
                total: 0,
                ac: 0,
                listrik: 0,
                gedung: 0
            };
        }

        const total = currentData.total - (prevData.total || 0);
        const ac = currentData.ac - (prevData.ac || 0);
        const listrik = currentData.listrik - (prevData.listrik || 0);
        const gedung = currentData.gedung - (prevData.gedung || 0);

        return { total, ac, listrik, gedung };
    }

    // =============================================
    // UPDATE TREND UI
    // =============================================
    function updateTrendUI(trends) {
        const trendElements = [
            { id: 'totalTrend', icon: 'totalTrendIcon', value: trends.total },
            { id: 'acTrend', icon: 'acTrendIcon', value: trends.ac },
            { id: 'listrikTrend', icon: 'listrikTrendIcon', value: trends.listrik },
            { id: 'gedungTrend', icon: 'gedungTrendIcon', value: trends.gedung }
        ];

        trendElements.forEach(({ id, icon, value }) => {
            const el = document.getElementById(id);
            const iconEl = document.getElementById(icon);
            if (!el) return;

            const absValue = Math.abs(value);
            el.textContent = absValue;

            if (iconEl) {
                if (value > 0) {
                    iconEl.className = 'bi bi-arrow-up-short fs-5 text-success';
                    el.style.color = '#22c55e';
                } else if (value < 0) {
                    iconEl.className = 'bi bi-arrow-down-short fs-5 text-danger';
                    el.style.color = '#ef4444';
                } else {
                    iconEl.className = 'bi bi-dash fs-5 text-muted';
                    el.style.color = '#6b7280';
                }
            }
        });
    }

    // =============================================
    // SAVE CURRENT DATA FOR NEXT TREND
    // =============================================
    function saveCurrentData(data) {
        const STORAGE_KEY = 'bcs_dashboard_prev';
        const saveData = {
            total: data.total || 0,
            ac: data.ac || 0,
            listrik: data.listrik || 0,
            gedung: data.gedung || 0,
            timestamp: Date.now()
        };
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
        } catch (e) {
            console.warn('Failed to save current data:', e);
        }
    }

    // =============================================
    // RENDER CATEGORY CHART (Doughnut)
    // =============================================
    function renderCategoryChart(data) {
        const ctx = document.getElementById('renderCategoryChart');
        if (!ctx) return;

        const labels = ['AC', 'LISTRIK', 'KONDISI GEDUNG'];
        const values = [
            data.ac || 0,
            data.listrik || 0,
            data.bangunan || data.gedung || 0
        ];
        const colors = ['#06B6D4', '#FBBF24', '#7C3AED'];

        if (categoryChart) {
            categoryChart.destroy();
            categoryChart = null;
        }

        categoryChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors,
                    borderColor: '#ffffff',
                    borderWidth: 3,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: { size: 12, family: 'Poppins' },
                            padding: 16,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? Math.round((context.parsed / total) * 100) : 0;
                                return context.label + ': ' + context.parsed + ' (' + percentage + '%)';
                            }
                        }
                    }
                },
                cutout: '70%'
            }
        });
    }

    // =============================================
    // RENDER REPORT CHART (Bar Chart - Status)
    // =============================================
    function renderReportChart(data) {
        const ctx = document.getElementById('reportChart');
        if (!ctx) return;

        const labels = ['OPEN', 'PROGRESS', 'DONE'];
        const values = [
            data.open || 0,
            data.progress || 0,
            data.done || 0
        ];
        const colors = ['#f59e0b', '#3b82f6', '#22c55e'];

        if (reportChart) {
            reportChart.destroy();
            reportChart = null;
        }

        reportChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Jumlah Laporan',
                    data: values,
                    backgroundColor: colors,
                    borderRadius: 6,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.parsed.y + ' laporan';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                            font: { size: 11 }
                        },
                        grid: {
                            color: 'rgba(0,0,0,0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // =============================================
    // RENDER MONTHLY CHART (Line)
    // =============================================
    function renderMonthlyChart(monthlyData) {
        const ctx = document.getElementById('monthlyChart');
        if (!ctx) return;

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const data = monthlyData || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

        if (monthlyChart) {
            monthlyChart.destroy();
            monthlyChart = null;
        }

        monthlyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: monthNames,
                datasets: [{
                    label: 'Jumlah Laporan',
                    data: data,
                    backgroundColor: 'rgba(75, 123, 236, 0.1)',
                    borderColor: '#4b7bec',
                    borderWidth: 3,
                    pointBackgroundColor: '#4b7bec',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 8,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.parsed.y + ' laporan';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                            font: { size: 11 }
                        },
                        grid: {
                            color: 'rgba(0,0,0,0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: { size: 11 }
                        }
                    }
                }
            }
        });
    }

    // =============================================
    // RENDER ACTIVITY
    // =============================================
    function renderActivity(activity) {
        if (!DOM.recentActivity) return;

        if (!activity || activity.length === 0) {
            DOM.recentActivity.innerHTML = '<div class="text-center text-muted py-4">Belum ada aktivitas</div>';
            return;
        }

        let html = '';
        activity.forEach(item => {
            const status = item.status || 'OPEN';
            let badgeClass = 'secondary';
            let icon = 'bi-folder2-open';
            let iconColor = '#6c757d';
            
            if (status === 'DONE') {
                badgeClass = 'success';
                icon = 'bi-check-circle';
                iconColor = '#22c55e';
            } else if (status === 'PROGRESS') {
                badgeClass = 'warning';
                icon = 'bi-arrow-repeat';
                iconColor = '#f59e0b';
            } else if (status === 'OPEN') {
                badgeClass = 'danger';
                icon = 'bi-folder2-open';
                iconColor = '#ef4444';
            }

            const waktu = item.waktu || item.tanggal || '';
            html += `
                <div class="d-flex justify-content-between align-items-center border-bottom py-2">
                    <div class="d-flex align-items-center gap-3">
                        <div class="rounded-circle d-flex align-items-center justify-content-center" style="width:32px;height:32px;background:#f0f2f5;color:${iconColor};">
                            <i class="bi ${icon}" style="font-size:14px;"></i>
                        </div>
                        <div>
                            <div style="font-size:13px;font-weight:600;">${item.kategori || 'Report'}</div>
                            <div style="font-size:11px;color:#6b7280;">${item.lokasi || ''}</div>
                            <div style="font-size:10px;color:#9ca3af;">${waktu}</div>
                        </div>
                    </div>
                    <span class="badge bg-${badgeClass}" style="font-size:10px;">${status}</span>
                </div>
            `;
        });
        DOM.recentActivity.innerHTML = html;
    }

    // =============================================
    // UPDATE STATUS PERCENTAGES
    // =============================================
    function updateStatusPercentages(data) {
        const open = data.open || 0;
        const progress = data.progress || 0;
        const done = data.done || 0;
        const total = open + progress + done;

        if (total === 0) {
            const openPercentEl = document.querySelector('.status-card.open .status-percent');
            const progressPercentEl = document.querySelector('.status-card.progress-card .status-percent');
            const donePercentEl = document.querySelector('.status-card.done-card .status-percent');
            
            if (openPercentEl) openPercentEl.textContent = '0% dari total report';
            if (progressPercentEl) progressPercentEl.textContent = '0% dari total report';
            if (donePercentEl) donePercentEl.textContent = '0% dari total report';
            return;
        }

        const openPct = Math.round((open / total) * 100);
        const progressPct = Math.round((progress / total) * 100);
        const donePct = Math.round((done / total) * 100);

        const openPercentEl = document.querySelector('.status-card.open .status-percent');
        const progressPercentEl = document.querySelector('.status-card.progress-card .status-percent');
        const donePercentEl = document.querySelector('.status-card.done-card .status-percent');

        if (openPercentEl) openPercentEl.textContent = openPct + '% dari total report';
        if (progressPercentEl) progressPercentEl.textContent = progressPct + '% dari total report';
        if (donePercentEl) donePercentEl.textContent = donePct + '% dari total report';
    }

    // =============================================
    // UPDATE SLA PERCENTAGES
    // =============================================
    function updateSLAPercentages(data) {
        const fast = data.fast || 0;
        const normal = data.normal || 0;
        const late = data.late || 0;
        const totalSLA = fast + normal + late;

        if (totalSLA === 0) {
            if (DOM.fastPercent) DOM.fastPercent.textContent = '0%';
            if (DOM.normalPercent) DOM.normalPercent.textContent = '0%';
            if (DOM.latePercent) DOM.latePercent.textContent = '0%';
            return;
        }

        const fastPct = Math.round((fast / totalSLA) * 100);
        const normalPct = Math.round((normal / totalSLA) * 100);
        const latePct = Math.round((late / totalSLA) * 100);

        if (DOM.fastPercent) DOM.fastPercent.textContent = fastPct + '%';
        if (DOM.normalPercent) DOM.normalPercent.textContent = normalPct + '%';
        if (DOM.latePercent) DOM.latePercent.textContent = latePct + '%';
    }

    // =============================================
    // LOAD DASHBOARD DATA
    // =============================================
    async function loadDashboard() {
        try {
            BCS.App.Loading.show();

            const response = await BCS.Api.post('getSummary', {});
            console.log('📊 Dashboard response:', response);

            if (!response || !response.success) {
                console.error('Gagal load dashboard:', response?.message);
                BCS.App.Toast.danger('Gagal memuat data dashboard');
                return;
            }

            const data = response.data || {};

            // Update semua card
            if (DOM.totalReport) DOM.totalReport.textContent = data.total || 0;
            if (DOM.acTotal) DOM.acTotal.textContent = data.ac || 0;
            if (DOM.listrikTotal) DOM.listrikTotal.textContent = data.listrik || 0;
            if (DOM.gedungTotal) DOM.gedungTotal.textContent = data.bangunan || data.gedung || 0;

            if (DOM.totalOpen) DOM.totalOpen.textContent = data.open || 0;
            if (DOM.totalProgress) DOM.totalProgress.textContent = data.progress || 0;
            if (DOM.totalDone) DOM.totalDone.textContent = data.done || 0;

            if (DOM.fastCount) DOM.fastCount.textContent = data.fast || 0;
            if (DOM.normalCount) DOM.normalCount.textContent = data.normal || 0;
            if (DOM.lateCount) DOM.lateCount.textContent = data.late || 0;

            if (DOM.todayReport) DOM.todayReport.textContent = data.todayReport || 0;
            if (DOM.pendingApproval) DOM.pendingApproval.textContent = data.pendingApproval || 0;
            if (DOM.onlineUser) DOM.onlineUser.textContent = data.onlineUser || 1;

            if (DOM.lastUpdate) DOM.lastUpdate.textContent = data.lastUpdate || data.serverTime || '-';

            // =============================================
            // ✅ CALCULATE & UPDATE TRENDS
            // =============================================
            const trends = calculateTrends(data);
            updateTrendUI(trends);
            saveCurrentData(data);

            // Update percentages
            updateStatusPercentages(data);
            updateSLAPercentages(data);

            // Render Charts
            renderCategoryChart(data);
            renderReportChart(data);
            renderMonthlyChart(data.monthly || []);

            // Render Activity
            renderActivity(data.activity || []);

        } catch (error) {
            console.error('Dashboard error:', error);
            BCS.App.Toast.danger('Terjadi kesalahan saat memuat data');
        } finally {
            BCS.App.Loading.hide();
        }
    }

    // =============================================
    // REFRESH & AUTO REFRESH
    // =============================================
    let refreshInterval = null;

    function refresh() {
        loadDashboard();
        updateDateTime();
    }

    function startAutoRefresh() {
        if (refreshInterval) clearInterval(refreshInterval);
        refreshInterval = setInterval(refresh, 60000);
    }

    // =============================================
    // INIT
    // =============================================
    function init() {
        setDefaults();
        loadUser();
        updateDateTime();
        loadDashboard();
        startAutoRefresh();

        setInterval(updateDateTime, 1000);

        console.log('✅ Dashboard initialized with dynamic trends');
    }

    // Ekspos ke global
    window.DashboardController = {
        init,
        refresh
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
