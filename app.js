/* 
============================================================ 
CENTINELA CODE 
app.js - Con Supabase Auth + actas en la nube
============================================================ 

Funciones: 
- Carga de infracciones, LOPSC y ordenanzas. 
- Consulta por código, artículo, palabra y gravedad. 
- Navegación inferior y accesos rápidos. 
- Autenticación con Supabase Auth (email + contraseña). 
- Creación, edición y borrado de actas sincronizadas en Supabase. 
- Visor de LOPSC y ordenanzas. 
- Estado de conexión y estado de las bases. 
- Limpieza/recarga de datos. 
- Compatible con la estructura actual de index.html. 
============================================================ 
*/ 

"use strict";

// ============================================================
// SUPABASE – configuración
// La librería se carga como UMD desde el index.html ANTES de
// este script, exponiendo window.supabase como global.
// ============================================================
const SUPABASE_URL  = "https://okuygqbaliaeavhyezri.supabase.co";
const SUPABASE_ANON = "sb_publishable_fbEAcJZxMv8PD3VB3Bcx6A_l_8BdP2m";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

// ============================================================
// AUTH HELPERS
// ============================================================
let usuarioActual = null;

async function obtenerSesion() {
  const { data: { session } } = await supabase.auth.getSession();
  usuarioActual = session?.user ?? null;
  return usuarioActual;
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
// PANTALLA DE LOGIN (inyectada dinámicamente)
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

  document.getElementById("loginBtn").addEventListener("click", async () => {
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

  document.getElementById("registroBtn").addEventListener("click", async () => {
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

  // Entrar con Enter
  document.getElementById("loginPassword").addEventListener("keydown", e => {
    if (e.key === "Enter") document.getElementById("loginBtn").click();
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

// Botón de cerrar sesión en Ajustes (lo añadimos si existe el contenedor)
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
  document.getElementById("logoutBtn").addEventListener("click", cerrarSesion);
} 

const CONFIG = { 
VERSION: "1.1.0", 
RUTAS: { 
infracciones: "./data/infracciones.json", 
infraccionesTrafico: "./data/infracciones_trafico.json", 
lopsc: "./data/lopsc.json", 
codigoPenal: "./data/codigo_penal.json", 
menores: "./data/normativa_menores.json", 
violenciaGenero: "./data/normativa_violencia_genero.json", 
ordenanzas: "./data/ordenanzas.json", 
animales: "./data/normativa_animales.json", 
trafico: "./data/normativa_trafico.json" 
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

/* ========================================================= 
BUSQUEDA POR PALABRAS (tokenizada + sinonimos) 

El buscador antiguo comparaba la consulta completa como una 
unica cadena ("includes"), por lo que fallaba en cuanto el 
orden de las palabras no coincidia exactamente con el texto 
de la ley (p. ej. "distancia seguridad" no encontraba 
"distancia DE seguridad") o cuando se usaba una palabra 
coloquial distinta a la que aparece en el articulado 
(p. ej. "agresion a agente" no encontraba "Atentado", cuyo 
texto habla de "agredieren... a la autoridad, a sus agentes"). 

Este bloque resuelve ambos problemas: 
1) Se divide la consulta en palabras sueltas y se exige que 
   TODAS aparezcan en el contenido, en cualquier orden. 
2) Las palabras vacias (de, la, el...) no son obligatorias si 
   hay otras palabras con significado en la consulta. 
3) Un diccionario de sinonimos permite que un termino 
   coloquial o policial habitual encuentre el articulo aunque 
   la ley use otra palabra. Es facil de ampliar: basta con 
   añadir una entrada nueva al objeto SINONIMOS_BUSQUEDA. 
========================================================= */ 

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

const significativos = tokens.filter( 
(token) => !STOPWORDS_BUSQUEDA.has(token) 
); 

return significativos.length ? significativos : tokens; 
} 

function coincideConsulta(contenidoNormalizado, tokens) { 
if (!tokens.length) { 
return false; 
} 

return tokens.every((token) => { 
if (contenidoNormalizado.includes(token)) { 
return true; 
} 

const sinonimos = SINONIMOS_BUSQUEDA[token]; 

if (!sinonimos) { 
return false; 
} 

return sinonimos.some( 
(alternativa) => contenidoNormalizado.includes(alternativa) 
); 
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

if (!toast || !texto) { 
return; 
} 

texto.textContent = mensaje; 
toast.classList.add("show"); 

clearTimeout(mostrarToast.timer); 
mostrarToast.timer = setTimeout(() => { 
toast.classList.remove("show"); 
}, 2800); 
} 

function mostrarCarga(visible) { 
const pantalla = $("loadingScreen"); 

if (!pantalla) { 
return; 
} 

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
section.classList.toggle( 
"active", 
section.dataset.section === nombre 
); 
}); 

document.querySelectorAll(".nav-item").forEach((item) => { 
item.classList.toggle( 
"active", 
item.dataset.section === nombre 
); 
}); 

window.scrollTo({ 
top: 0, 
behavior: "smooth" 
}); 
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
if (!respuesta.ok) {
throw new Error(`No se pudo cargar ${ruta} (${respuesta.status})`);
}
return await respuesta.json();
} finally {
clearTimeout(temporizador);
}
} 

function extraerInfracciones(datos) { 
if (Array.isArray(datos)) { 
return datos; 
} 

if (datos && Array.isArray(datos.infracciones)) { 
return datos.infracciones; 
} 

return []; 
} 

function extraerArticulos(datos) { 
if (datos && Array.isArray(datos.articulos)) { 
return datos.articulos; 
} 

return []; 
} 

const PALABRAS_CLAVE_EXTRA_36_16 = [
"hachis", 
"hachís", 
"cocaina", 
"cocaína", 
"marihuana", 
"resina de hachis", 
"resina de hachís", 
"mdma", 
"extasis", 
"éxtasis", 
"anfetaminas", 
"heroina", 
"heroína", 
"sustancia estupefaciente", 
"sustancias estupefacientes", 
"droga toxica", 
"droga tóxica", 
"drogas toxicas", 
"drogas tóxicas", 
"sustancia psicotropica", 
"sustancia psicotrópica", 
"consumo via publica", 
"consumo vía pública", 
"tenencia ilicita", 
"tenencia ilícita", 
"planta de cannabis", 
"plantas de cannabis", 
"cultivo de cannabis" 
]; 

function aplicarPalabrasClaveExtra(infracciones) { 

if (!Array.isArray(infracciones)) { 
return; 
} 

infracciones.forEach((infraccion) => { 

const esArt36_16 = 
String(infraccion.articulo) === "36" && 
String(infraccion.apartado) === "16"; 

if (!esArt36_16) { 
return; 
} 

const existentes = Array.isArray(infraccion.palabrasClave) 
? infraccion.palabrasClave 
: []; 

const combinadas = existentes.concat( 
PALABRAS_CLAVE_EXTRA_36_16.filter( 
(palabra) => !existentes.includes(palabra) 
) 
); 

infraccion.palabrasClave = combinadas; 
}); 
} 

function extraerAnimales(datos) { 
if (datos && Array.isArray(datos.leyes)) { 
return datos.leyes; 
} 

return []; 
} 

function extraerTrafico(datos) { 
if (datos && Array.isArray(datos.leyes)) { 
return datos.leyes; 
} 

return []; 
} 

function extraerOrdenanzas(datos) { 
if (Array.isArray(datos)) { 
return datos; 
} 

if (datos && Array.isArray(datos.ordenanzas)) { 
return datos.ordenanzas; 
} 

return []; 
} 

function renderTarjetaOrdenanza(ordenanza) { 
const titulo = 
ordenanza.nombre || 
ordenanza.nombre_corto || 
"Ordenanza municipal"; 

return ` 
<div class="normativa-card"> 

<div class="normativa-icon"> 
📋 
</div> 

<div class="normativa-info"> 

<h3> 
${escaparHTML(titulo)} 
</h3> 

<p> 
${escaparHTML(ordenanza.descripcion || "")} 
</p> 

<span> 
${escaparHTML(ordenanza.codigo || "Ordenanza")} 
</span> 

</div> 

<button 
type="button" 
class="normativa-open" 
data-law="ordenanza" 
data-id="${escaparHTML(ordenanza.id)}" 
> 
Ver ficha 
</button> 

</div> 
`; 
} 

function renderGruposOrdenanzas(categorias, ordenanzas) { 
return categorias 
.map((categoria) => { 
const items = 
ordenanzas.filter( 
(ordenanza) => ordenanza.categoria === categoria.id 
); 

if (!items.length) { 
return ""; 
} 

return ` 
<details class="ordenanza-group"> 

<summary> 
<span class="ordenanza-group-nombre"> 
${escaparHTML(categoria.nombre)} 
</span> 
<span class="ordenanza-group-count"> 
${items.length} 
</span> 
</summary> 

<div class="normativa-list normativa-list--nested"> 
${items.map(renderTarjetaOrdenanza).join("")} 
</div> 

</details> 
`; 
}) 
.join(""); 
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
cargarJSON(CONFIG.RUTAS.trafico) 
]); 

const [rInfracciones, rInfraccionesTrafico, rLopsc, rCodigoPenal, rMenores, rViolenciaGenero, rOrdenanzas, rAnimales, rTrafico] = resultados; 

if (rInfracciones.status === "fulfilled") { 
estado.infracciones = extraerInfracciones( 
rInfracciones.value 
); 
aplicarPalabrasClaveExtra(estado.infracciones); 
} else { 
estado.infracciones = []; 
console.error( 
"Error cargando infracciones:", 
rInfracciones.reason 
); 
} 

if (rInfraccionesTrafico.status === "fulfilled") { 
estado.infracciones = estado.infracciones.concat( 
extraerInfracciones(rInfraccionesTrafico.value) 
); 
} else { 
console.error( 
"Error cargando infracciones de tráfico:", 
rInfraccionesTrafico.reason 
); 
} 

if (rLopsc.status === "fulfilled") { 
estado.lopsc = rLopsc.value; 
} else { 
estado.lopsc = null; 
console.error( 
"Error cargando LOPSC:", 
rLopsc.reason 
); 
} 

if (rCodigoPenal.status === "fulfilled") { 
estado.codigoPenal = rCodigoPenal.value; 
} else { 
estado.codigoPenal = null; 
console.error( 
"Error cargando Código Penal:", 
rCodigoPenal.reason 
); 
} 

if (rMenores.status === "fulfilled") { 
estado.menores = rMenores.value; 
} else { 
estado.menores = null; 
console.error( 
"Error cargando LO Menores:", 
rMenores.reason 
); 
} 

if (rViolenciaGenero.status === "fulfilled") { 
estado.violenciaGenero = rViolenciaGenero.value; 
} else { 
estado.violenciaGenero = null; 
console.error( 
"Error cargando normativa de violencia de género:", 
rViolenciaGenero.reason 
); 
} 

if (rOrdenanzas.status === "fulfilled") { 
estado.ordenanzas = rOrdenanzas.value; 
} else { 
estado.ordenanzas = null; 
console.error( 
"Error cargando ordenanzas:", 
rOrdenanzas.reason 
); 
} 

if (rAnimales.status === "fulfilled") { 
estado.animales = rAnimales.value; 
} else { 
estado.animales = null; 
console.error( 
"Error cargando normativa de animales:", 
rAnimales.reason 
); 
} 

if (rTrafico.status === "fulfilled") { 
estado.trafico = rTrafico.value; 
} else { 
estado.trafico = null; 
console.error( 
"Error cargando normativa de tráfico:", 
rTrafico.reason 
); 
} 

actualizarEstadoDatos(); 
actualizarBusqueda(); 
renderizarNormativa(); 

const correctos = resultados.filter( 
(resultado) => resultado.status === "fulfilled" 
).length; 

if (correctos === resultados.length) { 
mostrarToast("Datos cargados correctamente."); 
} else { 
mostrarToast( 
`Datos cargados: ${correctos}/${resultados.length} bases disponibles.` 
); 
} 
} 

/* ========================================================= 
ESTADO DEL SISTEMA 
========================================================= */ 

function establecerEstado(elemento, texto, correcto) { 
if (!elemento) { 
return; 
} 

elemento.textContent = texto; 

elemento.classList.toggle( 
"success", 
Boolean(correcto) 
); 

elemento.classList.toggle( 
"error", 
correcto === false 
); 
} 

function actualizarEstadoDatos() { 
const hayLopsc = 
Boolean(estado.lopsc) && 
extraerArticulos(estado.lopsc).length > 0; 

const hayInfracciones = 
estado.infracciones.length > 0; 

const hayOrdenanzas = 
Boolean(estado.ordenanzas) && 
extraerOrdenanzas(estado.ordenanzas).length > 0; 

const contarArticulosLeyes = (leyes) => 
leyes.reduce( 
(total, leyItem) => 
total + (Array.isArray(leyItem.articulos) ? leyItem.articulos.length : 0), 
0 
); 

const totalArticulosBase = 
extraerArticulos(estado.lopsc).length + 
contarArticulosLeyes(extraerAnimales(estado.animales)) + 
contarArticulosLeyes(extraerTrafico(estado.trafico)); 

const hayBaseNormativa = totalArticulosBase > 0; 

establecerEstado( 
$("homeNormativaStatus"), 
hayBaseNormativa 
? `${totalArticulosBase} artículos` 
: "No disponible", 
hayBaseNormativa 
); 

establecerEstado( 
$("homeInfraccionesStatus"), 
hayInfracciones 
? `${estado.infracciones.length} infracciones` 
: "No disponible", 
hayInfracciones 
); 

establecerEstado( 
$("homeOrdenanzasStatus"), 
hayOrdenanzas 
? `${extraerOrdenanzas(estado.ordenanzas).length} ordenanzas` 
: "No disponible", 
hayOrdenanzas 
); 

establecerEstado( 
$("settingsLopscStatus"), 
hayLopsc ? "Disponible" : "No disponible", 
hayLopsc 
); 

establecerEstado( 
$("settingsInfraccionesStatus"), 
hayInfracciones ? "Disponible" : "No disponible", 
hayInfracciones 
); 

establecerEstado( 
$("settingsOrdenanzasStatus"), 
hayOrdenanzas ? "Disponible" : "No disponible", 
hayOrdenanzas 
); 
} 

function actualizarRed() { 
const conectado = navigator.onLine; 

establecerEstado( 
$("homeNetworkStatus"), 
conectado ? "Online" : "Offline", 
conectado 
); 

const modo = $("appMode"); 

if (modo) { 
modo.textContent = conectado 
? "Online" 
: "Offline"; 
} 
} 

/* ========================================================= 
NAVEGACIÓN 
========================================================= */ 

function configurarNavegacion() { 
document.querySelectorAll( 
".nav-item[data-section]" 
).forEach((boton) => { 
boton.addEventListener("click", () => { 
activarSeccion(boton.dataset.section); 
}); 
}); 

document.querySelectorAll( 
".quick-action[data-target]" 
).forEach((boton) => { 
boton.addEventListener("click", () => { 
activarSeccion(boton.dataset.target); 
}); 
}); 

const buscarCabecera = 
$("headerSearchButton"); 

if (buscarCabecera) { 
buscarCabecera.addEventListener("click", () => { 
activarSeccion("consulta"); 

setTimeout(() => { 
$("consultaSearch")?.focus(); 
}, 100); 
}); 
} 
} 

/* ========================================================= 
CONSULTA DE INFRACCIONES 
========================================================= */ 

function configurarConsulta() { 
const input = $("consultaSearch"); 

if (input) { 
input.addEventListener("input", () => { 
actualizarBusqueda(); 
}); 
} 

const limpiar = 
$("clearConsultaSearch"); 

if (limpiar) { 
limpiar.addEventListener("click", () => { 
if (input) { 
input.value = ""; 
input.focus(); 
} 

actualizarBusqueda(); 
}); 
} 

document.querySelectorAll( 
".filter-chip[data-severity]" 
).forEach((boton) => { 
boton.addEventListener("click", () => { 

document.querySelectorAll( 
".filter-chip[data-severity]" 
).forEach((item) => { 
item.classList.remove("active"); 
}); 

boton.classList.add("active"); 

estado.gravedad = 
boton.dataset.severity || "all"; 

actualizarBusqueda(); 
}); 
}); 
} 

function obtenerArticulosNormativa() { 
const registros = []; 

const agregarLeySimple = (datos, navTipo) => { 
if (!datos || !Array.isArray(datos.articulos)) { 
return; 
} 

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
const leyes = 
datos && Array.isArray(datos.leyes) ? datos.leyes : []; 

leyes.forEach((leyItem) => { 
const articulos = 
Array.isArray(leyItem.articulos) ? leyItem.articulos : []; 

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

const ordenanzas = 
extraerOrdenanzas(estado.ordenanzas); 

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

const valorBusqueda = 
input ? input.value : ""; 

const texto = 
normalizarTexto(valorBusqueda); 

const tokens = 
tokenizarConsulta(valorBusqueda); 

const gravedad = 
estado.gravedad; 

const resultadosInfracciones = 
estado.infracciones.filter((infraccion) => { 

if ( 
gravedad !== "all" && 
String( 
infraccion.gravedad || "" 
) !== gravedad 
) { 
return false; 
} 

if (!tokens.length) { 
return false; 
} 

const palabras = Array.isArray( 
infraccion.palabrasClave 
) 
? infraccion.palabrasClave 
: []; 

const responsables = Array.isArray( 
infraccion.responsables 
) 
? infraccion.responsables 
: []; 

const contenido = [ 
infraccion.id, 
infraccion.codigo, 
infraccion.ley, 
infraccion.articulo, 
infraccion.apartado, 
infraccion.titulo, 
infraccion.conducta, 
infraccion.gravedad, 
...palabras, 
...responsables 
].join(" "); 

return coincideConsulta( 
normalizarTexto(contenido), 
tokens 
); 
}).map((infraccion) => ({ 
...infraccion, 
tipoResultado: "infraccion" 
})); 

let resultadosArticulos = []; 

if (tokens.length && gravedad === "all") { 
resultadosArticulos = 
obtenerArticulosNormativa() 
.filter((articulo) => { 
const contenido = [ 
articulo.ley, 
articulo.leyCompleta, 
articulo.numero, 
articulo.titulo, 
articulo.texto 
].join(" "); 

return coincideConsulta( 
normalizarTexto(contenido), 
tokens 
); 
}) 
.map((articulo) => ({ 
...articulo, 
tipoResultado: "articulo" 
})); 
} 

estado.resultados = 
resultadosInfracciones.concat(resultadosArticulos); 

ordenarResultados(texto); 
renderizarResultados(); 
} 

function ordenarResultados(texto) { 
if (!texto) { 
return; 
} 

const obtenerCodigo = (item) => 
item.tipoResultado === "articulo" 
? String(item.numero || "") 
: String(item.codigo || ""); 

estado.resultados.sort((a, b) => { 

const codigoA = 
normalizarTexto(obtenerCodigo(a)); 

const codigoB = 
normalizarTexto(obtenerCodigo(b)); 

if (codigoA === texto && 
codigoB !== texto) { 
return -1; 
} 

if (codigoB === texto && 
codigoA !== texto) { 
return 1; 
} 

if ( 
a.tipoResultado !== b.tipoResultado 
) { 
return a.tipoResultado === "infraccion" ? -1 : 1; 
} 

const tituloA = 
normalizarTexto(a.titulo); 

const tituloB = 
normalizarTexto(b.titulo); 

if ( 
tituloA.startsWith(texto) && 
!tituloB.startsWith(texto) 
) { 
return -1; 
} 

if ( 
tituloB.startsWith(texto) && 
!tituloA.startsWith(texto) 
) { 
return 1; 
} 

return obtenerCodigo(a) 
.localeCompare( 
obtenerCodigo(b), 
"es", 
{ numeric: true } 
); 
}); 
} 

function renderizarResultados() { 
const contenedor = 
$("consultaResults"); 

const contador = 
$("consultaResultCount"); 

if (!contenedor) { 
return; 
} 

if (contador) { 
contador.textContent = 
estado.resultados.length; 
} 

const input = $("consultaSearch"); 

if ( 
!input || 
!input.value.trim() 
) { 
contenedor.innerHTML = ` 
<div class="empty-state"> 
<div class="empty-icon">?</div> 
<h3>Buscar infracción</h3> 
<p> 
Introduce un código, artículo o 
palabra clave para comenzar. 
</p> 
</div> 
`; 
return; 
} 

if (!estado.resultados.length) { 
contenedor.innerHTML = ` 
<div class="empty-state"> 
<div class="empty-icon">??</div> 
<h3>Sin resultados</h3> 
<p> 
No se han encontrado coincidencias 
con esos criterios. 
</p> 
</div> 
`; 
return; 
} 

contenedor.innerHTML = 
estado.resultados 
.map((item) => 
item.tipoResultado === "articulo" 
? renderizarTarjetaArticulo(item) 
: renderizarTarjetaInfraccion(item) 
) 
.join(""); 
} 

function renderizarTarjetaArticulo(articulo) { 
const snippet = 
(articulo.texto || "").length > 220 
? articulo.texto.slice(0, 220).trim() + "…" 
: articulo.texto || ""; 

return ` 
<article class="result-card result-card--articulo"> 

<div class="result-card-header"> 

<div> 
<span class="result-ley"> 
${escaparHTML(articulo.ley || "")} 
</span> 

${articulo.numero ? ` 
<span class="result-code"> 
Art. ${escaparHTML(articulo.numero)} 
</span> 
` : ""} 

<h3> 
${escaparHTML(articulo.titulo || "Sin título")} 
</h3> 
</div> 

</div> 

<p class="result-conducta"> 
${escaparHTML(snippet)} 
</p> 

<button 
type="button" 
class="result-detail-button" 
data-nav-tipo="${escaparHTML(articulo.navTipo || "")}" 
data-nav-id="${escaparHTML(articulo.navId || "")}" 
> 
Ver en Normativa 
</button> 

</article> 
`; 
} 

function renderizarTarjetaInfraccion( 
infraccion 
) { 
const sancion = 
infraccion.sancion || {}; 

const min = 
Number.isFinite(Number(sancion.min)) 
? Number(sancion.min) 
: null; 

const max = 
Number.isFinite(Number(sancion.max)) 
? Number(sancion.max) 
: null; 

let rango = ""; 

if (min !== null && max !== null) { 
rango = 
`${formatearEuros(min)} - ${formatearEuros(max)}`; 
} else if (min !== null) { 
rango = 
`Desde ${formatearEuros(min)}`; 
} else if (max !== null) { 
rango = 
`Hasta ${formatearEuros(max)}`; 
} 

return ` 
<article class="result-card"> 

<div class="result-card-header"> 

<div> 
<span class="result-ley"> 
${escaparHTML( 
infraccion.ley || "" 
)} 
</span> 

<span class="result-code"> 
${escaparHTML( 
infraccion.codigo || "" 
)} 
</span> 

<h3> 
${escaparHTML( 
infraccion.titulo || 
"Sin título" 
)} 
</h3> 
</div> 

<span class="severity-badge"> 
${escaparHTML( 
infraccion.gravedad || "" 
)} 
</span> 

</div> 

<p class="result-conducta"> 
${escaparHTML( 
infraccion.conducta || "" 
)} 
</p> 

<div class="result-meta"> 

<span> 
Art. ${escaparHTML( 
infraccion.articulo || "" 
)} 
</span> 

${ 
rango 
? `<span>${rango}</span>` 
: "" 
} 

</div> 

<button 
type="button" 
class="result-detail-button" 
data-infraccion-id="${escaparHTML( 
infraccion.id || "" 
)}" 
> 
Ver detalle 
</button> 

</article> 
`; 
} 

function formatearEuros(numero) { 
return new Intl.NumberFormat( 
"es-ES", 
{ 
style: "currency", 
currency: "EUR", 
maximumFractionDigits: 0 
} 
).format(numero); 
} 

function abrirDetalleInfraccion(id) { 
const infraccion = 
estado.infracciones.find( 
(item) => item.id === id 
); 

if (!infraccion) { 
return; 
} 

const palabras = 
Array.isArray( 
infraccion.palabrasClave 
) 
? infraccion.palabrasClave 
: []; 

const sancion = 
infraccion.sancion || {}; 

abrirModal( 
infraccion.codigo || 
"Infracción", 
` 
<div class="detail-content"> 

<p> 
<strong>Ley:</strong> 
${escaparHTML( 
infraccion.ley || "-" 
)} 
</p> 

<p> 
<strong>Gravedad:</strong> 
${escaparHTML( 
infraccion.gravedad || "-" 
)} 
</p> 

<p> 
<strong>Artículo:</strong> 
${escaparHTML( 
infraccion.articulo || "-" 
)} 
${ 
infraccion.apartado 
? `.${escaparHTML( 
infraccion.apartado 
)}` 
: "" 
} 
</p> 

<h4>Conducta</h4> 

<p> 
${escaparHTML( 
infraccion.conducta || "" 
)} 
</p> 

${ 
sancion.min !== undefined || 
sancion.max !== undefined 
? ` 
<h4>Sanción</h4> 
<p> 
${ 
sancion.min !== undefined 
? `Mínimo: ${formatearEuros( 
sancion.min 
)}<br>` 
: "" 
} 
${ 
sancion.max !== undefined 
? `Máximo: ${formatearEuros( 
sancion.max 
)}` 
: "" 
} 
</p> 
` 
: "" 
} 

${ 
palabras.length 
? ` 
<h4>Palabras clave</h4> 
<p> 
${palabras 
.map( 
escaparHTML 
) 
.join(", ")} 
</p> 
` 
: "" 
} 

</div> 
`, 
[] 
); 
} 

/* ========================================================= 
ACTAS 
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

// guardarActas ya no se usa (cada operación va directa a Supabase)
function guardarActas() {
  // Mantenido por compatibilidad; la persistencia ahora es en Supabase
} 

function configurarActas() { 
$("newActaButton")?.addEventListener( 
"click", 
() => abrirEditorActa() 
); 

$("closeActaEditor")?.addEventListener( 
"click", 
() => cerrarEditorActa() 
); 

$("cancelActaButton")?.addEventListener( 
"click", 
() => cerrarEditorActa() 
); 

$("actaForm")?.addEventListener( 
"submit", 
guardarActaDesdeFormulario 
); 

$("actaInfraccion")?.addEventListener( 
"input", 
actualizarPreviewInfraccion 
); 

$("btnUbicacionActa")?.addEventListener( 
"click", 
obtenerUbicacionActa 
); 

$("btnDictadoHechos")?.addEventListener( 
"click", 
(evento) => alternarDictado(evento.currentTarget) 
); 

$("btnDictadoObservaciones")?.addEventListener( 
"click", 
(evento) => alternarDictado(evento.currentTarget) 
); 

renderizarActas(); 
} 

async function obtenerUbicacionActa() { 
const boton = $("btnUbicacionActa"); 
const campo = $("actaLugar"); 

if (!campo) { 
return; 
} 

if (!navigator.geolocation) { 
alert( 
"Este dispositivo o navegador no admite geolocalización." 
); 
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
{ 
headers: { 
"Accept-Language": "es" 
} 
} 
); 

if (!respuesta.ok) { 
throw new Error("Respuesta no válida"); 
} 

const datos = await respuesta.json(); 

campo.value = 
datos && datos.display_name 
? datos.display_name 
: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`; 
} catch (error) { 
console.error( 
"No se pudo obtener la dirección:", 
error 
); 

campo.value = 
`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`; 
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

let mensaje = 
"No se ha podido obtener la ubicación."; 

if (error.code === error.PERMISSION_DENIED) { 
mensaje = 
"Has denegado el permiso de ubicación. Actívalo en los ajustes del navegador para usar esta función."; 
} else if (error.code === error.TIMEOUT) { 
mensaje = 
"Se ha agotado el tiempo de espera para obtener la ubicación. Inténtalo de nuevo."; 
} 

alert(mensaje); 
}, 
{ 
enableHighAccuracy: true, 
timeout: 10000, 
maximumAge: 0 
} 
); 
} 

let reconocimientoVozActivo = null; 
let botonDictadoActivo = null; 

function alternarDictado(boton) { 
if (!boton) { 
return; 
} 

const idCampo = boton.dataset.target; 
const campo = $(idCampo); 

if (!campo) { 
return; 
} 

const SpeechRecognitionAPI = 
window.SpeechRecognition || 
window.webkitSpeechRecognition; 

if (!SpeechRecognitionAPI) { 
alert( 
"El dictado por voz no está disponible en este navegador. Prueba con Chrome en Android." 
); 
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

const separador = 
campo.value && !campo.value.endsWith(" ") && !campo.value.endsWith("\n") 
? " " 
: ""; 

let textoAcumulado = campo.value + separador; 

reconocimiento.onresult = (evento) => { 
let textoNuevo = ""; 

for (let i = evento.resultIndex; i < evento.results.length; i++) { 
if (evento.results[i].isFinal) { 
textoNuevo += evento.results[i][0].transcript + " "; 
} 
} 

if (textoNuevo) { 
textoAcumulado += textoNuevo; 
campo.value = textoAcumulado; 
} 
}; 

reconocimiento.onerror = (evento) => { 
console.error("Error de dictado:", evento.error); 

if (evento.error === "not-allowed" || evento.error === "service-not-allowed") { 
alert( 
"Has denegado el permiso de micrófono. Actívalo en los ajustes del navegador para dictar." 
); 
} 
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

if (!editor || !form) { 
return; 
} 

form.reset(); 

const fecha = 
$("actaFecha"); 

const hora = 
$("actaHora"); 

if (fecha) { 
fecha.value = 
acta?.fecha || 
new Date() 
.toISOString() 
.slice(0, 10); 
} 

if (hora) { 
hora.value = 
acta?.hora || 
new Date() 
.toTimeString() 
.slice(0, 5); 
} 

if (acta) { 
$("actaNumero").value = 
acta.numero || ""; 

$("actaNombre").value = 
acta.nombre || ""; 

$("actaDni").value = 
acta.dni || ""; 

$("actaDomicilio").value = 
acta.domicilio || ""; 

$("actaLugar").value = 
acta.lugar || ""; 

$("actaHechos").value = 
acta.hechos || ""; 

$("actaInfraccion").value = 
acta.infraccion || ""; 

$("actaObservaciones").value = 
acta.observaciones || ""; 

form.dataset.editingId = 
acta.id || ""; 
} else { 
delete form.dataset.editingId; 
} 

actualizarPreviewInfraccion(); 

editor.classList.remove("hidden"); 

editor.scrollIntoView({ 
behavior: "smooth", 
block: "start" 
}); 
} 

function cerrarEditorActa() { 
const editor = $("actaEditor"); 
const form = $("actaForm"); 

if (editor) { 
editor.classList.add("hidden"); 
} 

if (form) { 
form.reset(); 
delete form.dataset.editingId; 
} 

const preview = 
$("actaInfraccionPreview"); 

if (preview) { 
preview.classList.add("hidden"); 
preview.innerHTML = ""; 
} 
} 

function obtenerValor(id) { 
return $(id)?.value?.trim() || ""; 
} 

async function guardarActaDesdeFormulario(evento) {
  evento.preventDefault();
  if (!usuarioActual) { mostrarToast("Sesión no iniciada."); return; }

  const form = evento.currentTarget;
  const esEdicion = !!form.dataset.editingId;

  const acta = {
    id:           form.dataset.editingId || `acta-${Date.now()}`,
    user_id:      usuarioActual.id,
    numero:       obtenerValor("actaNumero"),
    fecha:        obtenerValor("actaFecha"),
    hora:         obtenerValor("actaHora"),
    nombre:       obtenerValor("actaNombre"),
    dni:          obtenerValor("actaDni"),
    domicilio:    obtenerValor("actaDomicilio"),
    lugar:        obtenerValor("actaLugar"),
    hechos:       obtenerValor("actaHechos"),
    infraccion:   obtenerValor("actaInfraccion"),
    observaciones: obtenerValor("actaObservaciones"),
    actualizado:  new Date().toISOString()
  };

  try {
    const { error } = await supabase
      .from("actas")
      .upsert(acta, { onConflict: "id" });

    if (error) throw error;

    // Actualizar estado local
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

function renderizarActas() { 
const lista = 
$("actasList"); 

if (!lista) { 
return; 
} 

if (!estado.actas.length) { 
lista.innerHTML = ` 
<div class="empty-state"> 
<div class="empty-icon">?</div> 
<h3>No hay actas guardadas</h3> 
<p> 
Pulsa «Nueva» para comenzar un acta. 
</p> 
</div> 
`; 
return; 
} 

lista.innerHTML = 
estado.actas 
.map((acta) => ` 
<article class="acta-card"> 

<div class="acta-card-header"> 
<div> 
<span> 
Acta ${ 
escaparHTML( 
acta.numero || 
"sin número" 
) 
} 
</span> 

<h3> 
${escaparHTML( 
acta.nombre || 
"Persona no indicada" 
)} 
</h3> 
</div> 

<span> 
${escaparHTML( 
acta.fecha || "" 
)} 
</span> 
</div> 

<p> 
${escaparHTML( 
acta.infraccion || 
"Sin infracción indicada" 
)} 
</p> 

<div class="form-actions"> 

<button 
type="button" 
class="secondary-button" 
data-edit-acta="${ 
escaparHTML(acta.id) 
}" 
> 
Editar 
</button> 

<button 
type="button" 
class="secondary-button danger" 
data-delete-acta="${ 
escaparHTML(acta.id) 
}" 
> 
Borrar 
</button> 

</div> 

</article> 
`) 
.join(""); 
} 

function editarActa(id) { 
const acta = 
estado.actas.find( 
(item) => item.id === id 
); 

if (acta) { 
abrirEditorActa(acta); 
} 
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
const preview = 
$("actaInfraccionPreview"); 

const input = 
$("actaInfraccion"); 

if (!preview || !input) { 
return; 
} 

const valor = 
normalizarTexto(input.value); 

if (!valor) { 
preview.classList.add("hidden"); 
preview.innerHTML = ""; 
return; 
} 

const encontrada = 
estado.infracciones.find( 
(item) => 
normalizarTexto( 
item.codigo 
) === valor || 
normalizarTexto( 
item.id 
) === valor 
); 

if (!encontrada) { 
preview.classList.add("hidden"); 
preview.innerHTML = ""; 
return; 
} 

preview.classList.remove("hidden"); 

preview.innerHTML = ` 
<strong> 
${escaparHTML( 
encontrada.codigo || "" 
)} 
</strong> 

<p> 
${escaparHTML( 
encontrada.titulo || "" 
)} 
</p> 

<span> 
${escaparHTML( 
encontrada.gravedad || "" 
)} 
</span> 
`; 
} 

/* ========================================================= 
NORMATIVA 
========================================================= */ 

function configurarNormativa() { 
$("normativaSearch")?.addEventListener( 
"input", 
() => { 
estado.normativaBusqueda = 
$("normativaSearch").value || ""; 

renderizarNormativa(); 
} 
); 

$("clearNormativaSearch")?.addEventListener( 
"click", 
() => { 
const input = 
$("normativaSearch"); 

if (input) { 
input.value = ""; 
estado.normativaBusqueda = ""; 
input.focus(); 
} 

renderizarNormativa(); 
} 
); 

$("closeNormativaViewer")?.addEventListener( 
"click", 
cerrarVisorNormativa 
); 

renderizarNormativa(); 
} 

function renderizarNormativa() { 
const lista = 
$("normativaList"); 

if (!lista) { 
return; 
} 

const texto = 
normalizarTexto( 
estado.normativaBusqueda 
); 

const tokensNormativa = 
tokenizarConsulta( 
estado.normativaBusqueda 
); 

const categorias = 
Array.isArray(estado.ordenanzas?.categorias) 
? estado.ordenanzas.categorias 
: []; 

const ordenanzas = 
extraerOrdenanzas( 
estado.ordenanzas 
); 

const tarjetasPrincipales = [ 
{ 
tipo: "lopsc", 
titulo: "Ley Orgánica 4/2015", 
descripcion: 
"Protección de la seguridad ciudadana", 
etiqueta: "LOPSC", 
icono: "⚖️" 
}, 
{ 
tipo: "codigo-penal", 
titulo: "Código Penal", 
descripcion: 
"Selección de delitos de interés policial: seguridad vial, patrimonio, violencia de género, orden público, drogas", 
etiqueta: "LO 10/1995", 
icono: "🔨" 
}, 
{ 
tipo: "menores", 
titulo: "Menores", 
descripcion: 
"Responsabilidad penal, protección jurídica ante riesgo/desamparo y protección frente a la violencia — 3 normas", 
etiqueta: "LO 5/2000, LO 1/1996, LO 8/2021", 
icono: "🧑‍⚖️" 
}, 
{ 
tipo: "animales", 
titulo: "Animales", 
descripcion: 
"Bienestar animal y tenencia de perros potencialmente peligrosos (PPP) — 4 normas", 
etiqueta: "Estatal / Andalucía", 
icono: "🐾" 
}, 
{ 
tipo: "trafico", 
titulo: "Tráfico", 
descripcion: 
"Ley de Tráfico y sus 3 reglamentos: Circulación, Conductores y Vehículos", 
etiqueta: "Estatal", 
icono: "🚦" 
}, 
{ 
tipo: "violencia-genero", 
titulo: "Violencia de Género", 
descripcion: 
"Protección integral, orden de protección y libertad sexual — 3 normas", 
etiqueta: "LO 1/2004, Ley 27/2003, LO 10/2022", 
icono: "🛡️" 
}, 
{ 
tipo: "ordenanzas", 
titulo: "Ordenanzas municipales", 
descripcion: 
`Normativa local por categorías — ${ordenanzas.length} ordenanzas`, 
etiqueta: `${categorias.length} categorías`, 
icono: "🏛️" 
} 
]; 

const coincide = (campos) => 
!tokensNormativa.length || 
coincideConsulta( 
normalizarTexto(campos.join(" ")), 
tokensNormativa 
); 

const principalesFiltradas = 
tarjetasPrincipales.filter((tarjeta) => 
coincide([ 
tarjeta.titulo, 
tarjeta.descripcion, 
tarjeta.etiqueta 
]) 
); 

const renderTarjetaPrincipal = (tarjeta) => ` 
<div class="normativa-card"> 

<div class="normativa-icon"> 
${tarjeta.icono} 
</div> 

<div class="normativa-info"> 

<h3> 
${escaparHTML(tarjeta.titulo)} 
</h3> 

<p> 
${escaparHTML(tarjeta.descripcion)} 
</p> 

<span> 
${escaparHTML(tarjeta.etiqueta)} 
</span> 

</div> 

<button 
type="button" 
class="normativa-open" 
data-law="${escaparHTML(tarjeta.tipo)}" 
> 
Ver 
</button> 

</div> 
`; 

if (!principalesFiltradas.length) { 
lista.innerHTML = ` 
<div class="empty-state"> 
<div class="empty-icon">🔍</div> 
<h3>Sin resultados</h3> 
<p> 
No se ha encontrado normativa 
con esa búsqueda. 
</p> 
</div> 
`; 
return; 
} 

lista.innerHTML = ` 
<div class="normativa-list normativa-list--principal"> 
${principalesFiltradas.map(renderTarjetaPrincipal).join("")} 
</div> 
`; 
} 

function abrirNormativa(tipo, id = "") { 
if (tipo === "lopsc") { 
abrirLOPSC(); 
return; 
} 

if (tipo === "codigo-penal") { 
abrirCodigoPenal(); 
return; 
} 

if (tipo === "menores") { 
abrirMenoresGrupo(); 
return; 
} 

if (tipo === "ley-menor") { 
abrirLeyMenor(id); 
return; 
} 

if (tipo === "violencia-genero") { 
abrirViolenciaGeneroGrupo(); 
return; 
} 

if (tipo === "ley-violencia-genero") { 
abrirLeyViolenciaGenero(id); 
return; 
} 

if (tipo === "animales") { 
abrirAnimales(); 
return; 
} 

if (tipo === "ley-animal") { 
abrirLeyAnimal(id); 
return; 
} 

if (tipo === "trafico") { 
abrirTrafico(); 
return; 
} 

if (tipo === "ley-trafico") { 
abrirLeyTrafico(id); 
return; 
} 

if (tipo === "ordenanzas") { 
abrirOrdenanzas(); 
return; 
} 

if (tipo === "ordenanza") { 
abrirOrdenanza(id); 
return; 
} 

if (tipo === "normativa-home") { 
cerrarVisorNormativa(); 
} 
} 

function abrirOrdenanzas() { 
const categorias = 
Array.isArray(estado.ordenanzas?.categorias) 
? estado.ordenanzas.categorias 
: []; 

const ordenanzas = 
extraerOrdenanzas( 
estado.ordenanzas 
); 

const visor = 
$("normativaViewer"); 

const contenido = 
$("viewerContent"); 

if (!visor || !contenido) { 
return; 
} 

$("viewerTitle").textContent = 
"Ordenanzas municipales"; 

$("viewerSubtitle").textContent = 
`Normativa local por categorías — ${ordenanzas.length} ordenanzas`; 

const grupos = 
renderGruposOrdenanzas(categorias, ordenanzas); 

if (!ordenanzas.length || !grupos) { 
contenido.innerHTML = ` 
<div class="empty-state"> 
<h3>Ordenanzas no disponibles</h3> 
<p> 
No se ha podido cargar la información. 
</p> 
</div> 
`; 
} else { 
contenido.innerHTML = ` 
<div class="ordenanza-groups"> 
${grupos} 
</div> 
`; 
} 

visor.classList.remove("hidden"); 

visor.scrollIntoView({ 
behavior: "smooth", 
block: "start" 
}); 
} 

const ANIMALES_ICONOS = { 
"ley-7-2023": "🐾", 
"ley-11-2003": "🐕", 
"ley-50-1999": "🛡️", 
"decreto-42-2008": "📜" 
}; 

function abrirAnimales() { 
const leyes = 
extraerAnimales( 
estado.animales 
); 

const visor = 
$("normativaViewer"); 

const contenido = 
$("viewerContent"); 

if (!visor || !contenido) { 
return; 
} 

$("viewerTitle").textContent = 
"Animales"; 

$("viewerSubtitle").textContent = 
"Bienestar animal y tenencia de PPP — estatal y andaluza"; 

if (!leyes.length) { 
contenido.innerHTML = ` 
<div class="empty-state"> 
<h3>Normativa de animales no disponible</h3> 
<p> 
No se ha podido cargar la información. 
</p> 
</div> 
`; 
} else { 
contenido.innerHTML = ` 
<div class="normativa-list"> 
${leyes.map((leyItem) => ` 
<div class="normativa-card"> 

<div class="normativa-icon"> 
${ANIMALES_ICONOS[leyItem.id] || "📖"} 
</div> 

<div class="normativa-info"> 

<h3> 
${escaparHTML(leyItem.ley || "")} 
</h3> 

<p> 
${escaparHTML(leyItem.abreviatura || "")} 
</p> 

<span> 
${escaparHTML(leyItem.ambito || "")} · ${Array.isArray(leyItem.articulos) ? leyItem.articulos.length : 0} artículos 
</span> 

</div> 

<button 
type="button" 
class="normativa-open" 
data-law="ley-animal" 
data-id="${escaparHTML(leyItem.id)}" 
> 
Ver 
</button> 

</div> 
`).join("")} 
</div> 
`; 
} 

visor.classList.remove("hidden"); 

visor.scrollIntoView({ 
behavior: "smooth", 
block: "start" 
}); 
} 

function abrirLeyAnimal(id) { 
const leyes = 
extraerAnimales( 
estado.animales 
); 

const leyItem = 
leyes.find((item) => item.id === id); 

const visor = 
$("normativaViewer"); 

const contenido = 
$("viewerContent"); 

if (!leyItem || !visor || !contenido) { 
return; 
} 

$("viewerTitle").textContent = 
leyItem.ley || "Normativa de animales"; 

$("viewerSubtitle").textContent = 
leyItem.abreviatura || ""; 

const articulos = 
Array.isArray(leyItem.articulos) ? leyItem.articulos : []; 

contenido.innerHTML = ` 
<button 
type="button" 
class="normativa-open law-back-button" 
data-law="animales" 
> 
← Volver a Animales 
</button> 

<article class="law-article"> 

<p> 
<strong>Ámbito:</strong> ${escaparHTML(leyItem.ambito || "")}<br> 
<strong>Estado:</strong> ${escaparHTML(leyItem.estado || "")}<br> 
<strong>Fuente:</strong> ${escaparHTML(leyItem.boe || "")} 
</p> 

${leyItem.resumen ? ` 
<p>${escaparHTML(leyItem.resumen)}</p> 
` : ""} 

${leyItem.enlaceOficial ? ` 
<a 
class="law-link-button" 
href="${escaparHTML(leyItem.enlaceOficial)}" 
target="_blank" 
rel="noopener noreferrer" 
> 
🔗 Ver normativa online (BOE/BOJA) 
</a> 
` : ""} 

${leyItem.nota ? ` 
<p> 
<strong>Nota:</strong> 
${escaparHTML(leyItem.nota)} 
</p> 
` : ""} 

</article> 

${articulos.map((articulo) => ` 
<article class="law-article"> 
<h4> 
Artículo ${escaparHTML(articulo.numero)}. 
${escaparHTML(articulo.titulo || "")} 
</h4> 
<p>${escaparHTML(articulo.texto || "")}</p> 
</article> 
`).join("")} 
`; 

visor.classList.remove("hidden"); 

visor.scrollIntoView({ 
behavior: "smooth", 
block: "start" 
}); 
} 

const MENORES_ICONOS = { 
"lo-5-2000": "🧑‍⚖️", 
"lo-1-1996": "🛡️", 
"lo-8-2021": "🧒" 
}; 

function abrirMenoresGrupo() { 
const leyes = 
extraerAnimales( 
estado.menores 
); 

const visor = 
$("normativaViewer"); 

const contenido = 
$("viewerContent"); 

if (!visor || !contenido) { 
return; 
} 

$("viewerTitle").textContent = 
"Menores"; 

$("viewerSubtitle").textContent = 
"Actuación policial con menores de edad"; 

if (!leyes.length) { 
contenido.innerHTML = ` 
<div class="empty-state"> 
<h3>Normativa de menores no disponible</h3> 
<p> 
No se ha podido cargar la información. 
</p> 
</div> 
`; 
} else { 
contenido.innerHTML = ` 
<div class="normativa-list"> 
${leyes.map((leyItem) => ` 
<div class="normativa-card"> 

<div class="normativa-icon"> 
${MENORES_ICONOS[leyItem.id] || "📖"} 
</div> 

<div class="normativa-info"> 

<h3> 
${escaparHTML(leyItem.ley || "")} 
</h3> 

<p> 
${escaparHTML(leyItem.abreviatura || "")} 
</p> 

<span> 
${escaparHTML(leyItem.ambito || "")} · ${Array.isArray(leyItem.articulos) ? leyItem.articulos.length : 0} artículos 
</span> 

</div> 

<button 
type="button" 
class="normativa-open" 
data-law="ley-menor" 
data-id="${escaparHTML(leyItem.id)}" 
> 
Ver 
</button> 

</div> 
`).join("")} 
</div> 
`; 
} 

visor.classList.remove("hidden"); 

visor.scrollIntoView({ 
behavior: "smooth", 
block: "start" 
}); 
} 

function abrirLeyMenor(id) { 
const leyes = 
extraerAnimales( 
estado.menores 
); 

const leyItem = 
leyes.find((item) => item.id === id); 

const visor = 
$("normativaViewer"); 

const contenido = 
$("viewerContent"); 

if (!leyItem || !visor || !contenido) { 
return; 
} 

$("viewerTitle").textContent = 
leyItem.ley || "Normativa de menores"; 

$("viewerSubtitle").textContent = 
leyItem.abreviatura || ""; 

const articulos = 
Array.isArray(leyItem.articulos) ? leyItem.articulos : []; 

contenido.innerHTML = ` 
<button 
type="button" 
class="normativa-open law-back-button" 
data-law="menores" 
> 
← Volver a Menores 
</button> 

<article class="law-article"> 

<p> 
<strong>Ámbito:</strong> ${escaparHTML(leyItem.ambito || "")}<br> 
<strong>Estado:</strong> ${escaparHTML(leyItem.estado || "")}<br> 
<strong>Fuente:</strong> ${escaparHTML(leyItem.boe || "")} 
</p> 

${leyItem.resumen ? ` 
<p>${escaparHTML(leyItem.resumen)}</p> 
` : ""} 

${leyItem.enlaceOficial ? ` 
<a 
class="law-link-button" 
href="${escaparHTML(leyItem.enlaceOficial)}" 
target="_blank" 
rel="noopener noreferrer" 
> 
🔗 Ver normativa online (BOE) 
</a> 
` : ""} 

${leyItem.nota ? ` 
<p> 
<strong>Nota:</strong> 
${escaparHTML(leyItem.nota)} 
</p> 
` : ""} 

</article> 

${articulos.map((articulo) => ` 
<article class="law-article"> 
<h4> 
Artículo ${escaparHTML(articulo.numero)}. 
${escaparHTML(articulo.titulo || "")} 
</h4> 
<p>${escaparHTML(articulo.texto || "")}</p> 
</article> 
`).join("")} 
`; 

visor.classList.remove("hidden"); 

visor.scrollIntoView({ 
behavior: "smooth", 
block: "start" 
}); 
} 

const VIOLENCIA_GENERO_ICONOS = { 
"lo-1-2004": "🛡️", 
"ley-27-2003": "📋", 
"lo-10-2022": "⚖️" 
}; 

function abrirViolenciaGeneroGrupo() { 
const leyes = 
extraerAnimales( 
estado.violenciaGenero 
); 

const visor = 
$("normativaViewer"); 

const contenido = 
$("viewerContent"); 

if (!visor || !contenido) { 
return; 
} 

$("viewerTitle").textContent = 
"Violencia de Género"; 

$("viewerSubtitle").textContent = 
"Protección integral, orden de protección y libertad sexual"; 

if (!leyes.length) { 
contenido.innerHTML = ` 
<div class="empty-state"> 
<h3>Normativa no disponible</h3> 
<p> 
No se ha podido cargar la información. 
</p> 
</div> 
`; 
} else { 
contenido.innerHTML = ` 
<div class="normativa-list"> 
${leyes.map((leyItem) => ` 
<div class="normativa-card"> 

<div class="normativa-icon"> 
${VIOLENCIA_GENERO_ICONOS[leyItem.id] || "📖"} 
</div> 

<div class="normativa-info"> 

<h3> 
${escaparHTML(leyItem.ley || "")} 
</h3> 

<p> 
${escaparHTML(leyItem.abreviatura || "")} 
</p> 

<span> 
${escaparHTML(leyItem.ambito || "")} · ${Array.isArray(leyItem.articulos) ? leyItem.articulos.length : 0} artículos 
</span> 

</div> 

<button 
type="button" 
class="normativa-open" 
data-law="ley-violencia-genero" 
data-id="${escaparHTML(leyItem.id)}" 
> 
Ver 
</button> 

</div> 
`).join("")} 
</div> 
`; 
} 

visor.classList.remove("hidden"); 

visor.scrollIntoView({ 
behavior: "smooth", 
block: "start" 
}); 
} 

function abrirLeyViolenciaGenero(id) { 
const leyes = 
extraerAnimales( 
estado.violenciaGenero 
); 

const leyItem = 
leyes.find((item) => item.id === id); 

const visor = 
$("normativaViewer"); 

const contenido = 
$("viewerContent"); 

if (!leyItem || !visor || !contenido) { 
return; 
} 

$("viewerTitle").textContent = 
leyItem.ley || "Violencia de Género"; 

$("viewerSubtitle").textContent = 
leyItem.abreviatura || ""; 

const articulos = 
Array.isArray(leyItem.articulos) ? leyItem.articulos : []; 

contenido.innerHTML = ` 
<button 
type="button" 
class="normativa-open law-back-button" 
data-law="violencia-genero" 
> 
← Volver a Violencia de Género 
</button> 

<article class="law-article"> 

<p> 
<strong>Ámbito:</strong> ${escaparHTML(leyItem.ambito || "")}<br> 
<strong>Estado:</strong> ${escaparHTML(leyItem.estado || "")}<br> 
<strong>Fuente:</strong> ${escaparHTML(leyItem.boe || "")} 
</p> 

${leyItem.resumen ? ` 
<p>${escaparHTML(leyItem.resumen)}</p> 
` : ""} 

${leyItem.enlaceOficial ? ` 
<a 
class="law-link-button" 
href="${escaparHTML(leyItem.enlaceOficial)}" 
target="_blank" 
rel="noopener noreferrer" 
> 
🔗 Ver normativa online (BOE) 
</a> 
` : ""} 

</article> 

${articulos.map((articulo) => ` 
<article class="law-article"> 
<h4> 
Artículo ${escaparHTML(articulo.numero)}. 
${escaparHTML(articulo.titulo || "")} 
</h4> 
<p>${escaparHTML(articulo.texto || "")}</p> 
</article> 
`).join("")} 
`; 

visor.classList.remove("hidden"); 

visor.scrollIntoView({ 
behavior: "smooth", 
block: "start" 
}); 
} 

const TRAFICO_ICONOS = { 
"rdl-6-2015": "🚦", 
"rd-1428-2003": "🚗", 
"rd-818-2009": "🪪", 
"rd-2822-1998": "🔧" 
}; 

function abrirTrafico() { 
const leyes = 
extraerTrafico( 
estado.trafico 
); 

const visor = 
$("normativaViewer"); 

const contenido = 
$("viewerContent"); 

if (!visor || !contenido) { 
return; 
} 

$("viewerTitle").textContent = 
"Tráfico"; 

$("viewerSubtitle").textContent = 
"Ley de Tráfico y sus reglamentos de desarrollo"; 

if (!leyes.length) { 
contenido.innerHTML = ` 
<div class="empty-state"> 
<h3>Normativa de tráfico no disponible</h3> 
<p> 
No se ha podido cargar la información. 
</p> 
</div> 
`; 
} else { 
contenido.innerHTML = ` 
<div class="normativa-list"> 
${leyes.map((leyItem) => ` 
<div class="normativa-card"> 

<div class="normativa-icon"> 
${TRAFICO_ICONOS[leyItem.id] || "📖"} 
</div> 

<div class="normativa-info"> 

<h3> 
${escaparHTML(leyItem.ley || "")} 
</h3> 

<p> 
${escaparHTML(leyItem.abreviatura || "")} 
</p> 

<span> 
${escaparHTML(leyItem.ambito || "")} · ${Array.isArray(leyItem.articulos) ? leyItem.articulos.length : 0} artículos 
</span> 

</div> 

<button 
type="button" 
class="normativa-open" 
data-law="ley-trafico" 
data-id="${escaparHTML(leyItem.id)}" 
> 
Ver 
</button> 

</div> 
`).join("")} 
</div> 
`; 
} 

visor.classList.remove("hidden"); 

visor.scrollIntoView({ 
behavior: "smooth", 
block: "start" 
}); 
} 

function abrirLeyTrafico(id) { 
const leyes = 
extraerTrafico( 
estado.trafico 
); 

const leyItem = 
leyes.find((item) => item.id === id); 

const visor = 
$("normativaViewer"); 

const contenido = 
$("viewerContent"); 

if (!leyItem || !visor || !contenido) { 
return; 
} 

$("viewerTitle").textContent = 
leyItem.ley || "Normativa de tráfico"; 

$("viewerSubtitle").textContent = 
leyItem.abreviatura || ""; 

const articulos = 
Array.isArray(leyItem.articulos) ? leyItem.articulos : []; 

contenido.innerHTML = ` 
<button 
type="button" 
class="normativa-open law-back-button" 
data-law="trafico" 
> 
← Volver a Tráfico 
</button> 

<article class="law-article"> 

<p> 
<strong>Ámbito:</strong> ${escaparHTML(leyItem.ambito || "")}<br> 
<strong>Estado:</strong> ${escaparHTML(leyItem.estado || "")}<br> 
<strong>Fuente:</strong> ${escaparHTML(leyItem.boe || "")} 
</p> 

${leyItem.resumen ? ` 
<p>${escaparHTML(leyItem.resumen)}</p> 
` : ""} 

${leyItem.enlaceOficial ? ` 
<a 
class="law-link-button" 
href="${escaparHTML(leyItem.enlaceOficial)}" 
target="_blank" 
rel="noopener noreferrer" 
> 
🔗 Ver normativa online (BOE) 
</a> 
` : ""} 

${leyItem.nota ? ` 
<p> 
<strong>Nota:</strong> 
${escaparHTML(leyItem.nota)} 
</p> 
` : ""} 

</article> 

${articulos.map((articulo) => ` 
<article class="law-article"> 
<h4> 
Artículo ${escaparHTML(articulo.numero)}. 
${escaparHTML(articulo.titulo || "")} 
</h4> 
<p>${escaparHTML(articulo.texto || "")}</p> 
</article> 
`).join("")} 
`; 

visor.classList.remove("hidden"); 

visor.scrollIntoView({ 
behavior: "smooth", 
block: "start" 
}); 
} 


function abrirLOPSC() { 
const articulos = 
extraerArticulos( 
estado.lopsc 
); 

const visor = 
$("normativaViewer"); 

const contenido = 
$("viewerContent"); 

if (!visor || !contenido) { 
return; 
} 

$("viewerTitle").textContent = 
"Ley Orgánica 4/2015"; 

$("viewerSubtitle").textContent = 
"Protección de la seguridad ciudadana"; 

if (!articulos.length) { 
contenido.innerHTML = ` 
<div class="empty-state"> 
<h3>LOPSC no disponible</h3> 
<p> 
No se han podido cargar los artículos. 
</p> 
</div> 
`; 
} else { 
const enlaceOficial = 
estado.lopsc && estado.lopsc.enlaceOficial; 

contenido.innerHTML = ` 
${enlaceOficial ? ` 
<a 
class="law-link-button" 
href="${escaparHTML(enlaceOficial)}" 
target="_blank" 
rel="noopener noreferrer" 
> 
🔗 Ver normativa online (BOE) 
</a> 
` : ""} 

${articulos 
.map((articulo) => ` 
<article class="law-article"> 

<h4> 
Artículo ${ 
escaparHTML( 
articulo.numero 
) 
}. 
${escaparHTML( 
articulo.titulo || "" 
)} 
</h4> 

<p> 
${escaparHTML( 
articulo.texto || "" 
)} 
</p> 

</article> 
`) 
.join("")} 
`; 
} 

visor.classList.remove("hidden"); 

visor.scrollIntoView({ 
behavior: "smooth", 
block: "start" 
}); 
} 

function abrirCodigoPenal() { 
const articulos = 
extraerArticulos( 
estado.codigoPenal 
); 

const visor = 
$("normativaViewer"); 

const contenido = 
$("viewerContent"); 

if (!visor || !contenido) { 
return; 
} 

$("viewerTitle").textContent = 
"Código Penal"; 

$("viewerSubtitle").textContent = 
"Selección de delitos de interés policial (LO 10/1995)"; 

if (!articulos.length) { 
contenido.innerHTML = ` 
<div class="empty-state"> 
<h3>Código Penal no disponible</h3> 
<p> 
No se han podido cargar los artículos. 
</p> 
</div> 
`; 
} else { 
const enlaceOficial = 
estado.codigoPenal && estado.codigoPenal.enlaceOficial; 

const nota = 
estado.codigoPenal && estado.codigoPenal.nota; 

contenido.innerHTML = ` 
${enlaceOficial ? ` 
<a 
class="law-link-button" 
href="${escaparHTML(enlaceOficial)}" 
target="_blank" 
rel="noopener noreferrer" 
> 
🔗 Ver normativa online (BOE) 
</a> 
` : ""} 

${nota ? ` 
<article class="law-article"> 
<p><strong>Nota:</strong> ${escaparHTML(nota)}</p> 
</article> 
` : ""} 

${articulos 
.map((articulo) => ` 
<article class="law-article"> 

<h4> 
Artículo ${ 
escaparHTML( 
articulo.numero 
) 
}. 
${escaparHTML( 
articulo.titulo || "" 
)} 
</h4> 

<p> 
${escaparHTML( 
articulo.texto || "" 
)} 
</p> 

</article> 
`) 
.join("")} 
`; 
} 

visor.classList.remove("hidden"); 

visor.scrollIntoView({ 
behavior: "smooth", 
block: "start" 
}); 
} 

function abrirOrdenanza(id) { 
const ordenanzas = 
extraerOrdenanzas( 
estado.ordenanzas 
); 

const ordenanza = 
ordenanzas.find( 
(item) => item.id === id 
); 

if (!ordenanza) { 
return; 
} 

const visor = 
$("normativaViewer"); 

const contenido = 
$("viewerContent"); 

if (!visor || !contenido) { 
return; 
} 

$("viewerTitle").textContent = 
ordenanza.nombre || 
ordenanza.nombre_corto || 
"Ordenanza municipal"; 

$("viewerSubtitle").textContent = 
ordenanza.codigo || ""; 

const palabras = 
Array.isArray( 
ordenanza.palabras_clave 
) 
? ordenanza.palabras_clave 
: []; 

const fuente = 
ordenanza.fuente || {}; 

contenido.innerHTML = ` 
<button 
type="button" 
class="normativa-open law-back-button" 
data-law="ordenanzas" 
> 
← Volver a Ordenanzas 
</button> 

<article class="law-article"> 

<h4> 
${escaparHTML( 
ordenanza.nombre || 
ordenanza.nombre_corto || 
"" 
)} 
</h4> 

<p> 
${escaparHTML( 
ordenanza.descripcion || "" 
)} 
</p> 

${ 
ordenanza.estado 
? ` 
<p><strong>Estado:</strong> ${escaparHTML(ordenanza.estado)}</p> 
` 
: "" 
} 

${ 
fuente.url 
? ` 
<a 
class="law-link-button" 
href="${escaparHTML(fuente.url)}" 
target="_blank" 
rel="noopener noreferrer" 
> 
🔗 Ver documento oficial 
</a> 
` 
: ` 
<p class="law-sin-enlace">Sin enlace oficial configurado.</p> 
` 
} 

${ 
ordenanza.nota 
? ` 
<p> 
<strong>Nota:</strong> 
${escaparHTML( 
ordenanza.nota 
)} 
</p> 
` 
: "" 
} 

${ 
palabras.length 
? ` 
<p> 
<strong> 
Palabras clave: 
</strong> 
${palabras 
.map( 
escaparHTML 
) 
.join(", ")} 
</p> 
` 
: "" 
} 

</article> 
`; 

visor.classList.remove("hidden"); 

visor.scrollIntoView({ 
behavior: "smooth", 
block: "start" 
}); 
} 

function cerrarVisorNormativa() { 
$("normativaViewer")?.classList.add( 
"hidden" 
); 
} 

/* ========================================================= 
MODAL 
========================================================= */ 

function abrirModal( 
titulo, 
contenido, 
acciones = [] 
) { 
const modal = 
$("appModal"); 

if (!modal) { 
return; 
} 

$("modalTitle").textContent = 
titulo || "Centinela Code"; 

$("modalBody").innerHTML = 
contenido || ""; 

const contenedor = 
$("modalActions"); 

contenedor.innerHTML = ""; 

acciones.forEach((accion) => { 

const boton = 
document.createElement("button"); 

boton.type = "button"; 
boton.className = 
accion.className || 
"primary-button"; 

boton.textContent = 
accion.label || "Aceptar"; 

boton.addEventListener( 
"click", 
() => { 
accion.onClick?.(); 
} 
); 

contenedor.appendChild(boton); 
}); 

modal.classList.remove("hidden"); 
} 

function cerrarModal() { 
$("appModal")?.classList.add( 
"hidden" 
); 
} 

function configurarModal() { 
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
AJUSTES 
========================================================= */ 

function configurarAjustes() { 
const version = 
$("appVersion"); 

if (version) { 
version.textContent = 
CONFIG.VERSION; 
} 

$("reloadDataButton")?.addEventListener( 
"click", 
async () => { 
mostrarToast( 
"Recargando datos..." 
); 

await cargarDatos(); 
} 
); 

$("clearDraftsButton")?.addEventListener( 
"click", 
() => { 

const confirmado = 
window.confirm( 
"¿Quieres borrar todas las actas guardadas?" 
); 

if (!confirmado) { 
return; 
} 

estado.actas = []; 

localStorage.removeItem( 
CONFIG.STORAGE_ACTAS 
); 

renderizarActas(); 

mostrarToast( 
"Actas borradas." 
); 
} 
); 
} 

/* ========================================================= 
EVENTOS DINÁMICOS 
========================================================= */ 

function configurarEventosGlobales() { 
document.addEventListener( 
"click", 
(evento) => { 

const detalle = 
evento.target.closest( 
"[data-infraccion-id]" 
); 

if (detalle) { 
abrirDetalleInfraccion( 
detalle.dataset.infraccionId 
); 
return; 
} 

const resultadoArticulo = 
evento.target.closest( 
"[data-nav-tipo]" 
); 

if (resultadoArticulo) { 
activarSeccion("normativa"); 
abrirNormativa( 
resultadoArticulo.dataset.navTipo, 
resultadoArticulo.dataset.navId || "" 
); 
return; 
} 

const normativa = 
evento.target.closest( 
"button.normativa-open" 
); 

if (normativa) { 
abrirNormativa( 
normativa.dataset.law, 
normativa.dataset.id || "" 
); 
return; 
} 

const editar = 
evento.target.closest( 
"[data-edit-acta]" 
); 

if (editar) { 
editarActa( 
editar.dataset.editActa 
); 
return; 
} 

const borrar = 
evento.target.closest( 
"[data-delete-acta]" 
); 

if (borrar) { 
borrarActa( 
borrar.dataset.deleteActa 
); 
} 
} 
); 
} 

/* =========================================================
FAVORITOS
Favoritos predeterminados mostrados la primera vez
========================================================= */

const FAVORITOS_DEFAULT = {
  infraccion: [
    "Art. 36.6 LOPSC — Drogas",
    "Art. 36.16 LOPSC — Desobediencia",
    "Art. 37.4 LOPSC — Falta de respeto"
  ],
  normativa: [
    "Ordenanza ruido",
    "Ordenanza animales",
    "Tráfico"
  ]
};

function cargarFavoritos() {
  try {
    const raw = localStorage.getItem(CONFIG.STORAGE_FAVORITOS);
    return raw ? JSON.parse(raw) : { ...FAVORITOS_DEFAULT };
  } catch {
    return { ...FAVORITOS_DEFAULT };
  }
}

function guardarFavoritos(favs) {
  localStorage.setItem(CONFIG.STORAGE_FAVORITOS, JSON.stringify(favs));
}

function renderizarFavoritos() {
  const favs = cargarFavoritos();

  const renderLista = (ulId, tipo) => {
    const ul = document.getElementById(ulId);
    if (!ul) return;
    const items = favs[tipo] ?? [];
    if (!items.length) {
      ul.innerHTML = `<li class="fav-empty">Sin favoritos aún. Pulsa + para añadir.</li>`;
      return;
    }
    ul.innerHTML = items.map((texto, i) => `
      <li class="fav-item" data-fav-tipo="${tipo}" data-fav-idx="${i}">
        <span class="fav-item-star">⭐</span>
        <span class="fav-item-text">${escaparHTML(texto)}</span>
        <button class="fav-item-remove" data-fav-remove-tipo="${tipo}" data-fav-remove-idx="${i}" title="Eliminar">×</button>
      </li>
    `).join("");
  };

  renderLista("favListInfracciones", "infraccion");
  renderLista("favListNormativa", "normativa");
}

function abrirModalFavorito(tipo) {
  if (document.getElementById("favModal")) return;

  const labels = {
    infraccion: "Añadir infracción favorita",
    normativa: "Añadir norma favorita"
  };
  const placeholders = {
    infraccion: "Ej: Art. 36.6 LOPSC — Drogas",
    normativa: "Ej: Ordenanza ruido"
  };

  const overlay = document.createElement("div");
  overlay.className = "fav-modal-overlay";
  overlay.id = "favModal";
  overlay.innerHTML = `
    <div class="fav-modal">
      <h3>${labels[tipo] ?? "Añadir favorito"}</h3>
      <input id="favModalInput" type="text"
        placeholder="${placeholders[tipo] ?? ""}"
        maxlength="80" autocomplete="off" />
      <div class="fav-modal-actions">
        <button class="fav-btn-cancel" id="favModalCancelar">Cancelar</button>
        <button class="fav-btn-ok" id="favModalGuardar">Guardar</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const input = document.getElementById("favModalInput");
  input.focus();

  const cerrar = () => overlay.remove();

  document.getElementById("favModalCancelar").addEventListener("click", cerrar);
  overlay.addEventListener("click", e => { if (e.target === overlay) cerrar(); });

  const guardar = () => {
    const texto = input.value.trim();
    if (!texto) return;
    const favs = cargarFavoritos();
    if (!Array.isArray(favs[tipo])) favs[tipo] = [];
    favs[tipo].push(texto);
    guardarFavoritos(favs);
    renderizarFavoritos();
    mostrarToast("Favorito añadido.");
    cerrar();
  };

  document.getElementById("favModalGuardar").addEventListener("click", guardar);
  input.addEventListener("keydown", e => { if (e.key === "Enter") guardar(); });
}

function eliminarFavorito(tipo, idx) {
  const favs = cargarFavoritos();
  if (!Array.isArray(favs[tipo])) return;
  favs[tipo].splice(idx, 1);
  guardarFavoritos(favs);
  renderizarFavoritos();
  mostrarToast("Favorito eliminado.");
}

function configurarFavoritos() {
  renderizarFavoritos();

  // Delegación de eventos en el panel completo
  const panel = document.getElementById("favoritosPanel");
  if (!panel) return;

  panel.addEventListener("click", e => {
    // Botón añadir
    const addBtn = e.target.closest("[data-fav-type]");
    if (addBtn) {
      abrirModalFavorito(addBtn.dataset.favType);
      return;
    }
    // Botón eliminar
    const removeBtn = e.target.closest("[data-fav-remove-tipo]");
    if (removeBtn) {
      e.stopPropagation();
      eliminarFavorito(
        removeBtn.dataset.favRemoveTipo,
        parseInt(removeBtn.dataset.favRemoveIdx, 10)
      );
      return;
    }
    // Clic en el item → navegar a consulta con el texto prerellenado
    const item = e.target.closest(".fav-item");
    if (item && !e.target.closest("button")) {
      const texto = item.querySelector(".fav-item-text")?.textContent ?? "";
      const consultaInput = document.getElementById("consultaInput");
      if (consultaInput) {
        consultaInput.value = texto;
        const btnConsulta = document.querySelector(".nav-item[data-section='consulta']");
        btnConsulta?.click();
        consultaInput.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }
  });
}

/* ========================================================= 
SERVICE WORKER 
========================================================= */ 

function registrarServiceWorker() { 
if (!("serviceWorker" in navigator)) { 
return; 
} 

window.addEventListener( 
"load", 
async () => { 
try { 
const registro = 
await navigator.serviceWorker.register( 
"./service-worker.js", 
{ 
updateViaCache: "none" 
} 
); 

console.log( 
"Centinela Code: Service Worker registrado.", 
registro.scope 
); 

registro.update().catch( 
() => {} 
); 

} catch (error) { 
console.warn( 
"Centinela Code: no se pudo registrar el Service Worker.", 
error 
); 
} 
} 
); 
} 

/* ========================================================= 
EVENTOS DE RED 
========================================================= */ 

function configurarRed() { 
window.addEventListener( 
"online", 
() => { 
actualizarRed(); 
mostrarToast( 
"Conexión recuperada." 
); 
} 
); 

window.addEventListener( 
"offline", 
() => { 
actualizarRed(); 
mostrarToast( 
"Sin conexión. Se utilizarán los datos locales." 
); 
} 
); 

actualizarRed(); 
} 

/* ========================================================= 
INICIALIZACIÓN 
========================================================= */ 


/* =========================================================
ARRANQUE CON SUPABASE AUTH
========================================================= */
async function iniciarAplicacion() {
  try {
    mostrarCarga(true);
    configurarNavegacion();
    configurarConsulta();
    configurarActas();
    configurarFavoritos();
    configurarNormativa();
    configurarModal();
    configurarAjustes();
    configurarEventosGlobales();
    configurarRed();
    inyectarBotonLogout();
    await cargarActas();
    await cargarDatos();
    const version = $("appVersion");
    if (version) version.textContent = CONFIG.VERSION;
  } catch (error) {
    console.error("Error iniciando Centinela Code:", error);
    mostrarToast("La aplicación se inició con un error.");
  } finally {
    actualizarEstadoDatos();
    actualizarRed();
    mostrarCarga(false);
  }
}

async function arrancar() {
  const user = await obtenerSesion();
  if (user) {
    await iniciarAplicacion();
  } else {
    mostrarPantallaLogin();
  }
}

/* ========================================================= 
ARRANQUE 
========================================================= */ 

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", arrancar, { once: true });
} else {
  arrancar();
} 

registrarServiceWorker();
