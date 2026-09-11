/* ============================================================
   CENTINELA CODE — LEY DE PROCEDENCIA EN RESULTADOS
   Añade a cada artículo la ley/norma concreta a la que pertenece.
   No modifica el diseño ni sustituye el buscador: trabaja sobre
   los resultados ya renderizados por buscadores-core.js.

   FIX FREEZE (2026-09-11): el MutationObserver reescribía con
   textContent/innerHTML el mismo nodo que estaba observando en
   cada notificación. textContent/innerHTML siempre crean un nodo
   nuevo aunque el texto no cambie, así que cada escritura volvía
   a disparar el observer -> bucle de microtasks infinito que
   bloqueaba el hilo principal (la app se quedaba congelada tras
   encontrar un resultado, sin poder salir de la pantalla).
   Ahora solo se escribe en el DOM cuando el valor realmente
   cambia, y se añade una guarda de reentrada como protección
   adicional.
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
    ["Ley 5/2010 Andalucía","./data/ley_5_2010_andalucia.json"],
    ["Aforo, hostelería y eventos","./data/aforo_hosteleria_eventos.json"],
    ["Contrabando","./data/contrabando.json"],
    ["Propiedad industrial y falsificaciones","./data/propiedad_industrial_falsificaciones.json"],
    ["VMP, patinetes y bicicletas · infracciones","./data/infracciones_vmp_bicicletas.json"],
    ["VMP, patinetes y bicicletas","./data/normativa_vmp_bicicletas.json"],
    ["Reglamento General de Vehículos (RD 2822/1998)","./data/rd-2822-1998.json"],
    ["Temario Bloque 1 · jurídico","./data/bloque1_juridico.json"],
    ["Temario Bloque 1 · infracciones","./data/infracciones_bloque1.json"]
  ];

  const norm=v=>String(v??"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9.]+/g," ").replace(/\s+/g," ").trim();
  const esc=v=>String(v??"").replace(/[&<>\"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));

  function pick(o,names){
    if(!o||typeof o!=="object"||Array.isArray(o))return "";
    for(const n of names){
      const target=norm(n);
      const f=Object.entries(o).find(([k])=>norm(k)===target);
      if(f&&f[1]!=null&&typeof f[1]!=="object")return String(f[1]);
    }
    return "";
  }

  function articleOf(o){
    const article=pick(o,["articulo","artículo","article","art","precepto","numero"]);
    const apartado=pick(o,["apartado","parrafo","párrafo"]);
    if(!article)return "";
    return String(article)+(apartado&&!String(article).includes("."+apartado)?"."+apartado:"");
  }

  const records=[];

  function walk(v,source,path,inheritedLaw,depth){
    if(v==null||depth>12)return;
    if(Array.isArray(v)){
      v.forEach((x,i)=>walk(x,source,`${path}[${i}]`,inheritedLaw,depth+1));
      return;
    }
    if(typeof v!=="object")return;

    const ownLaw=pick(v,["ley","norma","normativa","fuenteNormativa","fuente_legal","fuenteLegal"]);
    const law=ownLaw||inheritedLaw||"";
    const article=articleOf(v);
    const code=pick(v,["codigo","código","code"]);
    const title=pick(v,["titulo","título","title","concepto","denominacion","denominación","epigrafe","epígrafe","nombre"]);
    const id=pick(v,["id"]);

    if(law&&(article||code||title||id))records.push({source,law,article,code,title,id,path});
    Object.entries(v).forEach(([k,x])=>{
      if(x&&typeof x==="object")walk(x,source,`${path}.${k}`,law,depth+1);
    });
  }

  async function load(){
    const groups=await Promise.all(DATA.map(async([source,url])=>{
      try{
        const r=await fetch(`${url}?lawui=20260910v1`,{cache:"no-store"});
        if(!r.ok)throw new Error(r.status);
        return {source,json:await r.json()};
      }catch(e){
        console.warn("Centinela — no se pudo cargar la procedencia legal:",url,e);
        return null;
      }
    }));
    groups.filter(Boolean).forEach(({source,json})=>walk(json,source,"$","",0));
    return records;
  }

  function cleanArticle(v){return norm(String(v||"").replace(/^art\.?\s*/i,""));}
  function cleanTitle(v){return norm(v).slice(0,180);}

  function findLaw(cardOrData){
    if(!records.length)return null;
    const source=norm(cardOrData.source||"");
    const article=cleanArticle(cardOrData.article||"");
    const title=cleanTitle(cardOrData.title||"");
    const code=norm(cardOrData.code||"");
    const id=norm(cardOrData.id||"");

    let best=null,bestScore=-1;
    for(const r of records){
      if(source&&norm(r.source)!==source)continue;
      let score=0;
      if(id&&norm(r.id)===id)score+=100;
      if(code&&norm(r.code)===code)score+=80;
      if(article&&cleanArticle(r.article)===article)score+=50;
      if(title&&cleanTitle(r.title)===title)score+=70;
      else if(title&&r.title&&cleanTitle(r.title).includes(title))score+=25;
      if(score>bestScore){bestScore=score;best=r;}
    }
    return bestScore>0?best:null;
  }

  function shortLaw(law){
    const s=String(law||"").trim();
    if(!s)return "";
    const m=s.match(/^(LO\s+\d+\/\d+|Ley\s+\d+\/\d+|Decreto\s+\d+\/\d+|RD\s+\d+\/\d+|Real Decreto\s+\d+\/\d+)/i);
    return m?m[1]:s;
  }

  /* Escritura segura: solo toca el DOM si el valor cambia de verdad.
     Esto es lo que impide que el propio MutationObserver se retrigger
     a sí mismo en bucle al ver un "cambio" que en realidad es idéntico. */
  function setTextIfChanged(el,text){
    if(!el)return;
    if(el.textContent!==text)el.textContent=text;
  }
  function setAttrIfChanged(el,attr,value){
    if(!el)return;
    if(el.getAttribute(attr)!==value)el.setAttribute(attr,value);
  }
  function setDatasetIfChanged(el,key,value){
    if(!el)return;
    if(el.dataset[key]!==value)el.dataset[key]=value;
  }

  function applyCards(){
    document.querySelectorAll("#consultaResults .cc-search-result").forEach(card=>{
      const source=card.dataset.ccLaw?"":(card.querySelector(".result-ley")?.textContent||"");
      const article=card.querySelector(".result-code")?.textContent||"";
      const title=card.querySelector("h3")?.textContent||"";
      const match=card.dataset.ccLaw?{law:card.dataset.ccLaw}:findLaw({source,article,title});
      if(!match)return;
      setDatasetIfChanged(card,"ccLaw",match.law);
      const label=card.querySelector(".result-ley");
      if(label){
        setTextIfChanged(label,shortLaw(match.law)||source);
        setAttrIfChanged(label,"title",match.law);
      }
      const detail=card.querySelector(".cc-detail");
      if(detail)setDatasetIfChanged(detail,"ccLaw",match.law);
    });
  }

  function applyModal(){
    const body=document.getElementById("modalBody");
    if(!body)return;
    const paragraphs=[...body.querySelectorAll("p")];
    const lawParagraph=paragraphs.find(p=>/^\s*Normativa\s*:/i.test(p.textContent||""));
    if(!lawParagraph)return;
    const selected=window.__ccSelectedLaw;
    if(!selected)return;
    const newHTML=`<strong>Normativa:</strong> ${esc(selected)}`;
    if(lawParagraph.innerHTML!==newHTML)lawParagraph.innerHTML=newHTML;
    setAttrIfChanged(lawParagraph,"title",selected);
  }

  function bind(){
    const results=document.getElementById("consultaResults");
    if(!results)return;

    results.addEventListener("click",e=>{
      const button=e.target.closest(".cc-detail");
      if(!button)return;
      const card=button.closest(".cc-search-result");
      if(card?.dataset.ccLaw)window.__ccSelectedLaw=card.dataset.ccLaw;
      setTimeout(applyModal,0);
    });

    /* Guarda de reentrada: además de las escrituras idempotentes de
       arriba, evita procesar notificaciones mientras ya se está
       aplicando una tanda anterior (protección extra, cinturón y
       tirantes). */
    let applyingResults=false;
    const resultsObserver=new MutationObserver(()=>{
      if(applyingResults)return;
      applyingResults=true;
      try{
        applyCards();
        applyModal();
      }finally{
        applyingResults=false;
      }
    });
    resultsObserver.observe(results,{childList:true,subtree:true});

    const modal=document.getElementById("modalBody");
    if(modal){
      let applyingModal=false;
      const modalObserver=new MutationObserver(()=>{
        if(applyingModal)return;
        applyingModal=true;
        try{
          applyModal();
        }finally{
          applyingModal=false;
        }
      });
      modalObserver.observe(modal,{childList:true,subtree:true});
    }

    applyCards();
  }

  load().then(()=>{
    bind();
    applyCards();
  });
})();
