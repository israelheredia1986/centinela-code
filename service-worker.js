/* ============================================================
   CENTINELA CODE — SERVICE WORKER V29
   Buscador PRO + normativa VMP, patinetes y bicicletas eléctricas.
   ============================================================ */
const CACHE_NAME="centinela-code-v29-vmp-bicicletas";
const ARCHIVOS=[
  "./","./index.html","./style.css","./style-modern.css","./style-modern-v2.css","./style-modern-v3.css","./style-neon.css",
  "./visual-enhancements.js?v=20260904-search-v2","./app.js","./ia.js","./ia-robust.js?v=20260904-ia-v1","./matriculas.js",
  "./buscadores.js?v=20260904-search-v4","./buscador-pro.js?v=20260904-search-v5","./manifest.json",
  "./data/lopsc.json","./data/infracciones.json","./data/infracciones_trafico.json","./data/infracciones_vmp_bicicletas.json","./data/ordenanzas.json","./data/codigo_penal.json",
  "./data/normativa_menores.json","./data/normativa_violencia_genero.json","./data/normativa_animales.json","./data/normativa_trafico.json","./data/normativa_vmp_bicicletas.json",
  "./data/ley_2_86.json","./data/lecrim.json","./data/extranjeria.json","./data/seguridad_privada.json","./data/espectaculos_publicos.json",
  "./data/comercio_ambulante.json","./data/propiedad_industrial_falsificaciones.json","./data/aforo_hosteleria_eventos.json","./data/medio_ambiente_ruidos.json","./data/reglamento_armas.json","./data/policias_locales_andalucia.json",
  "./data/ley_39_2015.json","./data/ley_7_1985.json","./data/ley_5_2010_andalucia.json"
];

async function prepararHtml(response){
  if(!response||!response.ok)return response;
  try{
    let html=await response.text();
    const replaceScript=(source,name,version)=>{
      const re=new RegExp('<script[^>]*'+name.replace('.','\\.')+'[^>]*><\\/script>','i');
      const tag='<script defer src="./'+name+version+'"></script>';
      return re.test(source)?source.replace(re,tag):source.includes('</body>')?source.replace('</body>',tag+'</body>'):source+tag;
    };
    const replaceCss=(source,name)=>{
      const re=new RegExp('<link[^>]*'+name.replace('.','\\.')+'[^>]*>','i');
      const tag='<link rel="stylesheet" href="./'+name+'">';
      return re.test(source)?source.replace(re,tag):source.includes('</head>')?source.replace('</head>',tag+'</head>'):tag+source;
    };
    html=replaceCss(html,'style-modern.css?v=20260904-visual-v1');
    html=replaceCss(html,'style-modern-v2.css?v=20260904-visual-v2');
    html=replaceCss(html,'style-modern-v3.css?v=20260904-visual-v3');
    html=replaceCss(html,'style-neon.css?v=20260904-reference-final');
    html=replaceScript(html,'visual-enhancements.js','?v=20260904-search-v2');
    html=replaceScript(html,'buscadores.js','?v=20260904-search-v4');
    html=replaceScript(html,'ia-robust.js','?v=20260904-ia-v1');
    html=replaceScript(html,'buscador-pro.js','?v=20260904-search-v5');
    const headers=new Headers(response.headers);
    headers.set('Content-Type','text/html; charset=utf-8');
    return new Response(html,{status:response.status,statusText:response.statusText,headers});
  }catch(e){console.warn('Centinela SW HTML',e);return response;}
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
      let response=await fetch(req,{cache:nav?'no-cache':'default'});
      if(nav)response=await prepararHtml(response);
      if(same){caches.open(CACHE_NAME).then(c=>c.put(req,response.clone())).catch(()=>{});}
      return response;
    }catch(e){
      let cached=await caches.match(req);
      if(!cached&&same)cached=await caches.match('./index.html');
      if(nav&&cached)cached=await prepararHtml(cached);
      return cached||new Response('Sin conexión',{status:503,headers:{'Content-Type':'text/plain;charset=utf-8'}});
    }
  })());
});
