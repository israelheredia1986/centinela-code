/* CENTINELA IA V4 — motor híbrido remoto + normativa local */
(function(){
  "use strict";
  const IA_URL="https://okuygqbaliaeavhyezri.supabase.co/functions/v1/centinela-ia";
  const TIMEOUT=22000, MAX=2, BREAKER=45000;
  const DATA=[
    ["Infracciones","./data/infracciones.json"],["Tráfico","./data/infracciones_trafico.json"],
    ["LOPSC","./data/lopsc.json"],["Código Penal","./data/codigo_penal.json"],["Menores","./data/normativa_menores.json"],
    ["Violencia de género","./data/normativa_violencia_genero.json"],["Ordenanzas","./data/ordenanzas.json"],
    ["Animales","./data/normativa_animales.json"],["Tráfico","./data/normativa_trafico.json"],["Ley 2/1986","./data/ley_2_86.json"],
    ["LECrim","./data/lecrim.json"],["Extranjería","./data/extranjeria.json"],["Seguridad privada","./data/seguridad_privada.json"],
    ["Espectáculos públicos","./data/espectaculos_publicos.json"],["Medio ambiente y ruidos","./data/medio_ambiente_ruidos.json"],
    ["Reglamento de armas","./data/reglamento_armas.json"],["Policías Locales Andalucía","./data/policias_locales_andalucia.json"],
    ["Ley 39/2015","./data/ley_39_2015.json"],["Ley 7/1985","./data/ley_7_1985.json"],["Ley 5/2010 Andalucía","./data/ley_5_2010_andalucia.json"]
  ];
  const SYN={
    beber:["bebida","alcohol","consumo","botellon","via publica"],
    bebiendo:["beber","bebida","alcohol","consumo","via publica"],
    alcohol:["bebida","beber","consumo","botellon","via publica"],
    calle:["via publica","espacio publico","publico"],
    botellon:["alcohol","bebida","via publica","consumo"],
    ruido:["ruidos","musica","molestias","decibelios"],
    arma:["armas","arma blanca","navaja","cuchillo"]
  };
  const STOP=new Set("a al ante bajo con contra de del desde durante el en entre hacia hasta la las lo los para por segun sin sobre un una unos unas y o que".split(" "));
  let cache=null, breakerUntil=0, progress=null;
  const norm=s=>String(s??"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g," ").trim();
  const tok=s=>norm(s).split(/[^a-z0-9.]+/).filter(x=>x.length>1&&!STOP.has(x));
  function pick(o,names){if(!o||typeof o!=="object"||Array.isArray(o))return"";for(const n of names){const e=Object.entries(o).find(([k])=>norm(k)===norm(n));if(e&&e[1]!=null&&typeof e[1]!=="object")return String(e[1]);}return"";}
  function flat(v,d=0){if(d>4||v==null)return"";if(typeof v!=="object")return String(v);if(Array.isArray(v))return v.slice(0,30).map(x=>flat(x,d+1)).join(" ");return Object.entries(v).slice(0,60).map(([k,x])=>k+" "+flat(x,d+1)).join(" ");}
  function records(v,src,out=[],d=0){
    if(d>8||v==null||out.length>=6000)return out;
    if(Array.isArray(v)){v.forEach(x=>records(x,src,out,d+1));return out;}
    if(typeof v!=="object")return out;
    const article=pick(v,["articulo","artículo","article","art","precepto"]);
    const code=pick(v,["codigo","código"]);
    const title=pick(v,["titulo","título","title","denominacion","denominación","epigrafe","epígrafe","nombre","name"]);
    const description=pick(v,["conducta","descripcion","descripción","description","texto","text","contenido","content","tipificacion","tipificación","hechos","resumen"]);
    const severity=pick(v,["gravedad","severity","clasificacion","clasificación"]);
    const amount=pick(v,["cuantia","cuantía","importe","multa","sancion","sanción"]);
    const foundation=pick(v,["fundamento","fundamento_juridico","fundamento jurídico","base_legal","base legal"]);
    const action=pick(v,["actuacion_policial","actuación policial","actuacion","actuación","procedimiento"]);
    if(article||code||title||description||foundation||action){
      out.push({source:src,article,code,title,description,severity,amount,foundation,action,text:norm([src,article,code,title,description,severity,amount,foundation,action,flat(v)].join(" "))});
    }
    Object.values(v).forEach(x=>{if(x&&typeof x==="object")records(x,src,out,d+1)});
    return out;
  }
  async function load(){
    if(cache)return cache;
    cache=Promise.all(DATA.map(async([src,url])=>{try{const r=await fetch(url+"?ia=v4",{cache:"force-cache"});return r.ok?records(await r.json(),src):[];}catch(_){return[];}})).then(a=>a.flat());
    return cache;
  }
  function ranked(q,all){
    const original=tok(q),expanded=new Set(original);
    original.forEach(t=>(SYN[t]||[]).forEach(x=>expanded.add(norm(x))));
    return all.map(r=>{let s=0;original.forEach(t=>{if(norm(r.article)===t)s+=90;if(norm(r.title).includes(t))s+=28;if(norm(r.source).includes(t))s+=20;if(r.text.includes(t))s+=8;});[...expanded].forEach(t=>{if(r.text.includes(t))s+=4;});return{r,s};}).filter(x=>x.s>0).sort((a,b)=>b.s-a.s).slice(0,12).map(x=>x.r);
  }
  function textOf(d){if(typeof d==="string")return d.trim();return d?.choices?.[0]?.message?.content?.trim()||d?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()||d?.text?.trim()||d?.content?.trim()||"";}
  function errOf(d){if(typeof d==="string")return d;return d?.error?.message||d?.error||d?.message||"Proveedor remoto no disponible";}
  function retryable(status,msg){const m=norm(msg);return [429,500,502,503,504].includes(Number(status))||/high demand|rate limit|quota|overloaded|temporarily unavailable|timeout/.test(m);}
  function fallback(q,hits){
    const acciones=hits.map(r=>r.action).filter(Boolean).join(" ");
    const actuacion=acciones||"Comprobar la identidad de los intervinientes y documentar objetivamente los hechos observados. Determinar con precisión la conducta realizada y las circunstancias relevantes. Verificar el artículo, la calificación y la sanción aplicable antes de formular la denuncia. Recoger las pruebas disponibles y dejar constancia de las comprobaciones realizadas. Determinar el órgano competente y tramitar la denuncia conforme al procedimiento aplicable.";
    const fundamento=hits.map(r=>r.foundation).filter(Boolean).join(" ");
    const infracciones=hits.map(r=>({fuente:r.source,articulo:r.article,codigo:r.code,titulo:r.title,descripcion:r.description,gravedad:r.severity,cuantia:r.amount,fundamento:r.foundation,actuacion_policial:r.action}));
    return JSON.stringify({
      resumen:hits.length?`Se han localizado ${hits.length} coincidencias normativas relacionadas con la consulta. La calificación debe concretarse con los hechos y circunstancias realmente comprobados.`:`No hay coincidencia normativa local suficiente para: ${q}.`,
      infracciones,
      articulos:hits.map(r=>r.article).filter(Boolean),
      fundamento,
      actuacion_policial:actuacion,
      fuente:"Motor normativo local Centinela",
      aviso:"Resultado de contingencia: verificar el precepto, la competencia y la cuantía aplicable antes de formalizar la denuncia."
    });
  }
  function promptPolicial(q){
    const texto=String(q||"").trim();
    if(/FORMATO JSON EXACTO|HECHOS DEL AGENTE|HECHOS ORIGINALES/i.test(texto))return texto;
    return `Eres CENTINELA IA, asistente profesional de apoyo para Policía Local en España. Responde con lenguaje policial claro, objetivo, directo y práctico. No inventes datos, hechos, artículos, sanciones ni competencias. Usa el contexto normativo recibido y diferencia lo acreditado de lo que debe comprobarse.\n\nEstructura la respuesta, cuando proceda, en este orden: Valoración; Infracción y artículo; Norma aplicable; Calificación; Sanción o rango de sanción; Fundamento jurídico; Método de actuación policial. En el Método de actuación policial indica pasos concretos y ordenados para la intervención, comprobaciones, documentación de hechos, denuncia y trámite posterior que correspondan al caso. Si faltan datos, dilo expresamente y señala qué debe comprobar el agente. No devuelvas JSON, código, markdown, emojis ni etiquetas técnicas. No uses la palabra Fuente.\n\nCONSULTA DEL AGENTE:\n${texto}`;
  }
  async function remote(q,ctx){
    if(Date.now()<breakerUntil)throw Error("Proveedor remoto temporalmente saturado");
    let last;
    for(let i=0;i<MAX;i++){
      if(progress)progress(i?`Reintentando conexión (${i+1}/${MAX})...`:"Conectando con Centinela IA...");
      if(i)await new Promise(r=>setTimeout(r,1200*i));
      const c=new AbortController(),tm=setTimeout(()=>c.abort(),TIMEOUT);
      try{
        const res=await fetch(IA_URL,{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({pregunta:promptPolicial(q),contexto:ctx}),signal:c.signal});
        const raw=await res.text();clearTimeout(tm);
        let d;try{d=JSON.parse(raw);}catch(_){d=raw;}
        const t=textOf(d);
        if(res.ok&&t){breakerUntil=0;if(progress)progress("Centinela IA respondió.");return t;}
        last=Error(errOf(d));
        if(!retryable(res.status,last.message))break;
      }catch(e){clearTimeout(tm);last=e;if(!retryable(0,e.message))break;}
    }
    breakerUntil=Date.now()+BREAKER;throw last||Error("Proveedor remoto no disponible");
  }
  async function ask(q,onProgress){
    q=String(q||"").trim();if(!q)return"Escribe una consulta para Centinela IA.";
    progress=typeof onProgress==="function"?onProgress:null;
    try{
      if(progress)progress("Buscando normativa relevante...");
      const all=await load(),hits=ranked(q,all);
      const ctx=hits.map((r,i)=>`${i+1}. NORMA: ${r.source}${r.article?` | ARTÍCULO: ${r.article}`:""}${r.code?` | CÓDIGO: ${r.code}`:""}${r.title?` | TÍTULO: ${r.title}`:""}${r.severity?` | GRAVEDAD: ${r.severity}`:""}${r.amount?` | SANCIÓN: ${r.amount}`:""}\nCONTENIDO: ${String(r.description||r.foundation||"").replace(/\s+/g," ").slice(0,1500)}`).join("\n\n");
      try{return await remote(q,ctx);}catch(e){
        console.warn("Centinela IA remoto:",e);
        if(progress)progress("IA remota no disponible. Activando motor normativo local...");
        const result=fallback(q,hits);
        if(progress)progress("Resultado obtenido con el motor local.");
        return result;
      }
    }catch(e){
      console.error("Centinela IA:",e);
      return JSON.stringify({resumen:"Centinela IA no está disponible temporalmente.",infracciones:[],articulos:[],fundamento:"",actuacion_policial:"Comprueba la conexión y consulta la normativa local manualmente."});
    }finally{progress=null;}
  }
  window.preguntarCentinelaIA=ask;
  window.CentinelaIA={preguntar:ask,recargarDatos:()=>{cache=null;return load();},estado:()=>({remoto:Date.now()>=breakerUntil,breakerUntil}),setCallbackProgreso:f=>{progress=typeof f==="function"?f:null}};
  console.info("Centinela IA V4 híbrida activa");
})();
