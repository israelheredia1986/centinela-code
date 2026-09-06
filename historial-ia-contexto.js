/* ============================================================
   CENTINELA CODE — MEMORIA OPERATIVA DE CENTINELA IA
   V1 — Recupera contexto de la conversación actual antes de consultar IA.
   Mantiene el historial local y evita enviar conversaciones completas.
   ============================================================ */
(function () {
  "use strict";

  const STORAGE_KEY = "centinela-ia-historial-v1";
  const MAX_CONTEXT_MESSAGES = 10;
  const MAX_CONTEXT_CHARS = 9000;
  let installed = false;
  let originalAsk = null;

  function clean(value, max = MAX_CONTEXT_CHARS) {
    return String(value == null ? "" : value)
      .replace(/\u0000/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, max);
  }

  function readHistory() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const data = raw ? JSON.parse(raw) : [];
      return Array.isArray(data) ? data : [];
    } catch (_) {
      return [];
    }
  }

  function currentConversation() {
    let currentId = null;
    try { currentId = localStorage.getItem("centinela-ia-conversacion-actual-v1"); } catch (_) {}
    if (!currentId) return null;
    return readHistory().find(item => item && item.id === currentId) || null;
  }

  function buildMemory() {
    const conversation = currentConversation();
    const messages = Array.isArray(conversation?.messages) ? conversation.messages : [];
    if (!messages.length) return "";

    const recent = messages.slice(-MAX_CONTEXT_MESSAGES);
    const parts = recent.map(message => {
      const role = message?.role === "assistant" ? "CENTINELA IA" : "AGENTE";
      const content = clean(message?.content || "", 1800);
      return content ? `${role}: ${content}` : "";
    }).filter(Boolean);

    const memory = parts.join("\n");
    return memory.slice(-MAX_CONTEXT_CHARS);
  }

  function enrichQuestion(question) {
    const current = clean(question, 7000);
    const memory = buildMemory();
    if (!memory) return current;

    return [
      "CONTEXTO DE LA CONVERSACIÓN ACTUAL:",
      memory,
      "",
      "NUEVA CONSULTA DEL AGENTE:",
      current,
      "",
      "INSTRUCCIÓN: utiliza el contexto anterior solo cuando sea relevante para la nueva consulta. No inventes hechos ni mantengas conclusiones que contradigan los nuevos datos."
    ].join("\n");
  }

  function resumeUI(conversation) {
    try {
      if (!conversation) return;
      window.__centinelaIAConversacionRecuperada = conversation;
      window.dispatchEvent(new CustomEvent("centinela:ia-context-restored", { detail: conversation }));
    } catch (_) {}
  }

  function install() {
    if (installed) return true;
    const ask = window.preguntarCentinelaIA;
    if (typeof ask !== "function") return false;

    originalAsk = ask;
    window.preguntarCentinelaIA = async function (question, onProgress) {
      const enriched = enrichQuestion(question);
      return originalAsk.call(this, enriched, onProgress);
    };

    const current = currentConversation();
    if (current) resumeUI(current);
    installed = true;
    window.CentinelaIAMemoria = {
      activo: true,
      obtenerContexto: buildMemory,
      obtenerConversacionActual: currentConversation,
      limpiarContexto: function () {
        window.__centinelaIAConversacionRecuperada = null;
      }
    };
    console.info("Centinela IA — memoria conversacional V1 activa");
    return true;
  }

  window.addEventListener("centinela:ia-history-resume", function (event) {
    resumeUI(event?.detail || null);
  });

  let tries = 0;
  const timer = setInterval(() => {
    if (install() || ++tries > 40) clearInterval(timer);
  }, 250);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => install(), { once: true });
  } else {
    install();
  }
})();
