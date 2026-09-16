/* CENTINELA CODE — ARRANQUE SIN CONFLICTOS DE BUSCADOR */
(function(){
  'use strict';
  document.querySelectorAll('.cc-global-search,#centinela-global-search-ui').forEach(el=>el.remove());

  function loadScript(id,src){
    return new Promise(resolve=>{
      const old=document.getElementById(id);
      if(old){old.remove();}
      const s=document.createElement('script');
      s.id=id;s.src=src;s.async=false;
      s.onload=resolve;s.onerror=resolve;
      document.body.appendChild(s);
    });
  }

  // UN SOLO BUSCADOR. Se carga primero y no se cargan los antiguos
  // buscador-definitivo / buscador-fix, que eran los responsables de
  // volver a escribir resultados amplios después de la búsqueda literal.
  loadScript('centinelaInstantSearchScript','./buscador-instantaneo.js?v=20260916e');

  const normSection=document.getElementById('section-normativa');
  if(normSection&&!document.getElementById('ccNormativaLawPanel')){
    const p=document.createElement('div');p.id='ccNormativaLawPanel';p.style.display='none';normSection.appendChild(p);
  }

  // Los demás módulos se mantienen, pero ya no arrancan ningún buscador alternativo.
  loadScript('centinelaActuacionesOperativasScript','./actuaciones-operativas.js?v=20260905g');
  loadScript('centinelaIAContextoIntegralScript','./ia-context-integral.js?v=20260905g');
  loadScript('centinelaNormativaUnificadaScript','./normativa-unificada.js?v=20260915c');
  loadScript('centinelaNormativaCompatScript','./normativa-compat.js?v=20260915c');
  loadScript('centinelaNormativaOficialScript','./normativa-oficial.js?v=20260905l');
  loadScript('centinelaEspectaculosFusionScript','./normativa-espectaculos-fusion.js?v=20260905g');
  loadScript('centinelaNormativaEstructuraScript','./normativa-estructura.js?v=20260905e');
  loadScript('centinelaNormativaIconosScript','./normativa-iconos.js?v=20260905e');

  const st=document.createElement('style');
  st.id='cc-dashboard-three-actions-final';
  st.textContent=`#section-home .quick-actions{grid-template-columns:repeat(3,minmax(0,1fr)) !important;display:grid !important;width:100% !important;gap:12px !important;padding:0 !important;}#section-home .quick-actions .quick-action{display:flex !important;width:100% !important;min-width:0 !important;}#section-home .quick-actions #ccOperQuickAction{display:flex !important;visibility:visible !important;}#section-home .quick-actions .quick-action[data-cc-search-hidden="true"]:not(#ccOperQuickAction){display:none !important;}@media(max-width:700px){#section-home .quick-actions{grid-template-columns:repeat(2,minmax(0,1fr)) !important;gap:9px !important;}}@media(max-width:560px){#section-home .quick-actions{grid-template-columns:repeat(2,minmax(0,1fr)) !important;}}`;
  document.head.appendChild(st);
})();
