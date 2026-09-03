/* CENTINELA CODE - MATRÍCULAS AUTOMÁTICAS */
(() => {
  "use strict";

  let matriculaActual = "";
  let vehiculoActual = {};
  let datosLocales = null;
  let localCargado = false;
  const $ = id => document.getElementById(id);

  function norm(v) { return String(v || "").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^0-9A-Z]/g, ""); }
  function valida(v) { return /^\d{4}[BCDFGHJKLMNPRSTVWXYZ]{3}$/.test(v); }
  function escapeHtml(v) { return String(v ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#039;"); }
  function clave(v) { return String(v || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, ""); }
  function valor(obj, nombres) {
    if (!obj || typeof obj !== "object") return "";
    const entradas = Object.entries(obj);
    for (const nombre of nombres) {
      const k = clave(nombre);
      const hit = entradas.find(([a,b]) => clave(a) === k && b !== null && b !== undefined && String(b).trim() !== "");
      if (hit) return hit[1];
    }
    return "";
  }
  function fecha(v) {
    if (!v) return "";
    const m = String(v).match(/^(\d{4})[-/]?(\d{2})[-/]?(\d{2})/);
    return m ? `${m[3]}/${m[2]}/${m[1]}` : String(v);
  }
  function distintivoTexto(v) {
    const d = String(v || "").trim().toUpperCase();
    if (!d) return "";
    if (d === "A") return "SIN DISTINTIVO";
    if (d === "0" || d === "CERO" || d.includes("0 EMISION")) return "0 EMISIONES";
    return d;
  }
  function mostrarError(texto) {
    const e = $("matriculaError");
    if (!e) return;
    e.textContent = texto || "";
    e.classList.toggle("hidden", !texto);
  }

  async function consultarDgtOnline(matricula) {
    try {
      const cliente = window.CENTINELA_SUPABASE_CLIENT || window.supabase;
      if (!cliente?.functions || typeof cliente.functions.invoke !== "function") return null;
      const r = await cliente.functions.invoke("dgt-distintivo-live", { body: { matricula } });
      if (r.error) { console.warn("Centinela DGT Edge Function:", r.error); return null; }
      return r.data && r.data.ok ? r.data : null;
    } catch (e) { console.warn("No se pudo consultar DGT online:", e); return null; }
  }

  async function cargarLocal() {
    if (localCargado) return datosLocales;
    localCargado = true;
    for (const url of ["./data/dgt_distintivo_ambiental.json?v=20260904", "./data/dgt_matriculas.json?v=20260904"]) {
      try {
        const r = await fetch(url, { cache: "no-store" });
        if (!r.ok) continue;
        datosLocales = await r.json();
        return datosLocales;
      } catch (_) {}
    }
    return null;
  }
  function buscarLocal(matricula, json) {
    if (!json) return null;
    const lista = Array.isArray(json) ? json : (Array.isArray(json.vehiculos) ? json.vehiculos : (Array.isArray(json.data) ? json.data : (Array.isArray(json.rows) ? json.rows : null)));
    if (lista) return lista.find(x => norm(valor(x,["matricula","matrícula","plate"])) === matricula) || null;
    if (typeof json === "object" && json[matricula]) return json[matricula];
    return null;
  }

  function normalizarVehiculo(obj, matricula, distintivo) {
    return {
      matricula,
      marca: valor(obj,["marca","brand"]),
      modelo: valor(obj,["modelo","model","modelodescription","modelo_itv"]),
      fechaMatriculacion: valor(obj,["fecha_matriculacion","fechaMatriculacion","fecha_primera_matriculacion","fechaPrimeraMatriculacion","registrationDate"]),
      combustible: valor(obj,["combustible","carburante","fuel","fuelType"]),
      cilindrada: valor(obj,["cilindrada","engine_displacement","engineSize"]),
      potenciaFiscal: valor(obj,["potencia_fiscal","potenciaFiscal"]),
      potenciaNeta: valor(obj,["potencia_neta_maxima","potenciaNetaMaxima","dynamicPower"]),
      color: valor(obj,["color"]),
      plazas: valor(obj,["plazas","plazas_sentadas","plazasSentadas","seats"]),
      tara: valor(obj,["tara"]),
      mma: valor(obj,["mma","masa_maxima","masaMaxima"]),
      tipo: valor(obj,["tipo_vehiculo","tipoVehiculo","tipo","vehicleType"]),
      distintivo: distintivoTexto(distintivo || valor(obj,["distintivo","distintivo_ambiental","etiqueta_ambiental","categoria_ambiental"]))
    };
  }

  function configurarCamposAutomaticos() {
    const pares = [
      ["matriculaMarcaModelo", "Marca / modelo"],
      ["matriculaCombustible", "Combustible"]
    ];
    for (const [id, titulo] of pares) {
      const input = $(id);
      if (!input) continue;
      const cont = input.closest(".matriculas-field");
      if (!cont) continue;
      input.style.display = "none";
      let valorEl = cont.querySelector(".matriculas-auto-value");
      if (!valorEl) {
        valorEl = document.createElement("span");
        valorEl.className = "matriculas-field-value matriculas-auto-value";
        cont.appendChild(valorEl);
      }
      const label = cont.querySelector(".matriculas-field-label");
      if (label) label.textContent = titulo + " · automático";
    }
  }

  function pintar(v, fuente) {
    const r = $("matriculasResult");
    if (!r) return;
    r.classList.remove("hidden");
    configurarCamposAutomaticos();

    if ($("matriculasResultPlate")) $("matriculasResultPlate").textContent = `${v.matricula.slice(0,4)} ${v.matricula.slice(4)}`;
    if ($("matriculasDistintivo")) $("matriculasDistintivo").textContent = v.distintivo || "SIN DATO";
    if ($("matriculasDistintivoFuente")) $("matriculasDistintivoFuente").textContent = fuente || "Fuente: DGT";

    const mm = r.querySelector("#matriculaMarcaModelo")?.closest(".matriculas-field")?.querySelector(".matriculas-auto-value");
    const cc = r.querySelector("#matriculaCombustible")?.closest(".matriculas-field")?.querySelector(".matriculas-auto-value");
    if (mm) mm.textContent = [v.marca,v.modelo].filter(Boolean).join(" ") || "No disponible en la fuente técnica conectada";
    if (cc) cc.textContent = v.combustible || "No disponible en la fuente técnica conectada";

    if ($("matriculasZbe")) {
      if (typeof window.textoZbePorDistintivo === "function") $("matriculasZbe").textContent = window.textoZbePorDistintivo(v.distintivo || "");
      else $("matriculasZbe").textContent = v.distintivo ? `Aplicar las restricciones ZBE correspondientes al distintivo ${v.distintivo}.` : "Comprobar la ZBE municipal aplicable.";
    }

    let panel = $("matriculasDatosDgt");
    if (!panel) {
      panel = document.createElement("div");
      panel.id = "matriculasDatosDgt";
      panel.className = "matriculas-dgt-extra";
      const ref = r.querySelector(".matriculas-disclaimer");
      r.insertBefore(panel, ref || r.lastElementChild);
    }
    const filas = [
      ["Marca",v.marca],["Modelo",v.modelo],["Fecha 1ª matriculación",fecha(v.fechaMatriculacion)],["Combustible",v.combustible],
      ["Cilindrada",v.cilindrada],["Potencia fiscal",v.potenciaFiscal],["Potencia neta máxima",v.potenciaNeta],["Color",v.color],
      ["Plazas",v.plazas],["Tara",v.tara],["MMA",v.mma],["Tipo de vehículo",v.tipo]
    ].filter(x => x[1] !== "" && x[1] !== null && x[1] !== undefined);
    panel.innerHTML = `<div class="matriculas-extra-title">🚗 Datos disponibles del vehículo</div>${filas.length ? `<div class="matriculas-extra-grid">${filas.map(x => `<div class="matriculas-extra-row"><span>${escapeHtml(x[0])}</span><strong>${escapeHtml(x[1])}</strong></div>`).join("")}</div>` : `<p class="matriculas-extra-empty">No se han podido obtener todavía datos técnicos adicionales.</p>`}<div class="matriculas-extra-source">${escapeHtml(fuente || "DGT")}</div>`;
    insertarAcciones();
    r.scrollIntoView({behavior:"smooth",block:"start"});
  }

  function insertarAcciones() {
    const r = $("matriculasResult");
    if (!r) return;
    let a = $("matriculasAccionesDgt");
    if (!a) {
      a = document.createElement("div");
      a.id = "matriculasAccionesDgt";
      a.className = "matriculas-dgt-actions";
      const crear = $("matriculaCrearActaBtn");
      r.insertBefore(a, crear || r.lastElementChild);
    }
    a.innerHTML = `<button type="button" class="secondary-button" id="matriculaConsultarDgtBtn">🌐 Comprobar en DGT</button><button type="button" class="secondary-button" id="matriculaCopiarBtn">📋 Copiar matrícula</button>`;
    $("matriculaConsultarDgtBtn")?.addEventListener("click",()=>{if(matriculaActual)window.open(`https://sede.dgt.gob.es/es/vehiculos/informacion-de-vehiculos/distintivo-ambiental/index.html?matricula=${encodeURIComponent(matriculaActual)}`,"_blank","noopener,noreferrer")});
    $("matriculaCopiarBtn")?.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(`${matriculaActual.slice(0,4)} ${matriculaActual.slice(4)}`)}catch(_){}});
  }

  async function buscar() {
    const input = $("matriculaInput"), r = $("matriculasResult");
    if (!input || !r) return;
    mostrarError("");
    const matricula = norm(input.value);
    if (!valida(matricula)) { mostrarError("Matrícula no válida. Introduce 4 números y 3 consonantes, por ejemplo 1234 BCD."); r.classList.add("hidden"); return; }
    matriculaActual = matricula;
    if ($("matriculasResultPlate")) $("matriculasResultPlate").textContent = `${matricula.slice(0,4)} ${matricula.slice(4)}`;
    if ($("matriculasDistintivo")) $("matriculasDistintivo").textContent = "Consultando…";
    if ($("matriculasDistintivoFuente")) $("matriculasDistintivoFuente").textContent = "Consultando DGT y fuente técnica…";
    r.classList.remove("hidden");

    const online = await consultarDgtOnline(matricula);
    if (online && (online.modelo || online.marca || online.combustible)) {
      vehiculoActual = normalizarVehiculo(online, matricula, online.distintivo);
      pintar(vehiculoActual, `Fuente: DGT + datos técnicos · ${fecha(online.fecha_consulta)}`);
      return;
    }

    try {
      const cliente = window.CENTINELA_SUPABASE_CLIENT || window.supabase;
      if (cliente && typeof cliente.from === "function") {
        const q = await cliente.from("dgt_distintivo_ambiental").select("*").eq("matricula",matricula).maybeSingle();
        if (!q.error && q.data) { vehiculoActual = normalizarVehiculo(q.data,matricula); pintar(vehiculoActual,"Fuente: DGT · base Centinela"); return; }
      }
    } catch (_) {}

    const local = buscarLocal(matricula, await cargarLocal());
    if (local) { vehiculoActual = normalizarVehiculo(local,matricula); pintar(vehiculoActual,"Fuente: DGT · datos locales"); return; }

    vehiculoActual = normalizarVehiculo(online || {}, matricula, online?.distintivo || "");
    pintar(vehiculoActual, online?.distintivo ? "Fuente: DGT · distintivo ambiental" : "Sin fuente técnica automática");
  }

  function crearActa() {
    const datos = vehiculoActual || {matricula:matriculaActual};
    const marcaModelo = [datos.marca,datos.modelo].filter(Boolean).join(" ");
    const combustible = datos.combustible || "";
    const partes = [`Matrícula: ${matriculaActual}`];
    if (marcaModelo) partes.push(`Marca/modelo: ${marcaModelo}`);
    if (combustible) partes.push(`Combustible: ${combustible}`);
    if (datos.distintivo) partes.push(`Distintivo ambiental: ${datos.distintivo}`);
    const texto = partes.join("\n");
    if (typeof window.crearActaDesdeTexto === "function") window.crearActaDesdeTexto(texto);
    else if (typeof window.navegarASeccion === "function") window.navegarASeccion("actas");
    else document.querySelector('[data-target="actas"]')?.click();
  }

  function configurar() {
    configurarCamposAutomaticos();
    $("matriculaBuscarBtn")?.addEventListener("click",buscar);
    $("matriculaInput")?.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();buscar()}});
    $("matriculaCrearActaBtn")?.addEventListener("click",crearActa);
    $("matriculasHomeCardBtn")?.addEventListener("click",()=>{if(typeof window.navegarASeccion==="function")window.navegarASeccion("matriculas")});
    window.buscarMatricula=buscar;
    window.CENTINELA_MATRICULAS_READY=true;
    document.documentElement.dataset.centinelaMatriculas="operativo";
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",configurar,{once:true});else configurar();
})();
