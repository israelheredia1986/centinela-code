/* 
============================================================ 
CENTINELA CODE 
app.js - Con Supabase Auth + Actas + Subida de Fotos Incautación + PDF + Asistente IA
============================================================ 
*/ 

"use strict";

// ============================================================
// SUPABASE – Configuración y Cliente de Respaldo Safe
// ============================================================
const SUPABASE_URL  = "https://okuygqbaliaeavhyezri.supabase.co";
const SUPABASE_ANON = "sb_publishable_fbEAcJZxMv8PD3VB3Bcx6A_l_8BdP2m";

var supabase = window.CENTINELA_SUPABASE_CLIENT || (window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON)
  : {
      auth: {
        getSession: async () => ({ data: { session: null } }),
        signInWithPassword: async () => ({ error: { message: "Supabase no disponible" } }),
        signUp: async () => ({ error: { message: "Supabase no disponible" } }),
        signOut: async () => ({})
      },
      from: () => ({
        select: () => ({ eq: () => ({ order: async () => ({ data: [], error: null }) }) }),
        upsert: async () => ({ error: null }),
        delete: () => ({ eq: () => ({ eq: async () => ({ error: null }) }) })
      }),
      storage: {
        from: () => ({
          upload: async () => ({ error: new Error("Storage no configurado") }),
          getPublicUrl: () => ({ data: { publicUrl: "" } })
        })
      }
    });

window.CENTINELA_SUPABASE_CLIENT = supabase;

// ============================================================
// AUTH HELPERS
// ============================================================
let usuarioActual = null;

async function obtenerSesion() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    usuarioActual = session?.user ?? null;
    return usuarioActual;
  } catch (e) {
    console.warn("Error comprobando sesión:", e);
    return null;
  }
}

async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  usuarioActual = data.user;
  return data.user;
}

async function registro(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  mostrarToast("Revisa tu correo para confirmar el registro.");
  return data.user;
}

async function cerrarSesion() {
  await supabase.auth.signOut();
  usuarioActual = null;
  mostrarPantallaLogin();
}

// ============================================================
// PANTALLA DE LOGIN
// ============================================================
function inyectarPantallaLogin() {
  if (document.getElementById("loginScreen")) return;
  const div = document.createElement("div");
  div.id = "loginScreen";
  div.style.cssText = `
    position:fixed;inset:0;z-index:9999;
    display:flex;align-items:center;justify-content:center;
    background:var(--color-bg, #0d1117);
  `;
  div.innerHTML = `
    <div style="
      background:var(--color-surface, #161b22);
      border:1px solid var(--color-border, #30363d);
      border-radius:12px;padding:2rem;width:min(360px,90vw);
      display:flex;flex-direction:column;gap:1rem;
    ">
      <div style="text-align:center;margin-bottom:.5rem;">
        <div style="font-size:2rem;">🛡️</div>
        <h2 style="margin:0;font-size:1.2rem;color:var(--color-text,#e6edf3);">Centinela Code</h2>
        <p style="margin:.25rem 0 0;font-size:.8rem;color:var(--color-muted,#8b949e);">Acceso para agentes</p>
      </div>

      <input id="loginEmail" type="email" placeholder="Correo electrónico"
        style="padding:.65rem .9rem;border-radius:8px;border:1px solid var(--color-border,#30363d);
        background:var(--color-bg,#0d1117);color:var(--color-text,#e6edf3);font-size:.95rem;width:100%;box-sizing:border-box;" />

      <input id="loginPassword" type="password" placeholder="Contraseña"
        style="padding:.65rem .9rem;border-radius:8px;border:1px solid var(--color-border,#30363d);
        background:var(--color-bg,#0d1117);color:var(--color-text,#e6edf3);font-size:.95rem;width:100%;box-sizing:border-box;" />

      <button id="loginBtn"
        style="padding:.75rem;border-radius:8px;border:none;background:var(--color-accent,#1f6feb);
        color:#fff;font-size:1rem;cursor:pointer;font-weight:600;">
        Entrar
      </button>

      <button id="registroBtn"
        style="padding:.75rem;border-radius:8px;border:1px solid var(--color-border,#30363d);
        background:transparent;color:var(--color-muted,#8b949e);font-size:.9rem;cursor:pointer;">
        Crear cuenta nueva
      </button>

      <p id="loginError" style="color:#f85149;font-size:.85rem;text-align:center;margin:0;display:none;"></p>
    </div>
  `;
  document.body.appendChild(div);

  document.getElementById("loginBtn")?.addEventListener("click", async () => {
    const email    = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    const errEl    = document.getElementById("loginError");
    errEl.style.display = "none";
    try {
      await login(email, password);
      ocultarPantallaLogin();
      await iniciarAplicacion();
    } catch (e) {
      errEl.textContent = e.message || "Error al iniciar sesión.";
      errEl.style.display = "block";
    }
  });

  document.getElementById("registroBtn")?.addEventListener("click", async () => {
    const email    = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    const errEl    = document.getElementById("loginError");
    errEl.style.display = "none";
    try {
      await registro(email, password);
    } catch (e) {
      errEl.textContent = e.message || "Error al registrar.";
      errEl.style.display = "block";
    }
  });

  document.getElementById("loginPassword")?.addEventListener("keydown", e => {
    if (e.key === "Enter") document.getElementById("loginBtn")?.click();
  });
}

function mostrarPantallaLogin() {
  inyectarPantallaLogin();
  const el = document.getElementById("loginScreen");
  if (el) el.style.display = "flex";
}

function ocultarPantallaLogin() {
  const el = document.getElementById("loginScreen");
  if (el) el.style.display = "none";
}

function inyectarBotonLogout() {
  const seccionAjustes = document.getElementById("section-ajustes");
  if (!seccionAjustes || document.getElementById("logoutBtn")) return;
  const wrapper = document.createElement("div");
  wrapper.style.cssText = "padding:1rem 1rem 0;";
  wrapper.innerHTML = `
    <button id="logoutBtn" style="
      width:100%;padding:.75rem;border-radius:8px;
      border:1px solid #f85149;background:transparent;
      color:#f85149;font-size:.95rem;cursor:pointer;font-weight:600;
    ">Cerrar sesión</button>
    <p style="text-align:center;font-size:.8rem;color:var(--color-muted,#8b949e);margin:.5rem 0 0;">
      ${usuarioActual?.email ?? ""}
    </p>
  `;
  seccionAjustes.insertBefore(wrapper, seccionAjustes.firstChild);
  document.getElementById("logoutBtn")?.addEventListener("click", cerrarSesion);
} 

// ============================================================
// CONFIGURACIÓN Y ESTADO DE LA APLICACIÓN
// ============================================================
const CONFIG = { 
  VERSION: "1.4.1", 
  RUTAS: { 
    infracciones: "./data/infracciones.json", 
    infraccionesTrafico: "./data/infracciones_trafico.json", 
    lopsc: "./data/lopsc.json", 
    codigoPenal: "./data/codigo_penal.json", 
    menores: "./data/normativa_menores.json", 
    violenciaGenero: "./data/normativa_violencia_genero.json", 
    ordenanzas: "./data/ordenanzas.json", 
    animales: "./data/normativa_animales.json", 
    trafico: "./data/normativa_trafico.json", 
    leyFcs: "./data/ley_2_86.json", 
    lecrim: "./data/lecrim.json", 
    extranjeria: "./data/extranjeria.json", 
    seguridadPrivada: "./data/seguridad_privada.json", 
    espectaculos: "./data/espectaculos_publicos.json", 
    medioAmbiente: "./data/medio_ambiente_ruidos.json", 
    reglamentoArmas: "./data/reglamento_armas.json", 
    policiasLocales: "./data/policias_locales_andalucia.json" 
  }, 
  STORAGE_ACTAS: "centinela_code_actas_v1",
  STORAGE_FAVORITOS: "centinela_code_favoritos_v1"
}; 

const estado = { 
  infracciones: [], 
  lopsc: null, 
  codigoPenal: null, 
  menores: null, 
  violenciaGenero: null, 
  ordenanzas: null, 
  animales: null, 
  trafico: null, 
  resultados: [], 
  gravedad: "all", 
  normativaBusqueda: "", 
  actas: [] 
}; 

let appInicializada = false;

/* ========================================================= 
UTILIDADES 
========================================================= */ 

function $(id) { 
  return document.getElementById(id); 
} 

function normalizarTexto(valor) { 
  return String(valor || "") 
    .toLowerCase() 
    .normalize("NFD") 
    .replace(/[\u0300-\u036f]/g, "") 
    .trim(); 
} 

const STOPWORDS_BUSQUEDA = new Set([ 
  "a", "al", "ante", "con", "de", "del", "el", "en", "la", 
  "las", "lo", "los", "o", "por", "que", "segun", "sin", 
  "sobre", "un", "una", "unos", "unas", "y" 
]); 

const SINONIMOS_BUSQUEDA = { 
  "agresion": ["agredir", "agredi", "agresivo", "atentado", "atentar", "acometer", "acometimiento"], 
  "agresiones": ["agredir", "agredi", "atentado", "atentar", "acometer"], 
  "agredir": ["agresion", "atentado", "acometer"], 
  "agredido": ["agresion", "atentado", "acometer"], 
  "atentado": ["agresion", "agredir", "acometer"], 
  "pegar": ["agresion", "agredir", "atentado", "acometer", "lesiones"], 
  "golpear": ["agresion", "agredir", "atentado", "lesiones"], 
  "seguro": ["aseguramiento", "asegurar", "poliza", "soa"], 
  "aseguramiento": ["seguro", "asegurar", "poliza"], 
  "poliza": ["seguro", "aseguramiento"], 
  "asegurado": ["seguro", "aseguramiento"], 
  "carnet": ["permiso", "licencia"], 
  "licencia": ["permiso", "carnet"], 
  "borracho": ["alcoholemia", "embriaguez", "alcohol"], 
  "embriaguez": ["alcoholemia", "alcohol", "borracho"], 
  "colocado": ["drogas", "estupefaciente", "narcotico", "psicotropico"], 
  "drogado": ["drogas", "estupefaciente", "narcotico"], 
  "menor": ["menores", "nino", "nina", "adolescente"], 
  "nino": ["menor", "menores"], 
  "nina": ["menor", "menores"], 
  "pelea": ["rina", "altercado", "reyerta"], 
  "rina": ["pelea", "altercado", "reyerta"], 
  "mendigar": ["mendicidad"], 
  "pintada": ["grafiti", "pintadas"], 
  "grafiti": ["pintada", "pintadas"], 
  "maltrato": ["crueldad", "malos tratos"], 
  "crueldad": ["maltrato"], 
  "desnudo": ["exhibicionismo", "desnudez"], 
  "exhibicionismo": ["desnudo", "desnudez"] 
}; 

function tokenizarTexto(valor) { 
  return normalizarTexto(valor) 
    .split(/[^a-z0-9]+/i) 
    .filter(Boolean); 
} 

function tokenizarConsulta(valor) { 
  const tokens = tokenizarTexto(valor); 
  const significativos = tokens.filter((token) => !STOPWORDS_BUSQUEDA.has(token)); 
  return significativos.length ? significativos : tokens; 
} 

function coincideConsulta(contenidoNormalizado, tokens) { 
  if (!tokens.length) return false; 
  return tokens.every((token) => { 
    if (contenidoNormalizado.includes(token)) return true; 
    const sinonimos = SINONIMOS_BUSQUEDA[token]; 
    if (!sinonimos) return false; 
    return sinonimos.some((alternativa) => contenidoNormalizado.includes(alternativa)); 
  }); 
} 

