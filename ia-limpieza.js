/* ============================================================
   CENTINELA IA — LIMPIEZA DE PRESENTACIÓN
   Elimina markdown, emojis y etiquetas técnicas de la respuesta
   visible del chat sin alterar respuestas JSON usadas por las actas.
   ============================================================ */
(function () {
  "use strict";

  const limpiarTexto = (valor) => {
    let texto = String(valor ?? "").replace(/\r\n?/g, "\n").trim();

    // Las respuestas JSON son consumidas por las funciones de actas.
    // No las modificamos para no romper el parseo.
    const t = texto.trim();
    if ((t.startsWith("{") && t.endsWith("}")) || (t.startsWith("[") && t.endsWith("]"))) {
      try {
        JSON.parse(t);
        return t;
      } catch (_) {}
    }

    // Quitar emojis e iconos decorativos.
    texto = texto.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, "");

    // Quitar etiquetas técnicas que no deben aparecer al agente.
    texto = texto.replace(/^\s*(?:FUENTE|Fuente|fuente)\s*:\s*/gmi, "");
    texto = texto.replace(/^\s*(?:AVISO|Aviso)\s*:\s*/gmi, "Aviso: ");

    // Limpiar markdown frecuente generado por el modelo.
    texto = texto.replace(/^\s{0,3}#{1,6}\s*/gm, "");
    texto = texto.replace(/\*\*([^*\n]+)\*\*/g, "$1");
    texto = texto.replace(/__([^_\n]+)__/g, "$1");
    texto = texto.replace(/\*([^*\n]+)\*/g, "$1");
    texto = texto.replace(/_([^_\n]+)_/g, "$1");
    texto = texto.replace(/^\s*[-*]\s+/gm, "• ");
    texto = texto.replace(/^\s*`{1,3}\s*/gm, "");
    texto = texto.replace(/\s*`{1,3}\s*$/gm, "");

    // Evitar separadores markdown y exceso de líneas vacías.
    texto = texto.replace(/^\s*[-_=]{3,}\s*$/gm, "");
    texto = texto.replace(/\n{3,}/g, "\n\n");
    texto = texto.replace(/[ \t]+\n/g, "\n");

    return texto.trim();
  };

  function instalar() {
    if (typeof window.preguntarCentinelaIA !== "function") return false;
    if (window.preguntarCentinelaIALimpia) return true;

    const original = window.preguntarCentinelaIA;

    window.preguntarCentinelaIA = async function (pregunta, onProgress) {
      const respuesta = await original.call(this, pregunta, onProgress);

      if (typeof respuesta === "string") {
        return limpiarTexto(respuesta);
      }

      return respuesta;
    };

    window.preguntarCentinelaIALimpia = true;
    window.CentinelaIALimpia = { limpiar: limpiarTexto };
    console.info("Centinela IA: presentación limpia activa");
    return true;
  }

  if (instalar()) return;

  let intentos = 0;
  const timer = setInterval(() => {
    intentos += 1;
    if (instalar() || intentos >= 80) clearInterval(timer);
  }, 100);
})();
