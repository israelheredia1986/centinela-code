/* ============================================================
   CENTINELA CODE — SERVICE WORKER V43
   Caché coherente con el cliente IA único.
   ============================================================ */
const CACHE_NAME="centinela-code-v43-ia-hardening";
const ARCHIVOS=[
  "./","./index.html","./style.css","./style-modern.css","./style-modern-v2.css","./style-modern-v3.css","./style-neon.css",
  "./visual-enhancements.js?v=20260904-search-v2","./app.js","./ia.js","./ia.js?v=20260905-ia-client-v2","./matriculas.js",
  "./buscadores.js?v=20260904-constitucion-v9","./buscador-pro.js?v=20260904-search-v5","./bloque1-juridico.js?v=20260904-bloque1-v1","./constitucion-completa.js?v=20260904-constitucion-v4","./constitucion-tab-fix.js?v=20260904-constitucion-tab-fix-v2","./manifest.json",
  "./data/lopsc.json","./data/infracciones.json","./data/contrabando.json","./data/infracciones_trafico.json","./data/infracciones_vmp_bicicletas.json","./data/ordenanzas.json","./data/codigo_penal.json",
  "./data/normativa_menores.json","./data/normativa_violencia_genero.json","./data/normativa_animales.json","./data/normativa_trafico.json","./data/normativa_vmp_bicicletas.json",
  "./data/ley_2_86.json","./data/lecrim.json","./data/extranjeria.json","./data/seguridad_privada.json","./data/espectaculos_publicos.json",
  "./data/comercio_ambulante.json","./data/propiedad_industrial_falsificaciones.json","./data/aforo_hosteleria_eventos.json","./data/medio_ambiente_ruidos.json","./data/reglamento_armas.json","./data/policias_locales_andalucia.json",
  "./data/ley_39_2015.json","./data/ley_7_1985.json","./data/ley_5_2010_andalucia.json","./data/bloque1_juridico.json","./data/infracciones_bloque1.json",
  "./data/rd-1428-2003.json","./data/rd-2822-1998.json","./data/rd-818-2009.json"
];

const CONSTITUCION_BOOT=`<script>(function(){
(function(){
  'use strict';
  var TAB='centinela-tab-constitucion-runtime',PANEL='centinela-constitucion-completa';
  function css(){
    if(document.getElementById('centinela-runtime-ce-css'))return;
    var s=document.createElement('style');s.id='centinela-runtime-ce-css';s.textContent='#'+TAB+'{display:flex!important;align-items:center;gap:10px;width:100%;box-sizing:border-box;margin:10px 0 14px;padding:13px 14px;border:1px solid rgba(62,185,255,.78);border-radius:15px;background:linear-gradient(135deg,#073653,#061521);color:#f5fcff!important;cursor:pointer;position:relative;z-index:9999;box-shadow:0 8px 26px rgba(0,0,0,.4),inset 0 0 20px rgba(0,150,255,.1);font:900 13px/1.2 system-ui,-apple-system,Segoe UI,sans-serif;text-align:left}#'+TAB+' .cex-i{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;background:#0b84df;font-size:18px;flex:0 0 30px}#'+TAB+' .cex-m{display:flex;flex-direction:column;min-width:0}#'+TAB+' .cex-m strong{font-size:13px;color:#fff}#'+TAB+' .cex-m small{margin-top:3px;color:#b8d8ec;font-size:9px;font-weight:700}#'+TAB+' .cex-a{margin-left:auto;font-size:22px;color:#62c9ff}';document.head.appendChild(s);
  }
  function host(){return document.getElementById('section-normativa')||document.querySelector('.app-section[id*="normativa"]')||document.querySelector('.main-content');}
  function loadScript(src){if(document.querySelector('script[data-ce-runtime="'+src+'"]'))return;var s=document.createElement('script');s.src=src;s.defer=true;s.dataset.ceRuntime=src;document.head.appendChild(s);}
  function install(){var h=host();if(!h)return;css();var t=document.getElementById(TAB);if(!t){t=document.createElement('button');t.id=TAB;t.type='button';t.innerHTML='<span class="cex-i">🇪🇸</span><span class="cex-m"><strong>Constitución Española</strong><small>Texto íntegro · 169 artículos · actualizado · BOE</small></span><span class="cex-a">›</span>';h.insertBefore(t,h.firstElementChild||null);t.addEventListener('click',function(){var p=document.getElementById(PANEL);if(p)p.scrollIntoView({behavior:'smooth',block:'start'});else loadScript('./constitucion-completa.js?v=20260904-constitucion-v4');});}loadScript('./constitucion-completa.js?v=20260904-constitucion-v4');}
  function boot(){install();var n=0,i=setInterval(function(){install();if(++n>40)clearInterval(i)},400);if(document.body)new MutationObserver(install).observe(document.body,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
})();</script>`;

async function prepararHtml(response){
  if(!response||!response.ok)return response;
  try{
    const html=await response.text();
    if(html.includes('centinela-tab-constitucion-runtime'))return new Response(html,{status:response.status,statusText:response.statusText,headers:response.headers});
    const out=html.includes('</body>')?html.replace('</body>',CONSTITUCION_BOOT+'</body>'):html+CONSTITUCION_BOOT;
    const headers=new Headers(response.headers);headers.set('Content-Type','text/html; charset=utf-8');
    return new Response(out,{status:response.status,statusText:response.statusText,headers});
  }catch(e){console.warn('Centinela SW HTML',e);return response;}
}

self.addEventListener('install',event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE_NAME).then(async cache=>{const results=await Promise.allSettled(ARCHIVOS.map(url=>cache.add(url)));const failed=results.filter(r=>r.status==='rejected');if(failed.length)console.warn('Centinela SW: recursos no precargados',failed.length);}));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('centinela-code-')&&k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{const req=event.request;if(req.method!=='GET')return;event.respondWith((async()=>{const url=new URL(req.url);const same=url.origin===self.location.origin;const nav=same&&(req.mode==='navigate'||url.pathname.endsWith('/index.html'));try{let response=await fetch(req,{cache:nav?'no-cache':'default'});if(nav)response=await prepararHtml(response);if(same)caches.open(CACHE_NAME).then(c=>c.put(req,response.clone())).catch(()=>{});return response;}catch(e){let cached=await caches.match(req);if(!cached&&same)cached=await caches.match('./index.html');if(nav&&cached)cached=await prepararHtml(cached);return cached||new Response('Sin conexión',{status:503,headers:{'Content-Type':'text/plain;charset=utf-8'}});}})());});
