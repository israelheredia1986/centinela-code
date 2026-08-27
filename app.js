/* ============================================================
CENTINELA CODE
APP.JS — MOTOR PRINCIPAL DEFINITIVO
============================================================ */

"use strict";

/* ============================================================
CONFIGURACIÓN
============================================================ */

const CONFIG = {
APP_NAME: "Centinela Code",
VERSION: "1.0.0",

DATA: {
LOPSC: "./data/lopsc.json",
INFRACCIONES: "./data/infracciones.json",
ORDENANZAS: "./data/ordenanzas.json"
},

STORAGE: {
ACTAS: "centinela-code-actas",
AGENTE: "centinela-code-agente",
CONFIG: "centinela-code-config"
}
};

/* ============================================================
ESTADO GLOBAL
============================================================ */

const estado = {

infracciones: [],
normativa: [],
ordenanzas: [],

resultados: [],

actas: [],

filtros: {
texto: "",
gravedad: "todas",
articulo: "todos"
},

infraccionSeleccionada: null,

actaActual: null,

modo: "consulta",

cargado: false,

erroresDatos: []
};

/* ============================================================
INICIO
============================================================ */

document.addEventListener(
"DOMContentLoaded",
iniciarCentinela
);

async function iniciarCentinela() {

console.log(
`${CONFIG.APP_NAME} ${CONFIG.VERSION}`
);

try {

const autenticado =
await iniciarAutenticacion();

if (!autenticado) {
return;
}

cargarActas();

cargarConfiguracion();

registrarEventos();

actualizarRed();

await cargarDatos();

inicializarInterfaz();

ocultarPantallaCarga();

} catch (error) {

console.error(
"Error iniciando Centinela Code:",
error
);

ocultarPantallaCarga();

mostrarError(
"No se pudo iniciar la aplicación. " +
"Comprueba la conexión y vuelve a intentarlo."
);
}
}

/* ============================================================
CARGA GENERAL DE DATOS
============================================================ */

async function cargarDatos() {

estado.erroresDatos = [];

const resultados = await Promise.allSettled([

cargarJSON(CONFIG.DATA.INFRACCIONES),

cargarJSON(CONFIG.DATA.LOPSC),

cargarJSON(CONFIG.DATA.ORDENANZAS)

]);


/* --------------------------------------------------------
INFRACCIONES
-------------------------------------------------------- */

if (
resultados[0].status === "fulfilled"
) {

estado.infracciones =
normalizarInfracciones(
resultados[0].value
);

} else {

estado.infracciones = [];

estado.erroresDatos.push(
CONFIG.DATA.INFRACCIONES
);

console.error(
"No se pudo cargar infracciones:",
resultados[0].reason
);
}


/* --------------------------------------------------------
LOPSC
-------------------------------------------------------- */

if (
resultados[1].status === "fulfilled"
) {

estado.normativa =
normalizarNormativa(
resultados[1].value
);

} else {

estado.normativa = [];

estado.erroresDatos.push(
CONFIG.DATA.LOPSC
);

console.error(
"No se pudo cargar LOPSC:",
resultados[1].reason
);
}


/* --------------------------------------------------------
ORDENANZAS
-------------------------------------------------------- */

if (
resultados[2].status === "fulfilled"
) {

estado.ordenanzas =
normalizarOrdenanzas(
resultados[2].value
);

} else {

estado.ordenanzas = [];

estado.erroresDatos.push(
CONFIG.DATA.ORDENANZAS
);

console.error(
"No se pudo cargar ordenanzas:",
resultados[2].reason
);
}


estado.cargado = true;


console.log(
"CENTINELA CODE — DATOS",
{
infracciones:
estado.infracciones.length,

normativa:
estado.normativa.length,

ordenanzas:
estado.ordenanzas.length,

errores:
estado.erroresDatos
}
);
}

/* ============================================================
FETCH JSON
============================================================ */

async function cargarJSON(ruta) {

const respuesta = await fetch(
ruta,
{
cache: "no-cache"
}
);


if (!respuesta.ok) {

throw new Error(
`HTTP ${respuesta.status}: ${ruta}`
);
}


return await respuesta.json();
}

/* ============================================================
NORMALIZACIÓN DE INFRACCIONES
============================================================ */

function normalizarInfracciones(datos) {

let lista = datos;


if (
datos &&
Array.isArray(datos.infracciones)
) {

lista =
datos.infracciones;
}


if (!Array.isArray(lista)) {

return [];
}


return lista.map(
(item, index) => {

const articulo =
String(
item.articulo ??
""
);


const apartado =
String(
item.apartado ??
""
);


return {

id:
item.id ||
`INF-${index + 1}`,

ley:
item.ley ||
"LO 4/2015",

articulo,

apartado,

codigo:
item.codigo ||
crearCodigo(
articulo,
apartado
),

gravedad:
normalizarGravedad(
item.gravedad
),

titulo:
item.titulo ||
item.nombre ||
"Infracción",

conducta:
item.conducta ||
item.descripcion ||
"",

sancion:
normalizarSancion(
item.sancion
),

palabrasClave:
normalizarArray(
item.palabrasClave ||
item.keywords ||
[]
),

medidas:
normalizarArray(
item.medidas ||
[]
),

observaciones:
item.observaciones ||
"",

responsables:
normalizarArray(
item.responsables ||
[]
),

fuente:
item.fuente ||
"BOE",

url:
item.url ||
""
};
}
);
}

/* ============================================================
NORMALIZACIÓN LOPSC
============================================================ */

function normalizarNormativa(datos) {

if (
datos &&
Array.isArray(datos.articulos)
) {

return datos.articulos;
}


if (
datos &&
Array.isArray(datos.normativa)
) {

return datos.normativa;
}


if (
datos &&
Array.isArray(datos.capitulos)
) {

return convertirCapitulosANormativa(
datos.capitulos
);
}


if (Array.isArray(datos)) {

return datos;
}


return [];
}

/* ============================================================
CONVERSIÓN DE CAPÍTULOS
============================================================ */

function convertirCapitulosANormativa(
capitulos
) {

const resultado = [];


capitulos.forEach(
capitulo => {

const articulos =
Array.isArray(
capitulo.articulos
)
? capitulo.articulos
: [];


articulos.forEach(
articulo => {

resultado.push({

...articulo,

capitulo:
articulo.capitulo ||
capitulo.titulo ||
capitulo.nombre ||
"",

capituloNumero:
articulo.capituloNumero ||
capitulo.numero ||
""

});
}
);
}
);


return resultado;
}

/* ============================================================
NORMALIZACIÓN ORDENANZAS
============================================================ */

function normalizarOrdenanzas(
datos
) {

if (
datos &&
Array.isArray(datos.ordenanzas)
) {

return datos.ordenanzas;
}


if (
datos &&
Array.isArray(datos.articulos)
) {

return datos.articulos;
}


if (Array.isArray(datos)) {

return datos;
}


return [];
}

