/* ============================================================
   CENTINELA CODE — ACCESO DIRECTO DESDE INICIO
   V4 — abre CONSULTA directamente y ejecuta la búsqueda sin depender
   de hacer click en la navegación.
   ============================================================ */
(function(){
  "use strict";

  function estilos(){
    if(document.getElementById("centinela-home-search-style")) return;
    const style=document.createElement("style");
    style.id="centinela-home-search-style";
    style.textContent=`
      #centinela-home-search{position:relative;width:100%;box-sizing:border-box;margin:10px 0 12px;padding:15px 16px 16px;display:flex;align-items:center;gap:18px;border:1px solid rgba(49,185,255,.48);border-radius:20px;background:linear-gradient(145deg,rgba(3,20,38,.98),rgba(4,39,65,.94) 55%,rgba(2,11,22,.99));box-shadow:0 12px 28px rgba(0,0,0,.48),inset 0 0 28px rgba(0,160,255,.10);overflow:hidden}
      #centinela-home-search:before{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(115deg,transparent 0 42%,rgba(49,185,255,.09) 42.2% 42.5%,transparent 43% 100%)}
      .home-search-icon{position:relative;z-index:1;flex:0 0 82px;width:82px;height:82px;display:grid;place-items:center;border:1px solid rgba(49,185,255,.52);border-radius:22px;background:linear-gradient(145deg,#092e4b,#041624);box-shadow:0 0 22px rgba(49,185,255,.20),inset 0 0 20px rgba(49,185,255,.10);color:#31b9ff}
      .home-search-icon span{font-family:Arial,sans-serif;font-size:70px;line-height:.7;font-weight:700;transform:rotate(-15deg);text-shadow:0 0 13px currentColor}
      .home-search-content{position:relative;z-index:1;min-width:0;flex:1}
      .home-search-kicker{font-size:8px;font-weight:900;letter-spacing:2px;color:#31b9ff;margin-bottom:3px}
      .home-search-content h2{margin:0;color:#fff;font-size:18px;line-height:1.1;letter-spacing:.2px}
      .home-search-content p{margin:4px 0 9px;color:#a9c5d9;font-size:10px;line-height:1.25}
      .home-search-input-wrap{height:42px;display:flex;align-items:center;gap:8px;padding:0 7px 0 12px;border:1px solid #2b6f99;border-radius:12px;background:rgba(1,9,18,.88);box-shadow:inset 0 0 12px rgba(0,120,255,.08)}
      .home-search-input-wrap:focus-within{border-color:#31b9ff;box-shadow:0 0 0 2px rgba(49,185,255,.12),inset 0 0 15px rgba(0,120,255,.10)}
      .home-search-input-icon{font-family:Arial,sans-serif;font-size:27px;line-height:1;color:#31b9ff;transform:rotate(-15deg);text-shadow:0 0 8px currentColor}
      #homeQuickSearch{width:100%;min-width:0;border:0!important;outline:0!important;background:transparent!important;color:#fff!important;font-size:12px!important;padding:0!important}
      #homeQuickSearch::placeholder{color:#718da4;opacity:1}
      #homeQuickSearchButton{width:34px;height:34px;flex:0 0 34px;border:1px solid rgba(49,185,255,.45);border-radius:9px;background:#0a3857;color:#fff;font-size:18px;font-weight:900;cursor:pointer;box-shadow:0 0 10px rgba(49,185,255,.18)}
      #homeQuickSearchButton:active{transform:scale(.96)}
      .home-search-hint{margin-top:5px!important;font-size:7px!important;color:#64839b!important}
      @media(max-width:560px){#centinela-home-search{gap:11px;padding:12px;margin-top:8px;border-radius:17px}.home-search-icon{flex-basis:64px;width:64px;height:64px;border-radius:17px}.home-search-icon span{font-size:54px}.home-search-content h2{font-size:15px}.home-search-content p{font-size:9px;margin-bottom:7px}.home-search-input-wrap{height:40px}.home-search-hint{display:none!important}}
    `;
    document.head.appendChild(style);
  }

  function eliminarBuscadorDuplicado(){
    const home=document.getElementById("section-home");
    if(!home) return;
    home.querySelectorAll('input,textarea').forEach(input=>{
      if(input.id === "homeQuickSearch") return;
      const ph=(input.getAttribute("placeholder")||"").toLowerCase();
      if(!/buscar normativa.*infracciones|buscar normativa.*art[ií]culos|qué necesitas consultar/.test(ph)) return;
      // El widget viejo "CENTINELA-GLOBAL-SEARCH-V1" (index.html) usa la
      // clase .cc-global-search, que no estaba en esta lista: por eso nunca
      // se eliminaba y convivían DOS cajas de "Consulta rápida" en Inicio,
      // la nueva (fiable, llama directo a CentinelaInstantSearch) y la vieja
      // (heurística por regex sobre inputs visibles + Enter simulado).
      const candidato=input.closest('.home-search, .quick-search, .search-card, .search-panel, .home-panel, .cc-global-search');
      if(candidato && candidato.id !== "centinela-home-search") candidato.remove();
    });
  }

  function activarConsulta(){
    const section=document.getElementById("section-consulta");
    if(!section) return false;
    if(typeof window.activarSeccion === "function"){
      window.activarSeccion("consulta");
    }else{
      document.querySelectorAll(".app-section").forEach(s=>s.classList.toggle("active",s.dataset.section==="consulta"));
      document.querySelectorAll(".nav-item").forEach(n=>n.classList.toggle("active",n.dataset.section==="consulta"));
      window.scrollTo(0,0);
    }
    section.classList.add("active");
    document.querySelectorAll('.app-section').forEach(s=>{if(s!==section)s.classList.remove('active');});
    return true;
  }

  async function ejecutar(texto){
    texto=String(texto||"").trim();
    if(!activarConsulta()) return;
    const input=document.getElementById("consultaSearch");
    if(!input) return;
    input.value=texto;
    input.setAttribute("value",texto);
    input.focus({preventScroll:true});
    input.dispatchEvent(new Event("input",{bubbles:true}));
    input.dispatchEvent(new Event("change",{bubbles:true}));

    // Ejecuta el motor actual sin esperar a que otro listener lo haga.
    if(window.CentinelaInstantSearch?.search){
      await window.CentinelaInstantSearch.search(texto);
      return;
    }
    if(window.CentinelaSearch?.search){
      window.CentinelaSearch.search(texto);
      return;
    }

    // Si el cargador todavía está arrancando, espera muy poco y reintenta.
    let intentos=0;
    const reintentar=setInterval(async()=>{
      intentos++;
      if(window.CentinelaInstantSearch?.search){
        clearInterval(reintentar);
        await window.CentinelaInstantSearch.search(texto);
      }else if(intentos>=25){
        clearInterval(reintentar);
      }
    },80);
  }

  function instalar(){
    const home=document.getElementById("section-home");
    const hero=home?.querySelector(".hero-grid");
    if(!home||!hero) return false;
    if(!document.getElementById("centinela-home-search")){
      eliminarBuscadorDuplicado();
      estilos();
      const bloque=document.createElement("section");
      bloque.id="centinela-home-search";
      bloque.className="home-search-card";
      bloque.setAttribute("aria-label","Consulta rápida");
      bloque.innerHTML=`
        <div class="home-search-icon" aria-hidden="true"><span>⌕</span></div>
        <div class="home-search-content">
          <div class="home-search-kicker">CONSULTA RÁPIDA</div>
          <h2>Buscar normativa e infracciones</h2>
          <p>Busca por código, artículo, palabra o conducta.</p>
          <div class="home-search-input-wrap">
            <span class="home-search-input-icon" aria-hidden="true">⌕</span>
            <input id="homeQuickSearch" type="search" autocomplete="off" placeholder="Ej.: art. 36.16 · navaja · desobediencia…" aria-label="Buscar normativa e infracciones">
            <button id="homeQuickSearchButton" type="button" aria-label="Abrir consulta" title="Buscar">➜</button>
          </div>
          <div class="home-search-hint">Búsqueda directa en Consulta</div>
        </div>`;
      hero.insertAdjacentElement("afterend",bloque);
    }

    const input=document.getElementById("homeQuickSearch");
    const button=document.getElementById("homeQuickSearchButton");
    if(input&&!input.dataset.ccHomeBound){
      input.dataset.ccHomeBound="1";
      input.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();e.stopPropagation();ejecutar(input.value);}},true);
      input.addEventListener("input",()=>{clearTimeout(input.__ccHomeTimer);const v=input.value;input.__ccHomeTimer=setTimeout(()=>{if(v.trim())ejecutar(v)},180);},true);
    }
    if(button&&!button.dataset.ccHomeBound){button.dataset.ccHomeBound="1";button.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();ejecutar(input?.value||"")},true);}
    return true;
  }

  function arrancar(){
    instalar();
    [250,700,1500,3000].forEach(ms=>setTimeout(()=>{instalar();eliminarBuscadorDuplicado();},ms));
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",arrancar,{once:true});
  else arrancar();
})();
