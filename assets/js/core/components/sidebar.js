// assets/js/components/sidebar.js
// Sidebar Dinamis Premium UI - Match UI Design v4.3

(function() {
    'use strict';

    console.log('🔄 Premium sidebar.js loaded');

    // Injeksi CSS langsung agar style sidebar konsisten di semua halaman tanpa merusak dashboard.css
    const styleId = 'premium-sidebar-css';
    if (!document.getElementById(styleId)) {
        const css = `
            :root {
                --sb-bg-gradient: linear-gradient(185deg, #0b5ed7 0%, #0044cc 25%, #f8fafc 25.1%, #f8fafc 100%);
                --sb-text-dark: #334155;
                --sb-text-muted: #64748b;
                --sb-active-bg: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            }
            [data-theme="dark"] {
                --sb-bg-gradient: linear-gradient(185deg, #1e293b 0%, #0f172a 25%, #1e293b 25.1%, #1e293b 100%);
                --sb-text-dark: #f1f5f9;
                --sb-text-muted: #94a3b8;
                --sb-active-bg: linear-gradient(135deg, #475569 0%, #1e293b 100%);
            }
            
            .sidebar {
                width: 280px !important;
                background: var(--sb-bg-gradient) !important;
                display: flex;
                flex-direction: column;
                height: 100vh;
                position: fixed;
                top: 0;
                left: 0;
                padding: 0 !important;
                box-shadow: 4px 0 25px rgba(0,0,0,0.05);
                border-right: 1px solid rgba(0,0,0,0.05);
                z-index: 1040;
                overflow: hidden;
            }

            .sb-header {
                padding: 30px 24px 40px 24px;
                text-align: center;
                position: relative;
            }
            .sb-logo-container {
                width: 75px;
                height: 75px;
                background: #ffffff;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 15px auto;
                box-shadow: 0 8px 16px rgba(0,0,0,0.1);
            }
            .sb-logo-container img {
                width: 52px;
                height: 52px;
                object-fit: contain;
            }
            .sb-brand-title {
                color: #ffffff;
                font-size: 22px;
                font-weight: 700;
                margin: 0;
                letter-spacing: 0.5px;
            }
            .sb-brand-subtitle {
                color: rgba(255,255,255,0.75);
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 2px;
                margin-top: 4px;
            }

            .sb-body {
                flex: 1;
                overflow-y: auto;
                padding: 10px 20px;
                display: flex;
                flex-direction: column;
                gap: 6px;
            }
            
            /* Sembunyikan scrollbar internal */
            .sb-body::-webkit-scrollbar { width: 0px; }

            .sb-menu-item {
                display: flex;
                align-items: center;
                padding: 10px 14px;
                border-radius: 14px;
                text-decoration: none !important;
                color: var(--sb-text-dark) !important;
                font-weight: 500;
                font-size: 14px;
                transition: all 0.25s ease;
                margin-bottom: 2px;
            }
            .sb-menu-item:hover {
                background: rgba(0,0,0,0.03);
                transform: translateX(3px);
            }
            [data-theme="dark"] .sb-menu-item:hover {
                background: rgba(255,255,255,0.03);
            }

            .sb-icon-box {
                width: 38px;
                height: 38px;
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 14px;
                font-size: 18px;
                transition: all 0.25s ease;
            }

            .sb-menu-label {
                flex: 1;
            }
            .sb-arrow {
                font-size: 12px;
                color: var(--sb-text-muted);
                transition: all 0.25s ease;
            }

            /* State Active Link */
            .sb-menu-item.active {
                background: var(--sb-active-bg) !important;
                color: #ffffff !important;
                box-shadow: 0 8px 20px rgba(29, 68, 204, 0.25);
            }
            .sb-menu-item.active .sb-icon-box {
                background: rgba(255, 255, 255, 0.2) !important;
                color: #ffffff !important;
            }
            .sb-menu-item.active .sb-arrow {
                color: #ffffff !important;
                transform: translateX(2px);
            }

            .sb-divider {
                height: 1px;
                background: rgba(0,0,0,0.06);
                margin: 12px 14px;
            }
            [data-theme="dark"] .sb-divider {
                background: rgba(255,255,255,0.08);
            }

            /* Modifikasi Khusus Logout Group */
            .sb-logout-box {
                padding: 5px 20px;
            }
            .sb-btn-logout {
                background: #fff5f5 !important;
                color: #ff3b30 !important;
                border-radius: 14px;
            }
            .sb-btn-logout .sb-icon-box {
                background: #ffe5e5 !important;
                color: #ff3b30 !important;
            }
            [data-theme="dark"] .sb-btn-logout {
                background: rgba(255, 59, 48, 0.1) !important;
                color: #ff6b6b !important;
            }
            [data-theme="dark"] .sb-btn-logout .sb-icon-box {
                background: rgba(255, 59, 48, 0.15) !important;
                color: #ff6b6b !important;
            }

            /* User Profile Card Footer */
            .sb-footer {
                padding: 20px;
            }
            .sb-user-card {
                background: #f1f5f9;
                border: 1px solid rgba(0,0,0,0.04);
                border-radius: 20px;
                padding: 14px;
                display: flex;
                align-items: center;
                gap: 12px;
                position: relative;
            }
            [data-theme="dark"] .sb-user-card {
                background: #0f172a;
                border-color: rgba(255,255,255,0.05);
            }
            .sb-avatar-wrapper {
                position: relative;
                width: 46px;
                height: 46px;
            }
            .sb-avatar {
                width: 100%;
                height: 100%;
                border-radius: 50%;
                background: #dbeafe;
                color: #2563eb;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 600;
                font-size: 16px;
            }
            .sb-status-dot {
                width: 12px;
                height: 12px;
                background: #22c55e;
                border: 2px solid #f1f5f9;
                border-radius: 50%;
                position: absolute;
                bottom: 0;
                right: 0;
            }
            [data-theme="dark"] .sb-status-dot {
                border-color: #0f172a;
            }
            .sb-user-info {
                flex: 1;
                min-width: 0;
            }
            .sb-user-name {
                font-weight: 600;
                font-size: 14px;
                color: var(--sb-text-dark);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                margin: 0;
                line-height: 1.2;
            }
            .sb-user-dept {
                font-size: 11px;
                color: var(--sb-text-muted);
                margin: 2px 0 4px 0;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .sb-badge-role {
                background: #3b82f6;
                color: #ffffff;
                font-size: 9px;
                font-weight: 700;
                padding: 1px 6px;
                border-radius: 4px;
                display: inline-block;
                text-transform: uppercase;
            }
            .sb-chevron-down {
                color: var(--sb-text-muted);
                font-size: 14px;
            }

            /* Adjust konten utama aplikasi agar tidak tertutup sidebar baru */
            .content {
                margin-left: 280px !important;
                width: calc(100% - 280px) !important;
            }
            @media (max-width: 991.98px) {
                .sidebar { transform: translateX(-100%); transition: transform 0.3s ease; }
                .sidebar.open { transform: translateX(0); }
                .content { margin-left: 0 !important; width: 100% !important; }
            }
        `;
        const styleSheet = document.createElement("style");
        styleSheet.id = styleId;
        styleSheet.innerText = css;
        document.head.appendChild(styleSheet);
    }

    function getSession() {
        try {
            if (typeof BCS !== 'undefined' && BCS.Storage && typeof BCS.Storage.getSession === 'function') {
                return BCS.Storage.getSession();
            }
        } catch (e) {}
        try {
            const raw = localStorage.getItem('bcs_session');
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return null;
    }

    function renderSidebar() {
        console.log('📌 Rendering Premium Sidebar Design...');

        const sidebarElement = document.querySelector('.sidebar');
        if (!sidebarElement) {
            console.warn('❌ Element .sidebar tidak ditemukan di halaman ini.');
            return;
        }

        const session = getSession();
        let isAdmin = false;
        let userName = 'John Doe';
        let userRole = 'USER';
        let userDept = 'General Affair';

        if (session && session.user) {
            const role = (session.user.role || '').toUpperCase();
            isAdmin = (role === 'ADMINISTRATOR');
            userName = session.user.nama || session.user.name || 'User';
            userRole = session.user.role || 'USER';
            userDept = session.user.divisi || session.user.department || 'General Affair';
        } else {
            console.warn('⚠️ Sesi tidak aktif, arahkan ke login');
            if (window.location.pathname.indexOf('login.html') === -1) {
                window.location.href = 'login.html';
            }
            return;
        }

        const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';

        // Definisi skema warna ikon sesuai UI Mockup Image
        const iconStyles = {
            'dashboard.html': { bg: '#e6f0ff', color: '#2563eb' },
            'report.html':    { bg: '#e6fbf4', color: '#10b981' },
            'monitoring.html':{ bg: '#f3e8ff', color: '#a855f7' },
            'history.html':   { bg: '#fef3c7', color: '#d97706' },
            'wo.html':        { bg: '#e0f2fe', color: '#0284c7' },
            'budget.html':    { bg: '#dcfce7', color: '#16a34a' },
            'approval.html':  { bg: '#e0e7ff', color: '#4f46e5' },
            'admin.html':     { bg: '#ffe4e6', color: '#f43f5e' }
        };

        // Set list menu berdasarkan Role Akses
        let mainMenus = [];
        if (isAdmin) {
            mainMenus = [
                { href: 'dashboard.html', icon: 'bi-grid-fill', label: 'Dashboard' },
                { href: 'report.html', icon: 'bi-file-earmark-plus-fill', label: 'Report' },
                { href: 'monitoring.html', icon: 'bi-display-fill', label: 'Monitoring' },
                { href: 'history.html', icon: 'bi-clock-fill', label: 'History' },
                { divider: true },
                { href: 'wo.html', icon: 'bi-clipboard-check-fill', label: 'Work Order' },
                { href: 'budget.html', icon: 'bi-wallet2', label: 'Budget' },
                { href: 'approval.html', icon: 'bi-shield-check', label: 'Approval' },
                { divider: true },
                { href: 'admin.html', icon: 'bi-person-badge-fill', label: 'Admin' }
            ];
        } else {
            mainMenus = [
                { href: 'user-report.html', icon: 'bi-file-earmark-plus-fill', label: 'Buat Laporan' },
                { href: 'user-history.html', icon: 'bi-clock-fill', label: 'Riwayat Saya' }
            ];
        }

        // Generate Struktur HTML Baru Penuh
        let sidebarHTML = `
            <!-- HEADER -->
            <div class="sb-header">
                <div class="sb-logo-container">
                    <img src="assets/img/logo.png" onerror="this.src='https://cdn-icons-png.flaticon.com/512/3068/3068635.png'" alt="Logo">
                </div>
                <h5 class="sb-brand-title">Building Care</h5>
                <div class="sb-brand-subtitle">Enterprise v4.3</div>
            </div>

            <!-- MENU BODY -->
            <div class="sb-body">
        `;

        mainMenus.forEach(menu => {
            if (menu.divider) {
                sidebarHTML += `<div class="sb-divider"></div>`;
                return;
            }

            const activeClass = (currentPage === menu.href) ? 'active' : '';
            const styleConf = iconStyles[menu.href] || { bg: '#f1f5f9', color: '#64748b' };
            
            sidebarHTML += `
                <a href="${menu.href}" class="sb-menu-item ${activeClass}">
                    <div class="sb-icon-box" style="background: ${styleConf.bg}; color: ${styleConf.color};">
                        <i class="bi ${menu.icon}"></i>
                    </div>
                    <span class="sb-menu-label">${menu.label}</span>
                    <i class="bi bi-chevron-right sb-arrow"></i>
                </a>
            `;
        });

        sidebarHTML += `
            </div>

            <!-- LOGOUT BOX -->
            <div class="sb-logout-box">
                <a href="#" id="logoutBtn" class="sb-menu-item sb-btn-logout">
                    <div class="sb-icon-box">
                        <i class="bi bi-box-arrow-right"></i>
                    </div>
                    <span class="sb-menu-label">Logout</span>
                </a>
            </div>

            <!-- FOOTER USER CARD -->
            <div class="sb-footer">
                <div class="sb-user-card">
                    <div class="sb-avatar-wrapper">
                        <div class="sb-avatar">${userName.charAt(0).toUpperCase()}</div>
                        <div class="sb-status-dot"></div>
                    </div>
                    <div class="sb-user-info">
                        <h6 class="sb-user-name">${userName}</h6>
                        <div class="sb-user-dept">${userDept}</div>
                        <span class="sb-badge-role">${userRole}</span>
                    </div>
                    <i class="bi bi-chevron-down sb-chevron-down"></i>
                </div>
            </div>
        `;

        // Tulis ulang seluruh isi komponen .sidebar
        sidebarElement.innerHTML = sidebarHTML;
        console.log('✅ Premium Sidebar UI Overwritten successfully.');

        // Sinkronisasi data ke komponen topbar luar jika ada
        try {
            const userNameEl = document.getElementById('userName');
            const userRoleEl = document.getElementById('userRole');
            if (userNameEl) userNameEl.textContent = userName;
            if (userRoleEl) userRoleEl.textContent = userRole;
        } catch (e) {}

        // Pasang Event handler Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                if (window.auth && typeof window.auth.logout === 'function') {
                    window.auth.logout();
                } else {
                    if (confirm('Apakah Anda yakin ingin keluar dari sistem?')) {
                        localStorage.clear();
                        sessionStorage.clear();
                        window.location.href = 'login.html';
                    }
                }
            });
        }
    }

    // Inisialisasi Eksekusi Aman
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(renderSidebar, 150));
    } else {
        setTimeout(renderSidebar, 150);
    }

    // Interval checking jika data session datang terlambat
    let checkCount = 0;
    const sessionInterval = setInterval(() => {
        checkCount++;
        const session = getSession();
        if (session && session.user) {
            clearInterval(sessionInterval);
            renderSidebar();
        }
        if (checkCount > 15) clearInterval(sessionInterval); 
    }, 300);

})();
