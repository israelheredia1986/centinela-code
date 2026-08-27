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

console.log(
    `${CONFIG.APP_NAME} ${CONFIG.VERSION}`
);

actualizarRed();

/*
 * La pantalla de acceso se muestra inmediatamente.
 * No dejamos al usuario bloqueado en "Cargando aplicación..."
 * mientras se descarga Supabase.
 */
bloquearAplicacion();

try {
    await inicializarAutenticacion();
} catch (error) {
    console.error("Error durante la autenticación:", error);
}

estado.authCargando = false;

if (!estado.autenticado) {
    mostrarMensajeLogin(
        estado.supabase
            ? "Inicia sesión para acceder a Centinela Code."
            : "No se pudo cargar el sistema de acceso. Comprueba tu conexión a Internet y recarga la aplicación."
    );
    bloquearAplicacion();
    return;
}

cargarConfiguracion();

registrarEventos();

await cargarDatos();

await cargarActas();

inicializarInterfaz();

actualizarInterfazUsuario();
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

    const texto = normalizarTexto(
        estado.filtros.texto || ""
    );

    const gravedad = estado.filtros.gravedad;
    const articulo = estado.filtros.articulo;

    /*
     * BÚSQUEDA SEGURA:
     * No usamos includes() sobre un texto gigante.
     * Una búsqueda textual solo es válida cuando coincide
     * con una palabra/frase completa en los campos relevantes.
     *
     * Además, las sustancias/drogas tienen un mapa jurídico
     * explícito hacia los apartados de la LOPSC que regulan
     * conductas relacionadas con drogas.
     */
    const sinonimosDrogas = new Set([
        "cocaina",
        "cocaína",
        "coca",
        "coca en polvo",
        "cocaina en polvo",
        "cocaína en polvo",
        "hachis",
        "hachís",
        "hash",
        "resina de cannabis",
        "marihuana",
        "marihuanas",
        "marijuana",
        "cannabis",
        "porro",
        "porros",
        "grifa",
        "droga",
        "drogas",
        "estupefaciente",
        "estupefacientes",
        "sustancia estupefaciente",
        "sustancias estupefacientes",
        "sustancia psicotropica",
        "sustancia psicotrópica",
        "sustancias psicotropicas",
        "sustancias psicotrópicas"
    ].map(normalizarTexto));

    const apartadosDrogas = new Set([
        "16",
        "17",
        "18",
        "19"
    ]);

    function esFraseExacta(textoCampo, consulta) {

        const campo = normalizarTexto(textoCampo);
        const termino = normalizarTexto(consulta);

        if (!campo || !termino) {
            return false;
        }

        /*
         * Escapamos caracteres especiales para construir
         * una expresión que exija límites de palabra reales.
         * Esto evita casos como:
         * gato -> obliGATOrias
         */
        const palabras = termino
            .split(/\s+/)
            .filter(Boolean)
            .map(
                palabra =>
                    palabra.replace(
                        /[.*+?^${}()|[\]\\]/g,
                        "\\$&"
                    )
            );

        if (!palabras.length) {
            return false;
        }

        const patron = palabras.join("\\s+");

        try {

            return new RegExp(
                `(^|[^a-z0-9áéíóúüñ])${patron}(?=$|[^a-z0-9áéíóúüñ])`,
                "i"
            ).test(campo);

        } catch (error) {

            console.warn(
                "Error en búsqueda:",
                error
            );

            return false;
        }
    }

    function esCoincidenciaCodigo(infraccion, consulta) {

        const codigo =
            normalizarTexto(infraccion.codigo);

        const id =
            normalizarTexto(infraccion.id);

        const articuloTexto =
            normalizarTexto(infraccion.articulo);

        const apartadoTexto =
            normalizarTexto(infraccion.apartado);

        const consultaLimpia =
            normalizarTexto(consulta)
                .replace(/\s+/g, "");

        if (!consultaLimpia) {
            return false;
        }

        if (
            codigo &&
            codigo.replace(/\s+/g, "") === consultaLimpia
        ) {
            return true;
        }

        if (
            id &&
            id.replace(/\s+/g, "") === consultaLimpia
        ) {
            return true;
        }

        if (
            articuloTexto &&
            articuloTexto.replace(/\s+/g, "") === consultaLimpia
        ) {
            return true;
        }

        if (
            apartadoTexto &&
            apartadoTexto.replace(/\s+/g, "") === consultaLimpia
        ) {
            return true;
        }

        return false;
    }

    function esCoincidenciaRelevante(infraccion, consulta) {

        if (!consulta) {
            return true;
        }

        /*
         * 1. Códigos y artículos.
         */
        if (
            esCoincidenciaCodigo(
                infraccion,
                consulta
            )
        ) {
            return true;
        }

        /*
         * 2. Drogas: búsqueda semántica controlada.
         *
         * El JSON actual contiene la conducta jurídica de los
         * apartados 36.16 a 36.19, pero no necesariamente nombres
         * de sustancias en palabrasClave. Por eso los términos
         * de drogas se vinculan explícitamente a esos apartados.
         */
        if (
            sinonimosDrogas.has(
                normalizarTexto(consulta)
            )
        ) {

            const articuloNumero =
                normalizarTexto(
                    infraccion.articulo
                );

            const apartadoNumero =
                normalizarTexto(
                    infraccion.apartado
                );

            if (
                articuloNumero === "36" &&
                apartadosDrogas.has(
                    apartadoNumero
                )
            ) {
                return true;
            }
        }

        /*
         * 3. Palabras clave reales del registro.
         * Coincidencia completa, nunca fragmentos.
         */
        const palabrasClave =
            Array.isArray(
                infraccion.palabrasClave
            )
                ? infraccion.palabrasClave
                : [];

        if (
            palabrasClave.some(
                palabra =>
                    esFraseExacta(
                        palabra,
                        consulta
                    )
            )
        ) {
            return true;
        }

        /*
         * 4. Título.
         */
        if (
            esFraseExacta(
                infraccion.titulo,
                consulta
            )
        ) {
            return true;
        }

        /*
         * 5. Conducta.
         */
        if (
            esFraseExacta(
                infraccion.conducta,
                consulta
            )
        ) {
            return true;
        }

        /*
         * 6. Ley.
         */
        if (
            esFraseExacta(
                infraccion.ley,
                consulta
            )
        ) {
            return true;
        }

        return false;
    }

    estado.resultados =
        estado.infracciones.filter(
            infraccion => {

                if (
                    gravedad &&
                    gravedad !== "todas" &&
                    gravedad !== "all" &&
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

                return esCoincidenciaRelevante(
                    infraccion,
                    texto
                );
            }
        );

    /*
     * Ordenación:
     * - código exacto primero;
     * - después palabras clave;
     * - después título/conducta.
     */
    if (texto) {

        estado.resultados.sort(
            (a, b) => {

                const aCodigo =
                    normalizarTexto(a.codigo);

                const bCodigo =
                    normalizarTexto(b.codigo);

                if (aCodigo === texto) {
                    return -1;
                }

                if (bCodigo === texto) {
                    return 1;
                }

                const aPalabras =
                    Array.isArray(a.palabrasClave)
                        ? a.palabrasClave
                        : [];

                const bPalabras =
                    Array.isArray(b.palabrasClave)
                        ? b.palabrasClave
                        : [];

                const aKeyword =
                    aPalabras.some(
                        palabra =>
                            esFraseExacta(
                                palabra,
                                texto
                            )
                    );

                const bKeyword =
                    bPalabras.some(
                        palabra =>
                            esFraseExacta(
                                palabra,
                                texto
                            )
                    );

                if (
                    aKeyword &&
                    !bKeyword
                ) {
                    return -1;
                }

                if (
                    bKeyword &&
                    !aKeyword
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
ESTADO DATOS — INICIO
============================================================ */

function actualizarEstadoInicioDatos() {

const elementos = {
    normativa: document.getElementById("homeNormativaStatus"),
    infracciones: document.getElementById("homeInfraccionesStatus"),
    ordenanzas: document.getElementById("homeOrdenanzasStatus")
};

if (elementos.normativa) {
    elementos.normativa.textContent = estado.normativa.length
        ? `OK · ${estado.normativa.length}`
        : "Sin datos";
}

if (elementos.infracciones) {
    elementos.infracciones.textContent = estado.infracciones.length
        ? `OK · ${estado.infracciones.length}`
        : "Sin datos";
}

if (elementos.ordenanzas) {
    elementos.ordenanzas.textContent = estado.ordenanzas.length
        ? `OK · ${estado.ordenanzas.length}`
        : "Sin datos";
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
