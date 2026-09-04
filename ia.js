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

    if (datos.error) {
      console.error("Error IA:", datos.error);
      return "Error IA: " + datos.error;
    }

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
    script.src = "./matriculas.js?v=20260904-dgt-live-v2";
    script.async = true;
    script.onerror = () => console.warn("No se pudo cargar el módulo avanzado de Matrículas.");
    document.head.appendChild(script);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(cargar, 0), { once: true });
  } else {
    setTimeout(cargar, 0);
  }
})();

// =====================================================
// CENTINELA CODE — ICONOGRAFÍA DE REFERENCIA
// No emojis. No iconos genéricos. Los iconos de Inicio,
// Consulta, Actas y Normativa se sustituyen por diseños
// volumétricos/neón siguiendo la captura de referencia.
// =====================================================
(function instalarIconografiaReferencia() {
  const css = document.createElement("style");
  css.id = "centinela-reference-icons";
  css.textContent = `
    /* TARJETAS PRINCIPALES */
    .quick-action-icon{
      position:relative!important;
      width:122px!important;height:132px!important;
      margin:0 0 5px!important;
      border:0!important;border-radius:0!important;
      box-shadow:none!important;
      background-color:transparent!important;
      background-repeat:no-repeat!important;
      background-position:center!important;
      background-size:contain!important;
      font-size:0!important;
      color:transparent!important;
      text-shadow:none!important;
    }
    .quick-action-icon:before{display:none!important;content:none!important}

    /* CONSULTA — lupa luminosa + símbolo triangular */
    .quick-action--blue .quick-action-icon{
      background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 180 180'%3E%3Cdefs%3E%3CradialGradient id='g' cx='40%25' cy='35%25'%3E%3Cstop stop-color='%23ffffff'/%3E%3Cstop offset='.28' stop-color='%238cecff'/%3E%3Cstop offset='.7' stop-color='%232d8dff'/%3E%3Cstop offset='1' stop-color='%23051c42'/%3E%3C/radialGradient%3E%3ClinearGradient id='h' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop stop-color='%23ffffff'/%3E%3Cstop offset='.25' stop-color='%2359caff'/%3E%3Cstop offset='.65' stop-color='%230c72ff'/%3E%3Cstop offset='1' stop-color='%23031d4d'/%3E%3C/linearGradient%3E%3Cfilter id='b'%3E%3CfeGaussianBlur stdDeviation='4' result='x'/%3E%3CfeMerge%3E%3CfeMergeNode in='x'/%3E%3CfeMergeNode in='SourceGraphic'/%3E%3C/feMerge%3E%3C/filter%3E%3C/defs%3E%3Ccircle cx='72' cy='67' r='46' fill='none' stroke='%230079ff' stroke-width='12' opacity='.55' filter='url(%23b)'/%3E%3Ccircle cx='72' cy='67' r='40' fill='url(%23g)' stroke='%238deaff' stroke-width='4'/%3E%3Cpath d='M72 36 46 86h52L72 36Zm0 0v50M46 86l26-25 26 25' fill='none' stroke='%23d8fbff' stroke-width='3'/%3E%3Cpath d='M62 54l10-18 10 18-10 7Z' fill='%2375eaff' opacity='.85'/%3E%3Cpath d='M106 100 158 152' stroke='%23005dcc' stroke-width='18' stroke-linecap='round' filter='url(%23b)'/%3E%3Cpath d='M106 100 158 152' stroke='url(%23h)' stroke-width='12' stroke-linecap='round'/%3E%3Cpath d='M112 105 153 146' stroke='%23e5fbff' stroke-width='2' opacity='.8'/%3E%3C/svg%3E");
    }

    /* ACTAS — expediente/documento volumétrico verde */
    .quick-action--teal .quick-action-icon{
      background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 180 180'%3E%3Cdefs%3E%3ClinearGradient id='p' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop stop-color='%23d8fff0'/%3E%3Cstop offset='.25' stop-color='%236bffb2'/%3E%3Cstop offset='.7' stop-color='%230bbd75'/%3E%3Cstop offset='1' stop-color='%2302473a'/%3E%3C/linearGradient%3E%3Cfilter id='b'%3E%3CfeGaussianBlur stdDeviation='4' result='x'/%3E%3CfeMerge%3E%3CfeMergeNode in='x'/%3E%3CfeMergeNode in='SourceGraphic'/%3E%3C/feMerge%3E%3C/filter%3E%3C/defs%3E%3Cpath d='M34 25h91l27 28v98H34z' fill='%23064a3c' stroke='%2355ffc0' stroke-width='5' opacity='.6' filter='url(%23b)'/%3E%3Cpath d='M27 18h91l27 28v98H27z' fill='url(%23p)' stroke='%2395ffd1' stroke-width='4'/%3E%3Cpath d='M118 18v29h27' fill='%2314a66d' stroke='%2395ffd1' stroke-width='3'/%3E%3Cpath d='M48 64h69M48 82h69M48 100h53' stroke='%23e2fff4' stroke-width='6' stroke-linecap='round' opacity='.9'/%3E%3Ccircle cx='111' cy='130' r='20' fill='%23036b4d' stroke='%23baffdf' stroke-width='4'/%3E%3Cpath d='m102 130 7 7 13-16' fill='none' stroke='%23dffff0' stroke-width='4'/%3E%3Cpath d='M47 117q13 11 0 23M55 117q13 11 0 23' fill='none' stroke='%23baffdf' stroke-width='3' opacity='.9'/%3E%3C/svg%3E");
    }

    /* NORMATIVA — libro jurídico dorado + balanza */
    .quick-action--gold .quick-action-icon{
      background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 180 180'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop stop-color='%23fff7b0'/%3E%3Cstop offset='.3' stop-color='%23ffd34e'/%3E%3Cstop offset='.72' stop-color='%23a56b00'/%3E%3Cstop offset='1' stop-color='%234a2a00'/%3E%3C/linearGradient%3E%3Cfilter id='b'%3E%3CfeGaussianBlur stdDeviation='4' result='x'/%3E%3CfeMerge%3E%3CfeMergeNode in='x'/%3E%3CfeMergeNode in='SourceGraphic'/%3E%3C/feMerge%3E%3C/defs%3E%3Cpath d='M47 35h70l17 17v94H47z' fill='%237a5000' stroke='%23ffd95c' stroke-width='5' filter='url(%23b)'/%3E%3Cpath d='M38 27h70l17 17v94H38z' fill='url(%23g)' stroke='%23fff0a0' stroke-width='4'/%3E%3Cpath d='M52 45h48' stroke='%23fff1a2' stroke-width='4' opacity='.8'/%3E%3Ctext x='73' y='112' text-anchor='middle' font-family='Georgia,serif' font-size='66' font-weight='bold' fill='%23fff4b2' stroke='%237b5100' stroke-width='2'%3ES%3C/text%3E%3Cpath d='M23 54h134M90 54v79M70 133h40' stroke='%23ffd84e' stroke-width='5' stroke-linecap='round'/%3E%3Cpath d='M38 57 24 91h28ZM142 57l-14 34h28Z' fill='none' stroke='%23ffe784' stroke-width='4'/%3E%3Cpath d='M20 91q17 12 34 0M124 91q17 12 34 0' fill='none' stroke='%23ffd84e' stroke-width='4'/%3E%3C/svg%3E");
    }

    /* BARRA INFERIOR — exactamente cinco iconos, estilo lineal luminoso */
    .nav-icon{
      display:block!important;
      width:36px!important;height:36px!important;
      font-size:0!important;line-height:0!important;
      background-repeat:no-repeat!important;
      background-position:center!important;
      background-size:contain!important;
      color:transparent!important;
      text-shadow:none!important;
    }
    .nav-item:nth-child(1) .nav-icon{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cpath d='M12 30 32 12l20 18v23H12z' fill='none' stroke='%23d9f5ff' stroke-width='4' stroke-linejoin='round'/%3E%3Cpath d='M26 53V37h12v16' fill='none' stroke='%2387dfff' stroke-width='4'/%3E%3C/svg%3E")}
    .nav-item:nth-child(2) .nav-icon{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Ccircle cx='27' cy='27' r='16' fill='none' stroke='%23e4f5ff' stroke-width='4'/%3E%3Cpath d='m39 39 15 15' stroke='%23a8e9ff' stroke-width='5' stroke-linecap='round'/%3E%3C/svg%3E")}
    .nav-item:nth-child(3) .nav-icon{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cpath d='M18 9h28v44H18z' fill='none' stroke='%23e5f4ff' stroke-width='4'/%3E%3Cpath d='M24 20h16M24 29h16M24 38h11' stroke='%23b9e7ff' stroke-width='3' stroke-linecap='round'/%3E%3Ccircle cx='42' cy='46' r='8' fill='none' stroke='%23d9f4ff' stroke-width='3'/%3E%3C/svg%3E")}
    .nav-item:nth-child(4) .nav-icon{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cpath d='M32 11v38M20 51h24M16 18h32' stroke='%23e7f5ff' stroke-width='4' stroke-linecap='round'/%3E%3Cpath d='M23 19 14 39h18ZM41 19l-9 20h18Z' fill='none' stroke='%23d6eaff' stroke-width='3'/%3E%3C/svg%3E")}
    .nav-item:nth-child(5) .nav-icon{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cpath d='M25 8h14M32 8v7' stroke='%23e8f5ff' stroke-width='4' stroke-linecap='round'/%3E%3Cpath d='m32 22 4 4 6-2 2 6 6 3-3 6 3 6-6 2-2 6-6-3-6 3-2-6-6-2 3-6-3-6 6-3 2-6 6 2Z' fill='none' stroke='%23d9ecff' stroke-width='3'/%3E%3Ccircle cx='32' cy='39' r='7' fill='none' stroke='%2388cfff' stroke-width='3'/%3E%3C/svg%3E")}

    .nav-item.active .nav-icon{filter:drop-shadow(0 0 6px #2aaaff)}
    @media(max-width:520px){
      .quick-action-icon{width:104px!important;height:116px!important}
      .nav-icon{width:31px!important;height:31px!important}
    }
  `;
  (document.head || document.documentElement).appendChild(css);
})();
