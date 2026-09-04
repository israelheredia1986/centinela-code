/* ============================================================
   CENTINELA CODE — AJUSTE VISUAL DEL BUSCADOR PRINCIPAL XL
   Lupa y tipografía MUCHO más grandes y visibles.
   ============================================================ */
(function(){
  "use strict";
  const STYLE_ID="cc-home-search-size-style";
  function apply(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement("style");
    s.id=STYLE_ID;
    s.textContent=`
      .cc-home-search-title{
        gap:15px!important;
        margin:0 6px 15px!important;
        font-size:24px!important;
        line-height:1.2!important;
        letter-spacing:.1px!important;
      }
      .cc-home-search-title .cc-mark{
        width:58px!important;
        height:58px!important;
        min-width:58px!important;
        border-radius:17px!important;
        font-size:38px!important;
        font-weight:900!important;
        box-shadow:0 0 30px rgba(25,191,255,.62)!important;
      }
      .cc-home-search-box{
        gap:12px!important;
        padding:12px!important;
        min-height:72px!important;
        border-radius:20px!important;
      }
      .cc-home-search-box input{
        padding:16px 18px!important;
        min-height:60px!important;
        font-size:21px!important;
        font-weight:750!important;
        line-height:1.25!important;
        border-radius:15px!important;
      }
      .cc-home-search-box input::placeholder{
        font-size:20px!important;
        font-weight:600!important;
      }
      .cc-home-search-button{
        min-width:125px!important;
        min-height:60px!important;
        padding:0 20px!important;
        border-radius:15px!important;
        font-size:16px!important;
        font-weight:900!important;
      }
      @media(max-width:430px){
        .cc-home-search-title{
          font-size:21px!important;
          gap:12px!important;
          margin-bottom:13px!important;
        }
        .cc-home-search-title .cc-mark{
          width:52px!important;
          height:52px!important;
          min-width:52px!important;
          border-radius:16px!important;
          font-size:34px!important;
        }
        .cc-home-search-box{
          padding:10px!important;
          gap:8px!important;
          min-height:66px!important;
        }
        .cc-home-search-box input{
          font-size:18px!important;
          min-height:54px!important;
          padding:14px 15px!important;
        }
        .cc-home-search-box input::placeholder{font-size:17px!important}
        .cc-home-search-button{
          min-width:96px!important;
          min-height:54px!important;
          padding:0 12px!important;
          font-size:14px!important;
        }
      }
    `;
    document.head.appendChild(s);
  }
  function boot(){
    apply();
    setTimeout(apply,500);
    setTimeout(apply,1200);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();
