// CENTINELA IA — INTERNET FIRST + FALLBACK REPOSITORIO
// Gemini 3.5 Flash-Lite + búsqueda web pública sin API adicional.
// La clave GEMINI_API_KEY permanece únicamente en Supabase Secrets.

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

const POLICE_RULES = `
Eres CENTINELA IA, asistente profesional de apoyo para Policía Local en España.
Responde exclusivamente a la consulta actual del agente.
Habla con lenguaje policial claro, preciso, objetivo, directo y operativo.
No inventes artículos, leyes, infracciones, sanciones, cuantías, competencias, procedimientos ni hechos.
Distingue entre hechos conocidos, hechos que deben comprobarse y valoración jurídica.
Si una conducta depende de circunstancias concretas, indícalas.
No atribuyas automáticamente responsabilidad penal o administrativa a terceros.
No confundas infracciones por coincidencias de palabras.
Cuando exista base suficiente, estructura en este orden:
Valoración
Infracción y artículo
Norma aplicable
Calificación
Sanción o rango de sanción
Fundamento jurídico
Método de actuación policial
Comprobaciones antes de denunciar
No devuelvas JSON, código, Markdown ni emojis.
No uses la palabra "Fuente" como encabezado.
`;

async function callGemini(apiKey: string, prompt: string) {
  const response = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 4500 },
    }),
  });
  const raw = await response.text();
  let data: any;
  try { data = JSON.parse(raw); } catch { data = { raw }; }
  return { ok: response.ok, status: response.status, data, text: extractText(data) };
}

function decodeHtml(s: string): string {
  return String(s || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, " ")
    .trim();
}

function domainAllowed(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === "boe.es" || host.endsWith(".boe.es") ||
      host === "dgt.es" || host.endsWith(".dgt.es") ||
      host === "juntadeandalucia.es" || host.endsWith(".juntadeandalucia.es") ||
      host === "fiscal.es" || host.endsWith(".fiscal.es") ||
      host === "interior.gob.es" || host.endsWith(".interior.gob.es") ||
      host === "administracion.gob.es" || host.endsWith(".administracion.gob.es");
  } catch { return false; }
}

