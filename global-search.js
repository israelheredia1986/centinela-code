/* CENTINELA CODE — compatibilidad con referencia antigua.
   El buscador global antiguo queda desactivado. La búsqueda actual es local.
*/
(function(){
  "use strict";
  document.querySelectorAll('.cc-global-search,#centinela-global-search-ui').forEach(el=>el.remove());
})();
