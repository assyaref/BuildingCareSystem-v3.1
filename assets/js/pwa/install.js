// ==========================================
// INSTALL
// ==========================================

self.addEventListener(

    "install",

    event=>{

        event.waitUntil(

            caches.open(

                STATIC_CACHE

            )

            .then(cache=>{

                return cache.addAll(

                    APP_SHELL

                );

            })

        );

        self.skipWaiting();

    }

);
