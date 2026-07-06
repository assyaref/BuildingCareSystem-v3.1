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

    return {
        post:(action,data)=>request("POST",action,data),
        get:(action,data)=>request("GET",action,data),
        request, heartbeat
    };
})();

window.BCS.Api = Api;
window.Api = Api;
console.log("✅ [API] Core API loaded (Direct Google Script v6.6 + Device Identity/Public IP)");
