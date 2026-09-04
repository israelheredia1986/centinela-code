/* ============================================================
   CENTINELA IA — INTERNET FIRST
   1) Busca primero en Internet mediante la Edge Function.
   2) Solo si no existe respuesta web fiable, consulta el repositorio.
   ============================================================ */
(function(){
  "use strict";
  const IA_URL="https://okuygqbaliaeavhyezri.supabase.co/functions/v1/centinela-ia";
  const DATA=[
    ["Infracciones","./data/infracciones.json"],["Tráfico","./data/infracciones_trafico.json"],
    ["LOPSC","./data/lopsc.json"],["Código Penal","./data/codigo_penal.json"],["Menores","./data/normativa_menores.json"],
    ["Violencia de género","./data/normativa_violencia_genero.json"],["Ordenanzas","./data/ordenanzas.json"],
    ["Animales","./data/normativa_animales.json"],["Ley 2/1986","./data/ley_2_86.json"],["LECrim","./data/lecrim.json"],
    ["Extranjería","./data/extranjeria.json"],["Seguridad privada","./data/seguridad_privada.json"],
    ["Espectáculos públicos","./data/espectaculos_publicos.json"],["Medio ambiente y ruidos","./data/medio_ambiente_ruidos.json"],
    ["Reglamento de armas","./data/reglamento_armas.json"],["Policías Locales Andalucía","./data/policias_locales_andalucia.json"],
    ["Ley 39/2015","./data/ley_39_2015.json"],["Ley 7/1985","./data/ley_7_1985.json"],["Ley 5/2010 Andalucía","./data/ley_5_2010_andalucia.json"]
  ];
  const norm=s=>String(s??"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g," ").trim();
  const STOP=new Set("a al ante bajo con contra de del desde durante el en entre hacia hasta la las lo los para por segun sin sobre un una unos unas y o que mi su".split(" "));
  const tok=s=>norm(s).split(/[^a-z0-9.]+/).filter(x=>x.length>1&&!STOP.has(x));
  const SYN={
    extranjero:["extranjeria","documentacion","documento","identificacion","estancia","infraccion extranjeros"],
    extranjera:["extranjeria","documentacion","documento","identificacion","estancia"],
    documentar:["documentacion","documento","identificacion","extranjero","extranjeria"],
    documentacion:["documentar","documento","identificacion","extranjero","extranjeria"],
    indocumentado:["documentacion","documento","identificacion","extranjero","extranjeria"],
    indocumentada:["documentacion","documento","identificacion","extranjera","extranjeria"],
    borracho:["alcohol","embriaguez","ebriedad","intoxicado","bebida"],
    borracha:["alcohol","embriaguez","ebriedad","intoxicada","bebida"],
    beber:["bebida","alcohol","consumo","botellon","via publica"],
    alcohol:["bebida","beber","consumo","botellon","via publica"],
    carnet:["permiso","licencia","conducir","conduccion"],
    carné:["permiso","licencia","conducir","conduccion"],
    conducir:["conduccion","permiso","licencia","vehiculo"],
    nino:["niño","menor","menores","edad"],
    niño:["nino","menor","menores","edad"],
    menor:["menores","edad","nino","niño"],
    calle:["via publica","espacio publico","publico"]
  };
  let oldAsk=null, installed=false;

  function txt(v){return typeof v==="string"?v.trim():v?.text?.trim()||v?.choices?.[0]?.message?.content?.trim()||v?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()||"";}

  async function webFirst(q,onProgress){
    if(onProgress)onProgress("Buscando en Internet...");
    try{
      const ctl=new AbortController();
      const timer=setTimeout(()=>ctl.abort(),45000);
      const r=await fetch(IA_URL,{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({pregunta:q,modo:"web_first"}),signal:ctl.signal});
      const raw=await r.text();clearTimeout(timer);
      let d;try{d=JSON.parse(raw);}catch(_){d={text:raw};}
      if(!r.ok)return{found:false,error:d?.error||d?.message||"Sin respuesta web"};
      const text=txt(d);
      if(d?.web_found===true&&text)return{found:true,text,sources:Array.isArray(d.sources)?d.sources:[]};
      return{found:false,error:d?.reason||"No se encontró una respuesta web fiable."};
    }catch(e){return{found:false,error:e};}
  }

  async function loadRepo(){
    const res=await Promise.all(DATA.map(async([src,url])=>{try{const r=await fetch(url+"?internet-first=1",{cache:"no-store"});if(!r.ok)return[];return[{src,data:await r.json()}];}catch(_){return[];}}));
    return res.flat();
  }

  function flat(v,depth=0){
    if(depth>5||v==null)return"";
    if(typeof v!=="object")return String(v);
    if(Array.isArray(v))return v.slice(0,80).map(x=>flat(x,depth+1)).join(" ");
    return Object.entries(v).slice(0,100).map(([k,x])=>`${k} ${flat(x,depth+1)}`).join(" ");
  }

  function localHits(q,files){
    const original=tok(q),expanded=new Set(original);
    original.forEach(t=>(SYN[t]||[]).forEach(x=>expanded.add(norm(x))));
    const hits=[];
    files.forEach(({src,data})=>{
      const text=norm(`${src} ${flat(data)}`);let score=0,matched=0;
      original.forEach(t=>{if(text.includes(t)){score+=10;matched++;}});
      [...expanded].forEach(t=>{if(!original.includes(t)&&text.includes(t))score+=4;});
      if(original.length>1&&matched===0)return;
      if(original.length>=3&&matched===1)score*=.3;
      if(score>0)hits.push({src,text,score});
    });
    return hits.sort((a,b)=>b.score-a.score).slice(0,10);
  }

  async function repoFallback(q,onProgress){
    if(onProgress)onProgress("No he localizado una respuesta fiable en Internet. Consultando el repositorio normativo...");
    const files=await loadRepo(),hits=localHits(q,files);
    const context=hits.map((h,i)=>`${i+1}. NORMA: ${h.src}\nCONTENIDO: ${h.text.slice(0,5000)}`).join("\n\n");
    try{
      const ctl=new AbortController();const timer=setTimeout(()=>ctl.abort(),45000);
      const r=await fetch(IA_URL,{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({pregunta:q,modo:"repository_fallback",contexto:context}),signal:ctl.signal});
      const raw=await r.text();clearTimeout(timer);let d;try{d=JSON.parse(raw);}catch(_){d={text:raw};}
      if(!r.ok)return{found:false,text:"No se ha podido obtener una respuesta fiable del repositorio."};
      const text=txt(d);return{found:!!text,text:text||"No se ha encontrado información suficiente en el repositorio."};
    }catch(_){return{found:false,text:"No se ha podido consultar el repositorio normativo."};}
  }

  function instalar(){
    if(installed)return;
    oldAsk=window.preguntarCentinelaIA;
    if(typeof oldAsk!=="function"){setTimeout(instalar,300);return;}
    window.preguntarCentinelaIA=async function(q,onProgress){
      q=String(q||"").trim();if(!q)return"Escribe una consulta para Centinela IA.";
      const web=await webFirst(q,onProgress);
      if(web.found){
        if(onProgress)onProgress("Respuesta obtenida de Internet.");
        return web.text+(web.sources?.length?`\n\nReferencias consultadas:\n${web.sources.slice(0,6).map((s,i)=>`${i+1}. ${s.title||s.uri||"Referencia web"}${s.uri?` — ${s.uri}`:""}`).join("\n")}`:"");
      }
      const repo=await repoFallback(q,onProgress);
      if(repo.found)return repo.text;
      return repo.text;
    };
    window.CentinelaIAInternetFirst={version:"1.0",internetFirst:true,repositoryFallback:true};
    installed=true;
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(instalar,1500),{once:true});
  else setTimeout(instalar,1500);
})();