function escaparHTML(valor) { 
  return String(valor ?? "") 
    .replace(/&/g, "&amp;") 
    .replace(/</g, "&lt;") 
    .replace(/>/g, "&gt;") 
    .replace(/"/g, "&quot;") 
    .replace(/'/g, "&#039;"); 
} 

function mostrarToast(mensaje) { 
  const toast = $("toast"); 
  const texto = $("toastMessage"); 
  if (!toast || !texto) return; 
  texto.textContent = mensaje; 
  toast.classList.add("show"); 
  clearTimeout(mostrarToast.timer); 
  mostrarToast.timer = setTimeout(() => { 
    toast.classList.remove("show"); 
  }, 2800); 
} 

function mostrarCarga(visible) { 
  const pantalla = $("loadingScreen"); 
  if (!pantalla) return; 
  if (visible) { 
    pantalla.classList.remove("hidden"); 
    pantalla.style.display = ""; 
  } else { 
    pantalla.classList.add("hidden"); 
    pantalla.style.display = "none"; 
  } 
} 

function activarSeccion(nombre) { 
  document.querySelectorAll(".app-section").forEach((section) => { 
    section.classList.toggle("active", section.dataset.section === nombre); 
  }); 

  document.querySelectorAll(".nav-item").forEach((item) => { 
    item.classList.toggle("active", item.dataset.section === nombre); 
  }); 

  window.scrollTo({ top: 0, behavior: "smooth" }); 
} 

/* ========================================================= 
SISTEMA MODAL DE AVISOS Y DETALLES
========================================================= */

function abrirModal(titulo, contenidoHTML, acciones = []) {
  const modal = $("appModal");
  const modalTitle = $("modalTitle");
  const modalBody = $("modalBody");
  const modalActions = $("modalActions");
  if (!modal || !modalBody) return;

  if (modalTitle) modalTitle.textContent = titulo;
  modalBody.innerHTML = contenidoHTML;

  if (modalActions) {
    modalActions.innerHTML = "";
    acciones.forEach(acc => {
      const btn = document.createElement("button");
      btn.className = acc.clase || "secondary-button";
      btn.textContent = acc.texto;
      btn.addEventListener("click", () => acc.onClick(modal));
      modalActions.appendChild(btn);
    });
  }

  modal.classList.remove("hidden");
}

function cerrarModal() {
  const modal = $("appModal");
  if (modal) modal.classList.add("hidden");
}

/* ========================================================= 
CARGA DE DATOS 
========================================================= */ 

async function cargarJSON(ruta) {
  const controlador = new AbortController();
  const separador = ruta.includes("?") ? "&" : "?";
  const url = `${ruta}${separador}v=${Date.now()}`;
  const temporizador = setTimeout(() => controlador.abort(), 10000);
  try {
    const respuesta = await fetch(url, {
      cache: "no-store",
      signal: controlador.signal,
      headers: { "Accept": "application/json" }
    });
    if (!respuesta.ok) throw new Error(`No se pudo cargar ${ruta} (${respuesta.status})`);
    return await respuesta.json();
  } finally {
    clearTimeout(temporizador);
  }
} 

function extraerInfracciones(datos) { 
  if (Array.isArray(datos)) return datos; 
  if (datos && Array.isArray(datos.infracciones)) return datos.infracciones; 
  return []; 
} 

function extraerArticulos(datos) { 
  if (datos && Array.isArray(datos.articulos)) return datos.articulos; 
  return []; 
} 

function extraerLeyes(datos) { 
  if (datos && Array.isArray(datos.leyes)) return datos.leyes; 
  return []; 
} 
const extraerAnimales = extraerLeyes;
const extraerTrafico = extraerLeyes;

const PALABRAS_CLAVE_EXTRA_36_16 = [
  "hachis", "hachís", "cocaina", "cocaína", "marihuana", "resina de hachis", "resina de hachís", 
  "mdma", "extasis", "éxtasis", "anfetaminas", "heroina", "heroína", "sustancia estupefaciente", 
  "sustancias estupefacientes", "droga toxica", "droga tóxica", "drogas toxicas", "drogas tóxicas", 
  "sustancia psicotropica", "sustancia psicotrópica", "consumo via publica", "consumo vía pública", 
  "tenencia ilicita", "tenencia ilícita", "planta de cannabis", "plantas de cannabis", "cultivo de cannabis" 
]; 

function aplicarPalabrasClaveExtra(infracciones) { 
  if (!Array.isArray(infracciones)) return; 
  infracciones.forEach((infraccion) => { 
    const esArt36_16 = String(infraccion.articulo) === "36" && String(infraccion.apartado) === "16"; 
    if (!esArt36_16) return; 
    const existentes = Array.isArray(infraccion.palabrasClave) ? infraccion.palabrasClave : []; 
    infraccion.palabrasClave = existentes.concat( 
      PALABRAS_CLAVE_EXTRA_36_16.filter((palabra) => !existentes.includes(palabra)) 
    ); 
  }); 
} 

/**
 * Los ficheros "simples" (ley_2_86, lecrim, extranjeria, seguridad_privada,
 * espectaculos_publicos, medio_ambiente_ruidos, reglamento_armas,
 * policias_locales_andalucia) usan un esquema plano distinto al de
 * infracciones.json: {id, articulo, normativa, concepto, descripcion,
 * gravedad, sancion (texto libre)}. Se normalizan aquí al esquema que ya
 * entienden la búsqueda, las tarjetas de resultado y las actas, para que
 * esta normativa deje de quedarse fuera de la app.
 */
function normalizarInfraccionSimple(datos) {
  if (!Array.isArray(datos)) return [];
  return datos.map((item) => {
    const articuloLimpio = String(item.articulo || "").replace(/^art\.?\s*/i, "").trim();
    return {
      id: item.id || "",
      codigo: item.articulo || item.id || "",
      ley: item.normativa || "",
      articulo: articuloLimpio,
      apartado: "",
      titulo: item.concepto || "",
      conducta: item.descripcion || "",
      gravedad: item.gravedad || "",
      sancion: { texto: item.sancion || "" },
      palabrasClave: [],
      responsables: [],
      origenSimple: true
    };
  });
}

function extraerOrdenanzas(datos) { 
  if (Array.isArray(datos)) return datos; 
  if (datos && Array.isArray(datos.ordenanzas)) return datos.ordenanzas; 
  return []; 
} 

function renderTarjetaOrdenanza(ordenanza) { 
  const titulo = ordenanza.nombre || ordenanza.nombre_corto || "Ordenanza municipal"; 
  return ` 
    <div class="normativa-card"> 
      <div class="normativa-icon">📋</div> 
      <div class="normativa-info"> 
        <h3>${escaparHTML(titulo)}</h3> 
        <p>${escaparHTML(ordenanza.descripcion || "")}</p> 
        <span>${escaparHTML(ordenanza.codigo || "Ordenanza")}</span> 
      </div> 
      <button type="button" class="normativa-open" data-law="ordenanza" data-id="${escaparHTML(ordenanza.id)}"> 
        Ver ficha 
      </button> 
    </div> 
  `; 
} 

function renderGruposOrdenanzas(categorias, ordenanzas) { 
  return categorias.map((categoria) => { 
    const items = ordenanzas.filter((ordenanza) => ordenanza.categoria === categoria.id); 
    if (!items.length) return ""; 
    return ` 
      <details class="ordenanza-group"> 
        <summary> 
          <span class="ordenanza-group-nombre">${escaparHTML(categoria.nombre)}</span> 
          <span class="ordenanza-group-count">${items.length}</span> 
        </summary> 
        <div class="normativa-list normativa-list--nested"> 
          ${items.map(renderTarjetaOrdenanza).join("")} 
        </div> 
      </details> 
    `; 
  }).join(""); 
} 

async function cargarDatos() { 
  const resultados = await Promise.allSettled([ 
    cargarJSON(CONFIG.RUTAS.infracciones), 
    cargarJSON(CONFIG.RUTAS.infraccionesTrafico), 
    cargarJSON(CONFIG.RUTAS.lopsc), 
    cargarJSON(CONFIG.RUTAS.codigoPenal), 
    cargarJSON(CONFIG.RUTAS.menores), 
    cargarJSON(CONFIG.RUTAS.violenciaGenero), 
    cargarJSON(CONFIG.RUTAS.ordenanzas), 
    cargarJSON(CONFIG.RUTAS.animales), 
    cargarJSON(CONFIG.RUTAS.trafico), 
    cargarJSON(CONFIG.RUTAS.leyFcs), 
    cargarJSON(CONFIG.RUTAS.lecrim), 
    cargarJSON(CONFIG.RUTAS.extranjeria), 
    cargarJSON(CONFIG.RUTAS.seguridadPrivada), 
    cargarJSON(CONFIG.RUTAS.espectaculos), 
    cargarJSON(CONFIG.RUTAS.medioAmbiente), 
    cargarJSON(CONFIG.RUTAS.reglamentoArmas), 
    cargarJSON(CONFIG.RUTAS.policiasLocales) 
  ]); 

  const [ 
    rInfracciones, rInfraccionesTrafico, rLopsc, rCodigoPenal, rMenores, 
    rViolenciaGenero, rOrdenanzas, rAnimales, rTrafico, 
    rLeyFcs, rLecrim, rExtranjeria, rSeguridadPrivada, 
    rEspectaculos, rMedioAmbiente, rReglamentoArmas, rPoliciasLocales 
  ] = resultados; 

  estado.infracciones = [];
  if (rInfracciones.status === "fulfilled") { 
    estado.infracciones = extraerInfracciones(rInfracciones.value); 
    aplicarPalabrasClaveExtra(estado.infracciones); 
  } 

  if (rInfraccionesTrafico.status === "fulfilled") { 
    estado.infracciones = estado.infracciones.concat(extraerInfracciones(rInfraccionesTrafico.value)); 
  } 

  if (rLopsc.status === "fulfilled") estado.lopsc = rLopsc.value; 
  if (rCodigoPenal.status === "fulfilled") estado.codigoPenal = rCodigoPenal.value; 
  if (rMenores.status === "fulfilled") estado.menores = rMenores.value; 
  if (rViolenciaGenero.status === "fulfilled") estado.violenciaGenero = rViolenciaGenero.value; 
  if (rOrdenanzas.status === "fulfilled") estado.ordenanzas = rOrdenanzas.value; 
  if (rAnimales.status === "fulfilled") estado.animales = rAnimales.value; 
  if (rTrafico.status === "fulfilled") estado.trafico = rTrafico.value; 

  [rLeyFcs, rLecrim, rExtranjeria, rSeguridadPrivada, rEspectaculos, rMedioAmbiente, rReglamentoArmas, rPoliciasLocales] 
    .filter((r) => r.status === "fulfilled") 
    .forEach((r) => { 
      estado.infracciones = estado.infracciones.concat(normalizarInfraccionSimple(r.value)); 
    }); 

  actualizarEstadoDatos(); 
  actualizarBusqueda(); 
  renderizarNormativa(); 

  const correctos = resultados.filter((r) => r.status === "fulfilled").length; 
  if (correctos === resultados.length) { 
    mostrarToast("Datos cargados correctamente."); 
  } else { 
    mostrarToast(`Datos cargados: ${correctos}/${resultados.length} bases disponibles.`); 
  } 
} 

/* ========================================================= 
ESTADO DEL SISTEMA Y NAVEGACIÓN 
========================================================= */ 

function establecerEstado(elemento, texto, correcto) { 
  if (!elemento) return; 
  elemento.textContent = texto; 
  elemento.classList.toggle("success", Boolean(correcto)); 
  elemento.classList.toggle("error", correcto === false); 
} 

function actualizarEstadoDatos() { 
  const hayLopsc = Boolean(estado.lopsc) && extraerArticulos(estado.lopsc).length > 0; 
  const hayInfracciones = estado.infracciones.length > 0; 
  const hayOrdenanzas = Boolean(estado.ordenanzas) && extraerOrdenanzas(estado.ordenanzas).length > 0; 

  const contarArticulosLeyes = (leyes) => 
    leyes.reduce((total, leyItem) => total + (Array.isArray(leyItem.articulos) ? leyItem.articulos.length : 0), 0); 

  const totalArticulosBase = 
    extraerArticulos(estado.lopsc).length + 
    contarArticulosLeyes(extraerLeyes(estado.animales)) + 
    contarArticulosLeyes(extraerLeyes(estado.trafico)); 

  const hayBaseNormativa = totalArticulosBase > 0; 

  establecerEstado($("homeNormativaStatus"), hayBaseNormativa ? `${totalArticulosBase} artículos` : "No disponible", hayBaseNormativa); 
  establecerEstado($("homeInfraccionesStatus"), hayInfracciones ? `${estado.infracciones.length} infracciones` : "No disponible", hayInfracciones); 
  establecerEstado($("homeOrdenanzasStatus"), hayOrdenanzas ? `${extraerOrdenanzas(estado.ordenanzas).length} ordenanzas` : "No disponible", hayOrdenanzas); 
  establecerEstado($("settingsLopscStatus"), hayLopsc ? "Disponible" : "No disponible", hayLopsc); 
  establecerEstado($("settingsInfraccionesStatus"), hayInfracciones ? "Disponible" : "No disponible", hayInfracciones); 
  establecerEstado($("settingsOrdenanzasStatus"), hayOrdenanzas ? "Disponible" : "No disponible", hayOrdenanzas); 
} 

function actualizarRed() { 
  const conectado = navigator.onLine; 
  establecerEstado($("homeNetworkStatus"), conectado ? "Online" : "Offline", conectado); 
  const modo = $("appMode"); 
  if (modo) modo.textContent = conectado ? "Online" : "Offline"; 
} 

function configurarNavegacion() { 
  document.querySelectorAll(".nav-item[data-section]").forEach((boton) => { 
    boton.addEventListener("click", () => activarSeccion(boton.dataset.section)); 
  }); 

  document.querySelectorAll(".quick-action[data-target]").forEach((boton) => { 
    boton.addEventListener("click", () => activarSeccion(boton.dataset.target)); 
  }); 

  const buscarCabecera = $("headerSearchButton"); 
  if (buscarCabecera) { 
    buscarCabecera.addEventListener("click", () => { 
      activarSeccion("consulta"); 
      setTimeout(() => $("consultaSearch")?.focus(), 100); 
    }); 
  } 
} 

/* ========================================================= 
CONSULTA DE INFRACCIONES 
========================================================= */ 

function configurarConsulta() { 
  const input = $("consultaSearch"); 
  if (input) { 
    input.addEventListener("input", () => actualizarBusqueda()); 
  } 

  const limpiar = $("clearConsultaSearch"); 
  if (limpiar) { 
    limpiar.addEventListener("click", () => { 
      if (input) { 
        input.value = ""; 
        input.focus(); 
      } 
      actualizarBusqueda(); 
    }); 
  } 

  document.querySelectorAll(".filter-chip[data-severity]").forEach((boton) => { 
    boton.addEventListener("click", () => { 
      document.querySelectorAll(".filter-chip[data-severity]").forEach((item) => item.classList.remove("active")); 
      boton.classList.add("active"); 
      estado.gravedad = boton.dataset.severity || "all"; 
      actualizarBusqueda(); 
    }); 
  }); 
} 

function obtenerArticulosNormativa() { 
  const registros = []; 
  const agregarLeySimple = (datos, navTipo) => { 
    if (!datos || !Array.isArray(datos.articulos)) return; 
    datos.articulos.forEach((articulo) => { 
      registros.push({ 
        ley: datos.abreviatura || datos.ley || "", 
        leyCompleta: datos.ley || "", 
        numero: articulo.numero, 
        titulo: articulo.titulo || "", 
        texto: articulo.texto || "", 
        navTipo, 
        navId: "" 
      }); 
    }); 
  }; 

  const agregarGrupoLeyes = (datos, navTipoLista, navTipoLey) => { 
    const leyes = datos && Array.isArray(datos.leyes) ? datos.leyes : []; 
    leyes.forEach((leyItem) => { 
      const articulos = Array.isArray(leyItem.articulos) ? leyItem.articulos : []; 
      articulos.forEach((articulo) => { 
        registros.push({ 
          ley: leyItem.abreviatura || leyItem.ley || "", 
          leyCompleta: leyItem.ley || "", 
          numero: articulo.numero, 
          titulo: articulo.titulo || "", 
          texto: articulo.texto || "", 
          navTipo: navTipoLey, 
          navId: leyItem.id || "" 
        }); 
      }); 
    }); 
  }; 

  agregarLeySimple(estado.lopsc, "lopsc"); 
  agregarLeySimple(estado.codigoPenal, "codigo-penal"); 
  agregarGrupoLeyes(estado.menores, "menores", "ley-menor"); 
  agregarGrupoLeyes(estado.animales, "animales", "ley-animal"); 
  agregarGrupoLeyes(estado.trafico, "trafico", "ley-trafico"); 
  agregarGrupoLeyes(estado.violenciaGenero, "violencia-genero", "ley-violencia-genero"); 

  const ordenanzas = extraerOrdenanzas(estado.ordenanzas); 
  ordenanzas.forEach((ordenanza) => { 
    registros.push({ 
      ley: ordenanza.codigo || "Ordenanza municipal", 
      leyCompleta: ordenanza.nombre || ordenanza.nombre_corto || "", 
      numero: "", 
      titulo: ordenanza.nombre || ordenanza.nombre_corto || "", 
      texto: ordenanza.descripcion || "", 
      navTipo: "ordenanza", 
      navId: ordenanza.id || "" 
    }); 
  }); 

  return registros; 
} 

function actualizarBusqueda() { 
  const input = $("consultaSearch"); 
  const valorBusqueda = input ? input.value : ""; 
  const texto = normalizarTexto(valorBusqueda); 
  const tokens = tokenizarConsulta(valorBusqueda); 
  const gravedad = estado.gravedad; 

  const resultadosInfracciones = estado.infracciones.filter((infraccion) => { 
    if (gravedad !== "all" && String(infraccion.gravedad || "") !== gravedad) return false; 
    if (!tokens.length) return false; 
    const palabras = Array.isArray(infraccion.palabrasClave) ? infraccion.palabrasClave : []; 
    const responsables = Array.isArray(infraccion.responsables) ? infraccion.responsables : []; 
    const contenido = [ 
      infraccion.id, infraccion.codigo, infraccion.ley, infraccion.articulo, 
      infraccion.apartado, infraccion.titulo, infraccion.conducta, infraccion.gravedad, 
      ...palabras, ...responsables 
    ].join(" "); 

    return coincideConsulta(normalizarTexto(contenido), tokens); 
  }).map((infraccion) => ({ ...infraccion, tipoResultado: "infraccion" })); 

  let resultadosArticulos = []; 
  if (tokens.length && gravedad === "all") { 
    resultadosArticulos = obtenerArticulosNormativa().filter((articulo) => { 
      const contenido = [articulo.ley, articulo.leyCompleta, articulo.numero, articulo.titulo, articulo.texto].join(" "); 
      return coincideConsulta(normalizarTexto(contenido), tokens); 
    }).map((articulo) => ({ ...articulo, tipoResultado: "articulo" })); 
  } 

  estado.resultados = resultadosInfracciones.concat(resultadosArticulos); 
  ordenarResultados(texto); 
  renderizarResultados(); 
} 

function ordenarResultados(texto) { 
  if (!texto) return; 
  const obtenerCodigo = (item) => item.tipoResultado === "articulo" ? String(item.numero || "") : String(item.codigo || ""); 
  estado.resultados.sort((a, b) => { 
    const codigoA = normalizarTexto(obtenerCodigo(a)); 
    const codigoB = normalizarTexto(obtenerCodigo(b)); 
    if (codigoA === texto && codigoB !== texto) return -1; 
    if (codigoB === texto && codigoA !== texto) return 1; 
    if (a.tipoResultado !== b.tipoResultado) return a.tipoResultado === "infraccion" ? -1 : 1; 
    const tituloA = normalizarTexto(a.titulo); 
    const tituloB = normalizarTexto(b.titulo); 
    if (tituloA.startsWith(texto) && !tituloB.startsWith(texto)) return -1; 
    if (tituloB.startsWith(texto) && !tituloA.startsWith(texto)) return 1; 
    return obtenerCodigo(a).localeCompare(obtenerCodigo(b), "es", { numeric: true }); 
  }); 
} 

function renderizarResultados() { 
  const contenedor = $("consultaResults"); 
  const contador = $("consultaResultCount"); 
  if (!contenedor) return; 
  if (contador) contador.textContent = estado.resultados.length; 

  const input = $("consultaSearch"); 
  if (!input || !input.value.trim()) { 
    contenedor.innerHTML = ` 
      <div class="empty-state"> 
        <div class="empty-icon">🔍</div> 
        <h3>Buscar infracción</h3> 
        <p>Introduce un código, artículo o palabra clave para comenzar.</p> 
      </div> 
    `; 
    return; 
  } 

  if (!estado.resultados.length) { 
    contenedor.innerHTML = ` 
      <div class="empty-state"> 
        <div class="empty-icon">⚠️</div> 
        <h3>Sin resultados</h3> 
        <p>No se han encontrado coincidencias con esos criterios.</p> 
      </div> 
    `; 
    return; 
  } 

  contenedor.innerHTML = estado.resultados 
    .map((item) => item.tipoResultado === "articulo" ? renderizarTarjetaArticulo(item) : renderizarTarjetaInfraccion(item)) 
    .join(""); 
} 

function renderizarTarjetaArticulo(articulo) { 
  const snippet = (articulo.texto || "").length > 220 ? articulo.texto.slice(0, 220).trim() + "…" : articulo.texto || ""; 
  return ` 
    <article class="result-card result-card--articulo"> 
      <div class="result-card-header"> 
        <div> 
          <span class="result-ley">${escaparHTML(articulo.ley || "")}</span> 
          ${articulo.numero ? `<span class="result-code">Art. ${escaparHTML(articulo.numero)}</span>` : ""} 
          <h3>${escaparHTML(articulo.titulo || "Sin título")}</h3> 
        </div> 
      </div> 
      <p class="result-conducta">${escaparHTML(snippet)}</p> 
      <button type="button" class="result-detail-button" data-nav-tipo="${escaparHTML(articulo.navTipo || "")}" data-nav-id="${escaparHTML(articulo.navId || "")}"> 
        Ver en Normativa 
      </button> 
    </article> 
  `; 
} 

function renderizarTarjetaInfraccion(infraccion) { 
  const sancion = infraccion.sancion || {}; 
  const min = Number.isFinite(Number(sancion.min)) ? Number(sancion.min) : null; 
  const max = Number.isFinite(Number(sancion.max)) ? Number(sancion.max) : null; 
  let rango = ""; 
  if (min !== null && max !== null) rango = `${formatearEuros(min)} - ${formatearEuros(max)}`; 
  else if (min !== null) rango = `Desde ${formatearEuros(min)}`; 
  else if (max !== null) rango = `Hasta ${formatearEuros(max)}`; 
  else if (sancion.texto) rango = sancion.texto; 

  return ` 
    <article class="result-card"> 
      <div class="result-card-header"> 
        <div> 
          <span class="result-ley">${escaparHTML(infraccion.ley || "")}</span> 
          <span class="result-code">${escaparHTML(infraccion.codigo || "")}</span> 
          <h3>${escaparHTML(infraccion.titulo || "Sin título")}</h3> 
        </div> 
        <span class="severity-badge">${escaparHTML(infraccion.gravedad || "")}</span> 
      </div> 
      <p class="result-conducta">${escaparHTML(infraccion.conducta || "")}</p> 
      <div class="result-meta"> 
        <span>Art. ${escaparHTML(infraccion.articulo || "")}</span> 
        ${rango ? `<span>${rango}</span>` : ""} 
      </div> 
      <button type="button" class="result-detail-button" data-infraccion-id="${escaparHTML(infraccion.id || "")}"> 
        Ver detalle 
      </button> 
    </article> 
  `; 
} 

function formatearEuros(numero) { 
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(numero); 
} 

function abrirDetalleInfraccion(id) { 
  const infraccion = estado.infracciones.find((item) => item.id === id); 
  if (!infraccion) return; 

  const palabras = Array.isArray(infraccion.palabrasClave) ? infraccion.palabrasClave : []; 
  const sancion = infraccion.sancion || {}; 

  abrirModal( 
    infraccion.codigo || "Infracción", 
    ` 
      <div class="detail-content"> 
        <p><strong>Ley:</strong> ${escaparHTML(infraccion.ley || "-")}</p> 
        <p><strong>Gravedad:</strong> ${escaparHTML(infraccion.gravedad || "-")}</p> 
        <p><strong>Artículo:</strong> ${escaparHTML(infraccion.articulo || "-")}${infraccion.apartado ? `.${escaparHTML(infraccion.apartado)}` : ""}</p> 
        <h4>Conducta</h4> 
        <p>${escaparHTML(infraccion.conducta || "")}</p> 
        ${(sancion.min !== undefined || sancion.max !== undefined || sancion.cuantia !== undefined) ? ` 
          <h4>Sanción</h4> 
          <p> 
            ${sancion.cuantia ? `Cuantía: ${formatearEuros(sancion.cuantia)}<br>` : ""}
            ${sancion.min !== undefined ? `Mínimo: ${formatearEuros(sancion.min)}<br>` : ""} 
            ${sancion.max !== undefined ? `Máximo: ${formatearEuros(sancion.max)}` : ""} 
          </p> 
        ` : (sancion.texto ? ` 
          <h4>Sanción</h4> 
          <p>${escaparHTML(sancion.texto)}</p> 
        ` : "")} 
        ${palabras.length ? ` 
          <h4>Palabras clave</h4> 
          <p>${palabras.map(escaparHTML).join(", ")}</p> 
        ` : ""} 
      </div> 
    `, 
    [{ texto: "Cerrar", clase: "secondary-button", onClick: cerrarModal }] 
  ); 
} 

/* ========================================================= 
LÓGICA AUTOMÁTICA DE LEYES Y AUTORIDAD SANCIONADORA 
========================================================= */

function determinarAutoridadSancionadora(infraccion) {
  if (!infraccion) return "";
  const leyNorm = normalizarTexto(infraccion.ley || "");
  const codigoNorm = normalizarTexto(infraccion.codigo || "");

  if (leyNorm.includes("lopsc") || leyNorm.includes("4/2015") || leyNorm.includes("seguridad ciudadana")) {
    return "Subdelegación del Gobierno / Delegación del Gobierno";
  }
  if (leyNorm.includes("trafico") || leyNorm.includes("vial") || leyNorm.includes("6/2015")) {
    return "Jefatura Provincial de Tráfico / Alcaldía del Ayuntamiento";
  }
  if (leyNorm.includes("ordenanza") || codigoNorm.includes("om")) {
    return "Alcaldía - Ayuntamiento Constitucional";
  }
  if (leyNorm.includes("animal") || leyNorm.includes("bienestar")) {
    return "Delegación Territorial de la Consejería Competente / Alcaldía";
  }
  if (leyNorm.includes("extranjeria") || leyNorm.includes("4/2000")) {
    return "Subdelegación del Gobierno (competencia estatal en extranjería)";
  }
  if (leyNorm.includes("armas") || leyNorm.includes("137/1993")) {
    return "Intervención de Armas y Explosivos (Guardia Civil) / Delegación del Gobierno";
  }
  if (leyNorm.includes("seguridad privada") || leyNorm.includes("5/2014")) {
    return "Secretaría de Estado de Seguridad / Delegación del Gobierno";
  }
  if (leyNorm.includes("espectaculos") || leyNorm.includes("espectáculos")) {
    return "Delegación Territorial / Alcaldía - Ayuntamiento";
  }
  if (leyNorm.includes("ruido") || leyNorm.includes("residuos") || leyNorm.includes("37/2003") || leyNorm.includes("7/2022")) {
    return "Alcaldía - Ayuntamiento / Consejería de Medio Ambiente";
  }
  return "Autoridad Competente según la legislación vigente";
}

function determinarCuantiaSancion(infraccion) {
  if (!infraccion || !infraccion.sancion) return "";
  const sancion = infraccion.sancion;
  if (sancion.cuantia) return `${sancion.cuantia} €`;
  if (sancion.min !== undefined && sancion.max !== undefined) {
    return `${sancion.min} € a ${sancion.max} €`;
  }
  if (sancion.min !== undefined) return `${sancion.min} €`;
  if (sancion.max !== undefined) return `Hasta ${sancion.max} €`;
  if (sancion.texto) return sancion.texto;
  return "";
}

/* ========================================================= 
GESTIÓN DE IMÁGENES E INCAUTACIONES
========================================================= */

async function subirFotoIncautacion(archivo, actaId) {
  if (!archivo) return null;
  try {
    const ext = archivo.name ? archivo.name.split('.').pop() : 'jpg';
    const nombreArchivo = `${actaId}_${Date.now()}.${ext}`;
    const ruta = `incautaciones/${nombreArchivo}`;

    const { data, error } = await supabase.storage
      .from("incautaciones")
      .upload(ruta, archivo, { cacheControl: "3600", upsert: true });

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage
      .from("incautaciones")
      .getPublicUrl(ruta);

    return publicUrlData?.publicUrl || null;
  } catch (error) {
    console.warn("Storage no disponible o error en subida, convirtiendo a Base64:", error);
    return await convertirArchivoABase64(archivo);
  }
}

function convertirArchivoABase64(archivo) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(archivo);
  });
}

