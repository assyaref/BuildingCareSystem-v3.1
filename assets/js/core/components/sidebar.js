// assets/js/components/sidebar.js
// Sidebar Dinamis - Building Care System Enterprise v3.6

(function() {
    'use strict';

    function getSession() {
        // Coba dari BCS.Storage
        try {
            if (typeof BCS !== 'undefined' && BCS.Storage && typeof BCS.Storage.getSession === 'function') {
                return BCS.Storage.getSession();
            }
        } catch (e) {}

        // Fallback: langsung dari localStorage
        try {
            const raw = localStorage.getItem('bcs_session');
            if (raw) {
                return JSON.parse(raw);
            }
        } catch (e) {}

        // Fallback: dari sessionStorage
        try {
            const raw = sessionStorage.getItem('bcs_session');
            if (raw) {
                return JSON.parse(raw);
            }
        } catch (e) {}

        return null;
    }

    function renderSidebar() {
        // Cari elemen nav di sidebar
        const sidebarNav = document.querySelector('.sidebar nav');
        if (!sidebarNav) {
            console.warn('Sidebar nav tidak ditemukan!');
            return;
        }

        // Ambil session
        const session = getSession();
        let isAdmin = false;
        let userName = 'User';

        if (session && session.user) {
            const role = (session.user.role || '').toUpperCase();
            isAdmin = (role === 'ADMINISTRATOR');
            userName = session.user.nama || session.user.name || 'User';
        }

        // Simpan nama user di localStorage untuk ditampilkan
        try {
            localStorage.setItem('bcs_username', userName);
        } catch (e) {}

        const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';

        const menus = [
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

        let html = '';
        menus.forEach(menu => {
            // Admin only
            if (menu.adminOnly && !isAdmin) return;

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
        console.log('✅ Sidebar rendered with', menus.length, 'menu items');

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
        document.addEventListener('DOMContentLoaded', renderSidebar);
    } else {
        // DOM sudah siap, jalankan langsung dengan sedikit delay agar BCS.Storage siap
        setTimeout(renderSidebar, 100);
    }

    // Jika BCS.Storage sudah siap, render ulang (untuk update role)
    if (typeof BCS !== 'undefined' && BCS.Storage) {
        // Tunggu sampai session siap
        const checkSession = setInterval(function() {
            if (BCS.Storage.getSession()) {
                clearInterval(checkSession);
                renderSidebar();
            }
        }, 200);
    }

})();
