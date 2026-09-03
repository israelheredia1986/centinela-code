const CACHE_NAME = "centinela-code-v11";

const ARCHIVOS = [
 "./",
 "./index.html",
 "./style.css",
 "./app.js",
 "./ia.js",
 "./matriculas.js",
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

async function prepararHtml(response) {
  if (!response || !response.ok) return response;
  try {
    const html = await response.text();
    if (html.includes("buscadores.js")) {
      return new Response(html, {status: response.status, statusText: response.statusText, headers: response.headers});
    }
    const inyeccion = '<script defer src="./buscadores.js?v=20260903-consulta"></script>';
    const modificado = html.includes("</body>")
      ? html.replace("</body>", `${inyeccion}</body>`)
      : `${html}${inyeccion}`;
    const headers = new Headers(response.headers);
    headers.set("Content-Type", "text/html; charset=utf-8");
    return new Response(modificado, {status: response.status, statusText: response.statusText, headers});
  } catch (_) {
    return response;
  }
}

self.addEventListener("install", event => {
  console.log("Centinela SW instalado v11");
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ARCHIVOS)));
});

self.addEventListener("activate", event => {
  console.log("Centinela SW activo v11");
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  event.respondWith((async () => {
    const url = new URL(request.url);
    const esInicio = url.origin === self.location.origin &&
      (request.mode === "navigate" || url.pathname.endsWith("/index.html"));

    try {
      let response = await fetch(request);
      if (esInicio) response = await prepararHtml(response);

      if (url.origin === self.location.origin) {
        caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone())).catch(() => {});
      }
      return response;
    } catch (_) {
      let cached = await caches.match(request);
      if (!cached && esInicio) cached = await caches.match("./index.html");
      if (esInicio && cached) cached = await prepararHtml(cached);
      return cached || new Response("Sin conexión", {status: 503});
    }
  })());
});
