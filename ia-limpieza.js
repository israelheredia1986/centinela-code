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
    texto = texto.replace(/^\s*(?:FUENTE|Fuente|fuente)\s*:?\s*/gmi, "");
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

  function limpiarNodoTexto(node) {
    if (!node || node.nodeType !== Node.TEXT_NODE) return;
    const original = node.nodeValue || "";
    const limpio = limpiarTexto(original);
    if (limpio !== original) node.nodeValue = limpio;
  }

  function limpiarBurbuja(burbuja) {
    if (!burbuja || !burbuja.classList?.contains("chat-bubble")) return;
    if (!burbuja.classList.contains("ai")) return;

    const walker = document.createTreeWalker(
      burbuja,
      NodeFilter.SHOW_TEXT,
    );

    const nodos = [];
    let nodo;
    while ((nodo = walker.nextNode())) nodos.push(nodo);
    nodos.forEach(limpiarNodoTexto);
  }

  function instalarLimpiezaDOM() {
    document.querySelectorAll(".chat-bubble.ai").forEach(limpiarBurbuja);

    if (window.CentinelaIALimpiezaObserver) return;

    const observer = new MutationObserver((mutaciones) => {
      for (const mutacion of mutaciones) {
        if (mutacion.type === "childList") {
          mutacion.addedNodes.forEach((node) => {
            if (node.nodeType !== Node.ELEMENT_NODE) return;
            if (node.matches?.(".chat-bubble.ai")) limpiarBurbuja(node);
            node.querySelectorAll?.(".chat-bubble.ai").forEach(limpiarBurbuja);
          });
        } else if (mutacion.type === "characterData") {
          limpiarBurbuja(mutacion.target.parentElement?.closest?.(".chat-bubble.ai"));
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    window.CentinelaIALimpiezaObserver = observer;
  }

  function instalar() {
    if (typeof window.preguntarCentinelaIA !== "function") return false;

    if (!window.preguntarCentinelaIALimpia) {
      const original = window.preguntarCentinelaIA;

      window.preguntarCentinelaIA = async function (pregunta, onProgress) {
        const respuesta = await original.call(this, pregunta, onProgress);

        if (typeof respuesta === "string") {
          return limpiarTexto(respuesta);
        }

        return respuesta;
      };

      window.preguntarCentinelaIALimpia = true;
    }

    instalarLimpiezaDOM();
    window.CentinelaIALimpia = { limpiar: limpiarTexto };
    console.info("Centinela IA: presentación limpia activa");
    return true;
  }

  if (instalar()) return;

  let intentos = 0;
  const timer = setInterval(() => {
    intentos += 1;
    if (instalar() || intentos >= 100) clearInterval(timer);
  }, 100);
})();
