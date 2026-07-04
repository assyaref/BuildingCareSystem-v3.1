// assets/js/core/components/sidebar.js
// Sidebar Dinamis - Bedakan Admin vs User

(function() {
    'use strict';

    console.log('🔄 sidebar.js loaded');

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

        try {
            const raw = sessionStorage.getItem('bcs_session');
            if (raw) return JSON.parse(raw);
        } catch (e) {}

        return null;
    }

    function renderSidebar() {
        console.log('📌 renderSidebar() called');

        const sidebarNav = document.querySelector('.sidebar nav');
        if (!sidebarNav) {
            console.warn('❌ .sidebar nav not found');
            return;
        }

        const session = getSession();
        let isAdmin = false;
        let userName = 'User';
        let userRole = 'User';

        if (session && session.user) {
            const role = (session.user.role || '').toUpperCase();
            isAdmin = (role === 'ADMINISTRATOR');
            userName = session.user.nama || session.user.name || 'User';
            userRole = session.user.role || 'User';
            console.log('👤 User:', userName, 'Role:', userRole, 'isAdmin:', isAdmin);
        } else {
            console.warn('⚠️ No session, redirect to login');
            if (window.location.pathname.indexOf('login.html') === -1) {
                window.location.href = 'login.html';
            }
            return;
        }

        // 🔥 Tentukan menu berdasarkan role
        let menus = [];
        if (isAdmin) {
            // Menu lengkap untuk ADMINISTRATOR
            menus = [
                { href: 'dashboard.html', icon: 'bi-grid-fill', label: 'Dashboard' },
                { href: 'report.html', icon: 'bi-file-earmark-plus', label: 'Report' },
                { href: 'monitoring.html', icon: 'bi-display', label: 'Monitoring' },
                { href: 'history.html', icon: 'bi-clock-history', label: 'History' },
                { href: 'wo.html', icon: 'bi-clipboard-check', label: 'Work Order' },
                { href: 'budget.html', icon: 'bi-cash-stack', label: 'Budget' },
                { href: 'approval.html', icon: 'bi-check-circle', label: 'Approval' },
                { href: 'admin.html', icon: 'bi-shield-lock-fill', label: 'Admin' },
                { href: '#', icon: 'bi-box-arrow-right', label: 'Logout', logout: true, class: 'text-danger' }
            ];
        } else {
            // Menu terbatas untuk USER biasa
            menus = [
                { href: 'user-report.html', icon: 'bi-file-earmark-plus', label: 'Buat Laporan' },
                { href: 'user-history.html', icon: 'bi-clock-history', label: 'Riwayat Saya' },
                { href: '#', icon: 'bi-box-arrow-right', label: 'Logout', logout: true, class: 'text-danger' }
            ];
        }

        const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';

        let html = '';
        menus.forEach(menu => {
            const active = (currentPage === menu.href) ? 'active' : '';
            const logoutAttr = menu.logout ? 'id="logoutBtn"' : '';
            const extraClass = menu.class || '';
            html += `
                <a href="${menu.href}" class="menu ${active} ${extraClass}" ${logoutAttr}>
                    <i class="bi ${menu.icon}"></i>
                    <span>${menu.label}</span>
                </a>
            `;
        });

        sidebarNav.innerHTML = html;
        console.log('✅ Sidebar rendered with', menus.length, 'items');

        // Update user info di topbar
        try {
            const userNameEl = document.getElementById('userName');
            const userRoleEl = document.getElementById('userRole');
            if (userNameEl) userNameEl.textContent = userName;
            if (userRoleEl) userRoleEl.textContent = userRole;
        } catch (e) {}

        // Bind logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function(e) {
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
            });
        }
    }

    // Jalankan setelah DOM siap
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(renderSidebar, 200);
        });
    } else {
        setTimeout(renderSidebar, 200);
    }

    // Jika BCS.Storage siap, render ulang
    if (typeof BCS !== 'undefined' && BCS.Storage) {
        const checkSession = setInterval(function() {
            try {
                if (BCS.Storage.getSession()) {
                    clearInterval(checkSession);
                    renderSidebar();
                }
            } catch (e) {}
        }, 300);
    }

    // Fallback jika sidebar masih kosong
    setTimeout(function() {
        const sidebarNav = document.querySelector('.sidebar nav');
        if (sidebarNav && sidebarNav.innerHTML.trim() === '') {
            console.log('🔄 Retry rendering sidebar...');
            renderSidebar();
        }
    }, 1000);

})();
