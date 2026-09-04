/* ============================================================
   CENTINELA CODE — BUSCADOR PRO V5
   Búsqueda operativa: comercio ilegal, top manta, falsificaciones,
   hostelería, aforo, bodas, locales, horarios y normativa general.
   Se ejecuta en fase de captura para evitar conflictos con motores
   antiguos y mantiene los mismos contenedores de resultados.
   ============================================================ */
(function(){
  "use strict";

  const DATA=[
    ["Infracciones","./data/infracciones.json"],
    ["Tráfico · infracciones","./data/infracciones_trafico.json"],
    ["LOPSC","./data/lopsc.json"],
    ["Código Penal","./data/codigo_penal.json"],
    ["Menores","./data/normativa_menores.json"],
    ["Violencia de género","./data/normativa_violencia_genero.json"],
    ["Ordenanzas","./data/ordenanzas.json"],
    ["Animales","./data/normativa_animales.json"],
    ["Tráfico","./data/normativa_trafico.json"],
    ["Ley 2/1986","./data/ley_2_86.json"],
    ["LECrim","./data/lecrim.json"],
    ["Extranjería","./data/extranjeria.json"],
    ["Seguridad privada","./data/seguridad_privada.json"],
    ["Espectáculos públicos","./data/espectaculos_publicos.json"],
    ["Comercio ambulante","./data/comercio_ambulante.json"],
    ["Propiedad industrial y falsificaciones","./data/propiedad_industrial_falsificaciones.json"],
    ["Aforo y hostelería","./data/aforo_hosteleria_eventos.json"],
    ["Medio ambiente y ruidos","./data/medio_ambiente_ruidos.json"],
    ["Reglamento de armas","./data/reglamento_armas.json"],
    ["Policías Locales Andalucía","./data/policias_locales_andalucia.json"],
    ["Ley 39/2015","./data/ley_39_2015.json"],
    ["Ley 7/1985","./data/ley_7_1985.json"],
    ["Ley 5/2010 Andalucía","./data/ley_5_2010_andalucia.json"]
  ];

  const STOP=new Set(["a","al","ante","bajo","con","contra","de","del","desde","durante","el","en","entre","hacia","hasta","la","las","lo","los","para","por","segun","sin","sobre","un","una","unos","unas","y","o","que","es","se"]);

  const ALIAS={
    topmanta:["top manta","top-manta","mantero","venta ambulante","falsificaciones","productos falsificados"],
    mantero:["top manta","venta ambulante","falsificaciones","vendedor ambulante"],
    falsificacion:["falsificaciones","falsificado","falsificados","imitacion","imitaciones","marca falsa","top manta"],
    falsificaciones:["falsificacion","falsificado","falsificados","imitaciones","top manta","mantero"],
    falsa:["falsificacion","falsificaciones","imitacion","marca falsa"],
    falso:["falsificacion","falsificaciones","imitacion","marca falsa"],
    ropa:["ropa falsificada","camisetas","pantalones","sudaderas","zapatillas","textil"],
    reloj:["relojes","reloj falso","relojes falsificados"],
    relojes:["reloj","reloj falso","relojes falsificados"],
    perfume:["perfumes","colonia","colonias","perfume falso","perfumes falsificados"],
    perfumes:["perfume","colonia","colonias","perfumes falsificados"],
    objeto:["objetos","productos","mercancia","mercancias","falsificaciones"],
    objetos:["objeto","productos","mercancia","falsificaciones"],
    vendendor:["vendedor","vendedores","vendedora","venta","vender","comerciante","comercio"],
    vendendora:["vendedora","vendedor","venta","comercio"],
    juguestes:["juguete","juguetes","jugueteria","productos infantiles"],
    pescao:["pescado","pescados","pescadero","productos pesqueros","marisco"],
    ambulate:["ambulante","ambulantes","venta ambulante","mercadillo"],
    aforo:["aforo maximo","capacidad","personas","ocupacion","exceso aforo","sobreaforo"],
    aforos:["aforo","capacidad","personas","ocupacion"],
    restaurante:["restaurantes","hosteleria","bar","cafeteria","comida","local de hosteleria"],
    restaurantes:["restaurante","hosteleria","bar","cafeteria"],
    boda:["bodas","salon de celebraciones","banquete","celebracion","evento privado","salon de bodas"],
    bodas:["boda","salon de celebraciones","banquete","celebracion","evento privado"],
    local:["locales","establecimiento","establecimientos","salon","restaurante","bar"],
    locales:["local","establecimiento","establecimientos","salon","restaurante","bar"],
    vendendor: ["vendedor","venta","ambulante","comercio"],
    sancion:["sanciones","infraccion","multa","castigo"],
    infracion:["infraccion","infracciones","sancion","multa"],
    autorizacion:["autorizaciones","permiso","licencia","habilitacion","autorizado","sin autorizacion"],
    factura:["facturas","comprobante","ticket","tique"],
    horario:["horarios","hora","cierre","apertura","fuera de horario"],
    desalojo:["desalojar","desalojado","cierre local","personas dentro"],
    incautacion:["incautar","decomiso","decomisar","aprehension","retirada"],
    decomiso:["decomisar","incautacion","incautar","retirada"]
  };

  const GROUPS=[
    ["top manta","topmanta","mantero","venta ambulante","vendedor ambulante","falsificacion","falsificaciones","productos falsificados"],
    ["ropa","ropa falsificada","camiseta","camisetas","zapatillas","bolso","bolsos","cartera","gafas","reloj","relojes","perfume","perfumes","colonia","objetos"],
    ["comercio","comercial","venta","vender","vendedor","vendedora","comerciante","mercancia","mercaderia","mercadillo"],
    ["ambulante","ambulantes","venta ambulante","vendedor ambulante","mercadillo","puesto ambulante","comercio callejero","comercio itinerante"],
    ["aforo","aforo maximo","capacidad","ocupacion","personas","exceso aforo","sobreaforo","control de aforo"],
    ["restaurante","restaurantes","hosteleria","bar","bares","cafeteria","cafeterias","comida"],
    ["boda","bodas","banquete","salon de bodas","salon celebraciones","salon de celebraciones","celebracion","evento","evento privado"],
    ["local","locales","establecimiento","establecimientos","salon","salones","recinto","recintos"],
    ["horario","horarios","hora","cierre","apertura","fuera de horario","desalojo"],
    ["sancion","sanciones","multa","infraccion","infracciones","delito","delitos"],
    ["autorizacion","autorizaciones","permiso","licencia","habilitacion","sin autorizacion"],
    ["decomiso","decomisar","incautacion","incautar","aprehension","retirada"]
  ];

  const norm=v=>String(v??"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9.]+/g," ").replace(/\s+/g," ").trim();
  const toks=v=>norm(v).split(" ").filter(Boolean).filter(x=>!STOP.has(x));

  function flat(v,d){
    if(v==null||d>8)return "";
    if(typeof v!=="object")return String(v);
    if(Array.isArray(v))return v.slice(0,160).map(x=>flat(x,d+1)).join(" ");
    return Object.entries(v).slice(0,180).map(([k,x])=>k+" "+flat(x,d+1)).join(" ");
  }
  function pick(o,names){
    if(!o||typeof o!=="object"||Array.isArray(o))return "";
    for(const n of names){
      const f=Object.entries(o).find(([k])=>norm(k)===norm(n));
      if(f&&f[1]!=null&&typeof f[1]!=="object")return String(f[1]);
    }
    return "";
  }
  function sanction(o){
    if(!o||typeof o!=="object")return "";
    const f=Object.entries(o).find(([k])=>/sancion|multa|pena/.test(norm(k)));
    if(!f)return pick(o,["cuantia","cuantía","importe","penas"]);
    const v=f[1];
    if(v&&typeof v==="object"&&!Array.isArray(v)){
      const min=v.min??v.minimo??v.importe_min,max=v.max??v.maximo??v.importe_max;
      if(min!=null&&max!=null)return `${min} € – ${max} €`;
      if(min!=null)return `Desde ${min} €`;
      if(max!=null)return `Hasta ${max} €`;
      if(v.texto)return String(v.texto);
    }
    return typeof v==="object"?"":String(v);
  }
  function make(o,src,path){
    if(!o||typeof o!=="object"||Array.isArray(o))return null;
    const id=pick(o,["id"]),code=pick(o,["codigo","código"]),article=pick(o,["articulo","artículo","article","art","precepto","numero"]),apartado=pick(o,["apartado","parrafo","párrafo"]);
    const title=pick(o,["titulo","título","title","concepto","denominacion","denominación","epigrafe","epígrafe","nombre"]);
    const desc=pick(o,["conducta","descripcion","descripción","texto","text","contenido","content","tipificacion","tipificación","hechos"]);
    const severity=pick(o,["gravedad","severity","clasificacion","clasificación"]),sanc=sanction(o);
    if(!(id||code||article||title||desc))return null;
    const art=article?String(article)+(apartado&&!String(article).includes("."+apartado)?"."+apartado:""):"";
    return {source:src,path,id,code,article:art,title,description:desc,severity,sanction:sanc,isInfraction:/infraccion|sancion|penal|propiedad industrial|aforo/.test(norm(src))||!!severity||!!sanc||/sancion|multa|pena|conducta|tipificacion|delito/.test(norm(Object.keys(o).join(" "))),search:norm([src,id,code,art,title,desc,severity,sanc,flat(o,0)].join(" "))};
  }
  function walk(v,src,path,out,d){
    if(v==null||d>11)return;
    if(Array.isArray(v)){v.forEach((x,i)=>walk(x,src,`${path}[${i}]`,out,d+1));return;}
    if(typeof v!=="object")return;
    const r=make(v,src,path);if(r)out.push(r);
    Object.entries(v).forEach(([k,x])=>{if(x&&typeof x==="object")walk(x,src,`${path}.${k}`,out,d+1);});
  }

  let INDEX=[],loading=null;
  async function load(){
    if(loading)return loading;
    loading=Promise.all(DATA.map(async([src,url])=>{
      try{const r=await fetch(`${url}?searchv=20260904v5`,{cache:"no-store"});if(!r.ok)throw Error(r.status);const j=await r.json(),o=[];walk(j,src,"$",o,0);return o;}
      catch(e){console.warn("Centinela PRO: no se pudo cargar",url,e);return [];} 
    })).then(g=>{INDEX=g.flat();return INDEX;});
    return loading;
  }
  function distance(a,b){
    if(a===b)return 0;if(Math.abs(a.length-b.length)>2)return 99;
    let p=Array.from({length:b.length+1},(_,i)=>i);
    for(let i=1;i<=a.length;i++){const c=[i];for(let j=1;j<=b.length;j++)c[j]=Math.min(c[j-1]+1,p[j]+1,p[j-1]+(a[i-1]===b[j-1]?0:1));p=c;}
    return p[b.length];
  }
  function tokenMatch(t,text){
    if(!t)return false;
    if(text.includes(t))return true;
    if((ALIAS[t]||[]).some(a=>text.includes(norm(a))))return true;
    for(const w of text.split(" ")){
      if(w.length>=5&&t.length>=5){
        if(distance(t,w)<=(t.length>=8?2:1))return true;
        if(t.slice(0,5)===w.slice(0,5))return true;
      }
    }
    return false;
  }
  function expanded(ts){
    const s=new Set(ts);
    ts.forEach(t=>(ALIAS[t]||[]).forEach(a=>s.add(norm(a))));
    GROUPS.forEach(g=>{if(g.some(x=>ts.some(t=>tokenMatch(t,norm(x)))))g.forEach(x=>s.add(norm(x)));});
    return [...s];
  }
  function score(r,q){
    const n=norm(q),ts=toks(q),ex=expanded(ts),text=r.search;if(!ts.length)return 0;let s=0;
    if(text.includes(n))s+=500;
    if(norm(r.article)===n)s+=1600;if(norm(r.code)===n)s+=1500;if(norm(r.title)===n)s+=900;
    ts.forEach(t=>{
      if(tokenMatch(t,text))s+=120;
      if(norm(r.article).includes(t))s+=100;
      if(norm(r.title).includes(t))s+=85;
      if(norm(r.description).includes(t))s+=45;
      if(norm(r.source).includes(t))s+=55;
    });
    ex.forEach(t=>{if(text.includes(t))s+=12;if(norm(r.title).includes(t))s+=20;if(norm(r.article).includes(t))s+=25;});
    if(/top manta|topmanta|mantero|falsific|marca falsa|ropa|reloj|perfume/.test(n)&&/propiedad industrial|falsific|top manta|mantero/.test(text))s+=700;
    if(/aforo|capacidad|personas|ocupacion|sobreaforo/.test(n)&&/aforo|capacidad|ocupacion|personas/.test(text))s+=500;
    if(/restaurante|hosteleria|bar|cafeteria/.test(n)&&/hosteleria|restaurante|bar|cafeteria/.test(text))s+=350;
    if(/boda|bodas|banquete|salon celebraciones|celebracion/.test(n)&&/boda|salon de celebraciones|celebracion|banquete/.test(text))s+=500;
    if(/local|establecimiento|salon/.test(n)&&/local|establecimiento|salon/.test(text))s+=180;
    if(/sancion|multa|infraccion|delito/.test(n)&&r.isInfraction)s+=180;
    return s;
  }
  const esc=v=>String(v??"").replace(/[&<>\"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));

  function render(rs,q){
    const box=document.getElementById("consultaResults"),count=document.getElementById("consultaResultCount");if(!box)return;
    if(count)count.textContent=String(rs.length);
    if(!q.trim()){box.innerHTML='<div class="empty-state"><div class="empty-icon">🔎</div><h3>Buscador operativo</h3><p>Prueba: «top manta», «ropa falsificada», «relojes», «perfumes», «aforo restaurante», «boda 250 personas», «exceso de aforo», «salón de celebraciones».</p></div>';return;}
    if(!rs.length){box.innerHTML='<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Sin resultados</h3><p>Prueba con términos como «top manta», «falsificaciones», «aforo», «restaurante», «bodas», «salón de celebraciones» o un artículo.</p></div>';return;}
    box.innerHTML=rs.slice(0,100).map((r,i)=>`<article class="result-card cc-search-result" data-i="${i}"><div class="result-card-header"><div><span class="result-ley">${esc(r.source)}</span>${r.article?`<span class="result-code">Art. ${esc(r.article)}</span>`:""}<h3>${esc(r.title||"Sin título")}</h3></div>${r.severity?`<span class="severity-badge">${esc(r.severity)}</span>`:""}</div><p class="result-conducta">${esc((r.description||"").slice(0,420))}${(r.description||"").length>420?"…":""}</p><div class="result-meta">${r.sanction?`<span class="result-pill result-pill--sancion"><span class="result-pill-label">Sanción</span> ${esc(r.sanction)}</span>`:""}${r.isInfraction?'<span class="result-pill">Infracción / delito</span>':""}</div><button type="button" class="result-detail-button cc-pro-detail" data-pro-i="${i}">Ver detalle</button></article>`).join("");
    box.querySelectorAll(".cc-pro-detail").forEach(b=>b.addEventListener("click",()=>detail(rs[Number(b.dataset.proI)])));
  }
  function detail(r){
    const modal=document.getElementById("appModal"),body=document.getElementById("modalBody"),title=document.getElementById("modalTitle"),actions=document.getElementById("modalActions");
    if(!modal||!body){alert(`${r.article||r.code||r.source}\n\n${r.title}\n\n${r.description}\n\n${r.sanction||""}`);return;}
    if(title)title.textContent=r.article?`Art. ${r.article}`:(r.code||r.source);
    body.innerHTML=`<div class="detail-content"><p><strong>Normativa:</strong> ${esc(r.source)}</p><p><strong>Artículo:</strong> ${esc(r.article||"-")}</p><p><strong>Concepto:</strong> ${esc(r.title||"-")}</p><p><strong>Gravedad:</strong> ${esc(r.severity||"-")}</p><h4>Conducta / contenido</h4><p>${esc(r.description||"-")}</p>${r.sanction?`<h4>Sanción / consecuencia</h4><p>${esc(r.sanction)}</p>`:""}</div>`;
    if(actions)actions.innerHTML='<button class="secondary-button" type="button" id="ccProClose">Cerrar</button>';
    modal.classList.add("show");modal.setAttribute("aria-hidden","false");
    const c=document.getElementById("ccProClose");if(c)c.onclick=()=>{modal.classList.remove("show");modal.setAttribute("aria-hidden","true");};
  }

  async function run(q){
    const query=String(q||"").trim();
    if(!query){render([],"");return;}
    const data=await load();
    const ranked=data.map(r=>({r,s:score(r,query)})).filter(x=>x.s>0).sort((a,b)=>b.s-a.s||String(a.r.article).localeCompare(String(b.r.article),undefined,{numeric:true}));
    render(ranked.map(x=>x.r),query);
  }

  function mount(){
    const input=document.getElementById("bcMainInput");if(!input)return false;
    input.placeholder="Buscar: top manta, falsificaciones, ropa, relojes, perfumes, aforo, restaurantes, bodas, locales…";
    input.addEventListener("input",e=>{e.stopImmediatePropagation();run(input.value);},true);
    input.addEventListener("keyup",e=>{e.stopImmediatePropagation();if(e.key!="Tab")run(input.value);},true);
    input.addEventListener("search",e=>{e.stopImmediatePropagation();run(input.value);},true);
    window.CentinelaBuscadorPRO={buscar:run,cargar:load};
    setTimeout(()=>{if(input.value.trim())run(input.value);else render([],"");},80);
    return true;
  }
  if(!mount())document.addEventListener("DOMContentLoaded",mount,{once:true});
})();
