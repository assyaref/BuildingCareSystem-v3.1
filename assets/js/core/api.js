// ======================================================
// Building Care System Enterprise v6.5 FINAL
// Core API Framework - Device/IP Heartbeat Support
// Radiant Group Duri
// ======================================================

"use strict";
if (!window.BCS) window.BCS = {};
if (!BCS.Events) {
    BCS.Events = {
        on: () => {}, off: () => {},
        emit: (event) => {
            const loader = document.getElementById('loading');
            if (!loader) return;
            if (event === "loading:start") loader.style.display = "flex";
            if (event === "loading:end") loader.style.display = "none";
        }
    };
}

const API_URL = (typeof CONFIG !== 'undefined' && CONFIG.API?.URL) ||
                (window.CONFIG?.API?.URL) ||
                "https://script.google.com/macros/s/AKfycbzN3jSKv-RywufMhzub5SAbReV0ES31_4AMZP7Us4UxhskijtydQYpOWmPgCKQ9GmzH2w/exec";

const Api = (() => {
    let loadingCounter = 0;
    function showLoading(){ if (++loadingCounter === 1) BCS.Events.emit("loading:start"); }
    function hideLoading(){ loadingCounter=Math.max(0,loadingCounter-1); if (!loadingCounter) BCS.Events.emit("loading:end"); }

    function getToken() {
        if (window.Session && typeof Session.getToken === 'function') {
            const token = Session.getToken();
            if (token && token !== "undefined" && token !== "null") return token;
        }
        try {
            const token = localStorage.getItem("token");
            if (token && token !== "undefined" && token !== "null") return token;
            const raw = localStorage.getItem("BCS_SESSION");
            if (raw) return JSON.parse(raw)?.token || null;
        } catch (e) {}
        return null;
    }

    async function request(method, action, data = {}) {
        showLoading();
        try {
            const token = getToken();
            const payload = { action, data };
            if (token) payload.token = token;

            console.log(`[API] ${method} ${action}`, payload);

            const response = await fetch(API_URL, {
                method: 'POST',
                mode: 'cors',
                cache: 'no-cache',
                headers: {'Content-Type':'text/plain;charset=utf-8','Accept':'application/json'},
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            const text = await response.text();
            console.log('[API] Response:', text);

            let result;
            try { result = JSON.parse(text); }
            catch (e) { result = {success:true,message:text||"Request sent",data:{}}; }

            if (result?.success === false &&
                ["Session expired","Session Expired","Token expired"].includes(result.message)) {
                if (window.Session?.clear) Session.clear();
                localStorage.removeItem("token");
                localStorage.removeItem("BCS_SESSION");
                if (!location.pathname.includes('login.html')) location.href='login.html';
            }
            return result;
        } catch (error) {
            console.error("[API] Request failed:", error);
            if (/CORS|Failed to fetch|NetworkError/i.test(error.message)) {
                return await requestJsonp(action, data);
            }
            return {success:false,message:error.message||"Request failed"};
        } finally {
            hideLoading();
        }
    }

    function requestJsonp(action, data = {}) {
        return new Promise(resolve => {
            try {
                const token=getToken();
                const callbackName='callback_'+Date.now()+'_'+Math.random().toString(36).substr(2,5);
                const params=new URLSearchParams();
                params.append('action',action);
                params.append('data',JSON.stringify(data));
                if(token) params.append('token',token);
                params.append('callback',callbackName);

                const script=document.createElement('script');
                script.src=`${API_URL}?${params.toString()}`;
                script.async=true;

                const timeout=setTimeout(()=>{
                    script.remove(); delete window[callbackName];
                    resolve({success:false,message:"JSONP request timeout"});
                },15000);

                window[callbackName]=response=>{
                    clearTimeout(timeout); script.remove(); delete window[callbackName];
                    resolve(response||{success:true,data:{}});
                };
                script.onerror=()=>{
                    clearTimeout(timeout); script.remove(); delete window[callbackName];
                    resolve({success:false,message:"JSONP request failed"});
                };
                document.body.appendChild(script);
            } catch(error) {
                resolve({success:false,message:error.message||"JSONP request failed"});
            }
        });
    }

    async function heartbeat(clientInfo = {}) {
        try {
            const token = getToken();
            if (!token) return false;

            const data = {
                token,
                device: clientInfo.device || '',
                device_id: clientInfo.device_id || '',
                device_name: clientInfo.device_name || '',
                browser: clientInfo.browser || '',
                os: clientInfo.os || '',
                public_ip: clientInfo.public_ip || clientInfo.ip_address || '',
                ip_address: clientInfo.ip_address || clientInfo.public_ip || '',
                user_agent: clientInfo.user_agent || ''
            };

            const response = await request("POST", "heartbeat", data);
            return !!(response && response.success);
        } catch (e) {
            console.warn("[API] Heartbeat failed:", e);
            return false;
        }
    }

    // =============================================
    // ELECTRICITY MANAGEMENT API
    // =============================================

    // --- READ ---
    async function getElectricityDashboard() {
        const response = await request('POST', 'getElectricityDashboard', {});
        if (!response.success) return response;

        const d = response.data || {};
        const summary = d.summary || {};

        response.data = {
            totalRecord: summary.totalRecord || 0,
            totalMeter: summary.totalMeter || 0,
            totalKwh: summary.totalKwh || 0,
            totalNominal: summary.totalNominal || 0,
            averageKwh: summary.averageKwhPerMeter || 0,
            averageMonth: summary.averageKwhPerRecord || 0,
            efficiency: summary.totalRecord > 0 ? Math.round((summary.totalMeter / summary.totalRecord) * 100) : 0,
            growth: d.trend && d.trend.length > 1 ? (d.trend[d.trend.length-1].percentChange || 0) : 0,
            highestMonth: d.chart && d.chart.length ? d.chart.reduce((a,b) => a.value > b.value ? a : b).month : '-',
            lowestMonth: d.chart && d.chart.length ? d.chart.reduce((a,b) => a.value < b.value ? a : b).month : '-',
            highestEntity: summary.entity && summary.entity.length ? summary.entity[0].entitas : '-',
            lowestEntity: summary.entity && summary.entity.length ? summary.entity[summary.entity.length-1].entitas : '-',
            monthly: d.chart || [],
            trend: d.trend || [],
            benchmark: d.benchmark || [],
            entity: summary.entity || [],
            topConsumer: (d.entityTop && d.entityTop.topUsage) || [],
            alerts: d.latestAlerts || []
        };

        return response;
    }

    async function getElectricityList() {
        const response = await request('POST', 'getElectricityList', {});
        if (!response.success) return response;

        const list = response.data || [];
        response.data = list.map(item => ({
            bulan: item.bulan || item.month || '',
            no: item.no || item.posisi || item.posisiMeteran || '',
            idPelanggan: item.idPelanggan || item.id || '',
            entitas: item.entitas || item.entity || '',
            awal: item.awal || 0,
            akhir: item.akhir || 0,
            pemakaian: item.pemakaian || item.kwh || 0,
            nominal: item.nominal || 0,
            status: item.status || 'NORMAL',
            keterangan: item.keterangan || ''
        }));

        return response;
    }

    async function getElectricityDetail(id) {
        const response = await request('POST', 'getElectricityDetail', { id });
        if (!response.success) return response;

        const data = response.data || {};
        const history = data.history || [];

        response.data = {
            id: data.id || id,
            entity: data.entity || (history.length ? history[0].entitas : '-'),
            totalKwh: history.reduce((s, r) => s + (r.pemakaian || 0), 0),
            totalNominal: history.reduce((s, r) => s + (r.nominal || 0), 0),
            history: history.map(r => ({
                month: r.bulan || r.month || '',
                awal: r.awal || 0,
                akhir: r.akhir || 0,
                kwh: r.pemakaian || r.kwh || 0,
                nominal: r.nominal || 0,
                status: r.status || 'NORMAL'
            }))
        };

        return response;
    }

    async function getElectricitySummary() {
        return request('POST', 'getElectricitySummary', {});
    }

    async function getElectricityChart() {
        return request('POST', 'getElectricityChart', {});
    }

    async function getElectricityAlerts() {
        return request('POST', 'getElectricityAlerts', {});
    }

    async function getElectricityBenchmark() {
        return request('POST', 'getElectricityBenchmark', {});
    }

    async function getElectricityTopConsumer() {
        return request('POST', 'getTopConsumer', {});
    }

    async function getElectricityTrend() {
        return request('POST', 'getElectricityTrend', {});
    }

    async function refreshElectricityCache() {
        return request('POST', 'refreshElectricityCache', {});
    }

    // --- CRUD ---
    async function createElectricityRecord(data) {
        return request('POST', 'createElectricityRecord', data);
    }

    async function updateElectricityRecord(data) {
        return request('POST', 'updateElectricityRecord', data);
    }

    async function deleteElectricityRecord(data) {
        return request('POST', 'deleteElectricityRecord', data);
    }

    // =============================================
    // EXPORT FUNCTIONS - DIPERBAIKI
    // =============================================

    /**
     * Export electricity table to PDF
     * @param {Object} filter - Filter data (keyword, status, page, pageSize)
     * @returns {Promise<Blob>} PDF file as blob
     */
    async function exportElectricityTable(filter = {}) {
        try {
            console.log('[API] exportElectricityTable called with filter:', filter);
            
            // Gunakan request biasa untuk mendapatkan data
            const response = await request('POST', 'exportElectricityTable', {
                keyword: filter.keyword || '',
                status: filter.status || 'ALL',
                page: filter.page || 1,
                pageSize: filter.pageSize || 10
            });

            console.log('[API] exportElectricityTable response:', response);

            // Cek apakah response sukses
            if (!response.success) {
                throw new Error(response.message || 'Gagal export data');
            }

            // Cek berbagai format response yang mungkin
            const data = response.data || {};

            // Format 1: Langsung blob URL
            if (data.url) {
                console.log('[API] Fetching PDF from URL:', data.url);
                const blobResponse = await fetch(data.url);
                if (!blobResponse.ok) {
                    throw new Error(`Failed to fetch PDF: ${blobResponse.status}`);
                }
                return await blobResponse.blob();
            }

            // Format 2: Base64 encoded PDF
            if (data.pdfBase64 || data.base64 || data.pdf) {
                const base64 = data.pdfBase64 || data.base64 || data.pdf;
                console.log('[API] Decoding base64 PDF, length:', base64.length);
                
                // Remove data URL prefix if present
                let cleanBase64 = base64;
                if (base64.includes('base64,')) {
                    cleanBase64 = base64.split('base64,')[1];
                }
                
                const byteCharacters = atob(cleanBase64);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                return new Blob([byteArray], { type: 'application/pdf' });
            }

            // Format 3: Response adalah blob langsung (jika fetch dengan responseType blob)
            if (response instanceof Blob) {
                return response;
            }

            // Format 4: Data dalam bentuk array buffer atau string
            if (data.content || data.data) {
                const content = data.content || data.data;
                if (typeof content === 'string') {
                    // Coba parse sebagai base64
                    try {
                        const byteCharacters = atob(content);
                        const byteNumbers = new Array(byteCharacters.length);
                        for (let i = 0; i < byteCharacters.length; i++) {
                            byteNumbers[i] = byteCharacters.charCodeAt(i);
                        }
                        const byteArray = new Uint8Array(byteNumbers);
                        return new Blob([byteArray], { type: 'application/pdf' });
                    } catch (e) {
                        // Jika bukan base64, coba sebagai text
                        return new Blob([content], { type: 'application/pdf' });
                    }
                }
            }

            // Jika semua format gagal, coba buat PDF dari HTML table (fallback)
            console.warn('[API] No recognized PDF format, creating fallback PDF from table data');
            return await createFallbackPDF(filter);

        } catch (error) {
            console.error('[API] exportElectricityTable error:', error);
            throw error;
        }
    }

    /**
     * Create fallback PDF from table data (client-side)
     */
    async function createFallbackPDF(filter) {
        try {
            // Ambil data dari state jika tersedia
            const data = filter._records || [];
            if (!data || data.length === 0) {
                throw new Error('Tidak ada data untuk diexport');
            }

            // Gunakan library jsPDF jika tersedia
            if (typeof window.jspdf !== 'undefined') {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF('l', 'mm', 'a4');
                const pageWidth = doc.internal.pageSize.getWidth();
                
                // Header
                doc.setFontSize(16);
                doc.text('Data Pemakaian Listrik', pageWidth/2, 20, { align: 'center' });
                doc.setFontSize(10);
                doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 14, 30);
                
                // Table
                const headers = ['No', 'Bulan', 'Posisi', 'ID Pelanggan', 'Entitas', 'Awal', 'Akhir', 'Pemakaian', 'Nominal'];
                const rows = data.map((item, idx) => [
                    idx + 1,
                    item.bulan || '',
                    item.no || '-',
                    item.idPelanggan || '',
                    item.entitas || '',
                    (item.awal || 0).toLocaleString('id-ID'),
                    (item.akhir || 0).toLocaleString('id-ID'),
                    (item.pemakaian || 0).toLocaleString('id-ID'),
                    'Rp ' + (item.nominal || 0).toLocaleString('id-ID')
                ]);

                doc.autoTable({
                    head: [headers],
                    body: rows,
                    startY: 40,
                    styles: { fontSize: 8 },
                    headStyles: { fillColor: [67, 24, 255] },
                    columnStyles: {
                        0: { cellWidth: 10 },
                        1: { cellWidth: 20 },
                        2: { cellWidth: 25 },
                        3: { cellWidth: 25 },
                        4: { cellWidth: 20 },
                        5: { cellWidth: 20 },
                        6: { cellWidth: 20 },
                        7: { cellWidth: 20 },
                        8: { cellWidth: 25 }
                    }
                });

                return doc.output('blob');
            }

            // Fallback: Buat blob HTML
            const html = `
                <html>
                <head><title>Data Listrik</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h1 { color: #4318ff; }
                    table { border-collapse: collapse; width: 100%; margin-top: 20px; }
                    th { background: #4318ff; color: white; padding: 8px; text-align: left; }
                    td { padding: 6px 8px; border: 1px solid #ddd; }
                    tr:nth-child(even) { background: #f9f9f9; }
                    .footer { margin-top: 30px; font-size: 12px; color: #666; }
                </style>
                </head>
                <body>
                <h1>Data Pemakaian Listrik</h1>
                <p>Tanggal: ${new Date().toLocaleDateString('id-ID')}</p>
                <table>
                    <thead><tr>
                        <th>No</th><th>Bulan</th><th>Posisi</th>
                        <th>ID Pelanggan</th><th>Entitas</th>
                        <th>Awal</th><th>Akhir</th><th>Pemakaian</th><th>Nominal</th>
                    </tr></thead>
                    <tbody>
                        ${data.map((item, idx) => `
                            <tr>
                                <td>${idx + 1}</td>
                                <td>${item.bulan || ''}</td>
                                <td>${item.no || '-'}</td>
                                <td>${item.idPelanggan || ''}</td>
                                <td>${item.entitas || ''}</td>
                                <td>${(item.awal || 0).toLocaleString('id-ID')}</td>
                                <td>${(item.akhir || 0).toLocaleString('id-ID')}</td>
                                <td>${(item.pemakaian || 0).toLocaleString('id-ID')}</td>
                                <td>Rp ${(item.nominal || 0).toLocaleString('id-ID')}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div class="footer">Generated by Building Care System Enterprise</div>
                </body>
                </html>
            `;

            return new Blob([html], { type: 'application/pdf' });
        } catch (error) {
            console.error('[API] createFallbackPDF error:', error);
            throw error;
        }
    }

    /**
     * Export dashboard to PDF
     * @returns {Promise<Blob>} PDF file as blob
     */
    async function exportDashboardPDF() {
        try {
            console.log('[API] exportDashboardPDF called');
            
            const response = await request('POST', 'exportDashboardPDF', {});
            console.log('[API] exportDashboardPDF response:', response);

            if (!response.success) {
                throw new Error(response.message || 'Gagal export dashboard');
            }

            const data = response.data || {};

            // Format 1: URL
            if (data.url) {
                const blobResponse = await fetch(data.url);
                if (!blobResponse.ok) {
                    throw new Error(`Failed to fetch PDF: ${blobResponse.status}`);
                }
                return await blobResponse.blob();
            }

            // Format 2: Base64
            if (data.pdfBase64 || data.base64 || data.pdf) {
                const base64 = data.pdfBase64 || data.base64 || data.pdf;
                let cleanBase64 = base64;
                if (base64.includes('base64,')) {
                    cleanBase64 = base64.split('base64,')[1];
                }
                const byteCharacters = atob(cleanBase64);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                return new Blob([byteArray], { type: 'application/pdf' });
            }

            if (response instanceof Blob) {
                return response;
            }

            throw new Error('Format response tidak dikenali');

        } catch (error) {
            console.error('[API] exportDashboardPDF error:', error);
            throw error;
        }
    }

    /**
     * Export electricity data to Excel (client-side menggunakan XLSX)
     * @param {Array} data - Data yang akan diexport
     * @param {String} filename - Nama file
     * @returns {Blob} Excel file as blob
     */
    function exportToExcel(data, filename = 'Data_Listrik') {
        try {
            if (typeof XLSX === 'undefined') {
                throw new Error('Library XLSX tidak ditemukan');
            }

            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Listrik');

            // Set column widths
            const colWidths = [
                { wch: 5 }, { wch: 12 }, { wch: 15 }, { wch: 15 },
                { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
                { wch: 20 }, { wch: 20 }, { wch: 15 }
            ];
            worksheet['!cols'] = colWidths;

            const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([wbout], { 
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
            });
            
            // Download file
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            return blob;
        } catch (error) {
            console.error('[API] exportToExcel error:', error);
            throw error;
        }
    }

    return {
        post:(action,data)=>request("POST",action,data),
        get:(action,data)=>request("GET",action,data),
        request,
        heartbeat,
        // READ
        getElectricityDashboard,
        getElectricityList,
        getElectricityDetail,
        getElectricitySummary,
        getElectricityChart,
        getElectricityAlerts,
        getElectricityBenchmark,
        getElectricityTopConsumer,
        getElectricityTrend,
        refreshElectricityCache,
        // CRUD
        createElectricityRecord,
        updateElectricityRecord,
        deleteElectricityRecord,
        // EXPORT
        exportElectricityTable,
        exportDashboardPDF,
        exportToExcel
    };
})();

window.BCS.Api = Api;
window.Api = Api;
console.log("✅ [API] Core API loaded with Electricity CRUD and Export support");
