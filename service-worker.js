const CACHE_NAME = "centinela-code-v26-comercio-ambulante";
const ARCHIVOS = ["./","./index.html","./style.css","./style-modern.css","./style-modern-v2.css","./style-modern-v3.css","./style-neon.css","./visual-enhancements.js?v=20260904-search-v2","./app.js","./ia.js","./ia-robust.js?v=20260904-ia-v1","./matriculas.js","./buscadores.js?v=20260904-comercio-v1","./manifest.json","./data/lopsc.json","./data/infracciones.json","./data/infracciones_trafico.json","./data/ordenanzas.json","./data/codigo_penal.json","./data/normativa_menores.json","./data/normativa_violencia_genero.json","./data/normativa_animales.json","./data/normativa_trafico.json","./data/ley_2_86.json","./data/lecrim.json","./data/extranjeria.json","./data/seguridad_privada.json","./data/espectaculos_publicos.json","./data/comercio_ambulante.json","./data/medio_ambiente_ruidos.json","./data/reglamento_armas.json","./data/policias_locales_andalucia.json","./data/ley_39_2015.json","./data/ley_7_1985.json","./data/ley_5_2010_andalucia.json"];

async function prepararHtml(response){
  if(!response||!response.ok)return response;
  try{
    const html=await response.text();
    let modificado=html;
    if(!modificado.includes("style-modern.css")){
      const css='<link rel="stylesheet" href="./style-modern.css?v=20260904-visual-v1">';
      modificado=modificado.includes("</head>")?modificado.replace("</head>",`${css}</head>`):`${css}${modificado}`;
    }
    if(!modificado.includes("style-modern-v2.css")){
      const css='<link rel="stylesheet" href="./style-modern-v2.css?v=20260904-visual-v2">';
      modificado=modificado.includes("</head>")?modificado.replace("</head>",`${css}</head>`):`${css}${modificado}`;
    }
    if(!modificado.includes("style-modern-v3.css")){
      const css='<link rel="stylesheet" href="./style-modern-v3.css?v=20260904-visual-v3">';
      modificado=modificado.includes("</head>")?modificado.replace("</head>",`${css}</head>`):`${css}${modificado}`;
    }
    const neon='<link rel="stylesheet" href="./style-neon.css?v=20260904-reference-final">';
    modificado=modificado.includes("style-neon.css")?modificado.replace(/<link[^>]*style-neon\\.css[^>]*>/,neon):modificado.includes("</head>")?modificado.replace("</head>",`${neon}</head>`):`${neon}${modificado}`;
    const js='<script defer src="./visual-enhancements.js?v=20260904-search-v2"></script>';
    if(!modificado.includes("visual-enhancements.js")){
      modificado=modificado.includes("</body>")?modificado.replace("</body>",`${js}</body>`):`${modificado}${js}`;
    }else{
      modificado=modificado.replace(/<script[^>]*visual-enhancements\\.js[^>]*><\\/script>/,js);
    }
    const js2='<script defer src="./buscadores.js?v=20260904-comercio-v1"></script>';
    if(!modificado.includes("buscadores.js")){
      modificado=modificado.includes("</body>")?modificado.replace("</body>",`${js2}</body>`):`${modificado}${js2}`;
    }else{
      modificado=modificado.replace(/<script[^>]*buscadores\\.js[^>]*><\\/script>/,js2);
    }
    const js3='<script defer src="./ia-robust.js?v=20260904-ia-v1"></script>';
    if(!modificado.includes("ia-robust.js")){
      modificado=modificado.includes("</body>")?modificado.replace("</body>",`${js3}</body>`):`${modificado}${js3}`;
    }else{
      modificado=modificado.replace(/<script[^>]*ia-robust\\.js[^>]*><\\/script>/,js3);
    }
    const headers=new Headers(response.headers);headers.set("Content-Type","text/html; charset=utf-8");
    return new Response(modificado,{status:response.status,statusText:response.statusText,headers});
  }catch(_){return response}
}

self.addEventListener("install",event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(ARCHIVOS)))});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",event=>{
  const request=event.request;if(request.method!=="GET")return;
  event.respondWith((async()=>{
    const url=new URL(request.url);const esInicio=url.origin===self.location.origin&&(request.mode==="navigate"||url.pathname.endsWith("/index.html"));
    try{let response=await fetch(request);if(esInicio)response=await prepararHtml(response);if(url.origin===self.location.origin)caches.open(CACHE_NAME).then(cache=>cache.put(request,response.clone())).catch(()=>{});return response}
    catch(_){let cached=await caches.match(request);if(!cached&&esInicio)cached=await caches.match("./index.html");if(esInicio&&cached)cached=await prepararHtml(cached);return cached||new Response("Sin conexión",{status:503})}
  })());
});
