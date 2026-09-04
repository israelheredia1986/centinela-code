/* ============================================================
   CENTINELA CODE — BUSCADOR RÁPIDO DE INICIO
   V1 — un único buscador, reutilizando la Consulta existente
   ============================================================ */
(function(){
  "use strict";

  function instalar(){
    const home = document.getElementById("section-home");
    const hero = home?.querySelector(".hero-grid");
    if(!home || !hero || document.getElementById("centinela-home-search")) return;

    const bloque = document.createElement("section");
    bloque.id = "centinela-home-search";
    bloque.className = "home-search-card";
    bloque.setAttribute("aria-label","Consulta rápida");
    bloque.innerHTML = `
      <div class="home-search-icon" aria-hidden="true">
        <span>⌕</span>
      </div>
      <div class="home-search-content">
        <div class="home-search-kicker">CONSULTA RÁPIDA</div>
        <h2>Buscar normativa e infracciones</h2>
        <p>Busca por código, artículo, palabra o conducta.</p>
        <div class="home-search-input-wrap">
          <span class="home-search-input-icon" aria-hidden="true">⌕</span>
          <input id="homeQuickSearch" type="search" autocomplete="off" placeholder="Ej.: art. 36.16 · navaja · desobediencia…" aria-label="Buscar normativa e infracciones">
          <button id="homeQuickSearchButton" type="button" aria-label="Abrir consulta" title="Buscar">➜</button>
        </div>
        <div class="home-search-hint">La búsqueda utiliza el mismo motor de Consulta. No se crea un segundo buscador.</div>
      </div>
    `;

    hero.insertAdjacentElement("afterend", bloque);

    const input = document.getElementById("homeQuickSearch");
    const button = document.getElementById("homeQuickSearchButton");

    function abrirConsulta(){
      const texto = input?.value.trim() || "";
      const destino = document.querySelector('[data-section="consulta"]');
      if(!destino) return;
      destino.click();
      setTimeout(() => {
        const consulta = document.getElementById("consultaSearch");
        if(consulta){
          consulta.value = texto;
          consulta.dispatchEvent(new Event("input", {bubbles:true}));
          consulta.focus();
        }
      }, 80);
    }

    input?.addEventListener("keydown", e => {
      if(e.key === "Enter"){
        e.preventDefault();
        abrirConsulta();
      }
    });
    button?.addEventListener("click", abrirConsulta);
  }

  function init(){
    if(document.readyState === "loading"){
      document.addEventListener("DOMContentLoaded", instalar, {once:true});
    }else{
      instalar();
    }
  }

  init();
})();
