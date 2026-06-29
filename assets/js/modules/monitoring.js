// =====================================================
// monitoring.js - Building Care System Enterprise v4.7 FINAL
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
    statusOpen: document.getElementById('statusOpen'),
    statusProgress: document.getElementById('statusProgress'),
    statusDone: document.getElementById('statusDone'),
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
    onlineUserCount: document.getElementById('onlineUserCount'),
    onlineCountBadge: document.getElementById('onlineCountBadge'),
    onlineUserList: document.getElementById('onlineUserList'),
    darkToggle: document.getElementById('darkModeToggle'),
    darkIcon: document.getElementById('darkModeIcon')
};

// =============================================
// DARK MODE
// =============================================
function initDarkMode() {
    if (!DOM.darkToggle) return;
    const savedTheme = localStorage.getItem('bcs_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateDarkIcon(savedTheme);

    DOM.darkToggle.addEventListener('click', function() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('bcs_theme', next);
        updateDarkIcon(next);
    });
}

function updateDarkIcon(theme) {
    if (!DOM.darkIcon) return;
    if (theme === 'dark') {
        DOM.darkIcon.className = 'bi bi-sun-fill';
        DOM.darkIcon.style.color = '#ffd700';
    } else {
        DOM.darkIcon.className = 'bi bi-moon-fill';
        DOM.darkIcon.style.color = '';
    }
}

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
            if (DOM.userName) DOM.userName.textContent = nama;
            if (DOM.userRole) DOM.userRole.textContent = role;
            if (DOM.userAvatar) DOM.userAvatar.textContent = nama.charAt(0).toUpperCase();
        }
    } catch (e) { console.warn('Load user info error:', e); }
}

// =============================================
// UPDATE STATUS & SLA PERCENTAGES
// =============================================
function updateStatusPercentages(data) {
    const open = data.open || 0, progress = data.progress || 0, done = data.done || 0;
    const total = open + progress + done;
    const els = {
        open: document.querySelector('.status-card.open .status-percent'),
        progress: document.querySelector('.status-card.progress-card .status-percent'),
        done: document.querySelector('.status-card.done-card .status-percent')
    };
    if (total === 0) {
        Object.values(els).forEach(el => { if (el) el.textContent = '0% dari total report'; });
        return;
    }
    if (els.open) els.open.textContent = Math.round((open/total)*100) + '% dari total report';
    if (els.progress) els.progress.textContent = Math.round((progress/total)*100) + '% dari total report';
    if (els.done) els.done.textContent = Math.round((done/total)*100) + '% dari total report';
}

