// ======================================================
// Building Care System Enterprise v3.1
// Backend Configuration
// Radiant Group Duri
// ======================================================

const CONFIG = {

  APP: {

    NAME: "Building Care System Enterprise",

    VERSION: "3.1.0",

    COMPANY: "Radiant Group Duri"

  },

  DATABASE: {

    SS_ID: "1ksOLFDFIq7S1-U2Juhot9CffyEMWwVHsBE4eDj2143c"

  },

  DRIVE: {

    BEFORE_FOLDER_ID: "1_1NhYiTWZVBsPzU_YujSVeEMpjaq6E1r",

    AFTER_FOLDER_ID: "1oLsVCvC6EJzTGjqGyoryvIgJkit_3i0u",

    EXPORT_FOLDER_ID: "1jmX4Sn-6In_UdAc5ArxEKPJ2lJ01nCWe"

  },

  SESSION: {

    TIMEOUT: 30 // menit

  }

};

// ======================================================
// Sheet Configuration
// ======================================================

const SHEET = {

  USERS: "USERS",

  USER_SESSION: "USER_SESSION",

  REPORT: "REPORT",

  ACTIVITY: "ACTIVITY",

  AUDIT_TRAIL: "AUDIT_TRAIL",

  MASTER_LOCATION: "MASTER_LOCATION",

  MASTER_CATEGORY: "MASTER_CATEGORY",

  MASTER_PRIORITY: "MASTER_PRIORITY",

  MASTER_STATUS: "MASTER_STATUS",

  MASTER_DEPARTMENT: "MASTER_DEPARTMENT",

  MASTER_ROOM: "MASTER_ROOM",

  ERROR_LOG: "ERROR_LOG"

};

// ======================================================
// Status
// ======================================================

const STATUS = {

  ACTIVE: "ACTIVE",

  INACTIVE: "INACTIVE",

  DELETED: "DELETED"

};

// ======================================================
// Role
// ======================================================

const ROLE = {

  ADMIN: "ADMIN",

  TEKNISI: "TEKNISI",

  USER: "USER"

};

// ======================================================
// Report Status
// ======================================================

const REPORT_STATUS = {

  SUBMITTED: "Submitted",

  WAITING: "Waiting Approval",

  APPROVED: "Approved",

  ASSIGNED: "Assigned",

  PROGRESS: "On Progress",

  COMPLETED: "Completed",

  CLOSED: "Closed"

};
