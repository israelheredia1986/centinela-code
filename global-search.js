/* ============================================================
   CENTINELA CODE — LIMPIEZA DE BUSCADOR GLOBAL
   V1 — elimina el buscador de Inicio y sus restos dinámicos
   ============================================================ */
(function(){
  "use strict";

  const SELECTORS = [
    ".cc-global-search",
    "#cc-home-search-shell",
    "#cc-home-search-results",
    "#cc-home-search-hidden-results"
  ];

  function limpiarBuscadorGlobal(){
    SELECTORS.forEach((selector) => {
      document.querySelectorAll(selector).forEach((elemento) => elemento.remove());
    });

    document.getElementById("centinela-global-search-ui")?.remove();
    document.getElementById("cc-home-search-style")?.remove();

    // El bloque inline antiguo también se elimina para que no pueda
    // volver a enganchar eventos sobre elementos que ya no existen.
    document.querySelectorAll("script").forEach((script) => {
      const texto = script.textContent || "";
      if (
        texto.includes("cc-global-search-input") ||
        texto.includes("CENTINELA-GLOBAL-SEARCH-V1")
      ) {
        script.remove();
      }
    });
  }

  // Ejecutar inmediatamente y de nuevo cuando se complete el DOM.
  limpiarBuscadorGlobal();
  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", limpiarBuscadorGlobal, { once:true });
  }

  // Protección contra cualquier script antiguo/caché que intente
  // reconstruir el buscador de Inicio después de cargar la aplicación.
  const observer = new MutationObserver(() => limpiarBuscadorGlobal());
  const iniciarObserver = () => {
    if(document.body) observer.observe(document.body, { childList:true, subtree:true });
  };
  iniciarObserver();
  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", iniciarObserver, { once:true });
  }
})();
