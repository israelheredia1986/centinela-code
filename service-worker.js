const CACHE_NAME = "centinela-code-v7";

const ARCHIVOS = [
 "./",
 "./index.html",
 "./style.css",
 "./app.js",
 "./buscadores.js",
 "./manifest.json",
 "./data/lopsc.json",
 "./data/infracciones.json",
 "./data/infracciones_trafico.json",
 "./data/ordenanzas.json",
 "./data/codigo_penal.json",
 "./data/normativa_menores.json",
 "./data/normativa_violencia_genero.json",
 "./data/normativa_animales.json",
 "./data/normativa_trafico.json",
 "./data/ley_2_86.json",
 "./data/lecrim.json",
 "./data/extranjeria.json",
 "./data/seguridad_privada.json",
 "./data/espectaculos_publicos.json",
 "./data/medio_ambiente_ruidos.json",
 "./data/reglamento_armas.json",
 "./data/policias_locales_andalucia.json",
 "./data/ley_39_2015.json",
 "./data/ley_7_1985.json",
 "./data/ley_5_2010_andalucia.json"
];

self.addEventListener("install", event => {
  console.log("Centinela SW instalado v7");
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ARCHIVOS))
  );
});

self.addEventListener("activate", event => {
  console.log("Centinela SW activo v7");
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  event.respondWith(
    fetch(request)
      .then(response => {
        const url = new URL(request.url);
        if (url.origin === self.location.origin) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy)).catch(() => {});
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
