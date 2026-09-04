/* CENTINELA CODE — mejoras visuales + refuerzo semántico del buscador */
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

  /* Refuerzo semántico: permite buscar con lenguaje policial natural aunque
     la norma use otra flexión o una expresión jurídica equivalente. */
  function reforzarBuscador(){
    if(document.documentElement.dataset.ccSemanticSearch === "1") return;
    document.documentElement.dataset.ccSemanticSearch = "1";

    var vocab = {
      "incumplir":"incumplimiento incumple incumplido incumplir infraccion infracción",
      "incumplimiento":"incumplir incumple incumplido infraccion infracción",
      "incumple":"incumplimiento incumplir infraccion infracción",
      "horario":"horarios hora cierre apertura horario permitido",
      "horarios":"horario hora cierre apertura horario permitido",
      "cierre":"cerrar cerrado cierre tardío cerrar tarde fuera de horario",
      "cerrar":"cierre cerrado cierre tardío cerrar tarde fuera de horario",
      "tarde":"tardío cierre fuera de horario exceso horario",
      "establecimiento":"establecimientos local locales bar pub discoteca hostelería ocio esparcimiento",
      "establecimientos":"establecimiento local locales bar pub discoteca hostelería ocio esparcimiento",
      "local":"establecimiento establecimientos bar pub discoteca hostelería ocio",
      "abierto":"abierta abiertos abierto fuera de horario",
      "abrir":"apertura abrir abierto horario apertura",
      "pub":"establecimiento local hostelería ocio esparcimiento",
      "bar":"establecimiento local hostelería ocio esparcimiento",
      "discoteca":"establecimiento local ocio esparcimiento horario cierre",
      "hosteleria":"hostelería establecimiento local bar pub",
      "hostelería":"hosteleria establecimiento local bar pub",
      "ocio":"esparcimiento establecimiento local hostelería",
      "esparcimiento":"ocio establecimiento local hostelería",
      "terraza":"terrazas velador veladores horario cierre bebidas comidas",
      "velador":"veladores terraza terrazas horario cierre",
      "consumicion":"consumiciones bebidas servir vender cierre",
      "consumiciones":"consumicion bebidas servir vender cierre",
      "vender":"venta vender consumiciones bebidas establecimiento",
      "desalojo":"desalojar público vaciar establecimiento cierre",
      "desalojar":"desalojo público vaciar establecimiento cierre",
      "ruido":"ruidos acústica contaminación acústica horario establecimiento",
      "musica":"música equipos reproducción hostelería establecimiento",
      "música":"musica equipos reproducción hostelería establecimiento"
    };

    document.addEventListener("input", function(ev){
      var input = ev.target;
      if(!input || input.id !== "bcMainInput" || input.dataset.ccExpanding === "1") return;
      var original = input.value || "";
      var words = original.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/[^a-z0-9.]+/).filter(Boolean);
      if(!words.length) return;
      var additions = [];
      words.forEach(function(word){
        if(vocab[word]) additions.push(vocab[word]);
      });
      if(!additions.length) return;
      input.dataset.ccExpanding = "1";
      input.value = original + " " + additions.join(" ");
      window.setTimeout(function(){
        input.value = original;
        delete input.dataset.ccExpanding;
      }, 0);
    }, true);
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

  function aplicarNuevaDistribucion(){
    var home = document.getElementById("section-home");
    if(!home) return;
    var quickActions = home.querySelector(".quick-actions");
    if(quickActions){
      var cards = Array.from(quickActions.querySelectorAll(".quick-action"));
      var searchCard = cards.find(function(card){
        var text = (card.textContent || "").toLowerCase();
        return card.classList.contains("quick-action--blue") || text.indexOf("buscar") >= 0 || text.indexOf("buscador") >= 0;
      });
      if(searchCard){
        searchCard.setAttribute("data-cc-search-hidden", "true");
        searchCard.style.display = "none";
      }
      quickActions.style.gridTemplateColumns = "repeat(2, minmax(0, 1fr))";
      quickActions.style.width = "100%";
      quickActions.style.padding = "0";
      quickActions.style.gap = "10px";
      cards.filter(function(card){ return card !== searchCard; }).forEach(function(card){
        card.style.minHeight = "230px";
        card.style.width = "100%";
      });
    }
    var heading = home.querySelector(".section-heading");
    if(heading){
      var mark = heading.querySelector(".heading-mark");
      var title = heading.querySelector("h2");
      if(mark){
        mark.textContent = "⌕";
        mark.setAttribute("aria-label", "Buscar");
        mark.title = "Abrir buscador";
        mark.style.cursor = "pointer";
        mark.onclick = function(){ irAConsulta(""); };
      }
      if(title){
        title.textContent = "¿QUÉ NECESITAS CONSULTAR?";
        title.style.cursor = "pointer";
        title.onclick = function(){ irAConsulta(""); };
      }
      heading.setAttribute("data-cc-search-heading", "true");
      heading.style.marginTop = "10px";
      heading.style.marginBottom = "8px";
    }
  }

  function aplicarEstilos(){
    if(document.getElementById("cc-dashboard-layout-style")) return;
    var style = document.createElement("style");
    style.id = "cc-dashboard-layout-style";
    style.textContent = `
      #section-home .quick-actions{grid-template-columns:repeat(2,minmax(0,1fr)) !important;width:100% !important;padding:0 !important;gap:10px !important;}
      #section-home .quick-actions .quick-action[data-cc-search-hidden="true"]{display:none !important;}
      #section-home .quick-actions .quick-action:not([data-cc-search-hidden="true"]){width:100% !important;min-height:230px !important;}
      #section-home .section-heading[data-cc-search-heading="true"]{display:flex !important;align-items:center !important;gap:9px !important;}
      #section-home .section-heading[data-cc-search-heading="true"] .heading-mark{width:42px !important;height:42px !important;min-width:42px !important;display:grid !important;place-items:center !important;border:1px solid #1597ff !important;border-radius:12px !important;background:linear-gradient(145deg,rgba(4,45,82,.95),rgba(2,17,32,.98)) !important;color:#49b8ff !important;font-size:29px !important;line-height:1 !important;text-shadow:0 0 14px #1597ff !important;box-shadow:0 0 18px rgba(21,151,255,.18),inset 0 0 15px rgba(21,151,255,.08) !important;}
      #section-home .section-heading[data-cc-search-heading="true"] h2{font-size:clamp(16px,2.5vw,24px) !important;letter-spacing:.35px !important;text-transform:uppercase !important;}
      @media (max-width:560px){#section-home .quick-actions{grid-template-columns:repeat(2,minmax(0,1fr)) !important;gap:8px !important;}#section-home .quick-actions .quick-action:not([data-cc-search-hidden="true"]){min-height:205px !important;padding:10px 6px 8px !important;}#section-home .quick-actions .quick-action:not([data-cc-search-hidden="true"]) .quick-action-icon{width:78px !important;height:90px !important;}#section-home .quick-actions .quick-action:not([data-cc-search-hidden="true"]) .quick-action-text strong{font-size:15px !important;}#section-home .section-heading[data-cc-search-heading="true"] .heading-mark{width:38px !important;height:38px !important;min-width:38px !important;font-size:26px !important;}#section-home .section-heading[data-cc-search-heading="true"] h2{font-size:14px !important;}}
    `;
    document.head.appendChild(style);
  }

  function observar(){
    aplicarEstilos();
    reforzarBuscador();
    montarBuscadorDashboard();
    aplicarNuevaDistribucion();
    var observer = new MutationObserver(function(){
      aplicarEstilos();
      montarBuscadorDashboard();
      aplicarNuevaDistribucion();
    });
    observer.observe(document.body, {childList:true,subtree:true});
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", observar, {once:true});
  else observar();
})();
