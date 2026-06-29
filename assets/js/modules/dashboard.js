// ======================================================
// Building Care System Enterprise v7.1
// dashboard.js - Dashboard Controller (Fix Data & Chart)
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
        lastLogin: document.getElementById('lastLogin')
    };

    // Chart instances
    let categoryChart = null;
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
            onlineUser: '1'
        };
        Object.keys(defaults).forEach(key => {
            if (DOM[key]) DOM[key].textContent = defaults[key];
        });
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
    // RENDER CATEGORY CHART (Pie/Doughnut)
    // =============================================
    function renderCategoryChart(data) {
        const ctx = document.getElementById('renderCategoryChart');
        if (!ctx) {
            console.warn('Category chart canvas not found');
            return;
        }

        const labels = ['AC', 'LISTRIK', 'KONDISI GEDUNG'];
        const values = [
            data.ac || 0,
            data.listrik || 0,
            data.bangunan || data.gedung || 0
        ];
        const colors = ['#06B6D4', '#FBBF24', '#7C3AED'];

        // Destroy existing chart
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
    // RENDER MONTHLY CHART (Line)
    // =============================================
    function renderMonthlyChart(monthlyData) {
        const ctx = document.getElementById('monthlyChart');
        if (!ctx) {
            console.warn('Monthly chart canvas not found');
            return;
        }

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const data = monthlyData || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

        // Destroy existing chart
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
            DOM.recentActivity.innerHTML = '<div class="text-muted text-center py-3">Belum ada aktivitas</div>';
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
                iconColor = '#16a34a';
            } else if (status === 'PROGRESS') {
                badgeClass = 'warning';
                icon = 'bi-arrow-repeat';
                iconColor = '#d97706';
            } else if (status === 'OPEN') {
                badgeClass = 'danger';
                icon = 'bi-folder2-open';
                iconColor = '#dc2626';
            }

            const waktu = item.waktu || item.tanggal || '';
            html += `
                <div class="activity-item d-flex justify-content-between align-items-center border-bottom py-2">
                    <div class="d-flex align-items-center gap-3">
                        <div class="activity-icon rounded-circle d-flex align-items-center justify-content-center" style="width:36px;height:36px;background:#f0f2f5;color:${iconColor};">
                            <i class="bi ${icon}"></i>
                        </div>
                        <div>
                            <strong style="font-size:14px;">${item.kategori || 'Report'}</strong>
                            <small class="d-block text-muted" style="font-size:12px;">${item.lokasi || ''}</small>
                            <small class="text-muted" style="font-size:11px;">${waktu}</small>
                        </div>
                    </div>
                    <span class="badge bg-${badgeClass}">${status}</span>
                </div>
            `;
        });
        DOM.recentActivity.innerHTML = html;
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

            // Render Charts
            renderCategoryChart(data);
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

        console.log('✅ Dashboard initialized with Charts');
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
