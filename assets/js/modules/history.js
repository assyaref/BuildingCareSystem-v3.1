// ======================================================
// Building Care System Enterprise v4.0 Stable
// assets/js/modules/history.js
// Sprint 6.1
// ======================================================
console.log("History.js v4.0 Stable Loaded");
"use strict";

const HistoryModule = (() => {
  let reports = [];
  let filteredReports = [];
  let currentPage = 1;
  const PER_PAGE = 10;

  // ==========================================
  // INIT
  // ==========================================
  async function init() {
    App.log("History Module Loaded");
    await loadReports();
    bindSearch();
    bindSort();
  }

  // ==========================================
  // LOAD REPORT
  // ==========================================
  async function loadReports() {
    try {
      const response = await Api.post("getReport");
      console.log("[HISTORY]", response);

      if (!response.success) {
        App.toast(response.message, "error");
        return;
      }

      reports = response.data.reports || [];
      reports.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
      filteredReports = [...reports];

      updateSummary();
      renderTable();
    } catch (err) {
      console.error(err);
      App.handleError(err);
    }
  }

  // ==========================================
  // SUMMARY
  // ==========================================
  function updateSummary() {
    setText("cardTotal", reports.length);
    setText("cardOpen", reports.filter(x => x.status === "OPEN").length);
    setText("cardProgress", reports.filter(x => x.status === "PROGRESS").length);
    setText("cardDone", reports.filter(x => x.status === "DONE").length);
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = value;
    }
  }

  // ==========================================
  // TABLE
  // ==========================================
  function renderTable() {
    const tbody = document.getElementById("historyTable");
    if (!tbody) return;

    tbody.innerHTML = "";
    const start = (currentPage - 1) * PER_PAGE;
    const end = start + PER_PAGE;
    const pageData = filteredReports.slice(start, end);

    if (!pageData.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" class="text-center py-5 text-muted">
            <i class="bi bi-inbox fs-1"></i><br>Tidak ada data
          </td>
        </tr>
      `;
      return;
    }

    let html = "";
    pageData.forEach(report => {
      const photoContent = report.foto
        ? `<img src="${report.foto}" width="55" height="55" loading="lazy" class="rounded shadow-sm border" style="object-fit:cover;cursor:pointer" onclick="HistoryModule.showPhoto('${report.foto}')">`
        : `<div class="bg-light border rounded d-flex align-items-center justify-content-center mx-auto" style="width:55px;height:55px"><i class="bi bi-image text-secondary"></i></div>`;

      html += `
        <tr>
          <td><strong>${report.id || "-"}</strong></td>
          <td>${report.tanggal || "-"}</td>
          <td>
            <div class="fw-semibold">${report.nama || "-"}</div>
            <small class="text-muted">${report.departemen || ""}</small>
          </td>
          <td>${report.kategori || "-"}</td>
          <td>${report.lokasi || "-"}</td>
          <td style="max-width:300px"><div class="text-truncate">${report.deskripsi || "-"}</div></td>
          <td>
            ${badge(report.status)}<br>
            <small class="text-muted">${report.teknisi || ""}</small>
          </td>
          <td class="text-center">${photoContent}</td>
          <td class="text-center">
            <button class="btn btn-sm btn-outline-primary me-1" onclick="HistoryModule.showDetail('${report.id}')"><i class="bi bi-eye"></i></button>
            <button class="btn btn-sm btn-outline-warning" onclick="HistoryModule.showUpdate('${report.id}')"><i class="bi bi-pencil"></i></button>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = html;
    setText("totalReport", filteredReports.length);
    renderPagination();
  }

  // ==========================================
  // BADGE
  // ==========================================
  function badge(status) {
    switch (status) {
      case "OPEN":
        return `<span class="badge bg-warning text-dark rounded-pill">OPEN</span>`;
      case "PROGRESS":
        return `<span class="badge bg-primary rounded-pill">PROGRESS</span>`;
      case "DONE":
        return `<span class="badge bg-success rounded-pill">DONE</span>`;
      default:
        return `<span class="badge bg-secondary">${status}</span>`;
    }
  }

  // ==========================================
  // SEARCH
  // ==========================================
  function bindSearch() {
    document.getElementById("searchReport")?.addEventListener("keyup", filterData);
    document.getElementById("filterStatus")?.addEventListener("change", filterData);
  }

  function filterData() {
    const keyword = document.getElementById("searchReport")?.value.toLowerCase() || "";
    const status = document.getElementById("filterStatus")?.value || "";

    filteredReports = reports.filter(r => {
      const text = [r.id, r.nama, r.departemen, r.kategori, r.lokasi, r.deskripsi, r.teknisi].join(" ").toLowerCase();
      return text.includes(keyword) && (status === "" || r.status === status);
    });

    currentPage = 1;
    renderTable();
  }

  // ==========================================
  // SORT
  // ==========================================
  function bindSort() {
    document.getElementById("sortReport")?.addEventListener("change", e => {
      if (e.target.value === "desc") {
        filteredReports.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
      } else {
        filteredReports.sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));
      }
      renderTable();
    });
  }

  // ==========================================
  // PAGINATION
  // ==========================================
  function renderPagination() {
    const pagination = document.getElementById("pagination");
    if (!pagination) return;

    pagination.innerHTML = "";
    const totalPages = Math.ceil(filteredReports.length / PER_PAGE);
    let html = "";

    for (let i = 1; i <= totalPages; i++) {
      html += `
        <li class="page-item ${i === currentPage ? "active" : ""}">
          <a href="#" class="page-link" onclick="HistoryModule.goPage(${i});return false">${i}</a>
        </li>
      `;
    }
    pagination.innerHTML = html;
  }

  function goPage(page) {
    currentPage = page;
    renderTable();
  }

  // ==========================================
  // PHOTO
  // ==========================================
  function showPhoto(url) {
    const modalPhoto = document.getElementById("modalPhoto");
    const photoModal = document.getElementById("photoModal");

    if (!modalPhoto || !photoModal) {
      App.toast("Photo modal tidak ditemukan", "error");
      return;
    }

    modalPhoto.src = url || "";
    modalPhoto.onerror = function () {
      this.src = "https://placehold.co/1200x800?text=Image+Not+Available";
    };

    bootstrap.Modal.getOrCreateInstance(photoModal).show();
  }

  // ==========================================
  // DETAIL
  // ==========================================
  function showDetail(id) {
    const report = reports.find(x => x.id === id);
    if (!report) return;

    const detailContent = document.getElementById("detailContent");
    const detailModal = document.getElementById("detailModal");

    if (!detailContent || !detailModal) {
      App.toast("Detail modal tidak ditemukan", "error");
      return;
    }

    detailContent.innerHTML = `
      <table class="table table-bordered">
        <tr><th width="30%">ID</th><td>${report.id || "-"}</td></tr>
        <tr><th>Tanggal</th><td>${report.tanggal || "-"}</td></tr>
        <tr><th>Pelapor</th><td>${report.nama || "-"}</td></tr>
        <tr><th>Departemen</th><td>${report.departemen || "-"}</td></tr>
        <tr><th>Kategori</th><td>${report.kategori || "-"}</td></tr>
        <tr><th>Lokasi</th><td>${report.lokasi || "-"}</td></tr>
        <tr><th>Deskripsi</th><td>${report.deskripsi || "-"}</td></tr>
        <tr><th>Status</th><td>${badge(report.status)}</td></tr>
        <tr><th>Teknisi</th><td>${report.teknisi || "-"}</td></tr>
        <tr><th>Tgl Selesai</th><td>${report.tglSelesai || "-"}</td></tr>
        <tr><th>Durasi Penyelesaian</th><td>${report.durasi || "-"}</td></tr>
        <tr><th>Catatan Teknisi</th><td>${report.catatanTeknisi || "-"}</td></tr>
      </table>
    `;

    bootstrap.Modal.getOrCreateInstance(detailModal).show();
  }

  // ==========================================
  // UPDATE MODAL
  // ==========================================
  function showUpdate(id) {
    const report = reports.find(x => x.id === id);
    if (!report) return;

    const updateId = document.getElementById("updateId");
    const updateStatus = document.getElementById("updateStatus");
    const updateTeknisi = document.getElementById("updateTeknisi");
    const updateCatatan = document.getElementById("updateCatatan");
    const updateModal = document.getElementById("updateModal");

    if (!updateId || !updateStatus || !updateTeknisi || !updateCatatan || !updateModal) {
      App.toast("Update modal tidak ditemukan", "error");
      return;
    }

    updateId.value = report.id || "";
    updateStatus.value = report.status || "OPEN";
    updateTeknisi.value = report.teknisi || "";
    updateCatatan.value = report.catatanTeknisi || "";

    bootstrap.Modal.getOrCreateInstance(updateModal).show();
  }

  // ==========================================
  // SAVE UPDATE
  // ==========================================
  async function saveUpdate() {
    try {
      const response = await Api.post("updateReport", {
        id: document.getElementById("updateId")?.value,
        status: document.getElementById("updateStatus")?.value,
        teknisi: document.getElementById("updateTeknisi")?.value,
        catatan: document.getElementById("updateCatatan")?.value
      });

      if (!response.success) {
        App.toast(response.message, "error");
        return;
      }

      App.toast("Status berhasil diperbarui", "success");
      bootstrap.Modal.getInstance(document.getElementById("updateModal"))?.hide();
      await loadReports();
    } catch (err) {
      console.error(err);
      App.handleError(err);
    }
  }

  return {
    init,
    showPhoto,
    showDetail,
    showUpdate,
    saveUpdate,
    goPage
  };
})();

document.addEventListener("DOMContentLoaded", () => {
  HistoryModule.init();
});
