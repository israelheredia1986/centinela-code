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
      body: JSON.stringify({ pregunta: pregunta, modo: "web_first" })
    });
    const datos = await respuesta.json();
    if (!respuesta.ok) {
      const error = datos?.error;
      if (typeof error === "string") return "Error IA: " + error;
      if (error?.message) return "Error IA: " + error.message;
      return "No se ha podido consultar Centinela IA.";
    }
    if (typeof datos?.text === "string" && datos.text.trim()) return datos.text.trim();
    return "La IA no devolvió una respuesta utilizable.";
  } catch (error) {
    console.error("Error conexión Centinela IA:", error);
    return "No se ha podido conectar con Centinela IA. Comprueba la conexión e inténtalo de nuevo.";
  }
}

// Restauración del icono de Normativa del dashboard.
(function restaurarIconoNormativa() {
  function aplicar() {
    if (document.getElementById("centinelaNormativaIconFix")) return;
    const style = document.createElement("style");
    style.id = "centinelaNormativaIconFix";
    style.textContent = `
      .nav-item[data-section="normativa"] .nav-icon {
        position: relative !important;
        font-size: 0 !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 34px !important;
        height: 34px !important;
        color: var(--ref-blue, #31b9ff) !important;
      }
      .nav-item[data-section="normativa"] .nav-icon:before {
        content: "§" !important;
        display: block !important;
        position: static !important;
        width: auto !important;
        height: auto !important;
        background: none !important;
        -webkit-mask-image: none !important;
        mask-image: none !important;
        -webkit-mask: none !important;
        mask: none !important;
        color: inherit !important;
        font-family: Arial, sans-serif !important;
        font-size: 30px !important;
        line-height: 1 !important;
        font-weight: 700 !important;
        text-shadow: 0 0 12px currentColor !important;
      }
    `;
    document.head.appendChild(style);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", aplicar, { once: true });
  } else {
    aplicar();
  }
})();

// Motor V5: Internet First + repositorio como fallback.
(function cargarIAV5() {
  function cargar() {
    if (document.getElementById("centinelaIAV5Script")) return;
    const script = document.createElement("script");
    script.id = "centinelaIAV5Script";
    script.src = "./centinela-ia-v4.js?v=20260905-internet-first-v5";
    script.async = false;
    script.onerror = () => console.warn("No se pudo cargar Centinela IA V5.");
    document.head.appendChild(script);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => setTimeout(cargar, 0), { once: true });
  else setTimeout(cargar, 0);
})();

// Limpieza de presentación.
(function cargarIALimpieza() {
  function cargar() {
    if (document.getElementById("centinelaIALimpiezaScript")) return;
    const script = document.createElement("script");
    script.id = "centinelaIALimpiezaScript";
    script.src = "./ia-limpieza.js?v=20260905-clean-v4";
    script.async = false;
    script.onerror = () => console.warn("No se pudo cargar la limpieza de presentación de Centinela IA.");
    document.head.appendChild(script);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => setTimeout(cargar, 50), { once: true });
  else setTimeout(cargar, 50);
})();

// Formato policial del chat.
(function cargarIAFormatoPolicial() {
  function cargar() {
    if (document.getElementById("centinelaIAFormatoPolicialScript")) return;
    const script = document.createElement("script");
    script.id = "centinelaIAFormatoPolicialScript";
    script.src = "./ia-policia-formato.js?v=20260905-police-format-v5";
    script.async = false;
    script.onerror = () => console.warn("No se pudo cargar el formato policial de Centinela IA.");
    document.head.appendChild(script);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => setTimeout(cargar, 100), { once: true });
  else setTimeout(cargar, 100);
})();

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
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => setTimeout(cargar, 0), { once: true });
  else setTimeout(cargar, 0);
})();
