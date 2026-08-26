/*
CENTINELA CODE SERVICE WORKER VERSIÓN 4.0.0 ========================================================
Este Service Worker está diseñado para: - Cargar la aplicación normalmente cuando hay conexión. - Guardar los archivos principales para uso sin conexión. - Evitar que una versión antigua de la caché bloquee la aplicación. - No interceptar innecesariamente peticiones externas. ======================================================== */
const CACHE_NAME = “centinela-code-v4”;
const APP_FILES = [ “./”, “./index.html”, “./style.css”, “./app.js”, “./manifest.json”, “./data/lopsc.json”, “./data/infracciones.json”, “./data/ordenanzas.json”];
/*
INSTALACIÓN
*/
self.addEventListener(“install”, function (event) {
event.waitUntil(

    caches.open(CACHE_NAME)
        .then(function (cache) {

            return cache.addAll(APP_FILES);

        })
        .then(function () {

            return self.skipWaiting();

        })

);
});
/*
ACTIVACIÓN
*/
self.addEventListener(“activate”, function (event) {
event.waitUntil(

    caches.keys()
        .then(function (cacheNames) {

            return Promise.all(

                cacheNames.map(function (cacheName) {

                    if (cacheName !== CACHE_NAME) {

                        return caches.delete(cacheName);

                    }

                    return Promise.resolve();

                })

            );

        })
        .then(function () {

            return self.clients.claim();

        })

);
});
/*
PETICIONES
IMPORTANTE:
•	HTML: primero intenta Internet y, si falla, utiliza la copia local.
•	CSS / JS / JSON / manifest / imágenes: intenta Internet y guarda la nueva versión.
•	Peticiones externas: no se guardan en la caché de la aplicación. ======================================================== */
self.addEventListener(“fetch”, function (event) {
if (event.request.method !== "GET") {

    return;

}

const requestURL = new URL(event.request.url);

/*
----------------------------------------------------
No interferir con peticiones de otros dominios.
----------------------------------------------------
*/

if (requestURL.origin !== self.location.origin) {

    return;

}


/*
----------------------------------------------------
Navegación / HTML
----------------------------------------------------
*/

if (event.request.mode === "navigate") {

    event.respondWith(

        fetch(event.request)
            .then(function (networkResponse) {

                if (networkResponse && networkResponse.ok) {

                    const responseClone =
                        networkResponse.clone();

                    caches.open(CACHE_NAME)
                        .then(function (cache) {

                            cache.put(
                                "./index.html",
                                responseClone
                            );

                        });

                }

                return networkResponse;

            })
            .catch(function () {

                return caches.match("./index.html")
                    .then(function (cachedResponse) {

                        if (cachedResponse) {

                            return cachedResponse;

                        }

                        return new Response(

                            "<!DOCTYPE html>" +
                            "<html lang='es'>" +
                            "<head>" +
                            "<meta charset='UTF-8'>" +
                            "<meta name='viewport' content='width=device-width,initial-scale=1'>" +
                            "<title>Centinela Code</title>" +
                            "</head>" +
                            "<body>" +
                            "<h1>Centinela Code</h1>" +
                            "<p>La aplicación no está disponible sin conexión.</p>" +
                            "</body>" +
                            "</html>",

                            {
                                headers: {
                                    "Content-Type": "text/html; charset=utf-8"
                                }
                            }

                        );

                    });

            })

    );

    return;

}


/*
----------------------------------------------------
Archivos locales de la aplicación
----------------------------------------------------
*/

event.respondWith(

    fetch(event.request)
        .then(function (networkResponse) {

            if (
                networkResponse &&
                networkResponse.ok
            ) {

                const responseClone =
                    networkResponse.clone();

                caches.open(CACHE_NAME)
                    .then(function (cache) {

                        cache.put(
                            event.request,
                            responseClone
                        );

                    });

            }

            return networkResponse;

        })
        .catch(function () {

            return caches.match(event.request)
                .then(function (cachedResponse) {

                    if (cachedResponse) {

                        return cachedResponse;

                    }

                    return new Response(

                        "Recurso no disponible sin conexión.",

                        {
                            status: 503,
                            statusText: "Offline",
                            headers: {
                                "Content-Type": "text/plain; charset=utf-8"
                            }
                        }

                    );

                });

        })

);
});
/*
MENSAJES DESDE APP.JS
*/
/ Permite que app.js pueda ordenar al Service Worker que se active inmediatamente. /
self.addEventListener(“message”, function (event) {
if (!event.data) {

    return;

}


/*
----------------------------------------------------
Saltar espera
----------------------------------------------------
*/

if (event.data.type === "SKIP_WAITING") {

    self.skipWaiting();

    return;

}


/*
----------------------------------------------------
Borrar todas las cachés
----------------------------------------------------
*/

if (event.data.type === "CLEAR_CACHE") {

    event.waitUntil(

        caches.keys()
            .then(function (keys) {

                return Promise.all(

                    keys.map(function (key) {

                        return caches.delete(key);

                    })

                );

            })

    );

    return;

}


/*
----------------------------------------------------
Comprobar versión
----------------------------------------------------
*/

if (event.data.type === "GET_VERSION") {

    if (event.source) {

        event.source.postMessage({

            type: "CENTINELA_SW_VERSION",

            version: CACHE_NAME

        });

    }

}
});
/*
FIN SERVICE WORKER CENTINELA CODE 4.0.0 ======================================================== */
