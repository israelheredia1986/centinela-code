// ============================================================
// CENTINELA IA — SUPABASE EDGE FUNCTION
// Seguridad + Internet First + repositorio normativo fallback
// ============================================================

const MODEL = "gemini-3.5-flash-lite";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const ALLOWED_ORIGINS = new Set([
  "https://israelheredia1986.github.io",
  "https://centinela-code.netlify.app",
  "https://deploy-preview-9--centinela-code.netlify.app",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173"
]);

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;
const rateBuckets = new Map<string, number[]>();

const POLICE_RULES = `
Eres CENTINELA IA, asistente profesional de apoyo a Policía Local en España.

PRINCIPIO FUNDAMENTAL:
No rellenes huecos con suposiciones. No conviertas una posibilidad en un hecho.
No inventes artículos, leyes, sanciones, cuantías, competencias, procedimientos,
responsabilidades ni circunstancias que no estén acreditadas.

PRIORIDAD JURÍDICA:
1. Hechos expresamente indicados por el agente.
2. Norma y artículo que consten realmente en el contexto recibido.
3. Para información actualizada, usa y prioriza resultados oficiales y verificables.
4. Si falta un dato esencial, indícalo como comprobación pendiente.
5. Nunca uses una norma genérica solo porque una palabra coincida.

FUENTES:
- Prioriza BOE, DGT, ministerios, Junta de Andalucía, boletines oficiales y
  administraciones públicas competentes.
- Si una fuente secundaria contradice una fuente oficial, prevalece la oficial.
- No afirmes que una información está vigente si la búsqueda no permite comprobarlo.
- En Internet First, utiliza la búsqueda web y cita las fuentes recuperadas.

MENORES:
- No confundas "16 años" con "menor de 16 años".
- La Ley Orgánica 5/2000 se aplica a quien sea mayor de 14 y menor de 18 cuando
  cometa un hecho tipificado como delito.
- No atribuyas automáticamente responsabilidad penal, civil o administrativa a
  padres, tutores o titulares de vehículos.
- No afirmes que un tercero permitió, facilitó, indujo o cooperó si ese hecho no consta.
- No afirmes que todo menor debe ser detenido. La detención exige valorar los requisitos legales.

SEGURIDAD VIAL:
- Antes de aplicar el artículo 384 del Código Penal, diferencia no haber obtenido
  nunca el permiso, pérdida de vigencia por puntos, privación judicial u otra situación.
- El dato esencial es la situación de la autorización y la conducción del vehículo correspondiente.
- No inventes inmovilizaciones ni medidas concretas si faltan los hechos necesarios.

FORMATO NORMAL:
Valoración
Infracción y artículo
Norma aplicable
Calificación
Sanción o consecuencias
Fundamento jurídico
Método de actuación policial
Comprobaciones antes de denunciar

FORMATO:
Respeta el formato explícitamente pedido por la consulta. Si la aplicación pide
JSON exacto, devuelve JSON válido y ningún texto fuera del JSON. En caso contrario,
redacta de forma clara, objetiva, policial y operativa. Distingue siempre entre
hechos acreditados, hechos presuntos y comprobaciones pendientes.
`;

function corsHeaders(origin: string | null): Headers {
  const headers = new Headers({
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  if (origin && ALLOWED_ORIGINS.has(origin)) headers.set("Access-Control-Allow-Origin", origin);
  return headers;
}

function jsonResponse(body: unknown, status = 200, origin: string | null = null) {
  const headers = corsHeaders(origin);
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(body), { status, headers });
}

function decodeJwtSubject(authorization: string | null): string {
  if (!authorization?.startsWith("Bearer ")) return "";
  const token = authorization.slice(7).trim();
  const parts = token.split(".");
  if (parts.length !== 3) return "";
  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload?.sub === "string" ? payload.sub : "";
  } catch (_) {
    return "";
  }
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const previous = rateBuckets.get(key) || [];
  const recent = previous.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) {
    rateBuckets.set(key, recent);
    return true;
  }
  recent.push(now);
  rateBuckets.set(key, recent);
  if (rateBuckets.size > 1000) {
    for (const [bucketKey, timestamps] of rateBuckets) {
      if (!timestamps.some(timestamp => now - timestamp < RATE_LIMIT_WINDOW_MS)) rateBuckets.delete(bucketKey);
    }
  }
  return false;
}

function extractText(data: any): string {
  return String(data?.candidates?.[0]?.content?.parts?.map((part: any) => part?.text || "").join("") || "").trim();
}

function cleanText(text: string): string {
  return String(text || "").replace(/\u0000/g, "").trim();
}

function extractGrounding(data: any) {
  const candidate = data?.candidates?.[0];
  const metadata = candidate?.groundingMetadata || {};
  const sources: Array<{ title: string; uri: string }> = [];
  const seen = new Set<string>();

  for (const chunk of Array.isArray(metadata.groundingChunks) ? metadata.groundingChunks : []) {
    const uri = String(chunk?.web?.uri || "").trim();
    const title = String(chunk?.web?.title || uri || "Referencia web").trim();
    if (!uri || seen.has(uri)) continue;
    seen.add(uri);
    sources.push({ title, uri });
  }

  const queries = Array.isArray(metadata.webSearchQueries)
    ? metadata.webSearchQueries.map((query: unknown) => String(query)).filter(Boolean).slice(0, 10)
    : [];

  return { sources: sources.slice(0, 10), queries };
}