/* ============================================================
UTILIDADES DE DATOS
============================================================ */

function normalizarArray(valor) {

if (Array.isArray(valor)) {

return valor;
}


if (
typeof valor === "string" &&
valor.trim()
) {

return valor
.split(",")
.map(
item =>
item.trim()
)
.filter(Boolean);
}


return [];
}

function normalizarGravedad(
valor
) {

if (!valor) {

return "";
}


const texto =
String(valor)
.trim()
.toLowerCase();


if (
texto === "leve" ||
texto === "leves"
) {

return "Leve";
}


if (
texto === "grave" ||
texto === "graves"
) {

return "Grave";
}


if (
texto.includes("muy") &&
texto.includes("grave")
) {

return "Muy Grave";
}


return String(valor);
}

function normalizarSancion(
sancion
) {

if (!sancion) {

return {

min: null,
max: null,
moneda: "EUR",
tramoMin: null,
tramoMedio: null,
tramoMax: null
};
}


return {

min:
convertirNumero(
sancion.min
),

max:
convertirNumero(
sancion.max
),

moneda:
sancion.moneda ||
"EUR",

tramoMin:
convertirNumero(
sancion.tramoMin
),

tramoMedio:
convertirNumero(
sancion.tramoMedio
),

tramoMax:
convertirNumero(
sancion.tramoMax
)
};
}

function convertirNumero(
valor
) {

if (
valor === null ||
valor === undefined ||
valor === ""
) {

return null;
}


const numero =
Number(valor);


return Number.isFinite(numero)
? numero
: null;
}

function crearCodigo(
articulo,
apartado
) {

if (!articulo) {

return "";
}


if (
apartado !== undefined &&
apartado !== null &&
apartado !== ""
) {

return `${articulo}.${apartado}`;
}


return String(articulo);
}


/* ============================================================
AUTENTICACIÓN SUPABASE
============================================================ */

const SUPABASE_CONFIG = {
URL: "https://okuygqbaliaeavhyezri.supabase.co",
PUBLISHABLE_KEY:
"sb_publishable_fbEAcJZxMv8PD3VB3Bcx6A_l_8BdP2m"
};

let clienteSupabase = null;
let usuarioActual = null;
let autenticacionInicializada = false;

/* ------------------------------------------------------------
CARGAR LIBRERÍA SUPABASE
------------------------------------------------------------ */

function cargarLibreriaSupabase() {

return new Promise(
(resolve, reject) => {

if (
window.supabase &&
typeof window.supabase.createClient ===
"function"
) {
resolve();
return;
}

const existente =
document.querySelector(
'script[data-centinela-supabase="true"]'
);

if (existente) {

existente.addEventListener(
"load",
() => resolve(),
{ once: true }
);

existente.addEventListener(
"error",
() => reject(
new Error(
"No se pudo cargar Supabase."
)
),
{ once: true }
);

return;
}

const script =
document.createElement("script");

script.src =
"https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

script.async = true;

script.dataset.centinelaSupabase =
"true";

script.onload =
() => {

if (
window.supabase &&
typeof window.supabase.createClient ===
"function"
) {
resolve();
} else {
reject(
new Error(
"La librería Supabase se cargó pero no está disponible."
)
);
}
};

script.onerror =
() => reject(
new Error(
"No se pudo cargar la librería Supabase."
)
);

document.head.appendChild(
script
);
}
);
}

/* ------------------------------------------------------------
PANTALLA DE LOGIN
------------------------------------------------------------ */

function crearPantallaLogin() {

let pantalla =
document.getElementById(
"centinelaLogin"
);

if (pantalla) {
return pantalla;
}

pantalla =
document.createElement("div");

pantalla.id =
"centinelaLogin";

pantalla.innerHTML = `
<div class="centinela-login-backdrop"></div>

<div class="centinela-login-card">

<div class="centinela-login-logo">
<img
src="logo-centinela.png"
alt="Centinela Code"
>
</div>

<div class="centinela-login-title">
Centinela Code
</div>

<div class="centinela-login-subtitle">
Acceso profesional
</div>

<form id="centinelaLoginForm">

<label class="centinela-login-label">
Usuario / correo electrónico

<input
id="centinelaLoginEmail"
type="email"
autocomplete="username"
required
placeholder="usuario@correo.es"
>
</label>

<label class="centinela-login-label">
Contraseña

<input
id="centinelaLoginPassword"
type="password"
autocomplete="current-password"
required
placeholder="Contraseña"
>
</label>

<button
id="centinelaLoginButton"
type="submit"
class="centinela-login-button"
>
Entrar
</button>

<div
id="centinelaLoginMessage"
class="centinela-login-message"
role="alert"
></div>

</form>

</div>
`;

document.body.appendChild(
pantalla
);

const style =
document.createElement("style");

style.textContent = `
#centinelaLogin {
position: fixed;
inset: 0;
z-index: 999999;
display: flex;
align-items: center;
justify-content: center;
padding: 22px;
box-sizing: border-box;
font-family: inherit;
}

.centinela-login-backdrop {
position: absolute;
inset: 0;
background:
radial-gradient(
circle at 50% 10%,
rgba(37, 116, 205, .20),
transparent 42%
),
rgba(2, 8, 23, .97);
backdrop-filter: blur(10px);
}

.centinela-login-card {
position: relative;
width: min(420px, 100%);
box-sizing: border-box;
padding: 30px 24px 25px;
border: 1px solid rgba(91, 158, 225, .35);
border-radius: 25px;
background:
linear-gradient(
145deg,
rgba(14, 32, 57, .98),
rgba(3, 13, 28, .98)
);
box-shadow:
0 30px 80px rgba(0,0,0,.62),
inset 0 1px 0 rgba(255,255,255,.06);
}

.centinela-login-logo {
width: 86px;
height: 86px;
margin: 0 auto 18px;
overflow: hidden;
border-radius: 23px;
box-shadow:
0 0 30px rgba(42, 132, 235, .18);
}

.centinela-login-logo img {
width: 100%;
height: 100%;
object-fit: cover;
display: block;
}

.centinela-login-title {
text-align: center;
color: #f8fbff;
font-size: 25px;
font-weight: 800;
letter-spacing: .2px;
}

.centinela-login-subtitle {
margin: 5px 0 24px;
text-align: center;
color: #8fa8c5;
font-size: 13px;
}

.centinela-login-label {
display: block;
margin: 0 0 16px;
color: #cddbf0;
font-size: 12px;
font-weight: 700;
}

.centinela-login-label input {
display: block;
width: 100%;
box-sizing: border-box;
margin-top: 7px;
padding: 14px 15px;
border: 1px solid #29435f;
border-radius: 13px;
outline: none;
background: #071426;
color: #f8fbff;
font: inherit;
}

.centinela-login-label input:focus {
border-color: #4d9ce8;
box-shadow: 0 0 0 3px rgba(77,156,232,.12);
}

.centinela-login-button {
width: 100%;
margin-top: 5px;
padding: 14px;
border: 1px solid rgba(111,183,255,.35);
border-radius: 13px;
background:
linear-gradient(
135deg,
#1267b4,
#174b82
);
color: white;
font: inherit;
font-weight: 800;
cursor: pointer;
box-shadow:
0 12px 25px rgba(10,91,170,.28);
}

.centinela-login-button:disabled {
opacity: .65;
cursor: wait;
}

.centinela-login-message {
min-height: 20px;
margin-top: 13px;
text-align: center;
color: #ffb4b4;
font-size: 12px;
line-height: 1.45;
}
`;

document.head.appendChild(
style
);

return pantalla;
}