function inyectarCamposFotoEditor() {
  const form = $("actaForm");
  if (!form || $("actaFotoGroup")) return;

  const contenedor = document.createElement("div");
  contenedor.id = "actaFotoGroup";
  contenedor.className = "form-group";
  contenedor.style.cssText = "margin-top:1rem; border-top:1px dashed var(--color-border,#30363d); padding-top:1rem;";
  contenedor.innerHTML = `
    <label style="font-weight:600;display:block;margin-bottom:.4rem;">📷 Fotografía de la Incautación / Efectos</label>
    <input type="file" id="actaFotoInput" accept="image/*" capture="environment" style="width:100%;margin-bottom:.5rem;" />
    <div id="actaFotoContainerPreview" style="display:none;margin-top:.5rem;position:relative;max-width:200px;">
      <img id="actaFotoImgPreview" src="" alt="Previsualización" style="width:100%;border-radius:8px;border:1px solid var(--color-border,#30363d);display:block;" />
      <button type="button" id="actaFotoEliminar" style="position:absolute;top:4px;right:4px;background:rgba(248,81,73,0.9);color:#fff;border:none;border-radius:50%;width:24px;height:24px;cursor:pointer;font-weight:bold;">×</button>
    </div>
  `;

  const botonera = form.querySelector(".form-actions") || form.lastElementChild;
  form.insertBefore(contenedor, botonera);

  $("actaFotoInput")?.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const img = $("actaFotoImgPreview");
      const prev = $("actaFotoContainerPreview");
      if (img && prev) {
        img.src = url;
        prev.style.display = "block";
      }
    }
  });

  $("actaFotoEliminar")?.addEventListener("click", () => {
    const input = $("actaFotoInput");
    const prev = $("actaFotoContainerPreview");
    const img = $("actaFotoImgPreview");
    if (input) input.value = "";
    if (img) img.src = "";
    if (prev) prev.style.display = "none";
    if (form) delete form.dataset.fotoExistente;
  });
}

