/* CENTINELA CODE — PRIORIDAD REAL DE RESULTADOS SANCIONABLES
   Regla: cuando una búsqueda corresponde a una conducta/infracción,
   cualquier resultado que tenga sanción/importe se muestra SIEMPRE antes
   que los artículos meramente descriptivos.
*/
(function(){
  "use strict";

  function ordenarSancionables(){
    const box=document.getElementById("consultaResults");
    if(!box)return;
    const cards=[...box.querySelectorAll("article.cc-search-result")];
    if(cards.length<2)return;

    const sancionable=card=>!!card.querySelector(".result-pill--sancion");
    const orden=[...cards].sort((a,b)=>Number(sancionable(b))-Number(sancionable(a)));

    if(orden.every((card,i)=>card===cards[i]))return;
    const frag=document.createDocumentFragment();
    orden.forEach(card=>frag.appendChild(card));
    box.appendChild(frag);
  }

  function instalar(){
    const box=document.getElementById("consultaResults");
    if(!box||box.dataset.ccSancionesPriorityInstalled)return;
    box.dataset.ccSancionesPriorityInstalled="1";

    const observer=new MutationObserver(()=>{
      requestAnimationFrame(ordenarSancionables);
    });
    observer.observe(box,{childList:true,subtree:true});

    ordenarSancionables();
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",instalar,{once:true});
  else instalar();
})();