/* ------------------------------------------------------------
AUTENTICACIÓN
------------------------------------------------------------ */

async function iniciarAutenticacion() {

const loading =
document.getElementById(
"loadingScreen"
);

try {

await cargarLibreriaSupabase();

clienteSupabase =
window.supabase.createClient(
SUPABASE_CONFIG.URL,
SUPABASE_CONFIG.PUBLISHABLE_KEY
);

autenticacionInicializada =
true;

const resultadoSesion =
await clienteSupabase.auth.getSession();

if (
resultadoSesion.error
) {
throw resultadoSesion.error;
}

if (
resultadoSesion.data &&
resultadoSesion.data.session
) {

usuarioActual =
resultadoSesion.data.session.user;

ocultarPantallaLogin();

return true;
}

if (loading) {
loading.style.display = "none";
}

const login =
crearPantallaLogin();

login.style.display =
"flex";

configurarFormularioLogin();

return false;

} catch (error) {

console.error(
"Error de autenticación:",
error
);

if (loading) {
loading.style.display = "none";
}

const login =
crearPantallaLogin();

login.style.display =
"flex";

configurarFormularioLogin();

mostrarMensajeLogin(
"No se pudo conectar con el sistema de acceso. " +
"Comprueba la conexión a Internet."
);

return false;
}
}

function configurarFormularioLogin() {

if (
document.body.dataset.centinelaLoginConfigured ===
"true"
) {
return;
}

const form =
document.getElementById(
"centinelaLoginForm"
);

if (!form) {
return;
}

document.body.dataset.centinelaLoginConfigured =
"true";

form.addEventListener(
"submit",
async evento => {

evento.preventDefault();

const email =
document.getElementById(
"centinelaLoginEmail"
)
?.value
.trim();

const password =
document.getElementById(
"centinelaLoginPassword"
)
?.value;

const button =
document.getElementById(
"centinelaLoginButton"
);

if (!email || !password) {
mostrarMensajeLogin(
"Introduce usuario y contraseña."
);
return;
}

if (button) {
button.disabled = true;
button.textContent =
"Comprobando...";
}

mostrarMensajeLogin("");

try {

const resultado =
await clienteSupabase.auth.signInWithPassword({
email,
password
});

if (
resultado.error
) {
throw resultado.error;
}

usuarioActual =
resultado.data.user;

ocultarPantallaLogin();

if (loadingScreenVisible()) {
ocultarPantallaCarga();
}

await iniciarAplicacionTrasLogin();

} catch (error) {

console.error(
"Error de login:",
error
);

mostrarMensajeLogin(
"Usuario o contraseña incorrectos."
);

if (button) {
button.disabled = false;
button.textContent =
"Entrar";
}
}
}
);
}

async function iniciarAplicacionTrasLogin() {

try {

cargarActas();

cargarConfiguracion();

registrarEventos();

actualizarRed();

await cargarDatos();

inicializarInterfaz();

ocultarPantallaCarga();

} catch (error) {

console.error(
"Error después del login:",
error
);

ocultarPantallaCarga();

mostrarError(
"Has iniciado sesión, pero no se han podido cargar " +
"todos los datos de la aplicación."
);
}
}

function mostrarMensajeLogin(
mensaje
) {

const elemento =
document.getElementById(
"centinelaLoginMessage"
);

if (elemento) {
elemento.textContent =
mensaje || "";
}
}

function ocultarPantallaLogin() {

const pantalla =
document.getElementById(
"centinelaLogin"
);

if (pantalla) {
pantalla.style.display =
"none";
}
}

function loadingScreenVisible() {

const loading =
document.getElementById(
"loadingScreen"
);

return !!(
loading &&
loading.style.display !==
"none"
);
}

function ocultarPantallaCarga() {

const loading =
document.getElementById(
"loadingScreen"
);

if (!loading) {
return;
}

loading.style.opacity =
"0";

loading.style.pointerEvents =
"none";

setTimeout(
() => {
loading.style.display =
"none";
},
220
);
}

/* ------------------------------------------------------------
SESIÓN
------------------------------------------------------------ */

async function cerrarSesionCentinela() {

if (
!clienteSupabase
) {
return;
}

const resultado =
await clienteSupabase.auth.signOut();

if (
resultado.error
) {
console.error(
"Error cerrando sesión:",
resultado.error
);
return;
}

usuarioActual =
null;

location.reload();
}

window.cerrarSesionCentinela =
cerrarSesionCentinela;


/* ============================================================
INTERFAZ
============================================================ */

function inicializarInterfaz() {

configurarFiltros();

buscarInfracciones();

actualizarEstadisticas();

actualizarEstadoDatos();

actualizarRed();

actualizarVersion();

configurarNormativa();
}

/* ============================================================
VERSIÓN
============================================================ */

function actualizarVersion() {

const elemento =
document.getElementById(
"app-version"
);


if (elemento) {

elemento.textContent =
CONFIG.VERSION;
}
}

/* ============================================================
FILTROS
============================================================ */

function configurarFiltros() {

const selector =
document.getElementById(
"main-articulo"
);


if (!selector) {

return;
}


const articulos =
[
...new Set(

estado.infracciones
.map(
item =>
item.articulo
)
.filter(Boolean)

)
];


articulos.sort(
(a, b) => {

const numeroA =
parseFloat(a);

const numeroB =
parseFloat(b);


if (
Number.isFinite(numeroA) &&
Number.isFinite(numeroB)
) {

return numeroA - numeroB;
}


return String(a)
.localeCompare(
String(b),
"es"
);
}
);


selector.innerHTML = `

<option value="todos">
Todos los artículos
</option>

`;


articulos.forEach(
articulo => {

const option =
document.createElement(
"option"
);


option.value =
articulo;


option.textContent =
`Artículo ${articulo}`;


selector.appendChild(
option
);
}
);
}

/* ============================================================
BÚSQUEDA
============================================================ */

