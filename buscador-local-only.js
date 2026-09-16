/* ============================================================
   CENTINELA CODE — CONSULTA RÁPIDA LOCAL
   V3 — acceso directo funcional y sin eliminar la interfaz
   ============================================================ */
(function(){
  "use strict";

  function activarConsulta(){
    const section=document.getElementById("section-consulta");
    if(!section) return false;

    // Usar el sistema principal de navegación si existe.
    if(typeof window.activarSeccion === "function"){
      try{ window.activarSeccion("consulta"); }catch(e){}
    }

    // Refuerzo: garantiza que CONSULTA quede realmente activa.
    document.querySelectorAll(".app-section").forEach(s=>{
      s.classList.toggle("active",s===section || s.dataset.section==="consulta");
    });
    document.querySelectorAll(".nav-item[data-section]").forEach(n=>{
      n.classList.toggle("active",n.dataset.section==="consulta");
    });
    window.scrollTo({top:0,behavior:"instant"});
    return true;
  }

  async function buscar(texto){
    const q=String(texto||"").trim();
    if(!q) return;

    if(!activarConsulta()) return;

    // Espera a que la sección de Consulta esté disponible en el DOM.
    let intentos=0;
    const ejecutar=async()=>{
      const input=document.getElementById("consultaSearch");
      if(!input){
        if(++intentos<30) setTimeout(ejecutar,50);
        return;
      }

      input.removeAttribute("disabled");
      input.removeAttribute("readonly");
      input.value=q;
      input.setAttribute("value",q);

      // Ejecutar directamente el motor único. No dependemos de filtros.
      if(typeof window.CentinelaInstantSearch?.search === "function"){
        await window.CentinelaInstantSearch.search(q);
        document.getElementById("consultaResults")?.scrollIntoView({behavior:"smooth",block:"start"});
        return;
      }

      // Si todavía está cargando, esperar y ejecutar una sola vez que exista.
      if(++intentos<40){ setTimeout(ejecutar,75); }
    };
    ejecutar();
  }

  function instalar(){
    const input=document.getElementById("homeQuickSearch");
    const button=document.getElementById("homeQuickSearchButton");
    if(!input||!button) return false;

    // No eliminamos .cc-global-search ni otros elementos: el acceso rápido
    // debe coexistir con la interfaz y con la pestaña Consulta.
    if(!input.dataset.ccLocalV3){
      input.dataset.ccLocalV3="1";
      input.addEventListener("keydown",e=>{
        if(e.key!=="Enter") return;
        e.preventDefault();
        e.stopImmediatePropagation();
        buscar(input.value);
      },true);
    }

    if(!button.dataset.ccLocalV3){
      button.dataset.ccLocalV3="1";
      button.addEventListener("click",e=>{
        e.preventDefault();
        e.stopImmediatePropagation();
        buscar(input.value);
      },true);
    }

    // Si el usuario escribe y espera unos instantes, funciona también sin
    // tener que pulsar el botón. No navega hasta que haya texto real.
    if(!input.dataset.ccLocalInputV3){
      input.dataset.ccLocalInputV3="1";
      input.addEventListener("input",()=>{
        clearTimeout(input.__ccLocalTimerV3);
        const value=input.value;
        if(!value.trim()) return;
        input.__ccLocalTimerV3=setTimeout(()=>buscar(value),350);
      },true);
    }
    return true;
  }

  function arrancar(){
    instalar();
    [100,300,700,1200,2000,3500].forEach(ms=>setTimeout(instalar,ms));
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",arrancar,{once:true});
  }else{
    arrancar();
  }
})();
