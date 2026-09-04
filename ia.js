// =====================================================
// CENTINELA CODE - IA SUPABASE EDGE FUNCTION
// =====================================================

const CENTINELA_IA_URL =
"https://okuygqbaliaeavhyezri.supabase.co/functions/v1/centinela-ia";

async function preguntarCentinelaIA(pregunta) {
  try {
    const respuesta = await fetch(CENTINELA_IA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pregunta: pregunta })
    });
    const datos = await respuesta.json();
    if (datos.error) return "Error IA: " + datos.error;
    return datos.choices[0].message.content;
  } catch (error) {
    console.error("Error conexión Centinela IA:", error);
    return "Error conectando con Centinela IA";
  }
}

// =====================================================
// CARGA DEL MÓDULO AVANZADO DE MATRÍCULAS
// =====================================================
(function cargarModuloMatriculas() {
  function cargar() {
    if (document.getElementById("centinelaMatriculasScript")) return;
    const script = document.createElement("script");
    script.id = "centinelaMatriculasScript";
    script.src = "./matriculas.js?v=20260904-dgt-live-v4";
    script.async = true;
    script.onerror = () => console.warn("No se pudo cargar el módulo avanzado de Matrículas.");
    document.head.appendChild(script);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(cargar, 0), { once: true });
  } else setTimeout(cargar, 0);
})();

