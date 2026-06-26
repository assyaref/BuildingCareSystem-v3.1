// ======================================================
// Building Care System Enterprise v7.1
// dashboard.js - Dashboard Controller (Fixed)
// ======================================================

"use strict";

(function() {
    if (typeof BCS === 'undefined') {
        console.error('BCS framework not loaded');
        return;
    }

    // DOM elements
    const elements = {
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

    // Default values
    function setDefaultValues() {
        if (elements.totalReport) elements.totalReport.textContent = '0';
        if (elements.acTotal) elements.acTotal.textContent = '0';
        if (elements.listrikTotal) elements.listrikTotal.textContent = '0';
        if (elements.gedungTotal) elements.gedungTotal.textContent = '0';
        if (elements.totalOpen) elements.totalOpen.textContent = '0';
        if (elements.totalProgress) elements.totalProgress.textContent = '0';
        if (elements.totalDone) elements.totalDone.textContent = '0';
        if (elements.fastCount) elements.fastCount.textContent = '0';
        if (elements.normalCount) elements.normalCount.textContent = '0';
        if (elements.lateCount) elements.lateCount.textContent = '0';
        if (elements.todayReport) elements.todayReport.textContent = '0';
        if (elements.pendingApproval) elements.pendingApproval.textContent = '0';
        if (elements.onlineUser) elements.onlineUser.textContent = '1';
    }

    // Load user info from session
    function loadUserInfo() {
        try {
            const session = BCS.Storage.getSession();
            if (session && session.user) {
                const user = session.user;
                if (elements.userName) {
                    elements.userName.textContent = user.nama || user.name || 'User';
                }
                if (elements.userNik) {
                    elements.userNik.textContent = session.nik || user.nik || '-';
                }
                if (elements.userRole) {
                    elements.userRole.textContent = user.role || 'User';
                }
                if (elements.lastLogin) {
                    elements.lastLogin.textContent = user.lastLogin || '-';
                }
            }
        } catch (e) {
            console.warn('Load user info error:', e);
        }
    }

    // Update date & time
    function updateDateTime() {
        const now = new Date();
        if (elements.todayDate) {
            elements.todayDate.textContent = now.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        }
        if (elements.currentTime) {
            elements.currentTime.textContent = now.toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        }
    }

    // Fetch dashboard data
    async function loadDashboard() {
        try {
            BCS.App.Loading.show();

            // ✅ Use getSummary action (available in Code.gs)
            const response = await BCS.Api.post('getSummary', {});
            console.log('Dashboard response:', response);

            if (!response || !response.success) {
                console.error('Failed to load dashboard:', response?.message);
                BCS.App.Toast.danger('Gagal memuat data dashboard');
                return;
            }

            const data = response.data || {};

            // Update all stats
            if (elements.totalReport) elements.totalReport.textContent = data.total || 0;
            if (elements.acTotal) elements.acTotal.textContent = data.ac || 0;
            if (elements.listrikTotal) elements.listrikTotal.textContent = data.listrik || 0;
            if (elements.gedungTotal) elements.gedungTotal.textContent = data.bangunan || data.gedung || 0;

            if (elements.totalOpen) elements.totalOpen.textContent = data.open || 0;
            if (elements.totalProgress) elements.totalProgress.textContent = data.progress || 0;
            if (elements.totalDone) elements.totalDone.textContent = data.done || 0;

            if (elements.fastCount) elements.fastCount.textContent = data.fast || 0;
            if (elements.normalCount) elements.normalCount.textContent = data.normal || 0;
            if (elements.lateCount) elements.lateCount.textContent = data.late || 0;

            if (elements.todayReport) elements.todayReport.textContent = data.todayReport || 0;
            if (elements.pendingApproval) elements.pendingApproval.textContent = data.pendingApproval || 0;
            if (elements.onlineUser) elements.onlineUser.textContent = data.onlineUser || 1;

            if (elements.lastUpdate) elements.lastUpdate.textContent = data.lastUpdate || data.serverTime || '-';

            // Recent activity
            if (elements.recentActivity && data.activity && data.activity.length > 0) {
                let html = '';
                data.activity.forEach(item => {
                    const statusClass = item.status === 'DONE' ? 'success' : 
                                       item.status === 'PROGRESS' ? 'warning' : 'secondary';
                    html += `
                        <div class="activity-item d-flex justify-content-between align-items-center border-bottom py-2">
                            <div>
                                <strong>${item.kategori || 'Report'}</strong>
                                <small class="d-block text-muted">${item.lokasi || ''}</small>
                                <small class="text-muted">${item.tanggal || ''} ${item.waktu || ''}</small>
                            </div>
                            <span class="badge bg-${statusClass}">${item.status || 'OPEN'}</span>
                        </div>
                    `;
                });
                elements.recentActivity.innerHTML = html;
            } else if (elements.recentActivity) {
                elements.recentActivity.innerHTML = '<div class="text-muted text-center py-3">Belum ada aktivitas</div>';
            }

        } catch (error) {
            console.error('Load dashboard error:', error);
            BCS.App.Toast.danger('Terjadi kesalahan saat memuat data');
        } finally {
            BCS.App.Loading.hide();
        }
    }

    // Auto refresh every 60 seconds
    let refreshInterval = null;

    function startAutoRefresh() {
        if (refreshInterval) clearInterval(refreshInterval);
        refreshInterval = setInterval(() => {
            loadDashboard();
            updateDateTime();
        }, 60000);
    }

    // Initialize
    function init() {
        setDefaultValues();
        loadUserInfo();
        updateDateTime();
        loadDashboard();
        startAutoRefresh();

        // Update time every second
        setInterval(updateDateTime, 1000);

        console.log('Dashboard initialized');
    }

    // Run when DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
