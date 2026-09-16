/* ============================================================
   CENTINELA CODE — MOTOR ÚNICO DE CONSULTA
   V7 — búsqueda literal, inmediata y sin falsos positivos.
   ============================================================ */
(function(){
  "use strict";
  const VERSION="20260916h";
  const input=()=>document.getElementById("consultaSearch");
  const box=()=>document.getElementById("consultaResults");
  const count=()=>document.getElementById("consultaResultCount");
  let rows=null,loading=null,timer=null,generation=0,installed=false;

  const norm=s=>String(s??"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9./]+/g," ").replace(/\s+/g," ").trim();
  const esc=s=>String(s??"").replace(/[&<>\"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
  const list=v=>Array.isArray(v)?v.map(String):v==null?[]:[String(v)];

  async function load(){
    if(rows)return rows;
    if(loading)return loading;
    loading=fetch(`./data/infracciones.json?motor=${VERSION}`,{cache:"no-store",headers:{Accept:"application/json"}})
      .then(r=>{if(!r.ok)throw new Error(String(r.status));return r.json();})
      .then(j=>Array.isArray(j)?j:(Array.isArray(j?.infracciones)?j.infracciones:[]))
      .catch(e=>{console.warn("Centinela consulta:",e);return [];});
    rows=await loading;
    return rows;
  }

  function exactWord(text,q){
    const n=norm(text),t=norm(q);
    return !!t&&(n===t||n.includes(` ${t} `)||n.startsWith(t+" ")||n.endsWith(" "+t));
  }

  function score(r,q){
    const n=norm(q); if(!n)return -1;
    const codigo=norm(r?.codigo),art=norm(r?.articulo),apartado=norm(r?.apartado);
    if(codigo===n||`${art}.${apartado}`===n||art===n)return 10000;

    const titulo=norm(r?.titulo);
    const conducta=norm(r?.conducta);
    const descripcion=norm([r?.descripcion,r?.descripcion_corta,r?.materia,r?.objeto].join(" "));
    const claves=list(r?.palabrasClave).map(norm);

    // IMPORTANTE: las palabras clave son ayudas de indexación, no deben
    // convertir una infracción de una materia distinta en un falso positivo.
    // Ejemplo: art. 35.2 tiene históricamente "navaja" en palabrasClave,
    // pero su título/conducta es sobre armas reglamentarias, explosivos,
    // cartuchería y pirotecnia. Buscar "navaja" no debe devolverlo.
    const categoriasExclusivas=["explosivos","cartucheria","pirotecnia"];
    const esCategoriaExclusiva=categoriasExclusivas.some(x=>titulo.includes(x));
    const directoTitulo=exactWord(titulo,n);
    const directoConducta=exactWord(conducta,n);
    const directoDescripcion=exactWord(descripcion,n);
    const directoClave=claves.some(x=>exactWord(x,n));

    // Para materias concretas, una coincidencia que exista SOLO en keywords
    // no puede vencer a la concordancia real del título/conducta. Esto elimina
    // el falso positivo de 35.2 para "navaja", "cuchillo", etc.
    if(esCategoriaExclusiva && directoClave && !directoTitulo && !directoConducta && !directoDescripcion){
      return -1;
    }

    let s=-1;
    if(directoTitulo)s=9000;
    else if(directoConducta)s=8500;
    else if(directoDescripcion)s=8000;
    else if(directoClave)s=6500;
    else return -1;

    // Para armas concretas damos prioridad a una coincidencia real en el
    // contenido antes que a una simple palabra clave.
    const armasConcretas=new Set(["navaja","navajas","cuchillo","cuchillos","cuchilla","cuchillas","daga","dagas","punal","puñal","espada","espadas","katana","katanas","sable","sables","machete","machetes","estilete"]);
    if(armasConcretas.has(n)){
      if(directoTitulo)s+=1200;
      else if(directoConducta)s+=900;
      else if(directoDescripcion)s+=700;
      else if(directoClave)s+=100;
    }
    if(r?.sancion)s+=100;
    return s;
  }

  function sanction(v){
    if(v==null)return "";
    if(typeof v!=="object")return String(v);
    const min=v.min??v.minimo??v.importe_min,max=v.max??v.maximo??v.importe_max,q=v.cuantia??v.cuantía;
    if(min!=null&&max!=null)return `${Number(min).toLocaleString("es-ES")} € – ${Number(max).toLocaleString("es-ES")} €`;
    if(min!=null)return `Desde ${Number(min).toLocaleString("es-ES")} €`;
    if(max!=null)return `Hasta ${Number(max).toLocaleString("es-ES")} €`;
    if(q!=null)return `${Number(q).toLocaleString("es-ES")} €`;
    return v.texto?String(v.texto):"";
  }

  function render(results,q){
    const b=box(); if(!b)return;
    if(count)count.textContent=String(results.length);
    if(!results.length){
      b.innerHTML=`<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Sin resultados</h3><p>No existe una coincidencia literal con «${esc(q)}».</p></div>`;
      return;
    }
    b.innerHTML=results.map(r=>{
      const art=r.articulo?(r.apartado?`${r.articulo}.${r.apartado}`:r.articulo):"";
      const s=sanction(r.sancion??r.multa);
      return `<article class="result-card cc-instant-result" style="display:block!important;opacity:1!important;visibility:visible!important;">
        <div class="result-card-header"><div><span class="result-ley">${esc(r.ley||"LO 4/2015")}</span>${art?`<span class="result-code">Art. ${esc(art)}</span>`:""}<h3>${esc(r.titulo||r.codigo||"Infracción")}</h3></div>${r.gravedad?`<span class="severity-badge">${esc(r.gravedad)}</span>`:""}</div>
        <p class="result-conducta">${esc(r.conducta||r.descripcion||"")}</p>
        ${s?`<div class="cc-instant-sanction"><strong>⚖️ Sanción</strong><span>${esc(s)}</span></div>`:""}
        <div class="result-meta"><span class="result-pill">${esc(r.codigo||r.fuente||"LOPSC")}</span></div>
      </article>`;
    }).join("");
  }

  async function search(q){
    const my=++generation; q=String(q||"").trim();
    if(!q){
      if(count)count.textContent="0";
      if(box())box().innerHTML='<div class="empty-state"><div class="empty-icon">🔎</div><h3>Buscar infracción</h3><p>Introduce un código, artículo o palabra clave para comenzar.</p></div>';
      return;
    }
    const data=await load(); if(my!==generation)return;
    let severity="all";
    const active=document.querySelector(".filter-chip[data-severity].active");
    if(active)severity=active.dataset.severity||"all";
    const found=[];
    for(const r of data){
      if(severity!=="all"&&norm(r?.gravedad)!==norm(severity))continue;
      const s=score(r,q);
      if(s>=0)found.push({...r,__score:s});
    }
    found.sort((a,b)=>b.__score-a.__score);
    render(found.slice(0,20),q);
  }

  function bindFilters(){
    document.querySelectorAll(".filter-chip[data-severity]").forEach(btn=>{
      if(btn.dataset.ccMotorFilter)return;
      btn.dataset.ccMotorFilter="1";
      btn.addEventListener("click",e=>{
        e.preventDefault();
        document.querySelectorAll(".filter-chip[data-severity]").forEach(x=>x.classList.remove("active"));
        btn.classList.add("active");
        search(input()?.value||"");
      },true);
    });
  }

  function install(){
    const i=input(); if(!i)return false;
    i.removeAttribute("disabled"); i.removeAttribute("readonly");
    bindFilters();
    if(!i.dataset.ccMotorInstalled){
      i.dataset.ccMotorInstalled="1";
      i.addEventListener("input",()=>{clearTimeout(timer);timer=setTimeout(()=>search(i.value),40);},true);
      i.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();e.stopImmediatePropagation();clearTimeout(timer);search(i.value);}},true);
    }
    if(!installed){installed=true;load();}
    return true;
  }

  function boot(){
    install();
    [50,150,300,600,1200,2500].forEach(ms=>setTimeout(()=>{install();bindFilters();},ms));
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
  window.CentinelaInstantSearch={search,install,load};
})();
