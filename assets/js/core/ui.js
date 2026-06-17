// ======================================================
// Building Care System Enterprise v3.2
// File : assets/js/core/ui.js
// Shared UI helpers
// Radiant Group Duri
// ======================================================

"use strict";

const UI = (() => {

    // ==================================================
    // SET TEXT
    // ==================================================

    function setText(id, value) {
        const el = document.getElementById(id);
        if (!el) return;
        el.textContent = value;
    }

    // ==================================================
    // SET HTML
    // ==================================================

    function setHtml(id, html) {
        const el = document.getElementById(id);
        if (!el) return;
        el.innerHTML = html;
    }

    // ==================================================
    // SHOW / HIDE ELEMENT
    // ==================================================

    function show(id) {
        const el = document.getElementById(id);
        if (el) el.style.display = "";
    }

    function hide(id) {
        const el = document.getElementById(id);
        if (el) el.style.display = "none";
    }

    // ==================================================
    // DISABLE / ENABLE BUTTON
    // ==================================================

    function disableBtn(id, label = "...") {
        const btn = document.getElementById(id);
        if (!btn) return;
        btn.disabled   = true;
        btn.dataset.original = btn.innerHTML;
        btn.innerHTML  = label;
    }

    function enableBtn(id) {
        const btn = document.getElementById(id);
        if (!btn) return;
        btn.disabled  = false;
        if (btn.dataset.original) btn.innerHTML = btn.dataset.original;
    }

    // ==================================================
    // PUBLIC
    // ==================================================

    return {
        setText,
        setHtml,
        show,
        hide,
        disableBtn,
        enableBtn
    };

})();
