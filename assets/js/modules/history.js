// ======================================================
// Building Care System Enterprise v3.3
// assets/js/modules/history.js
// ======================================================

"use strict";

const HistoryModule = (() => {

    let reports = [];

    // ==========================================
    // INIT
    // ==========================================
    async function init() {

        App.log("History Module Loaded");

        await loadReports();

        bindSearch();

    }

    // ==========================================
    // LOAD REPORT
    // ==========================================
    async function loadReports() {

        try {

            const response = await Api.post(
                "getReport"
            );

            console.log("[HISTORY]", response);

            if (!response.success) {

                App.toast(
                    response.message,
                    "error"
                );

                return;

            }

            reports =
                response.data.reports || [];

            renderTable(reports);

        }

        catch (err) {

            console.error(err);

            App.handleError(err);

        }

    }

    // ==========================================
    // RENDER TABLE
    // ==========================================
    function renderTable(data) {

        const tbody =
            document.getElementById(
                "historyTable"
            );

        if (!tbody) return;

        tbody.innerHTML = "";

        data.forEach(report => {

            tbody.innerHTML += `

            <tr>

                <td>${report.id}</td>

                <td>${report.tanggal}</td>

                <td>${report.kategori}</td>

                <td>${report.lokasi}</td>

                <td>
                    ${badge(report.status)}
                </td>

                <td class="text-center">

                    ${
                        report.foto

                        ?

                        `<img
                            src="${report.foto}"
                            width="50"
                            height="50"
                            class="rounded shadow-sm"
                            style="
                                object-fit:cover;
                                cursor:pointer;
                            "
                            onclick="HistoryModule.showPhoto('${report.foto}')"
                        >`

                        :

                        `<i class="bi bi-image text-secondary"></i>`

                    }

                </td>

            </tr>

            `;

        });

    }

    // ==========================================
    // BADGE STATUS
    // ==========================================
    function badge(status) {

        switch (status) {

            case "OPEN":

                return `
                <span class="badge bg-warning">
                    OPEN
                </span>`;

            case "PROGRESS":

                return `
                <span class="badge bg-primary">
                    PROGRESS
                </span>`;

            case "DONE":

                return `
                <span class="badge bg-success">
                    DONE
                </span>`;

            default:

                return status;

        }

    }

    // ==========================================
    // SEARCH + FILTER
    // ==========================================
    function bindSearch() {

        const search =
            document.getElementById(
                "searchReport"
            );

        const filter =
            document.getElementById(
                "filterStatus"
            );

        if (search) {

            search.addEventListener(
                "keyup",
                filterData
            );

        }

        if (filter) {

            filter.addEventListener(
                "change",
                filterData
            );

        }

    }

    // ==========================================
    // FILTER DATA
    // ==========================================
    function filterData() {

        const keyword =
            document
            .getElementById(
                "searchReport"
            )
            .value
            .toLowerCase();

        const status =
            document
            .getElementById(
                "filterStatus"
            )
            .value;

        const filtered =
            reports.filter(r => {

                const matchKeyword =

                    r.id
                    .toLowerCase()
                    .includes(keyword)

                    ||

                    r.kategori
                    .toLowerCase()
                    .includes(keyword)

                    ||

                    r.lokasi
                    .toLowerCase()
                    .includes(keyword);

                const matchStatus =

                    status === ""

                    ||

                    r.status === status;

                return (
                    matchKeyword
                    &&
                    matchStatus
                );

            });

        renderTable(filtered);

    }

    // ==========================================
    // PREVIEW FOTO
    // ==========================================
    function showPhoto(url) {

        document.getElementById(
            "modalPhoto"
        ).src = url;

        new bootstrap.Modal(
            document.getElementById(
                "photoModal"
            )
        ).show();

    }

    // ==========================================
    // EXPORT
    // ==========================================
    return {

        init,

        showPhoto

    };

})();

// ==========================================
// START
// ==========================================
document.addEventListener(

    "DOMContentLoaded",

    async () => {

        await HistoryModule.init();

    }

);
