// CENTINELA IA — INTERNET FIRST + FALLBACK REPOSITORIO
// Modelo: Gemini 3.5 Flash-Lite
// Requiere el secreto GEMINI_API_KEY en Supabase.

const MODEL = "gemini-3.5-flash-lite";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json; charset=utf-8" },
  });
}

function extractText(data: any): string {
  return (data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text || "").join("") || "").trim();
}

function cleanText(text: string): string {
  return String(text || "")
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .replace(/^\s*#+\s*/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/^\s*[-•]\s*/gm, "")
    .replace(/^\s*Fuente\s*:.*$/gim, "")
    .replace(/^\s*FUENTE\s*:.*$/gim, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function callGemini(apiKey: string, prompt: string) {
  const response = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.05, maxOutputTokens: 4500 },
    }),
  });

  const raw = await response.text();
  let data: any;
  try { data = JSON.parse(raw); } catch { data = { raw }; }

  return { ok: response.ok, status: response.status, data, text: extractText(data) };
}

const POLICE_RULES = `
Eres CENTINELA IA, asistente profesional de apoyo a Policía Local en España.

PRINCIPIO FUNDAMENTAL:
No rellenes huecos con suposiciones. No conviertas una posibilidad en un hecho.
No inventes artículos, leyes, sanciones, cuantías, competencias, procedimientos,
responsabilidades ni circunstancias que no estén acreditadas en la consulta o en
el contexto normativo recibido.

PRIORIDAD JURÍDICA:
1. Hechos expresamente indicados por el agente.
2. Norma y artículo que consten realmente en el contexto proporcionado.
3. Si falta un dato esencial, indícalo como comprobación pendiente.
4. Nunca uses una norma genérica porque una palabra de la consulta coincida con ella.

REGLAS ESPECIALES PARA MENORES:
- No confundas "16 años" con "menor de 16 años". A los efectos de la respuesta,
  16 años significa que ya ha cumplido 16.
- La Ley Orgánica 5/2000 se aplica a quien sea mayor de 14 y menor de 18 cuando
  cometa un hecho tipificado como delito.
- No atribuyas automáticamente responsabilidad penal, civil o administrativa
  a padres, tutores o titulares de vehículos. Para cualquier responsabilidad
  de un tercero debe existir una base jurídica concreta y hechos que la sustenten.
- No afirmes que el padre, madre, tutor o titular "permitió" o "facilitó" la
  conducción si ese hecho no aparece en la consulta.
- No afirmes que existe cooperación necesaria, inducción u otra forma de
  participación de un tercero sin hechos y fundamento jurídico suficientes.
- No ordenes investigar una posible responsabilidad de un tercero como si ya
  existiera. Si procede, indica únicamente que debe comprobarse y por qué.
- No afirmes que todo menor debe ser detenido. La detención exige valorar los
  requisitos legales y las circunstancias concretas.
- No afirmes que debe ponerse al menor a disposición de Fiscalía salvo que la
  situación concreta y la normativa aplicable lo determinen.

REGLAS PARA DELITOS CONTRA LA SEGURIDAD VIAL:
- Antes de aplicar el artículo 384 del Código Penal, diferencia claramente si
  se trata de no haber obtenido nunca el permiso, pérdida de vigencia por puntos,
  privación judicial u otra situación.
- Si se afirma que carece de permiso, debe comprobarse administrativamente la
  situación del permiso y dejar constancia de la comprobación.
- No conviertas la edad por sí sola en el elemento típico del artículo 384.
  El elemento esencial es la situación de la autorización para conducir y la
  conducción de un vehículo de motor o ciclomotor.
- No inventes una inmovilización concreta ni un artículo de la Ley de Tráfico
  si el contexto no permite determinarlo. Indica que debe aplicarse la medida
  de aseguramiento o inmovilización que corresponda conforme a la normativa vigente.

FORMATO:
Cuando exista base suficiente, usa este orden:
Valoración
Infracción y artículo
Norma aplicable
Calificación
Sanción o consecuencias
Fundamento jurídico
Método de actuación policial
Comprobaciones antes de denunciar

El lenguaje debe ser policial, claro, objetivo, directo y práctico.
Distingue siempre entre "se acredita", "presuntamente" y "debe comprobarse".
Si la consulta no permite una conclusión jurídica segura, dilo expresamente.

No devuelvas JSON.
No devuelvas código.
No uses emojis.
No uses Markdown.
No uses la palabra "Fuente" como encabezado.
`;

