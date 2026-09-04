/* ============================================================
   CENTINELA CODE — CONSECUENCIAS JURÍDICAS V1
   Convierte el buscador en un resultado operativo:
   ARTÍCULO → CONDUCTA → PENA PENAL / SANCIÓN ADMINISTRATIVA.
   Funciona de forma transversal con los módulos normativos que
   tengan campos pena, sancion, sanción, multa, medidas o similares.
   ============================================================ */
(function(){
  "use strict";

  const RUTAS=[
    ["Contrabando","./data/contrabando.json"],
    ["Código Penal","./data/codigo_penal.json"],
    ["Extranjería","./data/extranjeria.json"],
    ["LOPSC","./data/lopsc.json"],
    ["Tráfico","./data/infracciones_trafico.json"],
    ["VMP","./data/infracciones_vmp_bicicletas.json"],
    ["Infracciones","./data/infracciones.json"],
    ["Ordenanzas","./data/ordenanzas.json"],
    ["Menores","./data/normativa_menores.json"],
    ["Violencia de género","./data/normativa_violencia_genero.json"],
    ["Animales","./data/normativa_animales.json"],
    ["Tráfico","./data/normativa_trafico.json"],
    ["Ley 39/2015","./data/ley_39_2015.json"],
    ["Ley 7/1985","./data/ley_7_1985.json"],
    ["Ley 5/2010 Andalucía","./data/ley_5_2010_andalucia.json"]
  ];
  const norm=v=>String(v??"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9.]+/g," ").replace(/\s+/g," ").trim();
  const esc=v=>String(v??"").replace(/[&<>\"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
  const flat=(v,d=0)=>{if(v==null||d>7)return"";if(typeof v!=="object")return String(v);return Array.isArray(v)?v.map(x=>flat(x,d+1)).join(" "):Object.entries(v).map(([k,x])=>k+" "+flat(x,d+1)).join(" ");};
  const get=(o,names)=>{if(!o||typeof o!=="object"||Array.isArray(o))return"";for(const n of names){const f=Object.entries(o).find(([k])=>norm(k)===norm(n));if(f&&f[1]!=null)return typeof f[1]==="object"?flat(f[1]):String(f[1]);}return"";};
  let dataPromise;

  function extract(o,source,path,out){
    if(!o||typeof o!=="object")return;
    if(Array.isArray(o)){o.forEach((x,i)=>extract(x,source,`${path}[${i}]`,out));return;}
    const pena=get(o,["pena","pena penal","penas","consecuencia penal","pena prevista","pena aplicable"]);
    const sanc=get(o,["sancion","sanción","sancion administrativa","sanción administrativa","sanciones","multa","cuantia","cuantía","importe","importe sancion","importe sanción"]);
    const medidas=get(o,["medidas","medida","comiso","decomiso","expulsion","expulsión","cierre","suspension","suspensión"]);
    if(pena||sanc||medidas){
      out.push({source,path,article:get(o,["articulo","artículo","numero","número","precepto"]),title:get(o,["titulo","título","concepto","denominacion","denominación","nombre"]),description:get(o,["descripcion","descripción","texto","conducta","tipificacion","tipificación","resumen"]),severity:get(o,["gravedad","clasificacion","clasificación"]),pena,sancion:sanc,medidas,search:norm(flat(o))});
    }
    Object.entries(o).forEach(([k,x])=>{if(x&&typeof x==="object")extract(x,source,`${path}.${k}`,out);});
  }

  async function load(){
    if(dataPromise)return dataPromise;
    dataPromise=Promise.all(RUTAS.map(async([source,url])=>{try{const r=await fetch(`${url}?legalv=20260904v2`,{cache:"no-store"});if(!r.ok)return[];const j=await r.json(),out=[];extract(j,source,"$",out);return out;}catch{return[];}})).then(a=>a.flat());
    return dataPromise;
  }

  function score(r,q){
    const n=norm(q),w=n.split(" ").filter(x=>x.length>2);let s=0;
    if(r.search.includes(n))s+=1000;
    w.forEach(x=>{if(r.search.includes(x))s+=80;if(norm(r.title).includes(x))s+=150;if(norm(r.article).includes(x))s+=120;});
    return s;
  }

  function makeCard(r){
    const consequence=[];
    if(r.pena)consequence.push(`<span class="result-pill result-pill--pena"><strong>Pena penal</strong>: ${esc(r.pena)}</span>`);
    if(r.sancion)consequence.push(`<span class="result-pill result-pill--sancion"><strong>Sanción administrativa</strong>: ${esc(r.sancion)}</span>`);
    if(r.medidas)consequence.push(`<span class="result-pill"><strong>Medidas</strong>: ${esc(r.medidas)}</span>`);
    return `<article class="result-card cc-search-result cc-legal-consequence-result"><div class="result-card-header"><div><span class="result-ley">${esc(r.source)}</span>${r.article?`<span class="result-code">Art. ${esc(r.article)}</span>`:""}<h3>${esc(r.title||"Consecuencia jurídica")}</h3></div>${r.severity?`<span class="severity-badge">${esc(r.severity)}</span>`:""}</div><p class="result-conducta">${esc(r.description||"Consulta el régimen jurídico aplicable.")}</p><div class="result-meta">${consequence.join("")}</div><button type="button" class="result-detail-button cc-detail cc-legal-detail">Ver detalle</button></article>`;
  }

  async function append(q){
    const box=document.getElementById("consultaResults");if(!box||!q)return;
    const all=await load();const hits=all.map(r=>({r,s:score(r,q)})).filter(x=>x.s>0).sort((a,b)=>b.s-a.s).slice(0,12).map(x=>x.r);
    if(!hits.length)return;
    const existing=[...box.querySelectorAll(".cc-legal-consequence-result")].map(x=>x.textContent).join(" ");
    hits.forEach(r=>{const marker=`${r.source}|${r.article}|${r.title}`;if(existing.includes(r.title||"§§never"))return;box.insertAdjacentHTML("beforeend",makeCard(r));});
  }

  function patch(){
    if(!window.CentinelaSearch?.search){setTimeout(patch,300);return;}
    if(window.CentinelaSearch.__consequencePatched)return;
    const original=window.CentinelaSearch.search;
    window.CentinelaSearch.search=async function(q){const ret=await original.call(this,q);await append(q);return ret;};
    window.CentinelaSearch.__consequencePatched=true;
  }
  patch();
  window.CentinelaLegalConsequences={load,append};
})();