async function callGemini(apiKey: string, prompt: string, useSearch: boolean) {
  const body: Record<string, unknown> = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: POLICE_RULES }] },
    generationConfig: {
      temperature: 0.05,
      maxOutputTokens: 4500
    }
  };

  if (useSearch) body.tools = [{ googleSearch: {} }];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 40_000);
  try {
    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    const raw = await response.text();
    let data: any;
    try { data = JSON.parse(raw); } catch (_) { data = { raw }; }
    return { ok: response.ok, status: response.status, data, text: extractText(data), grounding: extractGrounding(data) };
  } finally {
    clearTimeout(timer);
  }
}

function validInput(value: unknown, max: number): string {
  return String(value ?? "").trim().slice(0, max);
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(origin) });
  if (req.method !== "POST") return jsonResponse({ ok: false, error: "Método no permitido." }, 405, origin);

  const authorization = req.headers.get("authorization");
  const userId = decodeJwtSubject(authorization);
  if (!userId) return jsonResponse({ ok: false, error: "No autenticado. Inicia sesión para utilizar Centinela IA." }, 401, origin);

  if (isRateLimited(`user:${userId}`)) {
    return jsonResponse({ ok: false, error: "Has alcanzado temporalmente el límite de consultas. Espera un momento e inténtalo de nuevo." }, 429, origin);
  }

  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) return jsonResponse({ ok: false, error: "Falta el secreto GEMINI_API_KEY en Supabase." }, 500, origin);

  let body: any;
  try { body = await req.json(); }
  catch (_) { return jsonResponse({ ok: false, error: "El JSON enviado a CENTINELA no es válido." }, 400, origin); }

  const pregunta = validInput(body?.pregunta, 8_000);
  const modo = validInput(body?.modo || "web_first", 64);
  const contexto = validInput(body?.contexto, 50_000);
  const webContext = validInput(body?.web_context, 50_000);

  if (!pregunta) return jsonResponse({ ok: false, error: "Falta la pregunta." }, 400, origin);

  try {
    if (modo === "web_first") {
      const prompt = `${POLICE_RULES}\n\nFASE INTERNET FIRST\n\nRealiza la consulta utilizando la herramienta de Búsqueda de Google habilitada.\nPrioriza resultados oficiales y vigentes. No uses memoria como sustituto de la búsqueda.\nSolo considera esta fase válida si la respuesta queda realmente fundamentada en fuentes web.\nSi no hay fuentes recuperadas o los resultados no permiten responder con seguridad, indícalo.\n\nCONSULTA DEL AGENTE:\n${pregunta}\n${webContext ? `\nCONTEXTO WEB ADICIONAL:\n${webContext}` : ""}`;
      const result = await callGemini(apiKey, prompt, true);
      if (!result.ok) {
        return jsonResponse({ ok: false, mode: "web_first", web_found: false, error: result.data?.error?.message || "Error consultando Gemini con Búsqueda de Google.", status: result.status }, 502, origin);
      }

      const text = cleanText(result.text);
      const grounded = result.grounding.sources.length > 0;
      if (!text || !grounded) {
        return jsonResponse({
          ok: true,
          mode: "web_first",
          web_found: false,
          repository_required: true,
          text: "",
          sources: result.grounding.sources,
          search_queries: result.grounding.queries,
          reason: grounded ? "La búsqueda web no produjo una respuesta utilizable." : "La respuesta no quedó fundamentada con fuentes web recuperadas."
        }, 200, origin);
      }

      return jsonResponse({ ok: true, mode: "web_first", web_found: true, repository_required: false, text, sources: result.grounding.sources, search_queries: result.grounding.queries }, 200, origin);
    }

    if (modo === "repository_fallback") {
      const prompt = `${POLICE_RULES}\n\nFASE REPOSITORIO NORMATIVO\n\nUtiliza exclusivamente el contexto normativo que aparece debajo.\nDescarta coincidencias irrelevantes. Si no existe base suficiente, dilo.\nRespeta el formato solicitado en la consulta; si pide JSON exacto, devuelve JSON válido.\n\nCONSULTA DEL AGENTE:\n${pregunta}\n\nCONTEXTO NORMATIVO LOCAL:\n${contexto || "(No se han encontrado coincidencias normativas suficientes.)"}`;
      const result = await callGemini(apiKey, prompt, false);
      if (!result.ok) {
        return jsonResponse({ ok: false, mode: "repository_fallback", repository_found: false, error: result.data?.error?.message || "Error consultando Gemini." }, 502, origin);
      }
      const text = cleanText(result.text);
      return jsonResponse({ ok: true, mode: "repository_fallback", repository_found: Boolean(text), web_found: false, text: text || "No se ha encontrado información suficiente en el repositorio." }, 200, origin);
    }

    return jsonResponse({ ok: false, error: "Modo de consulta no válido. Utiliza web_first o repository_fallback." }, 400, origin);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error inesperado.";
    console.error("Centinela IA:", message);
    return jsonResponse({ ok: false, error: "No se ha podido completar la consulta en este momento." }, 502, origin);
  }
});
