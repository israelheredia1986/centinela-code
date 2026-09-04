/* ============================================================
   CENTINELA CODE — INTEGRACIÓN CONSTITUCIÓN EN NORMATIVA
   Una sola entrada, mismo estilo que el resto de normativa.
   ============================================================ */
(function(){
  'use strict';
  const CARD_ID='centinela-normativa-constitucion-card';
  const PANEL_ID='centinela-constitucion-completa';
  const TAB_IDS=['centinela-tab-constitucion','centinela-tab-constitucion-fix'];

  function styles(){
    if(document.getElementById('constitucion-normativa-integration-style')) return;
    const s=document.createElement('style');
    s.id='constitucion-normativa-integration-style';
    s.textContent=`
      #${CARD_ID}{cursor:pointer;}
      #${CARD_ID} .normativa-icon{font-size:0!important;color:#55bdff!important;display:grid!important;place-items:center!important;}
      #${CARD_ID} .normativa-icon:before{content:'§';font-size:34px;font-weight:900;line-height:1;text-shadow:0 0 14px currentColor;}
      #${PANEL_ID}.centinela-constitution-hidden{display:none!important;}
      .centinela-constitution-back{display:flex;align-items:center;gap:8px;margin:0 0 12px;padding:10px 13px;border:1px solid #245f8d;border-radius:12px;background:#061a2b;color:#d9efff;font-size:10px;font-weight:900;cursor:pointer;}
      #section-normativa .page-title:before{content:'§';display:grid;place-items:center;width:46px;height:46px;flex:0 0 46px;margin-right:12px;border:1px solid #238ed0;border-radius:13px;background:linear-gradient(145deg,#0b4770,#06223a);color:#5bc4ff;font-size:30px;font-weight:900;text-shadow:0 0 14px #1597ff;box-shadow:0 0 20px rgba(21,151,255,.2),inset 0 0 18px rgba(0,150,255,.12);}
      #section-normativa .page-title{display:flex!important;align-items:center!important;}
    `;
    document.head.appendChild(s);
  }

  function removeOldTabs(){
    TAB_IDS.forEach(id=>document.getElementById(id)?.remove());
  }

  function getList(){return document.getElementById('normativaList')||document.querySelector('#section-normativa .normativa-list');}

  function addCard(){
    const list=getList();
    if(!list) return false;
    const old=document.getElementById(CARD_ID);
    if(old) return true;
    const card=document.createElement('div');
    card.id=CARD_ID;
    card.className='normativa-card';
    card.setAttribute('role','button');
    card.setAttribute('tabindex','0');
    card.innerHTML=`<div class="normativa-icon">§</div><div class="normativa-info"><h3>Constitución Española</h3><p>Texto íntegro · 169 artículos · texto consolidado</p></div>`;
    const first=list.firstElementChild;
    if(first) list.insertBefore(card,first); else list.appendChild(card);
    const open=()=>showConstitution();
    card.addEventListener('click',open);
    card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}});
    return true;
  }

  function showConstitution(){
    const panel=document.getElementById(PANEL_ID);
    const list=getList();
    if(!panel){setTimeout(showConstitution,300);return;}
    removeOldTabs();
    if(list) list.style.display='none';
    const search=document.querySelector('#section-normativa .search-box');
    if(search) search.style.display='none';
    panel.classList.remove('centinela-constitution-hidden');
    let back=panel.querySelector('.centinela-constitution-back');
    if(!back){
      back=document.createElement('button');
      back.type='button';
      back.className='centinela-constitution-back';
      back.textContent='← Volver a Normativa';
      back.addEventListener('click',hideConstitution);
      panel.insertBefore(back,panel.firstElementChild);
    }
    panel.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function hideConstitution(){
    const panel=document.getElementById(PANEL_ID);
    const list=getList();
    if(panel) panel.classList.add('centinela-constitution-hidden');
    if(list) list.style.display='grid';
    const search=document.querySelector('#section-normativa .search-box');
    if(search) search.style.display='';
    const card=document.getElementById(CARD_ID);
    card?.focus();
  }

  function boot(){
    styles();
    removeOldTabs();
    const panel=document.getElementById(PANEL_ID);
    if(panel) panel.classList.add('centinela-constitution-hidden');
    addCard();
    let n=0;
    const observer=new MutationObserver(()=>{
      removeOldTabs();
      addCard();
      const p=document.getElementById(PANEL_ID);
      if(p && !p.dataset.centinelaIntegration) {p.classList.add('centinela-constitution-hidden');}
    });
    observer.observe(document.body,{childList:true,subtree:true});
    setTimeout(()=>addCard(),500);
    setTimeout(()=>addCard(),1500);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