function buscarInfracciones() {

const texto =
normalizarTexto(
estado.filtros.texto
);


const gravedad =
estado.filtros.gravedad;


const articulo =
estado.filtros.articulo;


estado.resultados =
estado.infracciones.filter(
infraccion => {

if (
gravedad &&
gravedad !== "todas" &&
infraccion.gravedad !==
gravedad
) {

return false;
}


if (
articulo &&
articulo !== "todos" &&
String(
infraccion.articulo
) !==
String(articulo)
) {

return false;
}


if (!texto) {

return true;
}


const contenido =
[

infraccion.id,

infraccion.codigo,

infraccion.ley,

infraccion.articulo,

infraccion.apartado,

infraccion.titulo,

infraccion.conducta,

infraccion.gravedad,

...infraccion
.palabrasClave,

...infraccion
.medidas,

...infraccion
.responsables

]
.join(" ");


return normalizarTexto(
contenido
).includes(
texto
);
}
);


if (texto) {

estado.resultados.sort(
(a, b) => {

const codigoA =
normalizarTexto(
a.codigo
);


const codigoB =
normalizarTexto(
b.codigo
);


if (
codigoA === texto
) {

return -1;
}


if (
codigoB === texto
) {

return 1;
}


const tituloA =
normalizarTexto(
a.titulo
);


const tituloB =
normalizarTexto(
b.titulo
);


if (
tituloA.startsWith(
texto
)
) {

return -1;
}


if (
tituloB.startsWith(
texto
)
) {

return 1;
}


return 0;
}
);
}


renderizarResultados();

actualizarContador();
}

/* ============================================================
NORMALIZACIÓN TEXTO
============================================================ */

function normalizarTexto(
texto
) {

return String(
texto || ""
)
.toLowerCase()
.normalize("NFD")
.replace(
/[\u0300-\u036f]/g,
""
)
.trim();
}

/* ============================================================
RENDER RESULTADOS
============================================================ */

function renderizarResultados() {

const contenedor =
document.getElementById(
"search-results"
);


if (!contenedor) {

return;
}


if (!estado.resultados.length) {

contenedor.innerHTML = `

<div class="sin-resultados">

<strong>
No se han encontrado resultados
</strong>

<p>
Prueba con otro código,
artículo o palabra clave.
</p>

</div>

`;

return;
}


contenedor.innerHTML =
estado.resultados
.map(
crearTarjetaInfraccion
)
.join("");
}

/* ============================================================
TARJETA INFRACCIÓN
============================================================ */

function crearTarjetaInfraccion(
infraccion
) {

const gravedadClass =
claseGravedad(
infraccion.gravedad
);


return `

<article
class="infraccion-card"
data-id="${escapeHTML(
infraccion.id
)}"
>

<div class="infraccion-top">

<span class="infraccion-codigo">
${escapeHTML(
infraccion.codigo
)}
</span>

<span
class="gravedad ${gravedadClass}"
>
${escapeHTML(
infraccion.gravedad
)}
</span>

</div>


<h3>
${escapeHTML(
infraccion.titulo
)}
</h3>


<div class="articulo">

Artículo
${escapeHTML(
infraccion.articulo
)}

${
infraccion.apartado
? ` · apartado ${escapeHTML(
infraccion.apartado
)}`
: ""
}

</div>


<p>
${escapeHTML(
infraccion.conducta
)}
</p>


${renderizarSancion(
infraccion.sancion
)}


<div class="acciones-infraccion">

<button
type="button"
onclick="verInfraccion('${escapeJS(
infraccion.id
)}')"
>
VER DETALLE
</button>


<button
type="button"
onclick="iniciarActaDesdeInfraccion('${escapeJS(
infraccion.id
)}')"
>
CREAR ACTA
</button>

</div>

</article>

`;
}

/* ============================================================
SANCIÓN
============================================================ */

function renderizarSancion(
sancion
) {

if (!sancion) {

return "";
}


const min =
formatearEuros(
sancion.min
);


const max =
formatearEuros(
sancion.max
);


if (
min === "-" &&
max === "-"
) {

return "";
}


return `

<div class="sancion">

<strong>
Sanción:
</strong>

${min}

${
max !== "-"
? ` — ${max}`
: ""
}

</div>

`;
}

/* ============================================================
DETALLE INFRACCIÓN
============================================================ */

function verInfraccion(
id
) {

const infraccion =
estado.infracciones.find(
item =>
String(item.id) ===
String(id)
);


if (!infraccion) {

return;
}


estado.infraccionSeleccionada =
infraccion;


const contenedor =
document.getElementById(
"search-results"
);


if (!contenedor) {

return;
}


contenedor.innerHTML = `

<div class="detalle-infraccion">

<button
type="button"
onclick="buscarInfracciones()"
>
← Volver a resultados
</button>


<div class="infraccion-top">

<span class="infraccion-codigo">

${escapeHTML(
infraccion.codigo
)}

</span>


<span
class="gravedad ${claseGravedad(
infraccion.gravedad
)}"
>

${escapeHTML(
infraccion.gravedad
)}

</span>

</div>


<h2>
${escapeHTML(
infraccion.titulo
)}
</h2>


<p>

<strong>
Artículo:
</strong>

${escapeHTML(
infraccion.articulo
)}

${
infraccion.apartado
? `.${escapeHTML(
infraccion.apartado
)}`
: ""
}

</p>


<h3>
Conducta
</h3>

<p>
${escapeHTML(
infraccion.conducta
)}
</p>


<h3>
Sanción
</h3>

${renderizarSancion(
infraccion.sancion
)}


${
infraccion.palabrasClave.length
? `

<h3>
Palabras clave
</h3>

<div>

${infraccion
.palabrasClave
.map(
palabra =>
`<span class="tag">
${escapeHTML(
palabra
)}
</span>`
)
.join("")}

</div>

`
: ""
}


${
infraccion.medidas.length
? `

<h3>
Medidas asociadas
</h3>

<div>

${infraccion
.medidas
.map(
medida =>
`<span class="tag">
${escapeHTML(
medida
)}
</span>`
)
.join("")}

</div>

`
: ""
}


${
infraccion.observaciones
? `

<h3>
Observaciones
</h3>

<p>
${escapeHTML(
infraccion.observaciones
)}
</p>

`
: ""
}


${
infraccion.fuente
? `

<p class="fuente">

<strong>
Fuente:
</strong>

${escapeHTML(
infraccion.fuente
)}

</p>

`
: ""
}


<hr>


<button
type="button"
onclick="iniciarActaDesdeInfraccion('${escapeJS(
infraccion.id
)}')"
>
CREAR ACTA CON ESTA INFRACCIÓN
</button>

</div>

`;
}

/* ============================================================
NORMATIVA
============================================================ */

function configurarNormativa() {

const boton =
document.getElementById(
"open-lopsc"
);


if (boton) {

boton.onclick =
mostrarLOPSC;
}


const botonInfracciones =
document.getElementById(
"open-infracciones"
);


if (botonInfracciones) {

botonInfracciones.onclick =
() => {

mostrarSeccionInterna(
"consulta"
);
};
}
}

