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
// ia.js se carga antes de app.js. Esperamos a que app.js termine
// su inicialización y después cargamos el módulo de matrículas.
// De este modo no es necesario alterar index.html ni app.js.
(function cargarModuloMatriculas() {
  function cargar() {
    if (document.getElementById("centinelaMatriculasScript")) return;

    const script = document.createElement("script");
    script.id = "centinelaMatriculasScript";
    script.src = "./matriculas.js?v=20260904-matriculas";
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