/* ========================================================= 
ACTAS - NUBE, FILTROS Y PDF 
========================================================= */ 

async function cargarActas() {
  if (!usuarioActual) return;
  try {
    const { data, error } = await supabase
      .from("actas")
      .select("*")
      .eq("user_id", usuarioActual.id)
      .order("actualizado", { ascending: false });

    if (error) throw error;
    estado.actas = data ?? [];
  } catch (error) {
    console.error("No se pudieron cargar las actas:", error);
    estado.actas = [];
  }
  renderizarActas();
}

function configurarActas() { 
  $("newActaButton")?.addEventListener("click", () => abrirEditorActa()); 
  $("closeActaEditor")?.addEventListener("click", () => cerrarEditorActa()); 
  $("cancelActaButton")?.addEventListener("click", () => cerrarEditorActa()); 
  $("actaForm")?.addEventListener("submit", guardarActaDesdeFormulario); 
  $("actaInfraccion")?.addEventListener("input", actualizarPreviewInfraccion); 
  $("btnUbicacionActa")?.addEventListener("click", obtenerUbicacionActa); 
  $("btnDictadoHechos")?.addEventListener("click", (evento) => alternarDictado(evento.currentTarget)); 
  $("btnDictadoObservaciones")?.addEventListener("click", (evento) => alternarDictado(evento.currentTarget)); 
  
  $("filtroFechaDesde")?.addEventListener("change", renderizarActas);
  $("filtroFechaHasta")?.addEventListener("change", renderizarActas);
  $("btnLimpiarFiltroFechas")?.addEventListener("click", () => {
    if ($("filtroFechaDesde")) $("filtroFechaDesde").value = "";
    if ($("filtroFechaHasta")) $("filtroFechaHasta").value = "";
    renderizarActas();
  });

  renderizarActas(); 
} 

