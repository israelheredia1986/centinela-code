/* CENTINELA CODE — carga de módulos operativos, apuntes e IA con contexto integral. */
(function(){
  "use strict";
  document.querySelectorAll('.cc-global-search,#centinela-global-search-ui').forEach(el=>el.remove());

  function loadScript(id,src){
    if(document.getElementById(id)) return;
    const script=document.createElement('script');
    script.id=id; script.src=src; script.async=true;
    document.body.appendChild(script);
  }

  loadScript('centinelaActuacionesOperativasScript','./actuaciones-operativas.js?v=20260905d');
  loadScript('centinelaApuntesLargosScript','./apuntes-largos.js?v=20260905d');
  loadScript('centinelaIAContextoIntegralScript','./ia-context-integral.js?v=20260905d');

  const st=document.createElement('style');
  st.id='cc-dashboard-three-actions-final';
  st.textContent=`
    #section-home .quick-actions{grid-template-columns:repeat(3,minmax(0,1fr)) !important;display:grid !important;width:100% !important;gap:12px !important;padding:0 !important;}
    #section-home .quick-actions .quick-action{display:flex !important;width:100% !important;min-width:0 !important;}
    #section-home .quick-actions #ccOperQuickAction{display:flex !important;visibility:visible !important;}
    #section-home .quick-actions .quick-action[data-cc-search-hidden="true"]:not(#ccOperQuickAction){display:none !important;}
    @media(max-width:700px){#section-home .quick-actions{grid-template-columns:repeat(2,minmax(0,1fr)) !important;gap:9px !important;}}
    @media(max-width:560px){#section-home .quick-actions{grid-template-columns:repeat(2,minmax(0,1fr)) !important;}}
  `;
  document.head.appendChild(st);
})();
