// assets/js/core/components/sidebar.js
// Sidebar Dinamis Premium UI - Match UI Design v4.3
// 🔥 Added Custom Premium Toast Confirmation for Logout

(function() {
    'use strict';

    console.log('🔄 Premium sidebar.js updated with stunning custom logout toast');

    const styleId = 'premium-sidebar-css';
    if (!document.getElementById(styleId)) {
        const css = `
            :root {
                --sb-sidebar-bg: #f8fafc;
                --sb-text-dark: #1e293b;
                --sb-text-muted: #64748b;
                --sb-active-gradient: linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%);
                --sb-active-shadow: rgba(37, 99, 235, 0.25);
            }
            [data-theme="dark"] {
                --sb-sidebar-bg: #111827;
                --sb-text-dark: #f9fafb;
                --sb-text-muted: #9ca3af;
                --sb-active-gradient: linear-gradient(90deg, #2563eb 0%, #1e40af 100%);
                --sb-active-shadow: rgba(37, 99, 235, 0.4);
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
                gap: 6px;
            }
            .sb-body::-webkit-scrollbar { width: 0px; }

            .sb-menu-item {
                display: flex;
                align-items: center;
                padding: 12px 16px;
                border-radius: 14px;
                text-decoration: none !important;
                color: var(--sb-text-muted) !important;
                font-weight: 600;
                font-size: 14px;
                transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                position: relative;
            }
            .sb-menu-item:hover:not(.active) {
                background: rgba(0, 0, 0, 0.03);
                color: var(--sb-text-dark) !important;
                padding-left: 20px;
            }

            .sb-icon-box {
                width: 36px;
                height: 36px;
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 14px;
                font-size: 16px;
                transition: all 0.2s ease;
            }

            .sb-menu-label {
                flex: 1;
            }
            .sb-arrow {
                font-size: 13px;
                color: var(--sb-text-muted);
                opacity: 0.7;
            }

            /* 🎯 STATE ACTIVE (image_7531de.png style) */
            .sb-menu-item.active {
                background: var(--sb-active-gradient) !important;
                color: #ffffff !important;
                box-shadow: 0 8px 20px var(--sb-active-shadow);
            }
            .sb-menu-item.active .sb-icon-box {
                background: #ffffff !important;
                color: #2563eb !important;
                box-shadow: 0 2px 6px rgba(0,0,0,0.06);
            }
            .sb-menu-item.active .sb-arrow {
                color: #ffffff !important;
                opacity: 1;
            }
            .sb-menu-item.active::before {
                content: '';
                position: absolute;
                left: -6px;
                top: 25%;
                height: 50%;
                width: 5px;
                background: #f59e0b;
                border-radius: 0 4px 4px 0;
            }

            .sb-divider {
                height: 1px;
                background: rgba(0,0,0,0.05);
                margin: 12px 16px;
            }

            /* LOGOUT BOX */
            .sb-logout-box { padding: 5px 18px; }
            .sb-btn-logout {
                background: #fff5f5 !important;
                color: #ff3b30 !important;
                border-radius: 12px;
            }
            .sb-btn-logout .sb-icon-box {
                background: #ffe5e5 !important;
                color: #ff3b30 !important;
            }

            /* USER CARD FOOTER */
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
            .sb-avatar-wrapper {
                position: relative;
                width: 42px;
                height: 42px;
            }
            .sb-avatar {
                width: 100%; height: 100%; border-radius: 50%;
                background: #3b82f6; color: #ffffff;
                display: flex; align-items: center; justify-content: center;
                font-weight: 600; font-size: 15px;
            }
            .sb-status-dot {
                width: 11px; height: 11px; background: #22c55e;
                border: 2px solid #eef2f6; border-radius: 50%;
                position: absolute; bottom: -1px; right: -1px;
            }
            .sb-user-info { flex: 1; min-width: 0; }
            .sb-user-name { font-weight: 700; font-size: 14px; color: var(--sb-text-dark); margin: 0 0 4px 0; line-height: 1.2; }
            .sb-badge-role { background: #3b82f6; color: #ffffff; font-size: 9px; font-weight: 700; padding: 1px 6px; border-radius: 4px; display: inline-block; text-transform: uppercase; }
            .sb-chevron-down { color: var(--sb-text-muted); font-size: 14px; }

            /* 🌟 ✨ ANIMATED TOAST OVERLAY & BOX CSS ✨ 🌟 */
            .sb-toast-overlay {
                position: fixed;
                top: 0; left: 0; width: 100vw; height: 100vh;
                background: rgba(15, 23, 42, 0.3);
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
            .sb-toast-overlay.show {
                opacity: 1;
                pointer-events: auto;
            }
            .sb-toast-box {
                background: #ffffff;
                border-radius: 24px;
                padding: 32px;
                width: 90%;
                max-width: 400px;
                text-align: center;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
                border: 1px solid rgba(255, 255, 255, 0.8);
                transform: scale(0.85) translateY(20px);
                transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            }
            .sb-toast-overlay.show .sb-toast-box {
                transform: scale(1) translateY(0);
            }
            .sb-toast-icon {
                width: 64px; height: 64px;
                background: #fff5f5;
                color: #ff3b30;
                border-radius: 50%;
                display: flex; align-items: center; justify-content: center;
                font-size: 28px; margin: 0 auto 20px auto;
                animation: pulseRed 2s infinite;
            }
            .sb-toast-title {
                font-size: 20px; font-weight: 700;
                color: #1e293b; margin-bottom: 8px;
            }
            .sb-toast-desc {
                font-size: 14px; color: #64748b;
                margin-bottom: 24px; line-height: 1.5;
            }
            .sb-toast-actions {
                display: flex; gap: 12px;
            }
            .sb-toast-btn {
                flex: 1; padding: 12px 16px;
                border-radius: 12px; font-size: 14px; font-weight: 600;
                cursor: pointer; border: none; transition: all 0.2s ease;
            }
            .sb-toast-btn-cancel {
                background: #f1f5f9; color: #64748b;
            }
            .sb-toast-btn-cancel:hover { background: #e2e8f0; color: #0f172a; }
            
            .sb-toast-btn-confirm {
                background: linear-gradient(135deg, #ff5252 0%, #ff3b30 100%);
                color: #ffffff;
                box-shadow: 0 4px 12px rgba(255, 59, 48, 0.2);
            }
            .sb-toast-btn-confirm:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 15px rgba(255, 59, 48, 0.3);
            }

            @keyframes pulseRed {
                0% { box-shadow: 0 0 0 0 rgba(255, 59, 48, 0.2); }
                70% { box-shadow: 0 0 0 12px rgba(255, 59, 48, 0); }
                100% { box-shadow: 0 0 0 0 rgba(255, 59, 48, 0); }
            }

            .content { margin-left: 280px !important; width: calc(100% - 280px) !important; }
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

    // Fungsi utilitas pembuat Modal Toast Konfirmasi Kustom
    function createToastDOM() {
        if (document.getElementById('sb-logout-toast-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'sb-logout-toast-overlay';
        overlay.className = 'sb-toast-overlay';
        overlay.innerHTML = `
            <div class="sb-toast-box">
                <div class="sb-toast-icon">
                    <i class="bi bi-box-arrow-right"></i>
                </div>
                <div class="sb-toast-title">Konfirmasi Keluar</div>
                <div class="sb-toast-desc">Apakah Anda yakin ingin mengakhiri sesi dan keluar dari Building Care System?</div>
                <div class="sb-toast-actions">
                    <button class="sb-toast-btn sb-toast-btn-cancel" id="toast-cancel-btn">Batal</button>
                    <button class="sb-toast-btn sb-toast-btn-confirm" id="toast-confirm-btn">Ya, Keluar</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        // Event listener internal toast
        document.getElementById('toast-cancel-btn').addEventListener('click', hideLogoutToast);
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) hideLogoutToast();
        });
        
        document.getElementById('toast-confirm-btn').addEventListener('click', function() {
            // Animasi transisi sukses sebelum redirect
            document.querySelector('.sb-toast-box').innerHTML = `
                <div class="sb-toast-icon" style="background: #e6fbf4; color: #10b981; animation: none;">
                    <i class="bi bi-check-circle-fill"></i>
                </div>
                <div class="sb-toast-title">Berhasil Keluar</div>
                <div class="sb-toast-desc" style="margin-bottom: 0;">Mengarahkan kembali ke halaman login...</div>
            `;
            setTimeout(() => {
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = 'login.html';
            }, 1000);
        });
    }

    function showLogoutToast() {
        createToastDOM();
        const overlay = document.getElementById('sb-logout-toast-overlay');
        if (overlay) overlay.classList.add('show');
    }

    function hideLogoutToast() {
        const overlay = document.getElementById('sb-logout-toast-overlay');
        if (overlay) overlay.classList.remove('show');
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
            { href: 'admin.html', icon: 'bi-person-fill', label: 'Admin' }
        ];

        let sidebarHTML = `
            <div class="sb-header">
                <div class="sb-header-content">
                    <div class="sb-logo-container">
                        <img src="assets/img/logo.png" onerror="this.src='https://i.ibb.co/VWVg0Ym/logo-placeholder.png'" alt="Logo">
                    </div>
                    <h5 class="sb-brand-title">Building Care</h5>
                    <div class="sb-brand-subtitle">Enterprise v4.3</div>
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
            const styleConf = iconStyles[menu.href] || { bg: '#f1f5f9', color: '#64748b' };
            const chevronHTML = `<i class="bi bi-chevron-right sb-arrow"></i>`;
            
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

            <div class="sb-logout-box">
                <a href="#" id="logoutBtn" class="sb-menu-item sb-btn-logout">
                    <div class="sb-icon-box">
                        <i class="bi bi-box-arrow-right"></i>
                    </div>
                    <span class="sb-menu-label">Logout</span>
                </a>
            </div>

            <div class="sb-footer">
                <div class="sb-user-card">
                    <div class="sb-avatar-wrapper">
                        <div class="sb-avatar"><i class="bi bi-person-fill"></i></div>
                        <div class="sb-status-dot"></div>
                    </div>
                    <div class="sb-user-info">
                        <h6 class="sb-user-name">${userName}</h6>
                        <span class="sb-badge-role">${userRole}</span>
                    </div>
                    <i class="bi bi-chevron-down sb-chevron-down"></i>
                </div>
            </div>
        `;

        sidebarElement.innerHTML = sidebarHTML;

        // Pemicu Toast Kustom saat tombol logout diklik
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                showLogoutToast();
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(renderSidebar, 50));
    } else {
        setTimeout(renderSidebar, 50);
    }
})();
