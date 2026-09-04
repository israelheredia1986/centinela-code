/* ============================================================
   CENTINELA CODE — ACCESO CONSTITUCIÓN · FIX V1
   Mantiene visible la pestaña aunque la app reconstruya Normativa.
   ============================================================ */
(function(){
  'use strict';

  const TAB_ID='centinela-tab-constitucion-fix';
  const PANEL_ID='centinela-constitucion-completa';
  const HOST_ID='section-normativa';

  function addStyles(){
    if(document.getElementById('constitucion-tab-fix-style')) return;
    const s=document.createElement('style');
    s.id='constitucion-tab-fix-style';
    s.textContent=`
      #${TAB_ID}{display:flex!important;align-items:center;gap:10px;width:100%;box-sizing:border-box;margin:10px 0 14px;padding:13px 14px;border:1px solid rgba(62,185,255,.7);border-radius:15px;background:linear-gradient(135deg,#062d4a,#061522);color:#f2fbff;cursor:pointer;font:900 13px/1.2 system-ui,-apple-system,Segoe UI,sans-serif;box-shadow:0 8px 25px rgba(0,0,0,.35),inset 0 0 20px rgba(0,150,255,.08);text-align:left;position:relative;z-index:5}
      #${TAB_ID}:active{transform:scale(.99)}
      #${TAB_ID} .ctf-icon{width:29px;height:29px;display:grid;place-items:center;border-radius:9px;background:#0a7fd6;font-size:17px;flex:0 0 29px}
      #${TAB_ID} .ctf-main{display:flex;flex-direction:column;min-width:0}.ctf-main strong{font-size:13px}.ctf-main small{margin-top:3px;color:#a9cde3;font-size:9px;font-weight:700}
      #${TAB_ID} .ctf-arrow{margin-left:auto;font-size:21px;color:#61c8ff}
      #${PANEL_ID}{scroll-margin-top:12px}
    `;
    document.head.appendChild(s);
  }

  function getHost(){
    return document.getElementById(HOST_ID) || document.querySelector('.app-section[id*="normativa"]');
  }

  function installTab(){
    addStyles();
    const host=getHost();
    if(!host) return false;
    let tab=document.getElementById(TAB_ID);
    if(!tab){
      tab=document.createElement('button');
      tab.id=TAB_ID;
      tab.type='button';
      tab.innerHTML='<span class="ctf-icon">🇪🇸</span><span class="ctf-main"><strong>Constitución Española</strong><small>Texto íntegro · 169 artículos · actualizado · BOE</small></span><span class="ctf-arrow">›</span>';
      const anchor=host.querySelector('#centinela-bloque1') || host.firstElementChild;
      if(anchor) host.insertBefore(tab,anchor); else host.appendChild(tab);
      tab.addEventListener('click',function(){
        const panel=document.getElementById(PANEL_ID);
        if(panel){panel.scrollIntoView({behavior:'smooth',block:'start'});return;}
        const legacy=document.querySelector('[id*="constitucion"]');
        legacy?.scrollIntoView({behavior:'smooth',block:'start'});
      });
    } else if(tab.parentElement!==host){
      host.insertBefore(tab,host.firstElementChild);
    }
    return true;
  }

  function boot(){
    installTab();
    let n=0;
    const timer=setInterval(()=>{
      installTab();
      n++;
      if(n>20) clearInterval(timer);
    },500);
    const observer=new MutationObserver(()=>installTab());
    observer.observe(document.body,{childList:true,subtree:true});
    window.addEventListener('load',()=>installTab());
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
