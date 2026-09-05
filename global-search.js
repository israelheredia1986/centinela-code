/* CENTINELA CODE — compatibilidad + carga del módulo de apoyo operativo. */
(function(){
  "use strict";
  document.querySelectorAll('.cc-global-search,#centinela-global-search-ui').forEach(el=>el.remove());
  if(document.getElementById('centinelaActuacionesOperativasScript')) return;
  const script=document.createElement('script');
  script.id='centinelaActuacionesOperativasScript';
  script.src='./actuaciones-operativas.js?v=20260905';
  script.async=true;
  script.onerror=()=>console.warn('No se pudo cargar el módulo de apoyo operativo.');
  document.body.appendChild(script);
})();
