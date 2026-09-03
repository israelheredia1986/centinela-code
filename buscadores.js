/* ============================================================
   CENTINELA CODE — BUSCADORES Y ACCIONES DE NORMATIVA
   Versión reparada: botones Ver / Usar en acta operativos
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

  function valueString(v) {
    if (v == null) return "";
    if (typeof v !== "object") return String(v);
    if (Array.isArray(v)) return v.slice(0, 100).map(valueString).join(" ");
    return Object.entries(v).slice(0, 100).map(([k, x]) => k + " " + valueString(x)).join(" ");
  }

  function pick(o, names) {
    if (!o || typeof o !== "object") return "";
    const e = Object.entries(o);
    for (const n of names) {
      const h = e.find(([k]) => norm(k) === norm(n));
      if (h && h[1] != null && typeof h[1] !== "object") return String(h[1]);
    }
    for (const n of names) {
      const h = e.find(([k]) => norm(k).includes(norm(n)));
      if (h && h[1] != null && typeof h[1] !== "object") return String(h[1]);
    }
    return "";
  }

  function isInf(o, src) {
    if (!o || typeof o !== "object" || Array.isArray(o)) return false;
    const k = Object.keys(o).map(norm).join(" ");
    const v = valueString(o).toLowerCase();
    return /infracc/.test(norm(src)) ||
      /sancion|multa|cuantia|importe/.test(k) ||
      (/articulo|art|precepto|codigo/.test(k) && /conducta|hechos|descripcion|infraccion|tipificacion/.test(k)) ||
      (/articulo|art|precepto/.test(k) && /leve|grave|muy grave|gravedad/.test(v));
  }

  function walk(v, src, path, out, depth) {
    if (depth > 9 || v == null) return;
    if (Array.isArray(v)) {
      v.forEach((x, i) => walk(x, src, path + "[" + i + "]", out, depth + 1));
      return;
    }
    if (typeof v !== "object") return;

    const flat = valueString(v);
    const article = pick(v, ["articulo","artículo","article","art","precepto","codigo","código","numero","número"]);
    const title = pick(v, ["titulo","título","title","nombre","name","denominacion","denominación","epigrafe","epígrafe"]);
    const desc = pick(v, ["descripcion","descripción","description","texto","text","contenido","content","conducta","hechos","tipificacion","tipificación"]);
    const severity = pick(v, ["gravedad","severity","tipo","clasificacion","clasificación"]);
    const amount = pick(v, ["cuantia","cuantía","importe","importe_min","importe_max","multa","sancion","sanción"]);
    const inf = isInf(v, src);

    if (article || title || desc || inf) {
      out.push({
        source: src,
        path,
        article: article || "",
        title: title || "",
        description: desc || flat.slice(0, 6000),
        severity: severity || "",
        amount: amount || "",
        isInfraction: inf,
        raw: v,
        search: norm([src, article, title, desc, severity, amount, flat].join(" "))
      });
    }

    Object.entries(v).forEach(([k, x]) => {
      if (x && typeof x === "object") walk(x, src, path + "." + k, out, depth + 1);
    });
  }

  async function cargarIndice() {
    if (cargado) return;
    const rs = await Promise.all(DATA_FILES.map(async ([src, url]) => {
      try {
        const r = await fetch(url, { cache: "no-cache" });
        if (!r.ok) throw new Error(String(r.status));
        const out = [];
        walk(await r.json(), src, "$", out, 0);
        return out;
      } catch (e) {
        console.warn("Buscadores: no se pudo cargar", url, e);
        return [];
      }
    }));
    indiceGlobal = rs.flat();
    indiceInfracciones = indiceGlobal.filter(x => x.isInfraction);
    cargado = true;
  }

  function score(r, q) {
    const nq = norm(q), ts = tokens(q);
    const a = norm(r.article), t = norm(r.title), d = norm(r.description), s = norm(r.source), all = r.search;
    let n = 0;
    if (a === nq) n += 300;
    if (a.replace(/\s/g, "") === nq.replace(/\s/g, "")) n += 260;
    if (t === nq) n += 180;
    if (a.includes(nq)) n += 100;
    if (t.includes(nq)) n += 70;
    if (s === nq) n += 180;
    else if (s.includes(nq)) n += 50;

    const law = nq.match(/ley\s+(\d+)\s*\/\s*(\d{4})/);
    if (law) {
      const x = "ley " + law[1] + "/" + law[2];
      if (s === x) n += 400;
      else if (s.includes(x)) n += 250;
    }

    ts.filter(x => /^\d+(?:\.\d+)*$/.test(x)).forEach(x => {
      if (a === x) n += 350;
      else if (a.startsWith(x + " ")) n += 180;
    });

    const ex = new Set(ts);
    ts.forEach(x => (SYN[x] || []).forEach(y => ex.add(norm(y))));
    ex.forEach(x => {
      if (a === x) n += 120;
      else if (a.includes(x)) n += 35;
      else if (t.includes(x)) n += 25;
      else if (d.includes(x)) n += 8;
      else if (all.includes(x)) n += 3;
    });

    const relevant = ts.filter(x => !STOP.has(x));
    if (relevant.length) {
      const hits = relevant.filter(x => all.includes(x)).length;
      n += Math.round(hits / relevant.length * 80);
    }
    return n;
  }

  function esc(v) {
    return String(v == null ? "" : v).replace(/[&<>\'"]/g, c => ({
      "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", "\"":"&quot;"
    }[c]));
  }

  function excerpt(text, q) {
    const c = String(text || "").replace(/\s+/g, " ").trim();
    const term = tokens(q).find(x => x.length > 2) || "";
    const i = term ? norm(c).indexOf(term) : -1;
    return i > 80 ? "…" + c.slice(i - 80, i + 420) + "…" : c.slice(0, 500) + (c.length > 500 ? "…" : "");
  }

  function unique(a) {
    const s = new Set();
    return a.filter(r => {
      const k = norm(r.source + "|" + r.article + "|" + r.title + "|" + r.description.slice(0, 180));
      if (s.has(k)) return false;
      s.add(k);
      return true;
    });
  }

  function navigate(section) {
    const el = document.querySelector('[data-section="' + section + '"]');
    if (!el) return false;
    el.click();
    return true;
  }

  function toast(text) {
    if (typeof window.mostrarToast === "function") window.mostrarToast(text);
  }

  function obtenerCodigoParaActa(r) {
    const raw = r && r.raw ? r.raw : {};
    return r.article || raw.codigo || raw.id || r.title || "";
  }

  function useInActa(r) {
    if (!r) return;
    if (!navigate("actas")) return;

    setTimeout(() => {
      const nueva = document.getElementById("newActaButton");
      if (nueva) nueva.click();

      setTimeout(() => {
        const input = document.getElementById("actaInfraccion");
        const cuantia = document.getElementById("actaCuantia");
        const autoridad = document.getElementById("actaAutoridad");
        const preview = document.getElementById("actaInfraccionPreview");
        const codigo = obtenerCodigoParaActa(r);

        if (input) {
          input.value = codigo;
          input.dispatchEvent(new Event("input", { bubbles: true }));
          input.dispatchEvent(new Event("change", { bubbles: true }));
        }
        if (cuantia && r.amount) cuantia.value = r.amount;

        if (preview) {
          preview.classList.remove("hidden");
          preview.innerHTML =
            "<strong>" + esc(r.title || r.description.slice(0, 180)) + "</strong>" +
            "<p style=\"margin:.35rem 0 0\">" + esc(r.source) +
            (r.article ? " · Art. " + esc(r.article) : "") +
            (r.severity ? " · " + esc(r.severity) : "") + "</p>";
        }

        toast("Normativa cargada en el acta. Revisa los datos antes de guardar.");
      }, 250);
    }, 120);
  }

  function showViewer(r) {
    if (!r) return;
    if (!navigate("normativa")) return;

    setTimeout(() => {
      const v = document.getElementById("normativaViewer");
      const c = document.getElementById("viewerContent");
      if (!v || !c) {
        toast("No se pudo abrir el visor de normativa.");
        return;
      }

      const t = document.getElementById("viewerTitle");
      const s = document.getElementById("viewerSubtitle");
      if (t) t.textContent = r.title || r.source || "Normativa";
      if (s) s.textContent = r.source + (r.article ? " · Art. " + r.article : "");

      const texto = r.description || valueString(r.raw) || "Sin texto disponible.";
      const codigo = obtenerCodigoParaActa(r);

      c.innerHTML =
        '<div class="buscador-viewer-card">' +
          '<div class="viewer-result-badge">' + esc(r.isInfraction ? "INFRACCIÓN" : "NORMATIVA") + '</div>' +
          '<h3>' + esc(r.article ? "Artículo " + r.article : (r.title || r.source)) + '</h3>' +
          (r.title && r.article ? '<h4>' + esc(r.title) + '</h4>' : '') +
          '<p>' + esc(texto) + '</p>' +
          (r.severity ? '<p><strong>Gravedad:</strong> ' + esc(r.severity) + '</p>' : '') +
          (r.amount ? '<p><strong>Sanción / cuantía:</strong> ' + esc(r.amount) + '</p>' : '') +
          '<div class="viewer-actions" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:16px">' +
            '<button type="button" class="primary-button bc-view-use-acta" data-code="' + esc(codigo) + '">📝 Usar en acta</button>' +
            '<button type="button" class="secondary-button bc-view-back">← Volver a resultados</button>' +
          '</div>' +
        '</div>';

      v.classList.remove("hidden");
      v.style.display = "block";
      v.setAttribute("tabindex", "-1");
      v.dataset.bcSource = r.source || "";
      v.dataset.bcArticle = r.article || "";
      v.dataset.bcTitle = r.title || "";
      v.dataset.bcDescription = texto;
      v.dataset.bcSeverity = r.severity || "";
      v.dataset.bcAmount = r.amount || "";

      requestAnimationFrame(() => requestAnimationFrame(() => {
        try { v.scrollIntoView({ behavior: "smooth", block: "start" }); }
        catch (_) { v.scrollIntoView(); }
      }));
    }, 180);
  }

  function render(container, count, results, q) {
    count.textContent = results.length;
    if (!results.length) {
      container.innerHTML = '<div class="bc-empty"><div>🔎</div><strong>No se han encontrado resultados</strong><span>Prueba con otra palabra, artículo, código o conducta.</span></div>';
      return;
    }

    container.innerHTML = results.slice(0, 40).map((r, i) =>
      '<article class="bc-result-card" data-result-index="' + i + '">' +
        '<div class="bc-result-top"><span class="bc-result-type ' + (r.isInfraction ? 'is-infraction' : '') + '">' +
          (r.isInfraction ? 'INFRACCIÓN' : 'NORMATIVA') + '</span><span class="bc-result-source">' + esc(r.source) + '</span></div>' +
        '<h3>' + esc(r.article ? 'Art. ' + r.article : (r.title || r.source)) + '</h3>' +
        (r.title && r.article ? '<div class="bc-result-title">' + esc(r.title) + '</div>' : '') +
        '<p>' + esc(excerpt(r.description, q)) + '</p>' +
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

    [...container.querySelectorAll(".bc-view-btn")].forEach((b, i) =>
      b.addEventListener("click", e => {
        e.preventDefault(); e.stopPropagation(); showViewer(results[i]);
      })
    );

    [...container.querySelectorAll(".bc-acta-btn")].forEach((b, i) =>
      b.addEventListener("click", e => {
        e.preventDefault(); e.stopPropagation(); useInActa(results[i]);
      })
    );
  }

  function search(q, onlyInfraction) {
    const n = norm(q);
    if (n.length < 2) return [];
    const base = onlyInfraction ? indiceInfracciones : indiceGlobal;
    return unique(base
      .map(r => ({ r, s: score(r, n) }))
      .filter(x => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .map(x => x.r));
  }

  function styles() {
    if (document.getElementById("bcStyles")) return;
    const st = document.createElement("style");
    st.id = "bcStyles";
    st.textContent = `
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
      .bc-result-card h3{margin:7px 0 4px;color:#f8fafc;font-size:.9rem}
      .bc-result-title{font-size:.72rem;color:#93c5fd;margin-bottom:6px}
      .bc-result-card p{color:#94a3b8;font-size:.72rem;line-height:1.4}
      .bc-result-meta{display:flex;gap:8px;flex-wrap:wrap;font-size:.65rem;color:#a5b4fc}
      .bc-result-actions{display:flex;gap:7px;margin-top:10px}
      .bc-result-actions button{flex:1;border:1px solid #334155;background:#1e293b;color:#e2e8f0;border-radius:8px;padding:8px;font-size:.72rem}
      .bc-result-actions button.primary{border-color:#2563eb;background:#1d4ed8;color:#fff}
      .bc-empty{padding:24px;text-align:center;border:1px dashed #334155;border-radius:14px;color:#94a3b8}
      .buscador-viewer-card{padding:4px}
      .buscador-viewer-card h3{margin-top:6px;color:#f8fafc}
      .buscador-viewer-card h4{color:#93c5fd;margin:.4rem 0 1rem}
      .buscador-viewer-card p{line-height:1.65;color:#cbd5e1;white-space:pre-wrap}
      .viewer-result-badge{display:inline-block;font-size:.65rem;font-weight:800;color:#60a5fa;margin-bottom:8px}
      #normativaViewer{scroll-margin-top:15px}
      .bc-view-use-acta{cursor:pointer!important;pointer-events:auto!important}
      @media(max-width:760px){.bc-results-list{grid-template-columns:1fr}.bc-search-card{padding:14px}}
    `;
    document.head.appendChild(st);
  }

  function ui() {
    const sec = document.getElementById("section-consulta");
    if (!sec || document.getElementById("bcSearchZone")) return;

    [sec.querySelector(".search-box"), sec.querySelector(".filters"), sec.querySelector(".results-header"), document.getElementById("consultaResults")]
      .forEach(x => { if (x) x.style.display = "none"; });

    const title = sec.querySelector(".page-title");
    const z = document.createElement("div");
    z.id = "bcSearchZone";
    z.className = "bc-search-zone";
    z.innerHTML = '<div class="bc-search-card"><h3>🔎 Buscador de Centinela</h3><p>Busca en toda la normativa o exclusivamente en infracciones sancionables.</p><div class="bc-search-options"><button type="button" class="bc-search-option active" id="bcModeGlobal">📚 Toda la normativa</button><button type="button" class="bc-search-option inf" id="bcModeInf">⚠️ Solo infracciones</button></div><div class="bc-input-wrap"><span>⌕</span><input id="bcMainInput" type="search" autocomplete="off" placeholder="Ej.: 117 ley 7/1985, desobediencia, art. 36.16…"></div></div>';
    if (title) title.insertAdjacentElement("afterend", z); else sec.prepend(z);

    const rz = document.createElement("div");
    rz.id = "bcResultsZone";
    rz.className = "bc-results-zone hidden";
    rz.innerHTML = '<div class="bc-results-title"><span id="bcResultsLabel">Resultados</span><strong id="bcResultsCount">0</strong></div><div class="bc-results-list" id="bcResultsList"></div>';
    z.insertAdjacentElement("afterend", rz);

    const inp = document.getElementById("bcMainInput");
    const gb = document.getElementById("bcModeGlobal");
    const ib = document.getElementById("bcModeInf");
    const list = document.getElementById("bcResultsList");
    const count = document.getElementById("bcResultsCount");
    const label = document.getElementById("bcResultsLabel");
    let onlyInfraction = false;
    let timer;

    function run() {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        const q = inp.value.trim();
        if (q.length < 2) { rz.classList.add("hidden"); return; }
        await cargarIndice();
        const rs = search(q, onlyInfraction);
        label.textContent = (onlyInfraction ? 'Infracciones para «' : 'Resultados globales para «') + q + '»';
        rz.classList.remove("hidden");
        render(list, count, rs, q);
      }, 120);
    }

    function mode(x) {
      onlyInfraction = x;
      gb.classList.toggle("active", !x);
      ib.classList.toggle("active", x);
      inp.placeholder = x ? 'Ej.: alcohol, arma, ruido, seguro…' : 'Ej.: 117 ley 7/1985, desobediencia, art. 36.16…';
      if (inp.value.trim().length >= 2) run();
    }

    gb.addEventListener("click", () => mode(false));
    ib.addEventListener("click", () => mode(true));
    inp.addEventListener("input", run);
    inp.addEventListener("keydown", e => {
      if (e.key === "Enter") { e.preventDefault(); run(); }
    });
  }

  /* ============================================================
     REPARACIÓN DIRECTA DE BOTONES DE NORMATIVA
     Se utiliza delegación para que también funcione con HTML creado
     dinámicamente por app.js después de cargar los JSON.
     ============================================================ */
  function instalarFixNormativa() {
    if (document.documentElement.dataset.centFixNormativa === "1") return;
    document.documentElement.dataset.centFixNormativa = "1";

    document.addEventListener("click", function (event) {
      const usar = event.target.closest(".bc-view-use-acta");
      if (usar) {
        event.preventDefault();
        event.stopPropagation();
        const viewer = document.getElementById("normativaViewer");
        const r = {
          source: viewer?.dataset.bcSource || "Normativa",
          article: viewer?.dataset.bcArticle || "",
          title: viewer?.dataset.bcTitle || "",
          description: viewer?.dataset.bcDescription || "",
          severity: viewer?.dataset.bcSeverity || "",
          amount: viewer?.dataset.bcAmount || "",
          isInfraction: true,
          raw: { articulo: viewer?.dataset.bcArticle || "" }
        };
        useInActa(r);
        return;
      }

      const volver = event.target.closest(".bc-view-back");
      if (volver) {
        event.preventDefault();
        event.stopPropagation();
        const viewer = document.getElementById("normativaViewer");
        if (viewer) viewer.classList.add("hidden");
        return;
      }

      const btn = event.target.closest(".normativa-open[data-law]");
      if (btn) {
        event.preventDefault();
        event.stopPropagation();
        const tipo = btn.dataset.law || "";
        const id = btn.dataset.id || "";
        if (typeof window.abrirNormativa === "function") {
          window.abrirNormativa(tipo, id);
        }
        return;
      }

      const resultBtn = event.target.closest(".bc-result-card .bc-view-btn");
      if (resultBtn) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
    }, true);
  }

  async function init() {
    styles();
    instalarFixNormativa();
    ui();
    try { await cargarIndice(); } catch (e) { console.warn("Buscador no disponible:", e); }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
