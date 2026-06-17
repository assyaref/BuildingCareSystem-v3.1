// ======================================================
// Building Care System Enterprise v3.1
// Frontend Configuration
// Radiant Group Duri
// ======================================================

const CONFIG = {

    APP: {

        NAME: "Building Care System Enterprise",

        VERSION: "3.1.0",

        COMPANY: "Radiant Group Duri"

    },

    API: {

        // Ganti dengan URL Web App Google Apps Script
        URL: "https://script.google.com/macros/s/AKfycbydH_mlcc-McpRBs-eY5n4db98rw6THO71_cQ4ANRWx8KxzMjBXQDvSi5zsNbIjE7PMPw/exec"

    },

    STORAGE: {

        SESSION: "BCS_SESSION",

        USER: "BCS_USER",

        REMEMBER: "BCS_REMEMBER"

    },

    SESSION: {

        TIMEOUT: 30 * 60 * 1000 // 30 menit

    },

    LOGIN: {

        REMEMBER_ME: true

    },

    STATUS: {

        ACTIVE: "ACTIVE",

        INACTIVE: "INACTIVE"

    },

    ROLE: {

        ADMIN: "ADMIN",

        TEKNISI: "TEKNISI",

        USER: "USER"

    },

    REPORT: {

        CATEGORY: [

            "AC",

            "LISTRIK",

            "KONDISI GEDUNG"

        ]

    }

};

// ======================================================
// Freeze Config
// ======================================================

Object.freeze(CONFIG);
Object.freeze(CONFIG.APP);
Object.freeze(CONFIG.API);
Object.freeze(CONFIG.STORAGE);
Object.freeze(CONFIG.SESSION);
Object.freeze(CONFIG.LOGIN);
Object.freeze(CONFIG.STATUS);
Object.freeze(CONFIG.ROLE);
Object.freeze(CONFIG.REPORT);
