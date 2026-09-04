/* ============================================================
   CENTINELA IA — FORMATO POLICIAL DEL CHAT
   Convierte respuestas JSON del motor IA en una respuesta legible,
   operativa y orientada a Policía Local. No modifica el JSON usado
   por el módulo de actas.
   ============================================================ */
(function () {
  "use strict";

  const MARCA = "data-centinela-police-formatted";

  function texto(valor) {
    if (valor === null || valor === undefined) return "";
    if (typeof valor === "object") {
      if (Array.isArray(valor)) return valor.map(texto).filter(Boolean).join("; ");
      return "";
    }
    return String(valor).trim();
  }

  function esc(valor) {
    return texto(valor)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function normalizarClave(valor) {
    return String(valor || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");
  }

  function valorClave(obj, claves) {
    if (!obj || typeof obj !== "object") return "";
    const buscadas = claves.map(normalizarClave);
    for (const [clave, valor] of Object.entries(obj)) {
      if (buscadas.includes(normalizarClave(clave))) return valor;
    }
    return "";
  }

  function listaInfracciones(datos) {
    const lista = valorClave(datos, ["infracciones", "infracciones_detectadas", "resultados"]);
    if (Array.isArray(lista)) return lista;
    if (lista && typeof lista === "object") return [lista];

    const una = valorClave(datos, ["infraccion"]);
    if (una || valorClave(datos, ["articulo", "codigo"])) return [datos];
    return [];
  }

  function limpiarMarkdown(valor) {
    return texto(valor)
      .replace(/^\s*#{1,6}\s*/gm, "")
      .replace(/\*\*([^*\n]+)\*\*/g, "$1")
      .replace(/__([^_\n]+)__/g, "$1")
      .replace(/\*([^*\n]+)\*/g, "$1")
      .replace(/_([^_\n]+)_/g, "$1")
      .replace(/^\s*[-*]\s+/gm, "- ")
      .replace(/`/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function formatearInfraccion(item, indice) {
    const articulo = valorClave(item, ["articulo", "precepto"]);
    const apartado = valorClave(item, ["apartado"]);
    const codigo = valorClave(item, ["codigo", "id"]);
    const norma = valorClave(item, ["fuente", "norma", "ley", "legislacion"]);
    const titulo = valorClave(item, ["titulo", "infraccion", "denominacion", "concepto"]);
    const descripcion = valorClave(item, ["descripcion", "descripcion_juridica", "conducta", "texto"]);
    const gravedad = valorClave(item, ["gravedad", "calificacion"]);
    const cuantia = valorClave(item, ["cuantia", "sancion", "multa", "importe"]);
    const fundamento = valorClave(item, ["fundamento", "fundamento_juridico", "base_legal"]);

    let sancion = cuantia;
    if (sancion && typeof sancion === "object") {
      const min = valorClave(sancion, ["min"]);
      const max = valorClave(sancion, ["max"]);
      const cantidad = valorClave(sancion, ["cuantia", "importe"]);
      const detalle = valorClave(sancion, ["texto", "descripcion"]);
      if (cantidad) sancion = texto(cantidad);
      else if (min !== "" && max !== "") sancion = `${texto(min)} € a ${texto(max)} €`;
      else if (min !== "") sancion = `Desde ${texto(min)} €`;
      else if (max !== "") sancion = `Hasta ${texto(max)} €`;
      else sancion = texto(detalle);
    }

    const partes = [];
    const encabezado = [
      articulo ? `Artículo ${texto(articulo)}${apartado ? `.${texto(apartado)}` : ""}` : "",
      codigo ? `Código ${texto(codigo)}` : ""
    ].filter(Boolean).join(" · ");

    if (encabezado) partes.push(`<div class="centinela-police-line"><strong>${esc(encabezado)}</strong></div>`);
    if (norma) partes.push(`<div class="centinela-police-line"><strong>Norma:</strong> ${esc(norma)}</div>`);
    if (titulo) partes.push(`<div class="centinela-police-line"><strong>Infracción:</strong> ${esc(titulo)}</div>`);
    if (gravedad) partes.push(`<div class="centinela-police-line"><strong>Calificación:</strong> ${esc(gravedad)}</div>`);
    if (sancion) partes.push(`<div class="centinela-police-line"><strong>Sanción:</strong> ${esc(sancion)}</div>`);
    if (descripcion) partes.push(`<div class="centinela-police-line"><strong>Descripción:</strong> ${esc(limpiarMarkdown(descripcion))}</div>`);
    if (fundamento) partes.push(`<div class="centinela-police-line"><strong>Fundamento:</strong> ${esc(limpiarMarkdown(fundamento))}</div>`);

    return `<div class="centinela-police-offence"><div class="centinela-police-subtitle">${indice > 0 ? `Infracción ${indice + 1}` : "Calificación propuesta"}</div>${partes.join("")}</div>`;
  }

  function formatearJSON(datos) {
    const resumen = valorClave(datos, ["resumen", "respuesta", "analisis", "analisis_juridico"]);
    const fundamentoGlobal = valorClave(datos, ["fundamento", "fundamento_juridico", "base_legal"]);
    const actuacion = valorClave(datos, ["actuacion_policial", "actuacion", "metodo_actuacion_policial", "procedimiento"]);
    const verificaciones = valorClave(datos, ["verificaciones", "comprobaciones", "comprobar"]);
    const autoridad = valorClave(datos, ["autoridad_sancionadora", "autoridad"]);
    const gravedad = valorClave(datos, ["gravedad", "calificacion"]);
    const cuantia = valorClave(datos, ["cuantia", "sancion", "multa", "importe"]);
    const articulo = valorClave(datos, ["articulo", "precepto"]);
    const norma = valorClave(datos, ["norma", "ley", "fuente"]);
    const infraccion = valorClave(datos, ["infraccion", "titulo", "concepto"]);
    const lista = listaInfracciones(datos);

    const bloques = [];

    if (resumen) {
      bloques.push(`<section class="centinela-police-section"><div class="centinela-police-title">Valoración</div><div class="centinela-police-text">${esc(limpiarMarkdown(resumen))}</div></section>`);
    }

    if (infraccion || articulo || norma || gravedad || cuantia) {
      const principal = { infraccion, articulo, norma, gravedad, cuantia };
      bloques.push(formatearInfraccion(principal, 0));
    }

    if (lista.length) {
      lista.slice(0, 8).forEach((item, indice) => {
        const esPrincipal = item === datos || (!infraccion && indice === 0);
        if (esPrincipal && (infraccion || articulo || norma || gravedad || cuantia)) return;
        bloques.push(formatearInfraccion(item, indice));
      });
    }

    if (fundamentoGlobal) {
      bloques.push(`<section class="centinela-police-section"><div class="centinela-police-title">Fundamento jurídico</div><div class="centinela-police-text">${esc(limpiarMarkdown(fundamentoGlobal))}</div></section>`);
    }

    if (autoridad) {
      bloques.push(`<section class="centinela-police-section"><div class="centinela-police-title">Autoridad competente</div><div class="centinela-police-text">${esc(limpiarMarkdown(autoridad))}</div></section>`);
    }

    if (actuacion) {
      const pasos = Array.isArray(actuacion) ? actuacion : String(actuacion).split(/\n|;(?=\s*[A-ZÁÉÍÓÚÑ])/).filter(Boolean);
      bloques.push(`<section class="centinela-police-section"><div class="centinela-police-title">Método de actuación policial</div><div class="centinela-police-steps">${pasos.map((paso, i) => `<div><strong>${i + 1}.</strong> ${esc(limpiarMarkdown(paso).replace(/^[-•]\s*/, ""))}</div>`).join("")}</div></section>`);
    }

    if (verificaciones) {
      const pasos = Array.isArray(verificaciones) ? verificaciones : [verificaciones];
      bloques.push(`<section class="centinela-police-section"><div class="centinela-police-title">Comprobaciones antes de denunciar</div><div class="centinela-police-steps">${pasos.map((paso, i) => `<div><strong>${i + 1}.</strong> ${esc(limpiarMarkdown(paso).replace(/^[-•]\s*/, ""))}</div>`).join("")}</div></section>`);
    }

    if (!bloques.length) return "";

    return `<div class="centinela-police-response">${bloques.join("")}</div>`;
  }

  function parsearRespuesta(textoRespuesta) {
    const bruto = texto(textoRespuesta);
    if (!bruto) return "";
    let datos = null;
    try {
      datos = JSON.parse(bruto);
    } catch (_) {
      const limpio = bruto.replace(/^```(?:json)?\s*/i, "").replace(/```$/i, "").trim();
      try { datos = JSON.parse(limpio); } catch (_) {}
    }
    if (!datos || typeof datos !== "object") return "";
    return formatearJSON(datos);
  }

  function aplicarEstilos() {
    if (document.getElementById("centinela-police-format-style")) return;
    const style = document.createElement("style");
    style.id = "centinela-police-format-style";
    style.textContent = `
      .chat-bubble.ai .centinela-police-response{display:block;line-height:1.45}
      .chat-bubble.ai .centinela-police-section,.chat-bubble.ai .centinela-police-offence{margin:0 0 14px}
      .chat-bubble.ai .centinela-police-title,.chat-bubble.ai .centinela-police-subtitle{font-weight:800;margin-bottom:6px;letter-spacing:.01em}
      .chat-bubble.ai .centinela-police-line{margin:3px 0}
      .chat-bubble.ai .centinela-police-text{white-space:pre-wrap}
      .chat-bubble.ai .centinela-police-steps>div{margin:4px 0}
      .chat-bubble.ai .centinela-police-offence{padding:0 0 4px;border-bottom:1px solid rgba(148,163,184,.22)}
      .chat-bubble.ai .centinela-police-offence:last-child{border-bottom:0}
    `;
    document.head.appendChild(style);
  }

  function formatearBurbuja(burbuja) {
    if (!burbuja || !burbuja.classList?.contains("chat-bubble") || !burbuja.classList.contains("ai")) return;
    if (burbuja.getAttribute(MARCA) === "1") return;

    const textoActual = burbuja.textContent || "";
    if (!textoActual.trim()) return;

    const html = parsearRespuesta(textoActual);
    if (!html) return;

    burbuja.setAttribute(MARCA, "1");
    burbuja.innerHTML = html;
  }

  function instalar() {
    aplicarEstilos();
    document.querySelectorAll(".chat-bubble.ai").forEach(formatearBurbuja);
    if (window.CentinelaPoliceFormatObserver) return;

    const observer = new MutationObserver((mutaciones) => {
      mutaciones.forEach((m) => {
        if (m.type === "childList") {
          m.addedNodes.forEach((n) => {
            if (n.nodeType !== Node.ELEMENT_NODE) return;
            if (n.matches?.(".chat-bubble.ai")) formatearBurbuja(n);
            n.querySelectorAll?.(".chat-bubble.ai").forEach(formatearBurbuja);
          });
        }
      });
    });
    if (document.body) observer.observe(document.body, { childList: true, subtree: true });
    window.CentinelaPoliceFormatObserver = observer;
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", instalar, { once: true });
  else instalar();
})();
