/* =========================================================
   CENTINELA CODE — SERVICE WORKER
   Caché de la app (shell + datos normativos) para uso offline.
   ========================================================= */

const CACHE_VERSION = "20260830";
const CACHE_NAME = `centinela-code-${CACHE_VERSION}`;

/* Archivos del "app shell": lo mínimo para que la app arranque
   y se pueda usar sin conexión. */
const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css?v=20260830",
  "./app.js?v=20260830",
  "./manifest.json",
  "./favicon.ico",
  "./icon-16.png",
  "./icon-32.png",
  "./icon-180.png",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-192.png",
  "./icon-maskable-512.png",
  "./logo-centinela.png"
];

/* Ficheros de normativa: se cachean aparte para que la consulta
   funcione sin conexión incluso si alguno falla al descargar. */
const DATA_FILES = [
  "./data/codigo_penal.json",
  "./data/infracciones.json",
  "./data/infracciones_trafico.json",
  "./data/lopsc.json",
  "./data/normativa_animales.json",
  "./data/normativa_menores.json",
  "./data/normativa_trafico.json",
  "./data/normativa_violencia_genero.json",
  "./data/ordenanzas.json"
];

/* =========================================================
   INSTALL — precachea el app shell y los datos
   ========================================================= */
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      // El app shell es crítico: si falla, la instalación falla.
      await cache.addAll(APP_SHELL);

      // Los datos se cachean uno a uno para que un solo fichero
      // roto no impida instalar el resto.
      await Promise.all(
        DATA_FILES.map(async (url) => {
          try {
            const response = await fetch(url, { cache: "no-store" });
            if (response.ok) {
              await cache.put(url, response);
            }
          } catch (error) {
            console.warn("Centinela Code SW: no se pudo precachear", url, error);
          }
        })
      );

      await self.skipWaiting();
    })()
  );
});

/* =========================================================
   ACTIVATE — limpia cachés de versiones antiguas
   ========================================================= */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const nombresCache = await caches.keys();
      await Promise.all(
        nombresCache
          .filter((nombre) => nombre.startsWith("centinela-code-") && nombre !== CACHE_NAME)
          .map((nombre) => caches.delete(nombre))
      );
      await self.clients.claim();
    })()
  );
});

/* =========================================================
   FETCH
   - Navegación (HTML): red primero, con la caché como respaldo
     offline. Así siempre se sirve la versión más reciente
     cuando hay conexión.
   - Resto de recursos same-origin (css, js, iconos, json):
     caché primero, y se actualiza en segundo plano
     (stale-while-revalidate) para no bloquear la respuesta.
   ========================================================= */
self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const respuestaRed = await fetch(request);
          const cache = await caches.open(CACHE_NAME);
          cache.put("./index.html", respuestaRed.clone());
          return respuestaRed;
        } catch (error) {
          const cache = await caches.open(CACHE_NAME);
          const respuestaCache = await cache.match("./index.html");
          return respuestaCache || Response.error();
        }
      })()
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const respuestaCache = await cache.match(request);

      const actualizarEnSegundoPlano = fetch(request)
        .then((respuestaRed) => {
          if (respuestaRed && respuestaRed.ok) {
            cache.put(request, respuestaRed.clone());
          }
          return respuestaRed;
        })
        .catch(() => null);

      return respuestaCache || (await actualizarEnSegundoPlano) || Response.error();
    })()
  );
});
