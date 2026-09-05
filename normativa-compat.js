/* CENTINELA — compatibilidad con el motor antiguo de Normativa. */
(function(){
  'use strict';
  function patch(){
    const api=window.__centinelaNormativaUnificada;
    if(api&&typeof api.render==='function'){
      window.renderizarNormativa=api.render;
      return true;
    }
    return false;
  }
  let n=0;
  const t=setInterval(()=>{if(patch()||++n>30)clearInterval(t);},200);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',patch,{once:true});else patch();
})();
