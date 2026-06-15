// Login
async function login(email, password) {

    const response = await request({

        action: "login",

        data: {

            email,

            password

        }

    });

    if (!response.success) {

        throw new Error(response.message);

    }

    setSession(response.data);

    window.location.href = "dashboard.html";

}

// Logout
function logout() {

    localStorage.removeItem(CONFIG.STORAGE.SESSION);

    localStorage.removeItem(CONFIG.STORAGE.USER);

    window.location.replace("login.html");

}
// Check Session
Check Session
