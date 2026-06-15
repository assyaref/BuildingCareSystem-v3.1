function doPost(e) {

  try {

    const request = JSON.parse(e.postData.contents);

    switch (request.action) {

      case "login":

        return login(request.data);

      default:

        return failed("Action tidak ditemukan");

    }

  }

  catch (err) {

    return failed(err.toString());

  }

}
