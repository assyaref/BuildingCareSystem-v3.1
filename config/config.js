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
        URL: "https://script.googleusercontent.com/macros/echo?user_content_key=AUkAhnSeKJ_oxOCKAagDB7f6Ppjrfumsn2q-vWAXyeQad1d9JyKIgKxDwVAftyg-w_1UO8RJ5zUcgm7uAFaoYiIcA7wJTSgsev1oEA7uP9m1cJ-k_sbuIb8VCbABOwIwRRr39RS64WjHct9ouOHMUNVvid_pRNUH8xcvJOrcuTzD6JmR-EYL68LBM3NUBiot6Xa2c6Ldh29GEs56B5_F0ca5GTZY0iSEKLGSBSfNsmcVWpuAEAYrVC-90-xG-WGCXljwo4iGBAJogTUfrqI-a0o4CDKtKT6jRA&lib=MKqR-V9leY7lrvGHe17EG_klE6dqiQEwa"
        
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
