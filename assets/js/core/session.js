// =====================================================
// Building Care System Enterprise v3.1
// Session Manager
// =====================================================

"use strict";

const Session = (() => {

    const KEY = "BCS_SESSION";

    function save(data) {

        if (!data) return;

        localStorage.setItem(

            KEY,

            JSON.stringify(data)

        );

    }

    function get() {

        try {

            const value = localStorage.getItem(KEY);

            if (!value) return null;

            return JSON.parse(value);

        }

        catch (e) {

            console.error(e);

            return null;

        }

    }

    function remove() {

        localStorage.removeItem(KEY);

    }

    function exists() {

        return get() !== null;

    }

    function token() {

        const session = get();

        return session ? session.token : null;

    }

    function user() {

        return get();

    }

    return {

        save,

        get,

        remove,

        exists,

        token,

        user

    };

})();
