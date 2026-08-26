/* ============================================================
   CENTINELA CODE
   SERVICE WORKER — VERSIÓN 2
   ============================================================ */

"use strict";

/* ============================================================
   CONFIGURACIÓN
   ============================================================ */

const CACHE_NAME = "centinela-code-v2";

const CACHE_STATIC = "centinela-code-static-v2";
const CACHE_DATA = "centinela-code-data-v2";
const CACHE_RUNTIME = "centinela-code-runtime-v2";


/* ============================================================
   ARCHIVOS PRINCIPALES DE LA APLICACIÓN
   ============================================================ */

const APP_FILES = [
    "./",
    "./index.html",
    "./style.css",
    "./app.js",
    "./manifest.json"
];


/* ============================================================
   DATOS LOCALES
   ============================================================ */

const DATA_FILES = [
    "./data/lopsc.json",
    "./data/infracciones.json",
    "./data/ordenanzas.json"
];


/* ============================================================
   INSTALACIÓN
   ============================================================ */

self.addEventListener(
    "install",
    function (event) {

        console.log(
            "[Centinela SW] Instalando versión:",
            CACHE_NAME
        );


        event.waitUntil(

            Promise.all([

                caches
                    .open(CACHE_STATIC)
                    .then(
                        function (cache) {

                            return cache.addAll(
                                APP_FILES
                            );

                        }
                    ),

                caches
                    .open(CACHE_DATA)
                    .then(
                        function (cache) {

                            return cache.addAll(
                                DATA_FILES
                            );

                        }
                    )

            ])
            .then(
                function () {

                    console.log(
                        "[Centinela SW] Archivos almacenados correctamente."
                    );

                    return self.skipWaiting();

                }
            )

        );

    }
);


/* ============================================================
   ACTIVACIÓN
   ============================================================ */

self.addEventListener(
    "activate",
    function (event) {

        console.log(
            "[Centinela SW] Activando:",
            CACHE_NAME
        );


        event.waitUntil(

            caches
                .keys()
                .then(
                    function (cacheNames) {

                        return Promise.all(

                            cacheNames
                                .filter(
                                    function (cacheName) {

                                        return (

                                            cacheName !==
                                                CACHE_STATIC &&

                                            cacheName !==
                                                CACHE_DATA &&

                                            cacheName !==
                                                CACHE_RUNTIME

                                        );

                                    }
                                )
                                .map(
                                    function (cacheName) {

                                        console.log(
                                            "[Centinela SW] Eliminando caché antigua:",
                                            cacheName
                                        );


                                        return caches.delete(
                                            cacheName
                                        );

                                    }
                                )

                        );

                    }
                )
                .then(
                    function () {

                        return self.clients.claim();

                    }
                )
                .then(
                    function () {

                        console.log(
                            "[Centinela SW] Activado correctamente."
                        );

                    }
                )

        );

    }
);


/* ============================================================
   FETCH
   ============================================================ */

self.addEventListener(
    "fetch",
    function (event) {

        const request =
            event.request;


        /*
         * Solo GET
         */

        if (
            request.method !== "GET"
        ) {

            return;

        }


        /*
         * No interceptar peticiones externas
         */

        const url =
            new URL(
                request.url
            );


        if (
            url.origin !==
            self.location.origin
        ) {

            return;

        }


        /*
         * DATOS JSON
         */

        if (
            url.pathname.includes(
                "/data/"
            )
        ) {

            event.respondWith(
                estrategiaDatos(
                    request
                )
            );

            return;

        }


        /*
         * NAVEGACIÓN
         */

        if (
            request.mode ===
                "navigate"
        ) {

            event.respondWith(
                estrategiaNavegacion(
                    request
                )
            );

            return;

        }


        /*
         * ARCHIVOS ESTÁTICOS
         */

        if (
            esArchivoEstatico(
                url.pathname
            )
        ) {

            event.respondWith(
                estrategiaEstaticos(
                    request
                )
            );

            return;

        }


        /*
         * RESTO DE PETICIONES
         */

        event.respondWith(
            estrategiaRuntime(
                request
            )
        );

    }
);


/* ============================================================
   COMPROBAR ARCHIVO ESTÁTICO
   ============================================================ */

function esArchivoEstatico(
    pathname
) {

    return (

        pathname.endsWith(
            ".html"
        ) ||

        pathname.endsWith(
            ".css"
        ) ||

        pathname.endsWith(
            ".js"
        ) ||

        pathname.endsWith(
            ".json"
        ) ||

        pathname.endsWith(
            ".webmanifest"
        ) ||

        pathname.endsWith(
            ".svg"
        ) ||

        pathname.endsWith(
            ".png"
        ) ||

        pathname.endsWith(
            ".jpg"
        ) ||

        pathname.endsWith(
            ".jpeg"
        ) ||

        pathname.endsWith(
            ".webp"
        ) ||

        pathname.endsWith(
            ".ico"
        )

    );

}


/* ============================================================
   ESTRATEGIA DATOS
   NETWORK FIRST + CACHE
   ============================================================ */