// =====================================================
// ICONOS CENTINELA CODE — V4
// Los iconos se insertan como SVG REAL en el DOM.
// No usamos emoji, máscaras CSS ni data-uri: así no pueden
// desaparecer por incompatibilidades del navegador.
// =====================================================
(function repararIconosCentinela() {
  const NS = "http://www.w3.org/2000/svg";

  function makeSVG(label, inner, className) {
    const s = document.createElementNS(NS, "svg");
    s.setAttribute("viewBox", "0 0 120 120");
    s.setAttribute("role", "img");
    s.setAttribute("aria-label", label);
    s.setAttribute("focusable", "false");
    s.classList.add("centinela-svg", className || "");
    s.innerHTML = inner;
    return s;
  }

  function consulta() {
    return makeSVG("Consulta", `
      <defs><linearGradient id="cG" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f8ffff"/><stop offset=".35" stop-color="#55d7ff"/><stop offset=".75" stop-color="#1689ff"/><stop offset="1" stop-color="#063a83"/></linearGradient></defs>
      <circle cx="47" cy="46" r="32" fill="url(#cG)" stroke="#baf2ff" stroke-width="4"/>
      <circle cx="47" cy="46" r="25" fill="none" stroke="#1264b5" stroke-width="3" opacity=".75"/>
      <path d="M47 25 29 63h36L47 25Z" fill="none" stroke="#ecffff" stroke-width="3"/>
      <path d="M47 25v38M29 63l18-17 18 17" fill="none" stroke="#dfffff" stroke-width="2.5"/>
      <path d="M70 70 105 105" stroke="#73dcff" stroke-width="13" stroke-linecap="round"/>
      <path d="M70 70 105 105" stroke="#f3ffff" stroke-width="4" stroke-linecap="round"/>
    `, "icon-consulta");
  }

  function actas() {
    return makeSVG("Actas", `
      <defs><linearGradient id="aG" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#eafff5"/><stop offset=".3" stop-color="#6affba"/><stop offset=".72" stop-color="#0bbb73"/><stop offset="1" stop-color="#04523f"/></linearGradient></defs>
      <path d="M27 15h58l15 16v76H27z" fill="url(#aG)" stroke="#baffdf" stroke-width="4"/>
      <path d="M85 15v20h15" fill="#159866" stroke="#d8ffed" stroke-width="3"/>
      <path d="M41 50h44M41 64h44M41 78h31" stroke="#edfff7" stroke-width="5" stroke-linecap="round"/>
      <circle cx="82" cy="92" r="17" fill="#06704d" stroke="#baffdf" stroke-width="3"/>
      <path d="m74 92 6 6 11-14" fill="none" stroke="#effff7" stroke-width="4"/>
      <path d="M20 27v77" stroke="#5cffb5" stroke-width="5" opacity=".45"/>
    `, "icon-actas");
  }

  function normativa() {
    return makeSVG("Normativa", `
      <defs><linearGradient id="nG" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff9bf"/><stop offset=".3" stop-color="#ffd84b"/><stop offset=".75" stop-color="#b87800"/><stop offset="1" stop-color="#513000"/></linearGradient></defs>
      <path d="M18 24h35c8 0 14 6 14 14v65c-7-5-14-7-22-7H18z" fill="url(#nG)" stroke="#fff0a0" stroke-width="4"/>
      <path d="M102 24H67c-8 0-14 6-14 14v65c7-5 14-7 22-7h27z" fill="url(#nG)" stroke="#fff0a0" stroke-width="4"/>
      <path d="M60 35v59" stroke="#9b6500" stroke-width="4"/>
      <text x="60" y="78" text-anchor="middle" font-family="Georgia,serif" font-size="45" font-weight="900" fill="#fff4a5" stroke="#835500" stroke-width="1.5">S</text>
      <path d="M60 82v19M45 101h30M31 44h19M70 44h19" stroke="#fff4a5" stroke-width="3.5" stroke-linecap="round"/>
    `, "icon-normativa");
  }

  function inicio() {
    return makeSVG("Inicio", `
      <path d="M15 54 60 16l45 38" fill="none" stroke="currentColor" stroke-width="7" stroke-linejoin="round"/>
      <path d="M25 49v55h70V49" fill="currentColor" opacity=".18" stroke="currentColor" stroke-width="5"/>
      <path d="M46 104V72h28v32" fill="none" stroke="currentColor" stroke-width="5"/>
    `, "icon-inicio");
  }

  function ajustes() {
    return makeSVG("Ajustes", `
      <path d="M52 12h16l3 14a35 35 0 0 1 9 5l12-5 8 14-10 9a35 35 0 0 1 0 11l10 9-8 14-12-5a35 35 0 0 1-9 5l-3 14H52l-3-14a35 35 0 0 1-9-5l-12 5-8-14 10-9a35 35 0 0 1 0-11l-10-9 8-14 12 5a35 35 0 0 1 9-5z" fill="currentColor" opacity=".14" stroke="currentColor" stroke-width="4"/>
      <circle cx="60" cy="55" r="15" fill="none" stroke="currentColor" stroke-width="6"/>
    `, "icon-ajustes");
  }

  // Robot policial ORIGINAL de Centinela Code.
  // Estética de robot táctico futurista, sin reproducir un personaje
  // concreto de Robocop, Transformers u otra franquicia.
  function robot() {
    return makeSVG("Centinela IA", `
      <defs>
        <linearGradient id="rM" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f0fbff"/><stop offset=".25" stop-color="#8eb6ca"/><stop offset=".6" stop-color="#34566c"/><stop offset="1" stop-color="#0a1622"/></linearGradient>
        <linearGradient id="rV" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#00a9ff"/><stop offset=".5" stop-color="#eaffff"/><stop offset="1" stop-color="#00a9ff"/></linearGradient>
      </defs>
      <path d="M39 29V19h42v10" fill="none" stroke="currentColor" stroke-width="5"/>
      <circle cx="60" cy="12" r="5" fill="#35c7ff" stroke="#eaffff" stroke-width="2"/>
      <path d="M28 40q2-17 17-21h30q15 4 17 21l-4 39q-2 15-16 19H48q-14-4-16-19z" fill="url(#rM)" stroke="currentColor" stroke-width="4"/>
      <path d="M31 44h58l-3 23H34z" fill="#071522" stroke="#6adfff" stroke-width="3"/>
      <path d="M39 55h42" stroke="url(#rV)" stroke-width="9" stroke-linecap="round"/>
      <circle cx="45" cy="55" r="3" fill="#fff"/><circle cx="75" cy="55" r="3" fill="#fff"/>
      <path d="M44 79h32l-5 13H49z" fill="#16364c" stroke="#79dfff" stroke-width="3"/>
      <path d="M51 84h18" stroke="#eaffff" stroke-width="3" stroke-linecap="round"/>
      <path d="M27 66 17 74v20l10 5M93 66l10 8v20l-10 5" fill="none" stroke="currentColor" stroke-width="5"/>
      <path d="m60 77 7 9-7 9-7-9z" fill="#31b9ff" stroke="#eaffff" stroke-width="2"/>
      <path d="M44 106h32" stroke="#a9eaff" stroke-width="6" stroke-linecap="round"/>
    `, "icon-robot");
  }

  function replace(container, factory) {
    if (!container || !factory) return;
    container.innerHTML = "";
    container.appendChild(factory());
    container.classList.add("centinela-icon-fixed");
  }

  function applyIcons() {
    document.querySelectorAll(".quick-action-icon").forEach((el) => {
      const card = el.closest(".quick-action");
      if (!card) return;
      if (card.classList.contains("quick-action--blue")) replace(el, consulta);
      else if (card.classList.contains("quick-action--teal")) replace(el, actas);
      else if (card.classList.contains("quick-action--gold")) replace(el, normativa);
    });

    const navFactories = { home: inicio, consulta, actas, normativa, ia: robot, ajustes };
    document.querySelectorAll(".nav-item[data-section]").forEach((item) => {
      const icon = item.querySelector(".nav-icon");
      const factory = navFactories[item.dataset.section];
      if (icon && factory) replace(icon, factory);
    });

    const loading = document.querySelector(".loading-logo");
    if (loading) replace(loading, robot);
  }

  function installCSS() {
    if (document.getElementById("centinela-icon-fix-v4")) return;
    const style = document.createElement("style");
    style.id = "centinela-icon-fix-v4";
    style.textContent = `
      .quick-action-icon,
      .nav-icon,
      .loading-logo{
        background:none!important;
        background-image:none!important;
        -webkit-mask:none!important;
        mask:none!important;
        color:inherit!important;
        font-size:0!important;
        text-shadow:none!important;
        overflow:visible!important;
      }
      .quick-action-icon{display:flex!important;align-items:center!important;justify-content:center!important;width:122px!important;height:132px!important}
      .nav-icon{display:flex!important;align-items:center!important;justify-content:center!important;width:38px!important;height:38px!important}
      .loading-logo{display:flex!important;align-items:center!important;justify-content:center!important;width:86px!important;height:86px!important}
      .centinela-svg{display:block!important;width:100%!important;height:100%!important;overflow:visible!important}
      .quick-action-icon .centinela-svg{filter:drop-shadow(0 0 5px currentColor) drop-shadow(0 0 10px currentColor)!important}
      .nav-icon .centinela-svg{width:36px!important;height:36px!important}
      .nav-item[data-section="ia"] .nav-icon .icon-robot{width:43px!important;height:43px!important;filter:drop-shadow(0 0 7px #31b9ff) drop-shadow(0 0 13px #31b9ff)!important}
      @media(max-width:520px){
        .quick-action-icon{width:104px!important;height:116px!important}
        .nav-icon{width:31px!important;height:31px!important}
        .nav-item[data-section="ia"] .nav-icon .icon-robot{width:40px!important;height:40px!important}
      }
    `;
    document.head.appendChild(style);
  }

  function start() {
    installCSS();
    applyIcons();
    [300, 1000, 2500].forEach(ms => setTimeout(applyIcons, ms));
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once:true });
  else start();

  const observer = new MutationObserver(() => {
    if (!document.querySelector(".nav-icon .centinela-svg") || !document.querySelector(".quick-action-icon .centinela-svg")) applyIcons();
  });
  observer.observe(document.documentElement, { childList:true, subtree:true });
})();
