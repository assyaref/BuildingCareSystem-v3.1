// =====================================================
// Monitoring.js
// Building Care System Enterprise v4.3 Stable
// Sprint 19.6 Monitoring Center
// =====================================================

"use strict";

document.addEventListener("DOMContentLoaded", () => {
  loadMonitoring();

  // auto refresh 5 detik
  setInterval(loadMonitoring, 50000);
});

/**
 * =====================================================
 * LOAD MONITORING
 * =====================================================
 */
async function loadMonitoring() {
  try {
    showLoading(true);
    const response = await Api.post("getMonitoringOverview");

    if (!response.success) {
      toast(response.message, "danger");
      return;
    }

    const data = response.data || {};

    loadReport(data.dashboard?.report || {});
    loadSLA(data.dashboard?.sla || {});
    loadPM(data.dashboard?.pm || {});
    loadAsset(data.dashboard?.asset || {});

    loadTechnician(data.technician || []);
    loadActivity(data.activity || []);
    loadErrors(data.errors || []);

    loadHealth(data.health || {});

  } catch (err) {
    console.error(err);
    toast("Monitoring gagal dimuat", "danger");
  } finally {
    showLoading(false);
  }
}

/**
 * =====================================================
 * REPORT
 * =====================================================
 */
function loadReport(data) {
  $("#monitorTotal").text(data.total || 0);
  $("#monitorOpen").text(data.open || 0);
  $("#monitorProgress").text(data.progress || 0);
  $("#monitorDone").text(data.done || 0);
}

/**
 * =====================================================
 * SLA
 * =====================================================
 */
function loadSLA(data) {
  $("#fastPercent").text(data.fastPercent || 0);
  $("#normalPercent").text(data.normalPercent || 0);
  $("#latePercent").text(data.latePercent || 0);
}

/**
 * =====================================================
 * PM
 * =====================================================
 */
function loadPM(data) {
  $("#pmTotal").text(data.total || 0);
  $("#pmOpen").text(data.open || 0);
  $("#pmDone").text(data.done || 0);
}

/**
 * =====================================================
 * ASSET
 * =====================================================
 */
function loadAsset(data) {
  $("#assetTotal").text(data.total || 0);
  $("#assetActive").text(data.active || 0);
  $("#assetInactive").text(data.inactive || 0);
}

/**
 * =====================================================
 * TOP TECHNICIAN
 * =====================================================
 */
function loadTechnician(data) {
  const html = (data || []).map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${item.nama}</td>
      <td>${item.total}</td>
      <td>${item.averageScore || 0}</td>
    </tr>
  `).join('');

  $("#topTechnicianTable").html(html);
}

/**
 * =====================================================
 * RECENT ACTIVITY
 * =====================================================
 */
function loadActivity(data) {
  const html = (data || []).map(item => `
    <tr>
      <td>${item.user}</td>
      <td>${item.action}</td>
      <td>${item.description}</td>
      <td>${item.waktu}</td>
    </tr>
  `).join('');

  $("#activityTable").html(html);
}

/**
 * =====================================================
 * ERROR LOG
 * =====================================================
 */
function loadErrors(data) {
  const html = (data || []).map(item => `
    <tr>
      <td>${item.module}</td>
      <td class="text-danger">${item.message}</td>
      <td>${item.waktu}</td>
    </tr>
  `).join('');

  $("#errorTable").html(html);
}

/**
 * =====================================================
 * SYSTEM HEALTH
 * =====================================================
 */
function loadHealth(data) {
  $("#healthApi").html("🟢 " + (data.api || "ONLINE"));
  $("#healthDatabase").html("🟢 " + (data.database || "ONLINE"));
  $("#healthDrive").html("🟢 " + (data.drive || "ONLINE"));
  $("#healthVersion").text(data.version || "v4.3");
}

/**
 * =====================================================
 * LOADING
 * =====================================================
 */
function showLoading(state) {
  if (state) {
    $("body").addClass("loading");
  } else {
    $("body").removeClass("loading");
  }
}

/**
 * =====================================================
 * TOAST
 * =====================================================
 */
function toast(message, type = "success") {
  console.log("[" + type + "]", message);
}

/**
 * =====================================================
 * TEST
 * =====================================================
 */
async function testMonitoring() {
  const response = await Api.post("getMonitoringOverview");
  console.log(response);
}
