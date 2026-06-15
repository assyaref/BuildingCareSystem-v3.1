// ==========================================
// BUILDING CARE SYSTEM ENTERPRISE v3.1
// CONFIG FRONTEND
// ==========================================

const CONFIG = {

    APP: {
        NAME: "Building Care System Enterprise",
        VERSION: "3.1.0",
        COMPANY: "Radiant Group Duri"
    },

    API: {
        URL: "https://script.google.com/macros/s/AKfycbziy2oEgvUh0avukTqsvmT9i64LfUVt6LguPZ-FGgAEGHE7xCACGo-PzUgk0at6rlRFHQ/exec"
    },

    STORAGE: {

        SESSION: "BCS_SESSION",

        USER: "BCS_USER"

    },

    UPLOAD: {

        MAX_SIZE: 5 * 1024 * 1024,

        ALLOWED: [
            "image/jpeg",
            "image/png",
            "image/jpg"
        ]

    },

    STATUS: {

        SUBMITTED: "Submitted",

        WAITING: "Waiting Approval",

        APPROVED: "Approved",

        ASSIGNED: "Assigned",

        PROGRESS: "On Progress",

        COMPLETED: "Completed",

        CLOSED: "Closed"

    },

    PRIORITY: {

        LOW: "Low",

        MEDIUM: "Medium",

        HIGH: "High",

        EMERGENCY: "Emergency"

    }

};
