/* ============================================================
   CENTINELA CODE — BÚSQUEDA LOCAL
   V1 — la portada consulta exclusivamente los datos del repositorio
   ============================================================ */
(function(){
  "use strict";

  function limpiarDuplicado(){
    const home=document.getElementById("section-home");
    if(!home)return;
    home.querySelectorAll(".cc-global-search,#centinela-global-search-ui").forEach(el=>el.remove());
    home.querySelectorAll("input,textarea").forEach(el=>{
      if(el.id==="homeQuickSearch")return;
      const ph=(el.getAttribute("placeholder")||"").toLowerCase();
      if(!/buscar normativa.*infracciones|buscar normativa.*art[ií]culos|qué necesitas consultar/.test(ph))return;
      const bloque=el.closest(".cc-global-search,.search-card,.search-panel,.quick-search");
      if(bloque)bloque.remove();
    });
    document.querySelectorAll('script[src*="global-search.js"]').forEach(s=>s.remove());
  }

  function protegerResultados(){
    const box=document.getElementById("consultaResults");
    if(!box||box.dataset.localGuard==="1")return;
    box.dataset.localGuard="1";
    const limpiar=()=>box.querySelectorAll(".cc-search-result.result-card").forEach(el=>el.classList.remove("result-card"));
    new MutationObserver(limpiar).observe(box,{childList:true,subtree:true});
    limpiar();
  }

  function esperarMotor(fn){
    if(window.CentinelaSearch?.search){fn();return;}
    let n=0;
    const t=setInterval(()=>{
      if(window.CentinelaSearch?.search||++n>40){clearInterval(t);if(window.CentinelaSearch?.search)fn();}
    },100);
  }

  function instalar(){
    limpiarDuplicado();
    protegerResultados();
    const original=document.getElementById("homeQuickSearchButton");
    const input=document.getElementById("homeQuickSearch");
    if(!original||!input||original.dataset.localBound==="1")return;

    const button=original.cloneNode(true);
    original.replaceWith(button);
    button.dataset.localBound="1";

    const ejecutar=()=>{
      const q=(input.value||"").trim();
      const destino=document.querySelector('[data-section="consulta"]');
      if(destino)destino.click();
      setTimeout(()=>{
        const consulta=document.getElementById("consultaSearch");
        if(consulta)consulta.value=q;
        esperarMotor(()=>window.CentinelaSearch.search(q));
      },120);
    };

    button.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();ejecutar();});
    input.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();e.stopPropagation();ejecutar();}},true);
  }

  function arrancar(){
    instalar();
    limpiarDuplicado();
    setTimeout(instalar,250);
    setTimeout(instalar,700);
    setTimeout(protegerResultados,1200);
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",arrancar,{once:true});
  else arrancar();
})();
