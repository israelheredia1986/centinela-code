/* CENTINELA — compatibilidad con el motor de Normativa. */
(function(){
  'use strict';

  function getApi(){
    return window.__centinelaNormativaUnificada || null;
  }

  function patch(){
    const api = getApi();

    if(api && typeof api.setQuery === 'function'){
      /*
       * app.js conserva su listener antiguo sobre #normativaSearch.
       * Antes este puente llamaba a api.reload(), provocando una recarga
       * de todas las leyes en cada tecla. Además, el motor antiguo podía
       * volver a pintar las tarjetas y ocultar los resultados.
       *
       * Ahora la búsqueda es 100 % local: se pasa el texto al motor
       * unificado y solo se vuelve a renderizar el índice ya cargado.
       */
      window.renderizarNormativa = function(){
        const input = document.getElementById('normativaSearch');
        api.setQuery(input ? input.value : '');
      };
      return true;
    }

    return false;
  }

  let n = 0;
  const t = setInterval(() => {
    if(patch() || ++n > 80) clearInterval(t);
  }, 100);

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', patch, {once:true});
  }else{
    patch();
  }
})();
