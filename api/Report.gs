// =============================
// REPORT
// =============================

function getReports() {

  const sh = getSheet(CONFIG.SHEET_REPORTS);

  const rows = sh
    .getDataRange()
    .getValues()
    .slice(1);

  return {

    success: true,

    reports: rows.map(r => ({

      id: r[0],

      tanggal: formatDate(r[1]),

      nama: r[2],

      departemen: r[3],

      lokasi: r[4],

      kategori: r[5],

      deskripsi: r[6],

      foto: r[7],

      status: r[8]

    }))

  };

}

function saveReport(data) {

  const sh = getSheet(CONFIG.SHEET_REPORTS);

  let photoUrl = "";

  if (data.photo) {

    const upload = uploadPhoto(
      data.photo,
      data.fileName
    );

    if (!upload.success) {

      return {

        success: false,

        message: upload.message

      };

    }

    photoUrl = upload.url;

  }

  const id = generateId();

  sh.appendRow([

    id,

    new Date(),

    data.nama,

    data.departemen,

    data.lokasi,

    data.kategori,

    data.deskripsi,

    photoUrl,

    CONFIG.STATUS.OPEN,

    ""

  ]);

  SpreadsheetApp.flush();

  return {

    success: true,

    message: "Laporan berhasil dikirim",

    report: {

      id: id,

      tanggal: formatDate(new Date()),

      nama: data.nama,

      departemen: data.departemen,

      lokasi: data.lokasi,

      kategori: data.kategori,

      status: CONFIG.STATUS.OPEN,

      foto: photoUrl

    }

  };

}