export default {
  async fetch(req: Request) {
    if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

    if (req.method !== "POST") {
      return jsonResponse({ ok: false, error: "Método no permitido." }, 405);
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return jsonResponse({ ok: false, error: "Falta el secreto GEMINI_API_KEY en Supabase." }, 500);
    }

    let body: any;
    try { body = await req.json(); }
    catch { return jsonResponse({ ok: false, error: "El JSON enviado a CENTINELA no es válido." }, 400); }

    const pregunta = String(body?.pregunta || "").trim();
    const modo = String(body?.modo || "web_first").trim();
    const contexto = String(body?.contexto || "").trim();
    const webContext = String(body?.web_context || "").trim();

    if (!pregunta) return jsonResponse({ ok: false, error: "Falta la pregunta." }, 400);

    if (modo === "web_first") {
      if (!webContext) {
        return jsonResponse({
          ok: true,
          mode: "web_first",
          web_found: false,
          repository_required: true,
          text: "",
          sources: [],
          reason: "No se ha proporcionado contexto web verificable para esta consulta.",
        });
      }

      const prompt = `${POLICE_RULES}

FASE WEB

La información siguiente procede de una búsqueda web realizada previamente.
Utiliza solo información relevante y verificable. Prioriza organismos públicos
como BOE, DGT, ministerios, Junta de Andalucía, boletines oficiales y ayuntamientos.
No completes con memoria si el dato no aparece en el contexto.

Si el contexto web no permite responder con seguridad, responde exactamente:
WEB_SIN_RESPUESTA

CONSULTA ACTUAL DEL AGENTE:
${pregunta}

CONTEXTO WEB:
${webContext}
`;

      try {
        const result = await callGemini(apiKey, prompt);
        if (!result.ok) {
          return jsonResponse({ ok: false, mode: "web_first", web_found: false, reason: "WEB_MODEL_ERROR", error: result.data?.error?.message || "Error consultando Gemini.", status: result.status }, 502);
        }
        const text = cleanText(result.text);
        if (!text || text === "WEB_SIN_RESPUESTA") {
          return jsonResponse({ ok: true, mode: "web_first", web_found: false, repository_required: true, text: "", sources: [], reason: "El contexto web no contiene información suficiente para responder con seguridad." });
        }
        return jsonResponse({ ok: true, mode: "web_first", web_found: true, repository_required: false, text, sources: [] });
      } catch (error) {
        return jsonResponse({ ok: false, mode: "web_first", web_found: false, reason: "WEB_EXCEPTION", error: error instanceof Error ? error.message : "Error inesperado consultando Gemini." }, 502);
      }
    }

    if (modo === "repository_fallback") {
      const prompt = `${POLICE_RULES}

FASE REPOSITORIO NORMATIVO

Utiliza exclusivamente el contexto normativo que aparece debajo.
No inventes contenido que no aparezca en él.
Si el contexto contiene varias materias, utiliza solo las directamente relacionadas
con la consulta. Si no existe base suficiente, dilo y especifica qué comprobación
falta. No conviertas una coincidencia de palabras en una conclusión jurídica.

CONSULTA ACTUAL DEL AGENTE:
${pregunta}

CONTEXTO NORMATIVO DEL REPOSITORIO:
${contexto || "(No se han encontrado coincidencias normativas suficientes.)"}
`;

      try {
        const result = await callGemini(apiKey, prompt);
        if (!result.ok) {
          return jsonResponse({ ok: false, mode: "repository_fallback", web_found: false, repository_found: false, error: result.data?.error?.message || "Error consultando Gemini para el repositorio.", status: result.status }, 502);
        }
        const text = cleanText(result.text);
        return jsonResponse({ ok: true, mode: "repository_fallback", web_found: false, repository_found: !!text, text: text || "No se ha encontrado información suficiente en el repositorio.", sources: [] });
      } catch (error) {
        return jsonResponse({ ok: false, mode: "repository_fallback", web_found: false, repository_found: false, error: error instanceof Error ? error.message : "Error inesperado consultando Gemini." }, 502);
      }
    }

    return jsonResponse({ ok: false, error: "Modo de consulta no válido. Utiliza web_first o repository_fallback." }, 400);
  },
};