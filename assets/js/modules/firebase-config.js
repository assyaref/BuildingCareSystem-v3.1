// ======================================================
// BCS FIREBASE PUSH CLIENT - FINAL FIXED
// Building Care System Enterprise
// Firebase Cloud Messaging Web
// Version 2.3.7
// ======================================================

"use strict";

const BCS_FIREBASE_CONFIG = {
  apiKey: "AIzaSyCp6C807_EPAPj3LHByv0Y9-lGKYifOFNU",
  authDomain: "building-care-system.firebaseapp.com",
  projectId: "building-care-system",
  storageBucket: "building-care-system.firebasestorage.app",
  messagingSenderId: "994596342717",
  appId: "1:994596342717:web:dc375a46352895db2220d4",
  measurementId: "G-7LETZNJ9PG"
};

const BCS_VAPID_KEY =
  "BC6mvtyczlo387aQq1Hu5Ws_y2g8J3TCIB8tUQu7yudX5HbjMFLufFhxF-XFi1U20fJ621IabBzbUPrMxI_dCd0";

window.BCSPush = (() => {
  let firebaseApp = null;
  let messaging = null;
  let firebaseModules = null;

  // ====================================================
  // LOAD FIREBASE
  // ====================================================

  async function loadFirebase() {
    if (firebaseModules && messaging) {
      return firebaseModules;
    }

    const appModule = await import(
      "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js"
    );

    const messagingModule = await import(
      "https://www.gstatic.com/firebasejs/12.1.0/firebase-messaging.js"
    );

    firebaseApp =
      appModule.getApps().length > 0
        ? appModule.getApp()
        : appModule.initializeApp(BCS_FIREBASE_CONFIG);

    messaging = messagingModule.getMessaging(firebaseApp);

    firebaseModules = {
      getToken: messagingModule.getToken,
      onMessage: messagingModule.onMessage
    };

    return firebaseModules;
  }

  // ====================================================
  // GET CURRENT USER
  // Mendukung BCS.Storage + localStorage + sessionStorage
  // ====================================================

  function getCurrentUser() {
    try {
      if (window.BCS?.Storage?.getSession) {
        const session = window.BCS.Storage.getSession();

        if (session) {
          return session.user || session;
        }
      }
    } catch (error) {
      console.warn(
        "[BCS Push] Gagal membaca BCS.Storage:",
        error
      );
    }

    const storageKeys = [
      "BCS_USER",
      "BCS_SESSION"
    ];

    for (const key of storageKeys) {
      try {
        const raw =
          localStorage.getItem(key) ||
          sessionStorage.getItem(key);

        if (!raw) continue;

        const parsed = JSON.parse(raw);

        if (parsed) {
          return parsed.user || parsed;
        }
      } catch (error) {
        console.warn(
          `[BCS Push] Gagal membaca ${key}:`,
          error
        );
      }
    }

    return {};
  }

  // ====================================================
  // REGISTER TOKEN TO BACKEND
  // FIX: BCS.Api, bukan BCS.API
  // ====================================================

  async function sendTokenToBackend(fcmToken) {
    const user = getCurrentUser();

    const tokenData = {
      fcmToken: fcmToken,
      nik:
        user.nik ||
        user.NIK ||
        "",
      email:
        user.email ||
        user.Email ||
        "",
      nama:
        user.nama ||
        user.name ||
        user.Nama ||
        "",
      role:
        user.role ||
        user.Role ||
        "",
      device:
        navigator.userAgent ||
        "",
      platform:
        navigator.userAgentData?.platform ||
        navigator.platform ||
        ""
    };

    console.log(
      "[BCS Push] Mendaftarkan token:",
      {
        nik: tokenData.nik,
        email: tokenData.email,
        nama: tokenData.nama,
        role: tokenData.role
      }
    );

    // API helper utama BCS
    if (window.BCS?.Api?.post) {
      const result = await window.BCS.Api.post(
        "registerPushToken",
        tokenData
      );

      console.log(
        "[BCS Push] Response backend:",
        result
      );

      return result;
    }

    // Fallback langsung ke API URL
    const apiUrl =
      window.CONFIG?.API_URL ||
      window.BCS_CONFIG?.API_URL ||
      window.BCS?.CONFIG?.API_URL;

    if (!apiUrl) {
      throw new Error(
        "BCS.Api.post dan API_URL tidak ditemukan."
      );
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify({
        action: "registerPushToken",
        data: tokenData
      })
    });

    const result = await response.json();

    console.log(
      "[BCS Push] Response backend fallback:",
      result
    );

    return result;
  }

  // ====================================================
  // ENABLE PUSH NOTIFICATION
  // ====================================================

  async function enable() {
    if (!("Notification" in window)) {
      throw new Error(
        "Browser tidak mendukung notifikasi."
      );
    }

    if (!("serviceWorker" in navigator)) {
      throw new Error(
        "Browser tidak mendukung Service Worker."
      );
    }

    console.log(
      "[BCS Push] Permission saat ini:",
      Notification.permission
    );

    let permission = Notification.permission;

    if (permission !== "granted") {
      permission =
        await Notification.requestPermission();
    }

    if (permission !== "granted") {
      return {
        success: false,
        permission: permission,
        message: "Izin notifikasi belum diberikan."
      };
    }

    console.log(
      "[BCS Push] Menunggu Service Worker..."
    );

    const registration =
      await navigator.serviceWorker.ready;

    console.log(
      "[BCS Push] Service Worker siap:",
      registration.scope
    );

    const firebase = await loadFirebase();

    console.log(
      "[BCS Push] Meminta FCM token..."
    );

    const fcmToken =
      await firebase.getToken(
        messaging,
        {
          vapidKey: BCS_VAPID_KEY,
          serviceWorkerRegistration: registration
        }
      );

    if (!fcmToken) {
      throw new Error(
        "FCM token tidak berhasil dibuat."
      );
    }

    console.log(
      "[BCS Push] FCM token berhasil dibuat."
    );

    // Token wajib berhasil masuk backend
    const backendResult =
      await sendTokenToBackend(fcmToken);

    if (
      !backendResult ||
      backendResult.success !== true
    ) {
      throw new Error(
        backendResult?.message ||
        "Token FCM gagal disimpan ke backend."
      );
    }

    // Simpan lokal HANYA setelah backend sukses
    localStorage.setItem(
      "BCS_FCM_TOKEN",
      fcmToken
    );

    localStorage.setItem(
      "BCS_FCM_REGISTERED_AT",
      new Date().toISOString()
    );

    console.log(
      "[BCS Push] Token berhasil tersimpan di backend."
    );

    return {
      success: true,
      permission: permission,
      tokenSaved: true,
      backend: backendResult
    };
  }

  // ====================================================
  // FOREGROUND MESSAGE
  // ====================================================

  async function initForegroundListener() {
    try {
      if (
        !("Notification" in window) ||
        Notification.permission !== "granted"
      ) {
        return;
      }

      const firebase = await loadFirebase();

      firebase.onMessage(
        messaging,
        payload => {
          console.log(
            "[BCS Push] Foreground message:",
            payload
          );

          const title =
            payload?.notification?.title ||
            "Building Care System";

          const body =
            payload?.notification?.body ||
            "Ada pembaruan laporan.";

          if (window.BCS?.UI?.toast) {
            window.BCS.UI.toast(
              `${title} - ${body}`,
              "info"
            );
          } else {
            console.log(
              "🔔",
              title,
              body
            );
          }
        }
      );

    } catch (error) {
      console.warn(
        "[BCS Push] Foreground listener gagal:",
        error
      );
    }
  }

  // ====================================================
  // STATUS
  // ====================================================

  function getStatus() {
    return {
      supported:
        "Notification" in window &&
        "serviceWorker" in navigator,
      permission:
        "Notification" in window
          ? Notification.permission
          : "unsupported",
      tokenSaved:
        Boolean(
          localStorage.getItem(
            "BCS_FCM_TOKEN"
          )
        ),
      registeredAt:
        localStorage.getItem(
          "BCS_FCM_REGISTERED_AT"
        )
    };
  }

  return {
    enable,
    initForegroundListener,
    getStatus
  };
})();

// ======================================================
// AUTO INIT FOREGROUND LISTENER
// ======================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {
    window.BCSPush
      .initForegroundListener()
      .catch(error => {
        console.warn(
          "[BCS Push] Auto init gagal:",
          error
        );
      });
  }
);

console.log(
  "✅ BCS Firebase Push Client v2.3.0 loaded"
);
