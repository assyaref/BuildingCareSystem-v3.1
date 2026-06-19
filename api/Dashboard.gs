javascript
// ======================================================
// Building Care System Enterprise v3.3 Stable
// Dashboard.gs
// Radiant Group Duri
// ======================================================

function getDashboard(data) {

  try {

    const TIMEZONE =
      (typeof CONFIG !== "undefined" && CONFIG.TIMEZONE)
      || Session.getScriptTimeZone()
      || "Asia/Jakarta";

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

        totalTrend: 0,
        acTrend: 0,
        listrikTrend: 0,
        gedungTrend: 0,

        todayReport: 0,
        onlineUser: 1,
        pendingApproval: 0,

        activity: [],
        monthly: Array(12).fill(0),

        serverTime: now(),
        lastUpdate: now()

      });

    }

    const headers = values.shift().map(function (item) {
      return String(item).trim().toLowerCase();
    });

    const idx = {

      id: headers.indexOf("id"),
      tanggal: headers.indexOf("tanggal"),
      lokasi: headers.indexOf("lokasi"),
      kategori: headers.indexOf("kategori"),
      status: headers.indexOf("status")

    };

    if (Object.values(idx).some(function (v) {
      return v < 0;
    })) {

      return failed("Header REPORT tidak sesuai.");

    }

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
      TIMEZONE,
      "yyyy-MM-dd"
    );

    values.forEach(function (row) {

      if (!row[idx.id]) return;

      total++;

      const kategori =
        String(row[idx.kategori] || "")
          .trim()
          .toUpperCase();

      const status =
        String(row[idx.status] || "")
          .trim()
          .toUpperCase();

      const tanggal =
        new Date(row[idx.tanggal]);

      // ======================
      // CATEGORY
      // ======================

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

      // ======================
      // STATUS
      // ======================

      switch (status) {

        case "OPEN":
        case "WAITING":
          open++;
          break;

        case "PROGRESS":
        case "ON PROGRESS":
          progress++;
          break;

        case "DONE":
        case "COMPLETED":
        case "CLOSED":
          done++;
          break;

      }

      // ======================
      // DATE
      // ======================

      if (!isNaN(tanggal.getTime())) {

        if (

          Utilities.formatDate(
            tanggal,
            TIMEZONE,
            "yyyy-MM-dd"
          ) === today

        ) {

          todayReport++;

        }

        monthly[tanggal.getMonth()]++;

      }

    });

    // ======================
    // RECENT ACTIVITY
    // ======================

    const activity = values

      .filter(function (row) {

        return row[idx.id];

      })

      .sort(function (a, b) {

        return new Date(b[idx.tanggal]) -
               new Date(a[idx.tanggal]);

      })

      .slice(0, 5)

      .map(function (row) {

        const tgl = new Date(row[idx.tanggal]);

        return {

          id: row[idx.id],

          kategori: String(
            row[idx.kategori] || ""
          ),

          lokasi: String(
            row[idx.lokasi] || "-"
          ),

          status: String(
            row[idx.status] || ""
          ),

          waktu: Utilities.formatDate(
            tgl,
            TIMEZONE,
            "HH:mm"
          ),

          tanggal: Utilities.formatDate(
            tgl,
            TIMEZONE,
            "yyyy-MM-dd"
          )

        };

      });

    // ======================
    // RESPONSE
    // ======================

    return success({

      total,
      ac,
      listrik,
      gedung,

      open,
      progress,
      done,

      totalTrend: 0,
      acTrend: 0,
      listrikTrend: 0,
      gedungTrend: 0,

      todayReport,

      onlineUser: 1,

      pendingApproval: open,

      activity,

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

    return failed(err.toString());

  }

}

