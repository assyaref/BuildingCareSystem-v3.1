// =====================================================
// Building Care System Enterprise v3.3 Stable
// Code.gs
// Main Router API
// Radiant Group Duri
// =====================================================

/**
 * =====================================================
 * GET ROUTER
 * =====================================================
 */
function doGet(e) {

  try {

    e = e || {};
    e.parameter = e.parameter || {};

    const action = String(e.parameter.action || "health");

    switch (action) {

      case "version":

        return success({

          build: "20-06-2026-09:30",

          app: CONFIG.APP.NAME,

          version: CONFIG.APP.VERSION,

          company: CONFIG.APP.COMPANY,

          sheet: SHEET,

          timezone: CONFIG.TIMEZONE,

          serverTime: now()

        });

      case "getDashboard":

        return getDashboard({});

      case "health":

      default:

        return success({

          app: CONFIG.APP.NAME,

          version: CONFIG.APP.VERSION,

          company: CONFIG.APP.COMPANY,

          status: "ONLINE",

          serverTime: now()

        });

    }

  } catch (err) {

    try {
      saveError("Code.gs", err.toString());
    } catch (e) {}

    return failed(err.toString());

  }

}

/**
 * =====================================================
 * POST ROUTER
 * =====================================================
 */
function doPost(e) {

  try {

    if (!e || !e.postData) {

      return failed("Request tidak valid.");

    }

    let request = {};

    try {

      request = JSON.parse(

        e.postData.contents || "{}"

      );

    } catch (err) {

      return failed("Format JSON tidak valid.");

    }

    const action = String(request.action || "");

    const data = request.data || {};

    switch (action) {

      case "login":

        return login(data);

      case "logout":

        return logout(data);

      case "verifySession":

        return verifySession(data);

      case "getDashboard":

        return getDashboard(data);

      case "saveReport":

        return saveReport(data);

      case "getReport":

        return getReport(data);

      case "updateReport":

        return updateReport(data);

      case "uploadPhoto":

        return uploadPhoto(data);

      case "version":

        return version();

      default:

        return failed(

          "Action tidak ditemukan : " + action

        );

    }

  } catch (err) {

    try {
      saveError("Code.gs", err.toString());
    } catch (e) {}

    return failed(err.toString());

  }

}

/**
 * =====================================================
 * VERSION API
 * =====================================================
 */
function version() {

  return success({

    build: "20-06-2026-09:30",

    app: CONFIG.APP.NAME,

    version: CONFIG.APP.VERSION,

    company: CONFIG.APP.COMPANY,

    sheet: SHEET,

    timezone: CONFIG.TIMEZONE,

    serverTime: now()

  });

}

/**
 * =====================================================
 * TEST ROUTER
 * =====================================================
 */
function testVersion() {

  Logger.log(

    version().getContent()

  );

}

function testHealth() {

  Logger.log(

    doGet({

      parameter: {

        action: "health"

      }

    }).getContent()

  );

}
