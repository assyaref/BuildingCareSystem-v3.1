// assets/js/core/components/sidebar.js
// Sidebar Dinamis Premium UI - Match UI Design v4.3 (Updated)
// 🔥 Custom Premium Toast Confirmation for Logout
// 📱 Mobile Responsive: Topbar dengan menu horizontal langsung terlihat
// ✨ User Card Premium dengan Glassmorphism + Inisial Avatar

(function() {
    'use strict';

    console.log('🔄 Premium sidebar.js loaded with Mobile Topbar (all menus on top)');

    const styleId = 'premium-sidebar-css';
    if (!document.getElementById(styleId)) {
        const css = `
            :root {
                --sb-sidebar-bg: #ffffff;
                --sb-text-dark: #475569;
                --sb-text-muted: #64748b;
                --sb-active-gradient: linear-gradient(90deg, #2563eb 0%, #1d4ed8 100%);
                --sb-active-shadow: rgba(37, 99, 235, 0.2);
                --sb-card-bg: #ffffff;
                --sb-card-border: rgba(0, 0, 0, 0.04);
            }
            [data-theme="dark"] {
                --sb-sidebar-bg: #111827;
                --sb-text-dark: #f9fafb;
                --sb-text-muted: #9ca3af;
                --sb-active-gradient: linear-gradient(90deg, #2563eb 0%, #1e40af 100%);
                --sb-active-shadow: rgba(37, 99, 235, 0.4);
                --sb-card-bg: rgba(31, 41, 55, 0.8);
                --sb-card-border: rgba(55, 65, 81, 0.4);
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
                box-shadow: 4px 0 25px rgba(0,0,0,0.01);
                border-right: 1px solid rgba(0,0,0,0.03);
                z-index: 1040;
                overflow: hidden;
                font-family: 'Inter', sans-serif;
            }

            /* 🌊 HEADER DENGAN GELOMBANG HALUS SESUAI GAMBAR */
            .sb-header {
                padding: 40px 24px 50px 24px;
                text-align: center;
                position: relative;
                background: #0056e0;
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 280 40' preserveAspectRatio='none'%3E%3Cpath d='M0,0 Q140,40 280,0 L280,40 L0,40 Z' fill='%23ffffff'/%3E%3C/svg%3E");
                background-position: bottom center;
                background-size: 100% 25px;
                background-repeat: no-repeat;
                margin-bottom: 25px;
            }
            
            .sb-header-content {
                position: relative;
                z-index: 1;
            }

            .sb-logo-container {
                width: 90px;
                height: 90px;
                background: #ffffff;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 15px auto;
                box-shadow: 0 4px 15px rgba(0,0,0,0.08);
                padding: 6px;
            }
            .sb-logo-container img {
                width: 100%;
                height: 100%;
                object-fit: contain;
            }
            .sb-brand-title {
                color: #ffffff;
                font-size: 26px;
                font-weight: 700;
                margin: 0;
                letter-spacing: -0.02em;
            }
            .sb-brand-subtitle {
                color: rgba(255,255,255,0.75);
                font-size: 14px;
                font-weight: 400;
                margin-top: 4px;
            }

            /* USER MOBILE (hanya muncul di HP) */
            .sb-user-mobile {
                display: none;
                color: rgba(255,255,255,0.9);
                font-size: 12px;
                font-weight: 600;
                margin-left: 8px;
                white-space: nowrap;
            }

            /* BODY MENU */
            .sb-body {
                flex: 1;
                overflow-y: auto;
                padding: 10px 24px;
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            .sb-body::-webkit-scrollbar { width: 0px; }

            .sb-menu-item {
                display: flex;
                align-items: center;
                padding: 14px 16px;
                border-radius: 16px;
                text-decoration: none !important;
                color: var(--sb-text-dark) !important;
                font-weight: 600;
                font-size: 15px;
                transition: all 0.2s ease;
                position: relative;
            }
            .sb-menu-item:hover:not(.active) {
                background: rgba(0, 0, 0, 0.02);
                color: #1e293b !important;
            }

            /* KOTAK IKON DENGAN WARNA SESUAI GAMBAR CONTOH */
            .sb-icon-box {
                width: 40px;
                height: 40px;
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 16px;
                font-size: 18px;
                transition: all 0.2s ease;
            }

            .sb-menu-label {
                flex: 1;
            }
            .sb-arrow {
                font-size: 14px;
                color: var(--sb-text-muted);
                opacity: 0.4;
            }

            /* 🎯 STATE ACTIVE (PERSIS GAMBAR CONTOH) */
            .sb-menu-item.active {
                background: #2563eb !important;
                color: #ffffff !important;
                box-shadow: 0 10px 25px rgba(37, 99, 235, 0.25);
            }
            .sb-menu-item.active .sb-icon-box {
                background: #ffffff !important;
                color: #2563eb !important;
            }
            .sb-menu-item.active .sb-arrow {
                color: #ffffff !important;
                opacity: 1;
            }
            /* Garis Indikator Oranye Vertikal di Kiri Luar Item Aktif */
            .sb-menu-item.active::before {
                content: '';
                position: absolute;
                left: -16px;
                top: 15%;
                height: 70%;
                width: 6px;
                background: #f59e0b;
                border-radius: 0 4px 4px 0;
            }

            /* LOGOUT ITEM */
            .logout-item {
                color: #ff3b30 !important;
            }
            .logout-item .sb-icon-box {
                background: #ffe5e5 !important;
                color: #ff3b30 !important;
            }

            .sb-divider {
                height: 1px;
                background: rgba(0,0,0,0.04);
                margin: 6px 0;
            }

            /* ================================================================
               ✨ USER CARD FOOTER (Sesuai Layout Gambar Contoh)
               ================================================================ */
            .sb-footer {
                padding: 20px 24px 30px 24px;
                position: relative;
                background: transparent;
            }

            .sb-user-card {
                background: #f8fafc;
                border: 1px solid rgba(0,0,0,0.02);
                border-radius: 24px;
                padding: 12px;
                display: flex;
                align-items: center;
                gap: 12px;
                position: relative;
                z-index: 2;
                box-shadow: 0 4px 12px rgba(0,0,0,0.02);
            }

            .sb-avatar-wrapper {
                position: relative;
                flex-shrink: 0;
                width: 46px;
                height: 46px;
            }
            .sb-avatar {
                width: 100%;
                height: 100%;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 700;
                font-size: 16px;
                color: #ffffff;
                background: #2563eb;
                text-transform: uppercase;
            }

            .sb-status-dot {
                width: 12px;
                height: 12px;
                background: #22c55e;
                border: 2px solid #ffffff;
                border-radius: 50%;
                position: absolute;
                bottom: -1px;
                right: -1px;
            }

            .sb-user-info {
                flex: 1;
                min-width: 0;
            }
            .sb-user-name {
                font-weight: 700;
                font-size: 15px;
                color: #1e293b;
                margin: 0 0 4px 0;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .sb-user-role-wrap {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            .sb-badge-role {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                background: #2563eb;
                color: #ffffff;
                font-size: 9px;
                font-weight: 800;
                padding: 3px 10px;
                border-radius: 8px;
                text-transform: uppercase;
                letter-spacing: 0.02em;
                width: fit-content;
            }
            .sb-badge-role i {
                font-size: 9px;
            }
            .sb-user-email {
                font-size: 11px;
                color: var(--sb-text-muted);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 130px;
            }

            .sb-chevron-down {
                color: #94a3b8;
                font-size: 16px;
                cursor: pointer;
                padding: 4px;
            }

            /* TOAST CONTAINER */
            .sb-toast-overlay {
                position: fixed;
                top: 0; left: 0; width: 100vw; height: 100vh;
                background: rgba(15, 23, 42, 0.3);
                backdrop-filter: blur(8px);
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
            .sb-toast-overlay.show { opacity: 1; pointer-events: auto; }
            .sb-toast-box { background: #ffffff; border-radius: 24px; padding: 32px; width: 90%; max-width: 400px; text-align: center; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15); transform: scale(0.85) translateY(20px); transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
            .sb-toast-overlay.show .sb-toast-box { transform: scale(1) translateY(0); }
            .sb-toast-icon { width: 64px; height: 64px; background: #fff5f5; color: #ff3b30; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 28px; margin: 0 auto 20px auto; }
            .sb-toast-title { font-size: 20px; font-weight: 700; color: #1e293b; margin-bottom: 8px; }
            .sb-toast-desc { font-size: 14px; color: #64748b; margin-bottom: 24px; line-height: 1.5; }
            .sb-toast-actions { display: flex; gap: 12px; }
            .sb-toast-btn { flex: 1; padding: 12px 16px; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; border: none; }
            .sb-toast-btn-cancel { background: #f1f5f9; color: #64748b; }
            .sb-toast-btn-confirm { background: #ff3b30; color: #ffffff; }

            /* RESPONSIVE MOBILE */
            .content { margin-left: 280px !important; width: calc(100% - 280px) !important; transition: all 0.3s ease; }
            @media (max-width: 991.98px) {
                .sidebar { width: 100% !important; height: auto !important; position: fixed; top: 0; left: 0; right: 0; border-right: none; box-shadow: 0 4px 20px rgba(0,0,0,0.05); flex-direction: column; overflow: visible; }
                .sb-header { padding: 0 20px; height: 60px; margin-bottom: 0; display: flex; align-items: center; background: #0056e0 !important; background-image: none !important; }
                .sb-logo-container { width: 36px; height: 36px; margin: 0; padding: 2px; }
                .sb-brand-title { font-size: 18px; }
                .sb-brand-subtitle { display: none; }
                .sb-user-mobile { display: inline-block !important; }
                .sb-body { display: flex; flex-direction: row !important; overflow-x: auto; padding: 10px 16px; gap: 8px; background: #ffffff; }
                .sb-menu-item { padding: 8px 14px; border-radius: 20px; font-size: 13px; background: rgba(0,0,0,0.02); }
                .sb-menu-item.active::before { display: none; }
                .sb-icon-box { width: 26px; height: 26px; margin-right: 0; font-size: 14px; }
                .sb-arrow, .sb-divider, .sb-footer { display: none; }
                .content { margin-left: 0 !important; width: 100% !important; padding-top: 120px !important; }
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

    function createToastDOM() {
        if (document.getElementById('sb-logout-toast-overlay')) return;
        const overlay = document.createElement('div');
        overlay.id = 'sb-logout-toast-overlay';
        overlay.className = 'sb-toast-overlay';
        overlay.innerHTML = `
            <div class="sb-toast-box">
                <div class="sb-toast-icon"><i class="bi bi-box-arrow-right"></i></div>
                <div class="sb-toast-title">Konfirmasi Keluar</div>
                <div class="sb-toast-desc">Apakah Anda yakin ingin mengakhiri sesi dan keluar?</div>
                <div class="sb-toast-actions">
                    <button class="sb-toast-btn sb-toast-btn-cancel" id="toast-cancel-btn">Batal</button>
                    <button class="sb-toast-btn sb-toast-btn-confirm" id="toast-confirm-btn">Ya, Keluar</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        document.getElementById('toast-cancel-btn').addEventListener('click', () => overlay.classList.remove('show'));
        document.getElementById('toast-confirm-btn').addEventListener('click', () => {
            localStorage.clear(); sessionStorage.clear(); window.location.href = '/login';
        });
    }

    function renderSidebar() {
        const sidebarElement = document.querySelector('.sidebar');
        if (!sidebarElement) return;

        const session = getSession();
        let userName = 'Syarif Hida...';
        let userRole = 'ADMINISTRATOR';
        let userEmail = 'syarif@artech.co...';

        if (session && session.user) {
            userName = session.user.nama || session.user.name || userName;
            userRole = session.user.role || userRole;
            userEmail = session.user.email || session.user.username || userEmail;
        }

        const initials = 'SH';

        const currentPage = window.location.pathname.split('/').pop() || 'wo'; // Sesuai gambar contoh aktif di work order ('wo')

        // 🎨 PALET WARNA KLASIK SEPERTI GAMBAR CONTOH
        const iconStyles = {
            'dashboard':  { bg: '#e6f0ff', color: '#2563eb' }, // Soft Blue
            'report':     { bg: '#e6fbf4', color: '#10b981' }, // Soft Green
            'monitoring': { bg: '#f3e8ff', color: '#a855f7' }, // Soft Purple
            'history':    { bg: '#fef3c7', color: '#d97706' }, // Soft Orange
            'wo':         { bg: '#ffffff', color: '#2563eb' }, // Putih karena dibungkus active biru
            'budget':     { bg: '#e6fbf4', color: '#10b981' }, // Soft Green
            'approval':   { bg: '#e6f0ff', color: '#2563eb' }, // Soft Blue
            'admin':      { bg: '#f1f5f9', color: '#64748b' }
        };

        let mainMenus = [
            { href: 'dashboard', icon: 'bi-grid-fill', label: 'Dashboard' },
            { href: 'report', icon: 'bi-file-earmark-plus-fill', label: 'Report' },
            { href: 'monitoring', icon: 'bi-display-fill', label: 'Monitoring' },
            { href: 'history', icon: 'bi-clock-fill', label: 'History' },
            { divider: true },
            { href: 'wo', icon: 'bi-briefcase-fill', label: 'Work Order' },
            { href: 'budget', icon: 'bi-wallet2', label: 'Budget' },
            { href: 'approval', icon: 'bi-shield-check', label: 'Approval' },
            { divider: true },
            { href: '#', icon: 'bi-box-arrow-right', label: 'Logout', isLogout: true }
        ];

        let sidebarHTML = `
            <div class="sb-header">
                <div class="sb-header-content">
                    <div class="sb-logo-container">
                        <img src="assets/img/logo.png" onerror="this.src='https://i.ibb.co/VWVg0Ym/logo-placeholder.png'" alt="Logo">
                    </div>
                    <h5 class="sb-brand-title">Building Care</h5>
                    <div class="sb-brand-subtitle">Enterprise v4.3</div>
                    <span class="sb-user-mobile">${userName}</span>
                </div>
            </div>

            <div class="sb-body">
        `;

        mainMenus.forEach(menu => {
            if (menu.divider) {
                sidebarHTML += `<div class="sb-divider"></div>`;
                return;
            }

            const activeClass = (currentPage === menu.href) ? 'active' : '';
            const isLogout = menu.isLogout ? ' logout-item' : '';
            const styleConf = iconStyles[menu.href] || { bg: '#f1f5f9', color: '#64748b' };
            const chevronHTML = !menu.isLogout ? `<i class="bi bi-chevron-right sb-arrow"></i>` : '';
            
            sidebarHTML += `
                <a href="${menu.isLogout ? '#' : menu.href}" class="sb-menu-item ${activeClass}${isLogout}">
                    <div class="sb-icon-box" style="background: ${activeClass ? '#ffffff' : styleConf.bg}; color: ${activeClass ? '#2563eb' : styleConf.color};">
                        <i class="bi ${menu.icon}"></i>
                    </div>
                    <span class="sb-menu-label">${menu.label}</span>
                    ${chevronHTML}
                </a>
            `;
        });

        sidebarHTML += `
            </div>

            <div class="sb-footer">
                <div class="sb-user-card">
                    <div class="sb-avatar-wrapper">
                        <div class="sb-avatar">${initials}</div>
                        <div class="sb-status-dot"></div>
                    </div>
                    <div class="sb-user-info">
                        <h6 class="sb-user-name">${userName}</h6>
                        <div class="sb-user-role-wrap">
                            <span class="sb-badge-role"><i class="bi bi-shield-fill-check"></i> ${userRole}</span>
                            <span class="sb-user-email">${userEmail}</span>
                        </div>
                    </div>
                    <i class="bi bi-chevron-down sb-chevron-down"></i>
                </div>
            </div>
        `;

        sidebarElement.innerHTML = sidebarHTML;

        const logoutItem = document.querySelector('.logout-item');
        if (logoutItem) {
            logoutItem.addEventListener('click', function(e) {
                e.preventDefault();
                createToastDOM();
                document.getElementById('sb-logout-toast-overlay').classList.add('show');
            });
        }
    }

    function startApp() {
        renderSidebar();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startApp);
    } else {
        startApp();
    }

})();
