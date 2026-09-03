/* ============================================================
   CENTINELA CODE — BUSCADOR GLOBAL
   V2 — resultados estructurados, sin volcado del JSON
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
    alcohol:["alcoholemia","bebida","embriaguez","etilometro"],
    drogas:["estupefacientes","sustancias","narcoticos","psicotropicos"],
    arma:["armas","navaja","cuchillo","arma blanca","pistola","revolver"],
    agresion:["agredir","agresiones","golpear","lesiones","violencia","ataque"],
    desobediencia:["desobedecer","resistencia","obediencia","requerimiento"],
    seguro:["poliza","aseguramiento","soa","sin seguro"],
    carnet:["permiso","licencia","conducir","conduccion"],
    patinete:["vmp","vehiculo movilidad personal","vehiculo de movilidad personal"],
    animal:["animales","perro","perros","mascota","mascotas"],
    menor:["menores","niño","niña","adolescente"]
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
    return String(v == null ? "" : v).replace(/[&<>\'"]/g, c => ({
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
    const values = norm(flat(o, 0));
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
    const title = pick(o, ["titulo","título","title","denominacion","denominación","epigrafe","epígrafe","nombre","name"]);
    const description = pick(o, ["conducta","descripcion","descripción","description","texto","text","contenido","content","tipificacion","tipificación","hechos"]);
    const severity = pick(o, ["gravedad","severity","clasificacion","clasificación"]);
    const amount = pickAmount(o);

    // NO indexamos contenedores como {infracciones:[...]} ni la cabecera
    // {version, fuente, ley, boe...}. Un resultado debe representar una
    // norma/artículo/infracción concreta y tener contenido propio.
    const hasIdentity = !!(code || article || id || title || description);
    if (!hasIdentity) return null;

    const articleDisplay = article
      ? (apartado && !String(article).includes("." + apartado) ? String(article) + "." + apartado : String(article))
      : (/^\d+(?:\.\d+)+$/.test(code) ? code : "");

    // Evita expresamente contenedores que tengan nombres genéricos pero
    // ningún artículo/código/texto propio.
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
      if (child && typeof child === "object") {
        walk(child, src, path + "." + key, out, depth + 1);
      }
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

    // Prioridad máxima para artículos/códigos exactos.
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
    expanded.forEach(x => {
      if (article === x) score += 150;
      else if (article.includes(x)) score += 55;
      else if (code.includes(x)) score += 50;
      else if (title.includes(x)) score += 35;
      else if (description.includes(x)) score += 10;
      else if (all.includes(x)) score += 3;
    });

    const relevant = ts.filter(x => !STOP.has(x));
    if (relevant.length) {
      const hits = relevant.filter(x => all.includes(x)).length;
      score += Math.round((hits / relevant.length) * 90);
    }

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
          amount.dispatchEvent(new Event("change", { bubbles: true }));
        }

        if (preview) {
          preview.classList.remove("hidden");
          preview.innerHTML =
            "<strong>" + esc(r.title || (r.article ? "Artículo " + r.article : "Normativa")) + "</strong>" +
            "<p style=\"margin:.35rem 0 0\">" + esc(r.source) +
            (r.article ? " · Art. " + esc(r.article) : "") +
            (r.severity ? " · " + esc(r.severity) : "") + "</p>";
        }

        toast("Normativa cargada en el acta. Revisa los datos antes de guardar.");
      }, 250);
    }, 120);
  }

  function showViewer(r) {
    if (!r || !navigate("normativa")) return;

    setTimeout(() => {
      const viewer = document.getElementById("normativaViewer");
      const content = document.getElementById("viewerContent");
      if (!viewer || !content) {
        toast("No se pudo abrir el visor de normativa.");
        return;
      }

      const title = document.getElementById("viewerTitle");
      const subtitle = document.getElementById("viewerSubtitle");
      if (title) title.textContent = r.article ? "Artículo " + r.article : (r.title || r.source);
      if (subtitle) subtitle.textContent = r.source + (r.title ? " · " + r.title : "");

      const severityKey = norm(r.severity).replace(/\s+/g, "");
      const severityClass = severityKey.includes("muygrave") ? "grav-muygrave" : severityKey.includes("grave") ? "grav-grave" : "grav-leve";
      const keywords = Array.isArray(r.raw && r.raw.palabrasClave) ? r.raw.palabrasClave.slice(0, 12) : [];
      const description = r.description || "Sin texto disponible.";

      content.innerHTML =
        '<div class="buscador-viewer-card">' +
          '<div class="viewer-result-badge">' + esc(r.isInfraction ? "INFRACCIÓN" : "NORMATIVA") + '</div>' +
          '<h3>' + esc(r.article ? "Artículo " + r.article : (r.title || r.source)) + '</h3>' +
          (r.title ? '<h4>' + esc(r.title) + '</h4>' : '') +
          '<div class="viewer-source-line">' + esc(r.source) + '</div>' +
          '<div class="viewer-chips">' +
            (r.severity ? '<span class="viewer-chip ' + severityClass + '">⚠ ' + esc(r.severity) + '</span>' : '') +
            (r.amount ? '<span class="viewer-chip amount">💶 ' + esc(r.amount) + '</span>' : '') +
          '</div>' +
          '<div class="viewer-body"><p>' + esc(description) + '</p></div>' +
          (keywords.length ? '<div class="viewer-keywords">' + keywords.map(k => '<span class="viewer-keyword">' + esc(k) + '</span>').join("") + '</div>' : '') +
          '<div class="viewer-actions" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:18px">' +
            '<button type="button" class="primary-button bc-view-use-acta">📝 Usar en acta</button>' +
            '<button type="button" class="secondary-button bc-view-back">← Volver a resultados</button>' +
          '</div>' +
        '</div>';

      viewer.classList.remove("hidden");
      viewer.style.display = "block";
      viewer.dataset.bcResult = JSON.stringify({
        source:r.source, code:r.code, id:r.id, article:r.article, title:r.title,
        description:r.description, severity:r.severity, amount:r.amount,
        isInfraction:r.isInfraction
      });

      requestAnimationFrame(() => {
        try { viewer.scrollIntoView({ behavior:"smooth", block:"start" }); }
        catch (_) { viewer.scrollIntoView(); }
      });
    }, 150);
  }

  function renderResults(container, count, results, query) {
    count.textContent = String(results.length);

    if (!results.length) {
      container.innerHTML = '<div class="bc-empty"><div>🔎</div><strong>No se han encontrado resultados</strong><span>Prueba con otro artículo, código, palabra o conducta.</span></div>';
      return;
    }

    container.innerHTML = results.slice(0, 40).map((r, index) =>
      '<article class="bc-result-card" data-result-index="' + index + '">' +
        '<div class="bc-result-top">' +
          '<span class="bc-result-type ' + (r.isInfraction ? 'is-infraction' : '') + '">' + (r.isInfraction ? 'INFRACCIÓN' : 'NORMATIVA') + '</span>' +
          '<span class="bc-result-source">' + esc(r.source) + '</span>' +
        '</div>' +
        '<div class="bc-result-article">' + (r.article ? 'Art. ' + esc(r.article) : (r.code ? 'Código ' + esc(r.code) : 'Normativa')) + '</div>' +
        (r.title ? '<h3>' + esc(r.title) + '</h3>' : '') +
        '<p>' + esc(excerpt(r.description, query)) + '</p>' +
        '<div class="bc-result-meta">' +
          (r.severity ? '<span>⚠ ' + esc(r.severity) + '</span>' : '') +
          (r.amount ? '<span>💶 ' + esc(r.amount) + '</span>' : '') +
        '</div>' +
        '<div class="bc-result-actions">' +
          '<button type="button" class="bc-view-btn">Ver</button>' +
          '<button type="button" class="primary bc-acta-btn">📝 Usar en acta</button>' +
        '</div>' +
      '</article>'
    ).join("");

    container.querySelectorAll(".bc-view-btn").forEach((button, index) => {
      button.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        showViewer(results[index]);
      });
    });

    container.querySelectorAll(".bc-acta-btn").forEach((button, index) => {
      button.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        useInActa(results[index]);
      });
    });
  }

  function search(query, onlyInfractions) {
    const q = norm(query);
    if (q.length < 2) return [];
    const base = onlyInfractions ? indiceInfracciones : indiceGlobal;
    return unique(base
      .map(record => ({ record, score: score(record, q) }))
      .filter(x => x.score > 0)
      .sort((a,b) => b.score - a.score)
      .map(x => x.record));
  }

  function installStyles() {
    if (document.getElementById("bcStyles")) return;
    const style = document.createElement("style");
    style.id = "bcStyles";
    style.textContent = `
      .bc-search-zone{margin:0 0 22px}
      .bc-search-card{border:1px solid rgba(148,163,184,.2);border-radius:18px;padding:17px;background:linear-gradient(145deg,rgba(15,23,42,.98),rgba(30,41,59,.82));box-shadow:0 8px 24px rgba(0,0,0,.16)}
      .bc-search-card h3{margin:0 0 5px;font-size:1.05rem;color:#f8fafc}
      .bc-search-card p{margin:0 0 12px;font-size:.78rem;color:#94a3b8;line-height:1.35}
      .bc-search-options{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px}
      .bc-search-option{border:1px solid #334155;border-radius:10px;padding:10px 8px;background:#0f172a;color:#cbd5e1;font-size:.78rem;font-weight:700}
      .bc-search-option.active{border-color:#3b82f6;background:#1d4ed8;color:#fff}
      .bc-search-option.inf.active{border-color:#f59e0b;background:#b45309;color:#fff}
      .bc-input-wrap{display:flex;align-items:center;gap:8px;border:1px solid #334155;border-radius:11px;background:#0f172a;padding:0 10px}
      .bc-input-wrap input{width:100%;border:0!important;outline:0!important;background:transparent!important;color:#fff!important;padding:11px 2px!important;font-size:.92rem}
      .bc-results-zone{margin-bottom:20px}
      .bc-results-zone.hidden{display:none}
      .bc-results-title{display:flex;justify-content:space-between;margin:8px 2px 10px;color:#cbd5e1;font-size:.82rem}
      .bc-results-title strong{color:#60a5fa}
      .bc-results-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
      .bc-result-card{border:1px solid rgba(148,163,184,.15);border-radius:14px;padding:13px;background:rgba(15,23,42,.7)}
      .bc-result-top{display:flex;justify-content:space-between;gap:8px}
      .bc-result-type{font-size:.62rem;font-weight:800;color:#60a5fa}
      .bc-result-type.is-infraction{color:#fbbf24}
      .bc-result-source{font-size:.62rem;color:#64748b;text-align:right}
      .bc-result-article{margin-top:7px;color:#60a5fa;font-size:.72rem;font-weight:800}
      .bc-result-card h3{margin:4px 0 6px;color:#f8fafc;font-size:.9rem;line-height:1.35}
      .bc-result-card p{margin:0;color:#94a3b8;font-size:.72rem;line-height:1.5}
      .bc-result-meta{display:flex;gap:8px;flex-wrap:wrap;margin-top:9px;font-size:.65rem;color:#a5b4fc}
      .bc-result-actions{display:flex;gap:7px;margin-top:11px}
      .bc-result-actions button{flex:1;border:1px solid #334155;background:#1e293b;color:#e2e8f0;border-radius:8px;padding:8px;font-size:.72rem}
      .bc-result-actions button.primary{border-color:#2563eb;background:#1d4ed8;color:#fff}
      .bc-empty{padding:24px;text-align:center;border:1px dashed #334155;border-radius:14px;color:#94a3b8}
      .bc-empty strong,.bc-empty span{display:block;margin-top:6px}
      .buscador-viewer-card{padding:4px}
      .buscador-viewer-card h3{margin:2px 0 3px;color:#f8fafc;font-size:1.25rem;line-height:1.3}
      .buscador-viewer-card h4{color:#93c5fd;margin:.15rem 0 1rem;font-weight:600;font-size:1rem;line-height:1.4}
      .buscador-viewer-card .viewer-source-line{margin:0 0 14px;font-size:.78rem;color:#64748b}
      .buscador-viewer-card .viewer-chips{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 16px}
      .viewer-chip{display:inline-flex;align-items:center;gap:5px;padding:5px 11px;border-radius:999px;font-size:.72rem;font-weight:700;border:1px solid transparent}
      .viewer-chip.grav-leve{background:rgba(59,130,246,.15);color:#93c5fd;border-color:rgba(59,130,246,.35)}
      .viewer-chip.grav-grave{background:rgba(249,115,22,.15);color:#fdba74;border-color:rgba(249,115,22,.35)}
      .viewer-chip.grav-muygrave{background:rgba(239,68,68,.15);color:#fca5a5;border-color:rgba(239,68,68,.35)}
      .viewer-chip.amount{background:rgba(16,185,129,.14);color:#6ee7b7;border-color:rgba(16,185,129,.32)}
      .buscador-viewer-card .viewer-body{border:1px solid rgba(148,163,184,.16);border-radius:14px;background:rgba(15,23,42,.65);padding:16px}
      .buscador-viewer-card .viewer-body p{margin:0;line-height:1.75;color:#dbe4f0;white-space:pre-wrap;font-size:.94rem}
      .buscador-viewer-card .viewer-keywords{display:flex;flex-wrap:wrap;gap:6px;margin-top:16px}
      .viewer-keyword{padding:4px 9px;border-radius:8px;background:rgba(148,163,184,.1);color:#94a3b8;font-size:.68rem;border:1px solid rgba(148,163,184,.18)}
      .viewer-result-badge{display:inline-block;font-size:.65rem;font-weight:800;color:#60a5fa;margin-bottom:8px;letter-spacing:.04em}
      #normativaViewer{scroll-margin-top:15px}
      @media(max-width:760px){.bc-results-list{grid-template-columns:1fr}.bc-search-card{padding:14px}}
    `;
    document.head.appendChild(style);
  }

  function buildUI() {
    const section = document.getElementById("section-consulta");
    if (!section || document.getElementById("bcSearchZone")) return;

    [section.querySelector(".search-box"), section.querySelector(".filters"), section.querySelector(".results-header"), document.getElementById("consultaResults")]
      .forEach(el => { if (el) el.style.display = "none"; });

    const pageTitle = section.querySelector(".page-title");
    const zone = document.createElement("div");
    zone.id = "bcSearchZone";
    zone.className = "bc-search-zone";
    zone.innerHTML = '<div class="bc-search-card"><h3>🔎 Buscador de Centinela</h3><p>Busca en toda la normativa o exclusivamente en infracciones sancionables.</p><div class="bc-search-options"><button type="button" class="bc-search-option active" id="bcModeGlobal">📚 Toda la normativa</button><button type="button" class="bc-search-option inf" id="bcModeInf">⚠️ Solo infracciones</button></div><div class="bc-input-wrap"><span>⌕</span><input id="bcMainInput" type="search" autocomplete="off" placeholder="Ej.: 117 ley 7/1985, desobediencia, art. 36.16…"></div></div>';
    if (pageTitle) pageTitle.insertAdjacentElement("afterend", zone); else section.prepend(zone);

    const resultsZone = document.createElement("div");
    resultsZone.id = "bcResultsZone";
    resultsZone.className = "bc-results-zone hidden";
    resultsZone.innerHTML = '<div class="bc-results-title"><span id="bcResultsLabel">Resultados</span><strong id="bcResultsCount">0</strong></div><div class="bc-results-list" id="bcResultsList"></div>';
    zone.insertAdjacentElement("afterend", resultsZone);

    const input = document.getElementById("bcMainInput");
    const globalButton = document.getElementById("bcModeGlobal");
    const infraButton = document.getElementById("bcModeInf");
    const list = document.getElementById("bcResultsList");
    const count = document.getElementById("bcResultsCount");
    const label = document.getElementById("bcResultsLabel");
    let onlyInfractions = false;
    let timer;

    const run = () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        const query = input.value.trim();
        if (query.length < 2) {
          resultsZone.classList.add("hidden");
          return;
        }
        await cargarIndice();
        const results = search(query, onlyInfractions);
        label.textContent = (onlyInfractions ? "Infracciones para «" : "Resultados globales para «") + query + "»";
        resultsZone.classList.remove("hidden");
        renderResults(list, count, results, query);
      }, 100);
    };

    const setMode = infractions => {
      onlyInfractions = infractions;
      globalButton.classList.toggle("active", !infractions);
      infraButton.classList.toggle("active", infractions);
      input.placeholder = infractions ? "Ej.: alcohol, arma, ruido, seguro…" : "Ej.: 117 ley 7/1985, desobediencia, art. 36.16…";
      if (input.value.trim().length >= 2) run();
    };

    globalButton.addEventListener("click", () => setMode(false));
    infraButton.addEventListener("click", () => setMode(true));
    input.addEventListener("input", run);
    input.addEventListener("keydown", e => {
      if (e.key === "Enter") { e.preventDefault(); run(); }
    });
  }

  function installViewerDelegation() {
    if (document.documentElement.dataset.centFixNormativa === "3") return;
    document.documentElement.dataset.centFixNormativa = "3";

    document.addEventListener("click", event => {
      const useButton = event.target.closest(".bc-view-use-acta");
      if (useButton) {
        event.preventDefault();
        event.stopPropagation();
        const viewer = document.getElementById("normativaViewer");
        let record = null;
        try { record = JSON.parse(viewer?.dataset.bcResult || "null"); } catch (_) {}
        if (record) useInActa(record);
        return;
      }

      const backButton = event.target.closest(".bc-view-back");
      if (backButton) {
        event.preventDefault();
        event.stopPropagation();
        const viewer = document.getElementById("normativaViewer");
        if (viewer) {
          viewer.classList.add("hidden");
          viewer.style.display = "";
        }
        return;
      }

      // No interferimos con la navegación nativa de Normativa. Si app.js
      // expone abrirNormativa, dejamos que su propio sistema gestione el botón.
    }, true);
  }

  async function init() {
    installStyles();
    buildUI();
    installViewerDelegation();
    try { await cargarIndice(); } catch (e) { console.warn("Buscador no disponible", e); }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once:true });
  else init();
})();
