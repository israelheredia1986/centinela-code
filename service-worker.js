/* ============================================================
CENTINELA CODE — SERVICE WORKER
ACTUALIZACIÓN FORZADA DE CACHÉ
============================================================ */

const CACHE_VERSION = "centinela-code-v20260827-03";
const DATA_CACHE = `${CACHE_VERSION}-data`;

const APP_SHELL = [
"./",
"./index.html",
"./style.css",
"./app.js",
"./manifest.json"
];

self.addEventListener("install", event => {
self.skipWaiting();

event.waitUntil(
caches.open(CACHE_VERSION)
.then(cache =>
cache.addAll(APP_SHELL).catch(error =>
console.warn(
"Centinela Code: error cacheando archivos.",
error
)
)
)
);
});

self.addEventListener("activate", event => {
event.waitUntil(
(async () => {
const keys = await caches.keys();

await Promise.all(
keys
.filter(key =>
key.startsWith("centinela-code-") &&
key !== CACHE_VERSION &&
key !== DATA_CACHE
)
.map(key => caches.delete(key))
);

await self.clients.claim();

const clients =
await self.clients.matchAll({
type: "window",
includeUncontrolled: true
});

for (const client of clients) {
client.postMessage({
type: "CENTINELA_SW_UPDATED",
version: CACHE_VERSION
});
}
})()
);
});

self.addEventListener("fetch", event => {

const request = event.request;

if (request.method !== "GET") {
return;
}

const url = new URL(request.url);

if (url.origin !== self.location.origin) {
return;
}

const path = url.pathname.toLowerCase();

const mainFile =
path.endsWith("/") ||
path.endsWith("/index.html") ||
path.endsWith("/app.js") ||
path.endsWith("/style.css") ||
path.endsWith("/manifest.json");

if (mainFile) {
event.respondWith(
networkFirst(request)
);
return;
}

const dataFile =
path.endsWith("/infracciones.json") ||
path.endsWith("/lopsc.json");

if (dataFile) {
event.respondWith(
networkFirstData(request)
);
return;
}

event.respondWith(
cacheFirstWithNetworkUpdate(request)
);
});

async function networkFirst(request) {

const cache =
await caches.open(CACHE_VERSION);

try {

const response =
await fetch(
new Request(request, {
cache: "no-store"
})
);

if (response && response.ok) {
await cache.put(
request,
response.clone()
);
return response;
}

throw new Error("Respuesta HTTP no válida.");

} catch (error) {

const cached =
await cache.match(request);

if (cached) {
return cached;
}

if (request.mode === "navigate") {

const fallback =
await cache.match("./index.html");

if (fallback) {
return fallback;
}
}

return new Response(
"Centinela Code no está disponible.",
{
status: 503,
headers: {
"Content-Type":
"text/plain; charset=utf-8"
}
}
);
}
}

async function networkFirstData(request) {

const cache =
await caches.open(DATA_CACHE);

try {

const response =
await fetch(
new Request(request, {
cache: "no-store"
})
);

if (response && response.ok) {
await cache.put(
request,
response.clone()
);
return response;
}

throw new Error(
"No se pudieron actualizar los datos."
);

} catch (error) {

const cached =
await cache.match(request);

if (cached) {
return cached;
}

return new Response(
JSON.stringify({
error:
"Datos no disponibles sin conexión."
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

async function cacheFirstWithNetworkUpdate(request) {

const cache =
await caches.open(CACHE_VERSION);

const cached =
await cache.match(request);

const network =
fetch(
new Request(request, {
cache: "no-store"
})
)
.then(response => {

if (response && response.ok) {
cache.put(
request,
response.clone()
);
}

return response;

})
.catch(() => null);

if (cached) {
return cached;
}

const response =
await network;

if (response) {
return response;
}

return new Response(
"",
{ status: 503 }
);
}

self.addEventListener("message", event => {

if (!event.data) {
return;
}

if (
event.data.type ===
"SKIP_WAITING"
) {
self.skipWaiting();
}

if (
event.data.type ===
"CLEAR_CENTINELA_CACHE"
) {

event.waitUntil(
caches.keys()
.then(keys =>
Promise.all(
keys
.filter(key =>
key.startsWith(
"centinela-code-"
)
)
.map(key =>
caches.delete(key)
)
)
)
);
}
});

/* ============================================================
FIN SERVICE WORKER
============================================================ */
PASOS
1. GitHub → service-worker.js → Editar.
2. Borra TODO el contenido antiguo.
3. Copia TODO el código anterior desde el ODT.
4. Pégalo completo.
5. Commit changes.
6. Espera unos minutos.
7. Abre nuevamente Centinela Code.
