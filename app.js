/* 
============================================================ 
CENTINELA CODE 
app.js - Versi�n corregida y compatible con index.html 
============================================================ 

Funciones: 
- Carga de infracciones, LOPSC y ordenanzas. 
- Consulta por c�digo, art�culo, palabra y gravedad. 
- Navegaci�n inferior y accesos r�pidos. 
- Creaci�n, edici�n b�sica y borrado de actas mediante localStorage. 
- Visor de LOPSC y ordenanzas. 
- Estado de conexi�n y estado de las bases. 
- Limpieza/recarga de datos. 
- Compatible con la estructura actual de index.html. 
============================================================ 
*/ 

"use strict"; 

const CONFIG = { 
VERSION: "1.0.1", 
RUTAS: { 
infracciones: "./data/infracciones.json", 
lopsc: "./data/lopsc.json", 
ordenanzas: "./data/ordenanzas.json" 
}, 
STORAGE_ACTAS: "centinela_code_actas_v1" 
}; 

const estado = { 
infracciones: [], 
lopsc: null, 
ordenanzas: null, 
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

if (datos && datos.infracciones && typeof datos.infracciones === "object") {
return Object.values(datos.infracciones);
}

return [];
} 

function extraerArticulos(datos) {
if (datos && Array.isArray(datos.articulos)) {
return datos.articulos;
}

if (datos && datos.articulos && typeof datos.articulos === "object") {
return Object.values(datos.articulos);
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

if (datos && datos.ordenanzas && typeof datos.ordenanzas === "object") {
return Object.values(datos.ordenanzas);
}

return [];
} 

async function cargarDatos() { 
const resultados = await Promise.allSettled([ 
cargarJSON(CONFIG.RUTAS.infracciones), 
cargarJSON(CONFIG.RUTAS.lopsc), 
cargarJSON(CONFIG.RUTAS.ordenanzas) 
]); 

const [rInfracciones, rLopsc, rOrdenanzas] = resultados; 

if (rInfracciones.status === "fulfilled") { 
estado.infracciones = extraerInfracciones( 
rInfracciones.value 
); 
} else { 
estado.infracciones = []; 
console.error( 
"Error cargando infracciones:", 
rInfracciones.reason 
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

actualizarEstadoDatos(); 
actualizarBusqueda(); 
renderizarNormativa(); 

const correctos = resultados.filter( 
(resultado) => resultado.status === "fulfilled" 
).length; 

if (correctos === 3) { 
mostrarToast("Datos cargados correctamente."); 
} else { 
mostrarToast( 
`Datos cargados: ${correctos}/3 bases disponibles.` 
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

establecerEstado( 
$("homeNormativaStatus"), 
hayLopsc 
? `${extraerArticulos(estado.lopsc).length} art�culos` 
: "No disponible", 
hayLopsc 
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
NAVEGACI�N 
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

function puntuacionBusqueda(infraccion, texto) {
const termino = normalizarTexto(texto);
if (!termino) return 0;

const codigo = normalizarTexto(infraccion.codigo);
const id = normalizarTexto(infraccion.id);
const articulo = normalizarTexto(infraccion.articulo);
const apartado = normalizarTexto(infraccion.apartado);
const titulo = normalizarTexto(infraccion.titulo);
const conducta = normalizarTexto(infraccion.conducta);
const ley = normalizarTexto(infraccion.ley);
const palabras = Array.isArray(infraccion.palabrasClave)
? infraccion.palabrasClave.map(normalizarTexto)
: [];

// Palabras que deben localizar el bloque de drogas de la LOPSC.
const sinonimosDrogas = [
"cocaina", "coca", "cocaina en polvo",
"hachis", "hash", "resina de cannabis",
"marihuana", "marijuana", "cannabis",
"porro", "porros", "grifa",
"estupefaciente", "estupefacientes",
"droga", "drogas", "sustancia estupefaciente",
"sustancias estupefacientes", "sustancia psicotropica",
"sustancias psicotropicas"
];

const esDroga = sinonimosDrogas.includes(termino) ||
(sinonimosDrogas.some(x => x.includes(termino)) && termino.length >= 4);

if (esDroga && /^lops[c]?-/i.test(infraccion.id || "")) {
const apartadoNumero = String(infraccion.apartado || "");
if (apartadoNumero === "16") return 1000;
if (apartadoNumero === "17") return 700;
if (apartadoNumero === "18") return 700;
if (apartadoNumero === "19") return 700;
}

// Coincidencias fuertes.
if (codigo === termino || id === termino) return 1000;
if (codigo === `lopsc-${termino}`) return 1000;
if (`${articulo}.${apartado}` === termino) return 1000;

// Palabras clave: deben pesar mucho más que el texto libre.
if (palabras.includes(termino)) return 900;
if (palabras.some(p => p === termino || p.startsWith(termino) && termino.length >= 4)) return 800;

// Título y ley.
if (titulo === termino) return 750;
if (titulo.startsWith(termino)) return 700;
if (titulo.includes(termino)) return 600;

if (ley === termino) return 550;

// Conducta/texto libre: coincidencia débil.
if (conducta.includes(termino)) return 120;

return 0;
}

function actualizarBusqueda() {
const input = $("consultaSearch");
const texto = normalizarTexto(input ? input.value : "");
const gravedad = estado.gravedad;

if (!texto) {
estado.resultados = [];
renderizarResultados();
return;
}

const candidatos = [];

estado.infracciones.forEach((infraccion) => {
if (gravedad !== "all" && normalizarTexto(infraccion.gravedad) !== normalizarTexto(gravedad)) {
return;
}

const puntuacion = puntuacionBusqueda(infraccion, texto);
if (puntuacion > 0) {
candidatos.push({ infraccion, puntuacion });
}
});

candidatos.sort((a, b) => {
if (b.puntuacion !== a.puntuacion) return b.puntuacion - a.puntuacion;
return String(a.infraccion.codigo || "").localeCompare(
String(b.infraccion.codigo || ""),
"es",
{ numeric: true }
);
});

// No mostramos coincidencias débiles del texto completo como si fueran relevantes.
estado.resultados = candidatos
.filter(item => item.puntuacion >= 500)
.map(item => item.infraccion);

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
<h3>Buscar infracci�n</h3> 
<p> 
Introduce un c�digo, art�culo o 
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
<span class="result-code"> 
${escaparHTML( 
infraccion.codigo || "" 
)} 
</span> 

<h3> 
${escaparHTML( 
infraccion.titulo || 
"Sin t�tulo" 
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
"Infracci�n", 
` 
<div class="detail-content"> 

<p> 
<strong>Gravedad:</strong> 
${escaparHTML( 
infraccion.gravedad || "-" 
)} 
</p> 

<p> 
<strong>Art�culo:</strong> 
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
<h4>Sanci�n</h4> 
<p> 
${ 
sancion.min !== undefined 
? `M�nimo: ${formatearEuros( 
sancion.min 
)}<br>` 
: "" 
} 
${ 
sancion.max !== undefined 
? `M�ximo: ${formatearEuros( 
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

function cargarActas() { 
try { 
const guardadas = 
localStorage.getItem( 
CONFIG.STORAGE_ACTAS 
); 

estado.actas = 
guardadas 
? JSON.parse(guardadas) 
: []; 

if (!Array.isArray(estado.actas)) { 
estado.actas = []; 
} 

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
localStorage.setItem( 
CONFIG.STORAGE_ACTAS, 
JSON.stringify(estado.actas) 
); 
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

renderizarActas(); 
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

function guardarActaDesdeFormulario(evento) { 
evento.preventDefault(); 

const form = 
evento.currentTarget; 

const acta = { 
id: 
form.dataset.editingId || 
`acta-${Date.now()}`, 

numero: 
obtenerValor("actaNumero"), 

fecha: 
obtenerValor("actaFecha"), 

hora: 
obtenerValor("actaHora"), 

nombre: 
obtenerValor("actaNombre"), 

dni: 
obtenerValor("actaDni"), 

domicilio: 
obtenerValor("actaDomicilio"), 

lugar: 
obtenerValor("actaLugar"), 

hechos: 
obtenerValor("actaHechos"), 

infraccion: 
obtenerValor("actaInfraccion"), 

observaciones: 
obtenerValor("actaObservaciones"), 

actualizado: 
new Date().toISOString() 
}; 

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
Pulsa �Nueva� para comenzar un acta. 
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
"sin n�mero" 
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
"Sin infracci�n indicada" 
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

function borrarActa(id) { 
const confirmado = 
window.confirm( 
"�Quieres borrar esta acta?" 
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

const ordenanzas = 
extraerOrdenanzas( 
estado.ordenanzas 
); 

const tarjetas = [ 
{ 
tipo: "lopsc", 
titulo: "Ley Org�nica 4/2015", 
descripcion: 
"Protecci�n de la seguridad ciudadana", 
etiqueta: "LOPSC", 
icono: "??" 
}, 
...ordenanzas.map((ordenanza) => ({ 
tipo: "ordenanza", 
id: ordenanza.id, 
titulo: 
ordenanza.nombre || 
ordenanza.nombre_corto || 
"Ordenanza municipal", 
descripcion: 
ordenanza.descripcion || 
"", 
etiqueta: 
ordenanza.codigo || 
"Ordenanza", 
icono: "??", 
url: 
ordenanza.fuente && ordenanza.fuente.url 
? ordenanza.fuente.url 
: "" 
})) 
]; 

const filtradas = 
texto 
? tarjetas.filter((tarjeta) => 
normalizarTexto( 
[ 
tarjeta.titulo, 
tarjeta.descripcion, 
tarjeta.etiqueta 
].join(" ") 
).includes(texto) 
) 
: tarjetas; 

lista.innerHTML = 
filtradas 
.map((tarjeta) => ` 
<div class="normativa-card"> 

<div class="normativa-icon"> 
${tarjeta.icono} 
</div> 

<div class="normativa-info"> 

<h3> 
${escaparHTML( 
tarjeta.titulo 
)} 
</h3> 

<p> 
${escaparHTML( 
tarjeta.descripcion 
)} 
</p> 

<span> 
${escaparHTML( 
tarjeta.etiqueta 
)} 
</span> 

</div> 

${tarjeta.tipo === "ordenanza" && tarjeta.url ? ` 
<a 
class="normativa-open" 
href="${escaparHTML(tarjeta.url)}" 
target="_blank" 
rel="noopener noreferrer" 
aria-label="Acceso directo a la ordenanza oficial" 
> 
? Acceso directo 
</a> 
` : tarjeta.tipo === "ordenanza" ? ` 
<span 
class="normativa-open" 
aria-label="Esta ordenanza no tiene enlace oficial configurado" 
> 
Sin enlace 
</span> 
` : ` 
<button 
type="button" 
class="normativa-open" 
data-law="${escaparHTML(tarjeta.tipo)}" 
data-id="${escaparHTML(tarjeta.id || "")}" 
> 
Ver 
</button> 
`} 

</div> 
`) 
.join(""); 

if (!filtradas.length) { 
lista.innerHTML = ` 
<div class="empty-state"> 
<div class="empty-icon">?</div> 
<h3>Sin resultados</h3> 
<p> 
No se ha encontrado normativa 
con esa b�squeda. 
</p> 
</div> 
`; 
} 
} 

function abrirNormativa(tipo, id = "") { 
if (tipo === "lopsc") { 
abrirLOPSC(); 
return; 
} 

if (tipo === "ordenanza") { 
abrirOrdenanza(id); 
} 
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
"Ley Org�nica 4/2015"; 

$("viewerSubtitle").textContent = 
"Protecci�n de la seguridad ciudadana"; 

if (!articulos.length) { 
contenido.innerHTML = ` 
<div class="empty-state"> 
<h3>LOPSC no disponible</h3> 
<p> 
No se han podido cargar los art�culos. 
</p> 
</div> 
`; 
} else { 
contenido.innerHTML = 
articulos 
.map((articulo) => ` 
<article class="law-article"> 

<h4> 
Art�culo ${ 
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
.join(""); 
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

${ 
fuente.url 
? ` 
<p> 
<a 
href="${escaparHTML( 
fuente.url 
)}" 
target="_blank" 
rel="noopener noreferrer" 
> 
Consultar fuente oficial 
</a> 
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
"�Quieres borrar todas las actas guardadas?" 
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
EVENTOS DIN�MICOS 
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
"Conexi�n recuperada." 
); 
} 
); 

window.addEventListener( 
"offline", 
() => { 
actualizarRed(); 
mostrarToast( 
"Sin conexi�n. Se utilizar�n los datos locales." 
); 
} 
); 

actualizarRed(); 
} 

/* ========================================================= 
INICIALIZACI�N 
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
configurarEventosGlobales();
configurarRed();
cargarActas();
await cargarDatos();
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