async function webSearch(pregunta: string) {
  const queries = [
    `${pregunta} site:boe.es`,
    `${pregunta} site:dgt.es`,
    `${pregunta} site:juntadeandalucia.es`,
  ];
  const results: Array<{ title: string; url: string; snippet: string }> = [];

  for (const q of queries) {
    try {
      const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`;
      const r = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 CentinelaIA/1.0" },
      });
      if (!r.ok) continue;
      const html = await r.text();
      const blocks = html.match(/<div class="result[^>]*>[\s\S]*?<\/div>\s*<\/div>/gi) || [];
      for (const block of blocks) {
        const hrefMatch = block.match(/uddg=([^&\"']+)/i) || block.match(/href="(https?:\/\/[^\"]+)"/i);
        if (!hrefMatch) continue;
        let foundUrl = hrefMatch[1];
        try { foundUrl = decodeURIComponent(foundUrl); } catch {}
        if (!/^https?:\/\//i.test(foundUrl) || !domainAllowed(foundUrl)) continue;
        const titleMatch = block.match(/result__a[^>]*>([\s\S]*?)<\/a>/i);
        const snippetMatch = block.match(/result__snippet[^>]*>([\s\S]*?)<\/[^>]+>/i);
        const title = decodeHtml(titleMatch?.[1] || "Resultado oficial");
        const snippet = decodeHtml(snippetMatch?.[1] || "");
        if (!results.some(x => x.url === foundUrl)) results.push({ title, url: foundUrl, snippet });
        if (results.length >= 8) break;
      }
    } catch (_) {}
    if (results.length >= 8) break;
  }

  return results.slice(0, 8);
}

export default {
  async fetch(req: Request) {
    if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
    if (req.method !== "POST") return jsonResponse({ ok: false, error: "Método no permitido." }, 405);

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) return jsonResponse({ ok: false, error: "Falta GEMINI_API_KEY en Supabase." }, 500);

    let body: any;
    try { body = await req.json(); }
    catch { return jsonResponse({ ok: false, error: "El JSON enviado no es válido." }, 400); }

    const pregunta = String(body?.pregunta || "").trim();
    const modo = String(body?.modo || "web_first").trim();
    const contexto = String(body?.contexto || "").trim();
    const webContext = String(body?.web_context || "").trim();

    if (!pregunta) return jsonResponse({ ok: false, error: "Falta la pregunta." }, 400);

    // ============================================================
    // FASE 1 — INTERNET FIRST
    // ============================================================
    if (modo === "web_first") {
      let results: Array<{ title: string; url: string; snippet: string }> = [];
      if (webContext) {
        results = [{ title: "Contexto web aportado", url: "", snippet: webContext }];
      } else {
        results = await webSearch(pregunta);
      }

      if (!results.length) {
        return jsonResponse({ ok: true, mode: "web_first", web_found: false, repository_required: true, text: "", sources: [], reason: "No se encontraron resultados oficiales suficientes en Internet." });
      }

      const contextoWeb = results.map((x, i) => `${i + 1}. ${x.title}\nURL: ${x.url}\nCONTENIDO: ${x.snippet}`).join("\n\n");
      const prompt = `${POLICE_RULES}

FASE INTERNET
La búsqueda se ha realizado previamente sobre fuentes institucionales. Analiza únicamente el contenido que aparece debajo.
Prioriza la norma oficial y el texto del organismo público sobre cualquier resumen.
No conviertas un fragmento de buscador en una certeza si no contiene base suficiente.
Si los resultados no permiten determinar con seguridad la respuesta, responde exactamente WEB_SIN_RESPUESTA.
No inventes contenido que no aparezca en los resultados.

CONSULTA ACTUAL:
${pregunta}

RESULTADOS OFICIALES:
${contextoWeb}`;

      try {
        const result = await callGemini(apiKey, prompt);
        if (!result.ok) return jsonResponse({ ok: false, mode: "web_first", web_found: false, repository_required: true, error: result.data?.error?.message || "Error consultando Gemini.", status: result.status }, 502);
        const text = cleanText(result.text);
        if (!text || text === "WEB_SIN_RESPUESTA") {
          return jsonResponse({ ok: true, mode: "web_first", web_found: false, repository_required: true, text: "", sources: results, reason: "Los resultados web no contienen información suficiente para responder con seguridad." });
        }
        return jsonResponse({ ok: true, mode: "web_first", web_found: true, repository_required: false, text, sources: results });
      } catch (error) {
        return jsonResponse({ ok: true, mode: "web_first", web_found: false, repository_required: true, text: "", sources: results, reason: error instanceof Error ? error.message : "Error consultando la fase web." });
      }
    }

    // ============================================================
    // FASE 2 — REPOSITORIO REAL
    // ============================================================
    if (modo === "repository_fallback") {
      const prompt = `${POLICE_RULES}

FASE REPOSITORIO NORMATIVO
Utiliza exclusivamente el contexto normativo que aparece debajo.
No uses conocimiento externo para completar huecos.
Ignora cualquier coincidencia que no guarde relación directa con la consulta.
Si el contexto no contiene base suficiente, dilo claramente y señala qué dato o norma debe comprobarse.
No inventes una sanción ni una actuación concreta.

CONSULTA ACTUAL:
${pregunta}

CONTEXTO NORMATIVO DEL REPOSITORIO:
${contexto || "(No se han encontrado coincidencias suficientes.)"}`;

      try {
        const result = await callGemini(apiKey, prompt);
        if (!result.ok) return jsonResponse({ ok: false, mode: "repository_fallback", web_found: false, repository_found: false, error: result.data?.error?.message || "Error consultando Gemini.", status: result.status }, 502);
        const text = cleanText(result.text);
        return jsonResponse({ ok: true, mode: "repository_fallback", web_found: false, repository_found: !!text, text: text || "No se ha encontrado información suficiente en el repositorio.", sources: [] });
      } catch (error) {
        return jsonResponse({ ok: false, mode: "repository_fallback", web_found: false, repository_found: false, error: error instanceof Error ? error.message : "Error inesperado." }, 502);
      }
    }

    return jsonResponse({ ok: false, error: "Modo no válido. Utiliza web_first o repository_fallback." }, 400);
  },
};
