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
    const category=e.target.closest('#centinela-espectaculos-publicos-card');
    if(category){
      e.preventDefault();
      e.stopPropagation();
      if(typeof window.openCategory==='function') window.openCategory();
      else if(typeof window.openCategory === 'function') window.openCategory();
      return;
    }

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
