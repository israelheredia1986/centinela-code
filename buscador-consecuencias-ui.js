/* CENTINELA CODE — muestra también PENA PENAL en el buscador de inicio */
(function(){
  "use strict";
  function sync(){
    const hidden=document.getElementById("consultaResults"),out=document.getElementById("cc-home-search-results");
    if(!hidden||!out)return;
    const h=[...hidden.querySelectorAll(".cc-search-result")],v=[...out.querySelectorAll(".cc-home-result")];
    v.forEach((card,i)=>{
      const src=h[i];if(!src)return;
      const pena=src.querySelector(".result-pill--pena")?.textContent?.trim();
      const badges=card.querySelector(".cc-home-result-badges");
      if(pena&&badges&&!badges.querySelector(".cc-home-pena")){
        const span=document.createElement("span");span.className="cc-home-badge cc-home-badge--danger cc-home-pena";span.textContent=pena;badges.appendChild(span);
      }
    });
  }
  function boot(){
    const out=document.getElementById("cc-home-search-results");
    if(!out){setTimeout(boot,500);return;}
    new MutationObserver(sync).observe(out,{childList:true,subtree:true});
    sync();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();
