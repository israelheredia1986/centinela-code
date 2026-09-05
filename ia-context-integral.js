/* CENTINELA — Contexto jurídico integral para IA. */
(function(){
  "use strict";
  const IA_URL="https://okuygqbaliaeavhyezri.supabase.co/functions/v1/centinela-ia";
  const DATA=[
    ["Infracciones","./data/infracciones.json"],["Tráfico · infracciones","./data/infracciones_trafico.json"],["VMP y bicicletas · infracciones","./data/infracciones_vmp_bicicletas.json"],["LOPSC","./data/lopsc.json"],["Código Penal","./data/codigo_penal.json"],["Menores","./data/normativa_menores.json"],["Violencia de género","./data/normativa_violencia_genero.json"],["Ordenanzas","./data/ordenanzas.json"],["Animales","./data/normativa_animales.json"],["Tráfico","./data/normativa_trafico.json"],["VMP y bicicletas","./data/normativa_vmp_bicicletas.json"],["Ley 2/1986","./data/ley_2_86.json"],["LECrim","./data/lecrim.json"],["Extranjería","./data/extranjeria.json"],["Seguridad privada","./data/seguridad_privada.json"],["Espectáculos públicos","./data/espectaculos_publicos.json"],["Medio ambiente y ruidos","./data/medio_ambiente_ruidos.json"],["Reglamento de armas","./data/reglamento_armas.json"],["Policías Locales Andalucía","./data/policias_locales_andalucia.json"],["Ley 39/2015","./data/ley_39_2015.json"],["Ley 7/1985","./data/ley_7_1985.json"],["Ley 5/2010 Andalucía","./data/ley_5_2010_andalucia.json"],["Bloque 1 jurídico","./data/bloque1_juridico.json"],["Infracciones Bloque 1","./data/infracciones_bloque1.json"],["Comercio ambulante","./data/comercio_ambulante.json"],["Contrabando","./data/contrabando.json"],["Propiedad industrial y falsificaciones","./data/propiedad_industrial_falsificaciones.json"],["Aforo y hostelería","./data/aforo_hosteleria_eventos.json"],["RD 1428/2003","./data/rd-1428-2003.json"],["RD 2822/1998","./data/rd-2822-1998.json"],["RD 818/2009","./data/rd-818-2009.json"]
  ];
  const STOP=new Set("a al ante bajo con contra de del desde durante el en entre hacia hasta la las lo los para por segun sin sobre un una unos unas y o que mi su se".split(" "));
  let promise=null,oldFetch=window.fetch;
  const norm=s=>String(s??"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  const primitive=v=>v!=null&&typeof v!=="object"?String(v):"";
  const pick=(o,names)=>{if(!o||typeof o!=="object"||Array.isArray(o))return"";for(const n of names){const k=Object.keys(o).find(x=>norm(x)===norm(n));if(k){const v=primitive(o[k]);if(v)return v;}}return""};
  function walk(v,source,out=[],depth=0,parent=[]){
    if(v==null||depth>10)return out;
    if(Array.isArray(v)){v.forEach(x=>walk(x,source,out,depth+1,parent));return out;}
    if(typeof v!=="object")return out;
    const law=pick(v,["ley","nombreLey","norma","nombreCategoria","categoria"]);
    const article=pick(v,["articulo","artículo","article","art","precepto"]);
    const title=pick(v,["titulo","título","title","denominacion","denominación","epigrafe","epígrafe","nombre","name"]);
    if(article){
      const full=JSON.stringify(v,null,2);
      out.push({source,article,title,law:law||parent.join(" / "),full,text:norm(full)});
    }
    const next=law?[...parent,law]:parent;
    Object.values(v).forEach(c=>{if(c&&typeof c==="object")walk(c,source,out,depth+1,next)});
    return out;
  }
  async function load(){
    if(promise)return promise;
    promise=Promise.allSettled(DATA.map(async([source,url])=>{const r=await oldFetch(url,{cache:"force-cache"});if(!r.ok)throw Error("HTTP "+r.status);return walk(await r.json(),source);})).then(rs=>rs.flatMap(x=>x.status==="fulfilled"?x.value:[]));
    return promise;
  }
  function tokens(q){return norm(q).split(/[^a-z0-9.]+/).filter(x=>x.length>1&&!STOP.has(x));}
  function rank(q,items){const ts=tokens(q);return items.map(x=>{const a=norm(x.article),t=norm(x.title),f=x.text;let score=0;for(const w of ts){if(a===w)score+=150;else if(a.includes(w))score+=80;if(t.includes(w))score+=90;if(f.includes(w))score+=8;}return {x,score};}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,3).map(x=>x.x);}
  async function integral(q){const hits=rank(q,await load());if(!hits.length)return"";return "\n\n=== CONTEXTO JURÍDICO INTEGRAL — ARTÍCULOS HIJO ===\n"+hits.map((x,i)=>`${i+1}. NORMA: ${x.source}${x.law?" | ÁMBITO: "+x.law:""} | ARTÍCULO: ${x.article}${x.title?" | TÍTULO: "+x.title:""}\nARTÍCULO ÍNTEGRO (objeto hijo conservado):\n${x.full}`).join("\n\n")+"\n=== FIN CONTEXTO JURÍDICO INTEGRAL ===";}
  window.fetch=async function(input,init){
    try{
      const url=typeof input==="string"?input:String(input?.url||"");
      if(url===IA_URL&&init?.method==="POST"&&init.body){
        const body=JSON.parse(init.body),q=String(body.pregunta||"");
        if(body.modo==="repository_fallback"&&q){const extra=await integral(q);if(extra){body.contexto=String(body.contexto||"")+extra;if(body.contexto.length>49000)body.contexto=body.contexto.slice(0,49000)+"\n[CONTEXTO RECORTADO POR LÍMITE DE TRANSMISIÓN]";}init={...init,body:JSON.stringify(body);}}
      }
    }catch(e){console.warn("Contexto integral IA:",e);}
    return oldFetch(input,init);
  };
  window.CentinelaContextoIntegral={recargar:()=>{promise=null;return load();},buscar:integral};
  console.info("Centinela IA: contexto integral de artículos hijo activo");
})();
