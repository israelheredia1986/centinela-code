/* ============================================================
   CENTINELA CODE — CONSTITUCIÓN EN NORMATIVA
   La Constitución aparece como una norma más, sin pestañas duplicadas.
   ============================================================ */
(function(){
  'use strict';
  const CARD_ID='centinela-normativa-constitucion-card';
  const PANEL_ID='centinela-constitucion-completa';
  const OLD_IDS=['centinela-tab-constitucion','centinela-tab-constitucion-fix'];

  function installStyles(){
    if(document.getElementById('centinela-constitucion-standard-style')) return;
    const s=document.createElement('style');
    s.id='centinela-constitucion-standard-style';
    s.textContent=`
      #${CARD_ID}{cursor:pointer;}
      #${CARD_ID} .normativa-icon{font-size:0!important;color:#55bdff!important;display:grid!important;place-items:center!important;}
      #${CARD_ID} .normativa-icon:before{content:'§';font-size:34px;font-weight:900;line-height:1;text-shadow:0 0 14px currentColor;}

      /* Todas las normas deben conservar el mismo tamaño visual.
         La tarjeta de Constitución no debe estirarse para ocupar varias filas. */
      #section-normativa .normativa-list{
        align-items:start!important;
        grid-auto-rows:auto!important;
      }
      #section-normativa .normativa-list > .normativa-card{
        align-self:start!important;
      }
      #${CARD_ID}{
        grid-row:auto!important;
        grid-column:auto!important;
        align-self:start!important;
        height:190px!important;
        min-height:190px!important;
        max-height:190px!important;
        box-sizing:border-box!important;
        overflow:hidden!important;
      }

      #${PANEL_ID}.centinela-hidden{display:none!important;}
      .centinela-constitution-back{display:flex;align-items:center;gap:8px;margin:0 0 12px;padding:10px 13px;border:1px solid #245f8d;border-radius:12px;background:#061a2b;color:#d9efff;font-size:10px;font-weight:900;cursor:pointer;}
      #section-normativa .page-title:before{content:'§';display:grid;place-items:center;width:46px;height:46px;flex:0 0 46px;margin-right:12px;border:1px solid #238ed0;border-radius:13px;background:linear-gradient(145deg,#0b4770,#06223a);color:#5bc4ff;font-size:30px;font-weight:900;text-shadow:0 0 14px #1597ff;box-shadow:0 0 20px rgba(21,151,255,.2),inset 0 0 18px rgba(0,150,255,.12);}
      #section-normativa .page-title{display:flex!important;align-items:center!important;}
      @media (max-width:768px){
        #${CARD_ID}{height:180px!important;min-height:180px!important;max-height:180px!important;}
      }
      @media (max-width:520px){
        #${CARD_ID}{height:170px!important;min-height:170px!important;max-height:170px!important;}
      }
    `;
    document.head.appendChild(s);
  }

  function removeOld(){OLD_IDS.forEach(id=>document.getElementById(id)?.remove());}
  function list(){return document.getElementById('normativaList')||document.querySelector('#section-normativa .normativa-list');}

  function addCard(){
    const host=list();
    if(!host || document.getElementById(CARD_ID)) return !!host;
    const card=document.createElement('div');
    card.id=CARD_ID;
    card.className='normativa-card';
    card.setAttribute('role','button');
    card.setAttribute('tabindex','0');
    card.innerHTML='<div class="normativa-icon">§</div><div class="normativa-info"><h3>Constitución Española</h3><p>Texto íntegro · 169 artículos · texto consolidado</p></div>';
    host.insertBefore(card,host.firstElementChild||null);
    const open=()=>show();
    card.addEventListener('click',open);
    card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}});
    return true;
  }

  function show(){
    const panel=document.getElementById(PANEL_ID);
    if(!panel){setTimeout(show,250);return;}
    const host=list();
    const search=document.querySelector('#section-normativa .search-box');
    removeOld();
    if(host) host.style.display='none';
    if(search) search.style.display='none';
    panel.classList.remove('centinela-hidden');
    let back=panel.querySelector('.centinela-constitution-back');
    if(!back){
      back=document.createElement('button');
      back.type='button';
      back.className='centinela-constitution-back';
      back.textContent='← Volver a Normativa';
      back.addEventListener('click',hide);
      panel.insertBefore(back,panel.firstElementChild);
    }
    panel.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function hide(){
    const panel=document.getElementById(PANEL_ID);
    const host=list();
    if(panel) panel.classList.add('centinela-hidden');
    if(host) host.style.display='grid';
    const search=document.querySelector('#section-normativa .search-box');
    if(search) search.style.display='';
    document.getElementById(CARD_ID)?.focus();
  }

  function boot(){
    installStyles();
    removeOld();
    const panel=document.getElementById(PANEL_ID);
    if(panel) panel.classList.add('centinela-hidden');
    addCard();
    const observer=new MutationObserver(()=>{removeOld();addCard();});
    observer.observe(document.body,{childList:true,subtree:true});
    setTimeout(addCard,500);
    setTimeout(addCard,1500);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
