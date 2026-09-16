/* ============================================================
   CENTINELA CODE — CARGADOR AUXILIAR
   V30 — MOTOR ÚNICO + CONSULTA RÁPIDA FUNCIONAL.
   ============================================================ */
(function(){
  "use strict";
  const base="./";
  function cargar(src){
    return new Promise((resolve,reject)=>{
      const key=src.split("?")[0];
      const existente=document.querySelector(`script[data-centinela-src="${key}"]`);
      if(existente){resolve();return;}
      const s=document.createElement("script");
      s.src=src;s.async=false;s.dataset.centinelaSrc=key;
      s.onload=resolve;s.onerror=()=>reject(new Error(`No se pudo cargar ${src}`));
      document.head.appendChild(s);
    });
  }
  async function boot(){
    // PRIMERO: motor único de consulta. Así el acceso rápido nunca depende
    // de que el usuario haya abierto antes la pestaña CONSULTA.
    try{
      await cargar(`${base}buscador-instantaneo.js?v=20260916h`);
    }catch(e){console.error("Centinela Code — motor de consulta:",e)}

    // SEGUNDO: buscador de INICIO / CONSULTA RÁPIDA.
    try{
      await cargar(`${base}buscador-home.js?v=20260916g`);
    }catch(e){console.error("Centinela Code — acceso directo:",e)}

    // NO cargar buscador-definitivo, buscador-local-only, buscador-ultra,
    // buscadores-core ni otros motores que compitan por #consultaSearch.

    try{
      await cargar(`${base}constitucion-api-fix.js?v=20260911v1`);
      await cargar(`${base}constitucion-completa.js?v=20260904-constitucion-v4`);
      await cargar(`${base}constitucion-tab-fix.js?v=20260904-constitucion-tab-fix-v3`);
    }catch(e){console.error("Centinela Code — Constitución:",e)}

    try{await cargar(`${base}decreto-251-2023.js?v=20260906v4`);}catch(e){console.error("Centinela Code — Espectáculos:",e)}
    try{
      await cargar(`${base}historial-ia.js?v=20260906v1`);
      await cargar(`${base}historial-ia-contexto.js?v=20260906v1`);
    }catch(e){console.error("Centinela Code — Memoria IA:",e)}
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();