async function obtenerUbicacionActa() { 
  const boton = $("btnUbicacionActa"); 
  const campo = $("actaLugar"); 
  if (!campo) return; 

  if (!navigator.geolocation) { 
    alert("Este dispositivo o navegador no admite geolocalización."); 
    return; 
  } 

  const textoOriginal = boton ? boton.textContent : ""; 
  if (boton) { 
    boton.disabled = true; 
    boton.textContent = "⏳"; 
  } 

  navigator.geolocation.getCurrentPosition( 
    async (posicion) => { 
      const { latitude, longitude } = posicion.coords; 
      try { 
        const respuesta = await fetch( 
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`, 
          { headers: { "Accept-Language": "es" } } 
        ); 
        if (!respuesta.ok) throw new Error("Respuesta no válida"); 
        const datos = await respuesta.json(); 
        campo.value = datos && datos.display_name ? datos.display_name : `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`; 
      } catch (error) { 
        campo.value = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`; 
      } finally { 
        if (boton) { 
          boton.disabled = false; 
          boton.textContent = textoOriginal || "📍"; 
        } 
      } 
    }, 
    (error) => { 
      if (boton) { 
        boton.disabled = false; 
        boton.textContent = textoOriginal || "📍"; 
      } 
      let mensaje = "No se ha podido obtener la ubicación."; 
      if (error.code === error.PERMISSION_DENIED) mensaje = "Permiso de ubicación denegado."; 
      alert(mensaje); 
    }, 
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 } 
  ); 
} 

let reconocimientoVozActivo = null; 
let botonDictadoActivo = null; 

function alternarDictado(boton) { 
  if (!boton) return; 
  const idCampo = boton.dataset.target; 
  const campo = $(idCampo); 
  if (!campo) return; 

  const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition; 
  if (!SpeechRecognitionAPI) { 
    alert("El dictado por voz no está disponible en este navegador."); 
    return; 
  } 

  if (reconocimientoVozActivo) { 
    reconocimientoVozActivo.stop(); 
    return; 
  } 

  const reconocimiento = new SpeechRecognitionAPI(); 
  reconocimiento.lang = "es-ES"; 
  reconocimiento.continuous = true; 
  reconocimiento.interimResults = false; 

  const separador = campo.value && !campo.value.endsWith(" ") && !campo.value.endsWith("\n") ? " " : ""; 
  let textoAcumulado = campo.value + separador; 

  reconocimiento.onresult = (evento) => { 
    let textoNuevo = ""; 
    for (let i = evento.resultIndex; i < evento.results.length; i++) { 
      if (evento.results[i].isFinal) textoNuevo += evento.results[i][0].transcript + " "; 
    } 
    if (textoNuevo) { 
      textoAcumulado += textoNuevo; 
      campo.value = textoAcumulado; 
    } 
  }; 

  reconocimiento.onerror = (err) => {
    console.warn("Error en el reconocimiento de voz:", err);
    if (botonDictadoActivo) {
      botonDictadoActivo.classList.remove("input-action-button--activo");
      botonDictadoActivo.textContent = "🎤";
    }
    reconocimientoVozActivo = null;
    botonDictadoActivo = null;
  };

  reconocimiento.onend = () => { 
    if (botonDictadoActivo) { 
      botonDictadoActivo.classList.remove("input-action-button--activo"); 
      botonDictadoActivo.textContent = "🎤"; 
    } 
    reconocimientoVozActivo = null; 
    botonDictadoActivo = null; 
  }; 

  reconocimiento.start(); 
  reconocimientoVozActivo = reconocimiento; 
  botonDictadoActivo = boton; 
  boton.classList.add("input-action-button--activo"); 
  boton.textContent = "⏹️"; 
} 

function abrirEditorActa(acta = null) { 
  const editor = $("actaEditor"); 
  const form = $("actaForm"); 
  if (!editor || !form) return; 

  inyectarCamposFotoEditor();
  form.reset(); 

  const fecha = $("actaFecha"); 
  const hora = $("actaHora"); 

  if (fecha) fecha.value = acta?.fecha || new Date().toISOString().slice(0, 10); 
  if (hora) hora.value = acta?.hora || new Date().toTimeString().slice(0, 5); 

  const fotoContainer = $("actaFotoContainerPreview");
  const fotoImg = $("actaFotoImgPreview");

  if (acta) { 
    $("actaNumero").value = acta.numero || ""; 
    $("actaNombre").value = acta.nombre || ""; 
    $("actaDni").value = acta.dni || ""; 
    $("actaDomicilio").value = acta.domicilio || ""; 
    $("actaLugar").value = acta.lugar || ""; 
    $("actaHechos").value = acta.hechos || ""; 
    $("actaInfraccion").value = acta.infraccion || ""; 
    if ($("actaCuantia")) $("actaCuantia").value = acta.sancion_cuantia || ""; 
    if ($("actaAutoridad")) $("actaAutoridad").value = acta.autoridad_sancionadora || ""; 
    $("actaObservaciones").value = acta.observaciones || ""; 
    form.dataset.editingId = acta.id || ""; 
    
    if (acta.foto_url && fotoContainer && fotoImg) {
      fotoImg.src = acta.foto_url;
      fotoContainer.style.display = "block";
      form.dataset.fotoExistente = acta.foto_url;
    } else if (fotoContainer) {
      fotoContainer.style.display = "none";
      delete form.dataset.fotoExistente;
    }
  } else { 
    delete form.dataset.editingId; 
    delete form.dataset.fotoExistente;
    if (fotoContainer) fotoContainer.style.display = "none";
  } 

  actualizarPreviewInfraccion(); 
  editor.classList.remove("hidden"); 
  editor.scrollIntoView({ behavior: "smooth", block: "start" }); 
} 

function cerrarEditorActa() { 
  const editor = $("actaEditor"); 
  const form = $("actaForm"); 
  if (editor) editor.classList.add("hidden"); 
  if (form) { 
    form.reset(); 
    delete form.dataset.editingId; 
    delete form.dataset.fotoExistente;
  } 
  const preview = $("actaInfraccionPreview"); 
  if (preview) { 
    preview.classList.add("hidden"); 
    preview.innerHTML = ""; 
  } 
  const fotoPrev = $("actaFotoContainerPreview");
  if (fotoPrev) fotoPrev.style.display = "none";
} 

function obtenerValor(id) { 
  return $(id)?.value?.trim() || ""; 
} 

async function guardarActaDesdeFormulario(evento) {
  evento.preventDefault();
  if (!usuarioActual) { mostrarToast("Sesión no iniciada."); return; }

  const form = evento.currentTarget;
  const esEdicion = !!form.dataset.editingId;
  const idActa = form.dataset.editingId || `acta-${Date.now()}`;

  const fotoInput = $("actaFotoInput");
  let fotoUrl = form.dataset.fotoExistente || null;

  if (fotoInput && fotoInput.files && fotoInput.files[0]) {
    mostrarToast("Subiendo fotografía...");
    fotoUrl = await subirFotoIncautacion(fotoInput.files[0], idActa);
  }

  const acta = {
    id:                     idActa,
    user_id:                usuarioActual.id,
    numero:                 obtenerValor("actaNumero"),
    fecha:                  obtenerValor("actaFecha"),
    hora:                   obtenerValor("actaHora"),
    nombre:                 obtenerValor("actaNombre"),
    dni:                    obtenerValor("actaDni"),
    domicilio:              obtenerValor("actaDomicilio"),
    lugar:                  obtenerValor("actaLugar"),
    hechos:                 obtenerValor("actaHechos"),
    infraccion:             obtenerValor("actaInfraccion"),
    sancion_cuantia:        obtenerValor("actaCuantia"),
    autoridad_sancionadora: obtenerValor("actaAutoridad"),
    observaciones:          obtenerValor("actaObservaciones"),
    foto_url:               fotoUrl,
    actualizado:            new Date().toISOString()
  };

  try {
    const { error } = await supabase
      .from("actas")
      .upsert(acta, { onConflict: "id" });

    if (error) throw error;

    const indice = estado.actas.findIndex(item => item.id === acta.id);
    if (indice >= 0) {
      estado.actas[indice] = acta;
    } else {
      estado.actas.unshift(acta);
    }

    mostrarToast(esEdicion ? "Acta actualizada." : "Acta guardada.");
  } catch (error) {
    console.error("Error guardando acta:", error);
    mostrarToast("Error al guardar el acta.");
  }

  renderizarActas();
  cerrarEditorActa();
} 

function obtenerActasFiltradas() {
  const fechaDesde = $("filtroFechaDesde")?.value || "";
  const fechaHasta = $("filtroFechaHasta")?.value || "";

  return estado.actas.filter(acta => {
    if (fechaDesde && acta.fecha < fechaDesde) return false;
    if (fechaHasta && acta.fecha > fechaHasta) return false;
    return true;
  });
}

function renderizarActas() { 
  const lista = $("actasList"); 
  const homeList = $("homeActasList");
  if (!lista) return; 

  const actasParaMostrar = obtenerActasFiltradas();

  if (!actasParaMostrar.length) { 
    lista.innerHTML = ` 
      <div class="empty-state"> 
        <div class="empty-icon">📂</div> 
        <h3>No se encontraron actas</h3> 
        <p>No existen registros que coincidan con la búsqueda o la fecha seleccionada.</p> 
      </div> 
    `; 
    if (homeList) {
      homeList.innerHTML = `<div class="home-acta-empty">No hay actas guardadas todavía.</div>`;
    }
    return; 
  } 

  lista.innerHTML = actasParaMostrar.map((acta) => ` 
    <article class="acta-card"> 
      <div class="acta-card-header"> 
        <div> 
          <span>Acta ${escaparHTML(acta.numero || "sin número")}</span> 
          <h3>${escaparHTML(acta.nombre || "Persona no indicada")}</h3> 
        </div> 
        <span>${escaparHTML(acta.fecha || "")} ${escaparHTML(acta.hora || "")}</span> 
      </div> 

      <p><strong>Infracción:</strong> ${escaparHTML(acta.infraccion || "Sin especificar")}</p>
      ${acta.sancion_cuantia ? `<p><strong>Cuantía:</strong> ${escaparHTML(acta.sancion_cuantia)}</p>` : ""}
      ${acta.autoridad_sancionadora ? `<p><strong>Sanciona:</strong> ${escaparHTML(acta.autoridad_sancionadora)}</p>` : ""}
      
      ${acta.foto_url ? `
        <div style="margin:0.5rem 0;">
          <img src="${escaparHTML(acta.foto_url)}" alt="Fotografía de la incautación" style="max-width:100%;max-height:150px;border-radius:6px;border:1px solid var(--color-border,#30363d);object-fit:cover;" />
        </div>
      ` : ""}

      <div class="form-actions" style="margin-top:1rem; display:flex; gap:0.5rem; flex-wrap:wrap;"> 
        <button type="button" class="secondary-button" data-edit-acta="${escaparHTML(acta.id)}">Editar</button> 
        <button type="button" class="secondary-button" data-pdf-acta="${escaparHTML(acta.id)}">📄 PDF</button>
        <button type="button" class="secondary-button danger" data-delete-acta="${escaparHTML(acta.id)}">Borrar</button> 
      </div> 
    </article> 
  `).join(""); 

  if (homeList) {
    const ultimas = estado.actas.slice(0, 3);
    homeList.innerHTML = ultimas.map(a => `
      <div style="padding: 8px 12px; background: rgba(255,255,255,0.03); border-radius: 6px; border: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: space-between; align-items: center;">
        <div>
          <strong>Acta ${escaparHTML(a.numero || "S/N")} - ${escaparHTML(a.nombre || "Sin nombre")}</strong>
          <br><small style="color: #94a3b8;">${escaparHTML(a.infraccion || "")}</small>
        </div>
        <span style="font-size: 0.8rem; color: #64748b;">${escaparHTML(a.fecha || "")}</span>
      </div>
    `).join("");
  }
} 

function editarActa(id) { 
  const acta = estado.actas.find((item) => item.id === id); 
  if (acta) abrirEditorActa(acta); 
} 

