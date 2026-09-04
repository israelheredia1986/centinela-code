/* CENTINELA CODE — BUSCADOR GLOBAL POLICIAL
   Busca en normativa y catálogos locales sin alterar el motor existente.
*/
(() => {
  "use strict";

  const FUENTES = [
    ["LOPSC", "./data/lopsc.json", "Seguridad ciudadana"],
    ["Código Penal", "./data/codigo_penal.json", "Código Penal"],
    ["Circulación", "./data/normativa_trafico.json", "Reglamento General de Circulación"],
    ["Vehículos", "./data/rd-2822-1998.json", "Reglamento General de Vehículos"],
    ["Conductores", "./data/rd-818-2009.json", "Reglamento General de Conductores"],
    ["Infracciones de tráfico", "./data/infracciones_trafico.json", "Catálogo de infracciones"],
    ["VMP y bicicletas", "./data/infracciones_vmp_bicicletas.json", "VMP y bicicletas"],
    ["Ordenanzas", "./data/ordenanzas.json", "Ordenanzas municipales"],
    ["Menores", "./data/normativa_menores.json", "Menores"],
    ["Violencia de género", "./data/normativa_violencia_genero.json", "Violencia de género"],
    ["Animales", "./data/normativa_animales.json", "Animales"],
    ["Ley 2/1986", "./data/ley_2_86.json", "Fuerzas y Cuerpos de Seguridad"],
    ["LECrim", "./data/lecrim.json", "Ley de Enjuiciamiento Criminal"],
    ["Extranjería", "./data/extranjeria.json", "Extranjería"],
    ["Seguridad privada", "./data/seguridad_privada.json", "Seguridad privada"],
    ["Espectáculos", "./data/espectaculos_publicos.json", "Espectáculos públicos"],
    ["Medio ambiente", "./data/medio_ambiente_ruidos.json", "Medio ambiente y ruidos"],
    ["Armas", "./data/reglamento_armas.json", "Reglamento de Armas"],
    ["Policías Locales", "./data/policias_locales_andalucia.json", "Policías Locales de Andalucía"],
    ["Ley 39/2015", "./data/ley_39_2015.json", "Procedimiento Administrativo Común"],
    ["Ley 7/1985", "./data/ley_7_1985.json", "Bases de Régimen Local"],
    ["Ley 5/2010 Andalucía", "./data/ley_5_2010_andalucia.json", "Autonomía Local de Andalucía"]
  ];

  const norm = v => String(v ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const esc = v => String(v ?? "").replace(/[&<>\"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));

  let indice = [];
  let cargando = false;

  function aTexto(v) {
    if (v == null) return "";
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);
    if (Array.isArray(v)) return v.map(aTexto).join(" ");
    return Object.entries(v).map(([k,x]) => `${k} ${aTexto(x)}`).join(" ");
  }

  function extraer(obj, fuente, titulo) {
    const out = [];
    const recorrer = (v, ruta = "") => {
      if (!v) return;
      if (Array.isArray(v)) { v.forEach((x,i) => recorrer(x, `${ruta}/${i}`)); return; }
      if (typeof v !== "object") return;
      const numero = v.numero ?? v.articulo ?? v.article ?? v.idArticulo ?? v.numArticulo;
      const nombre = v.titulo ?? v.title ?? v.nombre ?? v.descripcion ?? v.epigrafe;
      const texto = v.texto ?? v.text ?? v.contenido ?? v.content ?? v.descripcion ?? "";
      if (numero != null || texto) {
        const n = numero != null ? String(numero) : "";
        const t = nombre ? String(nombre) : "";
        const tx = aTexto(texto);
        out.push({fuente, titulo, articulo:n, nombre:t, texto:tx, buscar:norm(`${fuente} ${titulo} ${n} ${t} ${tx}`)});
      }
      Object.entries(v).forEach(([k,x]) => { if (!["texto","text","contenido","content"].includes(k)) recorrer(x, `${ruta}/${k}`); });
    };
    recorrer(obj);
    if (!out.length) out.push({fuente,titulo,articulo:"",nombre:"",texto:aTexto(obj).slice(0,30000),buscar:norm(`${fuente} ${titulo} ${aTexto(obj)}`)});
    return out;
  }

  async function cargarIndice() {
    if (indice.length || cargando) return;
    cargando = true;
    const respuestas = await Promise.allSettled(FUENTES.map(async ([fuente,url,titulo]) => {
      const r = await fetch(`${url}?globalSearch=1`, {cache:"no-store"});
      if (!r.ok) throw new Error(`${r.status} ${url}`);
      return extraer(await r.json(), fuente, titulo);
    }));
    indice = respuestas.flatMap(r => r.status === "fulfilled" ? r.value : []);
    cargando = false;
  }

  function crearUI() {
    if (document.getElementById("centinelaGlobalSearch")) return;
    const wrap = document.createElement("section");
    wrap.id = "centinelaGlobalSearch";
    wrap.innerHTML = `
      <div class="cgs-head"><div><span class="cgs-kicker">CENTINELA CODE</span><h2>Buscador global policial</h2></div><span class="cgs-badge">TODA LA NORMATIVA</span></div>
      <div class="cgs-box"><span class="cgs-icon">⌕</span><input id="cgsInput" autocomplete="off" placeholder="Busca cualquier concepto, artículo, infracción o palabra clave…"><button id="cgsClear" type="button">×</button></div>
      <div class="cgs-filters"><button class="cgs-filter active" data-f="all">Todo</button><button class="cgs-filter" data-f="trafico">Tráfico</button><button class="cgs-filter" data-f="seguridad">Seguridad</button><button class="cgs-filter" data-f="municipal">Municipal</button></div>
      <div id="cgsStatus" class="cgs-status">Preparando índice normativo…</div>
      <div id="cgsResults" class="cgs-results"></div>`;
    const anchor = document.querySelector(".main-content") || document.body.firstElementChild || document.body;
    anchor.parentNode.insertBefore(wrap, anchor);

    const style = document.createElement("style");
    style.textContent = `
      #centinelaGlobalSearch{width:min(calc(100% - 16px),980px);margin:10px auto 12px;padding:14px;border:1px solid #176493;border-radius:18px;background:linear-gradient(145deg,rgba(3,20,37,.98),rgba(2,11,23,.98));box-shadow:0 12px 28px rgba(0,0,0,.42),inset 0 0 28px rgba(0,140,255,.07);box-sizing:border-box}
      .cgs-head{display:flex;justify-content:space-between;align-items:center;gap:8px}.cgs-kicker{font-size:8px;letter-spacing:2px;color:#31b9ff}.cgs-head h2{margin:3px 0 9px;color:#f3f9ff;font-size:18px}.cgs-badge{font-size:8px;padding:5px 7px;border:1px solid #2676a6;border-radius:7px;color:#7ee7ff;white-space:nowrap}
      .cgs-box{display:flex;align-items:center;gap:8px;border:1px solid #287ca9;border-radius:12px;background:#020a13;padding:4px 8px}.cgs-icon{font-size:25px;color:#36d8ff}.cgs-box input{min-width:0;flex:1;border:0;outline:0;background:transparent;color:#fff;font-size:14px;padding:10px 2px}.cgs-box input::placeholder{color:#7591a8}.cgs-box button{border:0;background:transparent;color:#7896aa;font-size:24px;cursor:pointer}.cgs-filters{display:flex;gap:6px;flex-wrap:wrap;margin:9px 0}.cgs-filter{border:1px solid #27516b;background:#071522;color:#9bb4c6;border-radius:999px;padding:5px 9px;font-size:10px;cursor:pointer}.cgs-filter.active{border-color:#21e5d7;color:#21e5d7;background:#06272a}.cgs-status{font-size:9px;color:#7591a8;margin:5px 1px}.cgs-results{display:grid;gap:7px;max-height:440px;overflow:auto}.cgs-result{border:1px solid #173b53;border-radius:10px;background:rgba(5,20,33,.9);padding:9px}.cgs-result-top{display:flex;gap:7px;align-items:center;flex-wrap:wrap}.cgs-source{font-size:8px;color:#21e5d7;text-transform:uppercase;letter-spacing:.6px}.cgs-art{font-size:10px;color:#ffd34a}.cgs-title{font-size:12px;color:#f2f8ff;font-weight:700;margin-top:4px}.cgs-snippet{font-size:10px;line-height:1.4;color:#b9c9d5;margin-top:5px}.cgs-empty{padding:12px;text-align:center;color:#7591a8;font-size:10px}
      @media(max-width:600px){#centinelaGlobalSearch{margin-top:7px}.cgs-head h2{font-size:16px}.cgs-badge{display:none}.cgs-results{max-height:52vh}}
    `;
    document.head.appendChild(style);

    const input = document.getElementById("cgsInput");
    const status = document.getElementById("cgsStatus");
    const results = document.getElementById("cgsResults");
    let filtro = "all";

    const categoria = f => {
      const s = norm(f);
      if (["circulacion","vehiculos","conductores","trafico","vmp","bicicletas"].some(x=>s.includes(x))) return "trafico";
      if (["lopsc","seguridad","armas","extranjeria","policias","lecrim"].some(x=>s.includes(x))) return "seguridad";
      return "municipal";
    };

    function pintar(q="") {
      const tokens = norm(q).split(/\s+/).filter(Boolean);
      if (!tokens.length) { results.innerHTML="<div class='cgs-empty'>Escribe una consulta. Ejemplos: <b>alcoholemia</b>, <b>ITV</b>, <b>artículo 20</b>, <b>permiso B</b>, <b>estacionamiento</b>.</div>"; return; }
      const arr = indice.filter(x => (filtro === "all" || categoria(x.fuente) === filtro) && tokens.every(t=>x.buscar.includes(t)));
      status.textContent = `${arr.length} resultado${arr.length===1?"":"s"} encontrados en el índice policial`;
      results.innerHTML = arr.slice(0,80).map(x=>{
        const plain=x.texto.replace(/\s+/g," ").trim();
        const pos=tokens.reduce((p,t)=>{const i=norm(plain).indexOf(t);return p<0?i:p},-1);
        const start=pos>100?pos-100:0;
        const snippet=(start?"…":"")+plain.slice(start,start+360)+(start+360<plain.length?"…":"");
        return `<article class='cgs-result'><div class='cgs-result-top'><span class='cgs-source'>${esc(x.fuente)}</span>${x.articulo?`<span class='cgs-art'>Art. ${esc(x.articulo)}</span>`:""}</div><div class='cgs-title'>${esc(x.nombre||x.titulo)}</div><div class='cgs-snippet'>${esc(snippet)}</div></article>`;
      }).join("") || "<div class='cgs-empty'>No se han encontrado coincidencias. Prueba con otra palabra o elimina algún término.</div>";
    }

    input.addEventListener("input",()=>pintar(input.value));
    document.getElementById("cgsClear").addEventListener("click",()=>{input.value="";pintar("");input.focus();});
    wrap.querySelectorAll(".cgs-filter").forEach(b=>b.addEventListener("click",()=>{wrap.querySelectorAll(".cgs-filter").forEach(x=>x.classList.remove("active"));b.classList.add("active");filtro=b.dataset.f;pintar(input.value);}));

    cargarIndice().then(()=>{status.textContent=`Índice preparado: ${indice.length.toLocaleString("es-ES")} referencias normativas`;});
  }

  function iniciar(){setTimeout(crearUI,350);}
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded",iniciar); else iniciar();
})();
