/* ============================================================
   CENTINELA CODE — REPARACIÓN GLOBAL DE CLICS EN NORMATIVA
   Evita conflictos entre módulos de Espectáculos Públicos y
   el delegado de eventos del app.js.
   ============================================================ */
(function(){
  'use strict';
  if(window.__centinelaNormativaClickFix) return;
  window.__centinelaNormativaClickFix=true;

  document.addEventListener('click', function(e){
    /*
      Los botones de Espectáculos Públicos se gestionan dentro de su
      propio módulo. No interceptamos su tarjeta contenedora aquí.
    */
    const btn=e.target.closest('.normativa-open[data-law]');
    if(!btn) return;

    const tipo=btn.dataset.law||'';
    const id=btn.dataset.id||'';
    if(typeof window.abrirNormativa!=='function') return;

    e.preventDefault();
    e.stopPropagation();
    try{
      window.abrirNormativa(tipo,id);
    }catch(err){
      console.error('Centinela Code — error al abrir ficha normativa:',err);
    }
  }, true);
})();
