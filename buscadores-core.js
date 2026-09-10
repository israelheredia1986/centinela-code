/* ============================================================
   CENTINELA CODE — BUSCADOR GLOBAL V5
   Motor de precisión (cobertura de términos) + tolerancia a
   errores + escritura fluida (debounce) + sugerencia de IA
   cuando no hay una coincidencia clara.
   ------------------------------------------------------------
   Cambios clave respecto a V4:
   1) Cada norma/artículo ya NO arrastra en su propio texto de
      búsqueda el contenido de sus artículos/apartados "hijos".
      Antes, al indexar un nodo padre (p.ej. un capítulo entero)
      se volcaba recursivamente TODO su contenido interno, así
      que ese nodo "pajar" acababa coincidiendo con casi
      cualquier palabra del documento. Ahora cada registro solo
      usa su propio texto (id, artículo, título, conducta,
      sanción...); lo anidado se indexa aparte, como su propio
      resultado.
   2) Las listas de "palabrasClave" (a menudo genéricas y
      repetidas en decenas de infracciones) cuentan como pista
      débil, no como coincidencia fuerte: ya no inflan resultados
      poco relacionados.
   3) Se exige cobertura de términos: para que un resultado
      aparezca, deben encontrarse (todos, o la mayoría) los
      términos de la búsqueda — no basta con uno suelto entre
      miles de palabras.
   4) El campo de búsqueda ya no relanza el cálculo en cada
      pulsación: espera una breve pausa (debounce) antes de
      buscar, así la escritura no se bloquea.
   5) Si no hay una coincidencia clara, se ofrece un botón para
      preguntarlo directamente a Centinela IA.
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
    ["Temario Bloque 1 · infracciones","./data/infracciones_bloque1.json"],
    ["Actuaciones operativas B01","./data/operativas_b01.json"],
    ["Actuaciones operativas B02","./data/operativas_b02.json"],
    ["Actuaciones operativas B03","./data/operativas_b03.json"],
    ["Actuaciones operativas B04","./data/operativas_b04.json"],
    ["Actuaciones operativas B05","./data/operativas_b05.json"],
    ["Actuaciones operativas B06","./data/operativas_b06.json"],
    ["Actuaciones operativas B07","./data/operativas_b07.json"],
    ["Actuaciones operativas B08","./data/operativas_b08.json"]
  ];

  const STOP=new Set(["a","al","ante","bajo","con","contra","de","del","desde","durante","el","en","entre","hacia","hasta","la","las","lo","los","para","por","segun","sin","sobre","un","una","unos","unas","y","o","que","es","del","al",
    /* Palabras funcionales muy frecuentes que, si no se excluyen, aparecen
       en casi cualquier artículo legal y disparan falsos positivos (p.ej.
       "no" hace que cualquier búsqueda con "no autorizado" o "sin
       permiso" case con cualquier norma que contenga la palabra "no",
       es decir, prácticamente todas). */
    "no","se","su","sus","le","les","lo","les","esta","este","estas","estos","ese","esa","esos","esas",
    "mas","muy","tambien","como","cuando","donde","porque","pero","si","ya","asi","yo","tu","el","ella",
    "ellos","ellas","nos","les","mi","mis","tu","tus","haber","hay","ser","fue","son","era","eran",
    "cual","cuales","quien","quienes","cada","otro","otra","otros","otras","todo","toda","todos","todas"]);

  /* Sinónimos / variantes coloquiales → término(s) que sí aparecen en las
     normas. Se usan en ambos sentidos: si la búsqueda o el propio texto
     contiene cualquiera de las palabras de una misma entrada, cuentan como
     la misma idea. */
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
    ensuciar:["ensuciado","ensuciamiento","suciedad","limpieza","residuos","basura","vertido","arrojar","tirar","calle","acera","calzada","papelera"],
    ensuciado:["ensuciar","ensuciamiento","suciedad","limpieza","residuos","basura","vertido","calle"],
    suciedad:["ensuciar","ensuciado","limpieza","residuos","basura","calle"],
    calle:["acera","calzada","limpieza","suciedad","residuos"],
    tirar:["arrojar","depositar","residuos","basura","suciedad"],
    arrojar:["tirar","depositar","residuos","basura","suciedad"],
    aparcar:["estacionar","estacionamiento","aparcamiento","parada"],
    aparcado:["estacionado","estacionamiento","aparcamiento","aparcar"],
    aparcamiento:["estacionamiento","parking","aparcar"],
    parking:["aparcamiento","estacionamiento"],
    discapacitado:["discapacidad","minusvalido","movilidad reducida"],
    discapacidad:["discapacitado","minusvalido","movilidad reducida"],
    minusvalido:["discapacitado","discapacidad","movilidad reducida"],
    /* Estacionamiento sobre marcas/zonas señalizadas: estos términos
       coloquiales ("línea amarilla") no aparecen tal cual en el texto
       legal (que habla de "vado señalizado", "señalizada"...), así que
       se enlazan a palabras concretas y poco ambiguas del propio texto
       (nunca a palabras sueltas muy comunes como "línea" o "zona", que
       aparecen en contextos totalmente ajenos y generarían ruido). */
    amarilla:["vado","vados","senalizado","senalizada","bordillo"],
    amarillo:["vado","vados","senalizado","senalizada","bordillo"],
    bordillo:["vado","vados","amarillo","amarilla","senalizado"],
    vado:["vados","senalizado","senalizada"],
    ruido:["ruidos","molestias","vibraciones","musica","descanso vecinal","contaminacion acustica"],
    ruidos:["ruido","molestias","vibraciones","musica","contaminacion acustica"],
    botellon:["consumo alcohol calle","bebidas alcoholicas calle"],
    alcohol:["bebidas alcoholicas","embriaguez","alcoholemia","botellon"],
    grafiti:["grafitis","pintada","pintadas","vandalismo"],
    pintada:["pintadas","grafiti","grafitis","vandalismo"],
    dron:["drones","aeronave no tripulada"],
    mendicidad:["mendigar","limosna"],
    perro:["perros","canino"],
    correa:["bozal","sujecion animal"],
    /* No hay datos de usurpación/okupación de vivienda en la base, así
       que ese grupo se ha retirado (no aportaba coincidencias reales y
       solo generaba ruido). Sí existen artículos sobre faltar al
       respeto/desobedecer a un agente, así que "insultar" enlaza ahí. */
    insultar:["desobediencia","resistencia","atentado","respeto"],
    insulto:["desobediencia","resistencia","atentado","respeto"],
    /* Variantes gramaticales de una misma raíz que la distancia de
       edición por sí sola no cubre bien (adjetivo vs. sustantivo:
       "excesiva"/"exceso" difieren en más letras de las que tolera
       el corrector de erratas). Se enlazan explícitamente en vez de
       reintroducir un atajo genérico de "mismas letras iniciales",
       que antes causaba falsos positivos entre palabras distintas. */
    excesiva:["exceso","excesivo","excede","exceder"],
    excesivo:["exceso","excesiva","excede","exceder"],
    exceso:["excesivo","excesiva","excede","exceder"]
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
    ["veda","vedado","epoca de veda","prohibido","prohibicion"],
    ["estacionar","estacionamiento","aparcar","aparcado","aparcamiento","parking","parada","vado","vados","bordillo","senalizado","senalizada"],
    ["discapacitado","discapacidad","minusvalido","movilidad reducida"],
    ["ruido","ruidos","molestias","vibraciones","musica alta","descanso vecinal","contaminacion acustica"],
    ["alcohol","bebidas alcoholicas","embriaguez","alcoholemia","botellon"],
    ["botellon","consumo alcohol calle"],
    ["mendicidad","mendigar","limosna"],
    ["grafiti","grafitis","pintada","pintadas","vandalismo"],
    ["dron","drones","aeronave no tripulada"],
    ["arma","armas","arma blanca","navaja","cuchillo","arma de fuego"],
    ["animal suelto","perro suelto","perro sin correa","abandono animal","maltrato animal","animal abandonado"],
    ["menor","menores","tabaco menores","alcohol menores","venta a menores"],
    ["residuo","residuos","vertido","escombro","escombros","basura","enseres"],
    ["terraza","terrazas","veladores","aforo"],
    ["insultar","insulto","desobediencia","resistencia","atentado","respeto"]
  ];

  const norm=v=>String(v??"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9.]+/g," ").replace(/\s+/g," ").trim();
  const toks=v=>norm(v).split(" ").filter(Boolean).filter(x=>!STOP.has(x));
  const esc=v=>String(v??"").replace(/[&<>\"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));

  /* ------------------------------------------------------------
     Construcción del índice: cada nodo solo aporta SU PROPIO
     texto (evita que un nodo contenedor "adopte" el texto de
     todos sus artículos hijos y acabe encajando con cualquier
     búsqueda).
     ------------------------------------------------------------ */
  const KEYWORD_KEYS=new Set(["palabrasclave","palabras_clave","keywords","tags","etiquetas","sinonimos","alias","terminos"]);
  const keyIsKeyword=k=>KEYWORD_KEYS.has(norm(k).replace(/\s+/g,""));

  function ownParts(o){
    const body=[],kw=[];
    if(!o||typeof o!=="object"||Array.isArray(o))return {body:"",kw:""};
    for(const [k,v] of Object.entries(o)){
      if(v==null)continue;
      if(Array.isArray(v)){
        if(v.every(x=>x==null||typeof x!=="object")){
          const joined=v.slice(0,80).map(x=>String(x)).join(" ");
          (keyIsKeyword(k)?kw:body).push(joined);
        }
        /* arrays de objetos: se indexan por separado (walk), no aquí */
      }else if(typeof v!=="object"){
        body.push(String(v));
      }
      /* objetos anidados: se indexan por separado (walk), no aquí */
    }
    return {body:body.join(" "),kw:kw.join(" ")};
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
      /* Formato {"cuantia":200,"moneda":"EUR"} — usado en las
         infracciones de VMP/patinetes — antes no se reconocía y la
         sanción se mostraba vacía en 15 de sus 22 infracciones. */
      const cuantia=v.cuantia??v.cuantía;
      if(cuantia!=null)return `${cuantia} ${v.moneda==="EUR"?"€":(v.moneda||"€")}`;
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
    const {body:ownBody,kw:ownKw}=ownParts(o);
    const bodyText=norm([src,id,code,art,title,desc,severity,sanc,ownBody].filter(Boolean).join(" "));
    const kwText=norm(ownKw);
    const isInfraction=/infraccion/.test(norm(src))||!!severity||!!sanc||/sancion|multa|conducta|tipificacion/.test(norm(Object.keys(o).join(" ")));
    return {source:src,path,id,code,article:art,title,description:desc,severity,sanction:sanc,isInfraction,bodyText,kwText,bodyTokens:new Set(toks(bodyText)),kwTokens:new Set(toks(kwText))};
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
      try{const r=await fetch(`${url}?searchv=20260907v2`,{cache:"no-store"});if(!r.ok)throw Error(r.status);const j=await r.json(),o=[];walk(j,src,"$",o,0);return o;}
      catch(e){console.warn("Centinela buscador: no carga",url,e);return [];}
    })).then(g=>{INDEX=g.flat();return INDEX;});
    return PROMISE;
  }

  /* ------------------------------------------------------------
     Coincidencia por términos: exacta → sinónimo/grupo → tolerante
     a erratas (solo contra las palabras propias de ese registro,
     que ahora son pocas, no todo el documento).
     ------------------------------------------------------------ */
  function distance(a,b){
    if(a===b)return 0;if(Math.abs(a.length-b.length)>2)return 99;
    /* Damerau-Levenshtein (con transposición de letras adyacentes),
       para que una errata típica de teclado como "pescaod" (por
       "pescado") cuente como 1 cambio, no 2 — sin caer en el atajo
       de "mismas 5 primeras letras" que confundía palabras distintas
       que solo empezaban igual (p.ej. "pescaod" con "pesca"). */
    const al=a.length,bl=b.length,d=[];
    for(let i=0;i<=al;i++)d[i]=[i];
    for(let j=0;j<=bl;j++)d[0][j]=j;
    for(let i=1;i<=al;i++){
      for(let j=1;j<=bl;j++){
        const cost=a[i-1]===b[j-1]?0:1;
        d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+cost);
        if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])d[i][j]=Math.min(d[i][j],d[i-2][j-2]+1);
      }
    }
    return d[al][bl];
  }
  const EXP_CACHE=new Map();
  function tokenExpansions(t){
    if(EXP_CACHE.has(t))return EXP_CACHE.get(t);
    const set=new Set([t]);
    (ALIAS[t]||[]).forEach(a=>toks(a).forEach(x=>set.add(x)));
    GROUPS.forEach(g=>{
      const gt=g.flatMap(x=>toks(x));
      if(gt.includes(t))gt.forEach(x=>set.add(x));
    });
    EXP_CACHE.set(t,set);
    return set;
  }
  const isCodeLike=t=>/^[0-9.]+$/.test(t);
  function matchKind(t,tokenSet){
    if(tokenSet.has(t))return "exact";
    for(const e of tokenExpansions(t)){if(e!==t&&tokenSet.has(e))return "alias";}
    /* Los números de artículo/código no admiten "parecido": 36.16 y 36.10
       son preceptos distintos, no una errata el uno del otro. */
    if(!isCodeLike(t)&&t.length>=5){
      for(const w of tokenSet){
        if(w.length<5||Math.abs(t.length-w.length)>2)continue;
        /* Solo por distancia de edición real (nº mínimo de letras que
           cambian). El antiguo atajo de "mismas 5 primeras letras" era
           demasiado permisivo: emparejaba p.ej. "pescaod" (errata de
           "pescado") con la palabra suelta "pesca", que no tiene nada
           que ver con lo buscado. */
        if(distance(t,w)<=(t.length>=8?2:1))return "fuzzy";
      }
    }
    return null;
  }

  const W={exactBody:150,aliasBody:115,fuzzyBody:75,exactKw:45,aliasKw:35,fuzzyKw:20};
  /* Una ficha es "sustanciosa" cuando de verdad da algo con lo que
     trabajar (artículo, sanción o descripción propia con contenido):
     no una entrada contenedora tipo "articulos": [] que solo trae
     nombre + palabras clave genéricas. Estas últimas se penalizan
     y solo se muestran como relleno si no hay suficientes resultados
     concretos. */
  function hasSubstance(r){
    return !!(r.article||r.sanction||(r.description&&r.description.trim().length>=60));
  }
  function scoreRecord(r,qTokens,fullNorm){
    let s=0,bodyHits=0,kwHits=0,strongHits=0;
    if(fullNorm){
      if(norm(r.article)===fullNorm)s+=1300;
      if(norm(r.code)===fullNorm)s+=1200;
      if(norm(r.title)===fullNorm)s+=800;
      if(fullNorm.length>3&&r.bodyText.includes(fullNorm))s+=400;
    }
    for(const t of qTokens){
      const mb=matchKind(t,r.bodyTokens);
      if(mb){
        bodyHits++;
        if(mb!=="fuzzy")strongHits++;
        s+=mb==="exact"?W.exactBody:mb==="alias"?W.aliasBody:W.fuzzyBody;
        if(norm(r.article).includes(t))s+=70;
        if(norm(r.title).includes(t))s+=55;
        continue;
      }
      const mk=matchKind(t,r.kwTokens);
      if(mk){kwHits++;if(mk!=="fuzzy")strongHits++;s+=mk==="exact"?W.exactKw:mk==="alias"?W.aliasKw:W.fuzzyKw;}
    }
    const total=qTokens.length||1;
    const weighted=Math.min(1,(bodyHits+kwHits*0.35)/total);
    let score=s*(0.55+0.45*weighted);
    if(!hasSubstance(r))score*=0.35;
    return {score,bodyHits,kwHits,strongHits};
  }
  function passesFilter(n,bodyHits,kwHits,strongHits){
    const total=bodyHits+kwHits;
    /* En búsquedas de varias palabras, al menos una debe ser una
       coincidencia fuerte (exacta o por sinónimo): que TODO el
       "acierto" venga solo de parecidos por errata no basta, así se
       evitan coincidencias fantasma entre palabras que solo comparten
       raíz (p.ej. "debería" pareciéndose a "deberá"). En búsquedas de
       una sola palabra esta exigencia NO se aplica: ahí el parecido
       por errata es precisamente la tolerancia a errores que ofrece
       el buscador (p.ej. "pescaod" → "pescado") y bloquearlo la
       anularía por completo. */
    if(n>1&&strongHits<1)return false;
    if(n<=2)return total>=n;
    return total>=Math.ceil(n*0.65)&&bodyHits>=1;
  }

  /* ------------------------------------------------------------
     Render + sugerencia de Centinela IA cuando no hay una
     coincidencia clara con lo escrito.
     ------------------------------------------------------------ */
  function iaStyles(){
    if(document.getElementById("cc-ia-suggest-style"))return;
    const st=document.createElement("style");st.id="cc-ia-suggest-style";
    st.textContent=`.cc-empty-noresults .primary-button{margin-top:16px}.cc-ia-suggest{grid-column:1/-1;display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;padding:14px 10px 4px;margin-top:6px;border-top:1px solid rgba(255,255,255,.08);color:var(--muted,#7f93a8);font-size:12.5px}.cc-ia-suggest .cc-ask-ia{background:transparent;border:1px solid rgba(49,185,255,.45);color:#31b9ff;border-radius:9px;padding:7px 12px;font-weight:700;font-size:12px;cursor:pointer}.cc-ia-suggest .cc-ask-ia:hover{background:rgba(49,185,255,.12)}`;
    document.head.appendChild(st);
  }
  function preguntarIA(q){
    const nav=document.querySelector('.nav-item[data-section="ia"]');
    if(nav)nav.click();
    else document.getElementById("section-ia")?.classList.add("active");
    setTimeout(()=>{
      const input=document.getElementById("chatInput"),btn=document.getElementById("btnSendChat");
      if(input&&q)input.value=q;
      if(btn)btn.click();else input?.focus();
    },150);
  }
  function bindAskIA(box){
    box.querySelectorAll(".cc-ask-ia").forEach(b=>b.addEventListener("click",()=>preguntarIA(b.dataset.q||"")));
  }
  function renderLoading(){
    const box=document.getElementById("consultaResults");if(!box)return;
    box.innerHTML='<div class="empty-state cc-loading"><div class="empty-icon">🔎</div><h3>Buscando…</h3><p>Consultando la normativa disponible.</p></div>';
  }
  function render(rs,q){
    iaStyles();
    const box=document.getElementById("consultaResults"),count=document.getElementById("consultaResultCount");if(!box)return;if(count)count.textContent=String(rs.length);
    if(!q.trim()){box.innerHTML='<div class="empty-state"><div class="empty-icon">🔎</div><h3>Buscar normativa o infracción</h3><p>Prueba «vendedor ambulante», «pescado», «juguetes», «sin autorización» o un artículo.</p></div>';return;}
    if(!rs.length){
      box.innerHTML=`<div class="empty-state cc-empty-noresults"><div class="empty-icon">⚠️</div><h3>Sin coincidencia exacta</h3><p>No se ha encontrado normativa que encaje con «${esc(q)}». Revisa la redacción o pregúntaselo directamente a Centinela IA.</p><button type="button" class="primary-button cc-ask-ia" data-q="${esc(q)}">🤖 Preguntar a Centinela IA</button></div>`;
      bindAskIA(box);return;
    }
    box.innerHTML=rs.slice(0,100).map((r,i)=>`<article class="result-card cc-search-result" data-i="${i}"><div class="result-card-header"><div><span class="result-ley">${esc(r.source)}</span>${r.article?`<span class="result-code">Art. ${esc(r.article)}</span>`:""}<h3>${esc(r.title||"Sin título")}</h3></div>${r.severity?`<span class="severity-badge">${esc(r.severity)}</span>`:""}</div><p class="result-conducta">${esc((r.description||"").slice(0,280))}${(r.description||"").length>280?"…":""}</p><div class="result-meta">${r.sanction?`<span class="result-pill result-pill--sancion"><span class="result-pill-label">Sanción</span> ${esc(r.sanction)}</span>`:""}${r.isInfraction?'<span class="result-pill">Infracción</span>':""}</div><button type="button" class="result-detail-button cc-detail">Ver detalle</button></article>`).join("")
      +`<div class="cc-ia-suggest"><span>¿No es lo que buscabas?</span><button type="button" class="cc-ask-ia" data-q="${esc(q)}">Pregúntale a Centinela IA →</button></div>`;
    box.querySelectorAll(".cc-detail").forEach((b,i)=>b.addEventListener("click",()=>detail(rs[i])));
    bindAskIA(box);
  }
  function detail(r){
    const modal=document.getElementById("appModal"),body=document.getElementById("modalBody"),title=document.getElementById("modalTitle"),actions=document.getElementById("modalActions");
    if(!modal||!body){alert(`${r.article||r.code||r.source}\n\n${r.title}\n\n${r.description}\n\n${r.sanction||""}`);return;}
    if(title)title.textContent=r.article?`Art. ${r.article}`:(r.code||r.source);
    body.innerHTML=`<div class="detail-content"><p><strong>Normativa:</strong> ${esc(r.source)}</p><p><strong>Artículo:</strong> ${esc(r.article||"-")}</p><p><strong>Concepto:</strong> ${esc(r.title||"-")}</p><p><strong>Gravedad:</strong> ${esc(r.severity||"-")}</p><h4>Conducta / contenido</h4><p>${esc(r.description||"-")}</p>${r.sanction?`<h4>Sanción</h4><p>${esc(r.sanction)}</p>`:""}</div>`;
    if(actions)actions.innerHTML='<button class="secondary-button" type="button" id="ccCloseDetail">Cerrar</button>';
    modal.classList.remove("hidden");document.getElementById("ccCloseDetail")?.addEventListener("click",()=>modal.classList.add("hidden"));
  }

  let searchGen=0;
  async function search(q){
    q=String(q||"");
    const myGen=++searchGen;
    if(!q.trim()){render([],q);return;}
    renderLoading();
    const idx=await load();
    if(myGen!==searchGen)return;
    let rs=idx;
    if(mode==="infractions")rs=rs.filter(r=>r.isInfraction);
    if(severity!=="all")rs=rs.filter(r=>norm(r.severity)===norm(severity));
    const qTokens=[...new Set(toks(q))];
    if(!qTokens.length){render([],q);return;}
    const fullNorm=norm(q);
    const scored=[];
    for(const r of rs){
      const {score:sc,bodyHits,kwHits,strongHits}=scoreRecord(r,qTokens,fullNorm);
      if(sc<=0)continue;
      if(!passesFilter(qTokens.length,bodyHits,kwHits,strongHits))continue;
      scored.push({r,s:sc});
    }
    scored.sort((a,b)=>b.s-a.s||String(a.r.article).localeCompare(String(b.r.article),"es",{numeric:true}));
    if(myGen!==searchGen)return;
    /* Resultados concretos (con artículo, sanción o descripción real)
       primero; las fichas contenedoras sin articulado ("nota: el
       articulado completo debe consultarse en el documento oficial")
       solo rellenan hueco si no hay suficientes resultados concretos.
       Máximo MAX_RESULTS en pantalla: pocos, pero los más precisos. */
    const MAX_RESULTS=6;
    const concretos=scored.filter(x=>hasSubstance(x.r));
    const contenedores=scored.filter(x=>!hasSubstance(x.r));
    let finalList=concretos.slice(0,MAX_RESULTS);
    if(finalList.length<MAX_RESULTS)finalList=finalList.concat(contenedores.slice(0,MAX_RESULTS-finalList.length));
    render(finalList.map(x=>x.r),q);
  }
  function go(q,m){mode=m||"all";document.querySelector('.nav-item[data-section="consulta"]')?.click();setTimeout(()=>{const i=document.getElementById("consultaSearch");if(i){i.value=q||"";search(i.value);}},80);}

  function install(){
    const input=document.getElementById("consultaSearch");
    if(input){
      let debounceTimer=null;
      input.addEventListener("input",()=>{
        if(debounceTimer)clearTimeout(debounceTimer);
        const val=input.value;
        debounceTimer=setTimeout(()=>search(val),220);
      });
      input.addEventListener("keydown",e=>{
        if(e.key==="Enter"){e.preventDefault();if(debounceTimer)clearTimeout(debounceTimer);search(input.value);}
      });
    }
    document.querySelectorAll(".filter-chip[data-severity]").forEach(b=>b.addEventListener("click",e=>{e.preventDefault();document.querySelectorAll(".filter-chip[data-severity]").forEach(x=>x.classList.remove("active"));b.classList.add("active");severity=b.dataset.severity||"all";search(input?.value||"");}));
    /* FIX RENDIMIENTO: el índice del buscador NO se carga al
       arrancar la app ni con ningún disparo automático en segundo
       plano (eso causaba congelaciones al coincidir con la
       navegación por pestañas). Se carga en el momento exacto en
       que el usuario busca algo: search() ya llama a load() y lo
       cachea la primera vez, así que la primera búsqueda tarda un
       poco más pero el resto de la app queda completamente libre. */
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});else install();
  window.CentinelaSearch={search,load,go};
})();
