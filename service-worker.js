/* ============================================================
   CENTINELA CODE
   SERVICE WORKER
   Versión 3.0.1
   ============================================================ */

"use strict";

/* ============================================================
   CONFIGURACIÓN
   ============================================================ */

const CACHE_VERSION = "3.0.1";

const CACHE_STATIC =
    `centinela-static-v${CACHE_VERSION}`;

const CACHE_DATA =
    `centinela-data-v${CACHE_VERSION}`;

const CACHE_RUNTIME =
    `centinela-runtime-v${CACHE_VERSION}`;


/* ============================================================
   ARCHIVOS PRINCIPALES DE LA APLICACIÓN
   ============================================================ */

const STATIC_FILES = [
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
    "./data/ordenanzas.json",
    "./data/infracciones.json"
];


/* ============================================================
   INSTALACIÓN
   ============================================================ */

self.addEventListener(
    "install",
    event => {

        console.log(
            "[Centinela SW] Instalando versión",
            CACHE_VERSION
        );

        event.waitUntil(

            Promise.all([

                /* --------------------------------------------
                   CACHÉ DE ARCHIVOS PRINCIPALES
                   -------------------------------------------- */

                caches
                    .open(CACHE_STATIC)
                    .then(
                        cache => {

                            return cache.addAll(
                                STATIC_FILES
                            );

                        }
                    ),


                /* --------------------------------------------
                   CACHÉ DE DATOS
                   --------------------------------------------

                   No hacemos que un JSON que falte
                   bloquee la instalación completa.
                   -------------------------------------------- */

                caches
                    .open(CACHE_DATA)
                    .then(
                        async cache => {

                            for (
                                const archivo of DATA_FILES
                            ) {

                                try {

                                    const respuesta =
                                        await fetch(
                                            archivo,
                                            {
                                                cache: "no-store"
                                            }
                                        );

                                    if (
                                        respuesta.ok
                                    ) {

                                        await cache.put(
                                            archivo,
                                            respuesta.clone()
                                        );

                                        console.log(
                                            "[Centinela SW] Datos guardados:",
                                            archivo
                                        );

                                    } else {

                                        console.warn(
                                            "[Centinela SW] No se pudo guardar:",
                                            archivo,
                                            "HTTP",
                                            respuesta.status
                                        );

                                    }

                                } catch (
                                    error
                                ) {

                                    console.warn(
                                        "[Centinela SW] Error cargando:",
                                        archivo,
                                        error
                                    );

                                }

                            }

                        }
                    )

            ])

            .then(
                () => {

                    console.log(
                        "[Centinela SW] Caché inicial creada."
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
    event => {

        console.log(
            "[Centinela SW] Activando versión",
            CACHE_VERSION
        );

        event.waitUntil(

            caches
                .keys()

                .then(
                    cacheNames => {

                        return Promise.all(

                            cacheNames

                                .filter(
                                    cacheName =>

                                        cacheName !==
                                            CACHE_STATIC &&

                                        cacheName !==
                                            CACHE_DATA &&

                                        cacheName !==
                                            CACHE_RUNTIME
                                )

                                .map(
                                    cacheName => {

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
                    () => {

                        return self.clients.claim();

                    }
                )

                .then(
                    () => {

                        return avisarClientesNuevaVersion();

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
    event => {

        const request =
            event.request;


        /* -----------------------------------------------
           SOLO GET
           ----------------------------------------------- */

        if (
            request.method !== "GET"
        ) {

            return;

        }


        /* -----------------------------------------------
           NO INTERCEPTAR EXTENSIONES U OTROS ORÍGENES
           ----------------------------------------------- */

        if (
            !request.url.startsWith(
                self.location.origin
            )
        ) {

            return;

        }


        const url =
            new URL(
                request.url
            );


        /* -----------------------------------------------
           DATOS JSON
           ----------------------------------------------- */

        if (
            esArchivoDatos(
                url.pathname
            )
        ) {

            event.respondWith(
                estrategiaDatos(
                    request
                )
            );

            return;

        }


        /* -----------------------------------------------
           ARCHIVOS ESTÁTICOS
           ----------------------------------------------- */

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


        /* -----------------------------------------------
           NAVEGACIÓN
           ----------------------------------------------- */

        if (
            request.mode === "navigate"
        ) {

            event.respondWith(
                estrategiaNavegacion(
                    request
                )
            );

            return;

        }


        /* -----------------------------------------------
           RESTO DE PETICIONES
           ----------------------------------------------- */

        event.respondWith(
            estrategiaRuntime(
                request
            )
        );

    }
);


/* ============================================================
   IDENTIFICAR ARCHIVOS DE DATOS
   ============================================================ */

function esArchivoDatos(
    pathname
) {

    return (

        pathname.endsWith(
            "/lopsc.json"
        )

        ||

        pathname.endsWith(
            "/ordenanzas.json"
        )

        ||

        pathname.endsWith(
            "/infracciones.json"
        )

    );

}


/* ============================================================
   IDENTIFICAR ARCHIVOS ESTÁTICOS
   ============================================================ */

function esArchivoEstatico(
    pathname
) {

    return (

        pathname.endsWith(
            "/index.html"
        )

        ||

        pathname.endsWith(
            "/style.css"
        )

        ||

        pathname.endsWith(
            "/app.js"
        )

        ||

        pathname.endsWith(
            "/manifest.json"
        )

    );

}


/* ============================================================
   ESTRATEGIA DATOS
   NETWORK FIRST
   ============================================================ */

async function estrategiaDatos(
    request
) {

    try {

        const respuestaRed =
            await fetch(
                request,
                {
                    cache: "no-store"
                }
            );


        if (
            respuestaRed &&
            respuestaRed.ok
        ) {

            const cache =
                await caches.open(
                    CACHE_DATA
                );


            await cache.put(
                request,
                respuestaRed.clone()
            );


            return respuestaRed;

        }


        throw new Error(
            `HTTP ${
                respuestaRed
                    ? respuestaRed.status
                    : "desconocido"
            }`
        );

    } catch (
        error
    ) {

        console.warn(
            "[Centinela SW] Sin red para datos:",
            request.url,
            error
        );


        const respuestaCache =
            await caches.match(
                request
            );


        if (
            respuestaCache
        ) {

            return respuestaCache;

        }


        return new Response(

            JSON.stringify({

                error: true,

                offline: true,

                mensaje:
                    "Los datos no están disponibles."

            }),

            {
                status: 503,

                headers: {

                    "Content-Type":
                        "application/json; charset=utf-8"

                }

            }

        );

    }

}


/* ============================================================
   ESTRATEGIA ARCHIVOS ESTÁTICOS
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
            "[Centinela SW] Error archivo estático:",
            request.url,
            error
        );


        return (
            respuestaCache ||
            respuestaOffline()
        );

    }

}


/* ============================================================
   ESTRATEGIA NAVEGACIÓN
   ============================================================ */

async function estrategiaNavegacion(
    request
) {

    try {

        const respuestaRed =
            await fetch(
                request,
                {
                    cache: "no-store"
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
                status: 503,
                statusText: "Offline"
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

            <meta
                name="theme-color"
                content="#0f172a"
            >

            <title>
                Centinela Code
            </title>

            <style>

                html,
                body {

                    margin: 0;
                    padding: 0;
                    min-height: 100%;

                    background:
                        #020617;

                    color:
                        #f8fafc;

                    font-family:
                        Arial,
                        Helvetica,
                        sans-serif;

                }

                body {

                    display: flex;

                    align-items:
                        center;

                    justify-content:
                        center;

                    padding:
                        24px;

                    box-sizing:
                        border-box;

                }

                .offline {

                    max-width:
                        420px;

                    text-align:
                        center;

                }

                h1 {

                    margin-bottom:
                        12px;

                }

                p {

                    color:
                        #cbd5e1;

                    line-height:
                        1.5;

                }

            </style>

        </head>

        <body>

            <main class="offline">

                <h1>
                    Centinela Code
                </h1>

                <p>
                    La aplicación se encuentra
                    sin conexión.
                </p>

                <p>
                    No existe todavía una copia
                    local disponible de esta página.
                </p>

            </main>

        </body>

        </html>
        `,

        {

            status: 503,

            statusText:
                "Offline",

            headers: {

                "Content-Type":
                    "text/html; charset=utf-8"

            }

        }

    );

}


/* ============================================================
   AVISAR A LAS PÁGINAS ABIERTAS
   ============================================================ */

async function avisarClientesNuevaVersion() {

    const clientes =
        await self.clients.matchAll(
            {
                type: "window"
            }
        );


    clientes.forEach(
        cliente => {

            cliente.postMessage({

                type:
                    "CENTINELA_SW_ACTUALIZADO",

                version:
                    CACHE_VERSION

            });

        }
    );

}


/* ============================================================
   MENSAJES DESDE APP.JS
   ============================================================ */

self.addEventListener(
    "message",
    event => {

        if (
            !event.data
        ) {

            return;

        }


        /* -----------------------------------------------
           FORZAR ACTUALIZACIÓN
           ----------------------------------------------- */

        if (
            event.data.type ===
            "SKIP_WAITING"
        ) {

            self.skipWaiting();

            return;

        }


        /* -----------------------------------------------
           LIMPIAR CACHE
           ----------------------------------------------- */

        if (
            event.data.type ===
            "CLEAR_CACHE"
        ) {

            event.waitUntil(

                caches
                    .keys()
                    .then(
                        keys =>

                            Promise.all(

                                keys.map(
                                    key =>
                                        caches.delete(
                                            key
                                        )
                                )

                            )
                    )

            );

            return;

        }


        /* -----------------------------------------------
           COMPROBAR VERSIÓN
           ----------------------------------------------- */

        if (
            event.data.type ===
            "GET_VERSION"
        ) {

            if (
                event.source
            ) {

                event.source.postMessage({

                    type:
                        "CENTINELA_SW_VERSION",

                    version:
                        CACHE_VERSION

                });

            }

        }

    }
);


/* ============================================================
   FIN SERVICE WORKER
   ============================================================ */
