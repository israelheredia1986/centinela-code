// ============================================================================
// MÓDULO DE NORMATIVA REPARADO (Carga garantizada y Enlaces Oficiales BOE)
// ============================================================================

// 1. Base de Datos Oficial de Normativa
window.listaNormativas = [
  {
    id: "norma-001",
    titulo: "Ley Orgánica 4/2015, de 30 de marzo",
    subtitulo: "Protección de la Seguridad Ciudadana (LOPSC)",
    categoria: "Seguridad Ciudadana",
    descripcion: "Normativa sobre seguridad ciudadana, actuaciones policiales, documentación, identificaciones y régimen sancionador.",
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
    descripcion: "Normas de circulación para vehículos, peatones y animales, prioridades de paso y señalización vial.",
    url_oficial: "https://www.boe.es/buscar/act.php?id=BOE-A-2003-23514",
    favorito: false
  },
  {
    id: "norma-004",
    titulo: "Real Decreto 2822/1998, de 23 de diciembre",
    subtitulo: "Reglamento General de Vehículos (RGV)",
    categoria: "Tráfico",
    descripcion: "Condiciones técnicas de los vehículos, inspecciones, matriculación y equipamiento obligatorio.",
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
    descripcion: "Texto consolidado de delitos, penas y medidas de seguridad (Delitos contra la seguridad vial, atentado, desobediencia, etc.).",
    url_oficial: "https://www.boe.es/buscar/act.php?id=BOE-A-1995-25444",
    favorito: false
  },
  {
    id: "norma-007",
    titulo: "Ley 39/2015, de 1 de octubre",
    subtitulo: "Procedimiento Administrativo Común (LPAC)",
    categoria: "Administrativo",
    descripcion: "Regulación de las relaciones entre los ciudadanos y las Administraciones, validez de actos y notificaciones.",
    url_oficial: "https://www.boe.es/buscar/act.php?id=BOE-A-2015-10565",
    favorito: false
  },
  {
    id: "norma-008",
    titulo: "Real Decreto 137/1993, de 29 de enero",
    subtitulo: "Reglamento de Armas",
    categoria: "Seguridad Ciudadana",
    descripcion: "Clasificación, licencias, tenencia, uso y régimen sancionador sobre armas de fuego, blancas y sprays.",
    url_oficial: "https://www.boe.es/buscar/act.php?id=BOE-A-1993-6202",
    favorito: false
  }
];

/**
 * Localiza el contenedor del HTML independientemente del ID que se use en el HTML
 */
function obtenerContenedorNormativa() {
  return document.getElementById("contenedor-normativa") ||
         document.getElementById("normativas-container") ||
         document.getElementById("lista-normativa") ||
         document.querySelector(".normativas-grid") ||
         document.querySelector("#seccion-normativa .grid");
}

/**
 * Función principal para renderizar las normativas
 */
window.renderizarNormativas = function(lista = window.listaNormativas) {
  try {
    const contenedor = obtenerContenedorNormativa();
    
    if (!contenedor) {
      console.warn("⚠️ No se encontró el contenedor HTML para renderizar la normativa.");
      return;
    }

    contenedor.innerHTML = "";

    if (!lista || lista.length === 0) {
      contenedor.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 30px; opacity: 0.7;">
          <i class="fas fa-search fa-2x" style="margin-bottom: 10px;"></i>
          <p>No se encontraron normas que coincidan con la búsqueda.</p>
        </div>
      `;
      return;
    }

    lista.forEach(norma => {
      // Enlace a la ley oficial o fallback al buscador del BOE
      const urlEnlace = norma.url_oficial || norma.link || "https://www.boe.es/buscar/boe.php";

      const tarjetaHTML = `
        <article class="tarjeta-norma" id="card-${norma.id}">
          <div class="norma-header">
            <span class="badge-categoria">${norma.categoria || 'Normativa'}</span>
            <button class="btn-favorito ${norma.favorito ? 'activo' : ''}" 
                    onclick="window.toggleFavoritoNorma('${norma.id}')" 
                    type="button"
                    title="${norma.favorito ? 'Quitar de favoritos' : 'Añadir a favoritos'}">
              <i class="${norma.favorito ? 'fas' : 'far'} fa-star"></i>
            </button>
          </div>

          <div class="norma-cuerpo">
            <h3 class="norma-titulo">${norma.titulo}</h3>
            ${norma.subtitulo ? `<h4 class="norma-subtitulo">${norma.subtitulo}</h4>` : ''}
            <p class="norma-descripcion">${norma.descripcion}</p>
          </div>

          <div class="norma-footer">
            <a href="${urlEnlace}" 
               target="_blank" 
               rel="noopener noreferrer" 
               class="btn-boe-oficial">
              <i class="fas fa-external-link-alt"></i> Ver Ley Oficial (BOE)
            </a>
          </div>
        </article>
      `;

      contenedor.insertAdjacentHTML("beforeend", tarjetaHTML);
    });
  } catch (error) {
    console.error("❌ Error al renderizar la normativa:", error);
  }
};

/**
 * Alternar Estado de Favoritos
 */
window.toggleFavoritoNorma = function(idNorma) {
  const norma = window.listaNormativas.find(item => item.id === idNorma);
  if (norma) {
    norma.favorito = !norma.favorito;
    window.renderizarNormativas(window.listaNormativas);
  }
};

/**
 * Filtrar Normativas por buscador/categoría
 */
window.filtrarNormativas = function(textoBusqueda = "", categoriaSel = "todas") {
  const query = textoBusqueda.toLowerCase().trim();

  const filtradas = window.listaNormativas.filter(norma => {
    const coincideTexto = 
      (norma.titulo && norma.titulo.toLowerCase().includes(query)) ||
      (norma.subtitulo && norma.subtitulo.toLowerCase().includes(query)) ||
      (norma.descripcion && norma.descripcion.toLowerCase().includes(query));

    const coincideCategoria = (categoriaSel === "todas" || norma.categoria === categoriaSel);

    return coincideTexto && coincideCategoria;
  });

  window.renderizarNormativas(filtradas);
};

// 2. Inicialización Automática cuando carga la página
function inicializarModuloNormativa() {
  window.renderizarNormativas();

  // Escuchar eventos en buscadores comunes si existen en el HTML
  const inputBusqueda = document.getElementById("buscar-normativa") || 
                        document.getElementById("input-busqueda-norma") ||
                        document.querySelector(".input-busqueda-normativa");

  if (inputBusqueda) {
    inputBusqueda.addEventListener("input", (e) => {
      window.filtrarNormativas(e.target.value);
    });
  }
}

// Ejecución segura tras cargar la estructura HTML
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", inicializarModuloNormativa);
} else {
  inicializarModuloNormativa();
}
