/* ============================================================
   CENTINELA CODE — BUSCADOR ESTABLE
   Compatibilidad: este archivo queda como motor de reserva aunque
   el cargador antiguo siga apuntando a buscadores-core.js.
   - No recorre recursivamente árboles JSON enormes.
   - Prioriza data/infracciones.json para las consultas policiales.
   - Usa caché y timeout de red.
   - Libera el hilo durante la conversión de registros.
   ============================================================ */
(function(){
  "use strict";
  if(window.CentinelaSearch?.__stableVersion)return;

  const SOURCES=[
    ["Infracciones","./data/infracciones.json",["4/2015","lopsc","navaja","arma","droga","alcohol","multa","sancion","infraccion"]],
    ["LOPSC","./data/lopsc.json",["4/2015","lopsc","seguridad ciudadana","navaja","arma","droga","alcohol","identificacion","desobediencia"]],
    ["Reglamento de Armas","./data/reglamento_armas.json",["navaja","arma","armas","cuchillo","pistola","escopeta"]],
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
    ["Espectáculos públicos","./data/espectaculos_publicos.json",["espectaculo","ocio","local","evento","aforo"]],
    ["Comercio ambulante","./data/comercio_ambulante.json",["comercio","ambulante","vendedor","venta","mercadillo"]],
    ["Medio ambiente y ruidos","./data/medio_ambiente_ruidos.json",["ruido","ruidos","molestia","vibraciones","medio ambiente","residuos","vertido"]],
    ["Policías Locales Andalucía","./data/policias_locales_andalucia.json",["policia local","andalucia","policia"]],
    ["Ley 39/2015","./data/ley_39_2015.json",["39/2015","procedimiento","administrativo","alegaciones","recurso"]],
    ["Ley 7/1985","./data/ley_7_1985.json",["7/1985","municipio","ayuntamiento","alcalde","competencia"]],
    ["Ley 5/2010 Andalucía","./data/ley_5_2010_andalucia.json",["5/2010","andalucia","autonomia local","ayuntamiento","competencia"]],
    ["Aforo, hostelería y eventos","./data/aforo_hosteleria_eventos.json",["aforo","hosteleria","local","evento","terraza","espectaculo"]],
    ["Contrabando","./data/contrabando.json",["contrabando","aduana","mercancia"]],
    ["Propiedad industrial y falsificaciones","./data/propiedad_industrial_falsificaciones.json",["falsificacion","marca","propiedad industrial","pirateria"]],
    ["VMP · infracciones","./data/infracciones_vmp_bicicletas.json",["vmp","patinete","bicicleta","movilidad personal"]],
    ["VMP","./data/normativa_vmp_bicicletas.json",["vmp","patinete","bicicleta","movilidad personal"]],
    ["Reglamento General de Vehículos","./data/rd-2822-1998.json",["2822/1998","vehiculo","matricula","documentacion"]],
    ["Temario Bloque 1 · jurídico","./data/bloque1_juridico.json",["temario","juridico","policia"]],
    ["Temario Bloque 1 · infracciones","./data/infracciones_bloque1.json",["temario","infraccion"]]
  ];

  const ALIAS={
    navaja:["navajas","arma","armas","arma blanca","cuchillo","cuchillos","cuchilla","objeto cortante","objeto punzante"],
    arma:["armas","arma blanca","navaja","navajas","cuchillo","cuchillos","pistola","revolver","escopeta"],
    armas:["arma","arma blanca","navaja","cuchillo","pistola","revolver","escopeta"],
    cuchillo:["cuchillos","navaja","navajas","arma blanca","arma","armas"],
    droga:["drogas","estupefaciente","estupefacientes","sustancia estupefaciente","sustancias estupefacientes","cannabis","hachis","marihuana","cocaina"],
    alcohol:["alcoholemia","embriaguez","bebidas alcoholicas","botellon"],
    botellon:["alcohol","bebidas alcoholicas","consumo alcohol"],
    multa:["sancion","sanciones","infraccion","infracciones"],
    sancion:["sanciones","multa","infraccion","infracciones"],
    infraccion:["infracciones","sancion","sanciones","multa"],
    autorizacion:["autorizaciones","permiso","licencia","autorizado","sin autorizacion"],
    permiso:["autorizacion","licencia","habilitacion"],
    patinete:["vmp","vpl","vehiculo de movilidad personal","patinete electrico"],
    vmp:["patinete","vpl","vehiculo de movilidad personal"],
    ruido:["ruidos","molestias","vibraciones","musica","contaminacion acustica"],
    ruidos:["ruido","molestias","vibraciones","musica","contaminacion acustica"],
    aparcar:["aparcamiento","estacionar","estacionamiento","parking"],
    estacionar:["aparcamiento","estacionamiento","aparcar","parking"],
    ambulante:["ambulantes","venta ambulante","mercadillo","vendedor","comercio"],
    vendedor:["vendedora","venta","vender","comerciante","comercio"],
    perro:["perros","can","canino","animal","mascota"],
    animal:["animales","perro","gato","mascota","maltrato animal","abandono animal"]
  };

  const STOP=new Set(["a","al","ante","bajo","con","contra","de","del","desde","durante","el","en","entre","hacia","hasta","la","las","lo","los","para","por","segun","sin","sobre","un","una","unos","unas","y","o","que","es","se","su","sus","le","les","esta","este","estas","estos","ese","esa","esos","esas","mas","muy","tambien","como","cuando","donde","porque","pero","si","ya","asi","yo","tu","ella","ellos","ellas","nos","mi","mis","haber","hay","ser","fue","son","era","eran","cual","cuales","quien","quienes","cada","otro","otra","otros","otras","todo","toda","todos","todas"]);
  const CACHE=new Map();
  const MAX_RESULTS=8;
  let generation=0,mode="all",severity="all";

  const norm=v=>String(v??"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9./]+/g," ").replace(/\s+/g," ").trim();
  const tokens=v=>norm(v).split(" ").filter(Boolean).filter(x=>!STOP.has(x));
  const esc=v=>String(v??"").replace(/[&<>\"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
  const yieldUI=()=>new Promise(r=>setTimeout(r,0));

  function renderLoading(text){
    const box=document.getElementById("consultaResults");
    if(box)box.innerHTML=`<div class="empty-state cc-loading"><div class="empty-icon">🔎</div><h3>${esc(text)}</h3><p>Consultando la normativa disponible.</p></div>`;
  }

  function rowsFrom(json,source){
    if(Array.isArray(json))return json;
    if(json&&Array.isArray(json.infracciones))return json.infracciones;
    if(json&&Array.isArray(json.articulos))return json.articulos;
    if(json&&Array.isArray(json.leyes)){
      const rows=[];
      for(const ley of json.leyes){
        if(!Array.isArray(ley?.articulos))continue;
        for(const art of ley.articulos)rows.push({...art,ley:art?.ley||ley?.ley||ley?.abreviatura||source,normativa:art?.normativa||ley?.ley||ley?.abreviatura||source});
      }
      return rows;
    }
    return [];
  }

  function sanction(v){
    if(v==null)return "";
    if(typeof v!=="object")return String(v);
    const min=v.min??v.minimo??v.importe_min,max=v.max??v.maximo??v.importe_max,q=v.cuantia??v.cuantía;
    if(min!=null&&max!=null)return `${min} € – ${max} €`;
    if(min!=null)return `Desde ${min} €`;
    if(max!=null)return `Hasta ${max} €`;
    if(q!=null)return `${q} €`;
    return v.texto?String(v.texto):"";
  }

  function make(o,source,index){
    if(!o||typeof o!=="object")return null;
    const article=o.articulo??o.artículo??o.numero??o.art??o.precepto??"";
    const apartado=o.apartado??o.parrafo??o.párrafo??"";
    const title=o.titulo??o.título??o.concepto??o.denominacion??o.denominación??o.nombre??"";
    const desc=o.conducta??o.descripcion??o.descripción??o.texto??o.contenido??o.tipificacion??o.tipificación??o.hechos??o.resumen??"";
    const law=o.ley??o.normativa??o.fuente??source;
    const code=o.codigo??o.código??o.id??"";
    const searchable=norm([code,law,article,apartado,title,desc,o.gravedad,o.severity,sanction(o.sancion??o.multa),Array.isArray(o.palabrasClave)?o.palabrasClave.join(" "):""].join(" "));
    return {source,path:index,id:String(o.id??""),code:String(code),ley:String(law),article:String(article)+(apartado?"."+String(apartado):""),title:String(title),description:String(desc),severity:String(o.gravedad??o.severity??""),sanction:sanction(o.sancion??o.multa),searchable};
  }

  async function loadSource(item){
    const [source,url]=item;
    if(CACHE.has(url))return CACHE.get(url);
    const p=(async()=>{
      const controller=new AbortController();
      const timer=setTimeout(()=>controller.abort(),8000);
      try{
        const response=await fetch(`${url}?ccstable=20260911`,{cache:"no-store",headers:{Accept:"application/json"},signal:controller.signal});
        if(!response.ok)throw new Error(`HTTP ${response.status}`);
        const json=await response.json();
        const rows=rowsFrom(json,source),out=[];
        for(let i=0;i<rows.length;i++){
          const r=make(rows[i],source,i);if(r)out.push(r);
          if(i%100===0)await yieldUI();
        }
        return out;
      }catch(e){console.warn("Centinela buscador estable",source,e);return [];}finally{clearTimeout(timer);}
    })();
    CACHE.set(url,p);return p;
  }

  function expand(t){return new Set([t,...(ALIAS[t]||[]).flatMap(x=>tokens(x))]);}
  function match(t,text){for(const x of expand(t))if(text.includes(` ${x} `)||text.startsWith(`${x} `)||text.endsWith(` ${x}`)||text===x)return true;return false;}
  function score(r,qt,full){
    let hits=0,total=0;
    for(const t of qt){if(match(t,r.searchable)){hits++;total+=100;if(norm(r.article).includes(t))total+=160;if(norm(r.title).includes(t))total+=70;if(norm(r.ley).includes(t))total+=45;}}
    if(full&&r.searchable.includes(full))total+=250;
    if(r.sanction)total+=25;
    if(/4\/2015/i.test(r.ley))total+=20;
    return {hits,total};
  }

  function render(results,q){
    const box=document.getElementById("consultaResults"),count=document.getElementById("consultaResultCount");if(!box)return;
    if(count)count.textContent=String(results.length);
    if(!q.trim()){box.innerHTML='<div class="empty-state"><div class="empty-icon">🔎</div><h3>Buscar normativa o infracción</h3><p>Introduce un código, artículo o palabra clave para comenzar.</p></div>';return;}
    if(!results.length){box.innerHTML=`<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Sin resultados</h3><p>No se ha encontrado una coincidencia con «${esc(q)}».</p></div>`;return;}
    box.innerHTML=results.map((r,i)=>`<article class="result-card cc-search-result" data-index="${i}"><div class="result-card-header"><div><span class="result-ley">${esc(r.ley||r.source)}</span>${r.article?`<span class="result-code">Art. ${esc(r.article)}</span>`:""}<h3>${esc(r.title||r.code||"Sin título")}</h3></div>${r.severity?`<span class="severity-badge">${esc(r.severity)}</span>`:""}</div><p class="result-conducta">${esc((r.description||"").slice(0,320))}${(r.description||"").length>320?"…":""}</p><div class="result-meta">${r.sanction?`<span class="result-pill result-pill--sancion"><span class="result-pill-label">Sanción</span> ${esc(r.sanction)}</span>`:""}${/4\/2015/i.test(r.ley)?'<span class="result-pill">LO 4/2015</span>':""}</div><button type="button" class="result-detail-button cc-detail">Ver detalle</button></article>`).join("");
    box.querySelectorAll(".cc-detail").forEach((b,i)=>b.addEventListener("click",()=>detail(results[i])));
  }

  function detail(r){
    const modal=document.getElementById("appModal"),body=document.getElementById("modalBody"),title=document.getElementById("modalTitle"),actions=document.getElementById("modalActions");
    if(!modal||!body){alert(`${r.article||r.code||r.source}\n\n${r.title}\n\n${r.description}\n\n${r.sanction}`);return;}
    if(title)title.textContent=r.article?`Art. ${r.article}`:(r.code||r.source);
    body.innerHTML=`<div class="detail-content"><p><strong>Normativa:</strong> ${esc(r.ley||r.source)}</p><p><strong>Artículo:</strong> ${esc(r.article||"-")}</p><p><strong>Concepto:</strong> ${esc(r.title||"-")}</p><p><strong>Gravedad:</strong> ${esc(r.severity||"-")}</p><h4>Conducta / contenido</h4><p>${esc(r.description||"-")}</p>${r.sanction?`<h4>Sanción</h4><p>${esc(r.sanction)}</p>`:""}</div>`;
    if(actions)actions.innerHTML='<button class="secondary-button" type="button" id="ccCloseDetail">Cerrar</button>';
    modal.classList.remove("hidden");document.getElementById("ccCloseDetail")?.addEventListener("click",()=>modal.classList.add("hidden"));
  }

  function rank(q){
    const qn=norm(q),qt=tokens(q);
    return SOURCES.map((item,i)=>{let s=0;for(const t of qt){if(item[2].some(tag=>norm(tag)===t))s+=100;else if(item[2].some(tag=>norm(tag).includes(t)&&t.length>=4))s+=25;}if(/4\/2015/.test(qn)&&item[0]==="Infracciones")s+=1000;if(qn==="navaja"&&item[0]==="Infracciones")s+=700;return {item,score:s,i};}).sort((a,b)=>b.score-a.score||a.i-b.i);
  }

  async function search(q){
    q=String(q||"");const my=++generation;if(!q.trim()){render([],q);return;}
    const qt=tokens(q);if(!qt.length){render([],q);return;}
    const ranked=rank(q);const primary=ranked[0]?.item||SOURCES[0];
    renderLoading(`Cargando ${primary[0]}…`);
    let rows=await loadSource(primary);if(my!==generation)return;
    let result=filter(rows,q);render(result,q);
    for(const candidate of ranked.slice(1,6)){
      if(my!==generation)return;
      if(result.length>=3)break;
      renderLoading(`Completando con ${candidate.item[0]}…`);
      const more=await loadSource(candidate.item);if(my!==generation)return;
      rows=rows.concat(more);result=filter(rows,q);render(result,q);
    }
  }

  function filter(rows,q){
    const qt=[...new Set(tokens(q))],full=norm(q),out=[];
    for(const r of rows){
      if(mode==="infractions"&&!/infracc/i.test(r.source))continue;
      if(severity!=="all"&&norm(r.severity)!==norm(severity))continue;
      const s=score(r,qt,full),needed=qt.length<=2?1:Math.max(1,Math.ceil(qt.length*.6));
      if(s.hits>=needed)out.push({...r,_score:s.total});
    }
    out.sort((a,b)=>b._score-a._score||String(a.article).localeCompare(String(b.article),"es",{numeric:true}));
    const seen=new Set(),unique=[];
    for(const r of out){const k=`${r.ley}|${r.article}|${r.title}`;if(seen.has(k))continue;seen.add(k);unique.push(r);if(unique.length>=MAX_RESULTS)break;}
    return unique;
  }

  function install(){
    const input=document.getElementById("consultaSearch");
    if(input&&!input.dataset.ccStableInstalled){
      input.dataset.ccStableInstalled="1";let timer=null;
      input.addEventListener("input",()=>{clearTimeout(timer);timer=setTimeout(()=>search(input.value),300);});
      input.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();clearTimeout(timer);search(input.value);}});
    }
    document.querySelectorAll(".filter-chip[data-severity]").forEach(b=>{if(b.dataset.ccStableInstalled)return;b.dataset.ccStableInstalled="1";b.addEventListener("click",e=>{e.preventDefault();document.querySelectorAll(".filter-chip[data-severity]").forEach(x=>x.classList.remove("active"));b.classList.add("active");severity=b.dataset.severity||"all";search(input?.value||"");});});
    const clear=document.getElementById("clearConsultaSearch");if(clear&&!clear.dataset.ccStableInstalled){clear.dataset.ccStableInstalled="1";clear.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();generation++;if(input)input.value="";render([],"");});}
  }

  window.CentinelaSearch={search,load:async()=>{for(const item of SOURCES)await loadSource(item);return CACHE;},go:(q,m)=>{mode=m||"all";const i=document.getElementById("consultaSearch");if(i){i.value=q||"";search(i.value);}},__stableVersion:"2026-09-11-stable"};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});else install();
})();