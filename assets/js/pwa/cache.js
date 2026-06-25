// ======================================================
// Building Care System Enterprise v10
// cache.js
// Cache Strategy Engine
// ======================================================

"use strict";

const CacheManager = (() => {

    const VERSION = "10.0.0";

    const CACHE = {

        STATIC: `bcs-static-${VERSION}`,

        RUNTIME: `bcs-runtime-${VERSION}`

    };

    const STATIC_EXT = [

        ".css",

        ".js",

        ".woff",

        ".woff2",

        ".png",

        ".jpg",

        ".jpeg",

        ".svg",

        ".ico"

    ];

    function isStatic(request){

        return STATIC_EXT.some(ext=>

            request.url.endsWith(ext)

        );

    }

    async function cacheFirst(request){

        const cached=

            await caches.match(request);

        if(cached){

            return cached;

        }

        const response=

            await fetch(request);

        const cache=

            await caches.open(

                CACHE.STATIC

            );

        cache.put(

            request,

            response.clone()

        );

        return response;

    }

    async function networkFirst(request){

        try{

            const response=

                await fetch(request);

            const cache=

                await caches.open(

                    CACHE.RUNTIME

                );

            cache.put(

                request,

                response.clone()

            );

            return response;

        }

        catch{

            return await caches.match(request);

        }

    }

    async function staleWhileRevalidate(request){

        const cache=

            await caches.match(request);

        const network=

            fetch(request)

            .then(async response=>{

                const runtime=

                    await caches.open(

                        CACHE.RUNTIME

                    );

                runtime.put(

                    request,

                    response.clone()

                );

                return response;

            });

        return cache||network;

    }

    async function strategy(request){

        if(isStatic(request)){

            return cacheFirst(request);

        }

        if(

            request.url.includes(

                "/exec"

            )

        ){

            return networkFirst(request);

        }

        return staleWhileRevalidate(

            request

        );

    }

    return Object.freeze({

        strategy,

        cacheFirst,

        networkFirst,

        staleWhileRevalidate

    });

})();
