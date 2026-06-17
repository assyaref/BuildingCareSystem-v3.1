```javascript
// ======================================================
// Building Care System Enterprise v3.1
// Dashboard.gs
// Radiant Group Duri
// ======================================================

/**
 * ======================================================
 * GET DASHBOARD SUMMARY
 * ======================================================
 */
function getDashboard(data) {

  try {

    // ------------------------------------------
    // VERIFY TOKEN
    // ------------------------------------------

    const session = verifySession(data.token);

    if (!session) {

      return failure("Session expired.");

    }

    // ------------------------------------------
    // SHEET
    // ------------------------------------------

    const sheet = getSheet(CONFIG.SHEET_REPORT);

    const values = sheet.getDataRange().getValues();

    if (values.length <= 1) {

      return success({

        total: 0,

        ac: 0,

        listrik: 0,

        gedung: 0,

        activity: []

      });

    }

    // ------------------------------------------
    // HEADER
    // ------------------------------------------

    const header = values.shift();

    const index = {};

    header.forEach(function (item, i) {

      index[String(item).trim().toLowerCase()] = i;

    });

    // ------------------------------------------
    // SUMMARY
    // ------------------------------------------

    let total = 0;

    let ac = 0;

    let listrik = 0;

    let gedung = 0;

    const activity = [];

    values.forEach(function (row) {

      total++;

      const kategori =
        String(

          row[index.kategori] || ""

        ).toUpperCase();

      if (kategori === "AC") {

        ac++;

      }

      else if (kategori === "LISTRIK") {

        listrik++;

      }

      else {

        gedung++;

      }

      activity.push({

        tanggal:

          row[index.tanggal] || "",

        lokasi:

          row[index.lokasi] || "",

        kategori:

          kategori,

        status:

          row[index.status] || ""

      });

    });

    // ------------------------------------------
    // SORT DESC
    // ------------------------------------------

    activity.sort(function (a, b) {

      return String(b.tanggal)

        .localeCompare(

          String(a.tanggal)

        );

    });

    // ------------------------------------------
    // LIMIT
    // ------------------------------------------

    const recent = activity.slice(0, 5);

    // ------------------------------------------
    // RETURN
    // ------------------------------------------

    return success({

      total: total,

      ac: ac,

      listrik: listrik,

      gedung: gedung,

      activity: recent,

      serverTime: now()

    });

  }

  catch (err) {

    saveError(

      "Dashboard",

      err

    );

    return failure(

      err.toString()

    );

  }

}
```

