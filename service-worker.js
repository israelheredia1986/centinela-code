/* ============================================================
   CENTINELA CODE — SERVICE WORKER V40
   Constitución Española + corpus normativo + buscadores PRO.
   FIX: cargar de forma garantizada la pestaña y el articulado.
   ============================================================ */
const CACHE_NAME="centinela-code-v40-constitucion-guaranteed";
const ARCHIVOS=[
  "./","./index.html","./style.css","./style-modern.css","./style-modern-v2.css","./style-modern-v3.css","./style-neon.css",
  "./visual-enhancements.js?v=20260904-search-v2","./app.js","./centinela-infracciones-ui.js?v=20260904-infracciones-v1","./ia.js","./ia-robust.js?v=20260904-ia-v1","./matriculas.js",
  "./buscadores.js?v=20260904-constitucion-v9","./buscador-pro.js?v=20260904-search-v5","./bloque1-juridico.js?v=20260904-bloque1-v1","./constitucion-completa.js?v=20260904-constitucion-v3","./constitucion-tab-fix.js?v=20260904-constitucion-tab-fix-v2","./manifest.json",
  "./data/lopsc.json","./data/infracciones.json","./data/contrabando.json","./data/infracciones_trafico.json","./data/infracciones_vmp_bicicletas.json","./data/ordenanzas.json","./data/codigo_penal.json",
  "./data/normativa_menores.json","./data/normativa_violencia_genero.json","./data/normativa_animales.json","./data/normativa_trafico.json","./data/normativa_vmp_bicicletas.json",
  "./data/ley_2_86.json","./data/lecrim.json","./data/extranjeria.json","./data/seguridad_privada.json","./data/espectaculos_publicos.json",
  "./data/comercio_ambulante.json","./data/propiedad_industrial_falsificaciones.json","./data/aforo_hosteleria_eventos.json","./data/medio_ambiente_ruidos.json","./data/reglamento_armas.json","./data/policias_locales_andalucia.json",
  "./data/ley_39_2015.json","./data/ley_7_1985.json","./data/ley_5_2010_andalucia.json","./data/bloque1_juridico.json","./data/infracciones_bloque1.json"
];

function prepararHtml(response){
  return response;
}

self.addEventListener('install',event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(ARCHIVOS).catch(()=>{})));
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k.startsWith('centinela-code-')&&k!==CACHE_NAME).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  event.respondWith((async()=>{
    const url=new URL(req.url);
    const same=url.origin===self.location.origin;
    const nav=same&&(req.mode==='navigate'||url.pathname.endsWith('/index.html'));
    try{
      const response=await fetch(req,{cache:nav?'no-cache':'default'});
      if(same){caches.open(CACHE_NAME).then(c=>c.put(req,response.clone())).catch(()=>{});}
      return response;
    }catch(e){
      let cached=await caches.match(req);
      if(!cached&&same)cached=await caches.match('./index.html');
      return cached||new Response('Sin conexión',{status:503,headers:{'Content-Type':'text/plain;charset=utf-8'}});
    }
  })());
});
