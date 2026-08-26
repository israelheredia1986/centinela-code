*/

const CACHE_NAME = "centinela-code-v5";

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

/* =====================================================
INSTALACIÓN
===================================================== */

self.addEventListener("install", function (event) {

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

/* =====================================================
ACTIVACIÓN
===================================================== */

self.addEventListener("activate", function (event) {

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

/* =====================================================
PETICIONES
===================================================== */

self.addEventListener("fetch", function (event) {

if (event.request.method !== "GET") {

return;

}

const requestURL = new URL(event.request.url);

/* -------------------------------------------------
No interceptar peticiones de otros dominios
------------------------------------------------- */

if (requestURL.origin !== self.location.origin) {

return;

}

/* -------------------------------------------------
NAVEGACIÓN / HTML
------------------------------------------------- */

if (event.request.mode === "navigate") {

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
"./index.html",
responseClone
);

})
.catch(function () {
/* La caché no debe bloquear la respuesta */
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
status: 503,
statusText: "Offline",
headers: {
"Content-Type":
"text/html; charset=utf-8"
}
}

);

});

})

);

return;

}

/* -------------------------------------------------
ARCHIVOS LOCALES
------------------------------------------------- */

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

})
.catch(function () {
/* La caché no debe bloquear la respuesta */
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
"Content-Type":
"text/plain; charset=utf-8"
}
}

);

});

})

);

});

/* =====================================================
MENSAJES DESDE APP.JS
===================================================== */

self.addEventListener("message", function (event) {

if (!event.data) {

return;

}

/* -------------------------------------------------
ACTIVAR INMEDIATAMENTE
------------------------------------------------- */

if (event.data.type === "SKIP_WAITING") {

self.skipWaiting();

return;

}

/* -------------------------------------------------
BORRAR TODAS LAS CACHÉS
------------------------------------------------- */

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

/* -------------------------------------------------
COMPROBAR VERSIÓN
------------------------------------------------- */

if (event.data.type === "GET_VERSION") {

if (event.source) {

event.source.postMessage({

type: "CENTINELA_SW_VERSION",

version: CACHE_NAME

});

}

}

});

/* =====================================================
FIN SERVICE WORKER CENTINELA CODE 5.0.0
===================================================== */
