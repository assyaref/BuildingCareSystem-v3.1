// ======================================================
// Building Care System Enterprise v7.1
// dashboard.js - Dashboard Controller (Fix Data)
// Radiant Group Duri
// ======================================================

"use strict";

(function() {
    if (typeof BCS === 'undefined') {
        console.error('❌ BCS framework not loaded');
        return;
    }

    // =============================================
    // DOM REFS (ID sesuai dengan dashboard.html)
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
    // LOAD DASHBOARD DATA
    // =============================================
    async function loadDashboard() {
        try {
            BCS.App.Loading.show();

            // Gunakan action 'getSummary' (ada di Code.gs)
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

            // Recent Activity
            if (DOM.recentActivity && data.activity && data.activity.length > 0) {
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
                DOM.recentActivity.innerHTML = html;
            } else if (DOM.recentActivity) {
                DOM.recentActivity.innerHTML = '<div class="text-muted text-center py-3">Belum ada aktivitas</div>';
            }

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
        refreshInterval = setInterval(refresh, 60000); // setiap 60 detik
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

        // Update jam setiap detik
        setInterval(updateDateTime, 1000);

        console.log('✅ Dashboard initialized');
    }

    // Ekspos ke global
    window.DashboardController = {
        init,
        refresh
    };

    // Jalankan saat DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
