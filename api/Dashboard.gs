// ======================================================
// Building Care System Enterprise v3.2
// Dashboard.gs
// ======================================================

function getDashboard(data) {

  try {

    const sheet = getSheet("REPORT");
    const values = sheet.getDataRange().getValues();

    // ==========================================
    // EMPTY DATA
    // ==========================================

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

    // ==========================================
    // HEADER
    // ==========================================

    const header = values.shift();

    const headers = header.map(item =>
      String(item).trim().toLowerCase()
    );

    const indexId = headers.indexOf("id");
    const indexTanggal = headers.indexOf("tanggal");
    const indexPelapor = headers.indexOf("pelapor");
    const indexLokasi = headers.indexOf("lokasi");
    const indexKategori = headers.indexOf("kategori");
    const indexStatus = headers.indexOf("status");

    if (

      indexId === -1 ||
      indexTanggal === -1 ||
      indexKategori === -1 ||
      indexStatus === -1 ||
      indexLokasi === -1

    ) {

      return failure("Header REPORT tidak sesuai.");

    }

    // ==========================================
    // SUMMARY
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

    values.forEach(row => {

      total++;

      const kategori = String(
        row[indexKategori] || ""
      ).trim().toUpperCase();

      const status = String(
        row[indexStatus] || ""
      ).trim().toUpperCase();

      const tanggalObj = new Date(
        row[indexTanggal]
      );

      // =========================
      // KATEGORI
      // =========================

      if (kategori === "AC") {

        ac++;

      } else if (kategori === "LISTRIK") {

        listrik++;

      } else {

        gedung++;

      }

      // =========================
      // STATUS
      // =========================

      if (status === "OPEN") {

        open++;

      } else if (status === "PROGRESS") {

        progress++;

      } else if (status === "DONE") {

        done++;

      }

      // =========================
      // BULAN & TODAY
      // =========================

      if (!isNaN(tanggalObj.getTime())) {

        const tgl = Utilities.formatDate(

          tanggalObj,

          CONFIG.TIMEZONE,

          "yyyy-MM-dd"

        );

        if (tgl === today) {

          todayReport++;

        }

        monthly[tanggalObj.getMonth()]++;

      }

    });

    // ==========================================
    // ACTIVITY
    // ==========================================

    const recent = [...values]

      .sort((a, b) => {

        return new Date(b[indexTanggal]) -

               new Date(a[indexTanggal]);

      })

      .slice(0, 5)

      .map(row => {

        const d = new Date(row[indexTanggal]);

        return {

          id: row[indexId],

          kategori: String(
            row[indexKategori]
          ).toUpperCase(),

          lokasi: row[indexLokasi],

          status: String(
            row[indexStatus]
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

      total,

      ac,

      listrik,

      gedung,

      open,

      progress,

      done,

      todayReport,

      onlineUser: 1,

      pendingApproval: open,

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
