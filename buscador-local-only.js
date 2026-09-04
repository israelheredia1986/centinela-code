/* ============================================================
   CENTINELA CODE — BÚSQUEDA LOCAL
   V2 — buscador único, sin navegación externa
   ============================================================ */
(function(){
  "use strict";

  function limpiarElementosAntiguos(){
    const home=document.getElementById("section-home");
    if(home){
      home.querySelectorAll(".cc-global-search,#centinela-global-search-ui").forEach(el=>el.remove());
      home.querySelectorAll('input,textarea').forEach(el=>{
        if(el.id==="homeQuickSearch") return;
        const ph=(el.getAttribute("placeholder")||"").toLowerCase();
        if(!/buscar normativa.*infracciones|buscar normativa.*art[ií]culos|qué necesitas consultar/.test(ph)) return;
        const bloque=el.closest(".cc-global-search,.search-card,.search-panel,.quick-search");
        if(bloque) bloque.remove();
      });
    }
    document.querySelectorAll('script[src*="global-search.js"]').forEach(s=>s.remove());
  }

  function navegarSoloAConsulta(){
    const nav=document.querySelector('.nav-item[data-section="consulta"]');
    if(nav){
      nav.click();
      return true;
    }

    const section=document.getElementById("section-consulta");
    if(section){
      document.querySelectorAll(".app-section").forEach(el=>el.classList.remove("active"));
      section.classList.add("active");
      return true;
    }

    return false;
  }

  function esperarMotor(callback){
    if(typeof window.CentinelaSearch?.search === "function"){
      callback();
      return;
    }
    let intentos=0;
    const timer=setInterval(()=>{
      if(typeof window.CentinelaSearch?.search === "function" || ++intentos>50){
        clearInterval(timer);
        if(typeof window.CentinelaSearch?.search === "function") callback();
      }
    },100);
  }

  function ejecutarBusqueda(input){
    const q=String(input?.value||"").trim();
    if(!q){
      input?.focus();
      return;
    }

    /* IMPORTANTE: nunca abrir BOE/DGT/Tráfico ni ninguna web externa. */
    navegarSoloAConsulta();

    setTimeout(()=>{
      const consulta=document.getElementById("consultaSearch");
      if(consulta){
        consulta.value=q;
        consulta.setAttribute("value",q);
      }

      esperarMotor(()=>{
        window.CentinelaSearch.search(q);
        setTimeout(()=>document.getElementById("consultaResults")?.scrollIntoView({behavior:"smooth",block:"start"}),120);
      });
    },150);
  }

  function instalar(){
    limpiarElementosAntiguos();

    const input=document.getElementById("homeQuickSearch");
    const original=document.getElementById("homeQuickSearchButton");
    if(!input||!original||original.dataset.localBound==="1") return;

    /* Reemplazamos el botón para eliminar listeners antiguos y cualquier
       comportamiento heredado que pudiera navegar fuera de la aplicación. */
    const button=original.cloneNode(true);
    button.type="button";
    button.dataset.localBound="1";
    original.replaceWith(button);

    button.addEventListener("click",e=>{
      e.preventDefault();
      e.stopPropagation();
      ejecutarBusqueda(input);
    },true);

    input.addEventListener("keydown",e=>{
      if(e.key!=="Enter") return;
      e.preventDefault();
      e.stopPropagation();
      ejecutarBusqueda(input);
    },true);
  }

  function arrancar(){
    instalar();
    setTimeout(instalar,200);
    setTimeout(instalar,600);
    setTimeout(limpiarElementosAntiguos,1000);
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",arrancar,{once:true});
  else arrancar();
})();