async function borrarActa(id) {
  const confirmado = window.confirm("¿Quieres borrar esta acta?");
  if (!confirmado) return;

  try {
    const { error } = await supabase
      .from("actas")
      .delete()
      .eq("id", id)
      .eq("user_id", usuarioActual.id);

    if (error) throw error;

    estado.actas = estado.actas.filter(item => item.id !== id);
    renderizarActas();
    mostrarToast("Acta borrada.");
  } catch (error) {
    console.error("Error borrando acta:", error);
    mostrarToast("Error al borrar el acta.");
  }
} 

function actualizarPreviewInfraccion() { 
  const preview = $("actaInfraccionPreview"); 
  const input = $("actaInfraccion"); 
  if (!preview || !input) return; 

  const valor = normalizarTexto(input.value); 
  if (!valor) { 
    preview.classList.add("hidden"); 
    preview.innerHTML = ""; 
    return; 
  } 

  const encontrada = estado.infracciones.find( 
    (item) => normalizarTexto(item.codigo) === valor || normalizarTexto(item.id) === valor 
  ); 

  if (!encontrada) { 
    preview.classList.add("hidden"); 
    preview.innerHTML = ""; 
    return; 
  } 

  const autoridadCampo = $("actaAutoridad");
  const sancionCampo = $("actaCuantia");

  if (autoridadCampo && !autoridadCampo.value) {
    autoridadCampo.value = determinarAutoridadSancionadora(encontrada);
  }
  if (sancionCampo && !sancionCampo.value) {
    sancionCampo.value = determinarCuantiaSancion(encontrada);
  }

  preview.classList.remove("hidden"); 
  preview.innerHTML = ` 
    <strong>${escaparHTML(encontrada.codigo || "")}</strong> 
    <p>${escaparHTML(encontrada.titulo || "")}</p> 
    <span>${escaparHTML(encontrada.gravedad || "")}</span> 
  `; 
} 

/* ========================================================= 
EXPORTACIÓN A PDF 
========================================================= */ 

