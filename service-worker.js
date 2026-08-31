// ============================================================ //
Centinela Code - Service Worker fusionado // Mantiene PWA offline y
fuerza actualización de archivos //
============================================================

const CACHE_NAME = “centinela-code-v2”;

const FILES_TO_CACHE = [ “./”, “./index.html”, “./style.css”,
“./app.js”, “./manifest.json”,

“./data/lopsc.json”, “./data/infracciones.json”,
“./data/ordenanzas.json” ];

// Instalación self.addEventListener(“install”, event => {
console.log(“Service Worker instalado”);

self.skipWaiting();

event.waitUntil( caches.open(CACHE_NAME) .then(cache => { return
cache.addAll(FILES_TO_CACHE); }) ); });

// Activación y limpieza de cachés antiguas
self.addEventListener(“activate”, event => {

console.log(“Service Worker activo”);

event.waitUntil(

    caches.keys()
      .then(cacheNames => {

        return Promise.all(

          cacheNames
            .filter(cache => cache !== CACHE_NAME)
            .map(cache => caches.delete(cache))

        );

      })
      .then(() => self.clients.claim())

);

});

// Gestión de peticiones self.addEventListener(“fetch”, event => {

event.respondWith(

    caches.match(event.request)
      .then(response => {

        if (response) {
          return response;
        }

        return fetch(event.request);

      })

);

});
