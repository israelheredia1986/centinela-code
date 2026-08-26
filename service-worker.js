/* ============================================================
   CENTINELA CODE
   SERVICE WORKER
   Versión estable
   ============================================================ */

"use strict";

const CACHE_NAME = "centinela-code-v2";

/* ============================================================
   ARCHIVOS PRINCIPALES DE LA APLICACIÓN
   ============================================================ */

const APP_FILES = [
    "./",
    "./index.html",
    "./style.css",
    "./app.js",
    "./manifest.json",
    "./data/lopsc.json",
    "./data/infracciones.json",
    "./data/ordenanzas.json"
];

/* ============================================================
   INSTALACIÓN
   ============================================================ */

self.addEventListener("install", function (event) {

    event.waitUntil(

        caches.open(CACHE_NAME)

            .then(function (cache) {

                /*
                 * No utilizamos cache.addAll().
                 *
                 * Así, si falta un archivo concreto,
                 * no se rompe toda la instalación
                 * del Service Worker.
                 */

                const tareas = APP_FILES.map(
                    function (archivo) {

                        return fetch(
                            archivo,
                            {
                                cache: "no-cache"
                            }
                        )
                            .then(
                                function (respuesta) {

                                    if (
                                        !respuesta.ok
                                    ) {

                                        console.warn(
                                            "Centinela Code: no se pudo precargar:",
                                            archivo,
                                            respuesta.status
                                        );

                                        return null;
                                    }

                                    return cache.put(
                                        archivo,
                                        respuesta
                                    );
                                }
                            )
                            .catch(
                                function (error) {

                                    console.warn(
                                        "Centinela Code: error precargando:",
                                        archivo,
                                        error
                                    );

                                    return null;
                                }
                            );
                    }
                );

                return Promise.all(
                    tareas
                );
            })

            .then(function () {

                return self.skipWaiting();

            })
    );
});


/* ============================================================
   ACTIVACIÓN
   ============================================================ */

self.addEventListener("activate", function (event) {

    event.waitUntil(

        caches.keys()

            .then(function (cacheNames) {

                return Promise.all(

                    cacheNames

                        .filter(
                            function (cacheName) {

                                return (
                                    cacheName !==
                                    CACHE_NAME
                                );
                            }
                        )

                        .map(
                            function (cacheName) {

                                console.log(
                                    "Centinela Code: eliminando caché antigua:",
                                    cacheName
                                );

                                return caches.delete(
                                    cacheName
                                );
                            }
                        )
                );
            })

            .then(function () {

                return self.clients.claim();

            })
    );
});


/* ============================================================
   PETICIONES
   ============================================================ */

self.addEventListener("fetch", function (event) {

    /*
     * Solo gestionamos peticiones GET.
     */

    if (
        event.request.method !== "GET"
    ) {

        return;
    }


    /*
     * Solo gestionamos peticiones HTTP/HTTPS.
     */

    const url =
        new URL(
            event.request.url
        );


    if (
        url.protocol !== "http:" &&
        url.protocol !== "https:"
    ) {

        return;
    }


    event.respondWith(

        caches.match(
            event.request
        )

            .then(
                function (respuestaCache) {

                    /*
                     * Si está en caché,
                     * devolvemos inmediatamente.
                     */

                    if (
                        respuestaCache
                    ) {

                        return respuestaCache;
                    }


                    /*
                     * Si no está en caché,
                     * intentamos obtenerlo de Internet.
                     */

                    return fetch(
                        event.request
                    )

                        .then(
                            function (respuestaRed) {

                                /*
                                 * Si la respuesta no es válida,
                                 * simplemente la devolvemos.
                                 */

                                if (
                                    !respuestaRed ||
                                    !respuestaRed.ok
                                ) {

                                    return respuestaRed;
                                }


                                /*
                                 * Guardamos una copia
                                 * para poder utilizarla
                                 * posteriormente sin conexión.
                                 */

                                return caches.open(
                                    CACHE_NAME
                                )
                                    .then(
                                        function (cache) {

                                            cache.put(
                                                event.request,
                                                respuestaRed.clone()
                                            );

                                            return respuestaRed;
                                        }
                                    );
                            }
                        )

                        .catch(
                            function () {

                                /*
                                 * Si falla Internet,
                                 * intentamos devolver
                                 * index.html.
                                 */

                                return caches.match(
                                    "./index.html"
                                );
                            }
                        );
                }
            )
    );
});


/* ============================================================
   MENSAJE DESDE LA APLICACIÓN
   ============================================================ */

self.addEventListener("message", function (event) {

    if (
        !event.data
    ) {

        return;
    }


    if (
        event.data.type ===
        "SKIP_WAITING"
    ) {

        self.skipWaiting();
    }
});


/* ============================================================
   FIN SERVICE WORKER
   ============================================================ */
