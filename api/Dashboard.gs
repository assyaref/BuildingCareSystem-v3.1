// ======================================================
// Building Care System Enterprise v3.2
// Dashboard.gs
// ======================================================

function getDashboard(data) {

  try {

    // ==========================================
    // REPORT SHEET
    // ==========================================

    const sheet = getSheet("REPORT");
    const values = sheet.getDataRange().getValues();

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
        onlineUser: 1,
        pendingApproval: 0,

        activity: [],
        monthly: Array(12).fill(0),

        lastUpdate: now()

      });

    }

    // ==========================================
    // HEADER
    // ==========================================

    const header = values.shift();

    const headers = header.map(function (item) {

      return String(item)
        .trim()
        .toLowerCase();

    });

    const indexId = headers.indexOf("id");
    const indexTanggal = headers.indexOf("tanggal");
    const indexLokasi = headers.indexOf("lokasi");
    const indexKategori = headers.indexOf("kategori");
    const indexStatus = headers.indexOf("status");

    if (

      indexId < 0 ||
      indexTanggal < 0 ||
      indexLokasi < 0 ||
      indexKategori < 0 ||
      indexStatus < 0

    ) {

      return failed("Header REPORT tidak sesuai.");

    }

    // ==========================================
    // KPI
    // ==========================================

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

    values.forEach(function (row) {

      total++;

      const kategori = String(

        row[indexKategori] || ""

      ).trim().toUpperCase();

      const status = String(

        row[indexStatus] || ""

      ).trim().toUpperCase();

      const tanggal = new Date(

        row[indexTanggal]

      );

      // =======================
      // KATEGORI
      // =======================

      switch (kategori) {

        case "AC":
          ac++;
          break;

        case "LISTRIK":
          listrik++;
          break;

        default:
          gedung++;
          break;

      }

      // =======================
      // STATUS
      // =======================

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

      // =======================
      // TODAY & MONTH
      // =======================

      if (!isNaN(tanggal.getTime())) {

        const current = Utilities.formatDate(

          tanggal,

          CONFIG.TIMEZONE,

          "yyyy-MM-dd"

        );

        if (current === today) {

          todayReport++;

        }

        monthly[tanggal.getMonth()]++;

      }

    });

    // ==========================================
    // RECENT ACTIVITY
    // ==========================================

    const activity = [...values]

      .sort(function (a, b) {

        return new Date(b[indexTanggal]) -

               new Date(a[indexTanggal]);

      })

      .slice(0, 5)

      .map(function (row) {

        const d = new Date(row[indexTanggal]);

        return {

          id: row[indexId],

          kategori: String(

            row[indexKategori] || ""

          ).toUpperCase(),

          lokasi: String(

            row[indexLokasi] || "-"

          ),

          status: String(

            row[indexStatus] || "OPEN"

          ).toUpperCase(),

          waktu: Utilities.formatDate(

            d,

            CONFIG.TIMEZONE,

            "HH:mm"

          ),

          tanggal: Utilities.formatDate(

            d,

            CONFIG.TIMEZONE,

            "dd/MM/yyyy"

          )

        };

      });

    // ==========================================
    // RESPONSE
    // ==========================================

    return success({

      total: total,

      ac: ac,

      listrik: listrik,

      gedung: gedung,

      open: open,

      progress: progress,

      done: done,

      todayReport: todayReport,

      onlineUser: 1,

      pendingApproval: open,

      activity: activity,

      monthly: monthly,

      lastUpdate: now()

    });

  }

  catch (err) {

    saveError(

      "Dashboard.gs",

      err.toString()

    );

    return failed(

      err.toString()

    );

  }

}
