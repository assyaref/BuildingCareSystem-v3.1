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

    const sheet = getSheet("LAPORAN");

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

        activity: []

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

    // ============================================
    // VALIDATION
    // ============================================

    if (

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

    values.forEach(function (row) {

      total++;

      const kategori = String(

        row[indexKategori] || ""

      )

      .trim()

      .toUpperCase();

      const status = String(

        row[indexStatus] || ""

      )

      .trim()

      .toUpperCase();

      // --------------------------------------

      // CATEGORY

      // --------------------------------------

      switch (kategori) {

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

      // --------------------------------------

      // STATUS

      // --------------------------------------

      switch (status) {

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

    });

    // ============================================
    // RECENT ACTIVITY
    // ============================================

    const recent = values

      .slice(-5)

      .reverse()

      .map(function (row) {

        return {

          tanggal: row[indexTanggal],

          kategori: row[indexKategori],

          lokasi: row[indexLokasi],

          status: row[indexStatus]

        };

      });
// ============================================
// TODAY REPORT
// ============================================

const today = Utilities.formatDate(
  new Date(),
  CONFIG.TIMEZONE,
  "yyyy-MM-dd"
);

let todayReport = 0;

values.forEach(function(row){

  const tanggal = Utilities.formatDate(
    new Date(row[indexTanggal]),
    CONFIG.TIMEZONE,
    "yyyy-MM-dd"
  );

  if(tanggal === today){
    todayReport++;
  }

});
    // ============================================
    // RESPONSE
    // ============================================

    return success({

      total: total,

      ac: ac,

      listrik: listrik,

      gedung: gedung,

      open: open,

      progress: progress,

      done: done,

      activity: recent,

      serverTime: now()

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
