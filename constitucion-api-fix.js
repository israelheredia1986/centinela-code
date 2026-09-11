/* ============================================================
   CENTINELA CODE — CONSTITUCIÓN · REPARACIÓN DE FUENTE
   Evita las peticiones 403 a api.github.com y mantiene la misma
   interfaz de los módulos de Constitución existentes.
   ============================================================ */
(function(){
  'use strict';
  if(window.__centinelaConstitucionApiFix)return;
  window.__centinelaConstitucionApiFix=true;

  const API='https://api.github.com/repos/legalize-dev/legalize-es/contents/es/BOE-A-1978-31229.md';
  const RAW='https://raw.githubusercontent.com/legalize-dev/legalize-es/main/es/BOE-A-1978-31229.md';
  const originalFetch=window.fetch.bind(window);

  function base64Utf8(text){
    const bytes=new TextEncoder().encode(text);
    let binary='';
    const chunk=0x8000;
    for(let i=0;i<bytes.length;i+=chunk){
      binary+=String.fromCharCode(...bytes.subarray(i,i+chunk));
    }
    return btoa(binary);
  }

  window.fetch=async function(input,init){
    const url=typeof input==='string'?input:(input&&input.url)||'';
    if(url===API || url.startsWith(API+'?')){
      try{
        const raw=await originalFetch(RAW+'?v=20260911-api-fix',{cache:'no-store',mode:'cors'});
        if(!raw.ok)throw new Error('RAW HTTP '+raw.status);
        const text=await raw.text();
        return new Response(JSON.stringify({
          name:'BOE-A-1978-31229.md',
          path:'es/BOE-A-1978-31229.md',
          encoding:'base64',
          content:base64Utf8(text)
        }),{
          status:200,
          headers:{'Content-Type':'application/json','X-Centinela-Source':'raw-fallback'}
        });
      }catch(error){
        console.warn('Centinela Constitución: no se pudo usar la fuente RAW.',error);
        return new Response(JSON.stringify({message:'Constitución no disponible temporalmente'}),{
          status:503,
          headers:{'Content-Type':'application/json'}
        });
      }
    }
    return originalFetch(input,init);
  };

  console.info('Centinela Constitución: fuente API protegida — RAW como respaldo sin 403.');
})();
