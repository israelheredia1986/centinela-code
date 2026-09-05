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

      /* Todas las normas se muestran en una sola columna, una debajo de otra,
         evitando el desencuadre/masonry de la vista de Normativa. */
      #section-normativa .normativa-list{
        display:grid!important;
        grid-template-columns:1fr!important;
        align-items:start!important;
        grid-auto-rows:auto!important;
        gap:12px!important;
      }
      #section-normativa .normativa-list > .normativa-card{
        align-self:start!important;
        grid-column:1!important;
        width:100%!important;
      }
      #${CARD_ID}{
        grid-row:auto!important;
        grid-column:1!important;
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

  /* ============================================================
     REPARACIÓN DE LA CONSTITUCIÓN
     El módulo original puede quedar sin datos cuando falla el
     parseo. Esta capa mantiene la interfaz intacta y recupera los
     169 artículos, búsqueda, Mostrar/Ocultar todo y botón BOE.
     ============================================================ */
  const REPAIR_API='https://api.github.com/repos/legalize-dev/legalize-es/contents/es/BOE-A-1978-31229.md';
  const REPAIR_RAW='https://raw.githubusercontent.com/legalize-dev/legalize-es/main/es/BOE-A-1978-31229.md';
  const REPAIR_CACHE='centinela-constitucion-repair-v2026-09-05';
  let repairState={data:null,query:'',allOpen:false,bound:false};

  const repairEsc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const repairNorm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();

  function repairParseMarkdown(md){
    const lines=String(md||'').replace(/^\uFEFF/,'').replace(/\r/g,'').split('\n');
    const idx=[];
    for(let i=0;i<lines.length;i++){
      const m=lines[i].trim().match(/^#{2,6}\s*Art[ií]culo\s+(\d+)\b/i);
      if(m)idx.push({line:i,num:Number(m[1])});
    }
    const articles=[];
    for(let i=0;i<idx.length;i++){
      let end=i+1<idx.length?idx[i+1].line:lines.length;
      let block=lines.slice(idx[i].line+1,end);
      while(block.length&&!block[0].trim())block.shift();
      while(block.length&&!block[block.length-1].trim())block.pop();
      block=block.map(x=>x.replace(/^>\s*<small>/i,'').replace(/<\/small>$/i,'').replace(/^>\s*/,'').trimEnd());
      articles.push({numero:idx[i].num,titulo:'Artículo '+idx[i].num,texto:block.join('\n').trim()});
    }
    return {articulos:articles,totalArticulos:articles.length};
  }

  async function repairFetchMarkdown(){
    try{
      const r=await fetch(REPAIR_API,{cache:'no-store',headers:{Accept:'application/vnd.github+json'}});
      if(r.ok){
        const j=await r.json();
        if(j.content){
          const bin=atob(String(j.content).replace(/\s/g,''));
          const bytes=Uint8Array.from(bin,c=>c.charCodeAt(0));
          return new TextDecoder('utf-8').decode(bytes);
        }
      }
    }catch(e){}
    const r=await fetch(REPAIR_RAW+'?v=20260905-repair',{cache:'no-store'});
    if(!r.ok)throw new Error('No se pudo cargar el texto constitucional');
    return r.text();
  }

  function repairRender(){
    const root=document.getElementById(PANEL_ID);
    if(!root||!repairState.data)return;
    const q=repairNorm(repairState.query);
    const arts=repairState.data.articulos.filter(a=>!q||repairNorm(`articulo ${a.numero} ${a.texto}`).includes(q));
    const results=root.querySelector('.ce-results');
    if(results){
      results.innerHTML=arts.length?arts.map(a=>`<details class="ce-article" ${repairState.allOpen?'open':''}><summary class="ce-summary"><span class="ce-art-no">ART. ${repairEsc(a.numero)}</span><span class="ce-art-title">${repairEsc(a.titulo)}</span><span class="ce-chevron">›</span></summary><div class="ce-body"><div class="ce-body-text">${repairEsc(a.texto)}</div><div class="ce-source-note">Texto consolidado de consulta. Ver fuente oficial BOE para efectos jurídicos.</div></div></details>`).join(''):`<div class="ce-empty">No hay artículos que coincidan con «${repairEsc(repairState.query)}».</div>`;
    }
    const count=root.querySelector('.ce-count'); if(count)count.textContent=String(arts.length);
    const total=root.querySelector('.ce-total'); if(total)total.textContent=String(repairState.data.totalArticulos);
    const status=root.querySelector('.ce-status'); if(status)status.textContent=repairState.data.totalArticulos>=169?'169 artículos cargados correctamente':'Datos constitucionales cargados';
    const ql=root.querySelector('.ce-query'); if(ql)ql.textContent=repairState.query?` · búsqueda: ${repairEsc(repairState.query)}`:'';
    const btn=root.querySelector('.ce-clear'); if(btn)btn.textContent=repairState.allOpen?'Ocultar todo':'Mostrar todo';
  }

  function repairBind(){
    const root=document.getElementById(PANEL_ID);
    if(!root||repairState.bound)return false;
    const search=root.querySelector('.ce-search');
    const all=root.querySelector('.ce-clear');
    const boe=root.querySelector('.ce-open-boe');
    if(search)search.addEventListener('input',e=>{repairState.query=e.target.value.trim();repairState.allOpen=false;repairRender();});
    if(all)all.addEventListener('click',()=>{repairState.allOpen=!repairState.allOpen;repairRender();});
    if(boe)boe.addEventListener('click',()=>window.open('https://www.boe.es/buscar/act.php?id=BOE-A-1978-31229','_blank','noopener'));
    repairState.bound=true;
    return true;
  }

  async function repairLoad(){
    const root=document.getElementById(PANEL_ID);
    if(!root)return setTimeout(repairLoad,350);
    repairBind();
    try{
      const cached=localStorage.getItem(REPAIR_CACHE);
      if(cached){
        const d=JSON.parse(cached);
        if(d?.articulos?.length>=169){repairState.data=d;repairRender();}
      }
    }catch(e){}
    if(repairState.data?.totalArticulos>=169)return;
    try{
      const d=repairParseMarkdown(await repairFetchMarkdown());
      if(d.articulos.length<169)throw new Error('Se detectaron '+d.articulos.length+' artículos');
      repairState.data=d;
      try{localStorage.setItem(REPAIR_CACHE,JSON.stringify(d));}catch(e){}
      repairRender();
    }catch(e){
      const status=root.querySelector('.ce-status');
      if(status)status.textContent='No se pudo cargar la Constitución. Reintentando…';
      setTimeout(repairLoad,2000);
    }
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
    setTimeout(repairLoad,700);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
