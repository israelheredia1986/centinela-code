/* ============================================================
   CENTINELA CODE — ENRIQUECEDOR JURÍDICO DEL BUSCADOR
   Añade a CUALQUIER resultado la consecuencia jurídica disponible:
   - Pena penal
   - Sanción administrativa
   - Multa / cuantía
   - Expulsión / decomiso / medidas
   - Artículo sancionador relacionado
   No sustituye el texto legal: lo complementa.
   ============================================================ */
(function(){
  "use strict";

  const EXTRA=[
    ["./data/contrabando.json","Contrabando"],
    ["./data/ley_contrabando.json","Contrabando"],
    ["./data/ley_12_1995_contrabando.json","Contrabando"],
    ["./data/contrabando_sanciones.json","Contrabando"],
    ["./data/infracciones.json","Infracciones"],
    ["./data/infracciones_trafico.json","Tráfico · sanciones"],
    ["./data/infracciones_vmp_bicicletas.json","VMP · sanciones"]
  ];
  let cache=null;

  const norm=v=>String(v??"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9.]+/g," ").replace(/\s+/g," ").trim();
  const text=v=>{if(v==null)return"";if(typeof v!=="object")return String(v);if(Array.isArray(v))return v.map(text).join(" ");return Object.entries(v).map(([k,x])=>k+" "+text(x)).join(" ");};
  const pick=(o,n)=>{if(!o||typeof o!=="object"||Array.isArray(o))return"";for(const k of n){const f=Object.entries(o).find(([a])=>norm(a)===norm(k));if(f&&f[1]!=null)return typeof f[1]==="object"?text(f[1]):String(f[1]);}return"";};
  const clean=v=>String(v||"").replace(/\s+/g," ").trim();

  function consequence(o){
    if(!o||typeof o!=="object")return null;
    const all=text(o), n=norm(all);
    const pena=clean(pick(o,["pena","pena penal","penas","consecuencia penal","pena prevista","pena aplicable"]));
    const sanc=clean(pick(o,["sancion","sanción","sancion administrativa","sanción administrativa","sanciones","multa","cuantia","cuantía","importe","importe sancion","importe sanción"]));
    const medidas=clean(pick(o,["medidas","medida","consecuencias","decomiso","comiso","expulsion","expulsión","inhabilitacion","inhabilitación","cierre"]));
    const artSanc=clean(pick(o,["articulo sancionador","artículo sancionador","articulo sancion","artículo sanción","precepto sancionador","precepto sancion"]));
    const criminal=pena || (/prision|prisión|multa de .* meses|inhabilitacion especial|inhabilitación especial|pena de/.test(n)?clean((all.match(/(?:pena[^.]{0,180}(?:prision|prisión|multa|inhabilitacion|inhabilitación)[^.]*\.)/i)||[])[0]):"");
    const administrative=sanc || (/sancion|sanción|multa|expulsion|expulsión/.test(n)?clean((all.match(/(?:sancion|sanción|multa|expulsion|expulsión)[^.]{0,220}(?:\.|$)/i)||[])[0]):"");
    if(!criminal&&!administrative&&!medidas&&!artSanc)return null;
    return {pena:criminal,sancion:administrative,medidas,articulo:artSanc};
  }

  function walk(v,out,src,path){
    if(v==null||typeof v!=="object")return;
    if(Array.isArray(v)){v.forEach((x,i)=>walk(x,out,src,`${path}[${i}]`));return;}
    const c=consequence(v);
    if(c)out.push({src,path,c,search:norm(text(v)),raw:v});
    Object.entries(v).forEach(([k,x])=>{if(x&&typeof x==="object")walk(x,out,src,`${path}.${k}`);});
  }

  async function load(){
    if(cache)return cache;
    cache=Promise.all(EXTRA.map(async([url,src])=>{
      try{const r=await fetch(`${url}?legalv=20260904`,{cache:"no-store"});if(!r.ok)return[];const j=await r.json(),o=[];walk(j,o,src,"$");return o;}
      catch{return[];}
    })).then(a=>a.flat());
    return cache;
  }

  function find(q,index){
    const n=norm(q);if(!n)return[];const words=n.split(" ").filter(x=>x.length>2);
    return index.map(x=>({x,s:words.reduce((s,w)=>s+(x.search.includes(w)?1:0),0)})).filter(x=>x.s>0).sort((a,b)=>b.s-a.s).slice(0,8).map(x=>x.x);
  }

  async function enrich(result,q){
    const idx=await load();const hits=find(q,idx);const n=norm(q);
    const exact=hits.find(h=>h.search.includes(n))||hits[0];
    if(!exact)return result;
    return Object.assign({},result,{legalConsequence:exact.c});
  }

  window.CentinelaLegal={load,enrich,find};
})();