function mostrarLOPSC() {

mostrarSeccionInterna(
"normativa"
);


const viewer =
document.getElementById(
"normativa-viewer"
);


if (!viewer) {

return;
}


viewer.classList.remove(
"hidden"
);


if (!estado.normativa.length) {

viewer.innerHTML = `

<div class="empty-state">

<strong>
LOPSC no cargada
</strong>

<p>
Comprueba que exista:
data/lopsc.json
</p>

</div>

`;

return;
}


viewer.innerHTML = `

<div class="viewer-header">

<div>

<span class="section-kicker">
LEGISLACIÓN
</span>

<h3>
Ley Orgánica 4/2015
</h3>

<small>
Protección de la Seguridad Ciudadana
</small>

</div>

<button
type="button"
onclick="
document
.getElementById(
'normativa-viewer'
)
.classList
.add('hidden')
"
>
Cerrar
</button>

</div>


<div class="normativa-search">

<input
type="search"
id="normativa-search-input"
placeholder="Buscar artículo o texto..."
autocomplete="off"
>

</div>


<div
id="normativa-articulos"
class="normativa-articulos"
></div>

`;


renderizarNormativa(
estado.normativa
);


const buscador =
document.getElementById(
"normativa-search-input"
);


buscador?.addEventListener(
"input",
evento => {

const texto =
normalizarTexto(
evento.target.value
);


if (!texto) {

renderizarNormativa(
estado.normativa
);

return;
}


const filtrados =
estado.normativa.filter(
articulo => {

return normalizarTexto(
JSON.stringify(
articulo
)
).includes(
texto
);
}
);


renderizarNormativa(
filtrados
);
}
);
}

function renderizarNormativa(
articulos
) {

const contenedor =
document.getElementById(
"normativa-articulos"
);


if (!contenedor) {

return;
}


if (!articulos.length) {

contenedor.innerHTML = `

<div class="empty-state">

<strong>
No se encontraron artículos
</strong>

</div>

`;

return;
}


contenedor.innerHTML =
articulos
.map(
crearArticuloNormativo
)
.join("");
}

function crearArticuloNormativo(
articulo
) {

const numero =
articulo.numero ||
articulo.articulo ||
articulo.id ||
"";


const titulo =
articulo.titulo ||
articulo.nombre ||
"";


const texto =
articulo.texto ||
articulo.contenido ||
articulo.descripcion ||
"";


return `

<article class="normativa-articulo">

<div class="normativa-articulo-header">

<strong>
Artículo ${escapeHTML(
numero
)}
</strong>

${
titulo
? `<span>
${escapeHTML(
titulo
)}
</span>`
: ""
}

</div>


<div class="normativa-texto">

${formatearTextoLegal(
texto
)}

</div>

</article>

`;
}

function formatearTextoLegal(
texto
) {

return escapeHTML(
texto
)
.replace(
/\n/g,
"<br>"
);
}

/* ============================================================
ACTAS
============================================================ */

function iniciarActaDesdeInfraccion(
id
) {

const infraccion =
estado.infracciones.find(
item =>
String(item.id) ===
String(id)
);


if (!infraccion) {

return;
}


estado.infraccionSeleccionada =
infraccion;


estado.modo =
"acta";


estado.actaActual = {

id:
generarIdActa(),

fechaCreacion:
new Date().toISOString(),

estado:
"borrador",

infraccion: {

id:
infraccion.id,

codigo:
infraccion.codigo,

ley:
infraccion.ley,

articulo:
infraccion.articulo,

apartado:
infraccion.apartado,

gravedad:
infraccion.gravedad,

titulo:
infraccion.titulo,

conducta:
infraccion.conducta,

sancion:
infraccion.sancion

},

agente: {

identificador: "",
nombre: "",
unidad: ""

},

denunciado: {

nombre: "",
documento: "",
domicilio: "",
observaciones: ""

},

hechos: "",

lugar: "",

fechaHora:
obtenerFechaHoraLocal(),

medidas: [],

observaciones: ""
};


mostrarFormularioActa();
}

function activarModoActa() {

estado.modo =
"acta";


estado.infraccionSeleccionada =
null;


estado.actaActual = {

id:
generarIdActa(),

fechaCreacion:
new Date().toISOString(),

estado:
"borrador",

infraccion:
null,

agente: {

identificador: "",
nombre: "",
unidad: ""

},

denunciado: {

nombre: "",
documento: "",
domicilio: "",
observaciones: ""

},

hechos: "",

lugar: "",

fechaHora:
obtenerFechaHoraLocal(),

medidas: [],

observaciones: ""
};


mostrarFormularioActa();
}

/* ============================================================
FORMULARIO ACTA
============================================================ */

function mostrarFormularioActa() {

mostrarSeccionInterna(
"actas"
);


const contenedor =
document.getElementById(
"drafts-container"
);


if (!contenedor) {

return;
}


const acta =
estado.actaActual;


if (!acta) {

return;
}


contenedor.innerHTML = `

<div class="acta-container">

<div class="acta-header">

<button
type="button"
onclick="mostrarMenuActas()"
>
← Volver
</button>

<h2>
Nueva acta
</h2>

</div>


${
acta.infraccion
? `

<div class="acta-infraccion">

<strong>
Infracción seleccionada
</strong>

<h3>
${escapeHTML(
acta.infraccion.codigo
)}
·
${escapeHTML(
acta.infraccion.titulo
)}
</h3>

<p>
Artículo
${escapeHTML(
acta.infraccion.articulo
)}
·
${escapeHTML(
acta.infraccion.gravedad
)}
</p>

</div>

`
: `

<div class="acta-aviso">

<strong>
Acta sin tipificar
</strong>

<p>
Puedes completar el acta
y seleccionar posteriormente
la infracción correspondiente.
</p>

</div>

`
}


<form
id="form-acta"
class="formulario-acta"
>

<h3>
Agente actuante
</h3>


<label>
Identificador profesional
</label>

<input
type="text"
name="agenteIdentificador"
autocomplete="off"
>


<label>
Nombre
</label>

<input
type="text"
name="agenteNombre"
autocomplete="off"
>


<label>
Unidad
</label>

<input
type="text"
name="agenteUnidad"
autocomplete="off"
>


<h3>
Denunciado
</h3>


<label>
Nombre y apellidos
</label>

<input
type="text"
name="denunciadoNombre"
autocomplete="off"
>


<label>
Documento
</label>

<input
type="text"
name="denunciadoDocumento"
autocomplete="off"
>


<label>
Domicilio
</label>

<input
type="text"
name="denunciadoDomicilio"
autocomplete="off"
>


<h3>
Lugar y momento
</h3>


<label>
Lugar de los hechos
</label>

<input
type="text"
name="lugar"
autocomplete="off"
>


<label>
Fecha y hora
</label>

<input
type="datetime-local"
name="fechaHora"
>


<h3>
Hechos
</h3>


<textarea
name="hechos"
rows="7"
placeholder="Describa objetivamente los hechos..."
></textarea>


<h3>
Medidas
</h3>


<div class="medidas">

${crearChecksMedidas()}

</div>


<h3>
Observaciones
</h3>


<textarea
name="observaciones"
rows="5"
></textarea>


<button
type="submit"
class="btn-principal"
>
GUARDAR BORRADOR
</button>

</form>

</div>

`;


rellenarFormularioActa();


const formulario =
document.getElementById(
"form-acta"
);


formulario?.addEventListener(
"submit",
guardarActaDesdeFormulario
);
}