function updateSLAPercentages(data) {
    const fast = data.fast || 0, normal = data.normal || 0, late = data.late || 0;
    const total = fast + normal + late;
    if (total === 0) {
        if (DOM.fastPercent) DOM.fastPercent.textContent = '0%';
        if (DOM.normalPercent) DOM.normalPercent.textContent = '0%';
        if (DOM.latePercent) DOM.latePercent.textContent = '0%';
        return;
    }
    if (DOM.fastPercent) DOM.fastPercent.textContent = Math.round((fast/total)*100) + '%';
    if (DOM.normalPercent) DOM.normalPercent.textContent = Math.round((normal/total)*100) + '%';
    if (DOM.latePercent) DOM.latePercent.textContent = Math.round((late/total)*100) + '%';
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
// RENDER ONLINE USERS - FALLBACK PASTI BERJALAN
// =============================================
function renderOnlineUsers(users) {
    if (!DOM.onlineUserList) return;

    // Ambil current user dari session (untuk fallback)
    let currentUser = null;
    try {
        const session = BCS.Storage.getSession();
        if (session && session.user) {
            const user = session.user;
            currentUser = {
                nama: user.nama || user.name || 'User',
                role: user.role || 'User',
                email: session.email || user.email || '',
                nik: session.nik || user.nik || '',
                lastActive: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                isCurrent: true
            };
            console.log('👤 Current user from session:', currentUser);
        }
    } catch (e) {
        console.warn('Gagal ambil session:', e);
    }

    // Jika users dari server kosong, gunakan current user
    let onlineUsers = [];
    if (users && users.length > 0) {
        onlineUsers = users;
    } else if (currentUser) {
        onlineUsers = [currentUser];
        console.log('ℹ️ Tidak ada data dari server, gunakan current user');
    } else {
        console.warn('⚠️ Tidak ada user online dan tidak ada session');
    }

    // Update badge & counter
    if (DOM.onlineCountBadge) DOM.onlineCountBadge.textContent = onlineUsers.length;
    if (DOM.onlineUserCount) DOM.onlineUserCount.textContent = onlineUsers.length;

    if (onlineUsers.length === 0) {
        DOM.onlineUserList.innerHTML = '<div class="col-12 text-center text-muted py-3">Tidak ada user online</div>';
        return;
    }

    // Tandai current user
    let currentEmail = '';
    try {
        const session = BCS.Storage.getSession();
        currentEmail = session?.user?.email || session?.email || '';
    } catch (e) {}

    let html = '';
    onlineUsers.slice(0, 6).forEach(user => {
        const initial = (user.nama || 'U').charAt(0).toUpperCase();
        const isCurrent = user.email && user.email === currentEmail;
        const avatarClass = isCurrent ? 'current' : 'other';
        html += `
            <div class="col-xl-3 col-lg-4 col-md-6 col-sm-6">
                <div class="d-flex align-items-center p-3 rounded-3 online-user-item">
                    <div class="avatar-online ${avatarClass}">${initial}</div>
                    <div class="ms-3 flex-grow-1">
                        <div class="fw-semibold" style="font-size: 14px; color: var(--text-primary);">${user.nama || 'User'}</div>
                        <div class="text-muted" style="font-size: 12px;">${user.role || 'User'}</div>
                        <div class="d-flex align-items-center gap-1 mt-1">
                            <span class="badge bg-success" style="font-size: 8px; padding: 2px 8px; border-radius: 10px;">
                                <span class="live-dot" style="width:6px;height:6px;display:inline-block;margin-right:4px;"></span> Online
                            </span>
                            <span class="text-muted" style="font-size: 9px;">${user.lastActive || ''}</span>
                            ${isCurrent ? '<span class="badge bg-primary" style="font-size: 8px; padding: 2px 6px;">Anda</span>' : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    DOM.onlineUserList.innerHTML = html;
    console.log('✅ Online users rendered:', onlineUsers.length);
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
        if (DOM.statusOpen) DOM.statusOpen.textContent = data.open || 0;
        if (DOM.statusProgress) DOM.statusProgress.textContent = data.progress || 0;
        if (DOM.statusDone) DOM.statusDone.textContent = data.done || 0;

        // Trend
        ['totalTrend','openTrend','progressTrend','doneTrend'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = data[id.replace('Trend','')] || 0;
        });

        // SLA
        if (DOM.fastCount) DOM.fastCount.textContent = data.fast || 0;
        if (DOM.normalCount) DOM.normalCount.textContent = data.normal || 0;
        if (DOM.lateCount) DOM.lateCount.textContent = data.late || 0;

        updateStatusPercentages(data);
        updateSLAPercentages(data);

        if (DOM.lastUpdate) DOM.lastUpdate.textContent = data.lastUpdate || data.serverTime || '-';

        renderActivity(data.activity || []);

        // System Health (online)
        ['api','db','drive'].forEach(type => {
            const statusEl = DOM[type + 'Status'];
            const textEl = DOM[type + 'StatusText'];
            if (statusEl) { statusEl.textContent = '●'; statusEl.style.color = '#27ae60'; }
            if (textEl) { textEl.textContent = 'Online'; textEl.className = 'stat-trend up'; }
        });

        // Server Time
        const serverTime = data.serverTime || response.serverTime || new Date().toISOString();
        const time = new Date(serverTime);
        if (DOM.serverTimeDisplay) {
            DOM.serverTimeDisplay.textContent = time.toLocaleTimeString('id-ID', {
                hour: '2-digit', minute: '2-digit', second: '2-digit'
            });
        }
        if (DOM.timezoneLabel) DOM.timezoneLabel.textContent = 'WIB';

        // 🔥 USER ONLINE - langsung dari data getSummary
        const activeUsers = data.activeUsers || [];
        console.log('👥 Active users from getSummary:', activeUsers);
        // Kirim ke renderOnlineUsers (fallback otomatis jika kosong)
        renderOnlineUsers(activeUsers);

        // Render charts (jika ada)
        renderCharts(data);

    } catch (error) {
        console.error('Monitoring error:', error);
        BCS.App.Toast.danger('Terjadi kesalahan saat memuat data');
    } finally {
        BCS.App.Loading.hide();
    }
}

// =============================================
// RENDER CHARTS (sederhana)
// =============================================
function renderCharts(data) {
    // Implementasi chart (jika diperlukan)
    console.log('📊 Charts can be rendered here if needed.');
}

// =============================================
// LIVE SERVER TIME
// =============================================
function startLiveServerTime() {
    function updateClock() {
        if (!DOM.serverTimeDisplay) return;
        const now = new Date();
        DOM.serverTimeDisplay.textContent = now.toLocaleTimeString('id-ID', {
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    }
    updateClock();
    setInterval(updateClock, 1000);
}

// =============================================
// AUTO-REFRESH
// =============================================
let refreshTimer = 7;
let refreshInterval = null;
let timerInterval = null;

function updateTimerDisplay() {
    const el = document.getElementById('refreshTimer');
    if (el) el.textContent = refreshTimer;
}

function startAutoRefresh() {
    if (refreshInterval) clearInterval(refreshInterval);
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        refreshTimer--;
        if (refreshTimer <= 0) refreshTimer = 7;
        updateTimerDisplay();
    }, 1000);
    refreshInterval = setInterval(() => {
        loadMonitoring();
        refreshTimer = 7;
        updateTimerDisplay();
    }, 7000);
    updateTimerDisplay();
}

function stopAutoRefresh() {
    if (refreshInterval) clearInterval(refreshInterval);
    if (timerInterval) clearInterval(timerInterval);
}

// =============================================
// LOGOUT
// =============================================
document.addEventListener('click', function(e) {
    if (e.target && e.target.id === 'logoutBtn') {
        e.preventDefault();
        if (window.auth && typeof window.auth.logout === 'function') {
            window.auth.logout();
        } else {
            if (confirm('Apakah Anda yakin ingin keluar?')) {
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = 'login.html';
            }
        }
    }
});

// =============================================
// INIT
// =============================================
function init() {
    initDarkMode();
    loadUserInfo();
    startLiveServerTime();
    loadMonitoring();
    startAutoRefresh();
    console.log('✅ Monitoring page initialized (v4.7 FINAL)');
}

window.addEventListener('beforeunload', stopAutoRefresh);

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Ekspos ke global
window.MonitoringModule = { init, loadMonitoring };