function exportarActaPDF(id) {
  const acta = estado.actas.find((item) => item.id === id);
  if (!acta) {
    mostrarToast("Acta no encontrada.");
    return;
  }

  const ventanaImp = window.open("", "_blank");
  if (!ventanaImp) {
    alert("Por favor, permite las ventanas emergentes para generar el PDF.");
    return;
  }

  ventanaImp.document.write(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Acta ${escaparHTML(acta.numero || "Sin número")}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 2rem; color: #111; line-height: 1.5; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 1rem; margin-bottom: 1.5rem; }
        .header h1 { margin: 0; font-size: 1.5rem; }
        .header p { margin: 0.2rem 0 0; font-size: 0.9rem; color: #555; }
        .section { margin-bottom: 1.2rem; }
        .section-title { font-weight: bold; background: #eee; padding: 0.3rem 0.5rem; margin-bottom: 0.5rem; font-size: 0.95rem; text-transform: uppercase; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; }
        .field { margin-bottom: 0.4rem; }
        .field label { font-weight: bold; display: block; font-size: 0.85rem; color: #444; }
        .field span { font-size: 1rem; }
        .foto-incautacion { text-align: center; margin-top: 1rem; }
        .foto-incautacion img { max-width: 100%; max-height: 250px; border: 1px solid #ccc; border-radius: 4px; }
        .footer { margin-top: 3rem; display: flex; justify-content: space-between; text-align: center; font-size: 0.85rem; }
        .signature { width: 45%; border-top: 1px solid #000; padding-top: 0.5rem; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>ACTA DE DENUNCIA / INTERVENCIÓN</h1>
        <p>Centinela Code — Registro Oficial</p>
      </div>

      <div class="section">
        <div class="section-title">Datos del Acta</div>
        <div class="grid">
          <div class="field"><label>Número de Acta:</label><span>${escaparHTML(acta.numero || "N/A")}</span></div>
          <div class="field"><label>Fecha y Hora:</label><span>${escaparHTML(acta.fecha || "")} - ${escaparHTML(acta.hora || "")}</span></div>
          <div class="field" style="grid-column: span 2;"><label>Lugar de los Hechos:</label><span>${escaparHTML(acta.lugar || "N/A")}</span></div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Datos del Implicado</div>
        <div class="grid">
          <div class="field"><label>Nombre Completo:</label><span>${escaparHTML(acta.nombre || "N/A")}</span></div>
          <div class="field"><label>DNI / NIE / Pasaporte:</label><span>${escaparHTML(acta.dni || "N/A")}</span></div>
          <div class="field" style="grid-column: span 2;"><label>Domicilio:</label><span>${escaparHTML(acta.domicilio || "N/A")}</span></div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Calificación legal y sanción</div>
        <div class="field"><label>Infracción Presunta:</label><span>${escaparHTML(acta.infraccion || "N/A")}</span></div>
        <div class="grid" style="margin-top:0.4rem;">
          <div class="field"><label>Cuantía estimada:</label><span>${escaparHTML(acta.sancion_cuantia || "Según normativa")}</span></div>
          <div class="field"><label>Órgano Sancionador:</label><span>${escaparHTML(acta.autoridad_sancionadora || "Competente")}</span></div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Relación sucinta de Hechos</div>
        <div class="field"><span>${escaparHTML(acta.hechos || "Sin observaciones").replace(/\n/g, "<br>")}</span></div>
      </div>

      ${acta.foto_url ? `
        <div class="section">
          <div class="section-title">Fotografía / Anexo de la Incautación</div>
          <div class="foto-incautacion">
            <img src="${escaparHTML(acta.foto_url)}" alt="Incautación" />
          </div>
        </div>
      ` : ""}

      ${acta.observaciones ? `
        <div class="section">
          <div class="section-title">Observaciones adicionales</div>
          <div class="field"><span>${escaparHTML(acta.observaciones).replace(/\n/g, "<br>")}</span></div>
        </div>
      ` : ""}

      <div class="footer">
        <div class="signature">Firma del Agente Instructante</div>
        <div class="signature">Firma del Denunciado / Intervenido</div>
      </div>

      <script>
        window.onload = function() { window.print(); };
      </script>
    </body>
    </html>
  `);
  ventanaImp.document.close();
}

/* ========================================================= 
NORMATIVA 
========================================================= */ 

function configurarNormativa() { 
  $("normativaSearch")?.addEventListener("input", () => { 
    estado.normativaBusqueda = $("normativaSearch").value || ""; 
    renderizarNormativa(); 
  }); 

  $("clearNormativaSearch")?.addEventListener("click", () => { 
    const input = $("normativaSearch"); 
    if (input) { 
      input.value = ""; 
      estado.normativaBusqueda = ""; 
      input.focus(); 
    } 
    renderizarNormativa(); 
  }); 

  $("closeNormativaViewer")?.addEventListener("click", cerrarVisorNormativa); 
  renderizarNormativa(); 
} 

function renderizarNormativa() { 
  const lista = $("normativaList"); 
  if (!lista) return; 

  const tokensNormativa = tokenizarConsulta(estado.normativaBusqueda); 
  const categorias = Array.isArray(estado.ordenanzas?.categorias) ? estado.ordenanzas.categorias : []; 
  const ordenanzas = extraerOrdenanzas(estado.ordenanzas); 
  const otrasNormas = obtenerOtrasNormas(); 
  const leyesOtrasNormas = [...new Set(otrasNormas.map((item) => item.ley))]; 

  const tarjetasPrincipales = [ 
    { tipo: "lopsc", titulo: "Ley Orgánica 4/2015", descripcion: "Protección de la seguridad ciudadana", etiqueta: "LOPSC", icono: "⚖️" }, 
    { tipo: "codigo-penal", titulo: "Código Penal", descripcion: "Selección de delitos de interés policial", etiqueta: "LO 10/1995", icono: "🔨" }, 
    { tipo: "menores", titulo: "Menores", descripcion: "Responsabilidad penal y protección de menores", etiqueta: "LO 5/2000, LO 1/1996", icono: "🧑‍⚖️" }, 
    { tipo: "animales", titulo: "Animales", descripcion: "Bienestar animal y tenencia de PPP", etiqueta: "Estatal / Autonómica", icono: "🐾" }, 
    { tipo: "trafico", titulo: "Tráfico", descripcion: "Ley de Tráfico y reglamentos", etiqueta: "Estatal", icono: "🚦" }, 
    { tipo: "violencia-genero", titulo: "Violencia de Género", descripcion: "Protección integral y libertad sexual", etiqueta: "LO 1/2004", icono: "🛡️" }, 
    { tipo: "ordenanzas", titulo: "Ordenanzas municipales", descripcion: `Normativa local — ${ordenanzas.length} ordenanzas`, etiqueta: `${categorias.length} categorías`, icono: "🏛️" }, 
    { tipo: "otras-normas", titulo: "Otras normas de interés", descripcion: `LOFCS, LECrim, extranjería, armas, seguridad privada y más — ${otrasNormas.length} normas`, etiqueta: `${leyesOtrasNormas.length} leyes`, icono: "📚" } 
  ]; 

  const coincide = (campos) => !tokensNormativa.length || coincideConsulta(normalizarTexto(campos.join(" ")), tokensNormativa); 

  const principalesFiltradas = tarjetasPrincipales.filter((tarjeta) => coincide([tarjeta.titulo, tarjeta.descripcion, tarjeta.etiqueta])); 

  const renderTarjetaPrincipal = (tarjeta) => ` 
    <div class="normativa-card"> 
      <div class="normativa-icon">${tarjeta.icono}</div> 
      <div class="normativa-info"> 
        <h3>${escaparHTML(tarjeta.titulo)}</h3> 
        <p>${escaparHTML(tarjeta.descripcion)}</p> 
        <span>${escaparHTML(tarjeta.etiqueta)}</span> 
      </div> 
      <button type="button" class="normativa-open" data-law="${escaparHTML(tarjeta.tipo)}">Ver</button> 
    </div> 
  `; 

  if (!principalesFiltradas.length) { 
    lista.innerHTML = ` 
      <div class="empty-state"> 
        <div class="empty-icon">🔍</div> 
        <h3>Sin resultados</h3> 
        <p>No se ha encontrado normativa con esa búsqueda.</p> 
      </div> 
    `; 
    return; 
  } 

  lista.innerHTML = `<div class="normativa-list normativa-list--principal">${principalesFiltradas.map(renderTarjetaPrincipal).join("")}</div>`; 
} 

function obtenerOtrasNormas() { 
  return estado.infracciones.filter((item) => item.origenSimple === true); 
} 

function abrirNormativa(tipo, id = "") { 
  if (tipo === "lopsc") return abrirLOPSC(); 
  if (tipo === "codigo-penal") return abrirCodigoPenal(); 
  if (tipo === "menores") return abrirMenoresGrupo(); 
  if (tipo === "ley-menor") return abrirLeyMenor(id); 
  if (tipo === "violencia-genero") return abrirViolenciaGeneroGrupo(); 
  if (tipo === "ley-violencia-genero") return abrirLeyViolenciaGenero(id); 
  if (tipo === "animales") return abrirAnimales(); 
  if (tipo === "ley-animal") return abrirLeyAnimal(id); 
  if (tipo === "trafico") return abrirTrafico(); 
  if (tipo === "ley-trafico") return abrirLeyTrafico(id); 
  if (tipo === "ordenanzas") return abrirOrdenanzas(); 
  if (tipo === "ordenanza") return abrirOrdenanza(id); 
  if (tipo === "otras-normas") return abrirOtrasNormas(); 
  if (tipo === "otra-ley") return abrirLeyOtraNorma(id); 
  if (tipo === "normativa-home") cerrarVisorNormativa(); 
} 

function abrirOtrasNormas() { 
  const otrasNormas = obtenerOtrasNormas(); 
  const visor = $("normativaViewer"); 
  const contenido = $("viewerContent"); 
  if (!visor || !contenido) return; 

  $("viewerTitle").textContent = "Otras normas de interés"; 
  $("viewerSubtitle").textContent = "LOFCS, LECrim, extranjería, armas, seguridad privada y más"; 

  const grupos = new Map(); 
  otrasNormas.forEach((item) => { 
    const clave = item.ley || "Sin clasificar"; 
    if (!grupos.has(clave)) grupos.set(clave, []); 
    grupos.get(clave).push(item); 
  }); 

  contenido.innerHTML = ` 
    <div class="normativa-list"> 
      ${[...grupos.entries()].map(([ley, items]) => ` 
        <div class="normativa-card"> 
          <div class="normativa-icon">📚</div> 
          <div class="normativa-info"> 
            <h3>${escaparHTML(ley)}</h3> 
            <p>${items.length} ${items.length === 1 ? "artículo" : "artículos"}</p> 
          </div> 
          <button type="button" class="normativa-open" data-law="otra-ley" data-id="${escaparHTML(ley)}">Ver</button> 
        </div> 
      `).join("")} 
    </div> 
  `; 

  visor.classList.remove("hidden"); 
  visor.scrollIntoView({ behavior: "smooth", block: "start" }); 
} 

function abrirLeyOtraNorma(ley) { 
  const items = obtenerOtrasNormas().filter((item) => item.ley === ley); 
  const visor = $("normativaViewer"); 
  const contenido = $("viewerContent"); 
  if (!items.length || !visor || !contenido) return; 

  $("viewerTitle").textContent = ley || "Normativa"; 
  $("viewerSubtitle").textContent = `${items.length} ${items.length === 1 ? "artículo" : "artículos"}`; 

  contenido.innerHTML = ` 
    <button type="button" class="normativa-open law-back-button" data-law="otras-normas">← Volver a Otras normas</button> 
    ${items.map((item) => ` 
      <article class="law-article"> 
        <h4>${escaparHTML(item.codigo || "")} ${escaparHTML(item.titulo || "")}</h4> 
        <p>${escaparHTML(item.conducta || "")}</p> 
        ${item.gravedad ? `<p><strong>Gravedad:</strong> ${escaparHTML(item.gravedad)}</p>` : ""} 
        ${item.sancion?.texto ? `<p><strong>Sanción:</strong> ${escaparHTML(item.sancion.texto)}</p>` : ""} 
      </article> 
    `).join("")} 
  `; 

  visor.classList.remove("hidden"); 
  visor.scrollIntoView({ behavior: "smooth", block: "start" }); 
} 

function abrirLOPSC() { 
  const articulos = extraerArticulos(estado.lopsc); 
  const visor = $("normativaViewer"); 
  const contenido = $("viewerContent"); 
  if (!visor || !contenido) return; 

  $("viewerTitle").textContent = "Ley Orgánica 4/2015"; 
  $("viewerSubtitle").textContent = "Protección de la seguridad ciudadana"; 

  contenido.innerHTML = articulos.map((articulo) => `
    <article class="law-article"> 
      <h4>Artículo ${escaparHTML(articulo.numero)}. ${escaparHTML(articulo.titulo || "")}</h4> 
      <p>${escaparHTML(articulo.texto || "")}</p> 
    </article> 
  `).join(""); 

  visor.classList.remove("hidden"); 
  visor.scrollIntoView({ behavior: "smooth", block: "start" }); 
}

function abrirCodigoPenal() { 
  const articulos = extraerArticulos(estado.codigoPenal); 
  const visor = $("normativaViewer"); 
  const contenido = $("viewerContent"); 
  if (!visor || !contenido) return; 

  $("viewerTitle").textContent = "Código Penal (LO 10/1995)"; 
  $("viewerSubtitle").textContent = "Selección de delitos de interés policial"; 

  contenido.innerHTML = articulos.map((articulo) => `
    <article class="law-article"> 
      <h4>Artículo ${escaparHTML(articulo.numero)}. ${escaparHTML(articulo.titulo || "")}</h4> 
      <p>${escaparHTML(articulo.texto || "")}</p> 
    </article> 
  `).join(""); 

  visor.classList.remove("hidden"); 
  visor.scrollIntoView({ behavior: "smooth", block: "start" }); 
}

function abrirOrdenanzas() { 
  const categorias = Array.isArray(estado.ordenanzas?.categorias) ? estado.ordenanzas.categorias : []; 
  const ordenanzas = extraerOrdenanzas(estado.ordenanzas); 
  const visor = $("normativaViewer"); 
  const contenido = $("viewerContent"); 
  if (!visor || !contenido) return; 

  $("viewerTitle").textContent = "Ordenanzas municipales"; 
  $("viewerSubtitle").textContent = `Normativa local por categorías — ${ordenanzas.length} ordenanzas`; 

  const grupos = renderGruposOrdenanzas(categorias, ordenanzas); 
  contenido.innerHTML = (!ordenanzas.length || !grupos) ? `<div class="empty-state"><h3>Sin ordenanzas disponibles</h3></div>` : `<div class="ordenanza-groups">${grupos}</div>`; 

  visor.classList.remove("hidden"); 
  visor.scrollIntoView({ behavior: "smooth", block: "start" }); 
} 

function abrirOrdenanza(id) {
  const ordenanzas = extraerOrdenanzas(estado.ordenanzas);
  const ordenanza = ordenanzas.find((item) => item.id === id);
  const visor = $("normativaViewer");
  const contenido = $("viewerContent");
  if (!ordenanza || !visor || !contenido) return;

  $("viewerTitle").textContent = ordenanza.nombre || ordenanza.nombre_corto || "Ordenanza municipal";
  $("viewerSubtitle").textContent = ordenanza.codigo || "";

  contenido.innerHTML = `
    <button type="button" class="normativa-open law-back-button" data-law="ordenanzas">← Volver a Ordenanzas</button>
    <article class="law-article">
      <h4>${escaparHTML(ordenanza.nombre || "")}</h4>
      <p>${escaparHTML(ordenanza.descripcion || "")}</p>
      ${ordenanza.articulos ? ordenanza.articulos.map(a => `
        <div style="margin-top:1rem;">
          <h5>Art. ${escaparHTML(a.numero)} ${escaparHTML(a.titulo || "")}</h5>
          <p>${escaparHTML(a.texto || "")}</p>
        </div>
      `).join("") : ""}
    </article>
  `;

  visor.classList.remove("hidden");
  visor.scrollIntoView({ behavior: "smooth", block: "start" });
}

function abrirAnimales() { 
  const leyes = extraerLeyes(estado.animales); 
  const visor = $("normativaViewer"); 
  const contenido = $("viewerContent"); 
  if (!visor || !contenido) return; 

  $("viewerTitle").textContent = "Animales"; 
  $("viewerSubtitle").textContent = "Bienestar animal y tenencia de PPP"; 

  contenido.innerHTML = ` 
    <div class="normativa-list"> 
      ${leyes.map((leyItem) => ` 
        <div class="normativa-card"> 
          <div class="normativa-icon">🐾</div> 
          <div class="normativa-info"> 
            <h3>${escaparHTML(leyItem.ley || "")}</h3> 
            <p>${escaparHTML(leyItem.abreviatura || "")}</p> 
          </div> 
          <button type="button" class="normativa-open" data-law="ley-animal" data-id="${escaparHTML(leyItem.id)}">Ver</button> 
        </div> 
      `).join("")} 
    </div> 
  `; 

  visor.classList.remove("hidden"); 
  visor.scrollIntoView({ behavior: "smooth", block: "start" }); 
} 

function abrirLeyAnimal(id) { 
  const leyes = extraerLeyes(estado.animales); 
  const leyItem = leyes.find((item) => item.id === id); 
  const visor = $("normativaViewer"); 
  const contenido = $("viewerContent"); 
  if (!leyItem || !visor || !contenido) return; 

  $("viewerTitle").textContent = leyItem.ley || "Normativa de animales"; 
  $("viewerSubtitle").textContent = leyItem.abreviatura || ""; 
  const articulos = Array.isArray(leyItem.articulos) ? leyItem.articulos : []; 

  contenido.innerHTML = ` 
    <button type="button" class="normativa-open law-back-button" data-law="animales">← Volver a Animales</button> 
    ${articulos.map((articulo) => ` 
      <article class="law-article"> 
        <h4>Artículo ${escaparHTML(articulo.numero)}. ${escaparHTML(articulo.titulo || "")}</h4> 
        <p>${escaparHTML(articulo.texto || "")}</p> 
      </article> 
    `).join("")} 
  `; 

  visor.classList.remove("hidden"); 
  visor.scrollIntoView({ behavior: "smooth", block: "start" }); 
} 

function abrirMenoresGrupo() { 
  const leyes = extraerLeyes(estado.menores); 
  const visor = $("normativaViewer"); 
  const contenido = $("viewerContent"); 
  if (!visor || !contenido) return; 

  $("viewerTitle").textContent = "Menores"; 
  $("viewerSubtitle").textContent = "Actuación policial con menores de edad"; 

  contenido.innerHTML = ` 
    <div class="normativa-list"> 
      ${leyes.map((leyItem) => ` 
        <div class="normativa-card"> 
          <div class="normativa-icon">🧑‍⚖️</div> 
          <div class="normativa-info"> 
            <h3>${escaparHTML(leyItem.ley || "")}</h3> 
            <p>${escaparHTML(leyItem.abreviatura || "")}</p> 
          </div> 
          <button type="button" class="normativa-open" data-law="ley-menor" data-id="${escaparHTML(leyItem.id)}">Ver</button> 
        </div> 
      `).join("")} 
    </div> 
  `; 

  visor.classList.remove("hidden"); 
  visor.scrollIntoView({ behavior: "smooth", block: "start" }); 
} 

function abrirLeyMenor(id) { 
  const leyes = extraerLeyes(estado.menores); 
  const leyItem = leyes.find((item) => item.id === id); 
  const visor = $("normativaViewer"); 
  const contenido = $("viewerContent"); 
  if (!leyItem || !visor || !contenido) return; 

  $("viewerTitle").textContent = leyItem.ley || "Normativa de menores"; 
  $("viewerSubtitle").textContent = leyItem.abreviatura || ""; 
  const articulos = Array.isArray(leyItem.articulos) ? leyItem.articulos : []; 

  contenido.innerHTML = ` 
    <button type="button" class="normativa-open law-back-button" data-law="menores">← Volver a Menores</button> 
    ${articulos.map((articulo) => ` 
      <article class="law-article"> 
        <h4>Artículo ${escaparHTML(articulo.numero)}. ${escaparHTML(articulo.titulo || "")}</h4> 
        <p>${escaparHTML(articulo.texto || "")}</p> 
      </article> 
    `).join("")} 
  `; 

  visor.classList.remove("hidden"); 
  visor.scrollIntoView({ behavior: "smooth", block: "start" }); 
} 

function abrirViolenciaGeneroGrupo() { 
  const leyes = extraerLeyes(estado.violenciaGenero); 
  const visor = $("normativaViewer"); 
  const contenido = $("viewerContent"); 
  if (!visor || !contenido) return; 

  $("viewerTitle").textContent = "Violencia de Género"; 
  $("viewerSubtitle").textContent = "Protección integral y libertad sexual"; 

  contenido.innerHTML = ` 
    <div class="normativa-list"> 
      ${leyes.map((leyItem) => ` 
        <div class="normativa-card"> 
          <div class="normativa-icon">🛡️</div> 
          <div class="normativa-info"> 
            <h3>${escaparHTML(leyItem.ley || "")}</h3> 
            <p>${escaparHTML(leyItem.abreviatura || "")}</p> 
          </div> 
          <button type="button" class="normativa-open" data-law="ley-violencia-genero" data-id="${escaparHTML(leyItem.id)}">Ver</button> 
        </div> 
      `).join("")} 
    </div> 
  `; 

  visor.classList.remove("hidden"); 
  visor.scrollIntoView({ behavior: "smooth", block: "start" }); 
} 

function abrirLeyViolenciaGenero(id) { 
  const leyes = extraerLeyes(estado.violenciaGenero); 
  const leyItem = leyes.find((item) => item.id === id); 
  const visor = $("normativaViewer"); 
  const contenido = $("viewerContent"); 
  if (!leyItem || !visor || !contenido) return; 

  $("viewerTitle").textContent = leyItem.ley || "Violencia de Género"; 
  $("viewerSubtitle").textContent = leyItem.abreviatura || ""; 
  const articulos = Array.isArray(leyItem.articulos) ? leyItem.articulos : []; 

  contenido.innerHTML = ` 
    <button type="button" class="normativa-open law-back-button" data-law="violencia-genero">← Volver a Violencia de Género</button> 
    ${articulos.map((articulo) => ` 
      <article class="law-article"> 
        <h4>Artículo ${escaparHTML(articulo.numero)}. ${escaparHTML(articulo.titulo || "")}</h4> 
        <p>${escaparHTML(articulo.texto || "")}</p> 
      </article> 
    `).join("")} 
  `; 

  visor.classList.remove("hidden"); 
  visor.scrollIntoView({ behavior: "smooth", block: "start" }); 
} 

function abrirTrafico() { 
  const leyes = extraerLeyes(estado.trafico); 
  const visor = $("normativaViewer"); 
  const contenido = $("viewerContent"); 
  if (!visor || !contenido) return; 

  $("viewerTitle").textContent = "Tráfico"; 
  $("viewerSubtitle").textContent = "Ley de Tráfico y reglamentos"; 

  contenido.innerHTML = ` 
    <div class="normativa-list"> 
      ${leyes.map((leyItem) => ` 
        <div class="normativa-card"> 
          <div class="normativa-icon">🚦</div> 
          <div class="normativa-info"> 
            <h3>${escaparHTML(leyItem.ley || "")}</h3> 
            <p>${escaparHTML(leyItem.abreviatura || "")}</p> 
          </div> 
          <button type="button" class="normativa-open" data-law="ley-trafico" data-id="${escaparHTML(leyItem.id)}">Ver</button> 
        </div> 
      `).join("")} 
    </div> 
  `; 

  visor.classList.remove("hidden"); 
  visor.scrollIntoView({ behavior: "smooth", block: "start" }); 
} 

function abrirLeyTrafico(id) { 
  const leyes = extraerLeyes(estado.trafico); 
  const leyItem = leyes.find((item) => item.id === id); 
  const visor = $("normativaViewer"); 
  const contenido = $("viewerContent"); 
  if (!leyItem || !visor || !contenido) return; 

  $("viewerTitle").textContent = leyItem.ley || "Normativa de tráfico"; 
  $("viewerSubtitle").textContent = leyItem.abreviatura || ""; 
  const articulos = Array.isArray(leyItem.articulos) ? leyItem.articulos : []; 

  contenido.innerHTML = ` 
    <button type="button" class="normativa-open law-back-button" data-law="trafico">← Volver a Tráfico</button> 
    ${articulos.map((articulo) => ` 
      <article class="law-article"> 
        <h4>Artículo ${escaparHTML(articulo.numero)}. ${escaparHTML(articulo.titulo || "")}</h4> 
        <p>${escaparHTML(articulo.texto || "")}</p> 
      </article> 
    `).join("")} 
  `; 

  visor.classList.remove("hidden"); 
  visor.scrollIntoView({ behavior: "smooth", block: "start" }); 
} 

function cerrarVisorNormativa() {
  const visor = $("normativaViewer");
  if (visor) visor.classList.add("hidden");
}

/* =========================================================
ASISTENTE IA POLICIAL
========================================================= */

function configurarAsistenteIA() {

  const btnSend = $("btnSendChat");
  const input = $("chatInput");
  const container = $("chatMessages");

  if (!btnSend || !input || !container) return;


  async function responderIA(mensaje) {


    const userBubble = document.createElement("div");

    userBubble.className = "chat-bubble user";

    userBubble.style.cssText =
      "background:#0f172a;padding:12px;border-radius:8px;color:#fff;align-self:flex-end;max-width:85%;font-size:0.95rem;";

    userBubble.textContent = mensaje;

    container.appendChild(userBubble);



    input.value = "";



    const loadingBubble = document.createElement("div");

    loadingBubble.className = "chat-bubble ai";

    loadingBubble.style.cssText =
      "background:#334155;padding:12px;border-radius:8px;color:#f8fafc;max-width:85%;";

    loadingBubble.textContent =
      "🤖 Centinela IA está consultando...";

    container.appendChild(loadingBubble);



    container.scrollTop = container.scrollHeight;



    try {


      const respuesta = await preguntarCentinelaIA(mensaje);



      loadingBubble.remove();



      const aiBubble = document.createElement("div");


      aiBubble.className = "chat-bubble ai";


      aiBubble.style.cssText =
        "background:#334155;padding:12px;border-radius:8px;color:#f8fafc;max-width:85%;font-size:0.95rem;white-space:pre-wrap;";


      aiBubble.innerHTML =
        "🤖 <strong>Centinela IA:</strong><br><br>" +
        (typeof respuesta === "string"
          ? respuesta.replace(/\n/g,"<br>")
          : JSON.stringify(respuesta));



      container.appendChild(aiBubble);



    } catch(error) {


      console.error(
        "Error IA:",
        error
      );


      loadingBubble.remove();



      const errorBubble =
        document.createElement("div");


      errorBubble.className =
        "chat-bubble ai";


      errorBubble.textContent =
        "❌ Error conectando con Centinela IA";


      container.appendChild(errorBubble);


    }



    container.scrollTop =
      container.scrollHeight;


  }



  btnSend.addEventListener(
    "click",
    () => {

      const txt =
        input.value.trim();

      if (txt)
        responderIA(txt);

    }
  );



  input.addEventListener(
    "keydown",
    (e)=>{

      if(e.key === "Enter"){

        const txt =
          input.value.trim();

        if(txt)
          responderIA(txt);

      }

    }
  );

}



/* =========================================================
AJUSTES Y DATOS DEL AGENTE
========================================================= */

function cargarDatosAgente() {

  const nombre =
    localStorage.getItem("centinela_agente_nombre") || "";

  const tip =
    localStorage.getItem("centinela_agente_tip") || "";


  if ($("agentNameInput"))
    $("agentNameInput").value = nombre;


  if ($("agentIdInput"))
    $("agentIdInput").value = tip;


  if ($("agentName"))
    $("agentName").textContent =
      nombre || "Agente sin configurar";


  if ($("agentId"))
    $("agentId").textContent =
      tip
      ? `TIP / ID: ${tip}`
      : "Configura tu identificador en Ajustes";

}



function configurarAjustes() {

  cargarDatosAgente();



  $("saveAgentButton")?.addEventListener(
    "click",
    () => {

      const nombre =
        $("agentNameInput")?.value.trim() || "";

      const tip =
        $("agentIdInput")?.value.trim() || "";


      localStorage.setItem(
        "centinela_agente_nombre",
        nombre
      );


      localStorage.setItem(
        "centinela_agente_tip",
        tip
      );


      cargarDatosAgente();


      mostrarToast(
        "Datos del agente guardados."
      );

    }
  );



  $("agentCard")?.addEventListener(
    "click",
    () => {

      activarSeccion("ajustes");

    }
  );



  $("reloadDataButton")?.addEventListener(
    "click",
    async () => {

      mostrarCarga(true);

      await cargarDatos();

      mostrarCarga(false);

    }
  );



  $("clearDraftsButton")?.addEventListener(
    "click",
    () => {

      if(confirm(
        "¿Estás seguro de que deseas limpiar los borradores del acta?"
      )){

        cerrarEditorActa();

        mostrarToast(
          "Borradores limpiados."
        );

      }

    }
  );

}



/* =========================================================
EVENTOS DELEGADOS Y MODAL
========================================================= */

function configurarEventosDelegados() {

  document.addEventListener(
    "click",
    (e)=>{


      const btnInfraccion =
        e.target.closest("[data-infraccion-id]");


      if(btnInfraccion){

        abrirDetalleInfraccion(
          btnInfraccion.dataset.infraccionId
        );

        return;

      }



      const btnLaw =
        e.target.closest("[data-law]");


      if(btnLaw){

        abrirNormativa(
          btnLaw.dataset.law,
          btnLaw.dataset.id || ""
        );

        return;

      }



      const btnNavTipo =
        e.target.closest("[data-nav-tipo]");


      if(btnNavTipo){

        activarSeccion("normativa");

        abrirNormativa(
          btnNavTipo.dataset.navTipo,
          btnNavTipo.dataset.navId || ""
        );

        return;

      }



      const btnEdit =
        e.target.closest("[data-edit-acta]");


      if(btnEdit){

        editarActa(
          btnEdit.dataset.editActa
        );

        return;

      }



      const btnPdf =
        e.target.closest("[data-pdf-acta]");


      if(btnPdf){

        exportarActaPDF(
          btnPdf.dataset.pdfActa
        );

        return;

      }



      const btnDelete =
        e.target.closest("[data-delete-acta]");


      if(btnDelete){

        borrarActa(
          btnDelete.dataset.deleteActa
        );

        return;

      }


    }
  );



  $("closeModal")?.addEventListener(
    "click",
    cerrarModal
  );


  $("modalOverlay")?.addEventListener(
    "click",
    cerrarModal
  );


}



/* =========================================================
INICIALIZACIÓN DE LA APLICACIÓN
========================================================= */

async function iniciarAplicacion() {

  if(appInicializada)
    return;


  mostrarCarga(true);


  inyectarBotonLogout();


  configurarNavegacion();


  configurarConsulta();


  configurarActas();


  configurarNormativa();


  configurarAsistenteIA();


  configurarAjustes();


  configurarEventosDelegados();


  actualizarRed();



  window.addEventListener(
    "online",
    actualizarRed
  );


  window.addEventListener(
    "offline",
    actualizarRed
  );



  await cargarDatos();


  await cargarActas();



  mostrarCarga(false);



  appInicializada = true;

}




document.addEventListener(
  "DOMContentLoaded",
  async()=>{


    const sesion =
      await obtenerSesion();



    if(sesion){

      ocultarPantallaLogin();

      await iniciarAplicacion();

    }
    else{

      mostrarPantallaLogin();

      mostrarCarga(false);

    }


  }
);
