/* =========================================================
   CENTINELA CODE — Service Worker
   Estrategia: cache local para la app y datos, con fallback
   de red para recursos que aún no estén almacenados.
========================================================= */

"use strict";

const CACHE_NAME = "centinela-code-v1-3-0";

const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./favicon.ico",
  "./icon-16.png",
  "./icon-32.png",
  "./icon-180.png",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-192.png",
  "./icon-maskable-512.png"
];

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

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll([...APP_SHELL, ...DATA_FILES]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type === "opaque") {
            return response;
          }

          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {});
          return response;
        })
        .catch(() => {
          if (request.mode === "navigate") {
            return caches.match("./index.html");
          }
          return Response.error();
        });
    })
  );
});
