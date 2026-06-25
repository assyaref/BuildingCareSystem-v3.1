// ======================================================
// Building Care System Enterprise v1.0
// File : assets/js/modules/dashboard.js
// Radiant Group Duri
// ======================================================

"use strict";

/**
 * ======================================================
 * DASHBOARD CONTROLLER
 * ======================================================
 */
const DashboardController = (() => {
    let initialized = false;
    let dashboardData = null;

    // DOM Elements
    function getElements() {
        return {
            // Statistik Cards
            totalReports: document.getElementById('totalReports'),
            pendingReports: document.getElementById('pendingReports'),
            completedReports: document.getElementById('completedReports'),
            totalWorkOrders: document.getElementById('totalWorkOrders'),
            
            // Charts Container
            chartContainer: document.getElementById('dashboardChart'),
            
            // Tables
            recentActivities: document.getElementById('recentActivities'),
            
            // Loading
            loadingOverlay: document.getElementById('dashboardLoading')
        };
    }

    /**
     * ======================================================
     * HANDLER METHODS
     * ======================================================
     */
    function handleDashboardData(data) {
        try {
            Logger.info('[DASHBOARD] Data received:', data);
            
            // Simpan data
            dashboardData = data?.data || data || {};
            
            // Update UI
            updateStats(dashboardData);
            updateChart(dashboardData);
            updateActivities(dashboardData);
            
            // Hide loading
            hideLoading();
            
            // Emit event sukses
            if (window.BCS?.Events) {
                window.BCS.Events.emit('dashboard:loaded', dashboardData);
            }
        } catch (error) {
            Logger.error('[DASHBOARD] Error handling data:', error);
            showError('Gagal memuat data dashboard');
        }
    }

    function handleDashboardError(error) {
        Logger.error('[DASHBOARD] Error:', error);
        showError('Terjadi kesalahan saat memuat dashboard');
        hideLoading();
    }

    function handleWorkOrderUpdate(data) {
        Logger.info('[DASHBOARD] Work Order updated:', data);
        // Refresh data jika diperlukan
        refreshDashboard();
    }

    function handleReportUpdate(data) {
        Logger.info('[DASHBOARD] Report updated:', data);
        // Refresh data jika diperlukan
        refreshDashboard();
    }

    /**
     * ======================================================
     * UI UPDATE METHODS
     * ======================================================
     */
    function updateStats(data) {
        const elements = getElements();
        
        // Update statistik dengan aman
        if (elements.totalReports) {
            elements.totalReports.textContent = data?.totalReports || 0;
        }
        if (elements.pendingReports) {
            elements.pendingReports.textContent = data?.pendingReports || 0;
        }
        if (elements.completedReports) {
            elements.completedReports.textContent = data?.completedReports || 0;
        }
        if (elements.totalWorkOrders) {
            elements.totalWorkOrders.textContent = data?.totalWorkOrders || 0;
        }
    }

    function updateChart(data) {
        const container = getElements().chartContainer;
        if (!container) {
            Logger.warn('[DASHBOARD] Chart container not found');
            return;
        }

        try {
            // Render chart jika ada library chart
            if (window.Chart) {
                // Implementasi chart jika menggunakan Chart.js
                const ctx = container.getContext('2d');
                if (ctx) {
                    // Chart rendering logic di sini
                }
            } else {
                // Fallback: tampilkan data sederhana
                container.innerHTML = `
                    <div class="chart-placeholder">
                        <p>Statistik Laporan</p>
                        <div class="chart-simple">
                            <span>Total: ${data?.totalReports || 0}</span>
                            <span>Pending: ${data?.pendingReports || 0}</span>
                            <span>Completed: ${data?.completedReports || 0}</span>
                        </div>
                    </div>
                `;
            }
        } catch (error) {
            Logger.error('[DASHBOARD] Chart error:', error);
        }
    }

    function updateActivities(data) {
        const container = getElements().recentActivities;
        if (!container) return;

        const activities = data?.recentActivities || [];
        
        if (activities.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="3" class="text-center text-muted">
                        <i class="fas fa-inbox"></i> Belum ada aktivitas
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';
        activities.forEach(activity => {
            html += `
                <tr>
                    <td>${activity.date || '-'}</td>
                    <td>${activity.description || '-'}</td>
                    <td>
                        <span class="badge badge-${getStatusBadge(activity.status)}">
                            ${activity.status || 'Unknown'}
                        </span>
                    </td>
                </tr>
            `;
        });
        container.innerHTML = html;
    }

    function getStatusBadge(status) {
        const statusMap = {
            'COMPLETED': 'success',
            'PENDING': 'warning',
            'IN_PROGRESS': 'info',
            'REJECTED': 'danger',
            'APPROVED': 'primary'
        };
        return statusMap[status?.toUpperCase()] || 'secondary';
    }

    function showLoading() {
        const overlay = getElements().loadingOverlay;
        if (overlay) overlay.style.display = 'flex';
    }

    function hideLoading() {
        const overlay = getElements().loadingOverlay;
        if (overlay) overlay.style.display = 'none';
    }

    function showError(message) {
        // Gunakan toast jika tersedia
        if (window.App?.toast) {
            window.App.toast(message, 'danger');
        } else {
            alert(message);
        }
    }

    /**
     * ======================================================
     * DATA FETCHING
     * ======================================================
     */
    async function fetchDashboardData() {
        try {
            showLoading();
            
            // Cek API tersedia
            const api = window.BCS?.Api || window.Api;
            if (!api) {
                throw new Error('API not available');
            }

            // Gunakan service registry jika ada
            let response;
            if (window.BCS?.Services?.get) {
                const systemService = window.BCS.Services.get('system');
                if (systemService?.getDashboard) {
                    response = await systemService.getDashboard({});
                }
            }

            // Fallback ke Api langsung
            if (!response) {
                response = await api.post('dashboard', {});
            }

            if (response && response.success) {
                handleDashboardData(response);
            } else {
                throw new Error(response?.message || 'Failed to load dashboard');
            }
        } catch (error) {
            handleDashboardError(error);
        }
    }

    async function refreshDashboard() {
        await fetchDashboardData();
    }

    /**
     * ======================================================
     * EVENT BINDING
     * ======================================================
     */
    function bindEvents() {
        // Bind ke Event Bus jika tersedia
        if (window.BCS?.Events) {
            // Cek apakah handler sudah terdaftar
            if (!window.BCS._dashboardHandlers) {
                window.BCS._dashboardHandlers = {
                    handleDashboardData,
                    handleDashboardError,
                    handleWorkOrderUpdate,
                    handleReportUpdate
                };
                
                // Register event listeners
                window.BCS.Events.on('dashboard:data', handleDashboardData);
                window.BCS.Events.on('dashboard:error', handleDashboardError);
                window.BCS.Events.on('workorder:updated', handleWorkOrderUpdate);
                window.BCS.Events.on('report:updated', handleReportUpdate);
                
                Logger.info('[DASHBOARD] Event handlers registered');
            }
        }
    }

    /**
     * ======================================================
     * INITIALIZATION
     * ======================================================
     */
    async function init() {
        if (initialized) {
            Logger.info('[DASHBOARD] Already initialized');
            return;
        }
        
        Logger.info('[DASHBOARD] Initializing...');
        initialized = true;

        // Bind events
        bindEvents();

        // Load data
        await fetchDashboardData();

        // Auto-refresh setiap 5 menit
        setInterval(refreshDashboard, 300000);

        Logger.info('[DASHBOARD] Ready');
    }

    // Public API
    return {
        init,
        refresh: refreshDashboard,
        getData: () => dashboardData
    };
})();

// Register service ke BCS
if (window.BCS?.Services?.register) {
    window.BCS.Services.register('dashboard', DashboardController);
    Logger.info('[DASHBOARD] Service registered to BCS');
}

// Auto-initialize jika halaman dashboard
if (document.getElementById('dashboardPage') || document.querySelector('.dashboard-page')) {
    document.addEventListener('DOMContentLoaded', () => {
        // Tunggu sedikit agar API siap
        setTimeout(DashboardController.init, 200);
    });
}

// Export untuk modular
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardController;
}
