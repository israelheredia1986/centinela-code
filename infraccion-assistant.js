/* ============================================================
   CENTINELA CODE — AJUSTE DE ETIQUETA DE ESTADO
   Cambia la denominación de la base normativa para que no se
   interprete que el total mostrado corresponde exclusivamente
   a los artículos de la Ley Orgánica 4/2015.
   ============================================================ */
(function () {
  "use strict";

  function actualizarEtiquetaNormativa() {
    const estado = document.getElementById("homeNormativaStatus");
    if (!estado) return;

    const fila = estado.closest(".status-row");
    if (!fila) return;

    const etiqueta = fila.querySelector("strong:not(.status-value)");
    const descripcion = fila.querySelector("small");

    if (etiqueta) etiqueta.textContent = "Normativa aplicable";
    if (descripcion) descripcion.textContent = "Comprobando referencias disponibles";

    const valor = String(estado.textContent || "").trim();
    const match = valor.match(/^(\\d+)\\s+artículos?$/i);
    if (match) estado.textContent = `${match[1]} referencias`;
  }

  function iniciar() {
    actualizarEtiquetaNormativa();

    const observador = new MutationObserver(() => {
      actualizarEtiquetaNormativa();
    });

    observador.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar, { once: true });
  } else {
    iniciar();
  }
})();
