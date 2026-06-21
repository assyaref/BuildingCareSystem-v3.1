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
        // => URL: "https://script.google.com/macros/s/AKfycbzN3jSKv-RywufMhzub5SAbReV0ES31_4AMZP7Us4UxhskijtydQYpOWmPgCKQ9GmzH2w/exec"
        // URL JSON GAP Web APP 
        URL: "https://script.googleusercontent.com/macros/echo?user_content_key=AUkAhnQ2vURCVxiFhBH_FwzA9bVEr5M4Af78G6Oe4sr3zV6a56CLVO8mPAaR44I3nXbZzUaaHzkUtYeSS-lspsj3yTgpP7tXLKGwLQ9ykIiEviLJcpOqnW5VyrXAAjwCubJd21TUGf33CYXJKFAGKKsZsBW9dhGdJf-TBUTNHp66WmiX1SYrmG9Z5gCh2e5ERSE2qjNu6acOFv2f13J_rDHP-oqq1K6GsnDHYT7iY--fpx0Bkkq7mQaKMMfSrtKXsuq9NNqBYtaViOpLoYKwuS_THoNiwI3FXA&lib=MKqR-V9leY7lrvGHe17EG_klE6dqiQEwa"
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
