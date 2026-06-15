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

    const email = String(data.email || "").trim().toLowerCase();
    const password = String(data.password || "").trim();

    if (!email || !password) {
      return failed("Email dan Password wajib diisi.");
    }

    const user = findUser(email);

    if (!user) {
      saveActivity(email, "LOGIN_FAILED", "User tidak ditemukan");
      return failed("Email atau Password salah.");
    }

    // Support Plain Text + SHA256 (Auto Migration Ready)

    const passwordMatch =
      user.password === password ||
      user.password === hashPassword(password);

    if (!passwordMatch) {

      saveActivity(email, "LOGIN_FAILED", "Password salah");

      return failed("Email atau Password salah.");

    }

    // Auto migrate plain text ke SHA256

    if (user.password === password) {

      const sheet = getSheet(SHEET.USERS);

      sheet.getRange(user.row, 3).setValue(
        hashPassword(password)
      );

    }

    // Generate Session

    const token = generateToken();

    createSession(

      email,

      token

    );

    saveActivity(

      email,

      "LOGIN",

      "Login berhasil"

    );

    return success({

      email: user.email,

      nama: user.nama,

      role: user.role,

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
