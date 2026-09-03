/*
============================================================
CENTINELA CODE — MATRÍCULAS OPERATIVO
============================================================

Prioridad de consulta:
1. Supabase: si existe la tabla dgt_distintivo_ambiental.
2. Datos locales: ./data/dgt_distintivo_ambiental.json, si existe.
3. Comprobación oficial DGT: siempre disponible mediante enlace directo.

IMPORTANTE:
La DGT no ofrece una API REST pública para consultar por matrícula los
campos técnicos completos. Por eso este módulo NO inventa datos ni intenta
saltarse los servicios oficiales. Los datos que no estén disponibles se
marcan como no disponibles y se ofrece la consulta oficial DGT.
============================================================
*/

(() => {
  "use strict";

  let matriculaActualAvanzada = null;
  let ultimoVehiculo = null;
  let datosLocales = null;
  let cargaLocalIntentada = false;

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
      const encontrada = entradas.find(([k, v]) =>
        normKey(k) === objetivo &&
        v !== null &&
        v !== undefined &&
        String(v).trim() !== ""
      );
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

  function fuenteTexto(obj, origen = "DGT") {
    const fecha = primerValor(obj, [
      ["fecha_actualizacion"],
      ["fechaActualizacion"],
      ["updated_at"],
      ["actualizado"],
      ["fecha"]
    ]);
    return `Fuente: ${origen}${fecha ? ` · actualizado ${formatearFecha(fecha)}` : ""}`;
  }

  async function cargarDatosLocales() {
    if (cargaLocalIntentada) return datosLocales;
    cargaLocalIntentada = true;

    const urls = [
      "./data/dgt_distintivo_ambiental.json?v=20260904",
      "./data/dgt_matriculas.json?v=20260904"
    ];

    for (const url of urls) {
      try {
        const r = await fetch(url, { cache: "no-store" });
        if (!r.ok) continue;
        const json = await r.json();
        datosLocales = json;
        return datosLocales;
      } catch (_) {}
    }
    return null;
  }

  function buscarEnLocal(matricula, json) {
    if (!json) return null;

    const lista = Array.isArray(json)
      ? json
      : Array.isArray(json.vehiculos)
        ? json.vehiculos
        : Array.isArray(json.data)
          ? json.data
          : Array.isArray(json.rows)
            ? json.rows
            : null;

    if (lista) {
      return lista.find(x => normMatricula(
        primerValor(x, [["matricula"], ["matrícula"], ["plate"]])
      ) === matricula) || null;
    }

    if (typeof json === "object") {
      const directo = json[matricula] || json[matricula.toLowerCase()];
      if (directo && typeof directo === "object") return directo;
    }

    return null;
  }

  async function consultarSupabaseMatricula(matricula) {
    try {
      const cliente = window.CENTINELA_SUPABASE_CLIENT || window.supabase;
      if (!cliente || typeof cliente.from !== "function") {
        return { estado: "no_disponible" };
      }

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
      return { estado: "ok", data: consulta.data, origen: "DGT / base Centinela" };
    } catch (e) {
      console.warn("Error consultando matrícula:", e);
      return { estado: "no_disponible", error: e };
    }
  }

  function etiquetaDistintivo(v) {
    const d = String(v || "").trim().toUpperCase();
    if (!d) return "";
    if (d === "A") return "SIN DISTINTIVO";
    if (d === "0" || d === "CERO" || d === "0 EMISIONES" || d === "CERO EMISIONES") return "0 EMISIONES";
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
      distintivo: etiquetaDistintivo(primerValor(obj, [["distintivo"], ["distintivo_ambiental"], ["etiqueta_ambiental"], ["categoria_ambiental"]]))
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
      ${filas.length
        ? `<div class="matriculas-extra-grid">${filas.map(([k,val]) => `<div class="matriculas-extra-row"><span>${escapeHtml(k)}</span><strong>${escapeHtml(val)}</strong></div>`).join("")}</div>`
        : `<p class="matriculas-extra-empty">No hay datos técnicos adicionales en las fuentes conectadas.</p>`}
      <div class="matriculas-extra-source">${escapeHtml(fuente)}</div>
    `;
  }

  function insertarAcciones() {
    const resultado = $m("matriculasResult");
    if (!resultado) return;

    let acciones = $m("matriculasAccionesDgt");
    if (!acciones) {
      acciones = document.createElement("div");
      acciones.id = "matriculasAccionesDgt";
      acciones.className = "matriculas-dgt-actions";
      const crear = $m("matriculaCrearActaBtn");
      resultado.insertBefore(acciones, crear || resultado.lastElementChild);
    }

    acciones.innerHTML = `
      <button type="button" class="secondary-button" id="matriculaConsultarDgtBtn">🌐 Comprobar matrícula en DGT</button>
      <button type="button" class="secondary-button" id="matriculaCopiarBtn">📋 Copiar matrícula</button>
    `;

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
      } catch (_) {
        if (typeof window.mostrarToast === "function") window.mostrarToast("No se pudo copiar automáticamente");
      }
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
    if (fuente) fuente.textContent = "Consultando fuentes disponibles…";
    if (zbe) zbe.textContent = "—";

    // 1. Fuente principal: Supabase.
    let consulta = await consultarSupabaseMatricula(matricula);

    // 2. Fallback: fichero local si existe.
    if (consulta.estado !== "ok") {
      const local = await cargarDatosLocales();
      const encontrado = buscarEnLocal(matricula, local);
      if (encontrado) {
        consulta = { estado: "ok", data: encontrado, origen: "DGT / datos locales de Centinela" };
      }
    }

    if (consulta.estado === "ok") {
      ultimoVehiculo = datosVehiculo(consulta.data);
      const d = ultimoVehiculo.distintivo || "SIN DATO";

      if (distintivo) distintivo.textContent = d;
      if (fuente) fuente.textContent = fuenteTexto(consulta.data, consulta.origen || "DGT");

      if (zbe) {
        if (typeof window.textoZbePorDistintivo === "function") {
          zbe.textContent = window.textoZbePorDistintivo(d);
        } else {
          zbe.textContent = d && d !== "SIN DATO"
            ? `Comprobar restricciones ZBE según distintivo ${d}.`
            : "Consultar restricciones ZBE en la ordenanza municipal aplicable.";
        }
      }

      const mm = $m("matriculaMarcaModelo");
      const cb = $m("matriculaCombustible");
      if (mm) mm.value = [ultimoVehiculo.marca, ultimoVehiculo.modelo].filter(Boolean).join(" ");
      if (cb) cb.value = ultimoVehiculo.combustible || "";

      insertarPanelDatos(ultimoVehiculo, fuenteTexto(consulta.data, consulta.origen || "DGT"));
    } else {
      if (distintivo) distintivo.textContent = "No disponible en la fuente conectada";
      if (fuente) fuente.textContent = "No se ha encontrado la matrícula en la base local/conectada. La comprobación oficial DGT sigue disponible.";
      if (zbe) zbe.textContent = "La clasificación ambiental debe comprobarse oficialmente en DGT.";

      const mm = $m("matriculaMarcaModelo");
      const cb = $m("matriculaCombustible");
      if (mm) mm.value = "";
      if (cb) cb.value = "";

      insertarPanelDatos({}, "Sin datos técnicos cargados. Fuente oficial disponible mediante el botón DGT.");
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

  // app.js utiliza estas funciones globales desde sus listeners.
  window.buscarMatricula = buscarMatriculaAvanzada;
  window.crearActaDesdeMatricula = crearActaAvanzada;
  window.CENTINELA_MATRICULAS_READY = true;
  document.documentElement.dataset.centinelaMatriculas = "operativo";
})();
