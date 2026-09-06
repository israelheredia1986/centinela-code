/* ============================================================
   CENTINELA CODE — HISTORIAL / MEMORIA LOCAL DE CENTINELA IA
   V1 — Persistencia local, conversaciones, búsqueda y borrado.
   No sustituye el motor IA: envuelve la función existente.
   ============================================================ */
(function () {
  "use strict";

  const STORAGE_KEY = "centinela-ia-historial-v1";
  const CURRENT_KEY = "centinela-ia-conversacion-actual-v1";
  const MAX_CONVERSATIONS = 60;
  const MAX_MESSAGES = 80;
  const MAX_MESSAGE_CHARS = 8000;
  const SESSION_GAP_MS = 30 * 60 * 1000;

  let instalado = false;
  let originalAsk = null;
  let currentId = null;

  function ahora() { return new Date().toISOString(); }
  function uid() { return `ia-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`; }
  function clean(value, max = MAX_MESSAGE_CHARS) {
    return String(value == null ? "" : value).replace(/\u0000/g, "").trim().slice(0, max);
  }
  function textoRespuesta(value) {
    if (typeof value === "string") return value;
    try { return JSON.stringify(value); } catch (_) { return String(value ?? ""); }
  }
  function leer() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const data = raw ? JSON.parse(raw) : [];
      return Array.isArray(data) ? data.filter(Boolean) : [];
    } catch (_) {
      return [];
    }
  }
  function guardar(data) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data.slice(0, MAX_CONVERSATIONS))); }
    catch (error) { console.warn("Centinela IA — no se pudo guardar historial", error); }
  }
  function getConversation(id) { return leer().find(item => item.id === id) || null; }
  function saveCurrentId() {
    try {
      if (currentId) localStorage.setItem(CURRENT_KEY, currentId);
      else localStorage.removeItem(CURRENT_KEY);
    } catch (_) {}
  }
  function loadCurrentId() {
    try { return localStorage.getItem(CURRENT_KEY) || null; } catch (_) { return null; }
  }

  function startConversation(title) {
    const data = leer();
    const conversation = {
      id: uid(),
      title: clean(title || "Nueva consulta", 90),
      created_at: ahora(),
      updated_at: ahora(),
      messages: []
    };
    data.unshift(conversation);
    while (data.length > MAX_CONVERSATIONS) data.pop();
    guardar(data);
    currentId = conversation.id;
    saveCurrentId();
    return conversation;
  }

  function ensureConversation(question) {
    const requested = currentId || loadCurrentId();
    if (requested) {
      const existing = getConversation(requested);
      if (existing && Date.now() - new Date(existing.updated_at || existing.created_at).getTime() < SESSION_GAP_MS) {
        currentId = requested;
        return existing;
      }
    }
    return startConversation(question || "Nueva consulta");
  }

  function addMessage(question, answer) {
    const data = leer();
    let id = currentId || loadCurrentId();
    let conversation = data.find(item => item.id === id);
    if (!conversation || Date.now() - new Date(conversation.updated_at || conversation.created_at).getTime() >= SESSION_GAP_MS) {
      conversation = {
        id: uid(),
        title: clean(question || "Nueva consulta", 90),
        created_at: ahora(),
        updated_at: ahora(),
        messages: []
      };
      data.unshift(conversation);
      id = conversation.id;
      currentId = id;
      saveCurrentId();
    }

    conversation.messages = Array.isArray(conversation.messages) ? conversation.messages : [];
    conversation.messages.push({
      role: "user",
      content: clean(question),
      at: ahora()
    });
    conversation.messages.push({
      role: "assistant",
      content: clean(textoRespuesta(answer)),
      at: ahora()
    });
    if (conversation.messages.length > MAX_MESSAGES) {
      conversation.messages = conversation.messages.slice(-MAX_MESSAGES);
    }
    conversation.updated_at = ahora();
    if ((!conversation.title || conversation.title === "Nueva consulta") && question) {
      conversation.title = clean(question, 90);
    }

    const index = data.findIndex(item => item.id === conversation.id);
    if (index > 0) data.splice(index, 1), data.unshift(conversation);
    guardar(data);
    renderHistory();
    return conversation;
  }

  function relativeDate(value) {
    try {
      const d = new Date(value);
      return d.toLocaleString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch (_) { return ""; }
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]));
  }

  function latestPreview(conversation) {
    const messages = Array.isArray(conversation.messages) ? conversation.messages : [];
    const last = [...messages].reverse().find(m => m.role === "assistant") || messages[messages.length - 1];
    return clean(last?.content || "Sin mensajes", 180).replace(/\s+/g, " ");
  }

  function emitConversationChanged() {
    try { window.dispatchEvent(new CustomEvent("centinela:ia-history-changed")); } catch (_) {}
  }

  function closeModal() {
    const modal = document.getElementById("centinelaIAHistoryModal");
    if (modal) modal.classList.remove("is-open");
  }

  function openModal() {
    const modal = document.getElementById("centinelaIAHistoryModal");
    if (!modal) return;
    renderHistory();
    modal.classList.add("is-open");
  }

  function newConversation() {
    currentId = null;
    saveCurrentId();
    startConversation("Nueva conversación");
    closeModal();
    emitConversationChanged();
    showToast("Nueva conversación iniciada");
  }

  function deleteConversation(id) {
    const data = leer().filter(item => item.id !== id);
    guardar(data);
    if (currentId === id) {
      currentId = null;
      saveCurrentId();
    }
    renderHistory();
    emitConversationChanged();
    showToast("Conversación eliminada");
  }

  function clearAll() {
    if (!confirm("¿Borrar todo el historial de Centinela IA en este dispositivo?")) return;
    try { localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(CURRENT_KEY); } catch (_) {}
    currentId = null;
    renderHistory();
    emitConversationChanged();
    showToast("Historial borrado");
  }

  function resumeConversation(id) {
    const conversation = getConversation(id);
    if (!conversation) return;
    currentId = conversation.id;
    saveCurrentId();
    closeModal();

    const section = document.querySelector('[data-section="ia"]');
    if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });

    try {
      window.dispatchEvent(new CustomEvent("centinela:ia-history-resume", { detail: conversation }));
    } catch (_) {}
    showToast("Conversación recuperada");
  }

  function renderHistory(filter = "") {
    const list = document.getElementById("centinelaIAHistoryList");
    if (!list) return;
    const query = clean(filter).toLowerCase();
    const data = leer();
    const filtered = query
      ? data.filter(item => `${item.title} ${latestPreview(item)}`.toLowerCase().includes(query))
      : data;

    if (!filtered.length) {
      list.innerHTML = `<div class="cc-ia-history-empty"><div class="cc-ia-history-empty-icon">🕘</div><strong>No hay conversaciones guardadas</strong><span>Las consultas que hagas a Centinela IA aparecerán aquí automáticamente.</span></div>`;
      return;
    }

    list.innerHTML = filtered.map(item => `
      <article class="cc-ia-history-item" data-history-id="${escapeHtml(item.id)}">
        <button type="button" class="cc-ia-history-open" data-history-open="${escapeHtml(item.id)}">
          <span class="cc-ia-history-icon">💬</span>
          <span class="cc-ia-history-main"><strong>${escapeHtml(item.title || "Consulta")}</strong><small>${escapeHtml(relativeDate(item.updated_at || item.created_at))}</small><em>${escapeHtml(latestPreview(item))}</em></span>
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
    `;
    document.head.appendChild(style);
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
      const anchor = iaSection.querySelector("h1,h2,h3,.section-heading,.ia-header,.ia-panel") || iaSection.firstElementChild;
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
          <div><h3 id="ccIAHistoryTitle">Historial de Centinela IA</h3><p>Conversaciones guardadas únicamente en este dispositivo</p></div>
          <span class="cc-ia-history-spacer"></span>
          <button type="button" class="cc-ia-history-close" id="ccCloseIAHistory" aria-label="Cerrar">×</button>
        </div>
        <div class="cc-ia-history-controls">
          <input id="ccIAHistorySearch" class="cc-ia-history-search" type="search" placeholder="Buscar en el historial…" autocomplete="off" />
          <button type="button" class="cc-ia-history-clear" id="ccClearIAHistory">Borrar todo</button>
        </div>
        <div id="centinelaIAHistoryList" class="cc-ia-history-list"></div>
      </div>`;
    document.body.appendChild(modal);

    document.getElementById("ccOpenIAHistory")?.addEventListener("click", openModal);
    document.getElementById("ccNewIAConversation")?.addEventListener("click", newConversation);
    document.getElementById("ccCloseIAHistory")?.addEventListener("click", closeModal);
    document.getElementById("ccClearIAHistory")?.addEventListener("click", clearAll);
    document.getElementById("ccIAHistorySearch")?.addEventListener("input", event => renderHistory(event.target.value));
    modal.addEventListener("click", event => { if (event.target === modal) closeModal(); });
    document.addEventListener("keydown", event => { if (event.key === "Escape") closeModal(); });
    document.getElementById("centinelaIAHistoryList")?.addEventListener("click", event => {
      const open = event.target.closest("[data-history-open]");
      const del = event.target.closest("[data-history-delete]");
      if (open) resumeConversation(open.dataset.historyOpen);
      else if (del) deleteConversation(del.dataset.historyDelete);
    });
    renderHistory();
  }

  function installWrapper() {
    if (instalado) return true;
    if (typeof window.preguntarCentinelaIA !== "function") return false;
    originalAsk = window.preguntarCentinelaIA;
    window.preguntarCentinelaIA = async function (question, onProgress) {
      const q = clean(question);
      if (!q) return originalAsk.call(this, question, onProgress);
      let answer;
      try {
        answer = await originalAsk.call(this, question, onProgress);
      } catch (error) {
        answer = `Error al consultar Centinela IA: ${error?.message || error}`;
        throw error;
      } finally {
        if (answer !== undefined) addMessage(q, answer);
      }
      return answer;
    };
    window.CentinelaIAHistorial = {
      version: "1.0.0",
      listar: leer,
      abrir: resumeConversation,
      nueva: newConversation,
      borrar: deleteConversation,
      borrarTodo: clearAll,
      actual: () => currentId || loadCurrentId()
    };
    instalado = true;
    return true;
  }

  function boot() {
    buildUI();
    if (!installWrapper()) {
      setTimeout(() => { installWrapper(); buildUI(); }, 250);
      setTimeout(() => { installWrapper(); buildUI(); }, 1000);
      setTimeout(() => { installWrapper(); buildUI(); }, 2500);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }

  window.addEventListener("centinela:ia-history-changed", renderHistory);
  console.info("Centinela IA — historial local V1 activo");
})();
