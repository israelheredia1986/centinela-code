/*
============================================================
CENTINELA CODE - MÓDULO MATRÍCULAS AVANZADO
============================================================

Objetivo:
- Reutilizar la pantalla Matrículas existente.
- Consultar todos los campos disponibles en Supabase.
- No inventar datos cuando una fuente no los proporciona.
- Mostrar claramente la fuente y fecha del dato.
- Facilitar la comprobación oficial en DGT.
- Pasar los datos disponibles al acta.

La DGT permite consultar gratuitamente el distintivo ambiental por matrícula.
Los datos técnicos/administrativos completos requieren fuentes autorizadas.
============================================================
*/

(() => {
  "use strict";

  let matriculaActualAvanzada = null;
  let ultimoVehiculo = null;

  const $m = id => document.getElementById(id);

  function normMatricula(v) {
    return String(v || "")
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^0-9A-Z]/g, "");
  }

  function matriculaValida(m) {
    return /^[0-9]{4}[BCDFGHJKLMNPRSTVWXYZ]{3}$/.test(m);
  }

  function escapeHtml(v) {
    return String(v ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function mostrarError(msg) {
    const el = $m("matriculaError");
    if (!el) return;
    el.textContent = msg || "";
    el.classList.toggle("hidden", !msg);
  }

  function obtener(obj, claves) {
    if (!obj || typeof obj !== "object") return "";
    const entradas = Object.entries(obj);
    for (const clave of claves) {
      const objetivo = normKey(clave);
      const encontrada = entradas.find(([k, v]) => normKey(k) === objetivo && v !== null && v !== undefined && String(v).trim() !== "");
      if (encontrada) return encontrada[1];
    }
    return "";
  }

  function normKey(v) {
    return String(v || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");
  }

  function primerValor(obj, grupos) {
    for (const grupo of grupos) {
      const valor = obtener(obj, grupo);
      if (valor !== "") return valor;
    }
    return "";
  }

  function formatearFecha(v) {
    if (!v) return "";
    const s = String(v);
    const m = s.match(/^(\d{4})[-/]?(\d{2})[-/]?(\d{2})/);
    if (m) return `${m[3]}/${m[2]}/${m[1]}`;
    return s;
  }

  function fuenteTexto(obj) {
    const fecha = primerValor(obj, [["fecha_actualizacion"], ["fechaActualizacion"], ["updated_at"], ["actualizado"], ["fecha"]]);
    return `Fuente: DGT / datos cargados en Centinela${fecha ? ` · actualizado ${formatearFecha(fecha)}` : ""}`;
  }

  async function consultarSupabaseMatricula(matricula) {
    try {
      const cliente = window.CENTINELA_SUPABASE_CLIENT || window.supabase;
      if (!cliente || typeof cliente.from !== "function") return { estado: "no_disponible" };

      const consulta = await cliente
        .from("dgt_distintivo_ambiental")
        .select("*")
        .eq("matricula", matricula)
        .maybeSingle();

      if (consulta.error) {
        console.warn("Matrículas DGT/Supabase:", consulta.error.message || consulta.error);
        return { estado: "no_disponible", error: consulta.error };
      }

      if (!consulta.data) return { estado: "sin_dato" };
      return { estado: "ok", data: consulta.data };
    } catch (e) {
      console.warn("Error consultando matrícula:", e);
      return { estado: "no_disponible", error: e };
    }
  }

  function etiquetaDistintivo(v) {
    const d = String(v || "").trim().toUpperCase();
    if (!d) return "";
    if (d === "0" || d === "CERO" || d === "SIN DISTINTIVO" || d === "SIN DISTINTIVO AMBIENTAL") return "SIN DISTINTIVO";
    return d;
  }

  function datosVehiculo(obj) {
    return {
      matricula: primerValor(obj, [["matricula"], ["matrícula"], ["plate"]]),
      fechaMatriculacion: primerValor(obj, [["fecha_matriculacion"], ["fechaMatriculacion"], ["fecha_primera_matriculacion"], ["fechaPrimeraMatriculacion"]]),
      marca: primerValor(obj, [["marca"], ["brand"]]),
      modelo: primerValor(obj, [["modelo"], ["model"]]),
      combustible: primerValor(obj, [["combustible"], ["carburante"], ["fuel"]]),
      cilindrada: primerValor(obj, [["cilindrada"], ["engine_displacement"]]),
      color: primerValor(obj, [["color"]]),
      potenciaFiscal: primerValor(obj, [["potencia_fiscal"], ["potenciaFiscal"]]),
      potenciaNeta: primerValor(obj, [["potencia_neta_maxima"], ["potenciaNetaMaxima"]]),
      tara: primerValor(obj, [["tara"]]),
      mma: primerValor(obj, [["mma"], ["masa_maxima"], ["masaMaxima"]]),
      plazas: primerValor(obj, [["plazas"], ["plazas_sentadas"], ["plazasSentadas"]]),
      distintivo: etiquetaDistintivo(primerValor(obj, [["distintivo"], ["distintivo_ambiental"], ["etiqueta_ambiental"]]))
    };
  }

  function insertarPanelDatos(v, fuente) {
    const resultado = $m("matriculasResult");
    if (!resultado) return;

    let panel = $m("matriculasDatosDgt");
    if (!panel) {
      panel = document.createElement("div");
      panel.id = "matriculasDatosDgt";
      panel.className = "matriculas-dgt-extra";
      const disclaimer = resultado.querySelector(".matriculas-disclaimer");
      resultado.insertBefore(panel, disclaimer || resultado.lastElementChild);
    }

    const filas = [
      ["Marca", v.marca],
      ["Modelo", v.modelo],
      ["Fecha de matriculación", formatearFecha(v.fechaMatriculacion)],
      ["Combustible", v.combustible],
      ["Cilindrada", v.cilindrada],
      ["Color", v.color],
      ["Potencia fiscal", v.potenciaFiscal],
      ["Potencia neta máxima", v.potenciaNeta],
      ["Tara", v.tara],
      ["MMA", v.mma],
      ["Plazas", v.plazas]
    ].filter(([, valor]) => valor !== "" && valor !== null && valor !== undefined);

    panel.innerHTML = `
      <div class="matriculas-extra-title">🚗 Datos disponibles del vehículo</div>
      ${filas.length ? `<div class="matriculas-extra-grid">${filas.map(([k,val]) => `<div class="matriculas-extra-row"><span>${escapeHtml(k)}</span><strong>${escapeHtml(val)}</strong></div>`).join("")}</div>` : `<p class="matriculas-extra-empty">La fuente cargada no contiene todavía datos técnicos adicionales para esta matrícula.</p>`}
      <div class="matriculas-extra-source">${escapeHtml(fuente)}</div>
    `;
  }

  function insertarAcciones() {
    const resultado = $m("matriculasResult");
    if (!resultado) return;
    let acciones = $m("matriculasAccionesDgt");
    if (acciones) return;

    acciones = document.createElement("div");
    acciones.id = "matriculasAccionesDgt";
    acciones.className = "matriculas-dgt-actions";
    acciones.innerHTML = `
      <button type="button" class="secondary-button" id="matriculaConsultarDgtBtn">🌐 Comprobar en DGT</button>
      <button type="button" class="secondary-button" id="matriculaCopiarBtn">📋 Copiar matrícula</button>
    `;
    const crear = $m("matriculaCrearActaBtn");
    resultado.insertBefore(acciones, crear || resultado.lastElementChild);

    $m("matriculaConsultarDgtBtn")?.addEventListener("click", () => {
      if (!matriculaActualAvanzada) return;
      const url = `https://sede.dgt.gob.es/es/vehiculos/informacion-de-vehiculos/distintivo-ambiental/index.html?matricula=${encodeURIComponent(matriculaActualAvanzada)}`;
      window.open(url, "_blank", "noopener,noreferrer");
    });

    $m("matriculaCopiarBtn")?.addEventListener("click", async () => {
      if (!matriculaActualAvanzada) return;
      try {
        await navigator.clipboard.writeText(`${matriculaActualAvanzada.slice(0,4)} ${matriculaActualAvanzada.slice(4)}`);
        if (typeof window.mostrarToast === "function") window.mostrarToast("Matrícula copiada");
      } catch (_) {}
    });
  }

  async function buscarMatriculaAvanzada() {
    const input = $m("matriculaInput");
    const resultado = $m("matriculasResult");
    if (!input || !resultado) return;

    const matricula = normMatricula(input.value);
    mostrarError("");

    if (!matriculaValida(matricula)) {
      mostrarError("Formato no reconocido. Usa 4 números + 3 consonantes (ej. 1234 BCD).");
      resultado.classList.add("hidden");
      return;
    }

    matriculaActualAvanzada = matricula;
    ultimoVehiculo = null;

    const plate = $m("matriculasResultPlate");
    if (plate) plate.textContent = `${matricula.slice(0,4)} ${matricula.slice(4)}`;

    const distintivo = $m("matriculasDistintivo");
    const fuente = $m("matriculasDistintivoFuente");
    const zbe = $m("matriculasZbe");

    if (distintivo) distintivo.textContent = "Consultando…";
    if (fuente) fuente.textContent = "";
    if (zbe) zbe.textContent = "—";

    const consulta = await consultarSupabaseMatricula(matricula);

    if (consulta.estado === "ok") {
      ultimoVehiculo = datosVehiculo(consulta.data);
      const d = ultimoVehiculo.distintivo || "SIN DATO";
      if (distintivo) distintivo.textContent = d;
      if (fuente) fuente.textContent = fuenteTexto(consulta.data);

      if (zbe) {
        if (typeof window.textoZbePorDistintivo === "function") {
          zbe.textContent = window.textoZbePorDistintivo(d);
        } else {
          zbe.textContent = d ? `Comprobar restricciones ZBE según distintivo ${d}.` : "—";
        }
      }

      const mm = $m("matriculaMarcaModelo");
      const cb = $m("matriculaCombustible");
      if (mm) mm.value = [ultimoVehiculo.marca, ultimoVehiculo.modelo].filter(Boolean).join(" ");
      if (cb) cb.value = ultimoVehiculo.combustible || "";

      insertarPanelDatos(ultimoVehiculo, fuenteTexto(consulta.data));
    } else {
      if (distintivo) distintivo.textContent = consulta.estado === "sin_dato" ? "Sin resultado en los datos cargados" : "No disponible todavía";
      if (fuente) fuente.textContent = consulta.estado === "sin_dato"
        ? "La base local de Centinela no contiene esta matrícula. Puedes comprobarla directamente en la DGT."
        : "No se pudo consultar la fuente local de datos DGT.";
      if (zbe) zbe.textContent = "Consulta oficial DGT disponible mediante el botón de comprobación.";

      const mm = $m("matriculaMarcaModelo");
      const cb = $m("matriculaCombustible");
      if (mm) mm.value = "";
      if (cb) cb.value = "";

      insertarPanelDatos({}, "Sin datos técnicos adicionales cargados para esta matrícula.");
    }

    insertarAcciones();
    resultado.classList.remove("hidden");
    resultado.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function crearActaAvanzada() {
    if (!matriculaActualAvanzada) return;

    const mm = ($m("matriculaMarcaModelo")?.value || "").trim();
    const cb = ($m("matriculaCombustible")?.value || "").trim();
    const distintivo = ($m("matriculasDistintivo")?.textContent || "").trim();
    const v = ultimoVehiculo || {};

    const lineas = [`Vehículo con matrícula ${matriculaActualAvanzada.slice(0,4)} ${matriculaActualAvanzada.slice(4)}.`];
    if (mm) lineas.push(`Marca/modelo: ${mm}.`);
    if (cb) lineas.push(`Combustible: ${cb}.`);
    if (v.fechaMatriculacion) lineas.push(`Fecha de matriculación: ${formatearFecha(v.fechaMatriculacion)}.`);
    if (v.cilindrada) lineas.push(`Cilindrada: ${v.cilindrada}.`);
    if (v.color) lineas.push(`Color: ${v.color}.`);
    if (distintivo && !/no disponible|consultando|sin resultado|sin dato/i.test(distintivo)) {
      lineas.push(`Distintivo ambiental: ${distintivo}.`);
    }

    if (typeof window.abrirEditorActa === "function") {
      window.abrirEditorActa({ hechos: lineas.join(" ") });
    } else if (typeof window.mostrarToast === "function") {
      window.mostrarToast("Datos preparados para el acta");
    }
  }

  // Sobrescribe las funciones globales que ya utiliza app.js.
  window.buscarMatricula = buscarMatriculaAvanzada;
  window.crearActaDesdeMatricula = crearActaAvanzada;

  // Si app.js ya había creado el resultado, mantenemos el módulo listo.
  document.documentElement.dataset.centinelaMatriculas = "avanzado";
})();
