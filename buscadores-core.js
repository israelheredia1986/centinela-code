/* ============================================================
   CENTINELA CODE — BUSCADOR GLOBAL V7
   Motor local estable y anti-freeze.
   - La primera búsqueda consulta SIEMPRE la base principal de
     infracciones, donde están las referencias LO 4/2015 + sanción.
   - Solo amplía a otras normas si hacen falta resultados.
   - Procesamiento por lotes con cesión del hilo para que la UI
     nunca quede congelada.
   - Caché por archivo y control de generación para búsquedas rápidas.
   ============================================================ */
(function(){
  "use strict";
  const DATA=[
    ["Infracciones","./data/infracciones.json",["infraccion","sancion","multa","lopsc","4/2015","navaja","arma","droga","alcohol","general"]],
    ["LOPSC","./data/lopsc.json",["lopsc","seguridad ciudadana","4/2015","arma","navaja","droga","alcohol","identificacion","desobediencia"]],
    ["Reglamento de armas","./data/reglamento_armas.json",["arma","armas","navaja","cuchillo","pistola","escopeta"]],
    ["Tráfico · infracciones","./data/infracciones_trafico.json",["trafico","vehiculo","conducir","velocidad","itv","seguro","aparcamiento"]],
    ["Tráfico","./data/normativa_trafico.json",["trafico","vehiculo","conducir","velocidad","itv","seguro","aparcamiento"]],
    ["Código Penal","./data/codigo_penal.json",["penal","delito","hurto","robo","lesiones","amenaza","coaccion","violencia"]],
    ["Menores","./data/normativa_menores.json",["menor","menores","alcohol","tabaco"]],
    ["Violencia de género","./data/normativa_violencia_genero.json",["violencia","genero","pareja","maltrato","amenaza"]],
    ["Ordenanzas","./data/ordenanzas.json",["ordenanza","municipal","limpieza","ruido","animales","terraza","estacionamiento"]],
    ["Animales","./data/normativa_animales.json",["animal","perro","gato","maltrato","abandono","microchip"]],
    ["Ley 2/1986","./data/ley_2_86.json",["policia","policia local","competencia","autoridad"]],
    ["LECrim","./data/lecrim.json",["detencion","detenido","investigacion","atestado","judicial"]],
    ["Extranjería","./data/extranjeria.json",["extranjeria","inmigracion","extranjero","documentacion"]],
    ["Seguridad privada","./data/seguridad_privada.json",["seguridad privada","vigilante","escolta"]],
    ["Espectáculos públicos","./data/espectaculos_publicos.json",["espectaculo","espectaculos","ocio","local","evento","aforo"]],
    ["Comercio ambulante","./data/comercio_ambulante.json",["comercio","ambulante","vendedor","venta","mercadillo","mercancia"]],
    ["Medio ambiente y ruidos","./data/medio_ambiente_ruidos.json",["ruido","ruidos","molestia","vibraciones","medio ambiente","residuos","vertido"]],
    ["Policías Locales Andalucía","./data/policias_locales_andalucia.json",["policia local","andalucia","policia"]],
    ["Ley 39/2015","./data/ley_39_2015.json",["39/2015","procedimiento","administrativo","alegaciones","recurso"]],
    ["Ley 7/1985","./data/ley_7_1985.json",["7/1985","municipio","ayuntamiento","alcalde","competencia"]],
    ["Ley 5/2010 Andalucía","./data/ley_5_2010_andalucia.json",["5/2010","andalucia","autonomia local","ayuntamiento","competencia"]],
    ["Aforo, hostelería y eventos","./data/aforo_hosteleria_eventos.json",["aforo","hosteleria","local","evento","terraza","espectaculo"]],
    ["Contrabando","./data/contrabando.json",["contrabando","aduana","mercancia"]],
    ["Propiedad industrial y falsificaciones","./data/propiedad_industrial_falsificaciones.json",["falsificacion","marca","propiedad industrial","pirateria"]],
    ["VMP, patinetes y bicicletas · infracciones","./data/infracciones_vmp_bicicletas.json",["vmp","patinete","bicicleta","movilidad personal"]],
    ["VMP, patinetes y bicicletas","./data/normativa_vmp_bicicletas.json",["vmp","patinete","bicicleta","movilidad personal"]],
    ["Reglamento General de Vehículos (RD 2822/1998)","./data/rd-2822-1998.json",["2822/1998","vehiculo","matricula","documentacion"]],
    ["Temario Bloque 1 · jurídico","./data/bloque1_juridico.json",["temario","juridico","policia"]],
    ["Temario Bloque 1 · infracciones","./data/infracciones_bloque1.json",["temario","infraccion"]]
  ];
  const STOP=new Set(["a","al","ante","bajo","con","contra","de","del","desde","durante","el","en","entre","hacia","hasta","la","las","lo","los","para","por","segun","sin","sobre","un","una","unos","unas","y","o","que","es","se","su","sus","le","les","esta","este","estas","estos","ese","esa","esos","esas","mas","muy","tambien","como","cuando","donde","porque","pero","si","ya","asi","yo","tu","ella","ellos","ellas","nos","mi","mis","haber","hay","ser","fue","son","era","eran","cual","cuales","quien","quienes","cada","otro","otra","otros","otras","todo","toda","todos","todas"]);
  const ALIAS={
    navaja:["navajas","arma","armas","arma blanca","cuchillo","cuchillos","cuchilla","objeto punzante","objeto cortante"],
    cuchillo:["cuchillos","navaja","navajas","arma blanca","arma","armas"],
    arma:["armas","arma blanca","navaja","cuchillo","cuchillos","pistola","revolver","escopeta"],
    armas:["arma","arma blanca","navaja","cuchillo","pistola","revolver","escopeta"],
    droga:["drogas","estupefaciente","estupefacientes","sustancia estupefaciente","sustancias estupefacientes"],
    alcohol:["alcohol","alcoholemia","embriaguez","bebidas alcoholicas","botellon"],
    botellon:["alcohol","bebidas alcoholicas","consumo de alcohol"],
    patinete:["vmp","vpl","mvp","patinete electrico","vehiculo de movilidad personal"],
    vmp:["patinete","vpl","mvp","vehiculo de movilidad personal"],
    ambulante:["ambulantes","venta ambulante","mercadillo","vendedor","comercio"],
    vendedor:["vendedora","venta","vender","comerciante","comercio"],
    ruido:["ruidos","molestias","vibraciones","musica","contaminacion acustica"],
    ruidos:["ruido","molestias","vibraciones","musica","contaminacion acustica"],
    aparcar:["aparcamiento","estacionar","estacionamiento","parking"],
    estacionar:["aparcamiento","estacionamiento","aparcar","parking"],
    multa:["sancion","sanciones","infraccion","infracciones"],
    sancion:["sanciones","multa","infraccion","infracciones"],
    autorizacion:["autorizaciones","permiso","licencia","autorizado","sin autorizacion"],
    permiso:["autorizacion","licencia","habilitacion"]
  };
  const norm=v=>String(v??"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9./]+/g," ").replace(/\s+/g," ").trim();
  const toks=v=>norm(v).split(" ").filter(Boolean).filter(x=>!STOP.has(x));
  const esc=v=>String(v??"").replace(/[&<>\"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
  const CACHE=new Map();
  const MAX_RESULTS=8;
  function renderLoading(text="Buscando…"){
    const box=document.getElementById("consultaResults");
    if(!box)return;
    box.innerHTML=`<div class="empty-state cc-loading"><div class="empty-icon">🔎</div><h3>${esc(text)}</h3><p>Consultando la normativa disponible.</p></div>`;
  }
  const yieldUI=()=>new Promise(resolve=>requestAnimationFrame(resolve));
  function getValue(o,names){
    if(!o||typeof o!=="object"||Array.isArray(o))return "";
    for(const wanted of names){
      const target=norm(wanted);
      for(const [k,v] of Object.entries(o))if(norm(k)===target&&v!=null&&typeof v!=="object")return String(v);
    }
    return "";
  }
  function getSanction(o){
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
    return getValue(o,["cuantia","cuantía","importe"]);
  }
  function makeRecord(o,source,path){
    if(!o||typeof o!=="object"||Array.isArray(o))return null;
    const id=getValue(o,["id"]),code=getValue(o,["codigo","código"]);
    const article=getValue(o,["articulo","artículo","article","art","precepto","numero","número"]);
    const apartado=getValue(o,["apartado","parrafo","párrafo"]);
    const title=getValue(o,["titulo","título","title","concepto","denominacion","denominación","epigrafe","epígrafe","nombre"]);
    const desc=getValue(o,["conducta","descripcion","descripción","texto","text","contenido","content","tipificacion","tipificación","hechos","resumen"]);
    const severity=getValue(o,["gravedad","severity","clasificacion","clasificación"]);
    const sanction=getSanction(o);
    const keywords=[];
    for(const k of ["palabrasClave","palabras_clave","keywords","tags","etiquetas","sinonimos","alias","terminos"]){
      const v=o[k]??o[k.toLowerCase()];
      if(Array.isArray(v))keywords.push(...v.filter(x=>x!=null).map(String).slice(0,50));
    }
    if(!(id||code||article||title||desc||sanction))return null;
    const art=article?String(article)+(apartado&&!String(article).includes("."+apartado)?"."+apartado:""):"";
    const searchable=norm([source,id,code,art,title,desc,severity,sanction,...keywords].filter(Boolean).join(" "));
    return {source,path,id,code,article:art,title,description:desc,severity,sanction,searchable};
  }
  async function buildIndex(json,source){
    const out=[];
    const stack=[{value:json,path:"$",depth:0}];
    let steps=0;
    while(stack.length){
      const node=stack.pop(),value=node.value;
      if(value==null||node.depth>10)continue;
      if(Array.isArray(value)){
        for(let i=value.length-1;i>=0;i--)stack.push({value:value[i],path:`${node.path}[${i}]`,depth:node.depth+1});
      }else if(typeof value==="object"){
        const r=makeRecord(value,source,node.path);if(r)out.push(r);
        const entries=Object.entries(value);
        for(let i=entries.length-1;i>=0;i--){const [k,v]=entries[i];if(v&&typeof v==="object")stack.push({value:v,path:`${node.path}.${k}`,depth:node.depth+1});}
      }
      if(++steps%150===0)await yieldUI();
    }
    return out;
  }
  async function loadSource(item){
    const [source,url]=item;
    if(CACHE.has(url))return CACHE.get(url);
    const promise=(async()=>{
      try{
        const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
        const response=await fetch(`${url}?searchv=20260911-v7`,{cache:"no-store",headers:{Accept:"application/json"},signal:controller.signal});
        clearTimeout(timer);
        if(!response.ok)throw new Error(`HTTP ${response.status}`);
        const json=await response.json();
        return await buildIndex(json,source);
      }catch(error){
        console.warn("Centinela buscador: error cargando",url,error);
        return [];
      }
    })();
    CACHE.set(url,promise);
    return promise;
  }
  function expandToken(t){
    const set=new Set([t]);
    (ALIAS[t]||[]).forEach(x=>toks(x).forEach(y=>set.add(y)));
    return set;
  }
  function matchesToken(token,text){
    for(const x of expandToken(token))if(text.includes(` ${x} `)||text.startsWith(`${x} `)||text.endsWith(` ${x}`))return true;
    return false;
  }
  function score(r,qTokens,qFull){
    let hits=0,total=0;
    for(const t of qTokens)if(matchesToken(t,r.searchable)){
      hits++;total+=80;
      if(norm(r.article).includes(t))total+=120;
      if(norm(r.title).includes(t))total+=55;
      if(norm(r.ley||r.source).includes(t))total+=30;
    }
    if(qFull&&r.searchable.includes(qFull))total+=220;
    if(r.sanction)total+=15;
    return {hits,total};
  }
  function renderResults(results,q){
    const box=document.getElementById("consultaResults"),count=document.getElementById("consultaResultCount");
    if(!box)return;
    if(count)count.textContent=String(results.length);
    if(!q.trim()){
      box.innerHTML='<div class="empty-state"><div class="empty-icon">🔎</div><h3>Buscar normativa o infracción</h3><p>Introduce un código, artículo o palabra clave para comenzar.</p></div>';return;
    }
    if(!results.length){box.innerHTML=`<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Sin resultados</h3><p>No se han encontrado coincidencias con «${esc(q)}».</p></div>`;return;}
    box.innerHTML=results.slice(0,MAX_RESULTS).map((r,i)=>`<article class="result-card cc-search-result" data-index="${i}"><div class="result-card-header"><div><span class="result-ley">${esc(r.source)}</span>${r.article?`<span class="result-code">Art. ${esc(r.article)}</span>`:""}<h3>${esc(r.title||r.code||"Sin título")}</h3></div>${r.severity?`<span class="severity-badge">${esc(r.severity)}</span>`:""}</div><p class="result-conducta">${esc((r.description||"").slice(0,300))}${(r.description||"").length>300?"…":""}</p><div class="result-meta">${r.sanction?`<span class="result-pill result-pill--sancion"><span class="result-pill-label">Sanción</span> ${esc(r.sanction)}</span>`:""}${r.source==="Infracciones"?'<span class="result-pill">LO 4/2015 / infracción</span>':""}</div><button type="button" class="result-detail-button cc-detail">Ver detalle</button></article>`).join("");
    box.querySelectorAll(".cc-detail").forEach((b,i)=>b.addEventListener("click",()=>detail(results[i])));
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
  function rankSources(q){
    const qn=norm(q),qt=toks(q);
    return DATA.map((item,i)=>{
      const tags=item[2];let s=0;
      for(const t of qt){if(tags.some(tag=>norm(tag)===t))s+=100;else if(tags.some(tag=>norm(tag).includes(t)&&t.length>=4))s+=35;if(norm(item[0]).includes(t))s+=25;}
      if(/4\/2015/.test(qn)&&item[0]==="Infracciones")s+=300;
      if((ALIAS.navaja||[]).includes(qn)&&item[0]==="Infracciones")s+=150;
      return {item,score:s,i};
    }).sort((a,b)=>b.score-a.score||a.i-b.i);
  }
  let generation=0,mode="all",severity="all",debounceTimer=null;
  function filterAndScore(rows,q){
    const qt=[...new Set(toks(q))],full=norm(q),scored=[];
    for(const r of rows){
      if(mode==="infractions"&&!/infracc/i.test(r.source))continue;
      if(severity!=="all"&&norm(r.severity)!==norm(severity))continue;
      const s=score(r,qt,full),needed=qt.length<=2?1:Math.max(1,Math.ceil(qt.length*0.6));
      if(s.hits>=needed)scored.push({...r,_score:s.total});
    }
    const seen=new Set(),out=[];
    scored.sort((a,b)=>b._score-a._score||String(a.article).localeCompare(String(b.article),"es",{numeric:true}));
    for(const r of scored){const key=`${r.source}|${r.article}|${r.title}`;if(seen.has(key))continue;seen.add(key);out.push(r);if(out.length>=MAX_RESULTS)break;}
    return out;
  }
  async function search(q){
    q=String(q||"");const my=++generation;clearTimeout(debounceTimer);
    if(!q.trim()){renderResults([],q);return;}
    const sources=rankSources(q),primary=sources[0]?.item||DATA[0];
    renderLoading(`Cargando ${primary[0]}…`);
    let rows=await loadSource(primary);
    if(my!==generation)return;
    let results=filterAndScore(rows,q);renderResults(results,q);
    if(results.length>=3)return;
    for(const entry of sources.slice(1,6)){
      if(my!==generation)return;
      renderLoading(`Ampliando: ${entry.item[0]}…`);
      const more=await loadSource(entry.item);
      if(my!==generation)return;
      rows=rows.concat(more);results=filterAndScore(rows,q);renderResults(results,q);
      if(results.length>=MAX_RESULTS)break;
    }
  }
  function go(q,m){mode=m||"all";const input=document.getElementById("consultaSearch");if(!input)return;input.value=q||"";search(input.value);}
  function install(){
    const input=document.getElementById("consultaSearch");
    if(input&&!input.dataset.ccSearchInstalled){
      input.dataset.ccSearchInstalled="1";
      input.addEventListener("input",()=>{clearTimeout(debounceTimer);const v=input.value;debounceTimer=setTimeout(()=>search(v),300);});
      input.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();clearTimeout(debounceTimer);search(input.value);}});
    }
    document.querySelectorAll(".filter-chip[data-severity]").forEach(b=>{if(b.dataset.ccSearchInstalled)return;b.dataset.ccSearchInstalled="1";b.addEventListener("click",e=>{e.preventDefault();document.querySelectorAll(".filter-chip[data-severity]").forEach(x=>x.classList.remove("active"));b.classList.add("active");severity=b.dataset.severity||"all";search(input?.value||"");});});
    const clear=document.getElementById("clearConsultaSearch");
    if(clear&&!clear.dataset.ccSearchInstalled){clear.dataset.ccSearchInstalled="1";clear.addEventListener("click",()=>{if(input)input.value="";generation++;clearTimeout(debounceTimer);renderResults([],"");});}
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});else install();
  window.CentinelaSearch={search,load:async()=>{for(const item of DATA)await loadSource(item);return CACHE;},go};
})();
