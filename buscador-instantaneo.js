/* ============================================================
   CENTINELA CODE — MOTOR ÚNICO DE CONSULTA
   V8 — cubre TODAS las bases de infracciones (antes solo indexaba
   infracciones.json, 106 de ~340 registros) y usa el marcado real
   de tarjeta (severity-badge con data-gravedad, result-pill--sancion)
   para que la sanción se pinte en verde neón como en el resto de
   la app. Búsqueda literal, inmediata y sin falsos positivos.
   ============================================================ */
(function(){
  "use strict";
  const VERSION="20260917a";
  const input=()=>document.getElementById("consultaSearch");
  const box=()=>document.getElementById("consultaResults");
  const count=()=>document.getElementById("consultaResultCount");
  let rows=null,loading=null,timer=null,generation=0,installed=false;

  const norm=s=>String(s??"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9./]+/g," ").replace(/\s+/g," ").trim();
  const esc=s=>String(s??"").replace(/[&<>\"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
  const list=v=>Array.isArray(v)?v.map(String):v==null?[]:[String(v)];

  // ------------------------------------------------------------
  // FUENTES DE DATOS
  // Antes el motor solo leía "infracciones.json" (LOPSC, 106
  // registros). Faltaban tráfico, VMP/patinetes, extranjería,
  // seguridad privada, espectáculos públicos, medio ambiente,
  // armas, Policías Locales de Andalucía y comercio ambulante:
  // de ahí que la mayoría de búsquedas no encontraran nada.
  // ------------------------------------------------------------
  const FUENTES=[
    {url:"./data/infracciones.json",fuenteLabel:"LOPSC"},
    {url:"./data/infracciones_trafico.json",fuenteLabel:"Tráfico"},
    {url:"./data/infracciones_vmp_bicicletas.json",fuenteLabel:"VMP/Bicicletas"},
    {url:"./data/ley_2_86.json",fuenteLabel:"LO 2/1986"},
    {url:"./data/lecrim.json",fuenteLabel:"LECrim"},
    {url:"./data/extranjeria.json",fuenteLabel:"Extranjería"},
    {url:"./data/seguridad_privada.json",fuenteLabel:"Seguridad privada"},
    {url:"./data/espectaculos_publicos.json",fuenteLabel:"Espectáculos públicos"},
    {url:"./data/medio_ambiente_ruidos.json",fuenteLabel:"Medio ambiente/Ruidos"},
    {url:"./data/reglamento_armas.json",fuenteLabel:"Reglamento de armas"},
    {url:"./data/policias_locales_andalucia.json",fuenteLabel:"Policías Locales Andalucía"},
    {url:"./data/comercio_ambulante.json",fuenteLabel:"Comercio ambulante"},
    {url:"./data/propiedad_industrial_falsificaciones.json",fuenteLabel:"Código Penal"},
    {url:"./data/aforo_hosteleria_eventos.json",fuenteLabel:"Aforo/Hostelería"}
  ];

  // Palabras clave que faltaban en el art. 36.16 LOPSC (consumo/tenencia
  // de drogas en vía pública): sin ellas, "hachís", "cocaína", etc. no
  // encontraban esa infracción. Se conserva del motor anterior.
  const PALABRAS_CLAVE_EXTRA_36_16=[
    "hachis","hachís","cocaina","cocaína","marihuana","resina de hachis","resina de hachís",
    "mdma","extasis","éxtasis","anfetaminas","heroina","heroína","sustancia estupefaciente",
    "sustancias estupefacientes","droga toxica","droga tóxica","drogas toxicas","drogas tóxicas",
    "sustancia psicotropica","sustancia psicotrópica","consumo via publica","consumo vía pública",
    "tenencia ilicita","tenencia ilícita","planta de cannabis","plantas de cannabis","cultivo de cannabis"
  ];

  function extraerArray(json){
    if(Array.isArray(json))return json;
    if(json&&Array.isArray(json.infracciones))return json.infracciones;
    return [];
  }

  // Normaliza cualquiera de los esquemas presentes en /data a una única
  // forma común. Es idempotente para los ficheros "estructurados" (ya
  // traen codigo/ley/articulo/apartado/gravedad/titulo/conducta/sancion)
  // y traduce los ficheros "planos" (normativa/concepto/descripcion) y
  // variantes de palabras clave (palabrasClave / keywords / palabras_clave).
  function normalizar(raw,cfg){
    const articuloBruto=raw.articulo??raw.numero??"";
    const articulo=String(articuloBruto).replace(/^art[íi]?\.?\s*/i,"").trim();
    const sancionBruta=raw.sancion??raw.multa;
    let sancion=null;
    if(sancionBruta&&typeof sancionBruta==="object")sancion=sancionBruta;
    else if(sancionBruta)sancion={texto:String(sancionBruta)};
    const palabrasClave=raw.palabrasClave||raw.keywords||raw.palabras_clave||[];
    return {
      id:raw.id||"",
      codigo:raw.codigo||articulo||raw.id||"",
      ley:raw.ley||raw.normativa||cfg.fuenteLabel||"",
      articulo,
      apartado:raw.apartado?String(raw.apartado):"",
      gravedad:raw.gravedad||"",
      titulo:raw.titulo||raw.concepto||"",
      conducta:raw.conducta||raw.descripcion||"",
      sancion,
      palabrasClave:Array.isArray(palabrasClave)?palabrasClave:[],
      fuente:raw.fuente||cfg.fuenteLabel||raw.normativa||"",
      // Solo las infracciones de tráfico llevan esta clave en origen (incluso
      // cuando su valor es null, "no lleva puntos"). El resto de fuentes
      // (LOPSC, seguridad privada, extranjería...) no la tienen: para ellas
      // el concepto "puntos del carné" no existe y no se muestra ninguna
      // píldora, en vez de un "sin retirada de puntos" fuera de lugar.
      puntos:Object.prototype.hasOwnProperty.call(raw,"puntos")?raw.puntos:undefined
    };
  }

  function aplicarPalabrasClaveExtra(datos){
    datos.forEach(r=>{
      if(String(r.articulo)==="36"&&String(r.apartado)==="16"){
        const existentes=Array.isArray(r.palabrasClave)?r.palabrasClave:[];
        r.palabrasClave=existentes.concat(PALABRAS_CLAVE_EXTRA_36_16.filter(p=>!existentes.includes(p)));
      }
    });
  }

  async function load(){
    if(rows)return rows;
    if(loading)return loading;
    loading=Promise.all(FUENTES.map(cfg=>
      fetch(`${cfg.url}?motor=${VERSION}`,{cache:"no-store",headers:{Accept:"application/json"}})
        .then(r=>{if(!r.ok)throw new Error(String(r.status));return r.json();})
        .then(j=>extraerArray(j).map(item=>normalizar(item,cfg)))
        .catch(e=>{console.warn(`Centinela consulta — ${cfg.url}:`,e);return [];})
    )).then(listas=>{
      const datos=[].concat(...listas);
      aplicarPalabrasClaveExtra(datos);
      return datos;
    });
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
    if(codigo===n||(apartado&&`${art}.${apartado}`===n)||art===n)return 10000;

    const titulo=norm(r?.titulo);
    const conducta=norm(r?.conducta);
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
    const directoClave=claves.some(x=>exactWord(x,n));

    if(esCategoriaExclusiva&&directoClave&&!directoTitulo&&!directoConducta){
      return -1;
    }

    let s=-1;
    if(directoTitulo)s=9000;
    else if(directoConducta)s=8500;
    else if(directoClave)s=6500;
    else return -1;

    // Para armas concretas damos prioridad a una coincidencia real en el
    // contenido antes que a una simple palabra clave.
    const armasConcretas=new Set(["navaja","navajas","cuchillo","cuchillos","cuchilla","cuchillas","daga","dagas","punal","puñal","espada","espadas","katana","katanas","sable","sables","machete","machetes","estilete"]);
    if(armasConcretas.has(n)){
      if(directoTitulo)s+=1200;
      else if(directoConducta)s+=900;
      else if(directoClave)s+=100;
    }
    if(r?.sancion)s+=100;
    return s;
  }

  function sanctionText(v){
    if(v==null)return "";
    if(typeof v!=="object")return String(v);
    const min=v.min??v.minimo??v.importe_min;
    const max=v.max??v.maximo??v.importe_max;
    const q=v.cuantia??v.cuantía;
    const fmt=n=>new Intl.NumberFormat("es-ES",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(Number(n));
    // Cuantía fija: los datos la codifican como min===max (ej. 200/200).
    // Antes se pintaba "200 € - 200 €", que es ruido visual.
    if(min!=null&&max!=null)return Number(min)===Number(max)?fmt(min):`${fmt(min)} - ${fmt(max)}`;
    if(min!=null)return `Desde ${fmt(min)}`;
    if(max!=null)return `Hasta ${fmt(max)}`;
    if(q!=null)return fmt(q);
    // Sanciones variables por ley (ej. art. 77.j: el doble/triple de la
    // infracción originaria) no tienen cuantía numérica, solo una nota.
    // Sin este caso la etiqueta de sanción desaparecía por completo.
    // Las bases de contrabando/LOPSC usan además "detalle" y "tipo"
    // (multa proporcional al valor de los bienes, penas de prisión, etc.),
    // que tampoco se leían: 16 registros salían sin sanción visible.
    const textoLibre=v.texto??v.nota??v.detalle;
    if(textoLibre)return String(textoLibre);
    // Esquema por tramos de gravedad (contrabando, art. 12 LO 12/1995):
    // la multa es un porcentaje sobre el valor de los bienes con un mínimo
    // en euros, desglosado por leve/grave/muyGrave. No se leía en absoluto.
    const tramo=v.muyGrave||v.grave||v.leve;
    if(tramo&&typeof tramo==="object"){
      const pMin=tramo.minPorcentaje,pMax=tramo.maxPorcentaje,mMin=tramo.multaMin;
      const partes=[];
      if(pMin!=null&&pMax!=null)partes.push(`${pMin}%-${pMax}% del valor`);
      else if(pMin!=null)partes.push(`desde el ${pMin}% del valor`);
      if(mMin!=null)partes.push(`mín. ${fmt(mMin)}`);
      if(partes.length)return partes.join(", ");
    }
    return v.tipo?String(v.tipo):"";
  }

  function pointsText(p){
    // p===undefined: la fuente no documenta puntos (no es tráfico) -> sin píldora.
    // p===null: es tráfico y consta expresamente que NO se detraen puntos.
    // p es número: puntos fijos a detraer.
    // p es {variable:true, texto}: depende del exceso (velocidad, anexo IV).
    if(p===undefined)return null;
    if(p===null)return "Sin retirada de puntos";
    if(typeof p==="number")return p===1?"1 punto":`${p} puntos`;
    if(typeof p==="object"&&p.texto)return String(p.texto);
    return "Sin retirada de puntos";
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
      let rango=sanctionText(r.sancion);
      // Las sanciones descritas en texto legal (multa proporcional, penas
      // de prisión, reglas por cantidad) pueden ocupar varias líneas y
      // rompen la etiqueta; se recortan para que la píldora no desborde.
      if(rango.length>90)rango=rango.slice(0,90).trim()+"…";
      const puntos=pointsText(r.puntos);
      const conductaSnippet=(r.conducta||"").length>220?r.conducta.slice(0,220).trim()+"…":(r.conducta||"");
      return `<article class="result-card">
        <div class="result-card-header">
          <div>
            <span class="result-ley">${esc(r.ley||r.fuente||"")}</span>
            ${art?`<span class="result-code">Art. ${esc(art)}</span>`:""}
            <h3>${esc(r.titulo||r.codigo||"Infracción")}</h3>
          </div>
          ${r.gravedad?`<span class="severity-badge" data-gravedad="${esc(r.gravedad)}">${esc(r.gravedad)}</span>`:""}
        </div>
        <p class="result-conducta">${esc(conductaSnippet)}</p>
        <div class="result-meta">
          ${art?`<span class="result-pill result-pill--articulo"><span class="result-pill-label">Art.</span> ${esc(art)}</span>`:""}
          ${puntos?`<span class="result-pill result-pill--puntos"><span class="result-pill-label">Puntos</span> ${esc(puntos)}</span>`:""}
          ${rango?`<span class="result-pill result-pill--sancion"><span class="result-pill-label">Sanción</span> ${esc(rango)}</span>`:""}
          <span class="result-pill"><span class="result-pill-label">Fuente</span> ${esc(r.fuente||r.codigo||"")}</span>
        </div>
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