/* ============================================================
MEDIDAS
============================================================ */

function crearChecksMedidas() {

const medidas = [

"Intervención de sustancias",

"Intervención de arma u objeto",

"Intervención de efectos",

"Retirada de objetos",

"Inmovilización de vehículo",

"Otra medida"

];


return medidas
.map(
medida => `

<label class="check-medida">

<input
type="checkbox"
name="medida"
value="${escapeHTML(
medida
)}"
>

<span>
${escapeHTML(
medida
)}
</span>

</label>

`
)
.join("");
}

/* ============================================================
RELLENAR ACTA
============================================================ */

function rellenarFormularioActa() {

const acta =
estado.actaActual;


const form =
document.getElementById(
"form-acta"
);


if (!acta || !form) {

return;
}


form.elements.agenteIdentificador.value =
acta.agente?.identificador ||
"";


form.elements.agenteNombre.value =
acta.agente?.nombre ||
"";


form.elements.agenteUnidad.value =
acta.agente?.unidad ||
"";


form.elements.denunciadoNombre.value =
acta.denunciado?.nombre ||
"";


form.elements.denunciadoDocumento.value =
acta.denunciado?.documento ||
"";


form.elements.denunciadoDomicilio.value =
acta.denunciado?.domicilio ||
"";


form.elements.lugar.value =
acta.lugar ||
"";


form.elements.fechaHora.value =
convertirAInputFecha(
acta.fechaHora
);


form.elements.hechos.value =
acta.hechos ||
"";


form.elements.observaciones.value =
acta.observaciones ||
"";


const medidas =
Array.isArray(
acta.medidas
)
? acta.medidas
: [];


form
.querySelectorAll(
'input[name="medida"]'
)
.forEach(
checkbox => {

checkbox.checked =
medidas.includes(
checkbox.value
);

}
);
}

/* ============================================================
GUARDAR ACTA
============================================================ */

function guardarActaDesdeFormulario(
evento
) {

evento.preventDefault();


const form =
evento.currentTarget;


const acta =
estado.actaActual;


if (!acta) {

return;
}


acta.agente = {

identificador:
form.elements
.agenteIdentificador
.value
.trim(),

nombre:
form.elements
.agenteNombre
.value
.trim(),

unidad:
form.elements
.agenteUnidad
.value
.trim()

};


acta.denunciado = {

nombre:
form.elements
.denunciadoNombre
.value
.trim(),

documento:
form.elements
.denunciadoDocumento
.value
.trim(),

domicilio:
form.elements
.denunciadoDomicilio
.value
.trim(),

observaciones:
""

};


acta.lugar =
form.elements
.lugar
.value
.trim();


acta.fechaHora =
form.elements
.fechaHora
.value;


acta.hechos =
form.elements
.hechos
.value
.trim();


acta.observaciones =
form.elements
.observaciones
.value
.trim();


acta.medidas =
Array.from(
form.querySelectorAll(
'input[name="medida"]:checked'
)
)
.map(
checkbox =>
checkbox.value
);


acta.estado =
"borrador";


const indice =
estado.actas.findIndex(
item =>
item.id ===
acta.id
);


if (indice >= 0) {

estado.actas[indice] =
acta;

} else {

estado.actas.push(
acta
);
}


guardarActas();

if (
usuarioActual &&
clienteSupabase
) {
guardarActaEnSupabase(
acta
);
}

mostrarNotificacion(
"Acta guardada correctamente."
);


mostrarMenuActas();
}

/* ============================================================
MENÚ ACTAS
============================================================ */

function mostrarMenuActas() {

estado.modo =
"consulta";


estado.actaActual =
null;


mostrarSeccionInterna(
"actas"
);


mostrarBorradores();
}

/* ============================================================
BORRADORES
============================================================ */

function mostrarBorradores() {

const container =
document.getElementById(
"drafts-container"
);


if (!container) {

return;
}


if (!estado.actas.length) {

container.innerHTML = `

<div class="empty-state">

<strong>
No hay borradores
</strong>

<p>
Las actas que guardes
aparecerán aquí.
</p>

</div>

`;

return;
}


container.innerHTML = `

<div>

${estado.actas
.slice()
.reverse()
.map(
crearTarjetaBorrador
)
.join("")}

</div>

`;
}

function crearTarjetaBorrador(
acta
) {

const codigo =
acta.infraccion?.codigo ||
"Sin tipificar";


const titulo =
acta.infraccion?.titulo ||
"Acta sin infracción";


return `

<div class="draft-card">

<strong>
${escapeHTML(
codigo
)}
</strong>

<span>
${escapeHTML(
titulo
)}
</span>

<small>
${escapeHTML(
acta.lugar ||
"Lugar no indicado"
)}
</small>


<div class="acciones-infraccion">

<button
type="button"
onclick="editarActa('${escapeJS(
acta.id
)}')"
>
EDITAR
</button>


<button
type="button"
onclick="eliminarActa('${escapeJS(
acta.id
)}')"
>
ELIMINAR
</button>

</div>

</div>

`;
}

/* ============================================================
EDITAR ACTA
============================================================ */

function editarActa(
id
) {

const acta =
estado.actas.find(
item =>
item.id === id
);


if (!acta) {

return;
}


estado.actaActual =
JSON.parse(
JSON.stringify(
acta
)
);


mostrarFormularioActa();
}

/* ============================================================
ELIMINAR ACTA
============================================================ */

function eliminarActa(
id
) {

const confirmar =
window.confirm(
"¿Eliminar este borrador?"
);


if (!confirmar) {

return;
}


estado.actas =
estado.actas.filter(
item =>
item.id !== id
);


guardarActas();

mostrarBorradores();
}


/* ============================================================
GUARDADO DE ACTAS EN SUPABASE
============================================================ */

