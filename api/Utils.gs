// =====================================================
// Building Care System Enterprise v3.1
// Utils Library
// Radiant Group Duri
// =====================================================

/**
 * Return Spreadsheet Object
 */
function getSpreadsheet() {
  return SpreadsheetApp.openById(CONFIG.DATABASE.SS_ID);
}

/**
 * Return Sheet Object
 */
function getSheet(sheetName) {

  const sheet = getSpreadsheet().getSheetByName(sheetName);

  if (!sheet) {
    throw new Error("Sheet '" + sheetName + "' tidak ditemukan.");
  }

  return sheet;

}

/**
 * JSON Response
 */
function json(data) {

  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);

}

/**
 * Success Response
 */
function success(data, message) {

  return json({

    success: true,

    message: message || "Success",

    data: data || {}

  });

}

/**
 * Failed Response
 */
function failed(message) {

  return json({

    success: false,

    message: message || "Failed"

  });

}

/**
 * UUID Token
 */
function generateToken() {

  return Utilities.getUuid();

}

/**
 * Format Datetime
 */
function now() {

  return Utilities.formatDate(

    new Date(),

    Session.getScriptTimeZone(),

    "yyyy-MM-dd HH:mm:ss"

  );

}

/**
 * SHA256 Password
 */
function hashPassword(password) {

  const raw = Utilities.computeDigest(

    Utilities.DigestAlgorithm.SHA_256,

    password

  );

  return raw.map(function(b) {

    const v = (b < 0 ? b + 256 : b).toString(16);

    return ("0" + v).slice(-2);

  }).join("");

}

/**
 * Find User by Email (legacy — kept for internal use)
 */
function findUser(email) {

  const sheet = getSheet(SHEET.USERS);

  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {

    if (

      String(data[i][0]).trim().toLowerCase() ===

      String(email).trim().toLowerCase()

    ) {

      return {

        row: i + 1,

        email:    data[i][0],
        nik:      String(data[i][1]).trim(),
        nama:     data[i][2],
        password: data[i][3],
        role:     data[i][4],
        status:   data[i][5]

      };

    }

  }

  return null;

}

/**
 * Find User by NIK
 * DB columns: A=Email(0), B=NIK(1), C=Nama(2), D=Password(3), E=Role(4), F=Status(5)
 */
function findUserByNik(nik) {

  const sheet = getSheet(SHEET.USERS);

  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {

    if (String(data[i][1]).trim() === String(nik).trim()) {

      return {

        row: i + 1,

        email:    data[i][0],
        nik:      String(data[i][1]).trim(),
        nama:     data[i][2],
        password: data[i][3],
        role:     data[i][4],
        status:   data[i][5]

      };

    }

  }

  return null;

}

/**
 * Save Activity
 */
function saveActivity(email, action, description) {

  const sheet = getSheet(SHEET.ACTIVITY);

  sheet.appendRow([

    Utilities.getUuid(),

    email,

    action,

    description,

    now()

  ]);

}

/**
 * Save Error
 */
function saveError(module, message) {

  try {

    const sheet = getSheet(SHEET.ERROR_LOG);

    sheet.appendRow([

      Utilities.getUuid(),

      module,

      message,

      now()

    ]);

  } catch (e) {

    Logger.log(e);

  }

}
