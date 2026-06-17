// =====================================================
// Building Care System Enterprise v3.1
// Core API Service
// Radiant Group Duri
// =====================================================

"use strict";

const Api = (() => {

    // ==========================================
    // BASE URL
    // ==========================================

    const BASE_URL = CONFIG.API_URL;

    // ==========================================
    // POST REQUEST
    // ==========================================

    async function post(action, data = {}) {

        try {

            const response = await fetch(BASE_URL, {

                method: "POST",

                headers: {

                    "Content-Type": "application/json"

                },

                body: JSON.stringify({

                    action,

                    data

                })

            });

            if (!response.ok) {

                throw new Error(

                    "HTTP " + response.status

                );

            }

            return await response.json();

        }

        catch (error) {

            console.error(

                "[API ERROR]",

                error

            );

            return {

                success: false,

                message: error.message

            };

        }

    }

    // ==========================================
    // GET (Health Check)
    // ==========================================

    async function get() {

        try {

            const response = await fetch(BASE_URL);

            if (!response.ok) {

                throw new Error(

                    "HTTP " + response.status

                );

            }

            return await response.json();

        }

        catch (error) {

            console.error(

                "[API ERROR]",

                error

            );

            return {

                success: false,

                message: error.message

            };

        }

    }

    // ==========================================
    // EXPORT
    // ==========================================

    return {

        post,

        get

    };

})();
