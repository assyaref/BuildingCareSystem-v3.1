// =====================================================
// Building Care System Enterprise v3.1
// Authentication Module
// Radiant Group Duri
// =====================================================

/**
 * LOGIN
 */
function login(data) {

  try {

    const nik      = String(data.nik || "").trim();
    const password = String(data.password || "").trim();

    if (!nik || !password) {
      return failed("NIK dan Password wajib diisi.");
    }

    // Find user by NIK (column B)
    const user = findUserByNik(nik);

    if (!user) {
      saveActivity(nik, "LOGIN_FAILED", "User tidak ditemukan");
      return failed("NIK atau Password salah.");
    }

    // Cek status user ACTIVE
    if (String(user.status).toUpperCase() !== "ACTIVE") {
      saveActivity(nik, "LOGIN_FAILED", "Akun tidak aktif");
      return failed("Akun Anda tidak aktif. Hubungi Administrator.");
    }

    // Support Plain Text + SHA256 (Auto Migration Ready)

    const passwordMatch =
      user.password === password ||
      user.password === hashPassword(password);

    if (!passwordMatch) {

      saveActivity(nik, "LOGIN_FAILED", "Password salah");

      return failed("NIK atau Password salah.");

    }

    // Auto migrate plain text ke SHA256
    // Column D = index 4 (1-based)

    if (user.password === password) {

      const sheet = getSheet(SHEET.USERS);

      sheet.getRange(user.row, 4).setValue(
        hashPassword(password)
      );

    }

    // Generate Session

    const token = generateToken();

    createSession(

      user.email,

      token

    );

    saveActivity(

      user.email,

      "LOGIN",

      "Login berhasil via NIK: " + nik

    );

    return success({

      email: user.email,

      nik:   user.nik,

      nama:  user.nama,

      role:  user.role,

      token: token

    },

    "Login berhasil");

  }

  catch (err) {

    saveError(

      "Auth.gs",

      err.toString()

    );

    return failed(

      err.toString()

    );

  }

}

/**
 * LOGOUT
 */
function logout(data) {

  try {

    const token = data.token || "";

    const sheet = getSheet(

      SHEET.USER_SESSION

    );

    const values = sheet

      .getDataRange()

      .getValues();

    for (let i = 1; i < values.length; i++) {

      if (values[i][2] == token) {

        sheet.getRange(

          i + 1,

          8

        ).setValue("INACTIVE");

        saveActivity(

          values[i][1],

          "LOGOUT",

          "Logout berhasil"

        );

        break;

      }

    }

    return success({}, "Logout berhasil");

  }

  catch (err) {

    saveError(

      "Auth.gs",

      err.toString()

    );

    return failed(

      err.toString()

    );

  }

}

/**
 * VERIFY SESSION
 */
function verifySession(data) {

  try {

    const token = data.token || "";

    const sheet = getSheet(

      SHEET.USER_SESSION

    );

    const values = sheet

      .getDataRange()

      .getValues();

    for (let i = 1; i < values.length; i++) {

      if (

        values[i][2] == token &&

        values[i][7] == "ACTIVE"

      ) {

        // Update Last Activity

        sheet.getRange(

          i + 1,

          5

        ).setValue(now());

        return success({

          valid: true

        });

      }

    }

    return failed("Session Expired");

  }

  catch (err) {

    saveError(

      "Auth.gs",

      err.toString()

    );

    return failed(

      err.toString()

    );

  }

}

/**
 * CREATE SESSION
 */
function createSession(

  email,

  token

) {

  const sheet = getSheet(

    SHEET.USER_SESSION

  );

  sheet.appendRow([

    Utilities.getUuid(),

    email,

    token,

    now(),

    now(),

    now(),

    Session.getActiveUser().getEmail(),

    "ACTIVE"

  ]);

}
