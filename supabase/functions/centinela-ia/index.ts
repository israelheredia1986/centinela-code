// CENTINELA IA — INTERNET FIRST + FALLBACK REPOSITORIO
// Requiere el secreto GEMINI_API_KEY en Supabase.

const MODEL = "gemini-3.8-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json; charset=utf-8" },
  });
}

function textOf(data: any): string {
  return data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text || "").join("").trim() || "";
}

function groundingSources(data: any) {
  const chunks = data?.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  return chunks.map((c: any) => c?.web).filter((w: any) => w?.uri).map((w: any) => ({ title: w.title || "Referencia web", uri: w.uri }));
}

async function gemini(apiKey: string, prompt: string, internet: boolean) {
  const body: any = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  };
  if (internet) body.tools = [{ google_search: {} }];

  const r = await fetch(GEMINI_URL, {
    method: "POST",
    headers: {
      "x-goog-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const raw = await r.text();
  let data: any;
  try { data = JSON.parse(raw); } catch { data = { raw }; }
  return { ok: r.ok, data, text: textOf(data), sources: groundingSources(data) };
}

const POLICE_RULES = `
Eres CENTINELA IA, asistente profesional de apoyo para Policía Local en España.
Responde exclusivamente a la consulta ACTUAL del agente.
Habla como un profesional policial: claro, preciso, objetivo, directo y operativo.
No inventes artículos, infracciones, sanciones, competencias ni hechos.
Distingue siempre hechos acreditados de extremos que deben comprobarse.
Cuando sea posible, estructura la respuesta con:
1. Valoración policial
2. Infracción y artículo
3. Norma aplicable
4. Calificación
5. Sanción o rango de sanción
6. Fundamento jurídico
7. Método de actuación policial
8. Comprobaciones antes de denunciar
No devuelvas JSON, código, emojis ni etiquetas técnicas.
No uses la palabra "Fuente" como encabezado.
`;

export default {
  async fetch(req: Request) {
    if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
    if (req.method !== "POST") return response({ error: "Método no permitido" }, 405);

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) return response({ error: "Falta el secreto GEMINI_API_KEY en Supabase." }, 500);

    let body: any;
    try { body = await req.json(); } catch { return response({ error: "JSON de entrada no válido." }, 400); }

    const pregunta = String(body?.pregunta || "").trim();
    const modo = String(body?.modo || "web_first");
    const contexto = String(body?.contexto || "").trim();
    if (!pregunta) return response({ error: "Falta la pregunta." }, 400);

    // PRIMERA VÍA: INTERNET. No se envía contexto interno del repositorio.
    if (modo === "web_first") {
      const prompt = `${POLICE_RULES}

IMPORTANTE: DEBES BUSCAR EN INTERNET CON GOOGLE SEARCH ANTES DE RESPONDER.
No respondas basándote únicamente en memoria.
Prioriza legislación y fuentes oficiales españolas (BOE, organismos públicos, normativa oficial autonómica/local) y, cuando sea necesario, otras fuentes web fiables.
Si la búsqueda web no proporciona información suficiente o verificable para contestar la consulta, responde exactamente con la marca WEB_SIN_RESPUESTA y nada más.
Si sí encuentras información útil y verificable, responde normalmente y apóyate en esas fuentes.

CONSULTA ACTUAL DEL AGENTE:
${pregunta}`;

      const result = await gemini(apiKey, prompt, true);
      if (!result.ok) return response({ web_found: false, reason: "WEB_ERROR", error: result.data?.error?.message || "Error consultando Internet." }, 502);
      if (!result.text || result.text === "WEB_SIN_RESPUESTA" || !result.sources.length) {
        return response({ web_found: false, reason: "No se ha localizado una respuesta web fiable." });
      }
      return response({ web_found: true, text: result.text, sources: result.sources });
    }

    // SEGUNDA VÍA: REPOSITORIO. Solo se usa después del intento web.
    if (modo === "repository_fallback") {
      const prompt = `${POLICE_RULES}

No busques en Internet en esta fase.
Usa exclusivamente el CONTEXTO NORMATIVO DEL REPOSITORIO que se facilita debajo.
Si el contexto no contiene base suficiente para contestar, dilo claramente y no inventes.

CONSULTA ACTUAL DEL AGENTE:
${pregunta}

CONTEXTO NORMATIVO DEL REPOSITORIO:
${contexto || "(Sin coincidencias suficientes.)"}`;

      const result = await gemini(apiKey, prompt, false);
      if (!result.ok) return response({ web_found: false, repository_found: false, error: result.data?.error?.message || "Error consultando el repositorio." }, 502);
      return response({ web_found: false, repository_found: !!result.text, text: result.text || "No se ha encontrado información suficiente en el repositorio." });
    }

    return response({ error: "Modo de consulta no válido." }, 400);
  },
};
