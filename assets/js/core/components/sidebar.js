// assets/js/components/sidebar.js
// Sidebar Dinamis - Building Care System Enterprise
// Versi Final - 04 Juli 2026

(function() {
    'use strict';

    function renderSidebar() {
        var sidebarNav = document.querySelector('.sidebar nav');
        if (!sidebarNav) {
            console.warn('Sidebar nav element not found');
            return;
        }

        // Ambil session untuk cek role
        var isAdmin = false;
        var session = null;

        try {
            // Coba ambil dari BCS.Storage jika tersedia
            if (typeof BCS !== 'undefined' && BCS.Storage && typeof BCS.Storage.getSession === 'function') {
                session = BCS.Storage.getSession();
            } else {
                // Fallback: ambil dari localStorage langsung
                var raw = localStorage.getItem('bcs_session');
                if (raw) {
                    try {
                        session = JSON.parse(raw);
                    } catch (e) {}
                }
            }

            if (session && session.user) {
                var role = (session.user.role || '').toUpperCase();
                isAdmin = (role === 'ADMINISTRATOR');
                console.log('✅ Session loaded. Role:', role);
            } else {
                console.log('ℹ️ No session found');
            }
        } catch (e) {
            console.warn('Gagal membaca session:', e);
        }

        var currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
        console.log('📍 Current page:', currentPage);

        var menus = [
            { href: 'dashboard.html', icon: 'bi-grid-fill', label: 'Dashboard' },
            { href: 'report.html', icon: 'bi-file-earmark-plus', label: 'Report' },
            { href: 'monitoring.html', icon: 'bi-display', label: 'Monitoring' },
            { href: 'history.html', icon: 'bi-clock-history', label: 'History' },
            { href: 'wo.html', icon: 'bi-clipboard-check', label: 'Work Order' },
            { href: 'budget.html', icon: 'bi-cash-stack', label: 'Budget' },
            { href: 'approval.html', icon: 'bi-check-circle', label: 'Approval' },
            { href: 'admin.html', icon: 'bi-shield-lock-fill', label: 'Admin', adminOnly: true },
            { href: '#', icon: 'bi-box-arrow-right', label: 'Logout', logout: true, class: 'text-danger' }
        ];

        var html = '';
        menus.forEach(function(menu) {
            if (menu.adminOnly && !isAdmin) return;

            var active = (currentPage === menu.href) ? 'active' : '';
            var logoutAttr = menu.logout ? 'id="logoutBtn"' : '';
            var extraClass = menu.class || '';

            html += '<a href="' + menu.href + '" class="menu ' + active + ' ' + extraClass + '" ' + logoutAttr + '>';
            html += '<i class="bi ' + menu.icon + '"></i>';
            html += '<span>' + menu.label + '</span>';
            html += '</a>';
        });

        sidebarNav.innerHTML = html;
        console.log('✅ Sidebar rendered with ' + menus.filter(m => !m.adminOnly || isAdmin).length + ' menus');

        // Bind logout
        var logoutBtn = document.getElementById('logoutBtn');
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
        document.addEventListener('DOMContentLoaded', renderSidebar);
    } else {
        renderSidebar();
    }

    // Expose function untuk reload sidebar jika perlu
    window.renderSidebar = renderSidebar;
})();
