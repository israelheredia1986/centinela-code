// CENTINELA IA — INTERNET FIRST + FALLBACK REPOSITORIO
// Modelo: Gemini 3.5 Flash-Lite
// Requiere el secreto GEMINI_API_KEY en Supabase.
//
// IMPORTANTE:
// Gemini 3.5 Flash-Lite se utiliza aquí para generación de texto.
// La búsqueda web NO se activa desde Gemini 3.x en esta función.
// Si el frontend aporta contexto web verificable, puede enviarlo mediante
// web_context. Si no existe contexto web suficiente, se puede usar el
// fallback del repositorio mediante repository_fallback.

const MODEL = "gemini-3.5-flash-lite";

const GEMINI_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

function extractText(data: any): string {
  return (
    data?.candidates?.[0]?.content?.parts
      ?.map((part: any) => part?.text || "")
      .join("") || ""
  ).trim();
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

async function callGemini(apiKey: string, prompt: string) {
  const requestBody = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ],
    generationConfig: {
      maxOutputTokens: 4500,
    },
  };

  const response = await fetch(GEMINI_URL, {
    method: "POST",
    headers: {
      "x-goog-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  const raw = await response.text();

  let data: any;

  try {
    data = JSON.parse(raw);
  } catch {
    data = { raw };
  }

  return {
    ok: response.ok,
    status: response.status,
    data,
    text: extractText(data),
  };
}

const POLICE_RULES = `
Eres CENTINELA IA, asistente profesional de apoyo para Policía Local en España.

Responde exclusivamente a la consulta ACTUAL del agente.

Habla como un profesional policial: claro, preciso, objetivo, directo y operativo.

No inventes artículos, leyes, infracciones, sanciones, cuantías, competencias, procedimientos ni hechos.

Distingue siempre entre hechos conocidos, hechos que deben comprobarse y valoración jurídica.

Cuando exista base jurídica suficiente, estructura la respuesta con:

Valoración policial
Infracción y artículo
Norma aplicable
Calificación
Sanción o rango de sanción
Fundamento jurídico
Método de actuación policial
Comprobaciones antes de denunciar

Si existen varias normas potencialmente aplicables, explica cuál corresponde mejor a los hechos y por qué.

Si la conducta no constituye infracción con los datos disponibles, dilo claramente.

No atribuyas automáticamente una infracción porque exista una conducta irregular.

No inventes una norma para completar una respuesta.

No devuelvas JSON.
No devuelvas código.
No uses emojis.
No uses Markdown.
No uses la palabra "Fuente" como encabezado.
`;

export default {
  async fetch(req: Request) {
    if (req.method === "OPTIONS") {
      return new Response("ok", {
        headers: CORS,
      });
    }

    if (req.method !== "POST") {
      return jsonResponse(
        {
          ok: false,
          error: "Método no permitido.",
        },
        405,
      );
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");

    if (!apiKey) {
      return jsonResponse(
        {
          ok: false,
          error: "Falta el secreto GEMINI_API_KEY en Supabase.",
        },
        500,
      );
    }

    let body: any;

    try {
      body = await req.json();
    } catch {
      return jsonResponse(
        {
          ok: false,
          error: "El JSON enviado a CENTINELA no es válido.",
        },
        400,
      );
    }

    const pregunta = String(body?.pregunta || "").trim();
    const modo = String(body?.modo || "web_first").trim();
    const contexto = String(body?.contexto || "").trim();
    const webContext = String(body?.web_context || "").trim();

    if (!pregunta) {
      return jsonResponse(
        {
          ok: false,
          error: "Falta la pregunta.",
        },
        400,
      );
    }

    // ============================================================
    // FASE 1 — WEB CONTEXT
    // ============================================================
    // Gemini 3.5 Flash-Lite no realiza aquí Google Search.
    // El frontend puede proporcionar resultados web en web_context.
    // Solo se consideran suficientes si contienen información verificable.

    if (modo === "web_first") {
      if (!webContext) {
        return jsonResponse({
          ok: true,
          mode: "web_first",
          web_found: false,
          repository_required: true,
          text: "",
          sources: [],
          reason:
            "No se ha proporcionado contexto web verificable para esta consulta.",
        });
      }

      const prompt = `
${POLICE_RULES}

FASE WEB

Se te proporciona información obtenida previamente de Internet.

Utiliza únicamente la información web que sea relevante y verificable.

Prioriza BOE, DGT, ministerios, Junta de Andalucía, boletines oficiales, ayuntamientos y otros organismos públicos.

Comprueba que la norma, artículo y datos aportados sean coherentes con la consulta.

Si el contexto web no contiene información suficiente para responder con seguridad, responde exactamente:
WEB_SIN_RESPUESTA

No inventes información que no aparezca en el contexto web.

CONSULTA ACTUAL DEL AGENTE:
${pregunta}

CONTEXTO WEB:
${webContext}
`;

      try {
        const result = await callGemini(apiKey, prompt);

        if (!result.ok) {
          return jsonResponse(
            {
              ok: false,
              mode: "web_first",
              web_found: false,
              reason: "WEB_MODEL_ERROR",
              error:
                result.data?.error?.message ||
                "Error consultando Gemini.",
              status: result.status,
            },
            502,
          );
        }

        const text = cleanText(result.text);

        if (!text || text === "WEB_SIN_RESPUESTA") {
          return jsonResponse({
            ok: true,
            mode: "web_first",
            web_found: false,
            repository_required: true,
            text: "",
            sources: [],
            reason:
              "El contexto web no contiene información suficiente para responder con seguridad.",
          });
        }

        return jsonResponse({
          ok: true,
          mode: "web_first",
          web_found: true,
          repository_required: false,
          text,
          sources: [],
        });
      } catch (error) {
        return jsonResponse(
          {
            ok: false,
            mode: "web_first",
            web_found: false,
            reason: "WEB_EXCEPTION",
            error:
              error instanceof Error
                ? error.message
                : "Error inesperado consultando Gemini.",
          },
          502,
        );
      }
    }

    // ============================================================
    // FASE 2 — REPOSITORIO
    // ============================================================

    if (modo === "repository_fallback") {
      const prompt = `
${POLICE_RULES}

FASE REPOSITORIO NORMATIVO

No realices ninguna búsqueda en Internet en esta fase.

Utiliza exclusivamente el contexto normativo del repositorio que aparece debajo.

Ignora cualquier contenido que no tenga relación directa con la consulta actual.

Si el contexto no contiene base suficiente, dilo claramente y no inventes.

CONSULTA ACTUAL DEL AGENTE:
${pregunta}

CONTEXTO NORMATIVO DEL REPOSITORIO:
${contexto || "(No se han encontrado coincidencias suficientes.)"}
`;

      try {
        const result = await callGemini(apiKey, prompt);

        if (!result.ok) {
          return jsonResponse(
            {
              ok: false,
              mode: "repository_fallback",
              web_found: false,
              repository_found: false,
              error:
                result.data?.error?.message ||
                "Error consultando Gemini para el repositorio.",
              status: result.status,
            },
            502,
          );
        }

        const text = cleanText(result.text);

        return jsonResponse({
          ok: true,
          mode: "repository_fallback",
          web_found: false,
          repository_found: !!text,
          text:
            text ||
            "No se ha encontrado información suficiente en el repositorio.",
          sources: [],
        });
      } catch (error) {
        return jsonResponse(
          {
            ok: false,
            mode: "repository_fallback",
            web_found: false,
            repository_found: false,
            error:
              error instanceof Error
                ? error.message
                : "Error inesperado consultando Gemini.",
          },
          502,
        );
      }
    }

    // ============================================================
    // MODO NO VÁLIDO
    // ============================================================

    return jsonResponse(
      {
        ok: false,
        error:
          "Modo de consulta no válido. Utiliza web_first o repository_fallback.",
      },
      400,
    );
  },
};
