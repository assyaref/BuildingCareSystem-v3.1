// ======================================================
// BCS FIREBASE PUSH CLIENT - FINAL
// Firebase Cloud Messaging Web
// ======================================================

"use strict";

const BCS_FIREBASE_CONFIG = {
  apiKey: "AIzaSyCp6c807_EPAPi3LHBvv0Y9-JGKYifOFNU",
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

  async function loadFirebase() {
    const appModule = await import(
      "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js"
    );

    const messagingModule = await import(
      "https://www.gstatic.com/firebasejs/12.1.0/firebase-messaging.js"
    );

    firebaseApp =
      appModule.getApps().length
        ? appModule.getApp()
        : appModule.initializeApp(BCS_FIREBASE_CONFIG);

    messaging = messagingModule.getMessaging(firebaseApp);

    return {
      getToken: messagingModule.getToken,
      onMessage: messagingModule.onMessage
    };
  }

  function getCurrentUser() {
    try {
      const raw =
        localStorage.getItem("BCS_USER") ||
        sessionStorage.getItem("BCS_USER");

      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  async function sendTokenToBackend(fcmToken) {
    const user = getCurrentUser();

    const payload = {
      action: "registerPushToken",
      data: {
        fcmToken,
        nik: user.nik || "",
        email: user.email || "",
        nama: user.nama || user.name || "",
        role: user.role || "",
        device: navigator.userAgent || "",
        platform: navigator.platform || ""
      }
    };

    // Gunakan API helper BCS jika tersedia
    if (window.BCS?.API?.post) {
      return await window.BCS.API.post(
        "registerPushToken",
        payload.data
      );
    }

    // Fallback ke CONFIG.API_URL
    const apiUrl =
      window.CONFIG?.API_URL ||
      window.BCS_CONFIG?.API_URL;

    if (!apiUrl) {
      throw new Error("API_URL BCS tidak ditemukan.");
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(payload)
    });

    return await response.json();
  }

  async function enable() {
    if (!("Notification" in window)) {
      throw new Error("Browser tidak mendukung notifikasi.");
    }

    if (!("serviceWorker" in navigator)) {
      throw new Error("Browser tidak mendukung Service Worker.");
    }

    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      return {
        success: false,
        permission
      };
    }

    const registration = await navigator.serviceWorker.ready;
    const firebase = await loadFirebase();

    const fcmToken = await firebase.getToken(messaging, {
      vapidKey: BCS_VAPID_KEY,
      serviceWorkerRegistration: registration
    });

    if (!fcmToken) {
      throw new Error("FCM token tidak berhasil dibuat.");
    }

    const backendResult = await sendTokenToBackend(fcmToken);

    localStorage.setItem("BCS_FCM_TOKEN", fcmToken);

    return {
      success: true,
      permission,
      tokenSaved: true,
      backend: backendResult
    };
  }

  async function initForegroundListener() {
    try {
      const firebase = await loadFirebase();

      firebase.onMessage(messaging, payload => {
        const title =
          payload?.notification?.title ||
          "Building Care System";

        const body =
          payload?.notification?.body ||
          "Ada pembaruan laporan.";

        if (window.BCS?.UI?.toast) {
          window.BCS.UI.toast(title + " - " + body, "info");
        } else {
          console.log("🔔", title, body);
        }
      });
    } catch (error) {
      console.warn("[BCS Push] Foreground listener gagal:", error);
    }
  }

  return {
    enable,
    initForegroundListener
  };
})();

document.addEventListener("DOMContentLoaded", () => {
  window.BCSPush.initForegroundListener();
});
