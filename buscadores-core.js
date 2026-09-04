/* ============================================================
   CENTINELA CODE — BUSCADOR GLOBAL V4
   Motor estable + búsqueda semántica + tolerancia a errores
   + comercio ambulante + infracciones + normativa.
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
    ["Medio ambiente y ruidos","./data/medio_ambiente_ruidos.json"],
    ["Reglamento de armas","./data/reglamento_armas.json"],
    ["Policías Locales Andalucía","./data/policias_locales_andalucia.json"],
    ["Ley 39/2015","./data/ley_39_2015.json"],
    ["Ley 7/1985","./data/ley_7_1985.json"],
    ["Ley 5/2010 Andalucía","./data/ley_5_2010_andalucia.json"]
  ];

  const STOP=new Set(["a","al","ante","bajo","con","contra","de","del","desde","durante","el","en","entre","hacia","hasta","la","las","lo","los","para","por","segun","sin","sobre","un","una","unos","unas","y","o","que"]);

  const ALIAS={
    vendendor:["vendedor","vendedores","vendedora","venta","vender","comerciante","comercio"],
    vendendora:["vendedora","vendedor","venta","comercio"],
    juguestes:["juguete","juguetes","jugueteria","productos infantiles"],
    juguetez:["juguete","juguetes"],
    pescao:["pescado","pescados","pescadero","productos pesqueros","marisco"],
    ambulate:["ambulante","ambulantes","venta ambulante","mercadillo"],
    infracion:["infraccion","infracciones","sancion","multa"],
    infraccion:["infracciones","sancion","multa"],
    sancion:["sanciones","infraccion","multa"],
    autorizacion:["autorizaciones","permiso","licencia","autorizado","sin autorizacion"],
    factura:["facturas","comprobante","ticket","tique"],
    horario:["horarios","hora","cierre","apertura"],
    multa:["sancion","sanciones","infraccion","infracciones"],
    ensuciar:["ensuciado","ensuciamiento","suciedad","limpieza","residuos","basura","vertido","arrojar","tirar","via publica","calle","acera","calzada","papelera"],
    ensuciado:["ensuciar","ensuciamiento","suciedad","limpieza","residuos","basura","vertido","via publica","calle"],
    suciedad:["ensuciar","ensuciado","limpieza","residuos","basura","via publica","calle"],
    calle:["via publica","acera","calzada","limpieza","suciedad","residuos"],
    tirar:["arrojar","depositar","residuos","basura","suciedad","via publica"],
    arrojar:["tirar","depositar","residuos","basura","suciedad","via publica"]
  };

  const GROUPS=[
    ["comercio","comercial","comercio ambulante","venta","vender","vendedor","vendedora","comerciante","mercancia","mercaderia"],
    ["ambulante","ambulantes","venta ambulante","vendedor ambulante","mercadillo","puesto ambulante","comercio callejero","comercio itinerante"],
    ["pescado","pescados","pescadero","pescadera","pescaderia","productos pesqueros","pesquero","marisco","peces","pesca"],
    ["juguete","juguetes","jugueteria","producto infantil","productos infantiles","seguridad de juguetes"],
    ["autorizacion","autorizaciones","permiso","licencia","habilitacion","autorizado","sin autorizacion"],
    ["sancion","sanciones","multa","infraccion","infracciones","incumplimiento"],
    ["factura","facturas","comprobante","comprobantes","ticket","tique"],
    ["precio","precios","importe","coste","tarifa"],
    ["horario","horarios","hora","cierre","apertura","fuera de horario"],
    ["decomiso","decomisar","incautacion","incautar","aprehension"],
    ["talla","talla minima","talla inferior","tamano minimo","pescado pequeno"],
    ["veda","vedado","epoca de veda","prohibido","prohibicion"]
  ];

  const norm=v=>String(v??"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9.]+/g," ").replace(/\s+/g," ").trim();
  const toks=v=>norm(v).split(" ").filter(Boolean).filter(x=>!STOP.has(x));

  function flat(v,d){
    if(v==null||d>7)return "";
    if(typeof v!=="object")return String(v);
    if(Array.isArray(v))return v.slice(0,120).map(x=>flat(x,d+1)).join(" ");
    return Object.entries(v).slice(0,150).map(([k,x])=>k+" "+flat(x,d+1)).join(" ");
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
    const f=Object.entries(o).find(([k])=>["sancion","multa"].includes(norm(k)));
    if(!f)return pick(o,["cuantia","cuantía","importe"]);
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
    return {source:src,path,id,code,article:art,title,description:desc,severity,sanction:sanc,isInfraction:/infraccion/.test(norm(src))||!!severity||!!sanc||/sancion|multa|conducta|tipificacion/.test(norm(Object.keys(o).join(" "))),search:norm([src,id,code,art,title,desc,severity,sanc,flat(o,0)].join(" "))};
  }
  function walk(v,src,path,out,d){
    if(v==null||d>10)return;
    if(Array.isArray(v)){v.forEach((x,i)=>walk(x,src,`${path}[${i}]`,out,d+1));return;}
    if(typeof v!=="object")return;
    const r=make(v,src,path);if(r)out.push(r);
    Object.entries(v).forEach(([k,x])=>{if(x&&typeof x==="object")walk(x,src,`${path}.${k}`,out,d+1);});
  }

  let INDEX=[],PROMISE=null,mode="all",severity="all";
  async function load(){
    if(PROMISE)return PROMISE;
    PROMISE=Promise.all(DATA.map(async([src,url])=>{
      try{const r=await fetch(`${url}?searchv=20260904v4`,{cache:"no-store"});if(!r.ok)throw Error(r.status);const j=await r.json(),o=[];walk(j,src,"$",o,0);return o;}
      catch(e){console.warn("Centinela buscador: no carga",url,e);return [];} 
    })).then(g=>{INDEX=g.flat();return INDEX;});
    return PROMISE;
  }
  function distance(a,b){
    if(a===b)return 0;if(Math.abs(a.length-b.length)>2)return 99;
    let p=Array.from({length:b.length+1},(_,i)=>i);
    for(let i=1;i<=a.length;i++){const c=[i];for(let j=1;j<=b.length;j++)c[j]=Math.min(c[j-1]+1,p[j]+1,p[j-1]+(a[i-1]===b[j-1]?0:1));p=c;}return p[b.length];
  }
  function match(t,text){
    if(!t)return false;if(text.includes(t))return true;
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
    const s=new Set(ts);ts.forEach(t=>(ALIAS[t]||[]).forEach(a=>s.add(norm(a))));
    GROUPS.forEach(g=>{if(g.some(x=>ts.some(t=>match(t,norm(x)))))g.forEach(x=>s.add(norm(x)));});
    return [...s];
  }
  function score(r,q){
    const n=norm(q),ts=toks(q),ex=expanded(ts),text=r.search;if(!ts.length)return 0;let s=0;
    if(norm(r.article)===n)s+=1200;if(norm(r.code)===n)s+=1100;if(norm(r.title)===n)s+=700;if(text.includes(n))s+=350;
    ts.forEach(t=>{if(match(t,text))s+=90;if(norm(r.article).includes(t))s+=80;if(norm(r.title).includes(t))s+=60;if(norm(r.description).includes(t))s+=35;if(norm(r.source).includes(t))s+=40;});
    ex.forEach(t=>{if(text.includes(t))s+=10;if(norm(r.title).includes(t))s+=15;if(norm(r.article).includes(t))s+=20;});
    if(/comerc|ambul|vendedor|venta|mercadillo|pescad|marisc|juguet|autoriz|sancion|multa/.test(n)&&/comercio ambulante|venta ambulante|vendedor ambulante/.test(text))s+=220;
    if(/pescad|marisc/.test(n)&&/pescado|pesquer|marisco/.test(text))s+=180;
    if(/juguet/.test(n)&&/juguet|infantil/.test(text))s+=180;
    if(/sancion|multa|infraccion/.test(n)&&r.isInfraction)s+=130;
    if(/ensuciar|ensuciado|suciedad|limpieza|residuo|residuos|basura|arrojar|tirar|calle|via publica|acera|calzada/.test(n)){
      if(/limpieza|residuo|residuos|basura|suciedad|higiene urbana|via publica|calle|acera|calzada|arrojar|ensuciar|tirar/.test(text))s+=260;
      if(/ordenanza/.test(norm(r.source)))s+=80;
    }
    return s;
  }
  const esc=v=>String(v??"").replace(/[&<>\"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));

  function render(rs,q){
    const box=document.getElementById("consultaResults"),count=document.getElementById("consultaResultCount");if(!box)return;if(count)count.textContent=String(rs.length);
    if(!q.trim()){box.innerHTML='<div class="empty-state"><div class="empty-icon">🔎</div><h3>Buscar normativa o infracción</h3><p>Prueba «vendedor ambulante», «pescado», «juguetes», «sin autorización» o un artículo.</p></div>';return;}
    if(!rs.length){box.innerHTML='<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Sin resultados</h3><p>No se ha encontrado coincidencia. El buscador también tolera errores como «vendendor ambulante juguestes».</p></div>';return;}
    box.innerHTML=rs.slice(0,100).map((r,i)=>`<article class="result-card cc-search-result" data-i="${i}"><div class="result-card-header"><div><span class="result-ley">${esc(r.source)}</span>${r.article?`<span class="result-code">Art. ${esc(r.article)}</span>`:""}<h3>${esc(r.title||"Sin título")}</h3></div>${r.severity?`<span class="severity-badge">${esc(r.severity)}</span>`:""}</div><p class="result-conducta">${esc((r.description||"").slice(0,280))}${(r.description||"").length>280?"…":""}</p><div class="result-meta">${r.sanction?`<span class="result-pill result-pill--sancion"><span class="result-pill-label">Sanción</span> ${esc(r.sanction)}</span>`:""}${r.isInfraction?'<span class="result-pill">Infracción</span>':""}</div><button type="button" class="result-detail-button cc-detail">Ver detalle</button></article>`).join("");
    box.querySelectorAll(".cc-detail").forEach((b,i)=>b.addEventListener("click",()=>detail(rs[i])));
  }
  function detail(r){
    const modal=document.getElementById("appModal"),body=document.getElementById("modalBody"),title=document.getElementById("modalTitle"),actions=document.getElementById("modalActions");
    if(!modal||!body){alert(`${r.article||r.code||r.source}\n\n${r.title}\n\n${r.description}\n\n${r.sanction||""}`);return;}
    if(title)title.textContent=r.article?`Art. ${r.article}`:(r.code||r.source);
    body.innerHTML=`<div class="detail-content"><p><strong>Normativa:</strong> ${esc(r.source)}</p><p><strong>Artículo:</strong> ${esc(r.article||"-")}</p><p><strong>Concepto:</strong> ${esc(r.title||"-")}</p><p><strong>Gravedad:</strong> ${esc(r.severity||"-")}</p><h4>Conducta / contenido</h4><p>${esc(r.description||"-")}</p>${r.sanction?`<h4>Sanción</h4><p>${esc(r.sanction)}</p>`:""}</div>`;
    if(actions)actions.innerHTML='<button class="secondary-button" type="button" id="ccCloseDetail">Cerrar</button>';
    modal.classList.remove("hidden");document.getElementById("ccCloseDetail")?.addEventListener("click",()=>modal.classList.add("hidden"));
  }
  async function search(q){
    q=String(q||"");if(!q.trim()){render([],q);return;}render([],"Buscando…");
    const idx=await load();let rs=idx;if(mode==="infractions")rs=rs.filter(r=>r.isInfraction);if(severity!=="all")rs=rs.filter(r=>norm(r.severity)===norm(severity));
    rs=rs.map(r=>({r,s:score(r,q)})).filter(x=>x.s>0).sort((a,b)=>b.s-a.s||String(a.r.article).localeCompare(String(b.r.article),"es",{numeric:true})).map(x=>x.r);render(rs,q);
  }
  function go(q,m){mode=m||"all";document.querySelector('.nav-item[data-section="consulta"]')?.click();setTimeout(()=>{const i=document.getElementById("consultaSearch");if(i){i.value=q||"";search(i.value);}},80);}
  function install(){
    const input=document.getElementById("consultaSearch");
    if(input){
      input.addEventListener("input",e=>{e.stopImmediatePropagation();search(input.value);},true);
      input.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();e.stopImmediatePropagation();search(input.value);}},true);
    }
    document.querySelectorAll(".filter-chip[data-severity]").forEach(b=>b.addEventListener("click",e=>{e.preventDefault();e.stopImmediatePropagation();document.querySelectorAll(".filter-chip[data-severity]").forEach(x=>x.classList.remove("active"));b.classList.add("active");severity=b.dataset.severity||"all";search(input?.value||"");},true));
    const g=document.getElementById("cc-global-search-input");
    document.getElementById("cc-global-search-go")?.addEventListener("click",()=>go(g?.value||"","all"));
    g?.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();go(g.value,"all");}});
    document.querySelectorAll("[data-cc-search-mode]").forEach(b=>b.addEventListener("click",()=>go(g?.value||"",b.dataset.ccSearchMode||"all")));
    load();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});else install();
  window.CentinelaSearch={search,load,go};
})();
