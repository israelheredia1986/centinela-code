/* ============================================================
   CENTINELA CODE — BUSCADOR GLOBAL V6
   FIX CRÍTICO DE RENDIMIENTO
   - NO descarga las 29 bases al pulsar Buscar.
   - Carga solo las fuentes relacionadas con la consulta.
   - Mantiene caché por archivo para que cada fuente se descargue una vez.
   - Procesa cada archivo por separado y cede el hilo entre fuentes.
   - Conserva filtros, tolerancia a erratas y detalle.
   ============================================================ */
(function(){
  "use strict";

  const DATA=[
    ["Infracciones","./data/infracciones.json",["infraccion","multa","sancion","general"]],
    ["Tráfico · infracciones","./data/infracciones_trafico.json",["trafico","vehiculo","coche","moto","conducir","velocidad","itv","seguro","aparcamiento","general"]],
    ["LOPSC","./data/lopsc.json",["lopsc","seguridad ciudadana","droga","arma","navaja","alcohol","botellon","identificacion","desobediencia","general"]],
    ["Código Penal","./data/codigo_penal.json",["penal","delito","hurto","robo","lesiones","amenaza","coaccion","violencia","general"]],
    ["Menores","./data/normativa_menores.json",["menor","menores","alcohol","tabaco","general"]],
    ["Violencia de género","./data/normativa_violencia_genero.json",["violencia","genero","pareja","maltrato","amenaza","general"]],
    ["Ordenanzas","./data/ordenanzas.json",["ordenanza","municipal","limpieza","ruido","animales","terraza","estacionamiento","general"]],
    ["Animales","./data/normativa_animales.json",["animal","perro","gato","maltrato","abandono","microchip","general"]],
    ["Tráfico","./data/normativa_trafico.json",["trafico","vehiculo","coche","moto","conducir","velocidad","itv","seguro","aparcamiento","general"]],
    ["Ley 2/1986","./data/ley_2_86.json",["policia","policia local","competencia","autoridad","general"]],
    ["LECrim","./data/lecrim.json",["detencion","detenido","investigacion","atestado","judicial","general"]],
    ["Extranjería","./data/extranjeria.json",["extranjeria","inmigracion","extranjero","documentacion","general"]],
    ["Seguridad privada","./data/seguridad_privada.json",["seguridad privada","vigilante","escolta","general"]],
    ["Espectáculos públicos","./data/espectaculos_publicos.json",["espectaculo","espectaculos","ocio","local","evento","aforo","general"]],
    ["Comercio ambulante","./data/comercio_ambulante.json",["comercio","ambulante","vendedor","venta","mercadillo","mercancia","general"]],
    ["Medio ambiente y ruidos","./data/medio_ambiente_ruidos.json",["ruido","ruidos","molestia","vibraciones","medio ambiente","residuos","vertido","general"]],
    ["Reglamento de armas","./data/reglamento_armas.json",["arma","armas","navaja","cuchillo","pistola","escopeta","general"]],
    ["Policías Locales Andalucía","./data/policias_locales_andalucia.json",["policia local","andalucia","policia","general"]],
    ["Ley 39/2015","./data/ley_39_2015.json",["39/2015","procedimiento","administrativo","alegaciones","recurso","general"]],
    ["Ley 7/1985","./data/ley_7_1985.json",["7/1985","municipio","ayuntamiento","alcalde","competencia","general"]],
    ["Ley 5/2010 Andalucía","./data/ley_5_2010_andalucia.json",["5/2010","andalucia","autonomia local","ayuntamiento","competencia","general"]],
    ["Aforo, hostelería y eventos","./data/aforo_hosteleria_eventos.json",["aforo","hosteleria","local","evento","terraza","espectaculo","general"]],
    ["Contrabando","./data/contrabando.json",["contrabando","aduana","mercancia","general"]],
    ["Propiedad industrial y falsificaciones","./data/propiedad_industrial_falsificaciones.json",["falsificacion","marca","propiedad industrial","pirateria","general"]],
    ["VMP, patinetes y bicicletas · infracciones","./data/infracciones_vmp_bicicletas.json",["vmp","patinete","bicicleta","movilidad personal","general"]],
    ["VMP, patinetes y bicicletas","./data/normativa_vmp_bicicletas.json",["vmp","patinete","bicicleta","movilidad personal","general"]],
    ["Reglamento General de Vehículos (RD 2822/1998)","./data/rd-2822-1998.json",["2822/1998","vehiculo","matricula","documentacion","general"]],
    ["Temario Bloque 1 · jurídico","./data/bloque1_juridico.json",["temario","juridico","policia","general"]],
    ["Temario Bloque 1 · infracciones","./data/infracciones_bloque1.json",["temario","infraccion","general"]]
  ];

  const STOP=new Set(["a","al","ante","bajo","con","contra","de","del","desde","durante","el","en","entre","hacia","hasta","la","las","lo","los","para","por","segun","sin","sobre","un","una","unos","unas","y","o","que","es","se","su","sus","le","les","esta","este","estas","estos","ese","esa","esos","esas","mas","muy","tambien","como","cuando","donde","porque","pero","si","ya","asi","yo","tu","ella","ellos","ellas","nos","mi","mis","haber","hay","ser","fue","son","era","eran","cual","cuales","quien","quienes","cada","otro","otra","otros","otras","todo","toda","todos","todas"]);

  const ALIAS={
    navaja:["navajas","arma","arma blanca","cuchillo","cuchillos","cuchilla","objeto punzante","objeto cortante"],
    cuchillo:["cuchillos","navaja","navajas","arma blanca","arma"],
    arma:["armas","arma blanca","navaja","cuchillo","pistola","revolver","escopeta"],
    armas:["arma","arma blanca","navaja","cuchillo","pistola","revolver","escopeta"],
    patinete:["vmp","vpl","mvp","patinete electrico","vehiculo de movilidad personal"],
    vmp:["patinete","vpl","mvp","vehiculo de movilidad personal"],
    mvp:["vmp","patinete","vpl"],
    ambulante:["ambulantes","venta ambulante","mercadillo","vendedor","comercio"],
    vendedor:["vendedora","venta","vender","comerciante","comercio"],
    ruido:["ruidos","molestias","vibraciones","musica","contaminacion acustica"],
    ruidos:["ruido","molestias","vibraciones","musica","contaminacion acustica"],
    alcohol:["alcoholemia","embriaguez","bebidas alcoholicas","botellon"],
    botellon:["alcohol","bebidas alcoholicas","consumo alcohol"],
    grafiti:["grafitis","pintada","pintadas","vandalismo"],
    pintada:["grafiti","grafitis","pintadas","vandalismo"],
    perro:["perros","can","canino","animal","mascota"],
    animal:["animales","perro","gato","mascota","maltrato animal","abandono animal"],
    aparcar:["aparcado","aparcamiento","estacionar","estacionamiento","parking"],
    aparcamiento:["estacionamiento","aparcar","parking"],
    estacionar:["estacionamiento","aparcamiento","aparcar"],
    multa:["sancion","sanciones","infraccion","infracciones"],
    sancion:["sanciones","multa","infraccion","infracciones"],
    autorizacion:["autorizaciones","permiso","licencia","autorizado","sin autorizacion"],
    permiso:["autorizacion","licencia","habilitacion"]
  };

  const norm=v=>String(v??"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9./]+/g," ").replace(/\s+/g," ").trim();
  const toks=v=>norm(v).split(" ").filter(Boolean).filter(x=>!STOP.has(x));
  const esc=v=>String(v??"").replace(/[&<>\"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));

  const SOURCE_CACHE=new Map();
  const MAX_RESULTS=12;

  function renderLoading(text="Buscando…"){
    const box=document.getElementById("consultaResults");
    if(!box)return;
    box.innerHTML=`<div class="empty-state cc-loading"><div class="empty-icon">🔎</div><h3>${esc(text)}</h3><p>Consultando la normativa disponible.</p></div>`;
  }
  function yieldUI(){return new Promise(r=>setTimeout(r,0));}

  function value(o,names){
    if(!o||typeof o!=="object"||Array.isArray(o))return "";
    for(const n of names){
      const want=norm(n);
      for(const [k,v] of Object.entries(o))if(norm(k)===want&&v!=null&&typeof v!=="object")return String(v);
    }
    return "";
  }

  function sanction(o){
    if(!o||typeof o!=="object")return "";
    for(const [k,v] of Object.entries(o)){
      if(!["sancion","multa"].includes(norm(k)))continue;
      if(v==null)return "";
      if(typeof v!=="object")return String(v);
      const min=v.min??v.minimo??v.importe_min;
      const max=v.max??v.maximo??v.importe_max;
      const q=v.cuantia??v.cuantía;
      if(min!=null&&max!=null)return `${min} € – ${max} €`;
      if(min!=null)return `Desde ${min} €`;
      if(max!=null)return `Hasta ${max} €`;
      if(q!=null)return `${q} €`;
      if(v.texto)return String(v.texto);
    }
    return value(o,["cuantia","cuantía","importe"]);
  }

  function makeRecord(o,source,path){
    if(!o||typeof o!=="object"||Array.isArray(o))return null;
    const id=value(o,["id"]),code=value(o,["codigo","código"]);
    const article=value(o,["articulo","artículo","article","art","precepto","numero","número"]);
    const apartado=value(o,["apartado","parrafo","párrafo"]);
    const title=value(o,["titulo","título","title","concepto","denominacion","denominación","epigrafe","epígrafe","nombre"]);
    const desc=value(o,["conducta","descripcion","descripción","texto","text","contenido","content","tipificacion","tipificación","hechos","resumen"]);
    const severity=value(o,["gravedad","severity","clasificacion","clasificación"]);
    const sanctionText=sanction(o);
    const keywords=[];
    for(const k of ["palabrasClave","palabras_clave","keywords","tags","etiquetas","sinonimos","alias","terminos"]){
      const v=o[k]??o[k.toLowerCase()];
      if(Array.isArray(v))keywords.push(...v.filter(x=>x!=null).map(String).slice(0,40));
    }
    if(!(id||code||article||title||desc||sanctionText))return null;
    const art=article?String(article)+(apartado&&!String(article).includes("."+apartado)?"."+apartado:""):"";
    const searchable=norm([source,id,code,art,title,desc,severity,sanctionText,...keywords].filter(Boolean).join(" "));
    const isInfraction=Boolean(severity||sanctionText||/infraccion|sancion|multa|tipificacion/.test(searchable));
    return {source,path,id,code,article:art,title,description:desc,severity,sanction:sanctionText,isInfraction,searchable};
  }

  function walk(v,source,path,out,depth=0){
    if(v==null||depth>8)return;
    if(Array.isArray(v)){for(let i=0;i<v.length;i++)walk(v[i],source,`${path}[${i}]`,out,depth+1);return;}
    if(typeof v!=="object")return;
    const r=makeRecord(v,source,path);if(r)out.push(r);
    for(const [k,x] of Object.entries(v))if(x&&typeof x==="object")walk(x,source,`${path}.${k}`,out,depth+1);
  }

  async function loadSource(item){
    const [source,url]=item;
    if(SOURCE_CACHE.has(url))return SOURCE_CACHE.get(url);
    const promise=(async()=>{
      try{
        const r=await fetch(`${url}?searchv=20260911-v6`,{cache:"no-store",headers:{Accept:"application/json"}});
        if(!r.ok)throw new Error(`HTTP ${r.status}`);
        const j=await r.json();
        await yieldUI();
        const out=[];
        walk(j,source,"$",out,0);
        await yieldUI();
        return out;
      }catch(e){
        console.warn("Centinela buscador: no carga",url,e);
        return [];
      }
    })();
    SOURCE_CACHE.set(url,promise);
    return promise;
  }

  function sourceRelevance(item,q){
    const qn=norm(q);const qt=toks(q);
    const tags=item[2];let score=0;
    for(const t of qt){
      if(tags.some(tag=>norm(tag)===t))score+=20;
      else if(tags.some(tag=>norm(tag).includes(t)&&t.length>3))score+=8;
      if(norm(item[0]).includes(t))score+=12;
    }
    if(qn.includes("/")){
      for(const tag of tags)if(qn.includes(norm(tag)))score+=25;
    }
    return score;
  }

  function selectSources(q){
    const ranked=DATA.map((item,i)=>({item,score:sourceRelevance(item,q),i})).sort((a,b)=>b.score-a.score||a.i-b.i);
    const selected=[];
    const add=name=>{const x=DATA.find(d=>d[0]===name);if(x&&!selected.includes(x))selected.push(x);};
    add("Infracciones");
    for(const x of ranked){
      if(x.score>0&&!selected.includes(x.item)){selected.push(x.item);if(selected.length>=8)break;}
    }
    if(selected.length<3)add("Tráfico · infracciones");
    return selected.slice(0,8);
  }

  function matchWord(token,text){
    if(text.includes(token))return true;
    return (ALIAS[token]||[]).some(a=>text.includes(norm(a)));
  }

  function scoreRecord(r,qt,full){
    let hits=0,score=0;
    for(const t of qt){
      if(matchWord(t,r.searchable)){
        hits++;
        score+=60;
        if(r.article&&norm(r.article).includes(t))score+=100;
        if(r.title&&norm(r.title).includes(t))score+=45;
      }
    }
    if(full&&r.searchable.includes(full))score+=140;
    if(r.isInfraction)score+=10;
    return {hits,score};
  }

  function renderResults(rs,q){
    const box=document.getElementById("consultaResults"),count=document.getElementById("consultaResultCount");
    if(!box)return;
    if(count)count.textContent=String(rs.length);
    if(!q.trim()){
      box.innerHTML='<div class="empty-state"><div class="empty-icon">🔎</div><h3>Buscar normativa o infracción</h3><p>Introduce un código, artículo o palabra clave para comenzar.</p></div>';
      return;
    }
    if(!rs.length){
      box.innerHTML=`<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Sin resultados</h3><p>No se han encontrado coincidencias con «${esc(q)}» en las fuentes consultadas.</p></div>`;
      return;
    }
    box.innerHTML=rs.slice(0,MAX_RESULTS).map((r,i)=>`<article class="result-card cc-search-result" data-index="${i}"><div class="result-card-header"><div><span class="result-ley">${esc(r.source)}</span>${r.article?`<span class="result-code">Art. ${esc(r.article)}</span>`:""}<h3>${esc(r.title||r.code||"Sin título")}</h3></div>${r.severity?`<span class="severity-badge">${esc(r.severity)}</span>`:""}</div><p class="result-conducta">${esc((r.description||"").slice(0,280))}${(r.description||"").length>280?"…":""}</p><div class="result-meta">${r.sanction?`<span class="result-pill result-pill--sancion"><span class="result-pill-label">Sanción</span> ${esc(r.sanction)}</span>`:""}${r.isInfraction?'<span class="result-pill">Infracción</span>':""}</div><button type="button" class="result-detail-button cc-detail">Ver detalle</button></article>`).join("");
    box.querySelectorAll(".cc-detail").forEach((b,i)=>b.addEventListener("click",()=>detail(rs[i])));
  }

  function detail(r){
    const modal=document.getElementById("appModal"),body=document.getElementById("modalBody"),title=document.getElementById("modalTitle"),actions=document.getElementById("modalActions");
    if(!modal||!body){alert(`${r.article||r.code||r.source}\n\n${r.title||""}\n\n${r.description||""}\n\n${r.sanction||""}`);return;}
    if(title)title.textContent=r.article?`Art. ${r.article}`:(r.code||r.source);
    body.innerHTML=`<div class="detail-content"><p><strong>Normativa:</strong> ${esc(r.source)}</p><p><strong>Artículo:</strong> ${esc(r.article||"-")}</p><p><strong>Concepto:</strong> ${esc(r.title||"-")}</p><p><strong>Gravedad:</strong> ${esc(r.severity||"-")}</p><h4>Conducta / contenido</h4><p>${esc(r.description||"-")}</p>${r.sanction?`<h4>Sanción</h4><p>${esc(r.sanction)}</p>`:""}</div>`;
    if(actions)actions.innerHTML='<button class="secondary-button" type="button" id="ccCloseDetail">Cerrar</button>';
    modal.classList.remove("hidden");
    document.getElementById("ccCloseDetail")?.addEventListener("click",()=>modal.classList.add("hidden"));
  }

  let generation=0,mode="all",severity="all",debounceTimer=null;

  async function search(q){
    q=String(q||"");
    const my=++generation;
    clearTimeout(debounceTimer);
    if(!q.trim()){renderResults([],q);return;}
    const qt=[...new Set(toks(q))];
    if(!qt.length){renderResults([],q);return;}
    const sources=selectSources(q);
    let all=[];
    for(const source of sources){
      if(my!==generation)return;
      renderLoading(`Cargando ${source[0]}…`);
      all=all.concat(await loadSource(source));
      await yieldUI();
    }
    const full=norm(q),scored=[];
    for(const r of all){
      if(mode==="infractions"&&!r.isInfraction)continue;
      if(severity!=="all"&&norm(r.severity)!==norm(severity))continue;
      const s=scoreRecord(r,qt,full);
      const needed=qt.length<=2?qt.length:Math.ceil(qt.length*0.65);
      if(s.hits>=needed)scored.push({...r,_score:s.score});
    }
    scored.sort((a,b)=>b._score-a._score||String(a.article).localeCompare(String(b.article),"es",{numeric:true}));
    const seen=new Set(),out=[];
    for(const r of scored){const k=`${r.source}|${r.article}|${r.title}`;if(seen.has(k))continue;seen.add(k);out.push(r);if(out.length>=MAX_RESULTS)break;}
    if(my===generation)renderResults(out,q);
  }

  async function loadAll(){
    for(const item of DATA)await loadSource(item);
    return [...SOURCE_CACHE.values()];
  }

  function go(q,m){mode=m||"all";const i=document.getElementById("consultaSearch");if(i){i.value=q||"";search(i.value);}}

  function install(){
    const input=document.getElementById("consultaSearch");
    if(input&&!input.dataset.ccSearchInstalled){
      input.dataset.ccSearchInstalled="1";
      input.addEventListener("input",()=>{clearTimeout(debounceTimer);const v=input.value;debounceTimer=setTimeout(()=>search(v),260);});
      input.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();clearTimeout(debounceTimer);search(input.value);}});
    }
    document.querySelectorAll(".filter-chip[data-severity]").forEach(b=>{
      if(b.dataset.ccSearchInstalled)return;
      b.dataset.ccSearchInstalled="1";
      b.addEventListener("click",e=>{e.preventDefault();document.querySelectorAll(".filter-chip[data-severity]").forEach(x=>x.classList.remove("active"));b.classList.add("active");severity=b.dataset.severity||"all";search(input?.value||"");});
    });
    const clear=document.getElementById("clearConsultaSearch");
    if(clear&&!clear.dataset.ccSearchInstalled){
      clear.dataset.ccSearchInstalled="1";
      clear.addEventListener("click",()=>{if(input)input.value="";generation++;clearTimeout(debounceTimer);renderResults([],"");});
    }
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});else install();
  window.CentinelaSearch={search,load:loadAll,go};
})();
