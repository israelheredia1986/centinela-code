/* ============================================================
   CENTINELA CODE — HISTORIAL / MEMORIA LOCAL DE CENTINELA IA
   V2 — Historial persistente, reconstrucción visual y reanudación.
   No sustituye el motor IA: envuelve la función existente.
   ============================================================ */
(function () {
  "use strict";

  const STORAGE_KEY = "centinela-ia-historial-v1";
  const CURRENT_KEY = "centinela-ia-conversacion-actual-v1";
  const MAX_CONVERSATIONS = 60;
  const MAX_MESSAGES = 80;
  const MAX_MESSAGE_CHARS = 8000;

  let installed = false;
  let originalAsk = null;
  let currentId = null;

  function now() {
    return new Date().toISOString();
  }

  function uid() {
    return `ia-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  function clean(value, max = MAX_MESSAGE_CHARS) {
    return String(value == null ? "" : value)
      .replace(/\u0000/g, "")
      .trim()
      .slice(0, max);
  }

  function answerText(value) {
    if (typeof value === "string") return value;
    try { return JSON.stringify(value); } catch (_) { return String(value ?? ""); }
  }

  function read() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const data = raw ? JSON.parse(raw) : [];
      return Array.isArray(data) ? data.filter(Boolean) : [];
    } catch (_) {
      return [];
    }
  }

  function write(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data.slice(0, MAX_CONVERSATIONS)));
    } catch (error) {
      console.warn("Centinela IA — no se pudo guardar historial", error);
    }
  }

  function getConversation(id) {
    return read().find(item => item.id === id) || null;
  }

  function setCurrentId(id) {
    currentId = id || null;
    try {
      if (currentId) localStorage.setItem(CURRENT_KEY, currentId);
      else localStorage.removeItem(CURRENT_KEY);
    } catch (_) {}
  }

  function getCurrentId() {
    if (currentId) return currentId;
    try { return localStorage.getItem(CURRENT_KEY) || null; } catch (_) { return null; }
  }

  function startConversation(title = "Nueva conversación") {
    const data = read();
    const conversation = {
      id: uid(),
      title: clean(title || "Nueva conversación", 90),
      created_at: now(),
      updated_at: now(),
      messages: []
    };
    data.unshift(conversation);
    write(data);
    setCurrentId(conversation.id);
    return conversation;
  }

  function ensureConversation(question) {
    const id = getCurrentId();
    if (id) {
      const current = getConversation(id);
      if (current) return current;
    }
    return startConversation(question || "Nueva consulta");
  }

  function addMessage(question, answer) {
    const data = read();
    const id = getCurrentId();
    let conversation = id ? data.find(item => item.id === id) : null;

    if (!conversation) {
      conversation = {
        id: uid(),
        title: clean(question || "Nueva consulta", 90),
        created_at: now(),
        updated_at: now(),
        messages: []
      };
      data.unshift(conversation);
      setCurrentId(conversation.id);
    }

    conversation.messages = Array.isArray(conversation.messages) ? conversation.messages : [];
    conversation.messages.push({ role: "user", content: clean(question), at: now() });
    conversation.messages.push({ role: "assistant", content: clean(answerText(answer)), at: now() });

    if (conversation.messages.length > MAX_MESSAGES) {
      conversation.messages = conversation.messages.slice(-MAX_MESSAGES);
    }

    if (!conversation.title || conversation.title === "Nueva conversación" || conversation.title === "Nueva consulta") {
      conversation.title = clean(question || conversation.title, 90);
    }
    conversation.updated_at = now();

    const index = data.findIndex(item => item.id === conversation.id);
    if (index > 0) data.splice(index, 1), data.unshift(conversation);
    write(data);
    renderHistory();
    emit("centinela:ia-history-changed", conversation);
    return conversation;
  }

  function emit(name, detail) {
    try { window.dispatchEvent(new CustomEvent(name, { detail })); } catch (_) {}
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>\"']/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
    }[char]));
  }

  function dateText(value) {
    try {
      return new Date(value).toLocaleString("es-ES", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit"
      });
    } catch (_) { return ""; }
  }

  function preview(conversation) {
    const messages = Array.isArray(conversation?.messages) ? conversation.messages : [];
    const last = [...messages].reverse().find(item => item?.role === "assistant") || messages[messages.length - 1];
    return clean(last?.content || "Sin mensajes", 180).replace(/\s+/g, " ");
  }

  function showToast(message) {
    const toast = document.getElementById("toast");
    const node = document.getElementById("toastMessage");
    if (toast && node) {
      node.textContent = message;
      toast.classList.add("show");
      clearTimeout(showToast._timer);
      showToast._timer = setTimeout(() => toast.classList.remove("show"), 1800);
      return;
    }
    console.info("Centinela IA:", message);
  }

  function renderHistory(filter = "") {
    const list = document.getElementById("centinelaIAHistoryList");
    if (!list) return;

    const query = clean(filter).toLowerCase();
    const data = read();
    const filtered = query
      ? data.filter(item => `${item.title || ""} ${preview(item)}`.toLowerCase().includes(query))
      : data;

    if (!filtered.length) {
      list.innerHTML = `<div class="cc-ia-history-empty"><div class="cc-ia-history-empty-icon">🕘</div><strong>No hay conversaciones guardadas</strong><span>Las consultas que hagas a Centinela IA aparecerán aquí automáticamente.</span></div>`;
      return;
    }

    list.innerHTML = filtered.map(item => `
      <article class="cc-ia-history-item" data-history-id="${escapeHtml(item.id)}">
        <button type="button" class="cc-ia-history-open" data-history-open="${escapeHtml(item.id)}">
          <span class="cc-ia-history-icon">💬</span>
          <span class="cc-ia-history-main">
            <strong>${escapeHtml(item.title || "Consulta")}</strong>
            <small>${escapeHtml(dateText(item.updated_at || item.created_at))}</small>
            <em>${escapeHtml(preview(item))}</em>
          </span>
        </button>
        <button type="button" class="cc-ia-history-delete" title="Eliminar conversación" aria-label="Eliminar conversación" data-history-delete="${escapeHtml(item.id)}">🗑️</button>
      </article>`).join("");
  }

  function injectStyles() {
    if (document.getElementById("centinelaIAHistoryStyles")) return;
    const style = document.createElement("style");
    style.id = "centinelaIAHistoryStyles";
    style.textContent = `
      .cc-ia-history-toolbar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:10px 0 12px}
      .cc-ia-history-btn,.cc-ia-history-new{appearance:none;border:1px solid #1b78ac;background:linear-gradient(180deg,#0b2943,#061827);color:#dff4ff;border-radius:11px;padding:9px 12px;font:800 12px/1.1 system-ui,sans-serif;cursor:pointer;box-shadow:inset 0 0 14px rgba(0,150,255,.08)}
      .cc-ia-history-btn:hover,.cc-ia-history-new:hover{border-color:#35b9ff;box-shadow:0 0 16px rgba(0,175,255,.18)}
      .cc-ia-history-new{color:#8dffb1;border-color:#1b8652}
      .cc-ia-history-modal{display:none;position:fixed;inset:0;z-index:10050;background:rgba(0,6,15,.76);backdrop-filter:blur(8px);align-items:center;justify-content:center;padding:14px}
      .cc-ia-history-modal.is-open{display:flex}
      .cc-ia-history-dialog{width:min(720px,100%);max-height:min(86vh,780px);overflow:hidden;border:1px solid #1b6b99;border-radius:20px;background:linear-gradient(180deg,#061a2d,#020c17);box-shadow:0 25px 80px rgba(0,0,0,.72),inset 0 0 35px rgba(0,125,255,.08)}
      .cc-ia-history-header{display:flex;align-items:center;gap:10px;padding:15px 16px;border-bottom:1px solid rgba(46,167,226,.2)}
      .cc-ia-history-header h3{margin:0;font:900 18px/1.1 system-ui,sans-serif;color:#fff}
      .cc-ia-history-header p{margin:3px 0 0;font:500 10px/1.2 system-ui,sans-serif;color:#94b7ca}
      .cc-ia-history-spacer{flex:1}
      .cc-ia-history-close{border:0;background:transparent;color:#b7d6e6;font-size:24px;cursor:pointer}
      .cc-ia-history-controls{display:flex;gap:8px;padding:11px 13px;border-bottom:1px solid rgba(46,167,226,.14)}
      .cc-ia-history-search{flex:1;min-width:0;border:1px solid #24516c;border-radius:10px;background:#031321;color:#eaf7ff;padding:10px 11px;outline:none}
      .cc-ia-history-clear{border:1px solid #6f3240;background:#241019;color:#ffafbc;border-radius:10px;padding:0 11px;font-weight:800;cursor:pointer}
      .cc-ia-history-list{padding:11px;overflow:auto;max-height:60vh}
      .cc-ia-history-item{display:flex;gap:7px;align-items:stretch;margin-bottom:8px;border:1px solid rgba(39,128,172,.32);border-radius:13px;background:rgba(3,20,34,.85)}
      .cc-ia-history-open{display:flex;gap:10px;align-items:center;flex:1;min-width:0;border:0;background:transparent;color:inherit;text-align:left;padding:11px;cursor:pointer}
      .cc-ia-history-icon{font-size:20px;flex:0 0 auto}
      .cc-ia-history-main{display:flex;flex-direction:column;gap:3px;min-width:0}
      .cc-ia-history-main strong{color:#ecf9ff;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .cc-ia-history-main small{color:#79a7bf;font-size:9px}
      .cc-ia-history-main em{font-style:normal;color:#b9ced9;font-size:10px;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
      .cc-ia-history-delete{border:0;background:transparent;color:#ff7183;padding:0 11px;cursor:pointer;font-size:16px}
      .cc-ia-history-empty{padding:34px 16px;text-align:center;display:flex;flex-direction:column;gap:7px;color:#9fc1d3}
      .cc-ia-history-empty-icon{font-size:38px}
      .cc-ia-history-empty strong{color:#edf9ff;font-size:14px}
      .cc-ia-history-empty span{font-size:11px;line-height:1.4}
      @media(max-width:520px){.cc-ia-history-modal{padding:8px}.cc-ia-history-dialog{border-radius:16px}.cc-ia-history-controls{flex-wrap:wrap}.cc-ia-history-search{flex-basis:100%}.cc-ia-history-clear{padding:9px 11px}}

      .cc-ia-restored-banner{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:0 0 10px;padding:8px 10px;border:1px solid #176c96;border-radius:10px;background:linear-gradient(180deg,rgba(7,38,61,.95),rgba(3,20,34,.95));color:#bfeaff;font:700 10px/1.3 system-ui,sans-serif}
      .cc-ia-restored-banner button{border:1px solid #337998;border-radius:8px;background:transparent;color:#dff6ff;padding:5px 8px;font-weight:800;cursor:pointer}
    `;
    document.head.appendChild(style);
  }

  function closeModal() {
    document.getElementById("centinelaIAHistoryModal")?.classList.remove("is-open");
  }

  function openModal() {
    const modal = document.getElementById("centinelaIAHistoryModal");
    if (!modal) return;
    renderHistory();
    modal.classList.add("is-open");
  }

  function clearChat() {
    const messages = document.getElementById("chatMessages");
    if (!messages) return;
    messages.innerHTML = `<div class="chat-bubble ai" style="background:#334155;padding:12px;border-radius:8px;color:#f8fafc;max-width:85%;font-size:.95rem;">🤖 <strong>Centinela AI:</strong> Saludos, Agente. Indícame los hechos o la duda normativa y te ayudaré a calificar la infracción o redactar la diligencia.</div>`;
  }

  function appendBubble(role, content) {
    const messages = document.getElementById("chatMessages");
    if (!messages) return;

    const bubble = document.createElement("div");
    bubble.className = `chat-bubble ${role === "assistant" ? "ai" : "user"}`;
    bubble.style.cssText = role === "assistant"
      ? "background:#334155;padding:12px;border-radius:8px;color:#f8fafc;max-width:85%;font-size:.95rem;white-space:pre-wrap;"
      : "background:#0f4c75;padding:12px;border-radius:8px;color:#f8fafc;max-width:85%;font-size:.95rem;white-space:pre-wrap;align-self:flex-end;";

    if (role === "assistant") {
      const strong = document.createElement("strong");
      strong.textContent = "Centinela AI: ";
      bubble.appendChild(strong);
      bubble.appendChild(document.createTextNode(content));
    } else {
      bubble.textContent = content;
    }

    messages.appendChild(bubble);
  }

  function scrollChat() {
    const messages = document.getElementById("chatMessages");
    if (messages) messages.scrollTop = messages.scrollHeight;
  }

  function renderConversation(conversation, showBanner = true) {
    if (!conversation) return;
    const messages = document.getElementById("chatMessages");
    if (!messages) return;

    const oldBanner = document.getElementById("ccIAConversationBanner");
    oldBanner?.remove();
    clearChat();

    const stored = Array.isArray(conversation.messages) ? conversation.messages : [];
    stored.forEach(message => {
      if (!message || !message.content) return;
      appendBubble(message.role === "assistant" ? "assistant" : "user", message.content);
    });

    if (showBanner) {
      const banner = document.createElement("div");
      banner.id = "ccIAConversationBanner";
      banner.className = "cc-ia-restored-banner";
      banner.innerHTML = `<span>↩ Conversación recuperada: <strong>${escapeHtml(conversation.title || "Consulta")}</strong></span><button type="button" id="ccCloseRestoredBanner">Cerrar</button>`;
      messages.parentNode?.insertBefore(banner, messages);
      document.getElementById("ccCloseRestoredBanner")?.addEventListener("click", () => banner.remove());
    }

    scrollChat();
  }

  function resumeConversation(id) {
    const conversation = getConversation(id);
    if (!conversation) return;
    setCurrentId(conversation.id);
    closeModal();

    const iaSection = document.querySelector('[data-section="ia"]');
    if (iaSection) iaSection.scrollIntoView({ behavior: "smooth", block: "start" });

    renderConversation(conversation, true);
    emit("centinela:ia-history-resume", conversation);
    showToast("Conversación recuperada");
  }

  function newConversation() {
    setCurrentId(null);
    const conversation = startConversation("Nueva conversación");
    closeModal();
    clearChat();
    emit("centinela:ia-history-new", conversation);
    showToast("Nueva conversación iniciada");
  }

  function deleteConversation(id) {
    write(read().filter(item => item.id !== id));
    if (getCurrentId() === id) setCurrentId(null);
    renderHistory();
    emit("centinela:ia-history-changed");
    showToast("Conversación eliminada");
  }

  function clearAll() {
    if (!confirm("¿Borrar todo el historial de Centinela IA en este dispositivo?")) return;
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(CURRENT_KEY);
    } catch (_) {}
    setCurrentId(null);
    renderHistory();
    clearChat();
    emit("centinela:ia-history-changed");
    showToast("Historial borrado");
  }

  function handleHistoryClick(event) {
    const open = event.target.closest?.("[data-history-open]");
    if (open) {
      event.preventDefault();
      resumeConversation(open.dataset.historyOpen);
      return;
    }

    const del = event.target.closest?.("[data-history-delete]");
    if (del) {
      event.preventDefault();
      event.stopPropagation();
      deleteConversation(del.dataset.historyDelete);
    }
  }

  function buildUI() {
    if (document.getElementById("centinelaIAHistoryModal")) return;
    injectStyles();

    const toolbar = document.createElement("div");
    toolbar.className = "cc-ia-history-toolbar";
    toolbar.innerHTML = `
      <button type="button" class="cc-ia-history-btn" id="ccOpenIAHistory">🕘 Historial IA</button>
      <button type="button" class="cc-ia-history-new" id="ccNewIAConversation">＋ Nueva conversación</button>`;

    const iaSection = document.querySelector('[data-section="ia"]');
    if (iaSection) {
      const anchor = iaSection.querySelector(".page-title,.section-heading,h1,h2,h3,.ia-header,.ia-panel") || iaSection.firstElementChild;
      if (anchor?.parentNode) anchor.parentNode.insertBefore(toolbar, anchor.nextSibling);
      else iaSection.prepend(toolbar);
    } else {
      document.body.appendChild(toolbar);
      toolbar.style.position = "fixed";
      toolbar.style.right = "12px";
      toolbar.style.bottom = "92px";
      toolbar.style.zIndex = "1000";
    }

    const modal = document.createElement("div");
    modal.id = "centinelaIAHistoryModal";
    modal.className = "cc-ia-history-modal";
    modal.innerHTML = `
      <div class="cc-ia-history-dialog" role="dialog" aria-modal="true" aria-labelledby="ccIAHistoryTitle">
        <div class="cc-ia-history-header">
          <div><h3 id="ccIAHistoryTitle">Historial de Centinela IA</h3><p>Conversaciones guardadas en este dispositivo</p></div>
          <div class="cc-ia-history-spacer"></div>
          <button type="button" class="cc-ia-history-close" id="ccCloseIAHistory" aria-label="Cerrar">×</button>
        </div>
        <div class="cc-ia-history-controls">
          <input id="ccIAHistorySearch" class="cc-ia-history-search" type="search" placeholder="Buscar en el historial…" autocomplete="off" />
          <button type="button" id="ccIAHistoryClear" class="cc-ia-history-clear">Borrar todo</button>
        </div>
        <div id="centinelaIAHistoryList" class="cc-ia-history-list"></div>
      </div>`;
    document.body.appendChild(modal);

    document.getElementById("ccOpenIAHistory")?.addEventListener("click", openModal);
    document.getElementById("ccNewIAConversation")?.addEventListener("click", newConversation);
    document.getElementById("ccCloseIAHistory")?.addEventListener("click", closeModal);
    document.getElementById("ccIAHistoryClear")?.addEventListener("click", clearAll);
    document.getElementById("ccIAHistorySearch")?.addEventListener("input", e => renderHistory(e.target.value));

    modal.addEventListener("click", event => {
      if (event.target === modal) closeModal();
      handleHistoryClick(event);
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape") closeModal();
    });

    renderHistory();
  }

  function installWrapper() {
    if (installed) return true;
    const ask = window.preguntarCentinelaIA;
    if (typeof ask !== "function") return false;

    originalAsk = ask;
    window.preguntarCentinelaIA = async function (question, onProgress) {
      const q = clean(question);
      if (!q) return "Escribe una consulta para Centinela IA.";

      const existing = ensureConversation(q);
      setCurrentId(existing.id);
      const answer = await originalAsk.call(this, q, onProgress);
      addMessage(q, answer);
      return answer;
    };

    installed = true;
    window.CentinelaIAHistorial = {
      activo: true,
      listar: read,
      actual: () => getConversation(getCurrentId()),
      nueva: newConversation,
      recuperar: resumeConversation,
      borrar: deleteConversation,
      borrarTodo: clearAll,
      render: renderConversation
    };

    const current = getConversation(getCurrentId());
    if (current && current.messages?.length) {
      setTimeout(() => renderConversation(current, false), 0);
    }

    console.info("Centinela IA — historial V2 activo");
    return true;
  }

  function boot() {
    buildUI();
    installWrapper();
  }

  let tries = 0;
  const timer = setInterval(() => {
    tries += 1;
    buildUI();
    if (installWrapper() || tries >= 80) clearInterval(timer);
  }, 250);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }

  window.addEventListener("centinela:ia-history-resume", event => {
    if (event?.detail) renderConversation(event.detail, true);
  });
})();
