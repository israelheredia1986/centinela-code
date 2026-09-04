// CENTINELA IA — INTERNET FIRST + FALLBACK REPOSITORIO — GRATIS
// Requiere el secreto GEMINI_API_KEY en Supabase.
// Usa Gemini 2.5 Flash-Lite para mantener el modelo gratuito.

const MODEL = "gemini-2.5-flash-lite";
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
  return data?.candidates?.[0]?.content?.parts
    ?.map((p: any) => p?.text || "")
    .join("")
    .trim() || "";
}

function groundingSources(data: any) {
  const chunks = data?.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const seen = new Set<string>();

  return chunks
    .map((c: any) => c?.web)
    .filter((w: any) => w?.uri)
    .filter((w: any) => {
      if (seen.has(w.uri)) return false;
      seen.add(w.uri);
      return true;
    })
    .map((w: any) => ({
      title: w.title || "Referencia web",
      uri: w.uri,
    }));
}

function cleanText(text: string): string {
  return text
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

async function gemini(apiKey: string, prompt: string, internet: boolean) {
  const body: any = {
    contents: [{
      role: "user",
      parts: [{ text: prompt }],
    }],
    generationConfig: {
      temperature: 0.15,
      topP: 0.9,
      maxOutputTokens: 4500,
    },
  };

  // Solo se activa Google Search en la fase web_first.
  if (internet) {
    body.tools = [{ google_search: {} }];
  }

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

  try {
    data = JSON.parse(raw);
  } catch {
    data = { raw };
  }

  return {
    ok: r.ok,
    data,
    text: textOf(data),
    sources: groundingSources(data),
  };
}

const POLICE_RULES = `
Eres CENTINELA IA, asistente profesional de apoyo para Policía Local en España.

Responde exclusivamente a la consulta ACTUAL del agente.

Habla como un profesional policial: claro, preciso, objetivo, directo y operativo.

No inventes artículos, infracciones, sanciones, competencias, cuantías ni hechos.

Distingue siempre los hechos acreditados de los extremos que deben comprobarse.

Cuando sea posible, estructura la respuesta con:
Valoración policial
Infracción y artículo
Norma aplicable
Calificación
Sanción o rango de sanción
Fundamento jurídico
Método de actuación policial
Comprobaciones antes de denunciar

No devuelvas JSON.
No devuelvas código.
No uses emojis.
No uses la palabra "Fuente" como encabezado.
No uses Markdown.
`;

export default {
  async fetch(req: Request) {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: CORS });
    }

    if (req.method !== "POST") {
      return response({
        ok: false,
        error: "Método no permitido",
      }, 405);
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");

    if (!apiKey) {
      return response({
        ok: false,
        error: "Falta el secreto GEMINI_API_KEY en Supabase.",
      }, 500);
    }

    let body: any;

    try {
      body = await req.json();
    } catch {
      return response({
        ok: false,
        error: "JSON de entrada no válido.",
      }, 400);
    }

    const pregunta = String(body?.pregunta || "").trim();
    const modo = String(body?.modo || "web_first").trim();
    const contexto = String(body?.contexto || "").trim();

    if (!pregunta) {
      return response({
        ok: false,
        error: "Falta la pregunta.",
      }, 400);
    }

    // ============================================================
    // PRIMERA VÍA: INTERNET
    // ============================================================
    if (modo === "web_first") {
      const prompt = `${POLICE_RULES}

INSTRUCCIÓN PRIORITARIA:
DEBES BUSCAR EN INTERNET CON GOOGLE SEARCH ANTES DE RESPONDER.

Prioriza fuentes oficiales españolas y jurídicas:
- BOE
- DGT
- ministerios
- Junta de Andalucía
- boletines oficiales
- organismos públicos
- normativa autonómica y local oficial
- jurisprudencia oficial cuando corresponda

Comprueba que la norma esté vigente y que el artículo citado corresponda exactamente a la conducta descrita.

No confundas artículos de distintas leyes.

Si la búsqueda no proporciona información suficiente o verificable para responder con seguridad, responde exactamente:
WEB_SIN_RESPUESTA

Si encuentras información suficiente y verificable, responde normalmente.

CONSULTA ACTUAL DEL AGENTE:
${pregunta}`;

      const result = await gemini(apiKey, prompt, true);

      if (!result.ok) {
        return response({
          ok: false,
          web_found: false,
          reason: "WEB_ERROR",
          error: result.data?.error?.message || "Error consultando Internet.",
        }, 502);
      }

      const text = cleanText(result.text);
      const sources = result.sources;

      if (
        !text ||
        text === "WEB_SIN_RESPUESTA" ||
        sources.length === 0
      ) {
        return response({
          ok: true,
          mode: "web_first",
          web_found: false,
          text: "",
          sources: [],
          reason: "No se ha localizado una respuesta web suficientemente fiable.",
        });
      }

      return response({
        ok: true,
        mode: "web_first",
        web_found: true,
        text,
        sources,
      });
    }

    // ============================================================
    // SEGUNDA VÍA: REPOSITORIO
    // ============================================================
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

      if (!result.ok) {
        return response({
          ok: false,
          web_found: false,
          repository_found: false,
          error: result.data?.error?.message || "Error consultando el repositorio.",
        }, 502);
      }

      const text = cleanText(result.text);

      return response({
        ok: true,
        mode: "repository_fallback",
        web_found: false,
        repository_found: !!text,
        text: text || "No se ha encontrado información suficiente en el repositorio.",
      });
    }

    return response({
      ok: false,
      error: "Modo de consulta no válido.",
    }, 400);
  },
};
