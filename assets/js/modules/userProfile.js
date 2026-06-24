"use strict";

const UserProfileModule = (() => {
    function init() {
        const user = Session.getUser();
        if (!user) {
            window.location.href = "index.html";
            return;
        }

        $("#profileName").text(user.nama);
        $("#profileDept").text(user.departemen);
        $("#lastLogin").text(user.lastLogin || "-");
        $("#logoutBtn").on("click", logout);
    }

    function logout() {
        Session.clear();
        window.location.href = "index.html";
    }

    return { init };
})();

$(document).ready(() => {
    UserProfileModule.init();
});
