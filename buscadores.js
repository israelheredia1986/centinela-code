/* ============================================================
   CENTINELA CODE — CARGADOR DEL SISTEMA DE BÚSQUEDA
   V6 — motor global + consecuencias penales/administrativas
   ============================================================ */
(function(){
  "use strict";
  const base="./";
  function cargar(src){
    return new Promise((resolve,reject)=>{
      if(document.querySelector(`script[data-centinela-src="${src}"]`)){resolve();return;}
      const s=document.createElement("script");s.src=src;s.async=false;s.dataset.centinelaSrc=src;s.onload=resolve;s.onerror=()=>reject(new Error(`No se pudo cargar ${src}`));document.head.appendChild(s);
    });
  }
  async function boot(){
    try{
      await cargar(`${base}buscadores-core.js?v=20260904v6`);
      await cargar(`${base}buscador-consecuencias.js?v=20260904v2`);
      await cargar(`${base}buscador-home.js?v=20260904v2`);
      await cargar(`${base}buscador-home-fix.js?v=20260904v2`);
    }catch(e){console.error("Centinela Code — sistema de búsqueda:",e);}
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();
