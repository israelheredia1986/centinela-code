(function () {
  "use strict";

  const limpiarTexto = (valor) => {
    let texto = String(valor ?? "").replace(/\r\n?/g, "\n").trim();

    const t = texto.trim();
    if ((t.startsWith("{") && t.endsWith("}")) || (t.startsWith("[") && t.endsWith("]"))) {
      try {
        JSON.parse(t);
        return t;
      } catch (_) {}
    }

    texto = texto.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, "");
    texto = texto.replace(/^\s*(?:FUENTE|Fuente|fuente)\s*:?\s*/gmi, "");
    texto = texto.replace(/^\s*(?:AVISO|Aviso)\s*:\s*/gmi, "Aviso: ");
    texto = texto.replace(/^\s{0,3}#{1,6}\s*/gm, "");
    texto = texto.replace(/\*\*([^*\n]+)\*\*/g, "$1");
    texto = texto.replace(/__([^_\n]+)__/g, "$1");
    texto = texto.replace(/\*([^*\n]+)\*/g, "$1");
    texto = texto.replace(/_([^_\n]+)_/g, "$1");
    texto = texto.replace(/^\s*[-*]\s+/gm, "• ");
    texto = texto.replace(/^\s*`{1,3}\s*/gm, "");
    texto = texto.replace(/\s*`{1,3}\s*$/gm, "");
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

    const walker = document.createTreeWalker(burbuja, NodeFilter.SHOW_TEXT);
    const nodos = [];
    let nodo;
    while ((nodo = walker.nextNode())) nodos.push(nodo);
    nodos.forEach(limpiarNodoTexto);
  }

  function instalarNavegacionInferior() {
    if (document.getElementById("centinela-nav-fix")) return;

    const style = document.createElement("style");
    style.id = "centinela-nav-fix";
    style.textContent = `
      /* CENTINELA — restauración de iconos de la barra inferior */
      .bottom-navigation .nav-item .nav-icon{
        width:auto!important;
        height:auto!important;
        min-width:30px!important;
        min-height:30px!important;
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        position:relative!important;
        font-family:Arial,"Segoe UI Emoji",sans-serif!important;
        font-size:30px!important;
        line-height:1!important;
        color:currentColor!important;
        text-shadow:0 0 10px currentColor!important;
        background:none!important;
        -webkit-mask:none!important;
        mask:none!important;
        filter:none!important;
      }
      .bottom-navigation .nav-item .nav-icon:before{
        content:none!important;
        display:none!important;
        -webkit-mask:none!important;
        mask:none!important;
        background:none!important;
      }
      .bottom-navigation .nav-item[data-section="ia"] .nav-icon{
        font-size:56px!important;
        min-width:48px!important;
        min-height:48px!important;
        line-height:.85!important;
        text-shadow:0 0 16px currentColor,0 0 28px rgba(49,185,255,.55)!important;
        transform:scale(1.05)!important;
      }
      .bottom-navigation .nav-item[data-section="ia"] .nav-label{
        font-weight:900!important;
        color:currentColor!important;
        text-shadow:0 0 8px currentColor!important;
      }
      .quick-actions .quick-action--gold .quick-action-icon{
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        font-size:0!important;
        color:#ffd21c!important;
        background:transparent!important;
      }
      .quick-actions .quick-action--gold .quick-action-icon:before{
        content:"§"!important;
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        width:100%!important;
        height:100%!important;
        background:none!important;
        -webkit-mask:none!important;
        mask:none!important;
        color:currentColor!important;
        font-family:Arial,sans-serif!important;
        font-size:112px!important;
        line-height:1!important;
        font-weight:700!important;
        text-shadow:0 0 10px currentColor!important;
        filter:drop-shadow(0 0 7px currentColor)!important;
      }
      @media (max-width:520px){
        .bottom-navigation .nav-item .nav-icon{font-size:27px!important}
        .bottom-navigation .nav-item[data-section="ia"] .nav-icon{font-size:52px!important}
        .quick-actions .quick-action--gold .quick-action-icon:before{font-size:96px!important}
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  function instalarLimpiezaDOM() {
    document.querySelectorAll(".chat-bubble.ai").forEach(limpiarBurbuja);
    instalarNavegacionInferior();

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
    instalarNavegacionInferior();

    if (typeof window.preguntarCentinelaIA !== "function") {
      instalarLimpiezaDOM();
      return false;
    }

    if (!window.preguntarCentinelaIALimpia) {
      const original = window.preguntarCentinelaIA;

      window.preguntarCentinelaIA = async function (pregunta, onProgress) {
        const respuesta = await original.call(this, pregunta, onProgress);
        if (typeof respuesta === "string") return limpiarTexto(respuesta);
        return respuesta;
      };

      window.preguntarCentinelaIALimpia = true;
    }

    instalarLimpiezaDOM();
    window.CentinelaIALimpia = { limpiar: limpiarTexto };
    console.info("Centinela IA: presentación limpia + navegación restaurada");
    return true;
  }

  instalar();

  let intentos = 0;
  const timer = setInterval(() => {
    intentos += 1;
    instalarNavegacionInferior();
    if (instalar() || intentos >= 100) clearInterval(timer);
  }, 100);
})();
