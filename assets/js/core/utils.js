// ======================================================
// Building Care System Enterprise v3.2
// File : assets/js/core/utils.js
// Shared utility helpers
// Radiant Group Duri
// ======================================================

"use strict";

const Utils = (() => {

    // ==================================================
    // FORMAT DATE
    // ==================================================

    function formatDate(dateStr) {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleDateString("id-ID", {
            day:   "2-digit",
            month: "long",
            year:  "numeric"
        });
    }

    function formatDateTime(dateStr) {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleString("id-ID");
    }

    // ==================================================
    // FORMAT NUMBER
    // ==================================================

    function formatNumber(num) {
        return Number(num || 0).toLocaleString("id-ID");
    }

    // ==================================================
    // CAPITALIZE
    // ==================================================

    function capitalize(str = "") {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    // ==================================================
    // TRUNCATE
    // ==================================================

    function truncate(str = "", max = 50) {
        return str.length > max ? str.slice(0, max) + "…" : str;
    }

    // ==================================================
    // EMPTY CHECK
    // ==================================================

    function isEmpty(value) {
        return value === null || value === undefined || value === "";
    }

    // ==================================================
    // PUBLIC
    // ==================================================

    return {
        formatDate,
        formatDateTime,
        formatNumber,
        capitalize,
        truncate,
        isEmpty
    };

})();
