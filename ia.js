/* ============================================================
   CENTINELA CODE — CLIENTE IA ÚNICO
   Relevancia estricta + Internet First + fallback normativo.
   ============================================================ */
(function () {
  "use strict";

  const IA_URL = "https://okuygqbaliaeavhyezri.supabase.co/functions/v1/centinela-ia";
  const SUPABASE_ANON = "sb_publishable_fbEAcJZxMv8PD3VB3Bcx6A_l_8BdP2m";
  const REQUEST_TIMEOUT = 45000;
  const MAX_RETRIES = 2;
  const RETRY_BASE_MS = 900;

  const DATA_FILES = [
    ["Infracciones", "./data/infracciones.json"],["Tráfico · infracciones", "./data/infracciones_trafico.json"],["VMP y bicicletas · infracciones", "./data/infracciones_vmp_bicicletas.json"],["LOPSC", "./data/lopsc.json"],["Código Penal", "./data/codigo_penal.json"],["Menores", "./data/normativa_menores.json"],["Violencia de género", "./data/normativa_violencia_genero.json"],["Ordenanzas", "./data/ordenanzas.json"],["Animales", "./data/normativa_animales.json"],["Tráfico", "./data/normativa_trafico.json"],["VMP y bicicletas", "./data/normativa_vmp_bicicletas.json"],["Ley 2/1986", "./data/ley_2_86.json"],["LECrim", "./data/lecrim.json"],["Extranjería", "./data/extranjeria.json"],["Seguridad privada", "./data/seguridad_privada.json"],["Espectáculos públicos", "./data/espectaculos_publicos.json"],["Medio ambiente y ruidos", "./data/medio_ambiente_ruidos.json"],["Reglamento de armas", "./data/reglamento_armas.json"],["Policías Locales Andalucía", "./data/policias_locales_andalucia.json"],["Ley 39/2015", "./data/ley_39_2015.json"],["Ley 7/1985", "./data/ley_7_1985.json"],["Ley 5/2010 Andalucía", "./data/ley_5_2010_andalucia.json"],["Bloque 1 jurídico", "./data/bloque1_juridico.json"],["Infracciones Bloque 1", "./data/infracciones_bloque1.json"],["Comercio ambulante", "./data/comercio_ambulante.json"],["Contrabando", "./data/contrabando.json"],["Propiedad industrial y falsificaciones", "./data/propiedad_industrial_falsificaciones.json"],["Aforo y hostelería", "./data/aforo_hosteleria_eventos.json"],["RD 1428/2003", "./data/rd-1428-2003.json"],["RD 2822/1998", "./data/rd-2822-1998.json"],["RD 818/2009", "./data/rd-818-2009.json"]
  ];

  const STOP = new Set(["a","al","ante","bajo","con","contra","de","del","desde","durante","el","en","entre","hacia","hasta","la","las","lo","los","para","por","segun","sin","sobre","un","una","unos","unas","y","o","que","mi","su","se"]);
  const GENERIC = new Set(["ano","anos","edad","persona","personas","hombre","mujer","nino","nina","ninos","ninas","menor","menores","mayor","mayores","joven","jovenes","adulto","adultos","via","viaje","vehiculo","vehiculos","publico","publica","lugar","lugares","hecho","hechos","caso","casos","policia","policial","agente","agentes","calle","espacio","espacios","dia","dias","noche","noches"]);

  const SYNONYMS = {
    agresion:["agredir","agresiones","ataque","atacar","golpear","pegar","lesiones","violencia"],
    amenaza:["amenazas","amenazar","intimidacion","intimidar","coaccion"],
    coaccion:["coacciones","obligar","impedir","forzar"],
    seguro:["asegurar","poliza","soa","sin seguro","seguro obligatorio","carencia"],
    carnet:["permiso","licencia","permiso de conducir","conduccion","conducir","conduciendo"],
    permiso:["carnet","licencia","autorizacion","habilitacion","conducir","conduccion"],
    borracho:["alcoholemia","embriaguez","alcohol","etilometro","positivo"],
    alcohol:["alcoholemia","borracho","embriaguez","etilometro","tasa de alcohol"],
    drogado:["drogas","estupefaciente","narcotico","psicotropico","positivo"],
    drogas:["droga","estupefaciente","estupefacientes","narcotico","psicotropico","drogado","positivo","consumo"],
    cannabis:["hachis","hachís","marihuana","maria","cannabis","estupefaciente","drogas","droga","porros","porro","consumo"],
    hachis:["cannabis","hachís","marihuana","estupefaciente","droga","drogas","porro","porros","consumo"],
    fumar:["fumando","fumado","humo","tabaco","hachis","cannabis","marihuana"],
    fumando:["fumar","fumado","humo","hachis","cannabis","marihuana"],
    consumo:["consumir","consumiendo","droga","drogas","estupefaciente","cannabis","hachis","marihuana"],
    menor:["menores","adolescente","adolescentes","infantil"],
    pelea:["rina","riña","altercado","reyerta","pugna"],
    mendigar:["mendicidad","mendigo","limosna","pedir dinero"],
    pintada:["grafiti","graffiti","pintadas","vandalismo"],
    maltrato:["crueldad","malos tratos","violencia animal","animal","animales"],
    desnudo:["exhibicionismo","desnudez","partes intimas"],
    navaja:["arma blanca","cuchillo","cuchillos","cuchilla","objeto punzante","objeto cortante"],
    extranjero:["extranjeria","documentacion","identificacion","estancia","documento"],
    documentacion:["documentar","documento","identificacion","extranjero","extranjeria"],
    horario:["horarios","hora","cierre","apertura","fuera de horario","exceso horario"],
    terraza:["terrazas","velador","veladores","hosteleria","hostelería"],
    ruido:["ruidos","musica","música","molestias","decibelios","acustica","acústica"],
    arma:["armas","navaja","cuchillo","arma blanca","pistola","revolver"],
    desobediencia:["desobedecer","resistencia","requerimiento"],
    establecimiento:["establecimientos","local","locales","bar","pub","discoteca","hosteleria","hostelería"]
  };

  let localDataPromise = null;
  let progressCallback = null;

  function normalize(value) { return String(value == null ? "" : value).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim(); }
  function tokens(text) { return normalize(text).split(/[^a-z0-9.]+/).filter(Boolean).filter(token => token.length > 1 && !STOP.has(token)); }
  function primitive(value) { return value != null && typeof value !== "object" ? String(value) : ""; }

  function pick(object, names) {
    if (!object || typeof object !== "object" || Array.isArray(object)) return "";
    for (const name of names) {
      const wanted = normalize(name);
      const pair = Object.entries(object).find(([key]) => normalize(key) === wanted);
      if (pair) { const value = primitive(pair[1]); if (value) return value; }
    }
    return "";
  }

  function recordsFrom(value, source, out = [], depth = 0, path = "$") {
    if (depth > 9 || value == null || out.length >= 7000) return out;
    if (Array.isArray(value)) { value.forEach((item, index) => recordsFrom(item, source, out, depth + 1, `${path}[${index}]`)); return out; }
    if (typeof value !== "object") return out;
    const article = pick(value,["articulo","artículo","article","art","precepto"]);
    const code = pick(value,["codigo","código","code"]);
    const title = pick(value,["titulo","título","title","denominacion","denominación","epigrafe","epígrafe","nombre","name"]);
    const description = pick(value,["conducta","descripcion","descripción","description","texto","text","contenido","content","tipificacion","tipificación","hechos","resumen"]);
    const severity = pick(value,["gravedad","severity","clasificacion","clasificación"]);
    const amount = pick(value,["cuantia","cuantía","importe","multa","sancion","sanción"]);
    const foundation = pick(value,["fundamento","fundamento_juridico","fundamento jurídico","base_legal","base legal"]);
    const action = pick(value,["actuacion_policial","actuación policial","actuacion","actuación","procedimiento"]);
    const search = normalize([article,code,title,description,severity,amount,foundation,action].join(" "));
    if (article || code || title || description || foundation || action) out.push({source,article,code,title,description,severity,amount,foundation,action,search,path});
    Object.entries(value).forEach(([key,child]) => { if (child && typeof child === "object") recordsFrom(child,source,out,depth+1,`${path}.${key}`); });
    return out;
  }

  async function loadLocalData() {
    if (localDataPromise) return localDataPromise;
    localDataPromise = Promise.allSettled(DATA_FILES.map(async ([source,url]) => {
      const response = await fetch(url,{cache:"force-cache"});
      if (!response.ok) throw new Error(`${source}: HTTP ${response.status}`);
      return recordsFrom(await response.json(),source);
    })).then(results => results.flatMap(result => result.status === "fulfilled" ? result.value : []));
    return localDataPromise;
  }

  function expandToken(token) {
    const forms = new Set([token]);
    (SYNONYMS[token] || []).forEach(word => forms.add(normalize(word)));
    if (token.endsWith("ando") && token.length > 5) forms.add(token.slice(0,-4));
    if (token.endsWith("iendo") && token.length > 6) forms.add(token.slice(0,-5));
    if (token.endsWith("es") && token.length > 4) forms.add(token.slice(0,-2));
    if (token.endsWith("s") && token.length > 4) forms.add(token.slice(0,-1));
    return [...forms];
  }

  function rank(question, records) {
    const original = tokens(question);
    const meaningful = original.filter(token => !GENERIC.has(token) && !/^\d+(\.\d+)?$/.test(token));
    const phrase = normalize(question);
    if (!meaningful.length) return [];

    const ranked = records.map(record => {
      const title = normalize(record.title), article = normalize(record.article), description = normalize(record.description), foundation = normalize(record.foundation), action = normalize(record.action), text = normalize(record.search);
      let score = 0, strongHits = 0, totalHits = 0;

      for (const token of meaningful) {
        let tokenStrong = false, tokenHit = false;
        for (const form of expandToken(token)) {
          if (article === form) { score += 110; tokenStrong = true; tokenHit = true; }
          else if (article.includes(form)) { score += 55; tokenStrong = true; tokenHit = true; }
          if (title.includes(form)) { score += 65; tokenStrong = true; tokenHit = true; }
          if (description.includes(form)) { score += 34; tokenStrong = true; tokenHit = true; }
          if (foundation.includes(form)) { score += 22; tokenStrong = true; tokenHit = true; }
          if (action.includes(form)) { score += 22; tokenStrong = true; tokenHit = true; }
        }
        if (tokenHit) totalHits += 1;
        if (tokenStrong) strongHits += 1;
      }

      if (meaningful.length >= 2 && strongHits === 0) return null;
      if (strongHits === 1 && meaningful.length >= 3) return null;
      if (strongHits < Math.min(2, meaningful.length) && meaningful.length >= 4) return null;
      if (phrase.length >= 12 && text.includes(phrase)) score += 160;
      if (score < 28 || totalHits === 0) return null;

      const coverage = strongHits / Math.max(1,meaningful.length);
      score += coverage * 45;
      return {record,score,strongHits,totalHits};
    }).filter(Boolean);

    ranked.sort((a,b) => b.strongHits - a.strongHits || b.totalHits - a.totalHits || b.score - a.score);
    return ranked.slice(0,8).map(item => item.record);
  }

  async function buildLocalContext(question) {
    try {
      const records = await loadLocalData();
      const hits = rank(question,records);
      if (!hits.length) return {context:"NO HAY COINCIDENCIAS NORMATIVAS SUFICIENTEMENTE RELEVANTES EN EL REPOSITORIO LOCAL. No inventar una norma a partir de palabras aisladas.",hits:[]};
      const context = hits.map((record,index) => {
        const header = `${index+1}. NORMA: ${record.source}${record.article ? ` | ARTÍCULO: ${record.article}` : ""}${record.code ? ` | CÓDIGO: ${record.code}` : ""}${record.title ? ` | TÍTULO: ${record.title}` : ""}`;
        const details = [record.description ? `CONTENIDO: ${String(record.description).replace(/\s+/g," ").slice(0,2200)}` : "",record.severity ? `GRAVEDAD: ${record.severity}` : "",record.amount ? `SANCIÓN/CUANTÍA: ${record.amount}` : "",record.foundation ? `FUNDAMENTO: ${String(record.foundation).replace(/\s+/g," ").slice(0,1300)}` : "",record.action ? `ACTUACIÓN: ${String(record.action).replace(/\s+/g," ").slice(0,1300)}` : ""].filter(Boolean).join("\n");
        return `${header}\n${details}`;
      }).join("\n\n");
      return {context,hits};
    } catch (error) {
      console.warn("No se pudo preparar el contexto normativo local",error);
      return {context:"NO SE HA PODIDO CARGAR EL REPOSITORIO NORMATIVO LOCAL.",hits:[]};
    }
  }

  async function getAccessToken() {
    const client = window.CENTINELA_SUPABASE_CLIENT;
    if (!client?.auth?.getSession) return "";
    try { const result = await client.auth.getSession(); return result?.data?.session?.access_token || ""; }
    catch (error) { console.warn("No se pudo obtener el token de sesión",error); return ""; }
  }

  function cleanProgress(message) { if (typeof progressCallback === "function") { try { progressCallback(message); } catch (_) {} } }
  function parseResponse(raw) { if (typeof raw === "string") return {text:raw.trim(),sources:[]}; return {text:typeof raw?.text === "string" ? raw.text.trim() : "",sources:Array.isArray(raw?.sources) ? raw.sources : []}; }

  function appendSources(text,sources) {
    if (!Array.isArray(sources) || !sources.length) return text;
    const unique=[],seen=new Set();
    for (const source of sources) { const uri=String(source?.uri||"").trim(), title=String(source?.title||uri||"Referencia web").trim(); if (!uri || seen.has(uri)) continue; seen.add(uri); unique.push({uri,title}); }
    if (!unique.length) return text;
    return `${text}\n\nReferencias consultadas:\n${unique.slice(0,8).map((source,index)=>`${index+1}. ${source.title} — ${source.uri}`).join("\n")}`;
  }

  function isRetryable(status) { return [408,425,429,500,502,503,504].includes(Number(status)); }

  async function callServer(pregunta,modo,contexto="") {
    const token=await getAccessToken();
    if (!token) return {ok:false,status:401,error:"Sesión no disponible. Inicia sesión de nuevo."};
    let lastError=null;
    for (let attempt=0; attempt<=MAX_RETRIES; attempt+=1) {
      if (attempt) await new Promise(resolve=>setTimeout(resolve,RETRY_BASE_MS*attempt));
      const controller=new AbortController(), timer=setTimeout(()=>controller.abort(),REQUEST_TIMEOUT);
      try {
        const response=await fetch(IA_URL,{method:"POST",headers:{Authorization:`Bearer ${token}`,apikey:SUPABASE_ANON,"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify({pregunta:String(pregunta).slice(0,8000),modo,contexto:String(contexto||"").slice(0,50000)}),signal:controller.signal});
        const raw=await response.text(); clearTimeout(timer);
        let data; try { data=JSON.parse(raw); } catch (_) { data={text:raw}; }
        if (response.ok) return {ok:true,data};
        lastError=new Error(String(data?.error?.message||data?.error||data?.message||`Error HTTP ${response.status}`));
        if (!isRetryable(response.status)) break;
      } catch (error) { clearTimeout(timer); lastError=error instanceof Error ? error : new Error(String(error)); if (attempt>=MAX_RETRIES) break; }
    }
    return {ok:false,status:0,error:lastError?.message||"No se ha podido consultar Centinela IA."};
  }

  async function preguntarCentinelaIA(pregunta,onProgress) {
    const question=String(pregunta||"").trim();
    if (!question) return "Escribe una consulta para Centinela IA.";
    progressCallback=typeof onProgress === "function" ? onProgress : null;
    try {
      cleanProgress("Buscando información oficial y actualizada en Internet...");
      const webResult=await callServer(question,"web_first");
      if (webResult.ok) { const parsed=parseResponse(webResult.data); if (webResult.data?.web_found===true && parsed.text) { cleanProgress("Respuesta web verificada y analizada."); return appendSources(parsed.text,parsed.sources); } }

      cleanProgress("No hay una respuesta web suficientemente fiable. Consultando el repositorio normativo...");
      const local=await buildLocalContext(question);

      if (local.hits.length) {
        const repoResult=await callServer(question,"repository_fallback",local.context);
        if (repoResult.ok) { const parsed=parseResponse(repoResult.data); if (parsed.text) { cleanProgress("Respuesta normativa obtenida."); return parsed.text; } }
      }

      if (local.hits.length) {
        cleanProgress("IA remota no disponible. Usando el motor normativo local.");
        return JSON.stringify({resumen:`Se han localizado ${local.hits.length} referencias normativas directamente relacionadas con los términos principales de la consulta.`,infracciones:local.hits.map(record=>({fuente:record.source,articulo:record.article,codigo:record.code,titulo:record.title,descripcion:record.description,gravedad:record.severity,cuantia:record.amount,fundamento:record.foundation,actuacion_policial:record.action})),articulos:local.hits.map(record=>record.article).filter(Boolean),fundamento:local.hits.map(record=>record.foundation).filter(Boolean).join(" "),actuacion_policial:local.hits.map(record=>record.action).filter(Boolean).join(" ")||"Comprobar hechos, identidad, competencia, precepto aplicable y pruebas antes de denunciar.",aviso:"Resultado de contingencia: verificar el precepto, la competencia y la cuantía aplicable antes de formalizar la actuación."});
      }

      return "No se ha encontrado una referencia normativa suficientemente relacionada con los hechos descritos. No procede atribuir una infracción concreta solo por la coincidencia de palabras. Deben comprobarse los hechos (sustancia, edad, lugar, conducta, posesión/consumo, intervención de terceros y demás circunstancias) y consultar la normativa oficial aplicable antes de denunciar.";
    } catch (error) {
      console.error("Centinela IA:",error);
      return "No se ha podido completar la consulta. Comprueba la conexión y verifica la normativa oficial antes de actuar.";
    } finally { progressCallback=null; }
  }

  window.preguntarCentinelaIA=preguntarCentinelaIA;
  window.CentinelaIA={preguntar:preguntarCentinelaIA,recargarDatos:()=>{localDataPromise=null;return loadLocalData();},obtenerContexto:buildLocalContext,estado:()=>({contextoLocalCargado:Boolean(localDataPromise)})};
  console.info("Centinela IA: cliente único activo — relevancia estricta + Internet First + fallback");
})();
