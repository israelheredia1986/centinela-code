// ============================================================================
// MÓDULO DE NORMATIVA CON ENLACES DIRECTOS A BOE / LEYES OFICIALES
// ============================================================================

// Base de datos / Estado local de Normativas (ampliada con 'url_oficial')
const baseDatosNormativa = [
  {
    id: "norma-001",
    titulo: "Ley Orgánica 4/2015, de 30 de marzo",
    subtitulo: "Protección de la Seguridad Ciudadana (LOPSC)",
    categoria: "Seguridad Ciudadana",
    descripcion: "Normativa reguladora de los derechos y deberes en materia de seguridad ciudadana, actuaciones policiales y régimen sancionador.",
    url_oficial: "https://www.boe.es/buscar/act.php?id=BOE-A-2015-3442",
    favorito: false
  },
  {
    id: "norma-002",
    titulo: "Real Decreto Legislativo 6/2015, de 30 de octubre",
    subtitulo: "Ley sobre Tráfico, Circulación de Vehículos y Seguridad Vial",
    categoria: "Tráfico",
    descripcion: "Texto refundido que regula la circulación de vehículos, permisos, infracciones, sanciones y retirada de puntos.",
    url_oficial: "https://www.boe.es/buscar/act.php?id=BOE-A-2015-11722",
    favorito: false
  },
  {
    id: "norma-003",
    titulo: "Real Decreto 1428/2003, de 21 de noviembre",
    subtitulo: "Reglamento General de Circulación (RGC)",
    categoria: "Tráfico",
    descripcion: "Normas de circulación para vehículos, peatones y animales, señalización y prioridad de paso.",
    url_oficial: "https://www.boe.es/buscar/act.php?id=BOE-A-2003-23514",
    favorito: false
  },
  {
    id: "norma-004",
    titulo: "Real Decreto 2822/1998, de 23 de diciembre",
    subtitulo: "Reglamento General de Vehículos (RGV)",
    categoria: "Tráfico",
    descripcion: "Condiciones técnicas de los vehículos, matriculación, homologación y documentación obligatoria.",
    url_oficial: "https://www.boe.es/buscar/act.php?id=BOE-A-1999-1826",
    favorito: false
  },
  {
    id: "norma-005",
    titulo: "Real Decreto 818/2009, de 8 de mayo",
    subtitulo: "Reglamento General de Conductores",
    categoria: "Tráfico",
    descripcion: "Requisitos para la obtención, renovación y clases de permisos y licencias de conducción.",
    url_oficial: "https://www.boe.es/buscar/act.php?id=BOE-A-2009-9481",
    favorito: false
  },
  {
    id: "norma-006",
    titulo: "Ley Orgánica 10/1995, de 23 de noviembre",
    subtitulo: "Código Penal (CP)",
    categoria: "Penal",
    descripcion: "Texto consolidado de delitos, penas y medidas de seguridad (Delitos contra la seguridad vial, atentado, etc.).",
    url_oficial: "https://www.boe.es/buscar/act.php?id=BOE-A-1995-25444",
    favorito: false
  },
  {
    id: "norma-007",
    titulo: "Ley 39/2015, de 1 de octubre",
    subtitulo: "Procedimiento Administrativo Común de las Administraciones Públicas (LPAC)",
    categoria: "Administrativo",
    descripcion: "Regulación de las relaciones entre los ciudadanos y las Administraciones, actos y notificaciones.",
    url_oficial: "https://www.boe.es/buscar/act.php?id=BOE-A-2015-10565",
    favorito: false
  }
];

/**
 * Función principal para renderizar las normativas en el contenedor HTML
 * @param {Array} lista - Array de objetos de normativa
 * @param {string} contenedorId - ID del contenedor HTML (por defecto 'contenedor-normativa')
 */
function renderizarNormativas(lista = baseDatosNormativa, contenedorId = "contenedor-normativa") {
  const contenedor = document.getElementById(contenedorId);
  if (!contenedor) return;

  contenedor.innerHTML = "";

  if (lista.length === 0) {
    contenedor.innerHTML = `
      <div class="sin-resultados">
        <i class="fas fa-search"></i>
        <p>No se encontraron normas que coincidan con la búsqueda.</p>
      </div>
    `;
    return;
  }

  lista.forEach(norma => {
    // Si no tiene URL oficial definida, redirige al buscador principal del BOE
    const urlEnlace = norma.url_oficial || "https://www.boe.es/buscar/boe.php";

    const tarjetaHTML = `
      <article class="tarjeta-norma" id="card-${norma.id}">
        <div class="norma-header">
          <span class="badge badge-categoria">${norma.categoria}</span>
          <button class="btn-favorito ${norma.favorito ? 'activo' : ''}" 
                  onclick="toggleFavoritoNorma('${norma.id}')" 
                  title="${norma.favorito ? 'Quitar de favoritos' : 'Añadir a favoritos'}">
            <i class="${norma.favorito ? 'fas' : 'far'} fa-star"></i>
          </button>
        </div>

        <div class="norma-cuerpo">
          <h3 class="norma-titulo">${norma.titulo}</h3>
          <h4 class="norma-subtitulo">${norma.subtitulo}</h4>
          <p class="norma-descripcion">${norma.descripcion}</p>
        </div>

        <div class="norma-footer">
          <!-- BOTÓN DIRECTO A LA LEY OFICIAL EN EL BOE -->
          <a href="${urlEnlace}" 
             target="_blank" 
             rel="noopener noreferrer" 
             class="btn-boe-oficial"
             title="Abrir publicación oficial consolidada en el BOE">
            <i class="fas fa-book-open"></i> Ver Texto Oficial (BOE)
            <i class="fas fa-external-link-alt icono-externo"></i>
          </a>
        </div>
      </article>
    `;

    contenedor.insertAdjacentHTML("beforeend", tarjetaHTML);
  });
}

/**
 * Función para alternar el estado de favorito de una norma
 * @param {string} idNorma 
 */
function toggleFavoritoNorma(idNorma) {
  const norma = baseDatosNormativa.find(item => item.id === idNorma);
  if (norma) {
    norma.favorito = !norma.favorito;
    renderizarNormativas(baseDatosNormativa);
  }
}

/**
 * Función para filtrar normativas por término de búsqueda y categoría
 */
function filtrarNormativas(textoBusqueda = "", categoriaSel = "todas") {
  const query = textoBusqueda.toLowerCase().trim();

  const filtradas = baseDatosNormativa.filter(norma => {
    const coincideTexto = 
      norma.titulo.toLowerCase().includes(query) ||
      norma.subtitulo.toLowerCase().includes(query) ||
      norma.descripcion.toLowerCase().includes(query);

    const coincideCategoria = (categoriaSel === "todas" || norma.categoria === categoriaSel);

    return coincideTexto && coincideCategoria;
  });

  renderizarNormativas(filtradas);
}

// Inicializar la carga al cargar el DOM
document.addEventListener("DOMContentLoaded", () => {
  renderizarNormativas(baseDatosNormativa);
});
