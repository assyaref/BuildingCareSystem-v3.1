// Request API
async function request(body) {

    const response = await fetch(CONFIG.API.URL, {

        method: "POST",

        headers: {

            "Content-Type": "application/json"

        },

        body: JSON.stringify(body)

    });

    return await response.json();

}
// Session
function setSession(user) {

    localStorage.setItem(

        CONFIG.STORAGE.SESSION,

        JSON.stringify(user)

    );

}

function getSession() {

    return JSON.parse(

        localStorage.getItem(

            CONFIG.STORAGE.SESSION

        )

    );

}
