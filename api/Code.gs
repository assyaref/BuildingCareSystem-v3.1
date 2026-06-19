// =====================================================
// Building Care System Enterprise v3.2
// Main Router API
// =====================================================

function doGet(e) {

  try {

    const action = e.parameter.action || "health";

    switch (action) {

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

    saveError("Code.gs", err.toString());

    return failed(err.toString());

  }

}

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

    } catch (jsonError) {

      return failed("Format JSON tidak valid.");

    }

    const action = request.action || "";

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

      case "createReport":
        return createReport(data);

      case "getReport":
        return getReport(data);

      case "updateReport":
        return updateReport(data);

      case "uploadPhoto":
        return uploadPhoto(data);

      default:
        return failed("Action tidak ditemukan : " + action);

    }

  } catch (err) {

    saveError("Code.gs", err.toString());

    return failed(err.toString());

  }

}
