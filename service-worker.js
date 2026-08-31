const CACHE_NAME = "centinela-code-v4";

const ARCHIVOS = [
 "./",
 "./index.html",
 "./style.css",
 "./app.js",
 "./manifest.json",

 "./data/lopsc.json",
 "./data/infracciones.json",
 "./data/ordenanzas.json"
];


self.addEventListener("install", event => {

 console.log("Centinela SW instalado");

 self.skipWaiting();

 event.waitUntil(
  caches.open(CACHE_NAME)
  .then(cache => cache.addAll(ARCHIVOS))
 );

});


self.addEventListener("activate", event => {

 console.log("Centinela SW activo");

 event.waitUntil(

  caches.keys()
  .then(keys =>
   Promise.all(
    keys
    .filter(k => k !== CACHE_NAME)
    .map(k => caches.delete(k))
   )
  )
  .then(() => self.clients.claim())

 );

});


self.addEventListener("fetch", event => {

 event.respondWith(

  fetch(event.request)
  .catch(() => caches.match(event.request))

 );

});
