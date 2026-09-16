/* CENTINELA CODE — COMPATIBILIDAD DEL BUSCADOR ÚNICO */
(function(){
  'use strict';
  // Referencias antiguas pueden seguir cargando este archivo. No debe crear
  // otro motor ni sobrescribir los resultados del buscador único.
  const activar=()=>window.CentinelaInstantSearch?.install?.();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',activar,{once:true});
  else activar();
})();
