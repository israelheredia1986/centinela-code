/* CENTINELA — compatibilidad con el motor antiguo de Normativa. */
(function(){
  'use strict';
  let timer=null;
  function patch(){
    const api=window.__centinelaNormativaUnificada;
    if(api&&typeof api.reload==='function'){
      // El app.js antiguo llama a renderizarNormativa() al escribir en el buscador.
      // Lo redirigimos al catálogo nuevo con debounce para no disparar 18 fetch por tecla.
      window.renderizarNormativa=function(){
        clearTimeout(timer);
        timer=setTimeout(()=>api.reload(),350);
      };
      return true;
    }
    return false;
  }
  let n=0;
  const t=setInterval(()=>{if(patch()||++n>40)clearInterval(t);},150);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',patch,{once:true});else patch();
})();
