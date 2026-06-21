// ======================================================
// Building Care System Enterprise v3.2
// Core API Service
// Radiant Group Duri
// ======================================================

"use strict";

const Api = (() => {

    // ==========================================
    // PRIVATE
    // ==========================================

    const BASE_URL = CONFIG.API.URL;

    // ==========================================
    // LOGGER
    // ==========================================

    function log(...args) {

        console.log(

            "[API]",

            ...args

        );

    }

    function error(...args) {

        console.error(

            "[API ERROR]",

            ...args

        );

    }

    // ==========================================
    // PARSE RESPONSE
    // ==========================================

    async function parse(response) {

        try {

            return await response.json();

        }

        catch (err) {

            return {

                success: false,

                message: "Invalid JSON Response"

            };

        }

    }

// ==========================================
// POST
// ==========================================
async function post(action, data = {}) {

    try {

        const response = await fetch(BASE_URL, {
            method: "POST",

            headers: {
                "Content-Type": "text/plain;charset=utf-8"
            },

            body: JSON.stringify({
                action,
                data
            })

        });

        const result = await parse(response);

        console.log("================================");
        console.log("API URL :", BASE_URL);
        console.log("ACTION  :", action);
        console.log("DATA    :", data);
        console.log("RESULT  :", result);
        console.log("================================");

        return result;

    } catch (err) {

        console.error("[API ERROR]", err);

        return {
            success: false,
            message: err.message || "Failed to fetch"
        };

    }

}
    // ==========================================
    // GET
    // ==========================================

    async function get(action, data = {}) {

        try {

            const params = new URLSearchParams({

                action,

                ...data

            });

            const response = await fetch(

                BASE_URL + "?" + params.toString(),

                {

                    method: "GET",

                    cache: "no-store"

                }

            );

            return await parse(response);

        }

        catch (err) {

            error(err);

            return {

                success: false,

                message: err.message || "Failed to fetch"

            };

        }

    }

    // ==========================================
    // EXPORT
    // ==========================================

    return {

        get,

        post

    };

})();
