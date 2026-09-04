/* ============================================================
   CENTINELA CODE — BUSCADOR EN INICIO V1
   - Busca sin abandonar la pantalla principal
   - Muestra resultados normativos directamente debajo del buscador
   - Si no hay coincidencias, ofrece "Consultar con IA"
   - Reutiliza el motor global existente y Centinela IA
   ============================================================ */
(function(){
  "use strict";

  const STYLE_ID="cc-home-search-style";
  const SHELL_ID="cc-home-search-shell";
  const RESULT_ID="cc-home-search-results";
  const HIDDEN_RESULTS_ID="cc-home-search-hidden-results";

  function esc(v){
    return String(v??"").replace(/[&<>\"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
  }

  function addStyles(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement("style");
    s.id=STYLE_ID;
    s.textContent=`
      #${SHELL_ID}{width:100%;margin:0 auto 12px;position:relative;z-index:5}
      .cc-home-search-title{display:flex;align-items:center;gap:9px;margin:0 4px 8px;color:#f5fbff;font-size:15px;font-weight:900;letter-spacing:.25px}
      .cc-home-search-title .cc-mark{display:grid;place-items:center;width:30px;height:30px;border-radius:10px;background:linear-gradient(145deg,#19bfff,#1468ff);box-shadow:0 0 18px rgba(25,191,255,.32);font-size:16px}
      .cc-home-search-box{display:flex;gap:8px;align-items:stretch;padding:8px;border:1px solid rgba(49,185,255,.55);border-radius:16px;background:linear-gradient(145deg,rgba(5,26,46,.97),rgba(2,12,25,.98));box-shadow:0 12px 28px rgba(0,0,0,.35),inset 0 0 22px rgba(0,150,255,.08)}
      .cc-home-search-box input{min-width:0;flex:1;border:1px solid rgba(108,204,255,.22)!important;border-radius:11px!important;background:rgba(0,7,16,.72)!important;color:#fff!important;padding:12px 13px!important;outline:none!important;font-size:14px!important;font-weight:600!important;box-shadow:none!important}
      .cc-home-search-box input::placeholder{color:#9eb6ca!important}
      .cc-home-search-box input:focus{border-color:#31b9ff!important;box-shadow:0 0 0 3px rgba(49,185,255,.12)!important}
      .cc-home-search-button{border:0;border-radius:11px;padding:0 16px;min-width:94px;background:linear-gradient(135deg,#18c8ff,#1767ff);color:#fff;font-weight:900;font-size:12px;cursor:pointer;box-shadow:0 7px 16px rgba(0,112,255,.28);transition:transform .16s ease,filter .16s ease}
      .cc-home-search-button:active{transform:scale(.97)}
      .cc-home-search-button:hover{filter:brightness(1.08)}
      .cc-home-search-status{display:none;margin:7px 4px 0;color:#8fb0c8;font-size:11px}
      #${RESULT_ID}{display:none;margin-top:10px;border-radius:16px;overflow:hidden;border:1px solid rgba(49,185,255,.38);background:linear-gradient(180deg,rgba(4,22,39,.98),rgba(1,9,18,.99));box-shadow:0 14px 32px rgba(0,0,0,.42)}
      .cc-home-results-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:11px 12px;border-bottom:1px solid rgba(95,183,230,.15)}
      .cc-home-results-head strong{font-size:12px;color:#f3fbff}.cc-home-results-head small{font-size:10px;color:#7ea5bd}
      .cc-home-result{padding:12px;border-bottom:1px solid rgba(95,183,230,.13)}
      .cc-home-result:last-child{border-bottom:0}
      .cc-home-result-top{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}
      .cc-home-result-source{font-size:9px;font-weight:900;color:#4ed0ff;text-transform:uppercase;letter-spacing:.35px}
      .cc-home-result-art{display:inline-block;margin-left:6px;font-size:9px;color:#ffd85b;font-weight:900}
      .cc-home-result h3{margin:5px 0 5px;font-size:14px;line-height:1.18;color:#fff}
      .cc-home-result p{margin:0;color:#c6d8e6;font-size:11px;line-height:1.42}
      .cc-home-result-badges{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px}
      .cc-home-badge{padding:4px 7px;border-radius:999px;background:rgba(39,139,201,.15);border:1px solid rgba(87,190,240,.2);color:#a9ddf8;font-size:8px;font-weight:800}
      .cc-home-badge--danger{color:#ffd76a;border-color:rgba(255,205,74,.28);background:rgba(255,192,48,.08)}
      .cc-home-detail{margin-top:9px;border:1px solid rgba(69,174,229,.25);background:rgba(13,52,78,.42);color:#dff5ff;border-radius:9px;padding:7px 10px;font-size:9px;font-weight:900;cursor:pointer}
      .cc-home-empty{padding:18px 14px;text-align:center}
      .cc-home-empty .icon{font-size:27px;margin-bottom:7px}.cc-home-empty h3{margin:0 0 5px;color:#fff;font-size:14px}.cc-home-empty p{margin:0;color:#91aabd;font-size:11px;line-height:1.45}
      .cc-home-ai-tab{margin:12px;border:1px solid rgba(98,255,123,.38);border-radius:13px;background:linear-gradient(135deg,rgba(25,96,64,.18),rgba(5,31,27,.72));overflow:hidden}
      .cc-home-ai-button{width:100%;border:0;background:transparent;color:#fff;text-align:left;padding:12px;display:flex;align-items:center;gap:10px;cursor:pointer}
      .cc-home-ai-icon{width:38px;height:38px;flex:0 0 38px;border-radius:11px;display:grid;place-items:center;background:linear-gradient(145deg,#20e8b0,#126d61);box-shadow:0 0 17px rgba(32,232,176,.25);font-size:20px}
      .cc-home-ai-button strong{display:block;font-size:12px}.cc-home-ai-button small{display:block;margin-top:3px;color:#a5c7ba;font-size:9px;line-height:1.3}
      .cc-home-ai-arrow{margin-left:auto;font-size:18px;color:#6bff9a}
      .cc-home-ai-answer{display:none;padding:0 12px 13px;color:#d8efe8;font-size:11px;line-height:1.55;white-space:pre-wrap;border-top:1px solid rgba(98,255,123,.14)}
      .cc-home-ai-answer.loading{padding-top:12px;color:#8dceb0}
      @media(max-width:430px){.cc-home-search-box{padding:7px}.cc-home-search-button{min-width:78px;padding:0 10px}.cc-home-search-box input{font-size:13px!important}}
      #${HIDDEN_RESULTS_ID}{display:none!important;position:absolute!important;left:-99999px!important;width:1px!important;height:1px!important;overflow:hidden!important}
    `;
    document.head.appendChild(s);
  }

  function findInput(){return document.getElementById("cc-global-search-input")||document.getElementById("globalSearchInput")||document.querySelector('input[placeholder*="buscar" i]');}
  function findButton(){return document.getElementById("cc-global-search-go")||document.getElementById("globalSearchGo")||document.querySelector('button[type="submit"]');}

  function ensureHiddenResults(){
    let box=document.getElementById(HIDDEN_RESULTS_ID);
    if(!box){box=document.createElement("div");box.id=HIDDEN_RESULTS_ID;box.innerHTML='<div id="consultaResults"></div>';document.body.appendChild(box);}
    if(!document.getElementById("consultaResults")){box.innerHTML='<div id="consultaResults"></div>';}
    return document.getElementById("consultaResults");
  }

  function ensureShell(input,button){
    let shell=document.getElementById(SHELL_ID);if(shell)return shell;
    addStyles();
    shell=document.createElement("section");shell.id=SHELL_ID; shell.setAttribute("aria-label","Buscador principal");
    shell.innerHTML=`
      <div class="cc-home-search-title"><span class="cc-mark">⌕</span><span>¿Qué necesitas buscar hoy?</span></div>
      <div class="cc-home-search-box" id="cc-home-search-box"></div>
      <div class="cc-home-search-status" id="cc-home-search-status">Buscando en la normativa de Centinela Code…</div>
      <div id="${RESULT_ID}" aria-live="polite"></div>
    `;
    const box=shell.querySelector("#cc-home-search-box");
    box.appendChild(input);if(button)box.appendChild(button);
    const parent=input.parentElement;
    const anchor=parent&&parent!==box?shell:null;
    const candidate=parent?.closest("section,main,.main-content,.home-section,.hero-section")||parent?.parentElement;
    if(candidate&&candidate.parentNode){candidate.parentNode.insertBefore(shell,candidate);}
    else if(document.querySelector(".main-content"))document.querySelector(".main-content").prepend(shell);
    else document.body.prepend(shell);
    return shell;
  }

  function showStatus(on,text){const el=document.getElementById("cc-home-search-status");if(!el)return;el.textContent=text||"Buscando…";el.style.display=on?"block":"none";}

  function renderLocal(){
    const hidden=document.getElementById("consultaResults");const out=document.getElementById(RESULT_ID);if(!hidden||!out)return 0;
    const cards=[...hidden.querySelectorAll(".cc-search-result")];
    if(!cards.length){
      out.innerHTML=`<div class="cc-home-empty"><div class="icon">🔎</div><h3>No he encontrado información en la base local</h3><p>La consulta no coincide con la normativa cargada en Centinela Code. Puedes preguntar a Centinela IA sin salir de esta pantalla.</p></div><div class="cc-home-ai-tab"><button class="cc-home-ai-button" id="cc-home-ai-go" type="button"><span class="cc-home-ai-icon">🤖</span><span><strong>Consultar con IA</strong><small>Analiza tu consulta usando el contexto normativo disponible.</small></span><span class="cc-home-ai-arrow">›</span></button><div class="cc-home-ai-answer" id="cc-home-ai-answer"></div></div>`;
      return 0;
    }
    const max=12;
    out.innerHTML=`<div class="cc-home-results-head"><strong>Resultados encontrados</strong><small>${cards.length} coincidencia${cards.length===1?"":"s"}</small></div>`+
      cards.slice(0,max).map((card,i)=>{
        const source=card.querySelector(".result-ley")?.textContent||"Normativa";
        const article=card.querySelector(".result-code")?.textContent||"";
        const title=card.querySelector("h3")?.textContent||"Sin título";
        const desc=card.querySelector(".result-conducta")?.textContent||"";
        const severity=card.querySelector(".severity-badge")?.textContent||"";
        const sanction=card.querySelector(".result-pill--sancion")?.textContent||"";
        return `<article class="cc-home-result"><div class="cc-home-result-top"><div><span class="cc-home-result-source">${esc(source)}</span>${article?`<span class="cc-home-result-art">${esc(article)}</span>`:""}<h3>${esc(title)}</h3></div></div><p>${esc(desc)}</p><div class="cc-home-result-badges">${severity?`<span class="cc-home-badge">${esc(severity)}</span>`:""}${sanction?`<span class="cc-home-badge cc-home-badge--danger">${esc(sanction)}</span>`:""}</div><button class="cc-home-detail" type="button" data-home-detail="${i}">Ver detalle completo</button></article>`;
      }).join("");
    out.querySelectorAll("[data-home-detail]").forEach((b,i)=>b.addEventListener("click",()=>hidden.querySelectorAll(".cc-detail")[i]?.click()));
    return cards.length;
  }

  async function perform(query){
    const q=String(query||"").trim();if(!q)return;
    const out=document.getElementById(RESULT_ID);if(!out)return;
    out.style.display="block";showStatus(true,"Buscando en la normativa de Centinela Code…");
    ensureHiddenResults();
    const input=document.getElementById("consultaSearch");
    try{
      if(input)input.value=q;
      if(window.CentinelaSearch?.search){await window.CentinelaSearch.search(q);}
      else{out.innerHTML='<div class="cc-home-empty"><div class="icon">⏳</div><h3>Preparando el buscador…</h3><p>Espera un momento y vuelve a pulsar Buscar.</p></div>';showStatus(false);return;}
      const count=renderLocal();
      showStatus(false);
      const ai=document.getElementById("cc-home-ai-go");
      if(ai)ai.addEventListener("click",()=>askAI(q),{once:true});
      if(count)out.scrollIntoView({behavior:"smooth",block:"nearest"});
      else out.scrollIntoView({behavior:"smooth",block:"nearest"});
    }catch(e){
      console.error("Centinela buscador inicio:",e);
      showStatus(false);out.innerHTML='<div class="cc-home-empty"><div class="icon">⚠️</div><h3>No se pudo completar la búsqueda</h3><p>Vuelve a intentarlo. La aplicación sigue disponible.</p></div>';
    }
  }

  async function askAI(question){
    const answer=document.getElementById("cc-home-ai-answer");if(!answer)return;
    answer.style.display="block";answer.classList.add("loading");answer.textContent="Consultando a Centinela IA…";
    try{
      if(typeof window.preguntarCentinelaIA!=="function")throw new Error("Centinela IA no está disponible en este momento.");
      const text=await window.preguntarCentinelaIA(question);
      answer.classList.remove("loading");answer.textContent=String(text||"La IA no ha devuelto una respuesta.");
    }catch(e){
      answer.classList.remove("loading");answer.textContent=`No se ha podido consultar la IA. ${e?.message||"Inténtalo de nuevo."}`;
    }
  }

  function install(){
    if(document.getElementById(SHELL_ID))return;
    const input=findInput();const originalButton=findButton();
    if(!input)return;
    ensureHiddenResults();
    const button=document.createElement("button");button.type="button";button.className="cc-home-search-button";button.id="cc-home-search-button";button.textContent="Buscar";
    const shell=ensureShell(input,button);if(!shell)return;
    const oldParent=originalButton?.parentElement;
    if(originalButton&&originalButton!==button&&oldParent){originalButton.remove();}
    const execute=e=>{e.preventDefault();e.stopImmediatePropagation();perform(input.value);};
    button.addEventListener("click",execute,true);
    input.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();e.stopImmediatePropagation();perform(input.value);}},true);
    input.addEventListener("input",()=>{const out=document.getElementById(RESULT_ID);if(!input.value.trim()&&out){out.style.display="none";out.innerHTML="";}});
    const status=document.getElementById("cc-home-search-status");if(status)status.style.display="none";
  }

  function boot(){
    addStyles();
    install();
    if(!document.getElementById(SHELL_ID))setTimeout(install,500);
    if(!document.getElementById(SHELL_ID))setTimeout(install,1500);
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();
