/* ============================================================
   CENTINELA CODE — AJUSTE VISUAL DEL BUSCADOR PRINCIPAL
   Lupa y tipografía más grandes y visibles.
   ============================================================ */
(function(){
  "use strict";
  const STYLE_ID="cc-home-search-size-style";
  function apply(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement("style");
    s.id=STYLE_ID;
    s.textContent=`
      /* Título del buscador: más grande y protagonista */
      .cc-home-search-title{
        gap:12px!important;
        margin:0 4px 10px!important;
        font-size:19px!important;
        line-height:1.25!important;
        letter-spacing:.2px!important;
      }
      .cc-home-search-title .cc-mark{
        width:42px!important;
        height:42px!important;
        min-width:42px!important;
        border-radius:13px!important;
        font-size:27px!important;
        font-weight:900!important;
        box-shadow:0 0 22px rgba(25,191,255,.42)!important;
      }
      /* Texto que se escribe: más grande y cómodo */
      .cc-home-search-box input{
        padding:14px 15px!important;
        min-height:50px!important;
        font-size:17px!important;
        font-weight:700!important;
        line-height:1.25!important;
      }
      .cc-home-search-box input::placeholder{
        font-size:16px!important;
        font-weight:600!important;
      }
      /* Botón también gana presencia */
      .cc-home-search-button{
        min-width:104px!important;
        font-size:14px!important;
        font-weight:900!important;
      }
      @media(max-width:430px){
        .cc-home-search-title{font-size:18px!important}
        .cc-home-search-title .cc-mark{width:40px!important;height:40px!important;min-width:40px!important;font-size:25px!important}
        .cc-home-search-box input{font-size:16px!important;min-height:48px!important}
        .cc-home-search-box input::placeholder{font-size:15px!important}
        .cc-home-search-button{min-width:86px!important;font-size:13px!important}
      }
    `;
    document.head.appendChild(s);
  }
  function boot(){
    apply();
    if(!document.getElementById("cc-home-search-shell"))setTimeout(apply,500);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();
