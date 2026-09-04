/* ============================================================
   CENTINELA CODE — CARGADOR DEL SISTEMA DE BÚSQUEDA
   V9 — motor global + consecuencias + UI + tamaño visual + Constitución
   ============================================================ */
(function(){
  "use strict";
  const base="./";
  function cargar(src){
    return new Promise((resolve,reject)=>{
      if(document.querySelector(`script[data-centinela-src="${src}"]`)){resolve();return;}
      const s=document.createElement("script");
      s.src=src;s.async=false;s.dataset.centinelaSrc=src;
      s.onload=resolve;s.onerror=()=>reject(new Error(`No se pudo cargar ${src}`));
      document.head.appendChild(s);
    });
  }
  async function boot(){
    try{
      await cargar(`${base}buscadores-core.js?v=20260904v9`);
      await cargar(`${base}buscador-consecuencias.js?v=20260904v4`);
      await cargar(`${base}buscador-home.js?v=20260904v4`);
      await cargar(`${base}buscador-home-fix.js?v=20260904v4`);
      await cargar(`${base}buscador-consecuencias-ui.js?v=20260904v2`);
      await cargar(`${base}buscador-home-size.js?v=20260904v1`);
    }catch(e){console.error("Centinela Code — sistema de búsqueda:",e);}
    try{
      await cargar(`${base}constitucion-completa.js?v=20260904-constitucion-v3`);
      await cargar(`${base}constitucion-tab-fix.js?v=20260904-constitucion-tab-fix-v2`);
    }catch(e){console.error("Centinela Code — Constitución:",e);}
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();