async function estrategiaDatos(
    request
) {

    const cache =
        await caches.open(
            CACHE_DATA
        );


    try {

        const respuestaRed =
            await fetch(
                request,
                {
                    cache:
                        "no-store"
                }
            );


        if (
            respuestaRed &&
            respuestaRed.ok
        ) {

            await cache.put(
                request,
                respuestaRed.clone()
            );


            return respuestaRed;

        }


        throw new Error(
            "Respuesta de datos no válida"
        );

    } catch (
        error
    ) {

        console.warn(
            "[Centinela SW] Sin red para datos:",
            request.url
        );


        const respuestaCache =
            await cache.match(
                request
            );


        if (
            respuestaCache
        ) {

            return respuestaCache;

        }


        return new Response(

            JSON.stringify({

                error:
                    true,

                offline:
                    true,

                mensaje:
                    "Los datos no están disponibles sin conexión."

            }),

            {

                status:
                    503,

                headers: {

                    "Content-Type":
                        "application/json; charset=utf-8"

                }

            }

        );

    }

}


/* ============================================================
   ESTRATEGIA ESTÁTICOS
   CACHE FIRST
   ============================================================ */

async function estrategiaEstaticos(
    request
) {

    const cache =
        await caches.open(
            CACHE_STATIC
        );


    const respuestaCache =
        await cache.match(
            request
        );


    if (
        respuestaCache
    ) {

        return respuestaCache;

    }


    try {

        const respuestaRed =
            await fetch(
                request
            );


        if (
            respuestaRed &&
            respuestaRed.ok
        ) {

            await cache.put(
                request,
                respuestaRed.clone()
            );

        }


        return respuestaRed;

    } catch (
        error
    ) {

        console.warn(
            "[Centinela SW] Recurso no disponible:",
            request.url
        );


        return (
            respuestaCache ||
            respuestaOffline()
        );

    }

}


/* ============================================================
   ESTRATEGIA NAVEGACIÓN
   NETWORK FIRST
   ============================================================ */

async function estrategiaNavegacion(
    request
) {

    try {

        const respuestaRed =
            await fetch(
                request,
                {
                    cache:
                        "no-store"
                }
            );


        if (
            respuestaRed &&
            respuestaRed.ok
        ) {

            const cache =
                await caches.open(
                    CACHE_STATIC
                );


            await cache.put(
                "./index.html",
                respuestaRed.clone()
            );


            return respuestaRed;

        }


        throw new Error(
            "Navegación no disponible"
        );

    } catch (
        error
    ) {

        console.warn(
            "[Centinela SW] Navegación offline."
        );


        const paginaCache =
            await caches.match(
                "./index.html"
            );


        if (
            paginaCache
        ) {

            return paginaCache;

        }


        return respuestaOffline();

    }

}


/* ============================================================
   ESTRATEGIA RUNTIME
   ============================================================ */

async function estrategiaRuntime(
    request
) {

    const cache =
        await caches.open(
            CACHE_RUNTIME
        );


    const respuestaCache =
        await cache.match(
            request
        );


    if (
        respuestaCache
    ) {

        return respuestaCache;

    }


    try {

        const respuestaRed =
            await fetch(
                request
            );


        if (
            respuestaRed &&
            respuestaRed.ok
        ) {

            await cache.put(
                request,
                respuestaRed.clone()
            );

        }


        return respuestaRed;

    } catch (
        error
    ) {

        if (
            respuestaCache
        ) {

            return respuestaCache;

        }


        return new Response(
            "",
            {

                status:
                    503,

                statusText:
                    "Offline"

            }
        );

    }

}


/* ============================================================
   RESPUESTA OFFLINE
   ============================================================ */

function respuestaOffline() {

    return new Response(

        `
        <!DOCTYPE html>

        <html lang="es">

        <head>

            <meta charset="UTF-8">

            <meta
                name="viewport"
                content="width=device-width, initial-scale=1.0"
            >

            <title>
                Centinela Code
            </title>

            <style>

                body {

                    margin: 0;

                    min-height: 100vh;

                    display: flex;

                    align-items: center;

                    justify-content: center;

                    background: #020617;

                    color: #f8fafc;

                    font-family:
                        Arial,
                        sans-serif;

                    padding: 20px;

                    box-sizing: border-box;

                }

                .offline {

                    max-width: 420px;

                    padding: 30px;

                    border-radius: 18px;

                    background: #0f172a;

                    border:
                        1px solid #334155;

                    text-align: center;

                }

                h1 {

                    margin-top: 0;

                }

                p {

                    color: #cbd5e1;

                    line-height: 1.6;

                }

            </style>

        </head>

        <body>

            <div class="offline">

                <h1>
                    Centinela Code
                </h1>

                <p>
                    La aplicación está
                    temporalmente sin conexión.
                </p>

                <p>
                    Si ya has utilizado la aplicación
                    anteriormente, intenta volver
                    a cargarla.
                </p>

            </div>

        </body>

        </html>
        `,

        {

            status:
                503,

            headers: {

                "Content-Type":
                    "text/html; charset=utf-8"

            }

        }

    );

}


/* ============================================================
   MENSAJE DESDE LA PÁGINA
   ============================================================ */

self.addEventListener(
    "message",
    function (event) {

        if (
            event.data &&
            event.data.type ===
                "SKIP_WAITING"
        ) {

            self.skipWaiting();

        }


        if (
            event.data &&
            event.data.type ===
                "CLEAR_CACHES"
        ) {

            event.waitUntil(

                caches
                    .keys()
                    .then(
                        function (names) {

                            return Promise.all(

                                names.map(
                                    function (name) {

                                        return caches.delete(
                                            name
                                        );

                                    }
                                )

                            );

                        }
                    )

            );

        }

    }
);


/* ============================================================
   FIN SERVICE WORKER
   ============================================================ */
