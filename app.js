/* 
============================================================ 
CENTINELA CODE 
app.js - Versión corregida y compatible con index.html 
============================================================ 

Funciones: 
- Carga de infracciones, LOPSC y ordenanzas. 
- Consulta por código, artículo, palabra y gravedad. 
- Navegación inferior y accesos rápidos. 
- Creación, edición básica y borrado de actas mediante localStorage. 
- Visor de LOPSC y ordenanzas. 
- Estado de conexión y estado de las bases. 
- Limpieza/recarga de datos. 
- Compatible con la estructura actual de index.html. 
============================================================ 
*/ 

"use strict"; 

const CONFIG = { 
VERSION: "1.0.1", 
RUTAS: { 
infracciones: "./data/infracciones.json", 
infraccionesTrafico: "./data/infracciones_trafico.json", 
lopsc: "./data/lopsc.json", 
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
ordenanzas: null, 
animales: null, 
trafico: null, 
resultados: [], 
gravedad: "all", 
normativaBusqueda: "", 
actas: [], 
actasBusqueda: "", 
favoritos: [] 
}; 

const MAX_FOTOS_ACTA = 3; 

let infraccionesActuales = []; 
let fotosActuales = []; 
let reconocimientoVozActivo = null; 

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

function escaparHTML(valor) { 
return String(valor ?? "") 
.replace(/&/g, "&amp;") 
.replace(/</g, "&lt;") 
.replace(/>/g, "&gt;") 
.replace(/"/g, "&quot;") 
.replace(/'/g, "&#039;"); 
} 

const ESTADOS_NORMATIVA = { 
publicada_oficialmente: { texto: "Publicada oficialmente", tono: "success" }, 
catalogada_oficialmente: { texto: "Catalogada oficialmente", tono: "success" }, 
vigente: { texto: "Vigente", tono: "success" }, 
catalogada_con_modificaciones: { texto: "Catalogada con modificaciones", tono: "warning" }, 
catalogada_con_modificacion: { texto: "Catalogada con modificación", tono: "warning" }, 
en_revision_2025: { texto: "En revisión (2025)", tono: "warning" }, 
derogada: { texto: "Derogada", tono: "danger" } 
}; 

function formatearEstadoNormativa(valor) { 
const clave = String(valor || "").trim(); 

if (!clave) { 
return ""; 
} 

const info = ESTADOS_NORMATIVA[clave]; 

if (info) { 
return `<span class="badge badge--${info.tono}">${escaparHTML(info.texto)}</span>`; 
} 

const texto = clave 
.replace(/_/g, " ") 
.replace(/^./, (letra) => letra.toUpperCase()); 

return `<span class="badge badge--neutral">${escaparHTML(texto)}</span>`; 
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
cargarJSON(CONFIG.RUTAS.ordenanzas), 
cargarJSON(CONFIG.RUTAS.animales), 
cargarJSON(CONFIG.RUTAS.trafico) 
]); 

const [rInfracciones, rInfraccionesTrafico, rLopsc, rOrdenanzas, rAnimales, rTrafico] = resultados; 

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

function actualizarBusqueda() { 
const input = $("consultaSearch"); 

const texto = 
normalizarTexto( 
input ? input.value : "" 
); 

const gravedad = 
estado.gravedad; 

estado.resultados = 
estado.infracciones.filter((infraccion) => { 

if ( 
gravedad !== "all" && 
String( 
infraccion.gravedad || "" 
) !== gravedad 
) { 
return false; 
} 

if (!texto) { 
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

return normalizarTexto( 
contenido 
).includes(texto); 
}); 

ordenarResultados(texto); 
renderizarResultados(); 
} 

function ordenarResultados(texto) { 
if (!texto) { 
return; 
} 

estado.resultados.sort((a, b) => { 

const codigoA = 
normalizarTexto(a.codigo); 

const codigoB = 
normalizarTexto(b.codigo); 

if (codigoA === texto && 
codigoB !== texto) { 
return -1; 
} 

if (codigoB === texto && 
codigoA !== texto) { 
return 1; 
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

return String(a.codigo || "") 
.localeCompare( 
String(b.codigo || ""), 
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
No se han encontrado infracciones 
con esos criterios. 
</p> 
</div> 
`; 
return; 
} 

contenedor.innerHTML = 
estado.resultados 
.map(renderizarTarjetaInfraccion) 
.join(""); 
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

function normalizarActa(raw) { 
const base = raw || {}; 

const infraccionesBase = 
Array.isArray(base.infracciones) 
? base.infracciones 
: (base.infraccion ? [base.infraccion] : []); 

return { 
id: base.id || `acta-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`, 
numero: base.numero || "", 
fecha: base.fecha || "", 
hora: base.hora || "", 
agente: base.agente || "", 
nombre: base.nombre || "", 
dni: base.dni || "", 
domicilio: base.domicilio || "", 
matricula: base.matricula || "", 
vehiculo: base.vehiculo || "", 
lugar: base.lugar || "", 
hechos: base.hechos || "", 
infracciones: infraccionesBase.filter(Boolean), 
observaciones: base.observaciones || "", 
fotos: Array.isArray(base.fotos) ? base.fotos : [], 
actualizado: base.actualizado || new Date().toISOString() 
}; 
} 

function cargarActas() { 
try { 
const guardadas = 
localStorage.getItem( 
CONFIG.STORAGE_ACTAS 
); 

const parseadas = 
guardadas 
? JSON.parse(guardadas) 
: []; 

estado.actas = 
Array.isArray(parseadas) 
? parseadas.map(normalizarActa) 
: []; 

} catch (error) { 
console.error( 
"No se pudieron cargar las actas:", 
error 
); 

estado.actas = []; 
} 

renderizarActas(); 
} 

function guardarActas() { 
try { 
localStorage.setItem( 
CONFIG.STORAGE_ACTAS, 
JSON.stringify(estado.actas) 
); 
} catch (error) { 
console.error( 
"No se pudieron guardar las actas en este dispositivo:", 
error 
); 

mostrarToast( 
"No se pudo guardar en este dispositivo (memoria llena). Prueba a borrar fotos de actas antiguas." 
); 
} 
} 

function sugerirNumeroActa() { 
let maximo = 0; 

estado.actas.forEach((acta) => { 
const coincidencia = 
String(acta.numero || "").match(/(\d+)/); 

if (coincidencia) { 
const valor = parseInt(coincidencia[1], 10); 

if (Number.isFinite(valor) && valor > maximo) { 
maximo = valor; 
} 
} 
}); 

return maximo > 0 ? String(maximo + 1) : ""; 
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

$("actaInfraccion")?.addEventListener( 
"keydown", 
(evento) => { 
if (evento.key === "Enter") { 
evento.preventDefault(); 
anadirInfraccionDesdeInput(); 
} 
} 
); 

$("actaInfraccionAddButton")?.addEventListener( 
"click", 
anadirInfraccionDesdeInput 
); 

$("actaInfraccionSearchButton")?.addEventListener( 
"click", 
abrirBuscadorArticuloActa 
); 

$("actaFotoInput")?.addEventListener( 
"change", 
manejarSeleccionFoto 
); 

$("actasSearch")?.addEventListener( 
"input", 
(evento) => { 
estado.actasBusqueda = evento.target.value; 
renderizarActas(); 
} 
); 

$("clearActasSearch")?.addEventListener( 
"click", 
() => { 
estado.actasBusqueda = ""; 

const campo = $("actasSearch"); 

if (campo) { 
campo.value = ""; 
} 

renderizarActas(); 
} 
); 

configurarGeolocalizacionActa(); 
configurarDictadoHechos(); 

renderizarActas(); 
} 

function abrirEditorActa(acta = null) { 
const editor = $("actaEditor"); 
const form = $("actaForm"); 

if (!editor || !form) { 
return; 
} 

form.reset(); 

infraccionesActuales = 
acta ? [...acta.infracciones] : []; 

fotosActuales = 
acta ? [...acta.fotos] : []; 

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

$("actaAgente").value = 
acta.agente || ""; 

$("actaNombre").value = 
acta.nombre || ""; 

$("actaDni").value = 
acta.dni || ""; 

$("actaDomicilio").value = 
acta.domicilio || ""; 

$("actaMatricula").value = 
acta.matricula || ""; 

$("actaVehiculo").value = 
acta.vehiculo || ""; 

$("actaLugar").value = 
acta.lugar || ""; 

$("actaHechos").value = 
acta.hechos || ""; 

$("actaObservaciones").value = 
acta.observaciones || ""; 

form.dataset.editingId = 
acta.id || ""; 

} else { 
delete form.dataset.editingId; 

const numeroSugerido = 
sugerirNumeroActa(); 

if (numeroSugerido) { 
$("actaNumero").value = numeroSugerido; 
} 
} 

$("actaInfraccion").value = ""; 

renderizarChipsInfracciones(); 
renderizarFotosPreview(); 
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

infraccionesActuales = []; 
fotosActuales = []; 

renderizarChipsInfracciones(); 
renderizarFotosPreview(); 

detenerDictadoHechos(); 

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

function guardarActaDesdeFormulario(evento) { 
evento.preventDefault(); 

const form = 
evento.currentTarget; 

if (!infraccionesActuales.length) { 
const valorSuelto = 
obtenerValor("actaInfraccion"); 

if (valorSuelto) { 
infraccionesActuales.push(valorSuelto); 
} 
} 

const acta = normalizarActa({ 
id: 
form.dataset.editingId || 
`acta-${Date.now()}`, 

numero: 
obtenerValor("actaNumero"), 

fecha: 
obtenerValor("actaFecha"), 

hora: 
obtenerValor("actaHora"), 

agente: 
obtenerValor("actaAgente"), 

nombre: 
obtenerValor("actaNombre"), 

dni: 
obtenerValor("actaDni"), 

domicilio: 
obtenerValor("actaDomicilio"), 

matricula: 
obtenerValor("actaMatricula"), 

vehiculo: 
obtenerValor("actaVehiculo"), 

lugar: 
obtenerValor("actaLugar"), 

hechos: 
obtenerValor("actaHechos"), 

infracciones: 
[...infraccionesActuales], 

observaciones: 
obtenerValor("actaObservaciones"), 

fotos: 
[...fotosActuales], 

actualizado: 
new Date().toISOString() 
}); 

const indice = 
estado.actas.findIndex( 
(item) => item.id === acta.id 
); 

if (indice >= 0) { 
estado.actas[indice] = acta; 
mostrarToast("Acta actualizada."); 
} else { 
estado.actas.unshift(acta); 
mostrarToast("Acta guardada."); 
} 

guardarActas(); 
renderizarActas(); 
cerrarEditorActa(); 

sincronizarActaEnNube(acta); 
} 

function coincideBusquedaActa(acta, texto) { 
if (!texto) { 
return true; 
} 

const contenido = [ 
acta.numero, 
acta.nombre, 
acta.dni, 
acta.matricula, 
acta.vehiculo, 
acta.lugar, 
...(acta.infracciones || []) 
].join(" "); 

return normalizarTexto(contenido).includes( 
normalizarTexto(texto) 
); 
} 

function renderizarActas() { 
const lista = 
$("actasList"); 

if (!lista) { 
return; 
} 

const texto = 
estado.actasBusqueda.trim(); 

const actasFiltradas = 
estado.actas.filter((acta) => 
coincideBusquedaActa(acta, texto) 
); 

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

if (!actasFiltradas.length) { 
lista.innerHTML = ` 
<div class="empty-state"> 
<div class="empty-icon">🔍</div> 
<h3>Sin resultados</h3> 
<p> 
Ninguna acta coincide con esa búsqueda. 
</p> 
</div> 
`; 
return; 
} 

lista.innerHTML = 
actasFiltradas 
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

${ 
acta.matricula || acta.vehiculo 
? ` 
<p class="acta-card-meta"> 
🚗 ${escaparHTML([acta.matricula, acta.vehiculo].filter(Boolean).join(" — "))} 
</p> 
` 
: "" 
} 

<p> 
${ 
acta.infracciones && acta.infracciones.length 
? escaparHTML(acta.infracciones.join(", ")) 
: "Sin infracción indicada" 
} 
</p> 

${ 
acta.fotos && acta.fotos.length 
? `<p class="acta-card-meta">📷 ${acta.fotos.length} foto(s) adjunta(s)</p>` 
: "" 
} 

<div class="form-actions acta-card-actions"> 

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
class="secondary-button" 
data-copy-acta="${ 
escaparHTML(acta.id) 
}" 
> 
📋 Copiar 
</button> 

<button 
type="button" 
class="secondary-button" 
data-pdf-acta="${ 
escaparHTML(acta.id) 
}" 
> 
📄 PDF 
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

function borrarActa(id) { 
const confirmado = 
window.confirm( 
"¿Quieres borrar esta acta?" 
); 

if (!confirmado) { 
return; 
} 

estado.actas = 
estado.actas.filter( 
(item) => item.id !== id 
); 

guardarActas(); 
renderizarActas(); 
mostrarToast("Acta borrada."); 

eliminarActaEnNube(id); 
} 

/* ========================================================= 
SINCRONIZACIÓN EN LA NUBE (COPIA DE SEGURIDAD DE ACTAS) 
========================================================= */ 

function normalizarActaDesdeNube(remota) { 
return normalizarActa({ 
id: remota.id, 
numero: remota.numero, 
fecha: remota.fecha, 
hora: remota.hora, 
agente: remota.agente, 
nombre: remota.nombre, 
dni: remota.dni, 
domicilio: remota.domicilio, 
matricula: remota.matricula, 
vehiculo: remota.vehiculo, 
lugar: remota.lugar, 
hechos: remota.hechos, 
infracciones: remota.infracciones, 
observaciones: remota.observaciones, 
fotos: remota.fotos, 
actualizado: remota.actualizado 
}); 
} 

async function sincronizarActaEnNube(acta) { 
if (!clienteSupabase || !usuarioActual || !navigator.onLine) { 
return; 
} 

try { 
const { error } = await clienteSupabase 
.from("actas") 
.upsert({ 
...acta, 
user_id: usuarioActual.id 
}); 

if (error) { 
throw error; 
} 

} catch (error) { 
console.warn( 
"No se pudo copiar el acta en la nube (se quedó guardada en este dispositivo):", 
error 
); 
} 
} 

async function eliminarActaEnNube(id) { 
if (!clienteSupabase || !usuarioActual) { 
return; 
} 

try { 
await clienteSupabase 
.from("actas") 
.delete() 
.eq("id", id) 
.eq("user_id", usuarioActual.id); 

} catch (error) { 
console.warn("No se pudo borrar el acta en la nube:", error); 
} 
} 

async function sincronizarActasDesdeNube() { 
if (!clienteSupabase || !usuarioActual || !navigator.onLine) { 
return; 
} 

try { 
const { data, error } = await clienteSupabase 
.from("actas") 
.select("*") 
.eq("user_id", usuarioActual.id); 

if (error) { 
throw error; 
} 

const remotas = Array.isArray(data) ? data : []; 
let huboCambios = false; 

remotas.forEach((remota) => { 
const remotaNormalizada = normalizarActaDesdeNube(remota); 

const local = estado.actas.find( 
(item) => item.id === remotaNormalizada.id 
); 

if (!local) { 
estado.actas.push(remotaNormalizada); 
huboCambios = true; 
} else if ( 
new Date(remotaNormalizada.actualizado) > 
new Date(local.actualizado || 0) 
) { 
Object.assign(local, remotaNormalizada); 
huboCambios = true; 
} 
}); 

if (huboCambios) { 
estado.actas.sort( 
(a, b) => 
new Date(b.actualizado || 0) - 
new Date(a.actualizado || 0) 
); 

guardarActas(); 
renderizarActas(); 
} 

} catch (error) { 
console.warn( 
"No se pudieron sincronizar las actas con la copia en la nube:", 
error 
); 
} 
} 

function buscarInfraccionPorCodigo(codigo) { 
const valor = normalizarTexto(codigo); 

if (!valor) { 
return null; 
} 

return estado.infracciones.find( 
(item) => 
normalizarTexto(item.codigo) === valor || 
normalizarTexto(item.id) === valor 
) || null; 
} 

function calcularRangoSancion(infraccion) { 
const sancion = infraccion?.sancion || {}; 

const min = 
Number.isFinite(Number(sancion.min)) 
? Number(sancion.min) 
: null; 

const max = 
Number.isFinite(Number(sancion.max)) 
? Number(sancion.max) 
: null; 

if (min !== null && max !== null) { 
return `${formatearEuros(min)} - ${formatearEuros(max)}`; 
} 

if (min !== null) { 
return `Desde ${formatearEuros(min)}`; 
} 

if (max !== null) { 
return `Hasta ${formatearEuros(max)}`; 
} 

return ""; 
} 

function renderFilaSancion(codigo) { 
const encontrada = 
buscarInfraccionPorCodigo(codigo); 

if (!encontrada) { 
return ` 
<div class="infraccion-preview-item"> 
<strong>${escaparHTML(codigo)}</strong> 
<span class="infraccion-preview-sancion-vacia">No encontrado en el catálogo</span> 
</div> 
`; 
} 

const rango = calcularRangoSancion(encontrada); 

return ` 
<div class="infraccion-preview-item"> 

<strong>${escaparHTML(encontrada.codigo || codigo)}</strong> 

<p>${escaparHTML(encontrada.titulo || "")}</p> 

<span>${escaparHTML(encontrada.gravedad || "")}</span> 

<div class="infraccion-preview-sancion"> 
<span class="infraccion-preview-sancion-label">Sanción</span> 
<strong class="infraccion-preview-sancion-valor"> 
${rango || "No especificada"} 
</strong> 
</div> 

</div> 
`; 
} 

function actualizarPreviewInfraccion() { 
const preview = 
$("actaInfraccionPreview"); 

const input = 
$("actaInfraccion"); 

if (!preview) { 
return; 
} 

const codigos = 
[...infraccionesActuales]; 

const valorInput = 
input?.value?.trim() || ""; 

if (valorInput && !codigos.includes(valorInput)) { 
codigos.push(valorInput); 
} 

if (!codigos.length) { 
preview.classList.add("hidden"); 
preview.innerHTML = ""; 
return; 
} 

preview.classList.remove("hidden"); 

preview.innerHTML = codigos 
.map(renderFilaSancion) 
.join(""); 
} 

function renderizarChipsInfracciones() { 
const contenedor = 
$("actaInfraccionesChips"); 

if (!contenedor) { 
return; 
} 

if (!infraccionesActuales.length) { 
contenedor.innerHTML = ""; 
return; 
} 

contenedor.innerHTML = 
infraccionesActuales 
.map((codigo, indice) => ` 
<span class="infraccion-chip"> 
${escaparHTML(codigo)} 
<button 
type="button" 
class="infraccion-chip-remove" 
data-remove-infraccion="${indice}" 
aria-label="Quitar ${escaparHTML(codigo)}" 
> 
× 
</button> 
</span> 
`) 
.join(""); 
} 

function anadirInfraccionDesdeInput() { 
const input = $("actaInfraccion"); 

if (!input) { 
return; 
} 

const codigo = input.value.trim(); 

if (!codigo) { 
return; 
} 

if (infraccionesActuales.includes(codigo)) { 
mostrarToast("Ese artículo ya está añadido."); 
input.value = ""; 
actualizarPreviewInfraccion(); 
return; 
} 

infraccionesActuales.push(codigo); 
input.value = ""; 

renderizarChipsInfracciones(); 
actualizarPreviewInfraccion(); 
} 

function quitarInfraccionPorIndice(indice) { 
infraccionesActuales.splice(indice, 1); 

renderizarChipsInfracciones(); 
actualizarPreviewInfraccion(); 
} 

/* ========================================================= 
BUSCADOR DE ARTÍCULOS EN EL ACTA 
========================================================= */ 

function abrirBuscadorArticuloActa() { 
abrirModal( 
"Buscar artículo o infracción", 
renderBuscadorArticuloModal(""), 
[ 
{ 
label: "Cancelar", 
className: "secondary-button", 
onClick: cerrarModal 
} 
] 
); 

const input = $("modalArticuloSearch"); 

if (input) { 
input.addEventListener("input", () => { 
const contenedor = 
$("modalArticuloResultados"); 

if (contenedor) { 
contenedor.innerHTML = 
renderResultadosBuscadorArticulo( 
input.value 
); 
} 
}); 

input.focus(); 
} 
} 

function renderBuscadorArticuloModal(textoInicial) { 
return ` 
<div class="modal-search"> 
<input 
id="modalArticuloSearch" 
type="search" 
placeholder="Buscar por código, artículo o palabra clave..." 
autocomplete="off" 
value="${escaparHTML(textoInicial)}" 
> 
</div> 

<div 
id="modalArticuloResultados" 
class="modal-search-results" 
> 
${renderResultadosBuscadorArticulo(textoInicial)} 
</div> 
`; 
} 

function renderResultadosBuscadorArticulo(textoCrudo) { 
const texto = 
normalizarTexto(textoCrudo); 

if (!texto) { 
return `<p class="modal-search-hint">Escribe un código, artículo o palabra clave para buscar.</p>`; 
} 

const resultados = 
estado.infracciones.filter((infraccion) => { 

const palabras = Array.isArray( 
infraccion.palabrasClave 
) 
? infraccion.palabrasClave 
: []; 

const contenido = [ 
infraccion.id, 
infraccion.codigo, 
infraccion.ley, 
infraccion.articulo, 
infraccion.apartado, 
infraccion.titulo, 
infraccion.conducta, 
...palabras 
].join(" "); 

return normalizarTexto(contenido).includes(texto); 
}).slice(0, 30); 

if (!resultados.length) { 
return `<p class="modal-search-hint">Sin resultados para esa búsqueda.</p>`; 
} 

return resultados.map((infraccion) => ` 
<button 
type="button" 
class="modal-search-item" 
data-select-articulo="${escaparHTML(infraccion.codigo || "")}" 
> 
<span class="modal-search-item-code"> 
${escaparHTML(infraccion.codigo || "")} 
</span> 
<span class="modal-search-item-title"> 
${escaparHTML(infraccion.titulo || "Sin título")} 
</span> 
</button> 
`).join(""); 
} 

function seleccionarArticuloParaActa(codigo) { 
if (!codigo) { 
return; 
} 

if (infraccionesActuales.includes(codigo)) { 
mostrarToast("Ese artículo ya estaba añadido."); 
return; 
} 

infraccionesActuales.push(codigo); 

renderizarChipsInfracciones(); 
actualizarPreviewInfraccion(); 

mostrarToast(`«${codigo}» añadido. Puedes seguir buscando o cerrar.`); 
} 

/* ========================================================= 
CONEXIÓN INVERSA: AÑADIR NORMATIVA AL ACTA 
========================================================= */ 

function enviarInfraccionAActa(codigo) { 
if (!codigo) { 
return; 
} 

const editorAbierto = 
!$("actaEditor")?.classList.contains("hidden"); 

activarSeccion("actas"); 

if (!editorAbierto) { 
abrirEditorActa(); 
} 

if (!infraccionesActuales.includes(codigo)) { 
infraccionesActuales.push(codigo); 
} 

renderizarChipsInfracciones(); 
actualizarPreviewInfraccion(); 

$("actaEditor")?.scrollIntoView({ 
behavior: "smooth", 
block: "start" 
}); 

mostrarToast(`«${codigo}» añadido al acta.`); 
} 

/* ========================================================= 
GEOLOCALIZACIÓN DEL LUGAR DE LOS HECHOS 
========================================================= */ 

async function obtenerDireccionDesdeCoordenadas(lat, lon) { 
if (!navigator.onLine) { 
return null; 
} 

const controlador = new AbortController(); 
const temporizador = setTimeout(() => controlador.abort(), 6000); 

try { 
const respuesta = await fetch( 
`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`, 
{ 
signal: controlador.signal, 
headers: { "Accept": "application/json" } 
} 
); 

if (!respuesta.ok) { 
return null; 
} 

const datos = await respuesta.json(); 

return datos?.display_name || null; 

} catch (error) { 
return null; 

} finally { 
clearTimeout(temporizador); 
} 
} 

function configurarGeolocalizacionActa() { 
const boton = $("actaLugarGpsButton"); 
const input = $("actaLugar"); 

if (!boton || !input) { 
return; 
} 

boton.addEventListener("click", async () => { 

if (!("geolocation" in navigator)) { 
mostrarToast("Este dispositivo no permite obtener la ubicación."); 
return; 
} 

boton.classList.add("is-loading"); 
boton.textContent = "⏳"; 

navigator.geolocation.getCurrentPosition( 
async (posicion) => { 

const lat = posicion.coords.latitude; 
const lon = posicion.coords.longitude; 

const coordenadas = 
`${lat.toFixed(5)}, ${lon.toFixed(5)}`; 

const direccion = 
await obtenerDireccionDesdeCoordenadas(lat, lon); 

input.value = direccion || coordenadas; 

boton.classList.remove("is-loading"); 
boton.textContent = "📍"; 

mostrarToast("Ubicación actual añadida."); 
}, 
(error) => { 

boton.classList.remove("is-loading"); 
boton.textContent = "📍"; 

console.error("Error de geolocalización:", error); 
mostrarToast("No se pudo obtener la ubicación."); 
}, 
{ 
enableHighAccuracy: true, 
timeout: 10000, 
maximumAge: 0 
} 
); 
}); 
} 

/* ========================================================= 
COPIAR / EXPORTAR ACTA 
========================================================= */ 

function formatearActaComoTexto(acta) { 
const lineas = [ 
`ACTA Nº ${acta.numero || "sin número"}`, 
`Fecha: ${acta.fecha || "-"}    Hora: ${acta.hora || "-"}`, 
`Agente actuante: ${acta.agente || "-"}`, 
"", 
"PERSONA DENUNCIADA", 
`Nombre y apellidos: ${acta.nombre || "-"}`, 
`DNI / NIE: ${acta.dni || "-"}`, 
`Domicilio: ${acta.domicilio || "-"}`, 
"", 
"VEHÍCULO", 
`Matrícula: ${acta.matricula || "-"}`, 
`Marca / modelo: ${acta.vehiculo || "-"}`, 
"", 
"HECHOS", 
`Lugar: ${acta.lugar || "-"}`, 
`Descripción: ${acta.hechos || "-"}`, 
"", 
"INFRACCIÓN", 
acta.infracciones && acta.infracciones.length 
? acta.infracciones.map((codigo) => { 
const encontrada = buscarInfraccionPorCodigo(codigo); 
const rango = encontrada ? calcularRangoSancion(encontrada) : ""; 
return `- ${codigo}${encontrada?.titulo ? ` — ${encontrada.titulo}` : ""}${rango ? ` (Sanción: ${rango})` : ""}`; 
}).join("\n") 
: "- Sin infracción indicada", 
"", 
"OBSERVACIONES", 
acta.observaciones || "-", 
"", 
acta.fotos && acta.fotos.length 
? `(${acta.fotos.length} fotografía(s) adjunta(s) en la app — no incluidas en este texto)` 
: "" 
]; 

return lineas.filter((linea) => linea !== undefined).join("\n"); 
} 

async function copiarActa(id) { 
const acta = 
estado.actas.find((item) => item.id === id); 

if (!acta) { 
return; 
} 

const texto = formatearActaComoTexto(acta); 

try { 
await navigator.clipboard.writeText(texto); 
mostrarToast("Acta copiada al portapapeles."); 

} catch (error) { 
console.error("No se pudo copiar el acta:", error); 
mostrarToast("No se pudo copiar el acta."); 
} 
} 

/* ========================================================= 
FOTOS DEL ACTA 
========================================================= */ 

function redimensionarImagen(archivo) { 
return new Promise((resolve, reject) => { 
const lector = new FileReader(); 

lector.onerror = () => reject(new Error("No se pudo leer la imagen.")); 

lector.onload = () => { 
const imagen = new Image(); 

imagen.onerror = () => reject(new Error("No se pudo procesar la imagen.")); 

imagen.onload = () => { 
const anchoMaximo = 1024; 

const escala = 
imagen.width > anchoMaximo 
? anchoMaximo / imagen.width 
: 1; 

const lienzo = document.createElement("canvas"); 
lienzo.width = Math.round(imagen.width * escala); 
lienzo.height = Math.round(imagen.height * escala); 

const contexto = lienzo.getContext("2d"); 
contexto.drawImage(imagen, 0, 0, lienzo.width, lienzo.height); 

resolve(lienzo.toDataURL("image/jpeg", 0.72)); 
}; 

imagen.src = lector.result; 
}; 

lector.readAsDataURL(archivo); 
}); 
} 

async function manejarSeleccionFoto(evento) { 
const archivo = evento.target.files?.[0]; 

evento.target.value = ""; 

if (!archivo) { 
return; 
} 

if (fotosActuales.length >= MAX_FOTOS_ACTA) { 
mostrarToast(`Máximo ${MAX_FOTOS_ACTA} fotos por acta.`); 
return; 
} 

try { 
const dataUrl = await redimensionarImagen(archivo); 

fotosActuales.push({ 
id: `foto-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`, 
dataUrl 
}); 

renderizarFotosPreview(); 

} catch (error) { 
console.error("No se pudo procesar la fotografía:", error); 
mostrarToast("No se pudo procesar la fotografía."); 
} 
} 

function renderizarFotosPreview() { 
const contenedor = $("actaFotosPreview"); 

if (!contenedor) { 
return; 
} 

if (!fotosActuales.length) { 
contenedor.innerHTML = ""; 
return; 
} 

contenedor.innerHTML = fotosActuales 
.map((foto) => ` 
<div class="foto-thumb"> 
<img src="${foto.dataUrl}" alt="Fotografía adjunta al acta"> 
<button 
type="button" 
class="foto-thumb-remove" 
data-remove-foto="${escaparHTML(foto.id)}" 
aria-label="Quitar fotografía" 
> 
× 
</button> 
</div> 
`) 
.join(""); 
} 

function quitarFoto(id) { 
fotosActuales = fotosActuales.filter((foto) => foto.id !== id); 
renderizarFotosPreview(); 
} 

/* ========================================================= 
DICTADO POR VOZ 
========================================================= */ 

function configurarDictadoHechos() { 
const boton = $("actaHechosDictarButton"); 
const textarea = $("actaHechos"); 

if (!boton || !textarea) { 
return; 
} 

const MotorReconocimiento = 
window.SpeechRecognition || window.webkitSpeechRecognition; 

if (!MotorReconocimiento) { 
boton.addEventListener("click", () => { 
mostrarToast("Este navegador no admite el dictado por voz."); 
}); 
return; 
} 

boton.addEventListener("click", () => { 

if (reconocimientoVozActivo) { 
reconocimientoVozActivo.stop(); 
return; 
} 

const reconocimiento = new MotorReconocimiento(); 
reconocimiento.lang = "es-ES"; 
reconocimiento.continuous = false; 
reconocimiento.interimResults = false; 

reconocimiento.onstart = () => { 
reconocimientoVozActivo = reconocimiento; 
boton.classList.add("is-listening"); 
boton.textContent = "🎙️ Escuchando..."; 
}; 

reconocimiento.onresult = (evento) => { 
const texto = 
evento.results?.[0]?.[0]?.transcript || ""; 

if (texto) { 
textarea.value = 
textarea.value 
? `${textarea.value.trim()} ${texto}` 
: texto; 
} 
}; 

reconocimiento.onerror = () => { 
mostrarToast("No se pudo reconocer el dictado. Inténtalo de nuevo."); 
}; 

reconocimiento.onend = () => { 
reconocimientoVozActivo = null; 
boton.classList.remove("is-listening"); 
boton.textContent = "🎤 Dictar"; 
}; 

try { 
reconocimiento.start(); 
} catch (error) { 
console.error("No se pudo iniciar el dictado:", error); 
} 
}); 
} 

function detenerDictadoHechos() { 
if (reconocimientoVozActivo) { 
reconocimientoVozActivo.stop(); 
} 
} 

/* ========================================================= 
EXPORTAR ACTA A PDF 
========================================================= */ 

let libreriaJsPdfPromesa = null; 

function cargarLibreriaJsPDF() { 
if (window.jspdf?.jsPDF) { 
return Promise.resolve(window.jspdf.jsPDF); 
} 

if (!libreriaJsPdfPromesa) { 
libreriaJsPdfPromesa = new Promise((resolve, reject) => { 
const script = document.createElement("script"); 
script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"; 

script.onload = () => { 
if (window.jspdf?.jsPDF) { 
resolve(window.jspdf.jsPDF); 
} else { 
reject(new Error("jsPDF no se cargó correctamente.")); 
} 
}; 

script.onerror = () => reject(new Error("No se pudo cargar la librería de PDF.")); 

document.head.appendChild(script); 
}); 
} 

return libreriaJsPdfPromesa; 
} 

async function exportarActaPDF(id) { 
const acta = estado.actas.find((item) => item.id === id); 

if (!acta) { 
return; 
} 

if (!navigator.onLine) { 
mostrarToast("Necesitas conexión para generar el PDF la primera vez. Usa «Copiar» mientras tanto."); 
return; 
} 

mostrarToast("Generando PDF..."); 

try { 
const JsPDF = await cargarLibreriaJsPDF(); 
const doc = new JsPDF(); 

const texto = formatearActaComoTexto(acta); 
const margen = 15; 
const anchoUtil = 180; 

doc.setFontSize(14); 
doc.text(`Acta nº ${acta.numero || "sin número"}`, margen, 18); 

doc.setFontSize(10); 
const lineas = doc.splitTextToSize(texto, anchoUtil); 

doc.text(lineas, margen, 30); 

doc.save(`acta-${acta.numero || acta.id}.pdf`); 

mostrarToast("PDF generado y descargado."); 

} catch (error) { 
console.error("No se pudo generar el PDF:", error); 
mostrarToast("No se pudo generar el PDF. Prueba con «Copiar acta»."); 
} 
} 

/* ========================================================= 
FAVORITOS 
========================================================= */ 

function cargarFavoritos() { 
try { 
const guardados = 
localStorage.getItem( 
CONFIG.STORAGE_FAVORITOS 
); 

estado.favoritos = 
guardados 
? JSON.parse(guardados) 
: []; 

if (!Array.isArray(estado.favoritos)) { 
estado.favoritos = []; 
} 

} catch (error) { 
console.error( 
"No se pudieron cargar los favoritos:", 
error 
); 

estado.favoritos = []; 
} 
} 

function guardarFavoritos() { 
localStorage.setItem( 
CONFIG.STORAGE_FAVORITOS, 
JSON.stringify(estado.favoritos) 
); 
} 

function claveFavorito(tipo, id) { 
return `${tipo || ""}::${id || ""}`; 
} 

function esFavorito(tipo, id) { 
const clave = claveFavorito(tipo, id); 

return estado.favoritos.some( 
(item) => claveFavorito(item.tipo, item.id) === clave 
); 
} 

function alternarFavorito(tipo, id, etiqueta, subtitulo, icono) { 
if (!tipo) { 
return; 
} 

const clave = claveFavorito(tipo, id); 

const indice = 
estado.favoritos.findIndex( 
(item) => claveFavorito(item.tipo, item.id) === clave 
); 

if (indice >= 0) { 
estado.favoritos.splice(indice, 1); 
mostrarToast("Eliminado de favoritos."); 
} else { 
estado.favoritos.unshift({ 
tipo, 
id: id || "", 
etiqueta: etiqueta || "Normativa", 
subtitulo: subtitulo || "", 
icono: icono || "⭐" 
}); 
mostrarToast("Añadido a favoritos."); 
} 

guardarFavoritos(); 
actualizarBotonFavorito(tipo, id, etiqueta, subtitulo, icono); 
renderizarNormativa(); 
} 

function actualizarBotonFavorito(tipo, id, etiqueta, subtitulo, icono) { 
const boton = $("viewerFavButton"); 

if (!boton) { 
return; 
} 

if (!tipo) { 
boton.classList.add("hidden"); 
return; 
} 

boton.classList.remove("hidden"); 
boton.dataset.favTipo = tipo; 
boton.dataset.favId = id || ""; 
boton.dataset.favEtiqueta = etiqueta || ""; 
boton.dataset.favSubtitulo = subtitulo || ""; 
boton.dataset.favIcono = icono || "⭐"; 

const activo = esFavorito(tipo, id); 

boton.classList.toggle("is-active", activo); 
boton.textContent = activo ? "⭐" : "☆"; 
boton.title = activo 
? "Quitar de favoritos" 
: "Guardar en favoritos"; 
} 

function quitarFavoritoPorClave(clave) { 
const indice = 
estado.favoritos.findIndex( 
(item) => claveFavorito(item.tipo, item.id) === clave 
); 

if (indice < 0) { 
return; 
} 

estado.favoritos.splice(indice, 1); 
guardarFavoritos(); 

actualizarBotonFavorito( 
$("viewerFavButton")?.dataset.favTipo, 
$("viewerFavButton")?.dataset.favId, 
$("viewerFavButton")?.dataset.favEtiqueta, 
$("viewerFavButton")?.dataset.favSubtitulo, 
$("viewerFavButton")?.dataset.favIcono 
); 

renderizarNormativa(); 
mostrarToast("Eliminado de favoritos."); 
} 

function configurarFavoritos() { 
$("viewerFavButton")?.addEventListener( 
"click", 
(evento) => { 
const boton = evento.currentTarget; 

alternarFavorito( 
boton.dataset.favTipo, 
boton.dataset.favId, 
boton.dataset.favEtiqueta, 
boton.dataset.favSubtitulo, 
boton.dataset.favIcono 
); 
} 
); 
} 

function renderizarFavoritos() { 
if (!estado.favoritos.length) { 
return ""; 
} 

return ` 
<div class="favoritos-section"> 

<div class="favoritos-title"> 
⭐ Favoritos 
</div> 

<div class="normativa-list"> 
${estado.favoritos.map((favorito) => ` 
<div class="normativa-card"> 

<div class="normativa-icon"> 
${favorito.icono || "⭐"} 
</div> 

<div class="normativa-info"> 

<h3> 
${escaparHTML(favorito.etiqueta || "Normativa")} 
</h3> 

<p> 
${escaparHTML(favorito.subtitulo || "")} 
</p> 

</div> 

<button 
type="button" 
class="normativa-fav-remove" 
data-fav-remove="${escaparHTML(claveFavorito(favorito.tipo, favorito.id))}" 
aria-label="Quitar de favoritos" 
title="Quitar de favoritos" 
> 
⭐ 
</button> 

<button 
type="button" 
class="normativa-open" 
data-law="${escaparHTML(favorito.tipo)}" 
data-id="${escaparHTML(favorito.id)}" 
> 
Ver 
</button> 

</div> 
`).join("")} 
</div> 

</div> 
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
tipo: "ordenanzas", 
titulo: "Ordenanzas municipales", 
descripcion: 
`Normativa local por categorías — ${ordenanzas.length} ordenanzas`, 
etiqueta: `${categorias.length} categorías`, 
icono: "🏛️" 
} 
]; 

const coincide = (campos) => 
!texto || 
normalizarTexto(campos.join(" ")).includes(texto); 

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

const favoritosHTML = 
texto ? "" : renderizarFavoritos(); 

if (!principalesFiltradas.length) { 
lista.innerHTML = 
favoritosHTML || 
` 
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
${favoritosHTML} 
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

actualizarBotonFavorito(); 

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

actualizarBotonFavorito(); 

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

actualizarBotonFavorito( 
"ley-animal", 
id, 
leyItem.ley || "Normativa de animales", 
leyItem.abreviatura || "", 
"🐾" 
); 

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
<strong>Estado:</strong> ${formatearEstadoNormativa(leyItem.estado)}<br> 
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
<button 
type="button" 
class="secondary-button" 
data-add-acta="${escaparHTML(articulo.numero || "")}" 
> 
📝 Añadir al acta 
</button> 
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

actualizarBotonFavorito(); 

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

actualizarBotonFavorito( 
"ley-trafico", 
id, 
leyItem.ley || "Normativa de tráfico", 
leyItem.abreviatura || "", 
"🚦" 
); 

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
<strong>Estado:</strong> ${formatearEstadoNormativa(leyItem.estado)}<br> 
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
<button 
type="button" 
class="secondary-button" 
data-add-acta="${escaparHTML(articulo.numero || "")}" 
> 
📝 Añadir al acta 
</button> 
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

actualizarBotonFavorito( 
"lopsc", 
"", 
"Ley Orgánica 4/2015", 
"Protección de la seguridad ciudadana", 
"⚖️" 
); 

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

<button 
type="button" 
class="secondary-button" 
data-add-acta="${escaparHTML(articulo.numero || "")}" 
> 
📝 Añadir al acta 
</button> 

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

actualizarBotonFavorito( 
"ordenanza", 
id, 
ordenanza.nombre || ordenanza.nombre_corto || "Ordenanza municipal", 
ordenanza.codigo || "", 
"📋" 
); 

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
<p><strong>Estado:</strong> ${formatearEstadoNormativa(ordenanza.estado)}</p> 
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

<button 
type="button" 
class="secondary-button" 
data-add-acta="${escaparHTML(ordenanza.codigo || ordenanza.nombre || "")}" 
> 
📝 Añadir al acta 
</button> 

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

actualizarBotonFavorito(); 
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

const enlaceExterno = 
evento.target.closest( 
"a.law-link-button" 
); 

if (enlaceExterno) { 
if (!navigator.onLine) { 
evento.preventDefault(); 
mostrarToast( 
"Sin cobertura: no se puede abrir el documento oficial ahora mismo." 
); 
} 
return; 
} 

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
return; 
} 

const copiar = 
evento.target.closest( 
"[data-copy-acta]" 
); 

if (copiar) { 
copiarActa( 
copiar.dataset.copyActa 
); 
return; 
} 

const seleccionArticulo = 
evento.target.closest( 
"[data-select-articulo]" 
); 

if (seleccionArticulo) { 
seleccionarArticuloParaActa( 
seleccionArticulo.dataset.selectArticulo 
); 
return; 
} 

const anadirActa = 
evento.target.closest( 
"[data-add-acta]" 
); 

if (anadirActa) { 
enviarInfraccionAActa( 
anadirActa.dataset.addActa 
); 
return; 
} 

const quitarFavorito = 
evento.target.closest( 
"[data-fav-remove]" 
); 

if (quitarFavorito) { 
quitarFavoritoPorClave( 
quitarFavorito.dataset.favRemove 
); 
return; 
} 

const quitarInfraccion = 
evento.target.closest( 
"[data-remove-infraccion]" 
); 

if (quitarInfraccion) { 
quitarInfraccionPorIndice( 
parseInt(quitarInfraccion.dataset.removeInfraccion, 10) 
); 
return; 
} 

const quitarFotoBoton = 
evento.target.closest( 
"[data-remove-foto]" 
); 

if (quitarFotoBoton) { 
quitarFoto( 
quitarFotoBoton.dataset.removeFoto 
); 
return; 
} 

const exportarPdf = 
evento.target.closest( 
"[data-pdf-acta]" 
); 

if (exportarPdf) { 
exportarActaPDF( 
exportarPdf.dataset.pdfActa 
); 
} 
} 
); 
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
AUTENTICACION SUPABASE
========================================================= */
const SUPABASE_CONFIG = {
URL: "https://okuygqbaliaeavhyezri.supabase.co",
PUBLISHABLE_KEY: "sb_publishable_fbEAcJZxMv8PD3VB3Bcx6A_l_8BdP2m"
};
let clienteSupabase = null;
let usuarioActual = null;

function crearPantallaLogin() {
let pantalla = $("centinelaLogin");
if (pantalla) return pantalla;
pantalla = document.createElement("div");
pantalla.id = "centinelaLogin";
pantalla.style.cssText = "position:fixed;inset:0;z-index:999999;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;background:rgba(2,8,23,.97);font-family:inherit;";
pantalla.innerHTML = `
<div style="width:min(410px,100%);padding:28px 24px;border-radius:24px;background:linear-gradient(145deg,#102440,#06101e);border:1px solid rgba(100,160,220,.35);box-shadow:0 25px 70px rgba(0,0,0,.6)">
<div style="text-align:center;margin-bottom:20px">
<div style="font-size:48px">🛡️</div>
<h2 style="margin:8px 0 4px;color:#fff">Centinela Code</h2>
<p style="margin:0;color:#9fb3ca">Acceso profesional</p>
</div>
<form id="centinelaLoginForm">
<label style="display:block;color:#dce8f5;margin-bottom:14px;font-weight:600">Usuario / correo electrónico
<input id="centinelaLoginEmail" type="email" autocomplete="username" required placeholder="usuario@correo.es" style="display:block;width:100%;box-sizing:border-box;margin-top:7px;padding:13px;border-radius:12px;border:1px solid #35506d;background:#071421;color:#fff"></label>
<label style="display:block;color:#dce8f5;margin-bottom:14px;font-weight:600">Contraseña
<input id="centinelaLoginPassword" type="password" autocomplete="current-password" required placeholder="Contraseña" style="display:block;width:100%;box-sizing:border-box;margin-top:7px;padding:13px;border-radius:12px;border:1px solid #35506d;background:#071421;color:#fff"></label>
<button id="centinelaLoginButton" type="submit" style="width:100%;padding:13px;border:0;border-radius:12px;background:#1f73d1;color:#fff;font-weight:800;cursor:pointer">Entrar</button>
<div id="centinelaLoginMessage" style="min-height:20px;margin-top:12px;color:#ffb4b4;text-align:center;font-size:14px"></div>
</form>
</div>`;
document.body.appendChild(pantalla);
return pantalla;
}
function ocultarPantallaLogin(){ $("centinelaLogin")?.remove(); }
function mostrarMensajeLogin(mensaje){ const el=$("centinelaLoginMessage"); if(el) el.textContent=mensaje||""; }
function cargarLibreriaSupabase(){
if(window.supabase?.createClient) return Promise.resolve();
return new Promise((resolve,reject)=>{
const existente=document.querySelector('script[data-centinela-supabase="true"]');
if(existente){
const t=setTimeout(()=>reject(new Error("Tiempo agotado cargando Supabase.")),8000);
existente.addEventListener("load",()=>{clearTimeout(t);window.supabase?.createClient?resolve():reject(new Error("Supabase no está disponible."));},{once:true});
existente.addEventListener("error",()=>{clearTimeout(t);reject(new Error("No se pudo cargar Supabase."));},{once:true});
return;
}
const script=document.createElement("script");
script.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
script.async=true; script.dataset.centinelaSupabase="true";
const t=setTimeout(()=>reject(new Error("Tiempo agotado cargando Supabase.")),8000);
script.onload=()=>{clearTimeout(t);window.supabase?.createClient?resolve():reject(new Error("Supabase no está disponible."));};
script.onerror=()=>{clearTimeout(t);reject(new Error("No se pudo cargar Supabase."));};
document.head.appendChild(script);
});
}
async function iniciarAutenticacion(){
const login=crearPantallaLogin();
login.style.display="flex";
mostrarMensajeLogin("Conectando con el sistema de acceso...");
try{
await cargarLibreriaSupabase();
clienteSupabase=window.supabase.createClient(SUPABASE_CONFIG.URL,SUPABASE_CONFIG.PUBLISHABLE_KEY);
const sesion=await Promise.race([
clienteSupabase.auth.getSession(),
new Promise((_,reject)=>setTimeout(()=>reject(new Error("Tiempo agotado comprobando la sesión.")),8000))
]);
if(sesion.error) throw sesion.error;
if(sesion.data?.session){ usuarioActual=sesion.data.session.user; ocultarPantallaLogin(); return true; }
mostrarMensajeLogin("Introduce tu usuario y contraseña.");
const form=$("centinelaLoginForm");
form?.addEventListener("submit",async(e)=>{
e.preventDefault();
const email=$("centinelaLoginEmail")?.value.trim();
const password=$("centinelaLoginPassword")?.value||"";
const boton=$("centinelaLoginButton");
if(!email||!password){mostrarMensajeLogin("Introduce usuario y contraseña.");return;}
if(boton){boton.disabled=true;boton.textContent="Comprobando...";}
try{
const resultado=await clienteSupabase.auth.signInWithPassword({email,password});
if(resultado.error) throw resultado.error;
usuarioActual=resultado.data.user;
hideLoginAndStart();
}catch(error){console.error("Error de login:",error);mostrarMensajeLogin("Usuario o contraseña incorrectos.");if(boton){boton.disabled=false;boton.textContent="Entrar";}}
},{once:true});
return false;
}catch(error){console.error("Error de autenticación:",error);mostrarMensajeLogin("No se pudo conectar con el sistema de acceso. Comprueba la conexión a Internet.");return false;}
}
async function hideLoginAndStart(){
ocultarPantallaLogin();
await iniciarAplicacionPostLogin();
}
async function iniciarAplicacionPostLogin(){
try{
mostrarCarga(true);
configurarNavegacion();
configurarConsulta();
configurarActas();
configurarNormativa();
configurarModal();
configurarAjustes();
configurarFavoritos();
configurarEventosGlobales();
configurarRed();
cargarActas(); 
cargarFavoritos();
await cargarDatos();
sincronizarActasDesdeNube();
const version=$("appVersion"); if(version) version.textContent=CONFIG.VERSION;
}catch(error){console.error("Error iniciando Centinela Code tras login:",error);mostrarToast("La aplicación se inició con un error.");}
finally{actualizarEstadoDatos();actualizarRed();mostrarCarga(false);}
}

async function iniciarAplicacion() {
const autenticado = await iniciarAutenticacion();
if (!autenticado) return;
await iniciarAplicacionPostLogin();
}

/* ========================================================= 
ARRANQUE 
========================================================= */ 

if ( 
document.readyState === "loading" 
) { 
document.addEventListener( 
"DOMContentLoaded", 
iniciarAplicacion, 
{ once: true } 
); 
} else { 
iniciarAplicacion(); 
} 

registrarServiceWorker();
