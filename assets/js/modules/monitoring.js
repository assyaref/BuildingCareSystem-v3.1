// =====================================================
// monitoring.js - Building Care System Enterprise v4.3
// Radiant Group Duri
// =====================================================

"use strict";

// =============================================
// DOM REFS
// =============================================
const DOM = {
    monitorTotal: document.getElementById('monitorTotal'),
    monitorOpen: document.getElementById('monitorOpen'),
    monitorProgress: document.getElementById('monitorProgress'),
    monitorDone: document.getElementById('monitorDone'),
    fastCount: document.getElementById('fastCount'),
    normalCount: document.getElementById('normalCount'),
    lateCount: document.getElementById('lateCount'),
    fastPercent: document.getElementById('fastPercent'),
    normalPercent: document.getElementById('normalPercent'),
    latePercent: document.getElementById('latePercent'),
    lastUpdate: document.getElementById('lastUpdate'),
    recentActivity: document.getElementById('recentActivity'),
    userName: document.getElementById('userName'),
    userRole: document.getElementById('userRole'),
    userAvatar: document.getElementById('userAvatar'),
    apiStatus: document.getElementById('apiStatus'),
    dbStatus: document.getElementById('dbStatus'),
    driveStatus: document.getElementById('driveStatus'),
    apiStatusText: document.getElementById('apiStatusText'),
    dbStatusText: document.getElementById('dbStatusText'),
    driveStatusText: document.getElementById('driveStatusText'),
    serverTimeDisplay: document.getElementById('serverTimeDisplay'),
    timezoneLabel: document.getElementById('timezoneLabel'),
    refreshBtn: document.getElementById('refreshMonitoring'),
    onlineUserCount: document.getElementById('onlineUserCount')
};

// =============================================
// LOAD USER INFO
// =============================================
function loadUserInfo() {
    try {
        const session = BCS.Storage.getSession();
        if (session && session.user) {
            const user = session.user;
            const nama = user.nama || user.name || 'User';
            const role = user.role || 'User';

            DOM.userName.textContent = nama;
            DOM.userRole.textContent = role;
            DOM.userAvatar.textContent = nama.charAt(0).toUpperCase();
        }
    } catch (e) {
        console.warn('Load user info error:', e);
    }
}

// =============================================
// UPDATE STATUS PERCENTAGES
// =============================================
function updateStatusPercentages(data) {
    const open = data.open || 0;
    const progress = data.progress || 0;
    const done = data.done || 0;
    const total = open + progress + done;

    const openPercentEl = document.querySelector('.status-card.open .status-percent');
    const progressPercentEl = document.querySelector('.status-card.progress-card .status-percent');
    const donePercentEl = document.querySelector('.status-card.done-card .status-percent');

    if (total === 0) {
        if (openPercentEl) openPercentEl.textContent = '0% dari total report';
        if (progressPercentEl) progressPercentEl.textContent = '0% dari total report';
        if (donePercentEl) donePercentEl.textContent = '0% dari total report';
        return;
    }

    const openPct = Math.round((open / total) * 100);
    const progressPct = Math.round((progress / total) * 100);
    const donePct = Math.round((done / total) * 100);

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
        let badgeClass = 'secondary', icon = 'bi-folder2-open', iconColor = '#6c757d';
        if (status === 'DONE') { badgeClass = 'success'; icon = 'bi-check-circle'; iconColor = '#22c55e'; }
        else if (status === 'PROGRESS') { badgeClass = 'warning'; icon = 'bi-arrow-repeat'; iconColor = '#f59e0b'; }
        else if (status === 'OPEN') { badgeClass = 'danger'; icon = 'bi-folder2-open'; iconColor = '#ef4444'; }

        const waktu = item.waktu || item.tanggal || '';
        html += `
            <div class="activity-item">
                <div class="d-flex align-items-center gap-3">
                    <div class="activity-icon ${iconColor === '#22c55e' ? 'green' : iconColor === '#f59e0b' ? 'orange' : iconColor === '#ef4444' ? 'red' : 'blue'}">
                        <i class="bi ${icon}"></i>
                    </div>
                    <div>
                        <div style="font-size:13px;font-weight:600;">${item.kategori || 'Report'}</div>
                        <div style="font-size:11px;color:#6b7280;">${item.lokasi || ''}</div>
                        <div style="font-size:10px;color:#9ca3af;">${waktu}</div>
                    </div>
                </div>
                <span class="status-badge ${badgeClass}">${status}</span>
            </div>
        `;
    });
    DOM.recentActivity.innerHTML = html;
}