async function guardarActaEnSupabase(
acta
) {

if (
!clienteSupabase ||
!usuarioActual ||
!acta
) {
return;
}

try {

const registro = {
usuario_id:
usuarioActual.id,

numero_acta:
acta.id || null,

fecha_acta:
acta.fechaHora
? String(
acta.fechaHora
).substring(
0,
10
)
: null,

hora_acta:
acta.fechaHora &&
String(
acta.fechaHora
).length >= 16
? String(
acta.fechaHora
).substring(
11,
16
)
: null,

agente:
acta.agente?.nombre ||
"",

municipio:
acta.agente?.unidad ||
"",

persona_identificada:
acta.denunciado?.nombre ||
"",

dni_nie:
acta.denunciado?.documento ||
"",

hecho:
acta.hechos ||
"",

lugar:
acta.lugar ||
"",

infraccion_codigo:
acta.infraccion?.codigo ||
"",

infraccion_articulo:
acta.infraccion?.articulo ||
"",

infraccion_descripcion:
acta.infraccion?.conducta ||
acta.infraccion?.titulo ||
"",

gravedad:
acta.infraccion?.gravedad ||
"",

observaciones:
acta.observaciones ||
"",

contenido_completo:
JSON.stringify(
acta
),

estado:
acta.estado ||
"borrador"
};

const resultado =
await clienteSupabase
.from("actas")
.insert(
registro
);

if (
resultado.error
) {
console.error(
"No se pudo guardar el acta en Supabase:",
resultado.error
);

mostrarError(
"El acta se guardó en este dispositivo, " +
"pero no se pudo sincronizar con la base de datos."
);

return;
}

console.log(
"Acta sincronizada con Supabase."
);

} catch (error) {

console.error(
"Error sincronizando acta:",
error
);
}
}

/* ============================================================
LOCAL STORAGE
============================================================ */

function cargarActas() {

try {

const datos =
localStorage.getItem(
CONFIG.STORAGE.ACTAS
);


estado.actas =
datos
? JSON.parse(
datos
)
: [];


if (
!Array.isArray(
estado.actas
)
) {

estado.actas = [];
}

} catch (error) {

console.error(
"Error leyendo actas:",
error
);

estado.actas = [];
}
}

function guardarActas() {

try {

localStorage.setItem(
CONFIG.STORAGE.ACTAS,
JSON.stringify(
estado.actas
)
);

} catch (error) {

console.error(
"Error guardando actas:",
error
);

mostrarError(
"No se pudo guardar el borrador."
);
}
}

/* ============================================================
CONFIGURACIÓN
============================================================ */

function cargarConfiguracion() {

try {

const datos =
localStorage.getItem(
CONFIG.STORAGE.CONFIG
);


if (!datos) {

return;
}


const configuracion =
JSON.parse(
datos
);


if (
configuracion &&
configuracion.agente
) {

localStorage.setItem(
CONFIG.STORAGE.AGENTE,
JSON.stringify(
configuracion.agente
)
);
}

} catch (error) {

console.warn(
"No hay configuración válida."
);
}
}

/* ============================================================
EVENTOS
============================================================ */

function registrarEventos() {

/*
* NAVEGACIÓN
*/

document
.querySelectorAll(
".nav-button"
)
.forEach(
boton => {

boton.addEventListener(
"click",
() => {

mostrarSeccionInterna(
boton.dataset.section
);

}
);

}
);


/*
* BUSCADOR
*/

const search =
document.getElementById(
"main-search"
);


search?.addEventListener(
"input",
evento => {

estado.filtros.texto =
evento.target.value;

buscarInfracciones();

}
);


/*
* GRAVEDAD
*/

document
.getElementById(
"main-gravedad"
)
?.addEventListener(
"change",
evento => {

estado.filtros.gravedad =
evento.target.value;

buscarInfracciones();

}
);


/*
* ARTÍCULO
*/

document
.getElementById(
"main-articulo"
)
?.addEventListener(
"change",
evento => {

estado.filtros.articulo =
evento.target.value;

buscarInfracciones();

}
);


/*
* LIMPIAR
*/

document
.getElementById(
"clear-search"
)
?.addEventListener(
"click",
() => {

const input =
document.getElementById(
"main-search"
);


if (input) {

input.value = "";
}


estado.filtros.texto =
"";


buscarInfracciones();

input?.focus();

}
);


/*
* NUEVA ACTA
*/

document
.getElementById(
"new-acta-button"
)
?.addEventListener(
"click",
activarModoActa
);


/*
* BORRADORES
*/

document
.getElementById(
"drafts-button"
)
?.addEventListener(
"click",
mostrarBorradores
);


/*
* ACCESO RÁPIDO CONSULTA
*/

document
.getElementById(
"quick-search"
)
?.addEventListener(
"click",
() => {

mostrarSeccionInterna(
"consulta"
);


setTimeout(
() => {

document
.getElementById(
"main-search"
)
?.focus();

},
100
);

}
);


/*
* ACCESO RÁPIDO ACTA
*/

document
.getElementById(
"quick-acta"
)
?.addEventListener(
"click",
activarModoActa
);


/*
* NORMATIVA
*/

document
.getElementById(
"open-lopsc"
)
?.addEventListener(
"click",
mostrarLOPSC
);


document
.getElementById(
"open-infracciones"
)
?.addEventListener(
"click",
() => {

mostrarSeccionInterna(
"consulta"
);

}
);


/*
* RED
*/

window.addEventListener(
"online",
actualizarRed
);


window.addEventListener(
"offline",
actualizarRed
);
}

/* ============================================================
NAVEGACIÓN
============================================================ */

function mostrarSeccionInterna(
nombre
) {

const secciones = {

consulta:
document.getElementById(
"consulta-section"
),

actas:
document.getElementById(
"actas-section"
),

normativa:
document.getElementById(
"normativa-section"
),

ajustes:
document.getElementById(
"ajustes-section"
)

};


const bienvenida =
document.getElementById(
"welcome-section"
);


bienvenida?.classList.add(
"hidden"
);


Object.values(
secciones
).forEach(
section => {

section?.classList.add(
"hidden"
);

}
);


secciones[nombre]
?.classList.remove(
"hidden"
);


document
.querySelectorAll(
".nav-button"
)
.forEach(
boton => {

boton.classList.toggle(
"active",
boton.dataset.section ===
nombre
);

}
);


const status =
document.getElementById(
"header-status"
);


if (status) {

status.textContent =
nombre.toUpperCase();
}


if (
nombre === "actas"
) {

mostrarBorradores();
}


if (
nombre === "consulta"
) {

buscarInfracciones();
}
}

/* ============================================================
ESTADÍSTICAS
============================================================ */

function actualizarEstadisticas() {

const total =
document.getElementById(
"stat-total"
);


const leves =
document.getElementById(
"stat-leves"
);


const graves =
document.getElementById(
"stat-graves"
);


const muyGraves =
document.getElementById(
"stat-muy-graves"
);


if (total) {

total.textContent =
estado.infracciones.length;
}


if (leves) {

leves.textContent =
estado.infracciones.filter(
item =>
item.gravedad ===
"Leve"
).length;
}


if (graves) {

graves.textContent =
estado.infracciones.filter(
item =>
item.gravedad ===
"Grave"
).length;
}


if (muyGraves) {

muyGraves.textContent =
estado.infracciones.filter(
item =>
item.gravedad ===
"Muy Grave"
).length;
}
}

