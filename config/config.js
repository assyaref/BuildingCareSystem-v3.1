// ======================================================
// Building Care System Enterprise v3.2
// File : config/config.js
// Radiant Group Duri
// ======================================================

const CONFIG = {

    APP: {
        NAME:    "Building Care System Enterprise",
        VERSION: "3.2.0",
        COMPANY: "Radiant Group Duri"
    },

    API: {
        // URL Google Apps Script Web App
        URL: "https://script.google.com/macros/s/AKfycbw0CvUc_tqOAc8882JigXpHeQNOxsjjl6EkWyH5d1mg1eVe6yBinBrbmT2rjz7dmjvC/exec"
    },

    STORAGE: {
        SESSION:  "BCS_SESSION",
        USER:     "BCS_USER",
        REMEMBER: "BCS_REMEMBER"
    },

    SESSION: {
        TIMEOUT: 30 * 60 * 1000   // 30 menit
    },

    LOGIN: {
        REMEMBER_ME: true
    },

    STATUS: {
        ACTIVE:   "ACTIVE",
        INACTIVE: "INACTIVE"
    },

    ROLE: {
        ADMIN:   "ADMIN",
        TEKNISI: "TEKNISI",
        USER:    "USER"
    },

    REPORT: {
        CATEGORY: ["AC", "LISTRIK", "KONDISI GEDUNG"]
    }

};

// ======================================================
// Freeze Config (deep)
// ======================================================

Object.freeze(CONFIG.APP);
Object.freeze(CONFIG.API);
Object.freeze(CONFIG.STORAGE);
Object.freeze(CONFIG.SESSION);
Object.freeze(CONFIG.LOGIN);
Object.freeze(CONFIG.STATUS);
Object.freeze(CONFIG.ROLE);
Object.freeze(CONFIG.REPORT);
Object.freeze(CONFIG);