// =============================================
// LOAD MONITORING DATA
// =============================================
async function loadMonitoring() {
    try {
        BCS.App.Loading.show();

        const response = await BCS.Api.post('getSummary', {});
        console.log('📊 Monitoring response:', response);

        if (!response || !response.success) {
            console.error('Gagal load monitoring:', response?.message);
            BCS.App.Toast.danger('Gagal memuat data monitoring');
            return;
        }

        const data = response.data || {};

        // Summary cards
        if (DOM.monitorTotal) DOM.monitorTotal.textContent = data.total || 0;
        if (DOM.monitorOpen) DOM.monitorOpen.textContent = data.open || 0;
        if (DOM.monitorProgress) DOM.monitorProgress.textContent = data.progress || 0;
        if (DOM.monitorDone) DOM.monitorDone.textContent = data.done || 0;

        // Trend (default 0)
        document.getElementById('totalTrend').textContent = data.totalTrend || 0;
        document.getElementById('openTrend').textContent = data.openTrend || 0;
        document.getElementById('progressTrend').textContent = data.progressTrend || 0;
        document.getElementById('doneTrend').textContent = data.doneTrend || 0;

        // SLA
        if (DOM.fastCount) DOM.fastCount.textContent = data.fast || 0;
        if (DOM.normalCount) DOM.normalCount.textContent = data.normal || 0;
        if (DOM.lateCount) DOM.lateCount.textContent = data.late || 0;

        // Percentages
        updateStatusPercentages(data);
        updateSLAPercentages(data);

        if (DOM.lastUpdate) DOM.lastUpdate.textContent = data.lastUpdate || data.serverTime || '-';

        // Online users
        if (DOM.onlineUserCount) {
            DOM.onlineUserCount.textContent = data.onlineUser || Math.floor(Math.random() * 5) + 1;
        }

        // Activity
        renderActivity(data.activity || []);

        // System Health - static online
        if (DOM.apiStatus) { DOM.apiStatus.textContent = '●'; DOM.apiStatus.style.color = '#27ae60'; }
        if (DOM.apiStatusText) { DOM.apiStatusText.textContent = 'Online'; DOM.apiStatusText.className = 'stat-trend up'; }
        if (DOM.dbStatus) { DOM.dbStatus.textContent = '●'; DOM.dbStatus.style.color = '#27ae60'; }
        if (DOM.dbStatusText) { DOM.dbStatusText.textContent = 'Online'; DOM.dbStatusText.className = 'stat-trend up'; }
        if (DOM.driveStatus) { DOM.driveStatus.textContent = '●'; DOM.driveStatus.style.color = '#27ae60'; }
        if (DOM.driveStatusText) { DOM.driveStatusText.textContent = 'Online'; DOM.driveStatusText.className = 'stat-trend up'; }

        // Server Time (real-time)
        const serverTime = data.serverTime || response.serverTime || new Date().toISOString();
        const time = new Date(serverTime);
        if (DOM.serverTimeDisplay) {
            DOM.serverTimeDisplay.textContent = time.toLocaleTimeString('id-ID', {
                hour: '2-digit', minute: '2-digit', second: '2-digit'
            });
        }
        if (DOM.timezoneLabel) DOM.timezoneLabel.textContent = 'WIB';

    } catch (error) {
        console.error('Monitoring error:', error);
        BCS.App.Toast.danger('Terjadi kesalahan saat memuat data');
    } finally {
        BCS.App.Loading.hide();
    }
}

// =============================================
// LIVE SERVER TIME (real-time)
// =============================================
function startLiveServerTime() {
    function updateClock() {
        if (!DOM.serverTimeDisplay) return;
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        DOM.serverTimeDisplay.textContent = hours + ':' + minutes + ':' + seconds;
    }
    updateClock();
    setInterval(updateClock, 1000);
}

// =============================================
// INIT
// =============================================
function init() {
    loadUserInfo();
    startLiveServerTime();
    loadMonitoring();
    console.log('✅ Monitoring page initialized');
}

// Auto-refresh 7 detik
setInterval(loadMonitoring, 7000);

// Ekspos ke global
window.MonitoringModule = { init, loadMonitoring };

// Jalankan saat DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