/* ============================================================
ESTADO DATOS
============================================================ */

function actualizarEstadoDatos() {

const elemento =
document.getElementById(
"data-status"
);


if (!elemento) {

return;
}


if (
estado.erroresDatos.length
) {

elemento.textContent =
"REVISAR DATOS";

return;
}


elemento.textContent =
estado.infracciones.length
? "CARGADA"
: "SIN DATOS";
}

/* ============================================================
CONTADOR
============================================================ */

function actualizarContador() {

const contador =
document.getElementById(
"search-result-count"
);


if (!contador) {

return;
}


contador.textContent =
`${estado.resultados.length} resultado(s)`;
}

/* ============================================================
RED
============================================================ */

function actualizarRed() {

const online =
navigator.onLine;


const network =
document.getElementById(
"network-status"
);


const welcome =
document.getElementById(
"welcome-connection"
);


const consulta =
document.getElementById(
"consulta-status"
);


if (online) {

if (network) {

network.textContent =
"ONLINE";
}


if (welcome) {

welcome.textContent =
"● Conectado";

welcome.className =
"connection-indicator online";
}


if (consulta) {

consulta.textContent =
"ONLINE";
}

} else {

if (network) {

network.textContent =
"OFFLINE";
}


if (welcome) {

welcome.textContent =
"● Modo offline";

welcome.className =
"connection-indicator offline";
}


if (consulta) {

consulta.textContent =
"OFFLINE READY";
}
}
}

/* ============================================================
NOTIFICACIONES
============================================================ */

function mostrarNotificacion(
mensaje
) {

document
.querySelector(
".centinela-notificacion"
)
?.remove();


const elemento =
document.createElement(
"div"
);


elemento.className =
"centinela-notificacion";


elemento.textContent =
mensaje;


Object.assign(
elemento.style,
{

position: "fixed",

left: "14px",

right: "14px",

bottom: "85px",

zIndex: "9999",

padding: "13px",

borderRadius: "10px",

background: "#172233",

border:
"1px solid #33465e",

color: "#f2f5f8",

textAlign: "center",

fontSize: "12px",

fontWeight: "700",

boxShadow:
"0 8px 30px rgba(0,0,0,.35)"

}
);


document.body.appendChild(
elemento
);


setTimeout(
() => {

elemento.remove();

},
2500
);
}

/* ============================================================
ERROR
============================================================ */

function mostrarError(
mensaje
) {

console.error(
mensaje
);


document
.querySelector(
".centinela-error"
)
?.remove();


const elemento =
document.createElement(
"div"
);


elemento.className =
"centinela-error";


elemento.textContent =
mensaje;


document.body.prepend(
elemento
);
}

/* ============================================================
GRAVEDAD
============================================================ */

function claseGravedad(
gravedad
) {

switch (
normalizarGravedad(
gravedad
)
) {

case "Leve":
return "gravedad-leve";

case "Grave":
return "gravedad-grave";

case "Muy Grave":
return "gravedad-muy-grave";

default:
return "";
}
}

/* ============================================================
FECHA / HORA
============================================================ */

function obtenerFechaHoraLocal() {

const ahora =
new Date();


const year =
ahora.getFullYear();


const month =
String(
ahora.getMonth() + 1
)
.padStart(
2,
"0"
);


const day =
String(
ahora.getDate()
)
.padStart(
2,
"0"
);


const hours =
String(
ahora.getHours()
)
.padStart(
2,
"0"
);


const minutes =
String(
ahora.getMinutes()
)
.padStart(
2,
"0"
);


return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function convertirAInputFecha(
fecha
) {

if (!fecha) {

return obtenerFechaHoraLocal();
}


if (
/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/
.test(
fecha
)
) {

return fecha;
}


const date =
new Date(
fecha
);


if (
Number.isNaN(
date.getTime()
)
) {

return obtenerFechaHoraLocal();
}


const year =
date.getFullYear();


const month =
String(
date.getMonth() + 1
)
.padStart(
2,
"0"
);


const day =
String(
date.getDate()
)
.padStart(
2,
"0"
);


const hours =
String(
date.getHours()
)
.padStart(
2,
"0"
);


const minutes =
String(
date.getMinutes()
)
.padStart(
2,
"0"
);


return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/* ============================================================
ID ACTA
============================================================ */

function generarIdActa() {

const fecha =
new Date();


const timestamp =
fecha
.toISOString()
.replace(
/[-:.TZ]/g,
""
);


const aleatorio =
Math.random()
.toString(36)
.substring(
2,
7
)
.toUpperCase();


return `ACTA-${timestamp}-${aleatorio}`;
}

/* ============================================================
EUROS
============================================================ */

function formatearEuros(
numero
) {

if (
numero === null ||
numero === undefined ||
numero === ""
) {

return "-";
}


return new Intl.NumberFormat(
"es-ES",
{

style: "currency",

currency: "EUR",

maximumFractionDigits: 0

}
)
.format(
numero
);
}

/* ============================================================
SEGURIDAD HTML
============================================================ */

function escapeHTML(
valor
) {

return String(
valor ?? ""
)
.replace(
/&/g,
"&amp;"
)
.replace(
/</g,
"&lt;"
)
.replace(
/>/g,
"&gt;"
)
.replace(
/"/g,
"&quot;"
)
.replace(
/'/g,
"&#039;"
);
}

function escapeJS(
valor
) {

return String(
valor ?? ""
)
.replace(
/\\/g,
"\\\\"
)
.replace(
/'/g,
"\\'"
)
.replace(
/"/g,
'\\"'
)
.replace(
/\r?\n/g,
"\\n"
);
}

/* ============================================================
EXPOSICIÓN GLOBAL
============================================================ */

window.estado =
estado;

window.CONFIG =
CONFIG;

window.usuarioActual =
usuarioActual;

window.clienteSupabase =
clienteSupabase;

window.buscarInfracciones =
buscarInfracciones;

window.verInfraccion =
verInfraccion;

window.iniciarActaDesdeInfraccion =
iniciarActaDesdeInfraccion;

window.activarModoActa =
activarModoActa;

window.mostrarFormularioActa =
mostrarFormularioActa;

window.mostrarBorradores =
mostrarBorradores;

window.editarActa =
editarActa;

window.eliminarActa =
eliminarActa;

window.mostrarMenuActas =
mostrarMenuActas;

window.mostrarLOPSC =
mostrarLOPSC;

/* ============================================================
FIN APP.JS
============================================================ */
QUÉ HACER
1. Abre app.js en GitHub.
2. Borra TODO el contenido antiguo.
3. Copia TODO el código de este documento y pégalo.
4. Guarda/Commit.
5. Espera a que GitHub Pages publique el cambio.
6. Abre Centinela Code y prueba el mismo usuario y contraseña.
7. Si el Service Worker sirve la versión anterior, la app mostrará el error en pantalla en vez de quedarse cargando indefinidamente.
