/* CENTINELA CODE — BUSCADOR ULTRA
   Motor mínimo y estable para PWA.
   Una sola fuente por búsqueda, cero escaneo recursivo, cero cargas en cadena.
   Nunca deja una capa de carga bloqueando la interfaz. */
(function(){
  "use strict";

  const SOURCES=[
    ["Infracciones","./data/infracciones.json",["4/2015","lopsc","navaja","arma","droga","alcohol","multa","sancion","infraccion"]],
    ["LOPSC","./data/lopsc.json",["4/2015","lopsc","seguridad ciudadana","navaja","arma","droga","alcohol","identificacion","desobediencia"]],
    ["Tráfico · infracciones","./data/infracciones_trafico.json",["trafico","vehiculo","conducir","velocidad","itv","seguro","aparcamiento"]],
    ["Código Penal","./data/codigo_penal.json",["penal","delito","hurto","robo","lesiones","amenaza","coaccion","violencia"]],
    ["Reglamento de Armas","./data/reglamento_armas.json",["arma","armas","navaja","cuchillo","pistola","escopeta"]],
    ["Ordenanzas","./data/ordenanzas.json",["ordenanza","municipal","limpieza","ruido","animales","terraza","estacionamiento"]],
    ["Menores","./data/normativa_menores.json",["menor","menores","alcohol","tabaco"]],
    ["Violencia de género","./data/normativa_violencia_genero.json",["violencia","genero","pareja","maltrato","amenaza"]],
    ["Animales","./data/normativa_animales.json",["animal","perro","gato","maltrato","abandono","microchip"]],
    ["Ley 2/1986","./data/ley_2_86.json",["policia","policia local","competencia","autoridad"]],
    ["LECrim","./data/lecrim.json",["detencion","detenido","investigacion","atestado","judicial"]],
    ["Extranjería","./data/extranjeria.json",["extranjeria","inmigracion","extranjero","documentacion"]],
    ["Seguridad privada","./data/seguridad_privada.json",["seguridad privada","vigilante","escolta"]],
    ["Espectáculos públicos","./data/espectaculos_publicos.json",["espectaculo","ocio","local","evento","aforo"]],
    ["Medio ambiente y ruidos","./data/medio_ambiente_ruidos.json",["ruido","ruidos","molestia","vibraciones","residuos","vertido"]],
    ["Policías Locales Andalucía","./data/policias_locales_andalucia.json",["policia local","andalucia","policia"]],
    ["Ley 39/2015","./data/ley_39_2015.json",["39/2015","procedimiento","administrativo","alegaciones","recurso"]],
    ["Ley 7/1985","./data/ley_7_1985.json",["7/1985","municipio","ayuntamiento","alcalde","competencia"]],
    ["Ley 5/2010 Andalucía","./data/ley_5_2010_andalucia.json",["5/2010","andalucia","autonomia local","ayuntamiento","competencia"]],
    ["VMP","./data/infracciones_vmp_bicicletas.json",["vmp","patinete","bicicleta","movilidad personal"]]
  ];

  const ALIAS={
    navaja:["navajas","arma","armas","arma blanca","cuchillo","cuchillos","cuchilla","objeto cortante","objeto punzante"],
    arma:["armas","arma blanca","navaja","navajas","cuchillo","cuchillos","pistola","revolver","escopeta"],
    armas:["arma","arma blanca","navaja","cuchillo","pistola","revolver","escopeta"],
    cuchillo:["cuchillos","navaja","navajas","arma blanca","arma","armas"],
    droga:["drogas","estupefaciente","estupefacientes","sustancia estupefaciente","cannabis","hachis","marihuana","cocaina"],
    alcohol:["alcoholemia","embriaguez","bebidas alcoholicas","botellon"],
    botellon:["alcohol","bebidas alcoholicas","consumo alcohol"],
    multa:["sancion","sanciones","infraccion","infracciones"],
    sancion:["sanciones","multa","infraccion","infracciones"],
    infraccion:["infracciones","sancion","sanciones","multa"],
    ruido:["ruidos","molestias","vibraciones","musica","contaminacion acustica"],
    ruidos:["ruido","molestias","vibraciones","musica","contaminacion acustica"],
    aparcar:["aparcamiento","estacionar","estacionamiento","parking"],
    estacionar:["aparcamiento","estacionamiento","aparcar","parking"],
    perro:["perros","can","canino","animal","mascota"],
    animal:["animales","perro","gato","mascota","maltrato animal","abandono animal"]
  };

  const STOP=new Set(["a","al","ante","bajo","con","contra","de","del","desde","durante","el","en","entre","hacia","hasta","la","las","lo","los","para","por","segun","sin","sobre","un","una","unos","unas","y","o","que","es","se","su","sus","le","les","esta","este","estas","estos","ese","esa","esos","esas","mas","muy","tambien","como","cuando","donde","porque","pero","si","ya","asi","yo","tu","ella","ellos","ellas","nos","mi","mis","haber","hay","ser","fue","son","era","eran","cual","cuales","quien","quienes","cada","otro","otra","otros","otras","todo","toda","todos","todas"]);

  const norm=v=>String(v??"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9./]+/g," ").replace(/\s+/g," ").trim();
  const tokens=v=>norm(v).split(" ").filter(Boolean).filter(x=>!STOP.has(x));
  const esc=v=>String(v??"").replace(/[&<>\"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
  const CACHE=new Map();
  let generation=0, severity="all", mode="all";

  function unlockUI(){
    document.body.classList.remove("search-loading","loading","is-loading");
    const screen=document.getElementById("loadingScreen");
    if(screen){screen.classList.add("hidden");screen.style.display="none";screen.style.pointerEvents="none";}
    document.querySelectorAll(".cc-loading-overlay,.search-loading-overlay,.loading-overlay").forEach(el=>{el.style.display="none";el.style.pointerEvents="none";});
    const active=document.activeElement;
    if(active&&active.id==="consultaSearch")active.blur();
    document.querySelectorAll("button,.nav-item,a").forEach(el=>{if(el.style.pointerEvents==="none")el.style.pointerEvents="auto";});
  }

  function loading(text){
    const box=document.getElementById("consultaResults");
    if(!box)return;
    box.innerHTML=`<div class="empty-state cc-loading"><div class="empty-icon">🔎</div><h3>${esc(text)}</h3><p>Consultando la normativa disponible.</p></div>`;
    unlockUI();
  }

  function topRows(json){
    if(Array.isArray(json))return json;
    if(json&&Array.isArray(json.infracciones))return json.infracciones;
    if(json&&Array.isArray(json.articulos))return json.articulos;
    if(json&&Array.isArray(json.leyes)){
      const out=[];
      for(const ley of json.leyes){
        if(!Array.isArray(ley?.articulos))continue;
        for(const art of ley.articulos)out.push({...art,ley:art?.ley||ley?.ley||ley?.abreviatura,normativa:art?.normativa||ley?.ley||ley?.abreviatura});
      }
      return out;
    }
    return [];
  }

  function textValue(v){return typeof v==="object"?JSON.stringify(v):String(v??"");}
  function record(o,source,index){
    if(!o||typeof o!=="object")return null;
    const article=o.articulo??o.artículo??o.numero??o.art??o.precepto??"";
    const apartado=o.apartado??o.parrafo??o.párrafo??"";
    const title=o.titulo??o.título??o.concepto??o.denominacion??o.denominación??o.nombre??"";
    const description=o.conducta??o.descripcion??o.descripción??o.texto??o.contenido??o.tipificacion??o.tipificación??o.hechos??o.resumen??"";
    const severity=o.gravedad??o.severity??o.clasificacion??o.clasificación??"";
    const ley=o.ley??o.normativa??o.fuente??source;
    const code=o.codigo??o.código??o.id??"";
    const sanction=o.sancion??o.multa??"";
    const keywords=Array.isArray(o.palabrasClave)?o.palabrasClave.join(" "):Array.isArray(o.keywords)?o.keywords.join(" "):"";
    const articleText=String(article)+(apartado?"."+String(apartado):"");
    return {source,index,id:String(o.id??""),code:String(code??""),ley:String(ley??""),article:articleText,title:String(title??""),description:textValue(description),severity:String(severity??""),sanction:formatSanction(sanction),searchable:norm([code,ley,articleText,title,description,severity,textValue(sanction),keywords].join(" "))};
  }

  function formatSanction(v){
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
    return "";
  }

  async function load(source){
    const [name,url]=source;
    if(CACHE.has(url))return CACHE.get(url);
    const promise=(async()=>{
      const controller=new AbortController();
      const timer=setTimeout(()=>controller.abort(),6000);
      try{
        const response=await fetch(`${url}?ultra=20260911`,{cache:"no-store",signal:controller.signal,headers:{Accept:"application/json"}});
        if(!response.ok)throw new Error(`HTTP ${response.status}`);
        const json=await response.json();
        const rows=topRows(json),out=[];
        for(let i=0;i<rows.length;i++){
          const r=record(rows[i],name,i);
          if(r)out.push(r);
          if(i&&i%100===0)await new Promise(requestAnimationFrame);
        }
        return out;
      }catch(e){console.warn("Centinela Ultra",name,e);return [];}
      finally{clearTimeout(timer);}
    })();
    CACHE.set(url,promise);
    return promise;
  }

  function expand(token){return new Set([token,...(ALIAS[token]||[]).flatMap(x=>tokens(x))]);}
  function matches(token,text){for(const x of expand(token)){if(text.includes(` ${x} `)||text.startsWith(`${x} `)||text.endsWith(` ${x}`)||text===x)return true;}return false;}
  function scoreRow(r,qt,full){
    let hits=0,score=0;
    for(const t of qt){if(matches(t,r.searchable)){hits++;score+=100;if(norm(r.article).includes(t))score+=180;if(norm(r.title).includes(t))score+=80;if(norm(r.ley).includes(t))score+=50;}}
    if(full&&r.searchable.includes(full))score+=250;
    if(r.sanction)score+=25;
    if(/4\/2015/i.test(r.ley))score+=20;
    return {hits,score};
  }

  function render(results,q){
    const box=document.getElementById("consultaResults"),count=document.getElementById("consultaResultCount");
    if(!box)return;
    if(count)count.textContent=String(results.length);
    if(!q.trim()){box.innerHTML='<div class="empty-state"><div class="empty-icon">🔎</div><h3>Buscar normativa o infracción</h3><p>Introduce un código, artículo o palabra clave para comenzar.</p></div>';unlockUI();return;}
    if(!results.length){box.innerHTML=`<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Sin resultados</h3><p>No se ha encontrado una coincidencia con «${esc(q)}».</p></div>`;unlockUI();return;}
    box.innerHTML=results.map((r,i)=>`<article class="result-card cc-search-result" data-index="${i}"><div class="result-card-header"><div><span class="result-ley">${esc(r.ley||r.source)}</span>${r.article?`<span class="result-code">Art. ${esc(r.article)}</span>`:""}<h3>${esc(r.title||r.code||"Sin título")}</h3></div>${r.severity?`<span class="severity-badge">${esc(r.severity)}</span>`:""}</div><p class="result-conducta">${esc(r.description.slice(0,320))}${r.description.length>320?"…":""}</p><div class="result-meta">${r.sanction?`<span class="result-pill result-pill--sancion"><span class="result-pill-label">Sanción</span> ${esc(r.sanction)}</span>`:""}${/4\/2015/i.test(r.ley)?'<span class="result-pill">LO 4/2015</span>':""}</div><button type="button" class="result-detail-button cc-detail">Ver detalle</button></article>`).join("");
    box.querySelectorAll(".cc-detail").forEach((b,i)=>b.addEventListener("click",()=>detail(results[i])));
    unlockUI();
  }

  function detail(r){
    unlockUI();
    const modal=document.getElementById("appModal"),body=document.getElementById("modalBody"),title=document.getElementById("modalTitle"),actions=document.getElementById("modalActions");
    if(!modal||!body){alert(`${r.article||r.code||r.source}\n\n${r.title}\n\n${r.description}\n\n${r.sanction}`);return;}
    if(title)title.textContent=r.article?`Art. ${r.article}`:(r.code||r.source);
    body.innerHTML=`<div class="detail-content"><p><strong>Normativa:</strong> ${esc(r.ley||r.source)}</p><p><strong>Artículo:</strong> ${esc(r.article||"-")}</p><p><strong>Concepto:</strong> ${esc(r.title||"-")}</p><p><strong>Gravedad:</strong> ${esc(r.severity||"-")}</p><h4>Conducta / contenido</h4><p>${esc(r.description||"-")}</p>${r.sanction?`<h4>Sanción</h4><p>${esc(r.sanction)}</p>`:""}</div>`;
    if(actions)actions.innerHTML='<button class="secondary-button" type="button" id="ccCloseDetail">Cerrar</button>';
    modal.classList.remove("hidden");
    document.getElementById("ccCloseDetail")?.addEventListener("click",()=>{modal.classList.add("hidden");unlockUI();});
  }

  function rank(q){
    const qn=norm(q),qt=tokens(q);
    return SOURCES.map((s,i)=>{let score=0;for(const t of qt){if(s[2].some(tag=>norm(tag)===t))score+=100;else if(s[2].some(tag=>norm(tag).includes(t)&&t.length>=4))score+=25;}if(/4\/2015/.test(qn)&&s[0]==="Infracciones")score+=1000;if(qn==="navaja"&&s[0]==="Infracciones")score+=700;return {item:s,score,i};}).sort((a,b)=>b.score-a.score||a.i-b.i);
  }

  async function search(q){
    const my=++generation;
    q=String(q||"").trim();
    if(!q){render([],"");return;}
    const ranked=rank(q);
    const primary=ranked[0]?.item||SOURCES[0];
    loading(`Consultando ${primary[0]}…`);
    const rows=await load(primary);
    if(my!==generation)return;
    const qt=[...new Set(tokens(q))],full=norm(q),out=[];
    for(const r of rows){
      if(mode==="infractions"&&!/infraccion/i.test(r.source)&&!/4\/2015/i.test(r.ley))continue;
      if(severity!=="all"&&norm(r.severity)!==norm(severity))continue;
      const s=scoreRow(r,qt,full);
      if(s.hits>=1)out.push({...r,_score:s.score});
    }
    out.sort((a,b)=>b._score-a._score||String(a.article).localeCompare(String(b.article),"es",{numeric:true}));
    const seen=new Set(),unique=[];
    for(const r of out){const k=`${r.ley}|${r.article}|${r.title}`;if(seen.has(k))continue;seen.add(k);unique.push(r);if(unique.length>=8)break;}
    render(unique,q);
  }

  function install(){
    const input=document.getElementById("consultaSearch");
    if(!input||input.dataset.ccUltraInstalled)return;
    input.dataset.ccUltraInstalled="1";
    input.addEventListener("input",()=>{const v=input.value;clearTimeout(input.__ccTimer);input.__ccTimer=setTimeout(()=>search(v),300);});
    input.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();clearTimeout(input.__ccTimer);search(input.value);}});
    document.querySelectorAll(".filter-chip[data-severity]").forEach(b=>{if(b.dataset.ccUltraBound)return;b.dataset.ccUltraBound="1";b.addEventListener("click",e=>{e.preventDefault();severity=b.dataset.severity||"all";document.querySelectorAll(".filter-chip[data-severity]").forEach(x=>x.classList.remove("active"));b.classList.add("active");search(input.value);});});
    document.getElementById("clearConsultaSearch")?.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();generation++;clearTimeout(input.__ccTimer);input.value="";render([],"");});
  }

  function boot(){install();unlockUI();}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
  window.CentinelaSearch={search,go:(q,m)=>{mode=m||"all";const i=document.getElementById("consultaSearch");if(i){i.value=q||"";search(i.value);}},load:async()=>{for(const s of SOURCES)await load(s);return CACHE;}};
})();
