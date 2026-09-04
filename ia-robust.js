/* ============================================================
   CENTINELA CODE — IA ROBUSTA / CONTEXTO NORMATIVO LOCAL
   V3 - Reintentos Agresivos + UI Feedback
   - Soporte para múltiples proveedores de IA (OpenAI, Gemini, etc.)
   - Manejo robusto de errores (API saturada, respuestas inválidas)
   - Reintentos agresivos: hasta 5 intentos con backoff exponencial
   - Notificaciones visuales de reintento al usuario
   - Recupera contexto de la normativa local de la app
   - Envía contexto relevante a la IA antes de responder
   - Mantiene la función original de ia.js como compatibilidad
   ============================================================ */
(function () {
  "use strict";

  const IA_URL = "https://okuygqbaliaeavhyezri.supabase.co/functions/v1/centinela-ia";
  const MAX_REINTENTOS = 5;
  const DELAY_BASE_MS = 2000; // Inicio en 2 segundos
  const DELAY_MAX_MS = 15000; // Máximo 15 segundos entre reintentos

  const DATA_FILES = [
    ["Infracciones", "./data/infracciones.json"],
    ["Tráfico · infracciones", "./data/infracciones_trafico.json"],
    ["LOPSC", "./data/lopsc.json"],
    ["Código Penal", "./data/codigo_penal.json"],
    ["Menores", "./data/normativa_menores.json"],
    ["Violencia de género", "./data/normativa_violencia_genero.json"],
    ["Ordenanzas", "./data/ordenanzas.json"],
    ["Animales", "./data/normativa_animales.json"],
    ["Tráfico", "./data/normativa_trafico.json"],
    ["Ley 2/1986", "./data/ley_2_86.json"],
    ["LECrim", "./data/lecrim.json"],
    ["Extranjería", "./data/extranjeria.json"],
    ["Seguridad privada", "./data/seguridad_privada.json"],
    ["Espectáculos públicos", "./data/espectaculos_publicos.json"],
    ["Medio ambiente y ruidos", "./data/medio_ambiente_ruidos.json"],
    ["Reglamento de armas", "./data/reglamento_armas.json"],
    ["Policías Locales Andalucía", "./data/policias_locales_andalucia.json"],
    ["Ley 39/2015", "./data/ley_39_2015.json"],
    ["Ley 7/1985", "./data/ley_7_1985.json"],
    ["Ley 5/2010 Andalucía", "./data/ley_5_2010_andalucia.json"]
  ];

  const STOP = new Set([
    "a","al","ante","bajo","con","contra","de","del","desde","durante",
    "el","en","entre","hacia","hasta","la","las","lo","los","para","por",
    "segun","sin","sobre","un","una","unos","unas","y","o","que","una"
  ]);

  const SYN = {
    incumplir:["incumplimiento","incumple","incumplido","infraccion","infracción"],
    incumplimiento:["incumplir","incumple","infraccion","infracción"],
    horario:["horarios","hora","cierre","apertura","horario permitido","fuera de horario"],
    horarios:["horario","hora","cierre","apertura","horario permitido","fuera de horario"],
    cierre:["cerrar","cierre tardio","cierre tardío","cerrar tarde","fuera de horario","exceso horario"],
    cerrar:["cierre","cerrar tarde","fuera de horario","exceso horario"],
    tarde:["cierre tardio","cierre tardío","cerrar tarde","fuera de horario","exceso horario"],
    establecimiento:["establecimientos","local","locales","bar","pub","discoteca","hosteleria","hostelería","ocio","esparcimiento"],
    establecimientos:["establecimiento","local","locales","bar","pub","discoteca","hosteleria","hostelería","ocio","esparcimiento"],
    abierto:["abierta","abierto fuera de horario","apertura","cierre","local abierto"],
    abrir:["apertura","abierto","establecimiento abierto"],
    terraza:["terrazas","velador","veladores","hosteleria","hostelería"],
    velador:["veladores","terraza","terrazas"],
    consumicion:["consumiciones","bebida","bebidas","servicio","servir","vender"],
    consumiciones:["consumicion","bebidas","servicio","servir","vender"],
    desalojar:["desalojo","evacuacion","evacuación","vaciar local"],
    desalojo:["desalojar","evacuacion","evacuación","vaciar local"],
    ruido:["ruidos","musica","música","molestias","acustica","acústica","decibelios"],
    musica:["música","ruido","ruidos","establecimiento musical"],
    alcohol:["bebida","bebidas","bar","pub","hosteleria","hostelería"],
    arma:["armas","navaja","cuchillo","arma blanca","pistola","revolver"],
    desobediencia:["desobedecer","resistencia","requerimiento"]
  };

  let datosCachePromise = null;
  let callbackProgreso = null; // Para notificar al usuario

  const norm = value => String(value == null ? "" : value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  function tokens(text) {
    return norm(text)
      .split(/[^a-z0-9.]+/)
      .filter(Boolean)
      .filter(t => t.length > 1 && !STOP.has(t));
  }

  function primitive(value) {
    return value != null && typeof value !== "object" ? String(value) : "";
  }

  function pick(obj, names) {
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) return "";
    for (const name of names) {
      const wanted = norm(name);
      const found = Object.entries(obj).find(([key]) => norm(key) === wanted);
      if (found) {
        const value = primitive(found[1]);
        if (value) return value;
      }
    }
    return "";
  }

  function flat(value, depth = 0) {
    if (depth > 5 || value == null) return "";
    if (typeof value !== "object") return String(value);
    if (Array.isArray(value)) return value.slice(0, 40).map(v => flat(v, depth + 1)).join(" ");
    return Object.entries(value).slice(0, 70).map(([k, v]) => `${k} ${flat(v, depth + 1)}`).join(" ");
  }

  function recordsFrom(value, source, path = "$", out = [], depth = 0) {
    if (depth > 9 || value == null || out.length > 5000) return out;
    if (Array.isArray(value)) {
      value.forEach((item, index) => recordsFrom(item, source, `${path}[${index}]`, out, depth + 1));
      return out;
    }
    if (typeof value !== "object") return out;

    const article = pick(value, ["articulo","artículo","article","art","precepto"]);
    const code = pick(value, ["codigo","código"]);
    const title = pick(value, ["titulo","título","title","denominacion","denominación","epigrafe","epígrafe","nombre","name"]);
    const description = pick(value, ["conducta","descripcion","descripción","description","texto","text","contenido","content","tipificacion","tipificación","hechos"]);
    const severity = pick(value, ["gravedad","severity","clasificacion","clasificación"]);
    const amount = pick(value, ["cuantia","cuantía","importe","multa","sancion","sanción"]);
    const searchable = norm([source, article, code, title, description, severity, amount, flat(value)].join(" "));

    if (article || code || title || description) {
      out.push({ source, article, code, title, description, severity, amount, searchable, path });
    }

    Object.entries(value).forEach(([key, child]) => {
      if (child && typeof child === "object") recordsFrom(child, source, `${path}.${key}`, out, depth + 1);
    });
    return out;
  }

  async function cargarDatos() {
    if (datosCachePromise) return datosCachePromise;
    datosCachePromise = Promise.all(DATA_FILES.map(async ([source, url]) => {
      try {
        const response = await fetch(url, { cache: "no-cache" });
        if (!response.ok) return [];
        const json = await response.json();
        return recordsFrom(json, source);
      } catch (_) {
        return [];
      }
    })).then(groups => groups.flat());
    return datosCachePromise;
  }

  function expandedTokens(question) {
    const result = new Set(tokens(question));
    [...result].forEach(token => (SYN[token] || []).forEach(word => result.add(norm(word))));
    return [...result].filter(Boolean);
  }

  function relevance(record, question) {
    const original = tokens(question);
    const expanded = expandedTokens(question);
    let score = 0;
    const text = record.searchable;
    const title = norm(record.title);
    const article = norm(record.article);
    const source = norm(record.source);

    original.forEach(token => {
      if (article === token) score += 80;
      if (title.includes(token)) score += 24;
      if (source.includes(token)) score += 18;
      if (text.includes(token)) score += 7;
    });

    expanded.forEach(token => {
      if (article.includes(token)) score += 32;
      if (title.includes(token)) score += 12;
      if (text.includes(token)) score += 4;
    });

    const hitCount = original.filter(token => text.includes(token)).length;
    if (original.length) score += Math.round((hitCount / original.length) * 35);
    return score;
  }

  async function obtenerContexto(question) {
    try {
      const records = await cargarDatos();
      const ranked = records
        .map(record => ({ record, score: relevance(record, question) }))
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 14)
        .map(item => item.record);

      if (!ranked.length) return "No se ha encontrado una coincidencia directa en la base normativa local.";

      return ranked.map((r, i) => {
        const header = `${i + 1}. FUENTE: ${r.source}${r.article ? ` | ARTÍCULO: ${r.article}` : ""}${r.code ? ` | CÓDIGO: ${r.code}` : ""}`;
        const title = r.title ? ` | TÍTULO: ${r.title}` : "";
        const severity = r.severity ? ` | GRAVEDAD: ${r.severity}` : "";
        const amount = r.amount ? ` | SANCIÓN/CUANTÍA: ${r.amount}` : "";
        const description = String(r.description || "").replace(/\s+/g, " ").slice(0, 1800);
        return `${header}${title}${severity}${amount}\nCONTENIDO: ${description || "Sin descripción específica."}`;
      }).join("\n\n");
    } catch (error) {
      console.warn("Centinela IA: no se pudo preparar contexto local", error);
      return "No se pudo cargar el contexto normativo local en este momento.";
    }
  }

  function humanError(value) {
    if (value == null) return "Error desconocido.";
    if (typeof value === "string") return value;
    if (value instanceof Error && value.message) return value.message;
    if (typeof value === "object") {
      const obj = value;
      if (typeof obj.message === "string") return obj.message;
      if (typeof obj.error === "string") return obj.error;
      if (obj.error && typeof obj.error.message === "string") return obj.error.message;
      try { return JSON.stringify(obj); } catch (_) { return "Error no identificado."; }
    }
    return String(value);
  }

  /**
   * Extrae el contenido de texto de una respuesta de IA.
   * Soporta múltiples formatos:
   * - OpenAI: { choices: [{ message: { content: "..." } }] }
   * - Gemini: { candidates: [{ content: { parts: [{ text: "..." }] } }] }
   * - Texto plano
   */
  function extraerTextoRespuesta(respuesta) {
    if (typeof respuesta === "string") return respuesta.trim();
    if (!respuesta || typeof respuesta !== "object") return "";

    // Formato OpenAI
    if (respuesta.choices && Array.isArray(respuesta.choices)) {
      const choice = respuesta.choices[0];
      if (choice?.message?.content) return String(choice.message.content).trim();
    }

    // Formato Gemini
    if (respuesta.candidates && Array.isArray(respuesta.candidates)) {
      const candidate = respuesta.candidates[0];
      if (candidate?.content?.parts && Array.isArray(candidate.content.parts)) {
        const part = candidate.content.parts[0];
        if (part?.text) return String(part.text).trim();
      }
    }

    // Campo genérico 'text'
    if (typeof respuesta.text === "string") return respuesta.text.trim();

    // Campo genérico 'content'
    if (typeof respuesta.content === "string") return respuesta.content.trim();

    return "";
  }

  /**
   * Detecta errores comunes de la IA (saturación, límite de cuota, etc.)
   * Devuelve true si el error es recuperable (reintentar), false si es definitivo.
   */
  function esErrorRecuperable(error) {
    if (!error) return false;
    const msg = String(error).toLowerCase();
    return msg.includes("high demand") ||
           msg.includes("quota") ||
           msg.includes("rate limit") ||
           msg.includes("timeout") ||
           msg.includes("temporarily unavailable") ||
           msg.includes("overloaded") ||
           msg.includes("error 429") ||
           msg.includes("error 503") ||
           msg.includes("error 500");
  }

  /**
   * Realiza un reintento con backoff exponencial.
   * Notifica al usuario sobre el progreso.
   */
  async function preguntarConReintentos(pregunta, contexto, intento = 0) {
    try {
      // Notifica al usuario que está intentando
      if (callbackProgreso) {
        if (intento === 0) {
          callbackProgreso(`📡 Conectando con Centinela IA...`);
        } else {
          callbackProgreso(`🔄 Reintentando... (intento ${intento}/${MAX_REINTENTOS})`);
        }
      }

      const response = await fetch(IA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pregunta, contexto }),
        signal: AbortSignal.timeout(30000) // Timeout de 30 segundos
      });

      const raw = await response.text();
      let data = {};
      try { data = raw ? JSON.parse(raw) : {}; } catch (_) { data = { error: raw }; }

      if (!response.ok) {
        const error = data?.error || data?.message || raw || "Error desconocido";
        const mensaje = humanError(error);

        // Reintento si es error recuperable y no hemos alcanzado el máximo
        if (esErrorRecuperable(error) && intento < MAX_REINTENTOS - 1) {
          const delayMs = Math.min(DELAY_BASE_MS * Math.pow(2, intento), DELAY_MAX_MS);
          const segundos = Math.round(delayMs / 1000);
          
          console.warn(`⏳ Centinela IA: reintentando en ${segundos}s (intento ${intento + 1}/${MAX_REINTENTOS})`);
          
          if (callbackProgreso) {
            callbackProgreso(`⏳ Esperando ${segundos}s antes de reintentar...`);
          }
          
          await new Promise(resolve => setTimeout(resolve, delayMs));
          return preguntarConReintentos(pregunta, contexto, intento + 1);
        }

        return `No he podido consultar Centinela IA (intento ${intento + 1}/${MAX_REINTENTOS}). ${mensaje}`;
      }

      const texto = extraerTextoRespuesta(data);
      if (texto) {
        if (callbackProgreso) callbackProgreso(null); // Limpia el estado
        return texto;
      }

      // Si la respuesta está vacía pero no hay error HTTP, reintentar
      if (intento < MAX_REINTENTOS - 1) {
        const delayMs = Math.min(DELAY_BASE_MS * Math.pow(2, intento), DELAY_MAX_MS);
        const segundos = Math.round(delayMs / 1000);
        
        console.warn(`⚠️ Respuesta vacía, reintentando en ${segundos}s...`);
        
        if (callbackProgreso) {
          callbackProgreso(`⚠️ Respuesta vacía. Reintentando en ${segundos}s...`);
        }
        
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return preguntarConReintentos(pregunta, contexto, intento + 1);
      }

      return "La IA no devolvió una respuesta utilizable después de varios intentos.";
    } catch (error) {
      console.error("Centinela IA error:", error);

      // Reintento si es error recuperable
      if (esErrorRecuperable(error) && intento < MAX_REINTENTOS - 1) {
        const delayMs = Math.min(DELAY_BASE_MS * Math.pow(2, intento), DELAY_MAX_MS);
        const segundos = Math.round(delayMs / 1000);
        
        console.warn(`🔄 Error temporal, reintentando en ${segundos}s (intento ${intento + 1}/${MAX_REINTENTOS})...`);
        
        if (callbackProgreso) {
          callbackProgreso(`🔄 Reintentando en ${segundos}s...`);
        }
        
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return preguntarConReintentos(pregunta, contexto, intento + 1);
      }

      return `No se ha podido conectar con Centinela IA después de ${MAX_REINTENTOS} intentos. ${humanError(error)}`;
    }
  }

  async function preguntarRobusto(pregunta, onProgreso = null) {
    const question = String(pregunta || "").trim();
    if (!question) return "Escribe una consulta para Centinela IA.";

    // Guarda el callback de progreso
    callbackProgreso = onProgreso;

    try {
      const contexto = await obtenerContexto(question);
      const resultado = await preguntarConReintentos(question, contexto);
      callbackProgreso = null; // Limpia
      return resultado;
    } catch (error) {
      console.error("Centinela IA error fatal:", error);
      callbackProgreso = null;
      return `Centinela IA no está disponible. ${humanError(error)}`;
    }
  }

  // Sustituye la función global utilizada por la interfaz actual.
  window.preguntarCentinelaIA = preguntarRobusto;
  window.CentinelaIA = {
    preguntar: preguntarRobusto,
    contexto: obtenerContexto,
    recargarDatos: () => { datosCachePromise = null; return cargarDatos(); },
    setCallbackProgreso: (cb) => { callbackProgreso = cb; }
  };

  // ============================================================
  // MÓDULO DE MATRÍCULAS — SE MANTIENE INTACTO
  // ============================================================
  (function cargarModuloMatriculas() {
    function cargar() {
      if (document.getElementById("centinelaMatriculasScript")) return;
      const script = document.createElement("script");
      script.id = "centinelaMatriculasScript";
      script.src = "./matriculas.js?v=20260904-dgt-live-v4";
      script.async = true;
      script.onerror = () => console.warn("No se pudo cargar el módulo avanzado de Matrículas.");
      document.head.appendChild(script);
    }
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => setTimeout(cargar, 0), { once: true });
    } else setTimeout(cargar, 0);
  })();
})();
