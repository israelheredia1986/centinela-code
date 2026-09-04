/* CENTINELA CODE — mejoras visuales sin modificar el motor normativo */
(function(){
  "use strict";

  function escapeHtml(value){
    return String(value ?? "").replace(/[&<>\"']/g, function(c){
      return ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"})[c];
    });
  }

  function irAConsulta(query){
    var nav = document.querySelector('.nav-item[data-section="consulta"]');
    if(nav){ nav.click(); }
    else if(typeof window.activarSeccion === "function"){ window.activarSeccion("consulta"); }

    window.setTimeout(function(){
      var input = document.getElementById("consultaSearch");
      if(!input) return;
      input.value = query || "";
      input.focus();
      input.dispatchEvent(new Event("input", {bubbles:true}));
      input.dispatchEvent(new Event("change", {bubbles:true}));
    }, 80);
  }

  function montarBuscadorDashboard(){
    var home = document.getElementById("section-home");
    if(!home || document.getElementById("centinelaGlobalSearch")) return;

    var hero = home.querySelector(".hero-grid");
    if(!hero) return;

    var box = document.createElement("section");
    box.id = "centinelaGlobalSearch";
    box.className = "cc-global-search-card";
    box.innerHTML =
      '<div class="cc-global-search-head">' +
        '<div class="cc-global-search-icon" aria-hidden="true">⌕</div>' +
        '<div><strong>Buscar en Centinela</strong><span>Normativa, artículos, infracciones y contenido disponible</span></div>' +
      '</div>' +
      '<form class="cc-global-search-form" autocomplete="off">' +
        '<input id="ccGlobalSearchInput" type="search" placeholder="Ej.: 36.16, drogas, Ley 39/2015..." aria-label="Buscar en toda Centinela" />' +
        '<button type="submit">Buscar</button>' +
      '</form>' +
      '<div class="cc-global-search-hints"><button type="button" data-query="36.16">36.16</button><button type="button" data-query="ruidos">Ruidos</button><button type="button" data-query="Ley 39/2015">Ley 39/2015</button></div>';

    hero.insertAdjacentElement("afterend", box);

    var form = box.querySelector("form");
    form.addEventListener("submit", function(e){
      e.preventDefault();
      var input = box.querySelector("#ccGlobalSearchInput");
      irAConsulta(input ? input.value.trim() : "");
    });

    box.querySelectorAll("[data-query]").forEach(function(btn){
      btn.addEventListener("click", function(){
        irAConsulta(btn.getAttribute("data-query") || "");
      });
    });

    var headerSearch = document.getElementById("headerSearchButton");
    if(headerSearch && !headerSearch.dataset.ccBound){
      headerSearch.dataset.ccBound = "1";
      headerSearch.addEventListener("click", function(){ irAConsulta(""); });
    }
  }

  function observar(){
    montarBuscadorDashboard();
    var observer = new MutationObserver(function(){ montarBuscadorDashboard(); });
    observer.observe(document.body, {childList:true,subtree:true});
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", observar, {once:true});
  else observar();
})();
