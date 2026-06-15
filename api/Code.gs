// =====================================================
// Building Care System Enterprise v3.1
// Main Router API
// Radiant Group Duri
// =====================================================

/**
 * Health Check
 */
function doGet() {

  try {

    return success({

      app: CONFIG.APP.NAME,

      version: CONFIG.APP.VERSION,

      company: CONFIG.APP.COMPANY,

      status: "ONLINE",

      serverTime: now()

    });

  } catch (err) {

    saveError("Code.gs", err.toString());

    return failed(err.toString());

  }

}

/**
 * Main API
 */
function doPost(e) {

  try {

    if (!e || !e.postData || !e.postData.contents) {

      return failed("Request tidak valid.");

    }

    const request = JSON.parse(e.postData.contents);

    const action = request.action || "";

    const data = request.data || {};

    switch (action) {

      // ============================================
      // AUTH
      // ============================================

      case "login":

        return login(data);

      case "logout":

        return logout(data);

      case "verifySession":

        return verifySession(data);

      // ============================================
      // DASHBOARD
      // ============================================

      case "getDashboard":

        return getDashboard(data);

      // ============================================
      // REPORT
      // ============================================

      case "createReport":

        return createReport(data);

      case "getReport":

        return getReport(data);

      case "updateReport":

        return updateReport(data);

      // ============================================
      // UPLOAD
      // ============================================

      case "uploadPhoto":

        return uploadPhoto(data);

      // ============================================
      // DEFAULT
      // ============================================

      default:

        return failed("Action tidak ditemukan.");

    }

  }

  catch (err) {

    saveError(

      "Code.gs",

      err.toString()

    );

    return failed(

      err.toString()

    );

  }

}
