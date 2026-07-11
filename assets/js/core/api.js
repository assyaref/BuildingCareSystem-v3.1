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
    // ELECTRICITY MANAGEMENT API (dengan mapping)
    // =============================================

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

        // Mapping list data agar konsisten
        const list = response.data || [];
        response.data = list.map(item => ({
            bulan: item.bulan || item.month || '',
            entitas: item.entitas || item.entity || '',
            idPelanggan: item.idPelanggan || item.id || '',
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

    async function refreshElectricityCache() {
        return request('POST', 'refreshElectricityCache', {});
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

    return {
        post:(action,data)=>request("POST",action,data),
        get:(action,data)=>request("GET",action,data),
        request,
        heartbeat,
        getElectricityDashboard,
        getElectricityList,
        getElectricityDetail,
        refreshElectricityCache,
        getElectricitySummary,
        getElectricityChart,
        getElectricityAlerts,
        getElectricityBenchmark,
        getElectricityTopConsumer,
        getElectricityTrend
    };
})();

window.BCS.Api = Api;
window.Api = Api;
console.log("✅ [API] Core API loaded with Electricity mapping (list + detail)");
