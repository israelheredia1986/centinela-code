/*
=========================================================
CENTINELA CODE - SERVICE WORKER
Versión corregida 6.0
=========================================================
Objetivos:
- Evitar que un caché antiguo bloquee la aplicación.
- No usar cache.addAll() para archivos que puedan faltar.
- Intentar siempre red primero.
- Usar caché como respaldo cuando no haya conexión.
- Limpiar versiones antiguas automáticamente.
- Permitir actualización desde app.js mediante mensajes.
=========================================================
*/

"use strict";

const CACHE_NAME = "centinela-code-v6";

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

return Promise.all(
APP_FILES.map(function (url) {

return fetch(url, {
cache: "no-store"
})
.then(function (response) {

if (!response.ok) {
throw new Error(
"No se pudo cargar: " + url
);
}

return cache.put(url, response);
})
.catch(function (error) {

console.warn(
"Centinela Code: no se pudo precargar " +
url,
error
);

return null;
});

})
);

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
.then(function (keys) {

return Promise.all(

keys.map(function (key) {

if (
key.startsWith("centinela-code-") &&
key !== CACHE_NAME
) {

console.log(
"Centinela Code: eliminando caché antigua:",
key
);

return caches.delete(key);
}

return null;

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

const request = event.request;

if (request.method !== "GET") {
return;
}

const url = new URL(request.url);

/*
* Solo controlamos peticiones del mismo origen.
* No interferimos con webs externas, APIs, imágenes
* externas ni recursos de terceros.
*/

if (url.origin !== self.location.origin) {
return;
}

event.respondWith(

fetch(request)
.then(function (networkResponse) {

/*
* Guardamos una copia válida para poder
* trabajar posteriormente sin conexión.
*/

if (
networkResponse &&
networkResponse.ok
) {

const responseClone =
networkResponse.clone();

caches.open(CACHE_NAME)
.then(function (cache) {

cache.put(
request,
responseClone
);

})
.catch(function (error) {

console.warn(
"Centinela Code: error guardando caché.",
error
);

});

}

return networkResponse;

})
.catch(function () {

/*
* Si no hay conexión, buscamos primero la
* petición exacta en la caché.
*/

return caches.match(request)
.then(function (cachedResponse) {

if (cachedResponse) {
return cachedResponse;
}

/*
* Para navegación, intentamos devolver
* index.html como respaldo.
*/

if (
request.mode === "navigate"
) {

return caches.match(
"./index.html"
)
.then(function (indexResponse) {

if (indexResponse) {
return indexResponse;
}

return new Response(
`
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport"
content="width=device-width, initial-scale=1.0">
<title>Centinela Code</title>
</head>
<body>
<h1>Centinela Code</h1>
<p>
La aplicación está sin conexión
y todavía no existe una copia
local disponible de esta página.
</p>
</body>
</html>
`,
{
status: 503,
headers: {
"Content-Type":
"text/html; charset=utf-8"
}
}
);

});

}

/*
* Para recursos que no existen en caché,
* devolvemos un 503 en lugar de lanzar
* un error que pueda romper la aplicación.
*/

return new Response(
"Recurso no disponible sin conexión.",
{
status: 503,
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

/*
* Activar inmediatamente una nueva versión.
*/

if (event.data.type === "SKIP_WAITING") {

self.skipWaiting();

return;
}


/*
* Borrar completamente la caché de Centinela Code.
*/

if (event.data.type === "CLEAR_CACHE") {

event.waitUntil(

caches.keys()
.then(function (keys) {

return Promise.all(

keys.map(function (key) {

if (
key.startsWith(
"centinela-code-"
)
) {

return caches.delete(key);

}

return null;

})

);

})

);

return;
}


/*
* Pedir al Service Worker su versión actual.
*/

if (event.data.type === "GET_VERSION") {

if (event.source) {

event.source.postMessage({

type: "CENTINELA_SW_VERSION",

version: CACHE_NAME

});

}

return;
}

});


/* =====================================================
AVISAR A LAS PÁGINAS ABIERTAS DE UNA NUEVA VERSIÓN
===================================================== */

async function avisarClientesNuevaVersion() {

const clientes = await self.clients.matchAll({
type: "window"
});

clientes.forEach(function (cliente) {

cliente.postMessage({

type: "CENTINELA_SW_ACTUALIZADO",

version: CACHE_NAME

});

});

}


/* =====================================================
FIN SERVICE WORKER
===================================================== */
