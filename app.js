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
VERSION: "1.1.0",

SUPABASE: {
    URL: "https://okuygqbaliaeavhyezri.supabase.co",
    KEY: "sb_publishable_fbEAcJZxMv8PD3VB3Bcx6A_l_8BdP2m",
    TABLE: "actas"
},

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

erroresDatos: [],

usuario: null,
supabase: null,
autenticado: false,
authInicializado: false,
authCargando: true
};

/* ============================================================
INICIO
============================================================ */

document.addEventListener(
"DOMContentLoaded",
iniciarCentinela
);

async function iniciarCentinela() {

    console.log(`${CONFIG.APP_NAME} ${CONFIG.VERSION}`);

    // Ocultamos el spinner en cuanto la interfaz está lista para usarse.
    mostrarCarga(false);

    // Aseguramos que la pantalla de login existe y no bloquea el arranque.
    bloquearAplicacion();

    try {
        await inicializarAutenticacion();
    } catch (error) {
        console.error("Error durante la autenticación:", error);
    }

    estado.authCargando = false;

    if (!estado.autenticado) {
        mostrarCarga(false);
        mostrarMensajeLogin(
            estado.supabase
                ? "Inicia sesión para acceder a Centinela Code."
                : "No se pudo cargar el sistema de acceso. Comprueba tu conexión y recarga la aplicación."
        );
        return;
    }

    try {
        cargarConfiguracion();
        registrarEventos();
        await cargarDatos();
        await cargarActas();
        inicializarInterfaz();
        actualizarInterfazUsuario();
        desbloquearAplicacion();
        mostrarCarga(false);
    } catch (error) {
        console.error("Error iniciando Centinela Code:", error);
        mostrarCarga(false);
        mostrarError(
            "La sesión es correcta, pero la interfaz no pudo terminar de cargar."
        );
    }
}


