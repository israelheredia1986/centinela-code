/* CENTINELA CODE — compatibilidad + carga del módulo de apoyo operativo. */
(function(){
  "use strict";
  document.querySelectorAll('.cc-global-search,#centinela-global-search-ui').forEach(el=>el.remove());
  if(document.getElementById('centinelaActuacionesOperativasScript')) return;

  /* El módulo de apoyo operativo se carga al final para que su contenido
     no interfiera con los módulos normativos existentes. */
  const script=document.createElement('script');
  script.id='centinelaActuacionesOperativasScript';
  script.src='./actuaciones-operativas.js?v=20260905';
  script.async=true;
  script.onerror=()=>console.warn('No se pudo cargar el módulo de apoyo operativo.');
  document.body.appendChild(script);

  /* Refuerzo final del dashboard: visual-enhancements.js todavía aplicaba
     la distribución antigua de 2 columnas y ocultaba la tarjeta azul.
     Estas reglas solo afectan al bloque de acceso rápido de Inicio. */
  const st=document.createElement('style');
  st.id='cc-dashboard-three-actions-final';
  st.textContent=`
    #section-home .quick-actions{grid-template-columns:repeat(3,minmax(0,1fr)) !important;display:grid !important;width:100% !important;gap:12px !important;padding:0 !important;}
    #section-home .quick-actions .quick-action{display:flex !important;width:100% !important;min-width:0 !important;}
    #section-home .quick-actions #ccOperQuickAction{display:flex !important;visibility:visible !important;}
    #section-home .quick-actions .quick-action[data-cc-search-hidden="true"]:not(#ccOperQuickAction){display:none !important;}
    @media(max-width:700px){#section-home .quick-actions{grid-template-columns:repeat(2,minmax(0,1fr)) !important;gap:9px !important;}}
    @media(max-width:560px){#section-home .quick-actions{grid-template-columns:repeat(2,minmax(0,1fr)) !important;}}
  `;
  document.head.appendChild(st);
})();
