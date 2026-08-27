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
const respuesta = await fetch(ruta, {
cache: "no-store"
});

if (!respuesta.ok) {
throw new Error(
`No se pudo cargar ${ruta} (${respuesta.status})`
);
}

return await respuesta.json();
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

function extraerOrdenanzas(datos) {
if (Array.isArray(datos)) {
return datos;
}

if (datos && Array.isArray(datos.ordenanzas)) {
return datos.ordenanzas;
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
? `${extraerArticulos(estado.lopsc).length} artículos`
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
<div class="empty-icon">🔎</div>
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
<div class="empty-icon">⚠️</div>
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
<div class="empty-icon">📝</div>
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
titulo: "Ley Orgánica 4/2015",
descripcion:
"Protección de la seguridad ciudadana",
etiqueta: "LOPSC",
icono: "⚖️"
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
icono: "🏛️",
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
🔗 Acceso directo
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
<div class="empty-icon">🔎</div>
<h3>Sin resultados</h3>
<p>
No se ha encontrado normativa
con esa búsqueda.
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
contenido.innerHTML =
articulos
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

async function iniciarAplicacion() {
try {
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

const version =
$("appVersion");

if (version) {
version.textContent =
CONFIG.VERSION;
}

await cargarDatos();

} catch (error) {
console.error(
"Error inicializando Centinela Code:",
error
);

mostrarToast(
"La aplicación se ha iniciado con un error. Revisa la consola."
);
} finally {
actualizarEstadoDatos();
actualizarRed();

setTimeout(() => {
mostrarCarga(false);
}, 250);
}
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

/* =========================================================
FIN app.js CENTINELA CODE
========================================================= */
