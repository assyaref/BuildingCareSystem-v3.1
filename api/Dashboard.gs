// ======================================================
// Building Care System Enterprise v3.1
// Dashboard.gs
// Radiant Group Duri
// ======================================================

/**
 * ======================================================
 * DASHBOARD SUMMARY
 * ======================================================
 */
function getDashboard(data) {

  try {

    // ============================================
    // GET SHEET
    // ============================================

    const sheet = getSheet("REPORT");

    const values = sheet.getDataRange().getValues();

// ============================================
// EMPTY DATA
// ============================================

if (values.length <= 1) {

  return success({

    total: 0,
    ac: 0,
    listrik: 0,
    gedung: 0,

    open: 0,
    progress: 0,
    done: 0,

    todayReport: 0,
    onlineUser: 0,
    pendingApproval: 0,

    activity: [],

    monthly: Array(12).fill(0),

    serverTime: now(),
    lastUpdate: now()

  });
    }
    // ============================================
    // HEADER
    // ============================================

    const header = values.shift();

    const headers = header.map(function (item) {

      return String(item)
        .trim()
        .toLowerCase();

    });

    const indexKategori = headers.indexOf("kategori");

    const indexStatus = headers.indexOf("status");

    const indexLokasi = headers.indexOf("lokasi");

    const indexTanggal = headers.indexOf("tanggal");
    const indexId = headers.indexOf("id");

    // ============================================
    // VALIDATION
    // ============================================

    if (

  indexId < 0 ||

  indexKategori < 0 ||

  indexStatus < 0 ||

  indexLokasi < 0 ||

  indexTanggal < 0

) {

      return failure(

        "Header Spreadsheet tidak valid."

      );

    }

    // ============================================
    // SUMMARY
    // ============================================
let total = 0;
let ac = 0;
let listrik = 0;
let gedung = 0;

let open = 0;
let progress = 0;
let done = 0;

let todayReport = 0;

const monthly = Array(12).fill(0);

const today = Utilities.formatDate(
    new Date(),
    CONFIG.TIMEZONE,
    "yyyy-MM-dd"
);
values.forEach(function(row){

    total++;

    const kategori = String(
        row[indexKategori] || ""
    ).trim().toUpperCase();

    const status = String(
        row[indexStatus] || ""
    ).trim().toUpperCase();

    const date = new Date(
        row[indexTanggal]
    );

    // ======================
    // CATEGORY
    // ======================

    switch(kategori){

        case "AC":
            ac++;
            break;

        case "LISTRIK":
            listrik++;
            break;

        case "GEDUNG":
        case "KONDISI GEDUNG":
            gedung++;
            break;

    }

    // ======================
    // STATUS
    // ======================

    switch(status){

        case "OPEN":
            open++;
            break;

        case "PROGRESS":
            progress++;
            break;

        case "DONE":
            done++;
            break;

    }

    // ======================
    // DATE KPI
    // ======================

    if(!isNaN(date)){

        const tanggal = Utilities.formatDate(

            date,

            CONFIG.TIMEZONE,

            "yyyy-MM-dd"

        );

        if(tanggal === today){

            todayReport++;

        }

        monthly[date.getMonth()]++;

    }

});
// ============================================
// EXTRA KPI
// ============================================

const onlineUser = 1;

// sementara pending approval = OPEN
const pendingApproval = open;
// ============================================
// SORTING RECENT ACTIVITY
// ============================================

const recent = [...values]

    .sort(function (a, b) {

        return new Date(b[indexTanggal]) - new Date(a[indexTanggal]);

    })

    .slice(0, 5)

    .map(function (row) {

        const activityDate = new Date(row[indexTanggal]);

        return {

            id: row[indexId] || "",

            tanggal: Utilities.formatDate(
                activityDate,
                CONFIG.TIMEZONE,
                "yyyy-MM-dd"
            ),

            waktu: Utilities.formatDate(
                activityDate,
                CONFIG.TIMEZONE,
                "HH:mm"
            ),

            kategori: String(
                row[indexKategori] || ""
            ).trim().toUpperCase(),

            lokasi: String(
                row[indexLokasi] || "-"
            ).trim(),

            status: String(
                row[indexStatus] || "OPEN"
            ).trim().toUpperCase()

        };

    });
    // ============================================
    // RESPONSE API
    // ============================================

   return success({

    total,
    ac,
    listrik,
    gedung,

    open,
    progress,
    done,

    todayReport,
    onlineUser,
    pendingApproval,

    activity: recent,

    monthly,

    serverTime: now(),

    lastUpdate: now()

});

  }

  catch (err) {

    saveError(

      "Dashboard.gs",

      err.toString()

    );

    return failure(

      err.toString()

    );

  }

}
