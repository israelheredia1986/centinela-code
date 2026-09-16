/* ============================================================
   CENTINELA CODE — MOTOR ÚNICO DE CONSULTA
   V5 — búsqueda literal, inmediata y sin falsos positivos.
   ============================================================ */
(function(){
  "use strict";
  const VERSION="20260916f";
  const input=()=>document.getElementById("consultaSearch");
  const box=()=>document.getElementById("consultaResults");
  const count=()=>document.getElementById("consultaResultCount");
  let rows=null, loading=null, timer=null, generation=0, installed=false;

  const norm=s=>String(s??"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9./]+/g," ").replace(/\s+/g," ").trim();
  const esc=s=>String(s??"").replace(/[&<>\"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));

  function list(v){
    if(Array.isArray(v)) return v.map(x=>String(x));
    return v==null?[]:[String(v)];
  }

  async function load(){
    if(rows) return rows;
    if(loading) return loading;
    loading=fetch(`./data/infracciones.json?motor=${VERSION}`,{cache:"no-store",headers:{Accept:"application/json"}})
      .then(r=>{if(!r.ok)throw new Error(String(r.status));return r.json();})
      .then(j=>Array.isArray(j)?j:(Array.isArray(j?.infracciones)?j.infracciones:[]))
      .catch(e=>{console.warn("Centinela consulta:",e);return [];});
    rows=await loading;
    return rows;
  }

  function exactWord(text,q){
    const n=norm(text), t=norm(q);
    if(!t)return false;
    return n===t || n.includes(` ${t} `) || n.startsWith(t+" ") || n.endsWith(" "+t);
  }

  function score(r,q){
    const n=norm(q);
    if(!n)return -1;
    const codigo=norm(r?.codigo), art=norm(r?.articulo), apartado=norm(r?.apartado);
    if(codigo===n || `${art}.${apartado}`===n || art===n) return 10000;

    const titulo=norm(r?.titulo);
    const conducta=norm(r?.conducta);
    const descripcion=norm([r?.descripcion,r?.descripcion_corta,r?.materia,r?.objeto].join(" "));
    const claves=list(r?.palabrasClave).map(norm);
    let s=-1;

    // La coincidencia debe ser LITERAL. No se traducen sinónimos:
    // "navaja" no equivale a "arma", "explosivos", etc.
    if(exactWord(titulo,n)) s=Math.max(s,9000);
    if(exactWord(conducta,n)) s=Math.max(s,8500);
    if(exactWord(descripcion,n)) s=Math.max(s,8000);
    if(claves.some(k=>exactWord(k,n))) s=Math.max(s,6500);

    // Una coincidencia literal en palabrasClave vale, pero queda detrás
    // de una coincidencia textual real en título/conducta.
    if(s<0)return -1;

    // Evita que una coincidencia de "navaja" quede por encima de un
    // artículo claramente centrado en explosivos/cartuchería/pirotecnia.
    const armaLiteral=["navaja","navajas","cuchillo","cuchillos","cuchilla","cuchillas","daga","dagas","punal","puñal","espada","espadas","katana","katanas","sable","sables","machete","machetes","estilete"];
    if(armaLiteral.includes(n)){
      const t=titulo+" "+conducta;
      if(/explosivos|cartucheria|pirotecnia/.test(t)) s-=1200;
      if(/armas prohibidas|portar|exhibir|usar armas/.test(t)) s+=700;
    }
    if(r?.sancion) s+=100;
    return s;
  }

  function severityValue(r){
    return norm(r?.gravedad);
  }

  function sanction(v){
    if(v==null)return "";
    if(typeof v!=="object")return String(v);
    const min=v.min??v.minimo??v.importe_min;
    const max=v.max??v.maximo??v.importe_max;
    const q=v.cuantia??v.cuantía;
    if(min!=null&&max!=null)return `${Number(min).toLocaleString("es-ES")} € – ${Number(max).toLocaleString("es-ES")} €`;
    if(min!=null)return `Desde ${Number(min).toLocaleString("es-ES")} €`;
    if(max!=null)return `Hasta ${Number(max).toLocaleString("es-ES")} €`;
    if(q!=null)return `${Number(q).toLocaleString("es-ES")} €`;
    return v.texto?String(v.texto):"";
  }

  function render(results,q){
    const b=box();
    if(!b)return;
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
    const my=++generation;
    q=String(q||"").trim();
    if(!q){
      if(count)count.textContent="0";
      if(box())box().innerHTML='<div class="empty-state"><div class="empty-icon">🔎</div><h3>Buscar infracción</h3><p>Introduce un código, artículo o palabra clave para comenzar.</p></div>';
      return;
    }
    const data=await load();
    if(my!==generation)return;

    let severity="all";
    const active=document.querySelector(".filter-chip[data-severity].active");
    if(active)severity=active.dataset.severity||"all";

    const found=[];
    for(const r of data){
      if(severity!=="all"&&severityValue(r)!==severityValue({gravedad:severity}))continue;
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
    const i=input();
    if(!i)return false;
    i.removeAttribute("disabled");
    i.removeAttribute("readonly");
    bindFilters();
    if(!i.dataset.ccMotorInstalled){
      i.dataset.ccMotorInstalled="1";
      i.addEventListener("input",()=>{
        clearTimeout(timer);
        timer=setTimeout(()=>search(i.value),50);
      },true);
      i.addEventListener("keydown",e=>{
        if(e.key==="Enter"){
          e.preventDefault();e.stopPropagation();
          clearTimeout(timer);search(i.value);
        }
      },true);
    }
    if(!installed){installed=true;load();}
    return true;
  }

  function boot(){install();[100,300,800,1500,2500].forEach(ms=>setTimeout(()=>{install();bindFilters();},ms));}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
  window.CentinelaInstantSearch={search,install,load};
})();
