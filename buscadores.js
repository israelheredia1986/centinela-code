/* CENTINELA CODE — CARGADOR DE BÚSQUEDA SIN CONFLICTOS */
(function(){
  'use strict';
  const base='./';
  function cargar(src){
    return new Promise((resolve,reject)=>{
      const key=src.split('?')[0];
      if(document.querySelector(`script[data-centinela-src="${key}"]`)){resolve();return;}
      const s=document.createElement('script');
      s.src=src;s.async=false;s.dataset.centinelaSrc=key;
      s.onload=resolve;s.onerror=()=>reject(new Error(`No se pudo cargar ${src}`));
      document.head.appendChild(s);
    });
  }
  async function boot(){
    try{
      // Buscador de inicio: solo para trasladar la consulta a Consulta.
      await cargar(`${base}buscador-home.js?v=20260916e`);
    }catch(e){console.error('Centinela Code — buscador home:',e)}
    try{
      // Estos módulos no tocan consultaSearch ni consultaResults.
      await cargar(`${base}buscador-leyes-ui.js?v=20260910v1`);
      await cargar(`${base}buscador-consecuencias.js?v=20260904v5`);
      await cargar(`${base}buscador-consecuencias-ui.js?v=20260904v3`);
      await cargar(`${base}trafico-sanciones-codificados.js?v=20260905v1`);
    }catch(e){console.error('Centinela Code — módulos auxiliares:',e)}
    try{
      await cargar(`${base}constitucion-api-fix.js?v=20260911v1`);
      await cargar(`${base}constitucion-completa.js?v=20260904-constitucion-v4`);
      await cargar(`${base}constitucion-tab-fix.js?v=20260904-constitucion-tab-fix-v3`);
    }catch(e){console.error('Centinela Code — Constitución:',e)}
    try{await cargar(`${base}decreto-251-2023.js?v=20260906v4`);}catch(e){console.error('Centinela Code — Espectáculos:',e)}
    try{
      await cargar(`${base}historial-ia.js?v=20260906v1`);
      await cargar(`${base}historial-ia-contexto.js?v=20260906v1`);
    }catch(e){console.error('Centinela Code — Memoria IA:',e)}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
