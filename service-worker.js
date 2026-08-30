const CACHE_VERSION = “20260901-premium”; const CACHE_NAME =
centinela-code-${CACHE_VERSION};

const APP_SHELL = [ “./”, “./index.html”,
“./style.css?v=20260901-premium”, “./app.js?v=20260901-premium”,
“./manifest.json”, “./favicon.ico”, “./icon-16.png”, “./icon-32.png”,
“./icon-180.png”, “./icon-192.png”, “./icon-512.png”,
“./icon-maskable-192.png”, “./icon-maskable-512.png”]; const DATA_FILES
= [
“./data/codigo_penal.json”,“./data/infracciones.json”,“./data/infracciones_trafico.json”,
“./data/lopsc.json”,“./data/normativa_animales.json”,“./data/normativa_menores.json”,
“./data/normativa_trafico.json”,“./data/normativa_violencia_genero.json”,“./data/ordenanzas.json”];
self.addEventListener(“install”,event=>{event.waitUntil((async()=>{const
c=await caches.open(CACHE_NAME);for(const url of APP_SHELL){try{const
r=await fetch(url,{cache:“no-store”});if(r.ok)await
c.put(url,r);}catch(e){console.warn(“SW shell”,url,e)}}for(const url of
DATA_FILES){try{const r=await
fetch(url,{cache:“no-store”});if(r.ok)await
c.put(url,r);}catch(e){console.warn(“SW data”,url,e)}}await
self.skipWaiting()})())});
self.addEventListener(“activate”,event=>{event.waitUntil((async()=>{for(const
k of await caches.keys())if(k!==CACHE_NAME)await caches.delete(k);await
self.clients.claim()})())}); self.addEventListener(“fetch”,event=>{const
req=event.request;if(req.method!==“GET”)return;event.respondWith((async()=>{try{const
net=await fetch(req,{cache:“no-store”});if(net&&net.ok){const c=await
caches.open(CACHE_NAME);c.put(req,net.clone()).catch(()=>{});}return
net}catch(e){const cached=await caches.match(req);if(cached)return
cached;throw e}})())});
