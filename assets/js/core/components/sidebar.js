// ============================================================
// sidebar.js - Dynamic Sidebar with Debug
// Building Care System Enterprise
// ============================================================

(function() {
    'use strict';

    console.log('🔄 sidebar.js loaded');

    function renderSidebar() {
        console.log('📌 renderSidebar() called');

        // Cari elemen sidebar nav
        var sidebarNav = document.querySelector('.sidebar nav');
        if (!sidebarNav) {
            console.error('❌ .sidebar nav not found!');
            return;
        }

        console.log('✅ .sidebar nav found');

        // Ambil session
        var isAdmin = false;
        var userName = 'User';
        var userRole = 'User';

        try {
            // Coba dari BCS.Storage
            if (typeof BCS !== 'undefined' && BCS.Storage) {
                var session = BCS.Storage.getSession();
                if (session && session.user) {
                    var role = (session.user.role || '').toUpperCase();
                    isAdmin = (role === 'ADMINISTRATOR');
                    userName = session.user.nama || session.user.name || 'User';
                    userRole = session.user.role || 'User';
                    console.log('👤 User:', userName, 'Role:', userRole, 'isAdmin:', isAdmin);
                }
            } else {
                // Fallback: coba dari localStorage langsung
                try {
                    var raw = localStorage.getItem('bcs_session');
                    if (raw) {
                        var session = JSON.parse(raw);
                        if (session && session.user) {
                            var role = (session.user.role || '').toUpperCase();
                            isAdmin = (role === 'ADMINISTRATOR');
                        }
                    }
                } catch (e) {}
            }
        } catch (e) {
            console.warn('⚠️ Gagal ambil session:', e);
        }

        // Tentukan halaman aktif
        var currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
        console.log('📄 Current page:', currentPage);

        // Daftar menu
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

        // Bangun HTML
        var html = '';
        menus.forEach(function(menu) {
            // Sembunyikan menu Admin jika bukan admin
            if (menu.adminOnly && !isAdmin) {
                return;
            }

            var active = (currentPage === menu.href) ? 'active' : '';
            var logoutAttr = menu.logout ? 'id="logoutBtn"' : '';
            var extraClass = menu.class || '';

            html += `
                <a href="${menu.href}" class="menu ${active} ${extraClass}" ${logoutAttr}>
                    <i class="bi ${menu.icon}"></i>
                    <span>${menu.label}</span>
                </a>
            `;
        });

        // Set HTML ke sidebar
        sidebarNav.innerHTML = html;
        console.log('✅ Sidebar rendered with', menus.length, 'menus');

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

        // Update user info di topbar jika ada
        try {
            var userNameEl = document.getElementById('userName');
            var userRoleEl = document.getElementById('userRole');
            var userAvatarEl = document.getElementById('userAvatar');
            
            if (userNameEl) userNameEl.textContent = userName;
            if (userRoleEl) userRoleEl.textContent = userRole;
            if (userAvatarEl) userAvatarEl.textContent = userName.charAt(0).toUpperCase();
        } catch (e) {}
    }

    // Jalankan setelah DOM siap
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', renderSidebar);
    } else {
        // DOM sudah siap, jalankan langsung
        renderSidebar();
    }

    // Jika BCS.Storage belum siap, coba lagi setelah 500ms
    setTimeout(function() {
        var sidebarNav = document.querySelector('.sidebar nav');
        if (sidebarNav && sidebarNav.innerHTML.trim() === '') {
            console.log('🔄 Retry rendering sidebar...');
            renderSidebar();
        }
    }, 500);

})();
