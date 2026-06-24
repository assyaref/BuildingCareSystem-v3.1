"use strict";

const UserProfileModule = (() => {
    function init() {
        const session = App.getSession();
const user = session?.user;

if (!user) {
    location.replace("login.html");
    return;
}

        $("#profileName").text(user.nama);
        $("#profileDept").text(user.departemen);
        $("#lastLogin").text(user.lastLogin || "-");
        $("#logoutBtn").on("click", logout);
    }

    function logout() {
        App.removeSession();
        window.location.href = "index.html";
    }

    return { init };
})();

$(document).ready(() => {
    UserProfileModule.init();
});