function mostrarMensajeLogin(mensaje) {
    const elemento = document.getElementById("centinela-login-message");
    if (elemento) {
        elemento.textContent = mensaje || "";
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


actualizarEstadoInicioDatos();

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

const controlador = new AbortController();
const temporizador = setTimeout(
    () => controlador.abort(),
    10000
);

/*
 * no-store evita que una versión antigua de la PWA deje
 * los datos en "Cargando..." por una respuesta cacheada.
 * El parámetro de versión también fuerza una petición nueva.
 */
const separador = ruta.includes("?") ? "&" : "?";
const urlActualizada = `${ruta}${separador}v=${encodeURIComponent(CONFIG.VERSION)}-${Date.now()}`;

try {
    const respuesta = await fetch(
        urlActualizada,
        {
            cache: "no-store",
            signal: controlador.signal
        }
    );

    if (!respuesta.ok) {
        throw new Error(
            `HTTP ${respuesta.status}: ${ruta}`
        );
    }

    return await respuesta.json();

} catch (error) {

    if (error?.name === "AbortError") {
        throw new Error(`Tiempo agotado cargando ${ruta}`);
    }

    throw error;

} finally {
    clearTimeout(temporizador);
}
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
    const elemento = document.getElementById("appVersion");
    if (elemento) elemento.textContent = CONFIG.VERSION;
}


/* ============================================================
FILTROS
============================================================ */

function configurarFiltros() {
    document.querySelectorAll(".filter-chip[data-severity]").forEach(boton => {
        const activo = (boton.dataset.severity || "all") === estado.filtros.gravedad;
        boton.classList.toggle("active", activo);
    });
}


/* ============================================================
BÚSQUEDA
============================================================ */

function buscarInfracciones() {
    const texto = normalizarTexto(estado.filtros.texto || "");
    const gravedad = estado.filtros.gravedad || "todas";
    const articulo = estado.filtros.articulo || "todos";

    estado.resultados = estado.infracciones.filter(infraccion => {
        if (gravedad !== "todas" && gravedad !== "all" && infraccion.gravedad !== gravedad) return false;
        if (articulo !== "todos" && String(infraccion.articulo) !== String(articulo)) return false;
        if (!texto) return false;

        const contenido = [
            infraccion.id,
            infraccion.codigo,
            infraccion.ley,
            infraccion.articulo,
            infraccion.apartado,
            infraccion.titulo,
            infraccion.conducta,
            infraccion.gravedad,
            ...(infraccion.palabrasClave || []),
            ...(infraccion.medidas || []),
            ...(infraccion.responsables || [])
        ].join(" ");

        return normalizarTexto(contenido).includes(texto);
    });

    estado.resultados.sort((a, b) => {
        const aa = normalizarTexto(a.codigo || "");
        const bb = normalizarTexto(b.codigo || "");
        if (aa === texto && bb !== texto) return -1;
        if (bb === texto && aa !== texto) return 1;
        return String(a.codigo || "").localeCompare(String(b.codigo || ""), "es", {numeric:true});
    });

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
    const contenedor = document.getElementById("consultaResults");
    const contador = document.getElementById("consultaResultCount");

    if (!contenedor) return;
    if (contador) contador.textContent = String(estado.resultados.length);

    const input = document.getElementById("consultaSearch");
    const texto = input ? input.value.trim() : "";

    if (!texto) {
        contenedor.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔎</div>
                <h3>Buscar infracción</h3>
                <p>Introduce un código, artículo o palabra clave para comenzar.</p>
            </div>`;
        return;
    }

    if (!estado.resultados.length) {
        contenedor.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⚠️</div>
                <h3>Sin resultados</h3>
                <p>No se han encontrado infracciones con esos criterios.</p>
            </div>`;
        return;
    }

    contenedor.innerHTML = estado.resultados.map(renderizarTarjetaConsulta).join("");

    contenedor.querySelectorAll("[data-infraccion-id]").forEach(boton => {
        boton.addEventListener("click", () => {
            verInfraccion(boton.dataset.infraccionId);
        });
    });
}

function renderizarTarjetaConsulta(infraccion) {
    const sancion = infraccion.sancion || {};
    let rango = "";
    if (sancion.min != null && sancion.max != null) {
        rango = `${formatearEuros(sancion.min)} - ${formatearEuros(sancion.max)}`;
    } else if (sancion.min != null) {
        rango = `Desde ${formatearEuros(sancion.min)}`;
    } else if (sancion.max != null) {
        rango = `Hasta ${formatearEuros(sancion.max)}`;
    }

    return `
        <article class="result-card">
            <div class="result-card-header">
                <div>
                    <span class="result-code">${escapeHTML(infraccion.codigo || "")}</span>
                    <h3>${escapeHTML(infraccion.titulo || "Sin título")}</h3>
                </div>
                <span class="severity-badge">${escapeHTML(infraccion.gravedad || "")}</span>
            </div>
            <p class="result-conducta">${escapeHTML(infraccion.conducta || "")}</p>
            <div class="result-meta">
                <span>Art. ${escapeHTML(infraccion.articulo || "")}</span>
                ${rango ? `<span>${rango}</span>` : ""}
            </div>
            <button type="button" class="result-detail-button" data-infraccion-id="${escapeHTML(infraccion.id || "")}">
                Ver detalle
            </button>
        </article>`;
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
    document.querySelectorAll(".normativa-open[data-law]").forEach(boton => {
        boton.onclick = () => {
            if (boton.dataset.law === "lopsc") mostrarLOPSC();
            else if (boton.dataset.law === "ordenanzas") mostrarOrdenanzas();
        };
    });
}

function mostrarLOPSC() {
    mostrarSeccionInterna("normativa");
    const viewer = document.getElementById("normativaViewer");
    if (!viewer) return;
    viewer.classList.remove("hidden");
    const title = document.getElementById("viewerTitle");
    const subtitle = document.getElementById("viewerSubtitle");
    const content = document.getElementById("viewerContent");
    if (title) title.textContent = "Ley Orgánica 4/2015";
    if (subtitle) subtitle.textContent = "Protección de la Seguridad Ciudadana";
    if (!content) return;
    content.innerHTML = `<input id="normativaViewerSearch" type="search" placeholder="Buscar artículo o texto..." autocomplete="off"><div id="normativaViewerList"></div>`;
    const input = document.getElementById("normativaViewerSearch");
    const render = () => {
        const q = normalizarTexto(input?.value || "");
        const list = estado.normativa.filter(a => !q || normalizarTexto(JSON.stringify(a)).includes(q));
        document.getElementById("normativaViewerList").innerHTML = list.length ? list.map(crearArticuloNormativo).join("") : `<div class="empty-state"><strong>No se encontraron artículos</strong></div>`;
    };
    input?.addEventListener("input", render);
    render();
}


function mostrarOrdenanzas() {
    mostrarSeccionInterna("normativa");
    const viewer = document.getElementById("normativaViewer");
    if (!viewer) return;
    viewer.classList.remove("hidden");
    const title = document.getElementById("viewerTitle");
    const subtitle = document.getElementById("viewerSubtitle");
    const content = document.getElementById("viewerContent");
    if (title) title.textContent = "Ordenanzas municipales";
    if (subtitle) subtitle.textContent = "Acceso directo a la web oficial";
    if (!content) return;
    const lista = Array.isArray(estado.ordenanzas) ? estado.ordenanzas : [];
    content.innerHTML = lista.length ? `
        <div class="normativa-articulos">
            ${lista.map(o => `
                <article class="normativa-articulo">
                    <div class="normativa-articulo-header">
                        <strong>${escapeHTML(o.nombre || "Ordenanza")}</strong>
                        <span>${escapeHTML(o.materia || "")}</span>
                    </div>
                    <p>${escapeHTML(o.municipio || "")}</p>
                    ${o.url ? `<a href="${escapeHTML(o.url)}" target="_blank" rel="noopener noreferrer" class="result-detail-button" style="display:inline-block;text-decoration:none;text-align:center">Abrir ordenanza oficial</a>` : ""}
                </article>`).join("")}
        </div>` : `<div class="empty-state"><strong>No hay ordenanzas disponibles.</strong></div>`;
}

function renderizarListaNormativa() {
    // La búsqueda principal de normativa se abre al pulsar la LOPSC.
    // La lista base no necesita renderizado mientras está cerrada.
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

if (!estado.autenticado) {
    bloquearAplicacion();
    return;
}


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

async function guardarActaDesdeFormulario(
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


await guardarActaEnSupabase(acta);

mostrarNotificacion(
    "Acta guardada correctamente en la base de datos."
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

async function eliminarActa(
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

await eliminarActaDeSupabase(id);

mostrarBorradores();
}

/* ============================================================
SUPABASE + AUTENTICACIÓN
============================================================ */

const SUPABASE_CDN =
"https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";

async function cargarLibreriaSupabase() {

if (window.supabase?.createClient) {
    return;
}

const existente = document.querySelector(
    'script[data-centinela-supabase="true"]'
);

if (existente) {
    if (window.supabase?.createClient) return;

    await esperarCargaSupabase(existente);
    return;
}

await new Promise((resolve, reject) => {

    const script = document.createElement("script");
    script.src = SUPABASE_CDN;
    script.async = true;
    script.dataset.centinelaSupabase = "true";

    let finalizado = false;

    const finalizar = (funcion) => {
        if (finalizado) return;
        finalizado = true;
        clearTimeout(temporizador);
        funcion();
    };

    const temporizador = setTimeout(() => {
        finalizar(() => reject(
            new Error("Tiempo agotado cargando la librería de Supabase.")
        ));
    }, 8000);

    script.onload = () => {
        finalizar(() => {
            if (window.supabase?.createClient) {
                script.dataset.centinelaLoaded = "true";
                resolve();
            } else {
                reject(new Error(
                    "La librería de Supabase se cargó pero no está disponible."
                ));
            }
        });
    };

    script.onerror = () => {
        finalizar(() => reject(
            new Error("No se pudo cargar la librería de Supabase.")
        ));
    };

    document.head.appendChild(script);
});
}

function esperarCargaSupabase(script) {

return new Promise((resolve, reject) => {

    let finalizado = false;

    const finalizar = (funcion) => {
        if (finalizado) return;
        finalizado = true;
        clearTimeout(temporizador);
        funcion();
    };

    const temporizador = setTimeout(() => {
        if (window.supabase?.createClient) {
            finalizar(resolve);
        } else {
            finalizar(() => reject(
                new Error("Tiempo agotado esperando a Supabase.")
            ));
        }
    }, 8000);

    script.addEventListener("load", () => {
        if (window.supabase?.createClient) {
            finalizar(resolve);
        } else {
            finalizar(() => reject(
                new Error("Supabase se cargó pero no está disponible.")
            ));
        }
    }, { once: true });

    script.addEventListener("error", () => {
        finalizar(() => reject(
            new Error("No se pudo cargar Supabase.")
        ));
    }, { once: true });
});
}

async function inicializarAutenticacion() {

try {

    await cargarLibreriaSupabase();

    estado.supabase = window.supabase.createClient(
        CONFIG.SUPABASE.URL,
        CONFIG.SUPABASE.KEY,
        {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            }
        }
    );

    const resultado =
        await Promise.race([
            estado.supabase.auth.getSession(),
            new Promise((_, reject) =>
                setTimeout(
                    () => reject(new Error("Tiempo agotado comprobando la sesión.")),
                    8000
                )
            )
        ]);

    estado.usuario =
        resultado.data?.session?.user || null;

    estado.autenticado =
        Boolean(estado.usuario);

    estado.authInicializado = true;

    estado.supabase.auth.onAuthStateChange(
        async (_evento, session) => {

            estado.usuario =
                session?.user || null;

            estado.autenticado =
                Boolean(estado.usuario);

            actualizarInterfazUsuario();

            if (estado.autenticado) {
                await cargarActas();
                desbloquearAplicacion();
            } else {
                estado.actas = [];
                bloquearAplicacion();
            }
        }
    );

} catch (error) {

    console.error(
        "Error inicializando autenticación:",
        error
    );

    estado.authInicializado = true;
    estado.autenticado = false;

    mostrarError(
        "No se pudo conectar con el sistema de identificación."
    );
}
}

function crearPantallaLogin() {

if (document.getElementById("centinela-auth-screen")) {
    return;
}

const pantalla = document.createElement("div");
pantalla.id = "centinela-auth-screen";

Object.assign(pantalla.style, {
    position: "fixed",
    inset: "0",
    zIndex: "100000",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    boxSizing: "border-box",
    background: "radial-gradient(circle at top, #10284a 0%, #030817 55%, #01040b 100%)",
    color: "#f4f7fb",
    fontFamily: "Arial, Helvetica, sans-serif"
});

pantalla.innerHTML = `
<div style="width:100%;max-width:420px;border:1px solid rgba(82,151,255,.35);border-radius:28px;padding:28px;box-sizing:border-box;background:linear-gradient(145deg,rgba(15,39,72,.98),rgba(5,13,27,.98));box-shadow:0 20px 60px rgba(0,0,0,.55)">
    <div style="text-align:center;margin-bottom:24px">
        <div style="font-size:58px;line-height:1">🛡️</div>
        <h1 style="margin:12px 0 6px;font-size:30px">Centinela Code</h1>
        <p style="margin:0;color:#9eb0c8">Acceso profesional</p>
    </div>

    <form id="centinela-login-form">
        <label style="display:block;margin:0 0 7px;font-weight:700">Correo electrónico</label>
        <input id="centinela-login-email" type="email" autocomplete="username" required placeholder="agente@ejemplo.es" style="width:100%;box-sizing:border-box;padding:15px;border-radius:14px;border:1px solid #29476d;background:#071325;color:#fff;margin-bottom:15px;font-size:16px">

        <label style="display:block;margin:0 0 7px;font-weight:700">Contraseña</label>
        <input id="centinela-login-password" type="password" autocomplete="current-password" required placeholder="••••••••" style="width:100%;box-sizing:border-box;padding:15px;border-radius:14px;border:1px solid #29476d;background:#071325;color:#fff;margin-bottom:18px;font-size:16px">

        <button type="submit" style="width:100%;padding:15px;border:0;border-radius:14px;background:linear-gradient(135deg,#1769e0,#0b3b9e);color:#fff;font-size:16px;font-weight:800">INICIAR SESIÓN</button>
        <button type="button" id="centinela-reset-password" style="width:100%;margin-top:10px;padding:12px;border:0;background:transparent;color:#8fc1ff;font-weight:700">¿Has olvidado la contraseña?</button>
        <div id="centinela-login-message" style="min-height:22px;margin-top:14px;text-align:center;color:#ffb4b4;font-size:13px"></div>
    </form>

    <div style="margin-top:20px;padding-top:16px;border-top:1px solid rgba(255,255,255,.08);text-align:center;color:#70839e;font-size:12px">
        Acceso protegido · Registro de actas por usuario
    </div>
</div>`;

document.body.appendChild(pantalla);

const form = document.getElementById("centinela-login-form");
const message = document.getElementById("centinela-login-message");

form?.addEventListener("submit", async event => {

    event.preventDefault();

    if (!estado.supabase) {
        message.textContent = "El sistema de identificación todavía no está disponible.";
        return;
    }

    const email =
        document.getElementById("centinela-login-email")?.value.trim();

    const password =
        document.getElementById("centinela-login-password")?.value;

    message.textContent = "Comprobando acceso...";

    const { error } =
        await estado.supabase.auth.signInWithPassword({
            email,
            password
        });

    if (error) {
        message.textContent = traducirErrorAuth(error.message);
        return;
    }

    message.textContent = "Acceso correcto.";
});

document.getElementById("centinela-reset-password")?.addEventListener(
    "click",
    async () => {

        const email =
            document.getElementById("centinela-login-email")?.value.trim();

        if (!email) {
            message.textContent = "Escribe primero tu correo electrónico.";
            return;
        }

        const { error } =
            await estado.supabase.auth.resetPasswordForEmail(
                email,
                { redirectTo: window.location.origin + window.location.pathname }
            );

        message.textContent = error
            ? traducirErrorAuth(error.message)
            : "Te hemos enviado las instrucciones para restablecer la contraseña.";
    }
);
}

function bloquearAplicacion() {

crearPantallaLogin();

const pantalla =
    document.getElementById("centinela-auth-screen");

if (pantalla) {
    pantalla.style.display = "flex";
}

actualizarInterfazUsuario();
}

function desbloquearAplicacion() {

const pantalla =
    document.getElementById("centinela-auth-screen");

if (pantalla) {
    pantalla.style.display = "none";
}
}

function traducirErrorAuth(mensaje) {

const texto = String(mensaje || "").toLowerCase();

if (texto.includes("invalid login credentials")) {
    return "Correo o contraseña incorrectos.";
}

if (texto.includes("email not confirmed")) {
    return "Debes confirmar el correo electrónico antes de entrar.";
}

if (texto.includes("too many requests")) {
    return "Demasiados intentos. Espera unos minutos y vuelve a intentarlo.";
}

return "No se ha podido iniciar sesión. Comprueba los datos.";
}

function actualizarInterfazUsuario() {

const usuario = estado.usuario;

let indicador =
    document.getElementById("centinela-user-indicator");

if (!indicador && usuario && document.body) {

    indicador = document.createElement("button");
    indicador.id = "centinela-user-indicator";
    indicador.type = "button";

    Object.assign(indicador.style, {
        position: "fixed",
        top: "10px",
        right: "12px",
        zIndex: "9000",
        border: "1px solid rgba(92,159,255,.35)",
        borderRadius: "12px",
        background: "rgba(7,19,37,.88)",
        color: "#dceaff",
        padding: "8px 10px",
        fontSize: "11px",
        fontWeight: "700",
        backdropFilter: "blur(8px)"
    });

    document.body.appendChild(indicador);

    indicador.addEventListener("click", async () => {

        if (!estado.supabase) return;

        const confirmar =
            window.confirm(
                `Sesión activa: ${estado.usuario?.email || "usuario"}.\n\n¿Quieres cerrar sesión?`
            );

        if (!confirmar) return;

        await estado.supabase.auth.signOut();
    });
}

if (indicador) {
    if (usuario) {
        indicador.textContent = `👤 ${usuario.email || "Usuario"}`;
        indicador.style.display = "block";
    } else {
        indicador.style.display = "none";
    }
}
}

/* ============================================================
ACTAS EN SUPABASE
============================================================ */

async function cargarActas() {

if (!estado.supabase || !estado.usuario) {
    estado.actas = [];
    return;
}

try {

    const { data, error } =
        await estado.supabase
            .from(CONFIG.SUPABASE.TABLE)
            .select("*")
            .eq("usuario_id", estado.usuario.id)
            .order("created_at", { ascending: false });

    if (error) {
        console.error("Error cargando actas:", error);
        estado.actas = [];
        mostrarError("No se pudieron cargar tus actas guardadas.");
        return;
    }

    estado.actas = (data || []).map(fila => {

        const contenido =
            fila.contenido ??
            fila.acta ??
            fila.data ??
            fila.datos ??
            {};

        if (typeof contenido === "object" && contenido !== null) {
            return {
                ...contenido,
                id: fila.id || contenido.id,
                usuario_id: fila.usuario_id
            };
        }

        try {
            return {
                ...JSON.parse(contenido),
                id: fila.id,
                usuario_id: fila.usuario_id
            };
        } catch {
            return {
                id: fila.id,
                estado: "borrador",
                observaciones: String(contenido || "")
            };
        }
    });

    mostrarBorradores();

} catch (error) {

    console.error("Error cargando actas:", error);
    estado.actas = [];
}
}

async function guardarActaEnSupabase(acta) {

if (!estado.supabase || !estado.usuario) {
    throw new Error("No hay una sesión de usuario activa.");
}

const contenido = {
    ...acta,
    usuario_id: estado.usuario.id,
    usuario_email: estado.usuario.email || ""
};

const fila = {
    usuario_id: estado.usuario.id,
    contenido,
    updated_at: new Date().toISOString()
};

let resultado;

if (acta.id && esUUID(acta.id)) {

    resultado =
        await estado.supabase
            .from(CONFIG.SUPABASE.TABLE)
            .update(fila)
            .eq("id", acta.id)
            .eq("usuario_id", estado.usuario.id)
            .select()
            .single();

} else {

    const nuevoId =
        crypto.randomUUID
            ? crypto.randomUUID()
            : null;

    const insertFila = {
        ...fila
    };

    if (nuevoId) {
        insertFila.id = nuevoId;
        acta.id = nuevoId;
        contenido.id = nuevoId;
    }

    resultado =
        await estado.supabase
            .from(CONFIG.SUPABASE.TABLE)
            .insert(insertFila)
            .select()
            .single();
}

if (resultado.error) {
    console.error("Error guardando acta:", resultado.error);
    throw new Error(
        resultado.error.message ||
        "No se pudo guardar el acta."
    );
}

const guardada = resultado.data;

if (guardada) {
    const indice =
        estado.actas.findIndex(
            item => item.id === guardada.id
        );

    const actaGuardada = {
        ...(guardada.contenido || acta),
        id: guardada.id,
        usuario_id: guardada.usuario_id
    };

    if (indice >= 0) {
        estado.actas[indice] = actaGuardada;
    } else {
        estado.actas.push(actaGuardada);
    }
}
}

async function eliminarActaDeSupabase(id) {

if (!estado.supabase || !estado.usuario || !esUUID(id)) {
    return;
}

const { error } =
    await estado.supabase
        .from(CONFIG.SUPABASE.TABLE)
        .delete()
        .eq("id", id)
        .eq("usuario_id", estado.usuario.id);

if (error) {
    console.error("Error eliminando acta:", error);
    mostrarError("El acta se quitó de la pantalla, pero no pudo eliminarse de la base de datos.");
}
}

function esUUID(valor) {

return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(valor || "")
);
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
    // Navegación inferior y accesos rápidos.
    document.querySelectorAll(".nav-item[data-section]").forEach(boton => {
        boton.onclick = () => mostrarSeccionInterna(boton.dataset.section);
    });

    document.querySelectorAll(".quick-action[data-target]").forEach(boton => {
        boton.onclick = () => mostrarSeccionInterna(boton.dataset.target);
    });

    document.getElementById("headerSearchButton")?.addEventListener("click", () => {
        mostrarSeccionInterna("consulta");
        setTimeout(() => document.getElementById("consultaSearch")?.focus(), 100);
    });

    const search = document.getElementById("consultaSearch");
    search?.addEventListener("input", () => {
        estado.filtros.texto = search.value;
        buscarInfracciones();
    });

    document.getElementById("clearConsultaSearch")?.addEventListener("click", () => {
        if (search) search.value = "";
        estado.filtros.texto = "";
        buscarInfracciones();
        search?.focus();
    });

    document.querySelectorAll(".filter-chip[data-severity]").forEach(boton => {
        boton.addEventListener("click", () => {
            document.querySelectorAll(".filter-chip[data-severity]").forEach(x => x.classList.remove("active"));
            boton.classList.add("active");
            const sev = boton.dataset.severity || "all";
            estado.filtros.gravedad = sev === "all" ? "todas" : sev;
            buscarInfracciones();
        });
    });

    document.getElementById("newActaButton")?.addEventListener("click", () => abrirEditorActa());
    document.getElementById("closeActaEditor")?.addEventListener("click", cerrarEditorActa);
    document.getElementById("cancelActaButton")?.addEventListener("click", cerrarEditorActa);
    document.getElementById("actaForm")?.addEventListener("submit", guardarActaDesdeFormularioCompat);
    document.getElementById("actaInfraccion")?.addEventListener("input", actualizarPreviewActaCompat);

    document.getElementById("clearNormativaSearch")?.addEventListener("click", () => {
        const input = document.getElementById("normativaSearch");
        if (input) { input.value = ""; renderizarListaNormativa(); }
    });
    document.getElementById("normativaSearch")?.addEventListener("input", renderizarListaNormativa);

    document.querySelectorAll(".normativa-open[data-law]").forEach(boton => {
        boton.addEventListener("click", () => {
            const law = boton.dataset.law;
            if (law === "lopsc") mostrarLOPSC();
            if (law === "ordenanzas") mostrarOrdenanzas();
        });
    });
    document.getElementById("closeNormativaViewer")?.addEventListener("click", () => {
        document.getElementById("normativaViewer")?.classList.add("hidden");
    });

    document.getElementById("reloadDataButton")?.addEventListener("click", async () => {
        await cargarDatos();
        inicializarInterfaz();
        mostrarNotificacion("Datos recargados.");
    });

    document.getElementById("clearDraftsButton")?.addEventListener("click", async () => {
        if (!window.confirm("¿Borrar todas las actas guardadas de este usuario?")) return;
        for (const acta of [...estado.actas]) {
            await eliminarActaDeSupabase(acta.id);
        }
        estado.actas = [];
        mostrarBorradores();
        mostrarNotificacion("Actas eliminadas.");
    });

    document.getElementById("closeModal")?.addEventListener("click", cerrarModalCompat);
    document.getElementById("modalOverlay")?.addEventListener("click", cerrarModalCompat);

    window.addEventListener("online", actualizarRed);
    window.addEventListener("offline", actualizarRed);
}


/* ============================================================
NAVEGACIÓN
============================================================ */

function mostrarSeccionInterna(nombre) {
    const secciones = document.querySelectorAll(".app-section[data-section]");
    secciones.forEach(section => {
        section.classList.toggle("active", section.dataset.section === nombre);
    });

    document.querySelectorAll(".nav-item[data-section]").forEach(item => {
        item.classList.toggle("active", item.dataset.section === nombre);
    });

    if (nombre === "consulta") buscarInfracciones();
    if (nombre === "actas") mostrarBorradores();
    window.scrollTo({ top: 0, behavior: "smooth" });
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
ESTADO DATOS — INICIO
============================================================ */

function actualizarEstadoInicioDatos() {
    const n = document.getElementById("homeNormativaStatus");
    const i = document.getElementById("homeInfraccionesStatus");
    const o = document.getElementById("homeOrdenanzasStatus");

    if (n) n.textContent = estado.normativa.length ? `${estado.normativa.length} artículos` : "No disponible";
    if (i) i.textContent = estado.infracciones.length ? `${estado.infracciones.length} infracciones` : "No disponible";
    if (o) o.textContent = estado.ordenanzas.length ? `${estado.ordenanzas.length} ordenanzas` : "No disponible";

    const sn = document.getElementById("settingsLopscStatus");
    const si = document.getElementById("settingsInfraccionesStatus");
    const so = document.getElementById("settingsOrdenanzasStatus");
    if (sn) sn.textContent = estado.normativa.length ? "Disponible" : "No disponible";
    if (si) si.textContent = estado.infracciones.length ? "Disponible" : "No disponible";
    if (so) so.textContent = estado.ordenanzas.length ? "Disponible" : "No disponible";
}


/* ============================================================
ESTADO DATOS
============================================================ */

function actualizarEstadoDatos() {
    actualizarEstadoInicioDatos();
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
    const online = navigator.onLine;
    const network = document.getElementById("homeNetworkStatus");
    if (network) network.textContent = online ? "Online" : "Offline";
    const mode = document.getElementById("appMode");
    if (mode) mode.textContent = online ? "Online" : "Offline";
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

/* ============================================================
   COMPATIBILIDAD FINAL CON EL INDEX.HTML ACTUAL
   ============================================================ */

function abrirEditorActa() {
    const editor = document.getElementById("actaEditor");
    if (!editor) return;
    estado.actaActual = {
        id: generarIdActa(),
        fechaCreacion: new Date().toISOString(),
        estado: "borrador",
        infraccion: estado.infraccionSeleccionada ? { ...estado.infraccionSeleccionada } : null
    };
    editor.classList.remove("hidden");
    const form = document.getElementById("actaForm");
    if (form) form.reset();
    actualizarPreviewActaCompat();
}

function cerrarEditorActa() {
    document.getElementById("actaEditor")?.classList.add("hidden");
    estado.actaActual = null;
}

function actualizarPreviewActaCompat() {
    const input = document.getElementById("actaInfraccion");
    const preview = document.getElementById("actaInfraccionPreview");
    if (!preview) return;
    const q = normalizarTexto(input?.value || "");
    if (!q) {
        preview.classList.add("hidden");
        preview.innerHTML = "";
        return;
    }
    const match = estado.infracciones.find(i =>
        normalizarTexto([i.id, i.codigo, i.articulo, i.titulo].join(" ")).includes(q)
    );
    if (!match) {
        preview.classList.add("hidden");
        preview.innerHTML = "";
        return;
    }
    preview.classList.remove("hidden");
    preview.innerHTML = `<strong>${escapeHTML(match.codigo)}</strong><br>${escapeHTML(match.titulo)}<br><small>${escapeHTML(match.gravedad || "")}</small>`;
    estado.infraccionSeleccionada = match;
}

async function guardarActaDesdeFormularioCompat(evento) {
    evento.preventDefault();
    const form = evento.currentTarget;
    const datos = Object.fromEntries(new FormData(form).entries());
    const acta = {
        ...(estado.actaActual || {}),
        numero: datos.numero || "",
        fecha: datos.fecha || "",
        hora: datos.hora || "",
        nombre: datos.nombre || "",
        dni: datos.dni || "",
        domicilio: datos.domicilio || "",
        lugar: datos.lugar || "",
        hechos: datos.hechos || "",
        observaciones: datos.observaciones || "",
        infraccion: estado.infraccionSeleccionada ? { ...estado.infraccionSeleccionada } : null,
        actualizadoEn: new Date().toISOString()
    };
    try {
        await guardarActaEnSupabase(acta);
        mostrarNotificacion("Acta guardada correctamente.");
        cerrarEditorActa();
        mostrarBorradores();
    } catch (error) {
        console.error(error);
        mostrarError("No se pudo guardar el acta en la base de datos.");
    }
}

function mostrarBorradores() {
    const container = document.getElementById("actasList");
    if (!container) return;
    if (!estado.actas.length) {
        container.innerHTML = `<div class="empty-state"><div class="empty-icon">📝</div><h3>No hay actas guardadas</h3><p>Pulsa «Nueva» para comenzar un acta.</p></div>`;
        return;
    }
    container.innerHTML = estado.actas.map(acta => `
        <article class="draft-card">
            <strong>${escapeHTML(acta.infraccion?.codigo || "Sin tipificar")}</strong>
            <span>${escapeHTML(acta.infraccion?.titulo || "Acta")}</span>
            <small>${escapeHTML(acta.lugar || acta.nombre || "Sin datos")}</small>
            <div class="acciones-infraccion">
                <button type="button" data-edit-acta="${escapeHTML(acta.id || "")}">EDITAR</button>
                <button type="button" data-delete-acta="${escapeHTML(acta.id || "")}">ELIMINAR</button>
            </div>
        </article>`).join("");
    container.querySelectorAll("[data-edit-acta]").forEach(b => b.onclick = () => editarActaCompat(b.dataset.editActa));
    container.querySelectorAll("[data-delete-acta]").forEach(b => b.onclick = () => eliminarActaCompat(b.dataset.deleteActa));
}

function editarActaCompat(id) {
    const acta = estado.actas.find(a => String(a.id) === String(id));
    if (!acta) return;
    estado.actaActual = { ...acta };
    estado.infraccionSeleccionada = acta.infraccion || null;
    const editor = document.getElementById("actaEditor");
    const form = document.getElementById("actaForm");
    if (!editor || !form) return;
    editor.classList.remove("hidden");
    ["numero","fecha","hora","nombre","dni","domicilio","lugar","hechos","observaciones"].forEach(name => {
        const field = form.elements[name];
        if (field) field.value = acta[name] || "";
    });
    const inf = document.getElementById("actaInfraccion");
    if (inf) inf.value = acta.infraccion?.codigo || "";
    actualizarPreviewActaCompat();
}

async function eliminarActaCompat(id) {
    if (!window.confirm("¿Eliminar este borrador?")) return;
    await eliminarActaDeSupabase(id);
    estado.actas = estado.actas.filter(a => String(a.id) !== String(id));
    mostrarBorradores();
}

function cerrarModalCompat() {
    document.getElementById("appModal")?.classList.add("hidden");
}

function renderizarTarjetaBorrador(acta) {
    return `<article class="draft-card"><strong>${escapeHTML(acta.infraccion?.codigo || "Sin tipificar")}</strong></article>`;
}


/* ============================================================
   ARRANQUE FINAL DE INTERFAZ
   ============================================================ */

function inicializarInterfaz() {
    actualizarVersion();
    configurarFiltros();
    actualizarEstadisticas();
    actualizarEstadoInicioDatos();
    actualizarRed();
    buscarInfracciones();
    configurarNormativa();
    mostrarBorradores();
    mostrarCarga(false);
}

/* ============================================================
   DETALLE DE INFRACCIÓN — COMPATIBLE CON INDEX ACTUAL
   ============================================================ */

function verInfraccion(id) {
    const infraccion = estado.infracciones.find(item => String(item.id) === String(id));
    if (!infraccion) return;

    estado.infraccionSeleccionada = infraccion;
    const contenedor = document.getElementById("consultaResults");
    if (!contenedor) return;

    const sancion = infraccion.sancion || {};
    const rango = sancion.min != null && sancion.max != null
        ? `${formatearEuros(sancion.min)} - ${formatearEuros(sancion.max)}`
        : sancion.min != null
            ? `Desde ${formatearEuros(sancion.min)}`
            : sancion.max != null
                ? `Hasta ${formatearEuros(sancion.max)}`
                : "";

    contenedor.innerHTML = `
        <article class="result-card">
            <div class="result-card-header">
                <div>
                    <span class="result-code">${escapeHTML(infraccion.codigo || "")}</span>
                    <h3>${escapeHTML(infraccion.titulo || "Sin título")}</h3>
                </div>
                <span class="severity-badge">${escapeHTML(infraccion.gravedad || "")}</span>
            </div>
            <p><strong>Artículo:</strong> ${escapeHTML(infraccion.articulo || "")}${infraccion.apartado ? "." + escapeHTML(infraccion.apartado) : ""}</p>
            <p class="result-conducta">${escapeHTML(infraccion.conducta || "")}</p>
            ${rango ? `<div class="result-meta"><span>Sanción: ${rango}</span></div>` : ""}
            <div class="acciones-infraccion">
                <button type="button" id="volverConsultaCompat">← Volver</button>
                <button type="button" id="crearActaCompat">CREAR ACTA</button>
            </div>
        </article>`;

    document.getElementById("volverConsultaCompat")?.addEventListener("click", () => {
        buscarInfracciones();
    });
    document.getElementById("crearActaCompat")?.addEventListener("click", () => {
        mostrarSeccionInterna("actas");
        abrirEditorActa();
        const input = document.getElementById("actaInfraccion");
        if (input) input.value = infraccion.codigo || "";
        actualizarPreviewActaCompat();
    });
}
