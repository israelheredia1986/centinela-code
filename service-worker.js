/*
============================================================
CENTINELA CODE
service-worker.js
============================================================

Estrategia de caché:
- App shell (HTML, CSS, JS, manifest, iconos): cache-first,
  con actualización en segundo plano (stale-while-revalidate).
- Datos de normativa (./data/*.json): network-first, con
  fallback a caché si no hay conexión. Así, si el BOE/BOJA
  se actualiza, el agente recibe la versión más reciente en
  cuanto haya red, pero la app sigue funcionando sin conexión
  con el último dato conocido.
- Todo lo demás (Supabase, Nominatim, CDNs externos): no se
  cachea, se deja pasar directo a la red.

Recuerda subir la versión de CACHE_VERSION cada vez que
cambies el listado de ASSETS o el comportamiento del worker,
para forzar la renovación de la caché en los dispositivos.
============================================================
*/

"use strict";

const CACHE_VERSION = "v1";
const CACHE_ESTATICA = `centinela-estatica-${CACHE_VERSION}`;
const CACHE_DATOS = `centinela-datos-${CACHE_VERSION}`;

const ASSETS_APP_SHELL = [
"./",
"./index.html",
"./style.css?v=20260827",
"./app.js?v=20260827",
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

const ASSETS_DATOS = [
"./data/infracciones.json",
"./data/infracciones_trafico.json",
"./data/lopsc.json",
"./data/codigo_penal.json",
"./data/normativa_menores.json",
"./data/normativa_violencia_genero.json",
"./data/ordenanzas.json",
"./data/normativa_animales.json",
"./data/normativa_trafico.json"
];

/* =========================================================
INSTALACIÓN
========================================================= */

self.addEventListener("install", (evento) => {

evento.waitUntil(
(async () => {

const cacheEstatica = await caches.open(CACHE_ESTATICA);

try {
await cacheEstatica.addAll(ASSETS_APP_SHELL);
} catch (error) {
console.warn(
"Centinela SW: no se pudo precachear algún recurso del app shell.",
error
);
}

const cacheDatos = await caches.open(CACHE_DATOS);

try {
await cacheDatos.addAll(ASSETS_DATOS);
} catch (error) {
console.warn(
"Centinela SW: no se pudo precachear alguna base de datos JSON.",
error
);
}

await self.skipWaiting();

})()
);

});

/* =========================================================
ACTIVACIÓN
========================================================= */

self.addEventListener("activate", (evento) => {

evento.waitUntil(
(async () => {

const cachesExistentes = await caches.keys();

await Promise.all(
cachesExistentes
.filter((nombre) => {
return (
nombre !== CACHE_ESTATICA &&
nombre !== CACHE_DATOS
);
})
.map((nombre) => caches.delete(nombre))
);

await self.clients.claim();

})()
);

});

/* =========================================================
UTILIDADES
========================================================= */

function esPeticionDatos(url) {
return url.pathname.includes("/data/") && url.pathname.endsWith(".json");
}

function esMismoOrigen(url) {
return url.origin === self.location.origin;
}

/* =========================================================
ESTRATEGIA: NETWORK-FIRST (datos de normativa)
========================================================= */

async function networkFirst(peticion) {

const cache = await caches.open(CACHE_DATOS);

try {

const respuestaRed = await fetch(peticion);

if (respuestaRed && respuestaRed.ok) {
cache.put(peticion, respuestaRed.clone());
}

return respuestaRed;

} catch (error) {

const respuestaCache = await cache.match(peticion);

if (respuestaCache) {
return respuestaCache;
}

throw error;

}

}

/* =========================================================
ESTRATEGIA: STALE-WHILE-REVALIDATE (app shell)
========================================================= */

async function staleWhileRevalidate(peticion) {

const cache = await caches.open(CACHE_ESTATICA);
const respuestaCache = await cache.match(peticion);

const actualizacionRed = fetch(peticion)
.then((respuestaRed) => {

if (respuestaRed && respuestaRed.ok) {
cache.put(peticion, respuestaRed.clone());
}

return respuestaRed;

})
.catch(() => null);

if (respuestaCache) {
evento_actualizacionRed_no_bloqueante(actualizacionRed);
return respuestaCache;
}

const respuestaRed = await actualizacionRed;

if (respuestaRed) {
return respuestaRed;
}

if (peticion.mode === "navigate") {
const indexCache = await cache.match("./index.html");
if (indexCache) {
return indexCache;
}
}

throw new Error("Centinela SW: sin caché ni red disponibles para " + peticion.url);

}

function evento_actualizacionRed_no_bloqueante(promesa) {
// La promesa se deja correr en segundo plano; los errores ya
// se controlan dentro de staleWhileRevalidate con el .catch.
promesa.catch(() => {});
}

/* =========================================================
INTERCEPTOR DE PETICIONES
========================================================= */

self.addEventListener("fetch", (evento) => {

const peticion = evento.request;

if (peticion.method !== "GET") {
return;
}

const url = new URL(peticion.url);

if (!esMismoOrigen(url)) {
return;
}

if (esPeticionDatos(url)) {
evento.respondWith(networkFirst(peticion));
return;
}

evento.respondWith(staleWhileRevalidate(peticion));

});

/* =========================================================
MENSAJES DESDE LA APP
========================================================= */

self.addEventListener("message", (evento) => {

if (evento.data === "SKIP_WAITING") {
self.skipWaiting();
}

});
