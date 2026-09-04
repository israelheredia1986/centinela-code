/* ============================================================
   CENTINELA CODE — BUSCADOR GLOBAL
   V3 — búsqueda semántica ampliada y comercio ambulante
   ============================================================ */
(function () {
  "use strict";

  const DATA_FILES = [
    ["Infracciones", "./data/infracciones.json"],
    ["Tráfico · infracciones", "./data/infracciones_trafico.json"],
    ["LOPSC", "./data/lopsc.json"],
    ["Código Penal", "./data/codigo_penal.json"],
    ["Menores", "./data/normativa_menores.json"],
    ["Violencia de género", "./data/normativa_violencia_genero.json"],
    ["Ordenanzas", "./data/ordenanzas.json"],
    ["Animales", "./data/normativa_animales.json"],
    ["Tráfico", "./data/normativa_trafico.json"],
    ["Ley 2/1986", "./data/ley_2_86.json"],
    ["LECrim", "./data/lecrim.json"],
    ["Extranjería", "./data/extranjeria.json"],
    ["Seguridad privada", "./data/seguridad_privada.json"],
    ["Espectáculos públicos", "./data/espectaculos_publicos.json"],
    ["Comercio ambulante", "./data/comercio_ambulante.json"],
    ["Medio ambiente y ruidos", "./data/medio_ambiente_ruidos.json"],
    ["Reglamento de armas", "./data/reglamento_armas.json"],
    ["Policías Locales Andalucía", "./data/policias_locales_andalucia.json"],
    ["Ley 39/2015", "./data/ley_39_2015.json"],
    ["Ley 7/1985", "./data/ley_7_1985.json"],
    ["Ley 5/2010 Andalucía", "./data/ley_5_2010_andalucia.json"]
  ];

  const STOP = new Set([
    "a","al","ante","bajo","con","contra","de","del","desde","durante",
    "el","en","entre","hacia","hasta","la","las","lo","los","para","por",
    "segun","sin","sobre","un","una","unos","unas","y","o","que"
  ]);

  const SYN = {
    ruido:["ruidos","sonido","musica","molestias","acustica","decibelios"],
    alcohol:["alcoholemia","bebida","bebidas","embriaguez","etilometro"],
    drogas:["estupefacientes","sustancias","narcoticos","psicotropicos"],
    arma:["armas","navaja","cuchillo","arma blanca","pistola","revolver"],
    agresion:["agredir","agresiones","golpear","lesiones","violencia","ataque"],
    desobediencia:["desobedecer","resistencia","obediencia","requerimiento"],
    seguro:["poliza","aseguramiento","soa","sin seguro"],
    carnet:["permiso","licencia","conducir","conduccion"],
    patinete:["vmp","vehiculo movilidad personal","vehiculo de movilidad personal"],
    animal:["animales","perro","perros","mascota","mascotas"],
    menor:["menores","niño","niña","adolescente"],
    comercio:["comercial","comercializacion","comercialización","venta","vender","vendedor","vendedora","mercancia","mercancía","mercaderia","mercadería"],
    ambulante:["ambulantes","ambulant","venta ambulante","vendedor ambulante","vendedora ambulante","comercio callejero","comercio itinerante","mercadillo","puesto ambulante"],
    mercadillo:["mercadillos","puesto","puestos","venta ambulante","vendedor ambulante","comercio ambulante"],
    vendedor:["vendedores","vendedora","vendedoras","comerciante","comerciantes","comercio","venta"],
    vender:["venta","vende","vendedor","vendedora","comercializar","comercializacion","comercialización","comercio"],
    venta:["vender","vende","vendedor","vendedora","comercializar","comercializacion","comercialización","comercio"],
    pescado:["pescados","pescadería","pescaderia","pescadero","pescadera","productos pesqueros","producto pesquero","marisco","mariscos","pez","peces","pesca"],
    pescados:["pescado","pescadería","pescaderia","pescadero","pescadera","productos pesqueros","marisco","pesca"],
    marisco:["mariscos","pescado","productos pesqueros","crustaceos","crustáceos","moluscos"],
    juguete:["juguetes","venta de juguetes","jugueteria","juguetería","producto infantil","productos infantiles"],
    juguetes:["juguete","venta de juguetes","jugueteria","juguetería","producto infantil","productos infantiles"],
    alimentacion:["alimentación","alimentario","alimentaria","alimentos","comida","productos alimenticios","pescado","marisco"],
    alimento:["alimentos","alimentación","alimentario","comida","productos alimenticios","pescado","marisco"],
    autorizacion:["autorización","autorizaciones","permiso","licencia","habilitación","habilitacion","autorizado","autorizada","no autorizado","sin autorización"],
    autorizaciones:["autorización","permiso","licencia","habilitación","autorizado","no autorizado"],
    permiso:["autorización","autorizaciones","licencia","habilitación","autorizado"],
    licencia:["autorización","permiso","habilitación","autorizado"],
    horario:["horarios","hora","apertura","cierre","horario permitido","fuera de horario"],
    horarios:["horario","hora","apertura","cierre","horario permitido","fuera de horario"],
    sancion:["sanción","sanciones","multa","multas","infracción","infracciones","castigo"],
    sanciones:["sanción","sancion","multa","multas","infracción","infracciones"],
    infraccion:["infracción","infracciones","sanción","sanciones","multa","incumplimiento"],
    infracciones:["infracción","sanción","sanciones","multa","incumplimiento"],
    factura:["facturas","comprobante","comprobantes","tique","ticket","justificante"],
    facturas:["factura","comprobante","comprobantes","tique","ticket","justificante"],
    precio:["precios","importe","coste","costes","tarifa"],
    precios:["precio","importe","coste","costes","tarifa"],
    placa:["placa identificativa","identificación","identificacion","distintivo"],
    identificativa:["identificativo","placa","identificación","identificacion"],
    decomiso:["decomisar","incautación","incautacion","incautar","aprehensión","aprehension"],
    incautacion:["incautación","incautar","decomiso","decomisar","aprehensión","aprehension"],
    talla:["talla mínima","talla inferior","tamaño mínimo","tamaño inferior","pescado pequeño"],
    veda:["vedado","época de veda","epoca de veda","prohibido","prohibición","prohibicion"],
    juguetes:["juguete","juguetería","jugueteria","productos infantiles","seguridad de juguetes"]
  };

  let indiceGlobal = [];
  let indiceInfracciones = [];
  let cargado = false;

  const norm = v => String(v == null ? "" : v)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const tokens = q => norm(q)
    .split(/[^a-z0-9.]+/)
    .filter(Boolean)
    .filter(x => !STOP.has(x));

  function esc(v) {
    return String(v == null ? "" : v).replace(/[&<>\'\"]/g, c => ({
      "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", "\"":"&quot;"
    }[c]));
  }

  function primitive(v) {
    return v != null && typeof v !== "object" ? String(v) : "";
  }

  function pick(o, names) {
    if (!o || typeof o !== "object" || Array.isArray(o)) return "";
    const entries = Object.entries(o);
    for (const wanted of names) {
      const exact = entries.find(([k]) => norm(k) === norm(wanted));
      if (exact) {
        const value = primitive(exact[1]);
        if (value) return value;
      }
    }
    return "";
  }

  function pickAmount(o) {
    if (!o || typeof o !== "object") return "";
    for (const key of ["sancion", "sanción", "multa"]) {
      const found = Object.entries(o).find(([k]) => norm(k) === norm(key));
      const val = found && found[1];
      if (val && typeof val === "object" && !Array.isArray(val)) {
        const min = val.min ?? val.minimo ?? val.importe_min;
        const max = val.max ?? val.maximo ?? val.importe_max;
        const moneda = val.moneda || "€";
        const fmt = n => typeof n === "number" ? n.toLocaleString("es-ES") : String(n);
        if (min != null && max != null) return min === max ? fmt(min)+" "+moneda : fmt(min)+" – "+fmt(max)+" "+moneda;
        if (min != null) return "desde " + fmt(min) + " " + moneda;
        if (max != null) return "hasta " + fmt(max) + " " + moneda;
      }
    }
    return pick(o, ["cuantia","cuantía","importe","importe_min","importe_max"]);
  }

  function flat(v, depth) {
    if (depth > 6 || v == null) return "";
    if (typeof v !== "object") return String(v);
    if (Array.isArray(v)) return v.slice(0, 50).map(x => flat(x, depth + 1)).join(" ");
    return Object.entries(v).slice(0, 80).map(([k,x]) => k + " " + flat(x, depth + 1)).join(" ");
  }

  function looksLikeInfraction(o, src, description, amount) {
    const keys = Object.keys(o).map(norm).join(" ");
    return /infracc/.test(norm(src)) ||
      !!amount ||
      /sancion|multa|cuantia|importe/.test(keys) ||
      (/conducta|tipificacion|tipificaci[oó]n/.test(keys) && /articulo|precepto|codigo/.test(keys)) ||
      (/gravedad/.test(keys) && !!description);
  }

  function makeRecord(o, src, path) {
    if (!o || typeof o !== "object" || Array.isArray(o)) return null;

    const code = pick(o, ["codigo","código"]);
    const id = pick(o, ["id"]);
    const article = pick(o, ["articulo","artículo","article","art","precepto"]);
    const apartado = pick(o, ["apartado","párrafo","parrafo","numero","número"]);
    const title = pick(o, ["titulo","título","title","denominacion","denominación","epigrafe","epígrafe","nombre","name","concepto"]);
    const description = pick(o, ["conducta","descripcion","descripción","description","texto","text","contenido","content","tipificacion","tipificación","hechos"]);
    const severity = pick(o, ["gravedad","severity","clasificacion","clasificación"]);
    const amount = pickAmount(o);

    const hasIdentity = !!(code || article || id || title || description);
    if (!hasIdentity) return null;

    const articleDisplay = article
      ? (apartado && !String(article).includes("." + apartado) ? String(article) + "." + apartado : String(article))
      : (/^\d+(?:\.\d+)+$/.test(code) ? code : "");

    if (!articleDisplay && !code && !description && (!title || /^(infracciones|normativa|datos|metadata)$/i.test(title))) return null;

    const inf = looksLikeInfraction(o, src, description, amount);
    const searchable = norm([
      src, code, id, articleDisplay, title, description, severity, amount, flat(o, 0)
    ].join(" "));

    return {
      source: src,
      path,
      code: code || "",
      id: id || "",
      article: articleDisplay || article || "",
      title: title || "",
      description: description || "",
      severity: severity || "",
      amount: amount || "",
      isInfraction: inf,
      raw: o,
      search: searchable
    };
  }

  function walk(value, src, path, out, depth) {
    if (depth > 10 || value == null) return;
    if (Array.isArray(value)) {
      value.forEach((item, i) => walk(item, src, path + "[" + i + "]", out, depth + 1));
      return;
    }
    if (typeof value !== "object") return;
    const record = makeRecord(value, src, path);
    if (record) out.push(record);
    Object.entries(value).forEach(([key, child]) => {
      if (child && typeof child === "object") walk(child, src, path + "." + key, out, depth + 1);
    });
  }

  async function cargarIndice() {
    if (cargado) return;
    const groups = await Promise.all(DATA_FILES.map(async ([src, url]) => {
      try {
        const response = await fetch(url, { cache: "no-cache" });
        if (!response.ok) throw new Error(String(response.status));
        const json = await response.json();
        const records = [];
        walk(json, src, "$", records, 0);
        return records;
      } catch (error) {
        console.warn("Buscador: no se pudo cargar", url, error);
        return [];
      }
    }));
    indiceGlobal = groups.flat();
    indiceInfracciones = indiceGlobal.filter(r => r.isInfraction);
    cargado = true;
  }

  function score(r, query) {
    const q = norm(query);
    const ts = tokens(query);
    const article = norm(r.article);
    const code = norm(r.code);
    const title = norm(r.title);
    const description = norm(r.description);
    const source = norm(r.source);
    const all = r.search;
    let score = 0;

    if (article === q) score += 1000;
    if (code === q) score += 950;
    if (article.replace(/\s/g, "") === q.replace(/\s/g, "")) score += 850;
    if (code.replace(/\s/g, "") === q.replace(/\s/g, "")) score += 800;
    if (article.includes(q)) score += 350;
    if (code.includes(q)) score += 330;
    if (title === q) score += 250;
    if (title.includes(q)) score += 100;
    if (source === q) score += 220;
    else if (source.includes(q)) score += 60;

    const law = q.match(/ley\s+(\d+)\s*\/\s*(\d{4})/);
    if (law) {
      const lawName = "ley " + law[1] + "/" + law[2];
      if (source === lawName) score += 500;
      else if (source.includes(lawName)) score += 300;
    }

    const numeric = ts.filter(x => /^\d+(?:\.\d+)*$/.test(x));
    numeric.forEach(x => {
      if (article === x) score += 700;
      if (code === x) score += 650;
      if (article.startsWith(x + ".")) score += 300;
      if (code.startsWith(x + ".")) score += 280;
    });

    const expanded = new Set(ts);
    ts.forEach(x => (SYN[x] || []).forEach(y => expanded.add(norm(y))));

    // Coincidencias por raíz: vendedor/vender/venta, ambulante/ambulantes, etc.
    const roots = [
      ["vendedor","vendedora","vendedores","vendedoras","vender","venta","ventas","comerciante","comerciantes","comercio"],
      ["ambulante","ambulantes","ambulant"],
      ["pescado","pescados","pescadero","pescadera","pescadería","pescaderia","pesquero","pesqueros"],
      ["juguete","juguetes","juguetería","jugueteria"],
      ["autorización","autorizaciones","autorizado","autorizada","autorizar"],
      ["sanción","sanciones","sancionar","sancion","multa","infracción","infracciones"],
      ["mercancía","mercancias","mercancia","mercaderia","mercadería"]
    ];
    roots.forEach(group => {
      const hit = group.some(term => ts.some(t => t === norm(term) || norm(term).startsWith(t) || t.startsWith(norm(term))));
      if (hit) group.forEach(term => expanded.add(norm(term)));
    });

    expanded.forEach(x => {
      if (article === x) score += 150;
      else if (article.includes(x)) score += 55;
      else if (code.includes(x)) score += 50;
      else if (title.includes(x)) score += 35;
      else if (description.includes(x)) score += 15;
      else if (all.includes(x)) score += 5;
    });

    const relevant = ts.filter(x => !STOP.has(x));
    if (relevant.length) {
      const hits = relevant.filter(x => all.includes(x)).length;
      score += Math.round((hits / relevant.length) * 90);
    }

    // Para consultas de comercio ambulante, premiamos los resultados que contienen
    // simultáneamente el ámbito y la conducta/producto buscado.
    const comercioQuery = /ambulant|mercadillo|vendedor|venta|comercio|pescad|juguet/.test(q);
    if (comercioQuery && /comercio ambulante|vendedor ambulante|mercadillo|venta ambulante/.test(all)) score += 120;
    if (/pescad/.test(q) && /pescad|pesquer|marisco/.test(all)) score += 160;
    if (/juguet/.test(q) && /juguet/.test(all)) score += 160;
    if (/autoriz/.test(q) && /autoriz/.test(all)) score += 100;
    if (/sanc|infracc|multa/.test(q) && /sanc|infracc|multa|grave|leve|muy grave/.test(all)) score += 120;

    return score;
  }

  function unique(records) {
    const seen = new Set();
    return records.filter(r => {
      const key = norm([r.source, r.article, r.code, r.title, r.description.slice(0, 160)].join("|"));
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function excerpt(text, query) {
    const textClean = String(text || "").replace(/\s+/g, " ").trim();
    if (!textClean) return "Sin descripción disponible.";
    const qTokens = tokens(query).filter(x => x.length > 2);
    const term = qTokens[0] || "";
    const pos = term ? norm(textClean).indexOf(term) : -1;
    if (pos > 90) return "…" + textClean.slice(pos - 80, pos + 420) + (textClean.length > pos + 420 ? "…" : "");
    return textClean.slice(0, 500) + (textClean.length > 500 ? "…" : "");
  }

  function navigate(section) {
    if (typeof window.activarSeccion === "function") {
      window.activarSeccion(section);
      return true;
    }
    const button = document.querySelector('.nav-item[data-section="' + section + '"]');
    if (!button) return false;
    button.click();
    return true;
  }

  function toast(text) {
    if (typeof window.mostrarToast === "function") window.mostrarToast(text);
  }

  function getActaCode(r) {
    return r.code || r.article || r.id || r.title || "";
  }

  function useInActa(r) {
    if (!r || !navigate("actas")) return;
    setTimeout(() => {
      const newButton = document.getElementById("newActaButton");
      if (newButton) newButton.click();
      setTimeout(() => {
        const input = document.getElementById("actaInfraccion");
        const amount = document.getElementById("actaCuantia");
        const preview = document.getElementById("actaInfraccionPreview");
        const code = getActaCode(r);
        if (input) {
          input.value = code;
          input.dispatchEvent(new Event("input", { bubbles: true }));
          input.dispatchEvent(new Event("change", { bubbles: true }));
        }
        if (amount && r.amount) {
          amount.value = r.amount;
          amount.dispatchEvent(new Event("input", { bubbles: true }));
        }
        if (preview) preview.textContent = r.description || r.title || code;
        toast("Infracción cargada en el acta");
      }, 150);
    }, 150);
  }

  function renderResults(results, query, onlyInfractions) {
    const zone = document.getElementById("bcResultsZone");
    if (!zone) return;
    if (!query.trim()) {
      zone.innerHTML = '<div class="bc-empty">Escribe una búsqueda para consultar la normativa.</div>';
      return;
    }
    if (!results.length) {
      zone.innerHTML = '<div class="bc-empty"><strong>Sin resultados</strong><span>No hemos encontrado coincidencias. Prueba con un artículo, palabra clave o código.</span></div>';
      return;
    }
    zone.innerHTML = '<div class="bc-results-head"><strong>' + results.length + ' resultado' + (results.length === 1 ? '' : 's') + '</strong><span>' + (onlyInfractions ? 'Solo infracciones' : 'Toda la normativa') + '</span></div>' + results.slice(0, 80).map((r, i) => {
      const badge = r.isInfraction ? '<span class="bc-badge inf">Infracción</span>' : '<span class="bc-badge">Normativa</span>';
      const article = r.article ? '<span class="bc-article">Art. ' + esc(r.article) + '</span>' : '';
      const amount = r.amount ? '<span class="bc-amount">' + esc(r.amount) + '</span>' : '';
      const action = r.isInfraction ? '<button type="button" class="bc-use-acta" data-index="' + i + '">Usar en acta</button>' : '';
      return '<article class="bc-result-card"><div class="bc-result-top"><div>' + article + '<h4>' + esc(r.title || r.description || r.code || 'Resultado') + '</h4></div>' + badge + '</div><div class="bc-source">' + esc(r.source) + '</div><p>' + esc(excerpt(r.description || r.title || r.code, query)) + '</p><div class="bc-result-bottom">' + amount + action + '</div></article>';
    }).join('');
    zone.querySelectorAll(".bc-use-acta").forEach(btn => {
      btn.addEventListener("click", () => useInActa(results[Number(btn.dataset.index)]));
    });
  }

  async function search(query, onlyInfractions) {
    await cargarIndice();
    const source = onlyInfractions ? indiceInfracciones : indiceGlobal;
    const q = norm(query);
    if (!q) return renderResults([], query, onlyInfractions);
    const results = unique(source.map(r => ({ ...r, _score: score(r, query) }))
      .filter(r => r._score > 0)
      .sort((a, b) => b._score - a._score));
    renderResults(results, query, onlyInfractions);
  }

  function mount() {
    const zone = document.getElementById("buscadorGlobalZone") || document.getElementById("consulta");
    if (!zone || document.getElementById("bcMainInput")) return;
    zone.innerHTML = '<div class="bc-search-card"><h3>¿Qué necesitas consultar?</h3><p>Busca en toda la normativa o exclusivamente en infracciones sancionables.</p><div class="bc-search-options"><button type="button" class="bc-search-option active" id="bcModeGlobal">📚 Toda la normativa</button><button type="button" class="bc-search-option inf" id="bcModeInf">⚠️ Solo infracciones</button></div><div class="bc-input-wrap"><span>⌕</span><input id="bcMainInput" type="search" autocomplete="off" placeholder="Ej.: vendedor ambulante, pescado, juguetes, art. 13.2…"></div></div>';
    zone.insertAdjacentHTML("beforeend", '<div id="bcResultsZone" class="bc-results-zone"><div class="bc-empty">Escribe una búsqueda para consultar la normativa.</div></div>');
    const input = document.getElementById("bcMainInput");
    const globalBtn = document.getElementById("bcModeGlobal");
    const infBtn = document.getElementById("bcModeInf");
    let onlyInfractions = false;
    const run = () => search(input.value, onlyInfractions);
    const setMode = infractions => {
      onlyInfractions = infractions;
      globalBtn.classList.toggle("active", !infractions);
      infBtn.classList.toggle("active", infractions);
      input.placeholder = infractions ? "Ej.: vendedor ambulante sin autorización, pescado, juguetes…" : "Ej.: vendedor ambulante, pescado, juguetes, art. 13.2…";
      run();
    };
    input.addEventListener("input", run);
    input.addEventListener("keydown", e => {
      if (e.key === "Enter") run();
    });
    globalBtn.addEventListener("click", () => setMode(false));
    infBtn.addEventListener("click", () => setMode(true));
  }

  window.CentinelaBuscador = {
    mount,
    cargarIndice,
    search: (query, onlyInfractions = false) => search(query, onlyInfractions)
  };

  document.addEventListener("DOMContentLoaded", mount);
  window.addEventListener("load", mount);
})();
