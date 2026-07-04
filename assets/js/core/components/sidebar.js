// assets/js/components/sidebar.js
// Sidebar Dinamis - Building Care System Enterprise

(function() {
    'use strict';

    function renderSidebar() {
        const sidebar = document.querySelector('.sidebar nav');
        if (!sidebar) return;

        // Ambil session untuk cek role
        let isAdmin = false;
        try {
            const session = BCS.Storage.getSession();
            if (session && session.user) {
                const role = (session.user.role || '').toUpperCase();
                isAdmin = (role === 'ADMINISTRATOR');
            }
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
            // Sembunyikan menu Admin jika bukan admin
            if (menu.adminOnly && !isAdmin) return;

            const active = currentPage === menu.href ? 'active' : '';
            const logoutAttr = menu.logout ? 'id="logoutBtn"' : '';
            const extraClass = menu.class || '';

            html += `
                <a href="${menu.href}" class="menu ${active} ${extraClass}" ${logoutAttr}>
                    <i class="bi ${menu.icon}"></i>
                    <span>${menu.label}</span>
                </a>
            `;
        });

        sidebar.innerHTML = html;

        // Bind logout jika ada
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
        renderSidebar();
    }
})();
