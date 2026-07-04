// =====================================================
// Building Care System Enterprise v7.6 FINAL
// history.js - Auto-Refresh 7 detik + Countdown
// Error handling + Auto-stop after failures
// ONLY ADMIN can access this page
// Loading overlay removed
// Radiant Group Duri
// =====================================================

"use strict";

(function() {
    'use strict';

    // ============================================================
    //  DOM HELPERS
    // ============================================================
    const $ = (sel, ctx = document) => ctx.querySelector(sel);
    const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

    // ============================================================
    //  STATE
    // ============================================================
    const state = {
        reports: [],
        filtered: [],
        currentPage: 1,
        perPage: 10,
        search: '',
        status: '',
        sort: 'desc',
        loading: false,
        currentDetail: null,
        countdown: 7,
        autoRefresh: true,
        countdownInterval: null,
        errorCount: 0,
        maxErrors: 3,
        hasError: false
    };

    // DOM cache
    const DOM = {};

    function cacheDom() {
        DOM.tableBody = $('#historyTableBody');
        DOM.pagination = $('#pagination');
        DOM.emptyState = $('#emptyState');
        DOM.searchInput = $('#searchInput');
        DOM.filterStatus = $('#filterStatus');
        DOM.sortOrder = $('#sortOrder');
        DOM.cardTotal = $('#cardTotal');
        DOM.cardOpen = $('#cardOpen');
        DOM.cardProgress = $('#cardProgress');
        DOM.cardDone = $('#cardDone');
        DOM.totalReports = $('#totalReports');
        DOM.detailContent = $('#detailContent');
        DOM.updateId = $('#updateId');
        DOM.updateStatus = $('#updateStatus');
        DOM.updateTeknisi = $('#updateTeknisi');
        DOM.updateCatatan = $('#updateCatatan');
        DOM.modalPhoto = $('#modalPhoto');
        DOM.refreshBtn = $('#refreshBtn');
        DOM.exportExcelBtn = $('#exportExcelBtn');
        DOM.exportPdfBtn = $('#exportPdfBtn');
        DOM.exportDetailPdfBtn = $('#exportDetailPdfBtn');
        DOM.saveUpdateBtn = $('#saveUpdateBtn');
        DOM.darkModeToggle = $('#darkModeToggle');
        DOM.darkModeIcon = $('#darkModeIcon');
        DOM.userName = $('#userName');
        DOM.userRole = $('#userRole');
        DOM.userAvatar = $('#userAvatar');
        DOM.sidebarNav = $('#sidebarNav');
        DOM.totalTrend = $('#totalTrend');
        DOM.openTrend = $('#openTrend');
        DOM.progressTrend = $('#progressTrend');
        DOM.doneTrend = $('#doneTrend');
        DOM.countdownNumber = $('#countdownNumber');
        DOM.countdownArea = $('#countdownArea');
        DOM.countdownReset = $('#countdownReset');
        DOM.countdownToggle = $('#countdownToggle');
        DOM.countdownToggleIcon = $('#countdownToggleIcon');
    }

    // ============================================================
    //  TOAST
    // ============================================================
    function showToast(msg, type = 'success') {
        if (typeof Swal !== 'undefined') {
            Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true
            }).fire({
                icon: type === 'success' ? 'success' : type === 'error' ? 'error' : 'warning',
                title: type === 'success' ? 'Berhasil!' : type === 'error' ? 'Gagal!' : 'Peringatan!',
                text: msg
            });
        } else {
            console.log(`[Toast] ${type}: ${msg}`);
        }
    }

    // ============================================================
    //  LOADING - NO-OP (loading hitam dihilangkan)
    // ============================================================
    function showLoading() { /* tidak ada overlay */ }

    function hideLoading() { /* tidak ada overlay */ }

    // ============================================================
    //  DATE HELPERS
    // ============================================================
    function parseDate(str) {
        if (!str) return null;
        const d = new Date(str);
        return isNaN(d.getTime()) ? null : d;
    }

    function formatDate(str) {
        const d = parseDate(str);
        if (!d) return '-';
        return d.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).replace('.', ':');
    }

    function isDateInRange(dateStr, start, end) {
        const d = parseDate(dateStr);
        if (!d) return false;
        const dateOnly = d.toISOString().split('T')[0];
        if (start && dateOnly < start.toISOString().split('T')[0]) return false;
        if (end && dateOnly > end.toISOString().split('T')[0]) return false;
        return true;
    }

    function getTodayRange() {
        const now = new Date();
        return { start: now, end: now };
    }

    function getWeekRange() {
        const now = new Date();
        const start = new Date(now);
        start.setDate(now.getDate() - now.getDay());
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        return { start, end };
    }

    function getMonthRange() {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        return { start, end };
    }

    function getLast3MonthsRange() {
        const now = new Date();
        const start = new Date(now);
        start.setMonth(now.getMonth() - 3);
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        return { start, end };
    }

    // ============================================================
    //  ESCAPE HTML
    // ============================================================
    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // ============================================================
    //  TRUNCATE TEXT
    // ============================================================
    function truncate(str, len = 30) {
        if (!str) return '-';
        if (str.length <= len) return str;
        return str.substring(0, len) + '...';
    }

    // ============================================================
    //  DARK MODE
    // ============================================================
    function initDarkMode() {
        if (!DOM.darkModeToggle) return;
        const saved = localStorage.getItem('bcs_theme') || 'light';
        document.documentElement.setAttribute('data-theme', saved);
        updateDarkIcon(saved);

        DOM.darkModeToggle.addEventListener('click', function() {
            const cur = document.documentElement.getAttribute('data-theme');
            const next = cur === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('bcs_theme', next);
            updateDarkIcon(next);
        });
    }

    function updateDarkIcon(theme) {
        if (!DOM.darkModeIcon) return;
        if (theme === 'dark') {
            DOM.darkModeIcon.className = 'bi bi-sun-fill';
            DOM.darkModeIcon.style.color = '#ffd700';
        } else {
            DOM.darkModeIcon.className = 'bi bi-moon-fill';
            DOM.darkModeIcon.style.color = '';
        }
    }

    // ============================================================
    //  USER INFO
    // ============================================================
    function loadUserInfo() {
        try {
            const session = BCS.Storage.getSession();
            if (session && session.user) {
                const user = session.user;
                const nama = user.nama || user.name || 'User';
                const role = user.role || 'User';
                if (DOM.userName) DOM.userName.textContent = nama;
                if (DOM.userRole) DOM.userRole.textContent = role;
                if (DOM.userAvatar) DOM.userAvatar.textContent = nama.charAt(0).toUpperCase() || 'U';
                return { user, role, nama };
            }
        } catch (e) {
            console.warn('Load user info error:', e);
        }
        return null;
    }

    // ============================================================
    //  SIDEBAR
    // ============================================================
    function initSidebar() {
        setTimeout(() => {
            const menus = $$('.sidebar nav a.menu');
            menus.forEach(m => {
                if (m.getAttribute('href') && m.getAttribute('href').includes('history')) {
                    m.classList.add('active');
                } else {
                    m.classList.remove('active');
                }
            });
        }, 100);
    }

    // ============================================================
    //  AUTHORIZATION CHECK - ONLY ADMIN CAN ACCESS
    // ============================================================
    function checkAuthorization() {
        try {
            const session = BCS.Storage.getSession();
            if (!session || !session.user) {
                console.warn('[History] No session found, redirecting to login');
                window.location.href = 'login.html';
                return false;
            }

            const role = (session.user.role || '').toUpperCase();
            // Only ADMIN or ADMINISTRATOR allowed
            if (role !== 'ADMIN' && role !== 'ADMINISTRATOR') {
                console.warn('[History] Unauthorized role:', role, 'redirecting to dashboard');
                showToast('Akses ditolak. Hanya ADMIN yang dapat melihat riwayat.', 'error');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
                return false;
            }

            return true;
        } catch (e) {
            console.error('[History] Auth check error:', e);
            window.location.href = 'login.html';
            return false;
        }
    }

    // ============================================================
    //  AUTO-REFRESH COUNTDOWN
    // ============================================================
    function startCountdown() {
        if (state.countdownInterval) {
            clearInterval(state.countdownInterval);
            state.countdownInterval = null;
        }

        if (!state.autoRefresh) return;

        state.countdown = 7;
        updateCountdownDisplay();

        state.countdownInterval = setInterval(function() {
            state.countdown--;
            updateCountdownDisplay();

            if (state.countdown <= 0) {
                state.countdown = 7;
                updateCountdownDisplay();
                fetchReports();
            }
        }, 1000);
    }

    function updateCountdownDisplay() {
        if (DOM.countdownNumber) {
            DOM.countdownNumber.textContent = state.countdown;
        }
        if (DOM.countdownArea) {
            if (!state.autoRefresh || state.hasError) {
                DOM.countdownArea.classList.add('paused');
            } else {
                DOM.countdownArea.classList.remove('paused');
            }
        }
        if (DOM.countdownToggleIcon) {
            if (state.autoRefresh && !state.hasError) {
                DOM.countdownToggleIcon.className = 'bi bi-pause-fill';
            } else {
                DOM.countdownToggleIcon.className = 'bi bi-play-fill';
            }
        }
    }

    function resetCountdown() {
        if (state.countdownInterval) {
            clearInterval(state.countdownInterval);
            state.countdownInterval = null;
        }
        state.countdown = 7;
        state.errorCount = 0;
        state.hasError = false;
        state.autoRefresh = true;
        updateCountdownDisplay();
        fetchReports();
        if (state.autoRefresh) {
            startCountdown();
        }
    }

    function toggleAutoRefresh() {
        state.autoRefresh = !state.autoRefresh;
        if (state.autoRefresh && !state.hasError) {
            state.countdown = 7;
            updateCountdownDisplay();
            startCountdown();
        } else {
            if (state.countdownInterval) {
                clearInterval(state.countdownInterval);
                state.countdownInterval = null;
            }
            updateCountdownDisplay();
        }
    }

    function initCountdown() {
        if (DOM.countdownReset) {
            DOM.countdownReset.addEventListener('click', resetCountdown);
        }
        if (DOM.countdownToggle) {
            DOM.countdownToggle.addEventListener('click', toggleAutoRefresh);
        }
        state.autoRefresh = true;
        state.countdown = 7;
        updateCountdownDisplay();
        startCountdown();
    }

    // ============================================================
    //  FETCH REPORTS (Using getReports from backend)
    // ============================================================
    async function fetchReports() {
        if (state.loading) return;

        if (state.countdownInterval) {
            clearInterval(state.countdownInterval);
            state.countdownInterval = null;
        }

        // Show spinner in table
        if (DOM.tableBody) {
            DOM.tableBody.innerHTML =
                '<tr><td colspan="11" class="text-center py-5 text-muted"><div class="spinner-border spinner-border-sm mb-2"></div><br>Sedang memuat data...</td></tr>';
        }

        try {
            const api = window.BCS.Api || window.Api;
            if (!api) throw new Error('API tidak tersedia');

            let response;
            try {
                response = await api.post('getReports', {});
            } catch (apiErr) {
                console.warn('[History] POST failed, trying GET with JSONP...', apiErr);
                response = await api.request('GET', 'getReports', {});
            }

            console.log('[History] getReports response:', response);

            if (response && response.success) {
                state.errorCount = 0;
                state.hasError = false;
            } else {
                throw new Error(response?.message || 'Gagal memuat data');
            }

            let reports = response.data?.reports || [];

            // Filter by role (already admin, but safe)
            const session = BCS.Storage.getSession();
            const user = session?.user || {};
            const role = (user.role || '').toUpperCase();

            if (role !== 'ADMIN' && role !== 'ADMINISTRATOR') {
                const userNik = (user.nik || '').trim();
                const userNama = (user.nama || '').toLowerCase().trim();

                if (userNik || userNama) {
                    reports = reports.filter(function(r) {
                        const rNik = String(r.nik || '').trim();
                        const rNama = String(r.nama || r.pelapor || '').toLowerCase().trim();
                        if (userNik && rNik) return rNik === userNik;
                        if (userNama && rNama) return rNama === userNama;
                        return false;
                    });
                }
            }

            state.reports = reports;
            applyFilters();

        } catch (err) {
            console.error('[History] Fetch error:', err);
            state.errorCount++;
            state.hasError = true;

            // Show error in table
            if (DOM.tableBody) {
                DOM.tableBody.innerHTML =
                    `<tr><td colspan="11" class="text-center py-5 text-danger">
                        <i class="bi bi-exclamation-triangle fs-2 d-block mb-2"></i>
                        <strong>Gagal memuat data</strong><br>
                        <span class="text-muted">${escapeHtml(err.message || 'Coba refresh halaman')}</span>
                        <br><br>
                        <button class="btn btn-sm btn-primary" id="retryBtnHistory"><i class="bi bi-arrow-clockwise"></i> Coba Lagi</button>
                    </td></tr>`;
                const retryBtn = document.getElementById('retryBtnHistory');
                if (retryBtn) {
                    retryBtn.addEventListener('click', resetCountdown);
                }
            }

            if (state.errorCount >= state.maxErrors) {
                state.autoRefresh = false;
                if (state.countdownInterval) {
                    clearInterval(state.countdownInterval);
                    state.countdownInterval = null;
                }
                updateCountdownDisplay();
                showToast('Auto-refresh dihentikan karena gagal beberapa kali. Klik tombol refresh untuk mencoba lagi.', 'warning');
            } else {
                showToast('Gagal memuat data: ' + err.message, 'error');
            }

            state.reports = [];
            applyFilters();
        } finally {
            if (!state.hasError && state.autoRefresh) {
                state.countdown = 7;
                updateCountdownDisplay();
                startCountdown();
            } else if (state.hasError && state.autoRefresh) {
                state.countdown = 7;
                updateCountdownDisplay();
                startCountdown();
            }
        }
    }

    // ============================================================
    //  APPLY FILTERS
    // ============================================================
    function applyFilters() {
        const keyword = DOM.searchInput ? DOM.searchInput.value.toLowerCase().trim() : '';
        const status = DOM.filterStatus ? DOM.filterStatus.value : '';
        const sort = DOM.sortOrder ? DOM.sortOrder.value : 'desc';

        let result = state.reports.slice();

        if (keyword) {
            result = result.filter(function(r) {
                return (r.id || '').toLowerCase().includes(keyword) ||
                    (r.nama || r.pelapor || '').toLowerCase().includes(keyword) ||
                    (r.departemen || '').toLowerCase().includes(keyword) ||
                    (r.kategori || '').toLowerCase().includes(keyword) ||
                    (r.lokasi || '').toLowerCase().includes(keyword) ||
                    (r.deskripsi || '').toLowerCase().includes(keyword);
            });
        }

        if (status) {
            result = result.filter(function(r) { return (r.status || '').toUpperCase() === status; });
        }

        const activePill = document.querySelector('.quick-pills .pill.active');
        if (activePill) {
            const range = activePill.dataset.range;
            let start, end;
            switch (range) {
                case 'today':
                    const tr = getTodayRange();
                    start = tr.start;
                    end = tr.end;
                    break;
                case 'week':
                    const wr = getWeekRange();
                    start = wr.start;
                    end = wr.end;
                    break;
                case 'month':
                    const mr = getMonthRange();
                    start = mr.start;
                    end = mr.end;
                    break;
                case 'last3months':
                    const lr = getLast3MonthsRange();
                    start = lr.start;
                    end = lr.end;
                    break;
            }
            if (start || end) {
                result = result.filter(function(r) {
                    return isDateInRange(r.tanggal || r.createdAt, start, end);
                });
            }
        }

        result.sort(function(a, b) {
            const dateA = new Date(a.tanggal || a.createdAt || 0);
            const dateB = new Date(b.tanggal || b.createdAt || 0);
            return sort === 'desc' ? dateB - dateA : dateA - dateB;
        });

        state.filtered = result;
        state.currentPage = 1;
        renderAll();
    }

    // ============================================================
    //  RENDER ALL
    // ============================================================
    function renderAll() {
        renderSummary();
        renderTable();
        renderPagination();
    }

    // ============================================================
    //  RENDER SUMMARY
    // ============================================================
    function renderSummary() {
        const total = state.filtered.length;
        const open = state.filtered.filter(function(r) { return (r.status || '').toUpperCase() === 'OPEN'; }).length;
        const progress = state.filtered.filter(function(r) { return (r.status || '').toUpperCase() === 'PROGRESS'; })
        .length;
        const done = state.filtered.filter(function(r) { return (r.status || '').toUpperCase() === 'DONE'; }).length;

        if (DOM.cardTotal) DOM.cardTotal.textContent = total;
        if (DOM.cardOpen) DOM.cardOpen.textContent = open;
        if (DOM.cardProgress) DOM.cardProgress.textContent = progress;
        if (DOM.cardDone) DOM.cardDone.textContent = done;
        if (DOM.totalReports) DOM.totalReports.textContent = total;

        const now = new Date();
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);

        const lastWeek = state.reports.filter(function(r) {
            const d = parseDate(r.tanggal || r.createdAt);
            if (!d) return false;
            return d >= weekAgo;
        });

        const lwTotal = lastWeek.length;
        const lwOpen = lastWeek.filter(function(r) { return (r.status || '').toUpperCase() === 'OPEN'; }).length;
        const lwProgress = lastWeek.filter(function(r) { return (r.status || '').toUpperCase() === 'PROGRESS'; }).length;
        const lwDone = lastWeek.filter(function(r) { return (r.status || '').toUpperCase() === 'DONE'; }).length;

        if (DOM.totalTrend) DOM.totalTrend.textContent = total - lwTotal;
        if (DOM.openTrend) DOM.openTrend.textContent = open - lwOpen;
        if (DOM.progressTrend) DOM.progressTrend.textContent = progress - lwProgress;
        if (DOM.doneTrend) DOM.doneTrend.textContent = done - lwDone;
    }

    // ============================================================
    //  RENDER TABLE
    // ============================================================
    function renderTable() {
        if (!DOM.tableBody) return;

        const start = (state.currentPage - 1) * state.perPage;
        const pageData = state.filtered.slice(start, start + state.perPage);

        if (state.hasError && state.reports.length === 0) {
            if (DOM.tableBody && DOM.tableBody.innerHTML.includes('Memuat data')) {
                DOM.tableBody.innerHTML =
                    `<tr><td colspan="11" class="text-center py-5 text-danger">
                        <i class="bi bi-exclamation-triangle fs-2 d-block mb-2"></i>
                        <strong>Gagal memuat data</strong><br>
                        <span class="text-muted">Silakan refresh halaman atau coba lagi nanti</span>
                        <br><br>
                        <button class="btn btn-sm btn-primary" id="retryBtnHistory"><i class="bi bi-arrow-clockwise"></i> Coba Lagi</button>
                    </td></tr>`;
                const retryBtn = document.getElementById('retryBtnHistory');
                if (retryBtn) {
                    retryBtn.addEventListener('click', resetCountdown);
                }
            }
            if (DOM.emptyState) DOM.emptyState.classList.add('d-none');
            return;
        }

        if (pageData.length === 0) {
            DOM.tableBody.innerHTML =
                '<tr><td colspan="11" class="text-center py-4 text-muted"><i class="bi bi-inbox fs-4 d-block mb-2"></i>Tidak ada data</td></tr>';
            if (DOM.emptyState) DOM.emptyState.classList.remove('d-none');
            return;
        }
        if (DOM.emptyState) DOM.emptyState.classList.add('d-none');

        let html = '';
        pageData.forEach(function(r, idx) {
            const globalIdx = start + idx + 1;
            const status = (r.status || 'OPEN').toUpperCase();
            const statusClass = status === 'OPEN' ? 'open' : status === 'PROGRESS' ? 'progress' : 'done';

            const prioritas = r.prioritas || r.priority || 'NORMAL';
            const prioritasBadge = prioritas === 'HIGH' || prioritas === 'TINGGI' ?
                '<span class="badge bg-danger" style="font-size:9px;">TINGGI</span>' :
                prioritas === 'MEDIUM' || prioritas === 'SEDANG' ?
                '<span class="badge bg-warning text-dark" style="font-size:9px;">SEDANG</span>' :
                '<span class="badge bg-secondary" style="font-size:9px;">RENDAH</span>';

            const hasPhoto = r.foto && r.foto.trim() !== '';

            html +=
                `
            <tr>
                <td class="report-id">${globalIdx}</td>
                <td><span class="badge-status ${statusClass}">${status}</span></td>
                <td class="report-id">${escapeHtml(r.id || '-')}</td>
                <td>${escapeHtml(r.nama || r.pelapor || '-')}</td>
                <td>${escapeHtml(r.departemen || '-')}</td>
                <td>${escapeHtml(r.kategori || '-')}</td>
                <td>${escapeHtml(r.lokasi || '-')}</td>
                <td><span class="text-truncate-2" title="${escapeHtml(r.deskripsi || '-')}">${escapeHtml(truncate(r.deskripsi || '-', 35))}</span></td>
                <td>${prioritasBadge}</td>
                <td>${formatDate(r.tanggal || r.createdAt)}</td>
                <td>
                    <div class="d-flex gap-1">
                        <button class="btn-action primary view-detail" data-id="${escapeHtml(r.id)}" title="Detail"><i class="bi bi-eye"></i></button>
                        ${hasPhoto ? `<button class="btn-action view-photo" data-src="${escapeHtml(r.foto)}" title="Foto"><i class="bi bi-image"></i></button>` : ''}
                        <button class="btn-action warning edit-report" data-id="${escapeHtml(r.id)}" title="Update"><i class="bi bi-pencil-square"></i></button>
                    </div>
                </td>
            </tr>
        `;
        });

        DOM.tableBody.innerHTML = html;
    }

    // ============================================================
    //  RENDER PAGINATION
    // ============================================================
    function renderPagination() {
        if (!DOM.pagination) return;
        const totalPages = Math.ceil(state.filtered.length / state.perPage);
        if (totalPages <= 1) {
            DOM.pagination.innerHTML = '';
            return;
        }

        let html = '';
        html += '<li class="page-item ' + (state.currentPage === 1 ? 'disabled' : '') +
            '"><a class="page-link" href="#" data-page="' + (state.currentPage - 1) + '">&laquo;</a></li>';

        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= state.currentPage - 1 && i <= state.currentPage + 1)) {
                html += '<li class="page-item ' + (i === state.currentPage ? 'active' : '') +
                    '"><a class="page-link" href="#" data-page="' + i + '">' + i + '</a></li>';
            } else if (i === state.currentPage - 2 || i === state.currentPage + 2) {
                html += '<li class="page-item disabled"><span class="page-link">…</span></li>';
            }
        }

        html += '<li class="page-item ' + (state.currentPage === totalPages ? 'disabled' : '') +
            '"><a class="page-link" href="#" data-page="' + (state.currentPage + 1) + '">&raquo;</a></li>';
        DOM.pagination.innerHTML = html;

        DOM.pagination.querySelectorAll('.page-link').forEach(function(link) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const page = parseInt(this.dataset.page);
                if (page && page >= 1 && page <= totalPages) {
                    state.currentPage = page;
                    renderTable();
                    renderPagination();
                }
            });
        });
    }

    // ============================================================
    //  OPEN DETAIL
    // ============================================================
    function openDetail(id) {
        const report = state.reports.find(function(r) { return r.id == id; });
        if (!report) {
            showToast('Data tidak ditemukan', 'error');
            return;
        }
        state.currentDetail = report;

        const status = report.status || 'OPEN';
        const statusBadge = status === 'DONE' ?
            '<span class="badge bg-success" style="font-size:13px;padding:5px 14px;">DONE</span>' :
            status === 'PROGRESS' ?
            '<span class="badge bg-warning text-dark" style="font-size:13px;padding:5px 14px;">PROGRESS</span>' :
            '<span class="badge bg-danger" style="font-size:13px;padding:5px 14px;">OPEN</span>';

        const sla = report.sla || '-';
        const slaBadge = sla === 'FAST' ?
            '<span class="badge bg-success" style="font-size:12px;padding:4px 12px;">FAST</span>' :
            sla === 'NORMAL' ?
            '<span class="badge bg-warning text-dark" style="font-size:12px;padding:4px 12px;">NORMAL</span>' :
            sla === 'LATE' ?
            '<span class="badge bg-danger" style="font-size:12px;padding:4px 12px;">LATE</span>' :
            '<span class="badge bg-secondary" style="font-size:12px;padding:4px 12px;">' + sla + '</span>';

        const fotoHtml = report.foto ?
            '<a href="' + report.foto +
            '" target="_blank" class="btn btn-sm btn-outline-primary"><i class="bi bi-image"></i> Lihat Foto</a>' :
            '<span class="text-muted">-</span>';

        const html =
            `
        <div class="d-flex justify-content-between align-items-start mb-3 pb-2" style="border-bottom:2px solid var(--border-color);">
            <div>
                <h5 class="fw-bold" style="color:var(--text-primary);">${escapeHtml(report.id || '-')}</h5>
                <span class="text-muted" style="font-size:13px;">${formatDate(report.tanggal || report.createdAt)}</span>
            </div>
            <div class="d-flex gap-2">
                ${statusBadge}
                ${slaBadge}
            </div>
        </div>

        <div class="row g-3">
            <div class="col-md-6">
                <div class="info-grid"><span class="label">Tanggal Lapor</span><span class="value">${formatDate(report.tanggal || report.createdAt)}</span></div>
                <div class="info-grid"><span class="label">Tanggal Selesai</span><span class="value">${formatDate(report.tglSelesai)}</span></div>
                <div class="info-grid"><span class="label">Durasi</span><span class="value fw-semibold">${escapeHtml(report.durasi || '-')}</span></div>
                <div class="info-grid"><span class="label">Pelapor</span><span class="value">${escapeHtml(report.nama || report.pelapor || '-')}</span></div>
                <div class="info-grid"><span class="label">Departemen</span><span class="value">${escapeHtml(report.departemen || '-')}</span></div>
            </div>
            <div class="col-md-6">
                <div class="info-grid"><span class="label">Kategori</span><span class="value">${escapeHtml(report.kategori || '-')}</span></div>
                <div class="info-grid"><span class="label">Lokasi</span><span class="value">${escapeHtml(report.lokasi || '-')}</span></div>
                <div class="info-grid"><span class="label">Prioritas</span><span class="value">${escapeHtml(report.prioritas || '-')}</span></div>
                <div class="info-grid"><span class="label">Teknisi</span><span class="value">${escapeHtml(report.teknisi || '-')}</span></div>
                <div class="info-grid"><span class="label">SLA</span><span class="value">${escapeHtml(report.sla || '-')}</span></div>
                <div class="info-grid"><span class="label">Foto</span><span class="value">${fotoHtml}</span></div>
            </div>
        </div>

        <div class="mt-3 pt-2" style="border-top:1px solid var(--border-color);">
            <div class="info-grid" style="grid-template-columns:1fr;">
                <span class="label">Deskripsi</span>
                <div class="value deskripsi-box">${escapeHtml(report.deskripsi || '-')}</div>
            </div>
        </div>

        ${report.catatanTeknisi ? `
        <div class="mt-3">
            <div class="info-grid" style="grid-template-columns:1fr;">
                <span class="label">Catatan Teknisi</span>
                <div class="value deskripsi-box" style="border-left-color:#f59e0b;">${escapeHtml(report.catatanTeknisi)}</div>
            </div>
        </div>
        ` : ''}
    `;

        if (DOM.detailContent) DOM.detailContent.innerHTML = html;
        const modal = new bootstrap.Modal(document.getElementById('detailModal'));
        modal.show();
    }

    // ============================================================
    //  OPEN UPDATE
    // ============================================================
    function openUpdate(id) {
        const report = state.reports.find(function(r) { return r.id == id; });
        if (!report) {
            showToast('Data tidak ditemukan', 'error');
            return;
        }

        if (DOM.updateId) DOM.updateId.value = report.id || '';
        if (DOM.updateStatus) DOM.updateStatus.value = report.status || 'OPEN';
        if (DOM.updateTeknisi) DOM.updateTeknisi.value = report.teknisi || '';
        if (DOM.updateCatatan) DOM.updateCatatan.value = report.catatanTeknisi || '';

        const modal = new bootstrap.Modal(document.getElementById('updateModal'));
        modal.show();
    }

    // ============================================================
    //  SAVE UPDATE
    // ============================================================
    async function saveUpdate() {
        const id = DOM.updateId ? DOM.updateId.value : '';
        const status = DOM.updateStatus ? DOM.updateStatus.value : '';
        const teknisi = DOM.updateTeknisi ? DOM.updateTeknisi.value.trim() : '';
        const catatan = DOM.updateCatatan ? DOM.updateCatatan.value.trim() : '';

        if (!id) {
            showToast('ID laporan tidak valid', 'error');
            return;
        }

        const btn = DOM.saveUpdateBtn;
        try {
            if (btn) { btn.disabled = true;
                btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Menyimpan...'; }

            const api = window.BCS.Api || window.Api;
            const payload = { id: id, status: status, teknisi: teknisi, catatan: catatan };
            const response = await api.post('updateReport', payload);

            if (response && response.success) {
                showToast('✅ Status berhasil diperbarui!', 'success');
                const modal = bootstrap.Modal.getInstance(document.getElementById('updateModal'));
                if (modal) modal.hide();
                await fetchReports();
            } else {
                showToast('❌ Gagal update: ' + (response?.message || 'Unknown error'), 'error');
            }
        } catch (err) {
            console.error('Update error:', err);
            showToast('❌ Terjadi kesalahan: ' + err.message, 'error');
        } finally {
            if (btn) { btn.disabled = false;
                btn.innerHTML = '<i class="bi bi-check-circle"></i> Simpan'; }
        }
    }

    // ============================================================
    //  EXPORT FUNCTIONS
    // ============================================================
    function exportDetailPDF() {
        const report = state.currentDetail;
        if (!report) {
            showToast('Tidak ada data untuk diexport', 'error');
            return;
        }

        const jsPDF = window.jspdf.jsPDF;
        const doc = new jsPDF('p', 'mm', 'a4');

        doc.setFontSize(18);
        doc.setTextColor(30, 94, 255);
        doc.text('Building Care System Enterprise', 14, 20);

        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text('Detail Laporan', 14, 30);

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text('Radiant Group Duri', 14, 36);

        doc.setDrawColor(30, 94, 255);
        doc.line(14, 40, 196, 40);

        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);

        const fields = [
            ['ID', report.id || '-'],
            ['Tanggal Lapor', formatDate(report.tanggal || report.createdAt)],
            ['Tanggal Selesai', formatDate(report.tglSelesai)],
            ['Durasi', report.durasi || '-'],
            ['SLA', report.sla || '-'],
            ['Pelapor', report.nama || report.pelapor || '-'],
            ['Departemen', report.departemen || '-'],
            ['Kategori', report.kategori || '-'],
            ['Lokasi', report.lokasi || '-'],
            ['Prioritas', report.prioritas || '-'],
            ['Status', report.status || '-'],
            ['Deskripsi', report.deskripsi || '-'],
            ['Teknisi', report.teknisi || '-'],
            ['Catatan Teknisi', report.catatanTeknisi || '-']
        ];

        let y = 48;
        fields.forEach(function(field) {
            if (y > 270) {
                doc.addPage();
                y = 20;
            }
            doc.setFont('helvetica', 'bold');
            doc.text(field[0] + ':', 14, y);
            doc.setFont('helvetica', 'normal');
            const wrappedText = doc.splitTextToSize(field[1] || '-', 160);
            doc.text(wrappedText, 60, y);
            y += (wrappedText.length * 5) + 4;
        });

        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text('Generated: ' + new Date().toLocaleString('id-ID'), 14, 280);
        doc.text('System by Radiant Group', 14, 285);

        doc.save('Detail_Laporan_' + (report.id || 'export') + '.pdf');
        showToast('Export PDF berhasil', 'success');
    }

    function exportExcel() {
        if (state.filtered.length === 0) {
            showToast('Tidak ada data untuk diexport', 'warning');
            return;
        }

        const data = state.filtered.map(function(r) {
            return {
                'ID': r.id || '-',
                'Tanggal': formatDate(r.tanggal || r.createdAt),
                'Pelapor': r.nama || r.pelapor || '-',
                'Departemen': r.departemen || '-',
                'Kategori': r.kategori || '-',
                'Lokasi': r.lokasi || '-',
                'Deskripsi': r.deskripsi || '-',
                'Status': r.status || '-',
                'Prioritas': r.prioritas || '-',
                'Teknisi': r.teknisi || '-',
                'SLA': r.sla || '-'
            };
        });

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, 'History');
        XLSX.writeFile(wb, 'Riwayat_Laporan_' + new Date().toISOString().slice(0, 10) + '.xlsx');
        showToast('Berhasil export ' + data.length + ' data ke Excel!', 'success');
    }

    function exportPDF() {
        if (state.filtered.length === 0) {
            showToast('Tidak ada data untuk diexport', 'warning');
            return;
        }

        const jsPDF = window.jspdf.jsPDF;
        const doc = new jsPDF('l', 'mm', 'a4');

        doc.setFontSize(16);
        doc.setTextColor(30, 94, 255);
        doc.text('Building Care System Enterprise', 14, 20);
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text('Riwayat Laporan', 14, 30);
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text('Generated: ' + new Date().toLocaleString('id-ID') + ' | Total: ' + state.filtered.length +
            ' data', 14, 36);

        const headers = ['ID', 'Tanggal', 'Pelapor', 'Departemen', 'Kategori', 'Lokasi', 'Status', 'Prioritas', 'SLA'];
        const colWidths = [30, 30, 30, 30, 28, 30, 22, 22, 20];
        let y = 44;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        headers.forEach(function(h, i) {
            let x = 14;
            for (let j = 0; j < i; j++) x += colWidths[j];
            doc.text(h, x, y);
        });
        y += 4;
        doc.setDrawColor(200, 200, 200);
        doc.line(14, y, 14 + colWidths.reduce(function(a, b) { return a + b; }, 0), y);
        y += 4;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        const rowsToExport = state.filtered.slice(0, 100);
        rowsToExport.forEach(function(r) {
            if (y > 270) {
                doc.addPage();
                y = 20;
                doc.setFont('helvetica', 'bold');
                headers.forEach(function(h, i) {
                    let x = 14;
                    for (let j = 0; j < i; j++) x += colWidths[j];
                    doc.text(h, x, y);
                });
                y += 4;
                doc.line(14, y, 14 + colWidths.reduce(function(a, b) { return a + b; }, 0), y);
                y += 4;
                doc.setFont('helvetica', 'normal');
            }

            const rowData = [
                r.id || '-',
                formatDate(r.tanggal || r.createdAt),
                (r.nama || r.pelapor || '-').slice(0, 15),
                (r.departemen || '-').slice(0, 15),
                (r.kategori || '-').slice(0, 15),
                (r.lokasi || '-').slice(0, 15),
                r.status || '-',
                r.prioritas || '-',
                r.sla || '-'
            ];

            let x = 14;
            rowData.forEach(function(val, i) {
                doc.text(String(val), x, y);
                x += colWidths[i];
            });
            y += 5;
        });

        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text('System by Radiant Group', 14, 290);

        doc.save('Riwayat_Laporan_' + new Date().toISOString().slice(0, 10) + '.pdf');
        showToast('Berhasil export ' + rowsToExport.length + ' data ke PDF!', 'success');
    }

    // ============================================================
    //  BIND EVENTS
    // ============================================================
    function bindEvents() {
        if (DOM.searchInput) {
            DOM.searchInput.addEventListener('input', function() {
                document.querySelectorAll('.quick-pills .pill').forEach(function(p) {
                    p.classList.remove('active');
                });
                applyFilters();
            });
        }

        if (DOM.filterStatus) {
            DOM.filterStatus.addEventListener('change', applyFilters);
        }

        if (DOM.sortOrder) {
            DOM.sortOrder.addEventListener('change', applyFilters);
        }

        document.querySelectorAll('.quick-pills .pill').forEach(function(pill) {
            pill.addEventListener('click', function() {
                document.querySelectorAll('.quick-pills .pill').forEach(function(p) {
                    p.classList.remove('active');
                });
                this.classList.add('active');
                applyFilters();
            });
        });

        if (DOM.refreshBtn) {
            DOM.refreshBtn.addEventListener('click', resetCountdown);
        }

        if (DOM.exportExcelBtn) {
            DOM.exportExcelBtn.addEventListener('click', exportExcel);
        }
        if (DOM.exportPdfBtn) {
            DOM.exportPdfBtn.addEventListener('click', exportPDF);
        }
        if (DOM.exportDetailPdfBtn) {
            DOM.exportDetailPdfBtn.addEventListener('click', exportDetailPDF);
        }

        if (DOM.saveUpdateBtn) {
            DOM.saveUpdateBtn.addEventListener('click', saveUpdate);
        }

        if (DOM.tableBody) {
            DOM.tableBody.addEventListener('click', function(e) {
                const target = e.target.closest('.view-detail');
                if (target) {
                    e.preventDefault();
                    openDetail(target.dataset.id);
                    return;
                }
                const photoBtn = e.target.closest('.view-photo');
                if (photoBtn) {
                    e.preventDefault();
                    const src = photoBtn.dataset.src;
                    if (src && DOM.modalPhoto) {
                        DOM.modalPhoto.src = src;
                        const modal = new bootstrap.Modal(document.getElementById('photoModal'));
                        modal.show();
                    }
                    return;
                }
                const editBtn = e.target.closest('.edit-report');
                if (editBtn) {
                    e.preventDefault();
                    openUpdate(editBtn.dataset.id);
                    return;
                }
            });
        }
    }

    // ============================================================
    //  INIT
    // ============================================================
    async function init() {
        cacheDom();
        initDarkMode();
        loadUserInfo();
        initSidebar();

        // 🔐 AUTHORIZATION CHECK - ONLY ADMIN
        if (!checkAuthorization()) {
            return;
        }

        bindEvents();
        initCountdown();
        await fetchReports();
        console.log('✅ History page initialized with auto-refresh (7s) - Loading overlay removed');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
