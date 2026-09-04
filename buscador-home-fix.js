/* CENTINELA CODE — limpieza de la caja de búsqueda antigua */
(function(){
  "use strict";
  function fix(){
    const shell=document.getElementById("cc-home-search-shell");
    if(!shell)return;
    const old=document.querySelector(".cc-global-search");
    if(old && !shell.contains(old)) old.style.display="none";
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(fix,50),{once:true});
  else setTimeout(fix,50);
})();
