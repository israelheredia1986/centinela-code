/* ============================================================
   CENTINELA CODE — RESULTADOS DE INFRACCIONES PRO
   Clasificación PENAL / ADMINISTRATIVA + cuantía visible
   Se carga después de app.js mediante el Service Worker.
   ============================================================ */

(function () {
  "use strict";

  const normalizar = (valor) => String(valor ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  const esc = (valor) => {
    if (typeof escaparHTML === "function") return escaparHTML(valor);
    return String(valor ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const euros = (numero) => {
    if (typeof formatearEuros === "function") return formatearEuros(numero);
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0
    }).format(numero);
  };

  function esPenal(infraccion) {
    const gravedad = normalizar(infraccion?.gravedad);
    const tipo = normalizar(infraccion?.tipo || infraccion?.tipoSancion || infraccion?.naturaleza);
    const categoria = normalizar(infraccion?.categoria);
    return gravedad.includes("delito") || tipo.includes("penal") || categoria.includes("penal");
  }

  function textoSancion(infraccion, penal) {
    const sancion = infraccion?.sancion || {};
    const min = Number.isFinite(Number(sancion.min)) ? Number(sancion.min) : null;
    const max = Number.isFinite(Number(sancion.max)) ? Number(sancion.max) : null;
    const cuantia = Number.isFinite(Number(sancion.cuantia)) ? Number(sancion.cuantia) : null;

    if (min !== null && max !== null) return `${euros(min)} - ${euros(max)}`;
    if (cuantia !== null) return euros(cuantia);
    if (min !== null) return `Desde ${euros(min)}`;
    if (max !== null) return `Hasta ${euros(max)}`;

    const detalle = String(sancion.detalle || sancion.texto || "").trim();
    if (detalle) return detalle;

    return penal && typeof extraerPena === "function"
      ? String(extraerPena(infraccion?.conducta || "") || "").trim()
      : "";
  }

  function etiquetaGravedad(infraccion, penal) {
    if (penal) return "";
    const gravedad = String(infraccion?.gravedad || "").trim();
    if (!gravedad) return "";
    return gravedad;
  }

  function instalarEstilos() {
    if (document.getElementById("centinela-resultados-pro-style")) return;
    const style = document.createElement("style");
    style.id = "centinela-resultados-pro-style";
    style.textContent = `
      .result-card--penal{
        border-color:rgba(255,82,101,.55)!important;
        box-shadow:inset 0 0 26px rgba(255,42,70,.07),0 8px 22px rgba(0,0,0,.35)!important;
      }
      .result-card--administrativa{
        border-color:rgba(255,211,74,.28)!important;
      }
      .result-type-badge{
        display:inline-flex;align-items:center;justify-content:center;
        margin-top:5px;padding:5px 9px;border-radius:999px;
        font-size:10px;font-weight:900;letter-spacing:.55px;
        text-transform:uppercase;white-space:nowrap;
        border:1px solid currentColor;background:rgba(0,0,0,.18);
      }
      .result-type-badge--penal{
        color:#ff5265!important;
        background:rgba(255,82,101,.10)!important;
        text-shadow:0 0 9px rgba(255,82,101,.55);
      }
      .result-type-badge--administrativa{
        color:#ffd34a!important;
        background:rgba(255,211,74,.09)!important;
        text-shadow:0 0 9px rgba(255,211,74,.42);
      }
      .result-severity-badge{
        display:inline-flex;align-items:center;
        margin-top:6px;margin-left:5px;padding:4px 7px;border-radius:999px;
        border:1px solid rgba(49,185,255,.4);color:#8fdcff;
        background:rgba(49,185,255,.07);font-size:9px;font-weight:800;
      }
      .result-sanction-box{
        margin-top:10px;padding:9px 11px;border-radius:10px;
        border:1px solid rgba(49,185,255,.25);
        background:linear-gradient(90deg,rgba(5,30,48,.88),rgba(3,17,31,.72));
      }
      .result-sanction-box--penal{
        border-color:rgba(255,82,101,.35);
        background:linear-gradient(90deg,rgba(60,10,20,.56),rgba(24,7,13,.45));
      }
      .result-sanction-label{
        display:block;margin-bottom:3px;font-size:9px;font-weight:900;
        letter-spacing:.75px;text-transform:uppercase;opacity:.82;
      }
      .result-sanction-value{
        display:block;font-size:11px;line-height:1.35;font-weight:800;color:#f2f8ff;
      }
      .result-sanction-box--penal .result-sanction-label{color:#ff7a8a}
      .result-sanction-box--administrativa .result-sanction-label{color:#ffd34a}
      @media (max-width:700px){
        .result-card-header{gap:8px}
        .result-type-badge{font-size:9px;padding:5px 7px}
        .result-sanction-value{font-size:10px}
      }
    `;
    document.head.appendChild(style);
  }

  function renderizarTarjetaInfraccionPro(infraccion) {
    instalarEstilos();

    const penal = esPenal(infraccion);
    const sancion = textoSancion(infraccion, penal);
    const gravedad = etiquetaGravedad(infraccion, penal);
    const conducta = String(infraccion?.conducta || "");
    const conductaSnippet = conducta.length > 190
      ? conducta.slice(0, 190).trim() + "…"
      : conducta;

    const clasificacion = penal ? "PENAL" : "ADMINISTRATIVA";
    const clase = penal ? "result-card--penal" : "result-card--administrativa";
    const claseTipo = penal ? "result-type-badge--penal" : "result-type-badge--administrativa";
    const claseSancion = penal ? "result-sanction-box--penal" : "result-sanction-box--administrativa";
    const etiquetaSancion = penal ? "Pena / sanción penal" : "Cuantía / sanción administrativa";

    return `
      <article class="result-card ${clase}">
        <div class="result-card-header">
          <div>
            <span class="result-ley">${esc(infraccion?.ley || "")}</span>
            ${infraccion?.articulo ? `<span class="result-code">Art. ${esc(infraccion.articulo)}${infraccion?.apartado ? "." + esc(infraccion.apartado) : ""}</span>` : ""}
            <h3>${esc(infraccion?.titulo || "Sin título")}</h3>
            <span class="result-type-badge ${claseTipo}">${clasificacion}</span>
            ${gravedad ? `<span class="result-severity-badge">${esc(gravedad)}</span>` : ""}
          </div>
        </div>

        ${conductaSnippet ? `<p class="result-conducta">${esc(conductaSnippet)}</p>` : ""}

        ${sancion ? `
          <div class="result-sanction-box ${claseSancion}">
            <span class="result-sanction-label">${etiquetaSancion}</span>
            <span class="result-sanction-value">${esc(sancion)}</span>
          </div>
        ` : `
          <div class="result-sanction-box ${claseSancion}">
            <span class="result-sanction-label">${etiquetaSancion}</span>
            <span class="result-sanction-value">Consultar régimen sancionador aplicable</span>
          </div>
        `}

        <div class="result-meta">
          ${infraccion?.codigo ? `<span class="result-pill result-pill--articulo"><span class="result-pill-label">Código</span> ${esc(infraccion.codigo)}</span>` : ""}
        </div>
        <button type="button" class="result-detail-button" data-infraccion-id="${esc(infraccion?.id || "")}">
          Ver detalle
        </button>
      </article>
    `;
  }

  // Sobrescribe la función original cuando app.js ya está disponible.
  function sustituirRenderizador() {
    if (typeof window.renderizarTarjetaInfraccion === "function") {
      window.renderizarTarjetaInfraccion = renderizarTarjetaInfraccionPro;
    }
  }

  instalarEstilos();
  sustituirRenderizador();
  document.addEventListener("DOMContentLoaded", sustituirRenderizador);
  window.addEventListener("load", sustituirRenderizador);
})();
