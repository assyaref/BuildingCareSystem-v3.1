// assets/js/core/components/sidebar.js
// Sidebar Dinamis Premium UI - Match UI Design v4.3
// 🔥 Sesuai Gambar Referensi: ChatGPT Image 4 Jul 2026, 12.48.57.png (Teks GA Dihapus)

(function() {
    'use strict';

    console.log('🔄 Premium sidebar.js loaded matching mockup perfectly (General Affair removed)');

    const styleId = 'premium-sidebar-css';
    if (!document.getElementById(styleId)) {
        const css = `
            :root {
                --sb-sidebar-bg: #f8fafc;
                --sb-text-dark: #1e293b;
                --sb-text-muted: #64748b;
                --sb-active-bg: #e6f0ff;
                --sb-active-text: #2563eb;
                --sb-active-border: #2563eb;
            }
            [data-theme="dark"] {
                --sb-sidebar-bg: #111827;
                --sb-text-dark: #f9fafb;
                --sb-text-muted: #9ca3af;
                --sb-active-bg: rgba(37, 99, 235, 0.15);
                --sb-active-text: #3b82f6;
                --sb-active-border: #3b82f6;
            }
            
            .sidebar {
                width: 280px !important;
                background: var(--sb-sidebar-bg) !important;
                display: flex;
                flex-direction: column;
                height: 100vh;
                position: fixed;
                top: 0;
                left: 0;
                padding: 0 !important;
                box-shadow: 4px 0 25px rgba(0,0,0,0.02);
                border-right: 1px solid rgba(0,0,0,0.05);
                z-index: 1040;
                overflow: hidden;
            }

            /* 🌊 HEADER DENGAN GELOMBANG CEKUNG */
            .sb-header {
                padding: 40px 24px 60px 24px;
                text-align: center;
                position: relative;
                background: linear-gradient(135deg, #0d6efd 0%, #0044cc 100%);
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 280 120' preserveAspectRatio='none'%3E%3Cpath d='M0,0 L280,0 L280,80 C200,120 80,70 0,100 Z' fill='%230044cc'/%3E%3C/svg%3E");
                background-position: bottom center;
                background-size: 100% 45px;
                background-repeat: no-repeat;
                margin-bottom: 15px;
            }
            
            .sb-header::before {
                content: '';
                position: absolute;
                top: 0; left: 0; right: 0; bottom: 40px;
                background: linear-gradient(180deg, #0b5ed7 0%, #0044cc 100%);
                z-index: 0;
            }

            .sb-header-content {
                position: relative;
                z-index: 1;
            }

            .sb-logo-container {
                width: 85px;
                height: 85px;
                background: #ffffff;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 15px auto;
                box-shadow: 0 10px 20px rgba(0,0,0,0.12);
                padding: 5px;
            }
            .sb-logo-container img {
                width: 100%;
                height: 100%;
                object-fit: contain;
            }
            .sb-brand-title {
                color: #ffffff;
                font-size: 24px;
                font-weight: 700;
                margin: 0;
                letter-spacing: 0.5px;
            }
            .sb-brand-subtitle {
                color: rgba(255,255,255,0.8);
                font-size: 13px;
                font-weight: 500;
                margin-top: 4px;
            }

            /* BODY MENU */
            .sb-body {
                flex: 1;
                overflow-y: auto;
                padding: 10px 18px;
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            .sb-body::-webkit-scrollbar { width: 0px; }

            .sb-menu-item {
                display: flex;
                align-items: center;
                padding: 11px 16px;
                border-radius: 12px;
                text-decoration: none !important;
                color: var(--sb-text-muted) !important;
                font-weight: 600;
                font-size: 14px;
                transition: all 0.2s ease;
                border-left: 4px solid transparent;
            }
            .sb-menu-item:hover {
                background: rgba(0, 0, 0, 0.02);
                color: var(--sb-text-dark) !important;
            }
            [data-theme="dark"] .sb-menu-item:hover {
                background: rgba(255, 255, 255, 0.02);
            }

            .sb-icon-box {
                width: 32px;
                height: 32px;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 14px;
                font-size: 16px;
            }

            .sb-menu-label {
                flex: 1;
            }
            .sb-arrow {
                font-size: 13px;
                color: var(--sb-text-muted);
                opacity: 0.7;
            }

            /* 🎯 STATE ACTIVE */
            .sb-menu-item.active {
                background: var(--sb-active-bg) !important;
                color: var(--sb-active-text) !important;
                border-radius: 0 12px 12px 0;
                border-left: 4px solid var(--sb-active-border) !important;
                margin-left: -18px;
                padding-left: 30px;
            }
            .sb-menu-item.active .sb-arrow {
                display: none;
            }

            .sb-divider {
                height: 1px;
                background: rgba(0,0,0,0.05);
                margin: 15px 16px;
            }
            [data-theme="dark"] .sb-divider {
                background: rgba(255,255,255,0.07);
            }

            /* LOGOUT BOX */
            .sb-logout-box {
                padding: 5px 18px;
            }
            .sb-btn-logout {
                background: #fff5f5 !important;
                color: #ff3b30 !important;
                border-radius: 12px;
            }
            .sb-btn-logout .sb-icon-box {
                background: #ffe5e5 !important;
                color: #ff3b30 !important;
            }

            /* USER CARD FOOTER & 🌊 DEKORASI GELOMBANG BAWAH */
            .sb-footer {
                padding: 15px 18px 50px 18px;
                position: relative;
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 280 60' preserveAspectRatio='none'%3E%3Cpath d='M0,30 C100,10 180,50 280,20 L280,60 L0,60 Z' fill='%233b82f6' opacity='0.4'/%3E%3Cpath d='M0,40 C120,20 160,50 280,35 L280,60 L0,60 Z' fill='%230044cc'/%3E%3C/svg%3E");
                background-position: bottom center;
                background-size: 100% 50px;
                background-repeat: no-repeat;
            }
            .sb-user-card {
                background: #eef2f6;
                border-radius: 16px;
                padding: 14px 12px;
                display: flex;
                align-items: center;
                gap: 12px;
                position: relative;
                z-index: 2;
            }
            [data-theme="dark"] .sb-user-card {
                background: #1f2937;
            }
            .sb-avatar-wrapper {
                position: relative;
                width: 42px;
                height: 42px;
            }
            .sb-avatar {
                width: 100%;
                height: 100%;
                border-radius: 50%;
                background: #3b82f6;
                color: #ffffff;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 600;
                font-size: 15px;
            }
            .sb-status-dot {
                width: 11px;
                height: 11px;
                background: #22c55e;
                border: 2px solid #eef2f6;
                border-radius: 50%;
                position: absolute;
                bottom: -1px;
                right: -1px;
            }
            [data-theme="dark"] .sb-status-dot {
                border-color: #1f2937;
            }
            .sb-user-info {
                flex: 1;
                min-width: 0;
            }
            .sb-user-name {
                font-weight: 700;
                font-size: 14px;
                color: var(--sb-text-dark);
                margin: 0 0 4px 0;
                line-height: 1.2;
            }
            
            /* 🔥 Teks Department disembunyikan sepenuhnya */
            .sb-user-dept {
                display: none !important;
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
        const sidebarElement = document.querySelector('.sidebar');
        if (!sidebarElement) return;

        const session = getSession();
        let userName = 'John Doe';
        let userRole = 'ADMIN';

        if (session && session.user) {
            userName = session.user.nama || session.user.name || 'John Doe';
            userRole = session.user.role || 'ADMIN';
        }

        const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';

        const iconStyles = {
            'dashboard.html': { bg: '#e6f0ff', color: '#2563eb' },
            'report.html':    { bg: '#e6fbf4', color: '#10b981' },
            'monitoring.html':{ bg: '#f3e8ff', color: '#a855f7' },
            'history.html':   { bg: '#fef3c7', color: '#d97706' },
            'wo.html':        { bg: '#e0f2fe', color: '#0284c7' },
            'budget.html':    { bg: '#dcfce7', color: '#16a34a' },
            'approval.html':  { bg: '#e0e7ff', color: '#4f46e5' },
            'admin.html':     { bg: '#e0e7ff', color: '#2563eb' }
        };

        let mainMenus = [
            { href: 'dashboard.html', icon: 'bi-grid-fill', label: 'Dashboard' },
            { href: 'report.html', icon: 'bi-file-earmark-plus-fill', label: 'Report' },
            { href: 'monitoring.html', icon: 'bi-display-fill', label: 'Monitoring' },
            { href: 'history.html', icon: 'bi-clock-fill', label: 'History' },
            { divider: true },
            { href: 'wo.html', icon: 'bi-clipboard-check-fill', label: 'Work Order' },
            { href: 'budget.html', icon: 'bi-wallet2', label: 'Budget' },
            { href: 'approval.html', icon: 'bi-shield-check', label: 'Approval' },
            { divider: true },
            { href: 'admin.html', icon: 'bi-person-fill', label: 'Admin', hasChevron: true }
        ];

        let sidebarHTML = `
            <!-- HEADER WITH INNER CEKUNG WAVE -->
            <div class="sb-header">
                <div class="sb-header-content">
                    <div class="sb-logo-container">
                        <img src="assets/img/logo.png" onerror="this.src='https://i.ibb.co/VWVg0Ym/logo-placeholder.png'" alt="Logo">
                    </div>
                    <h5 class="sb-brand-title">Building Care</h5>
                    <div class="sb-brand-subtitle">Enterprise v4.3</div>
                </div>
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
            const chevronHTML = (menu.hasChevron && !activeClass) ? `<i class="bi bi-chevron-right sb-arrow"></i>` : '';
            
            sidebarHTML += `
                <a href="${menu.href}" class="sb-menu-item ${activeClass}">
                    <div class="sb-icon-box" style="background: ${styleConf.bg}; color: ${styleConf.color};">
                        <i class="bi ${menu.icon}"></i>
                    </div>
                    <span class="sb-menu-label">${menu.label}</span>
                    ${chevronHTML}
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
                        <div class="sb-avatar"><i class="bi bi-person-fill"></i></div>
                        <div class="sb-status-dot"></div>
                    </div>
                    <div class="sb-user-info">
                        <h6 class="sb-user-name">${userName}</h6>
                        <!-- 🔥 Sesuai Request: Teks Department Dihapus -->
                        <span class="sb-badge-role">${userRole}</span>
                    </div>
                    <i class="bi bi-chevron-down sb-chevron-down"></i>
                </div>
            </div>
        `;

        sidebarElement.innerHTML = sidebarHTML;

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                if (confirm('Apakah Anda yakin ingin keluar dari sistem?')) {
                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.href = 'login.html';
                }
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(renderSidebar, 50));
    } else {
        setTimeout(renderSidebar, 50);
    }
})();
