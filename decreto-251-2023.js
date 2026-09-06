/* ============================================================
   CENTINELA CODE — ESPECTÁCULOS PÚBLICOS
   Categoría única dentro de Normativa.
   3 normas: Ley 13/1999 · Decreto 155/2018 · Decreto 251/2023.
   Visor integrado sin iframe blanco y con fuente oficial.
   ============================================================ */
(function(){
  'use strict';

  const CARD_ID='centinela-espectaculos-publicos-card';
  const PANEL_ID='centinela-espectaculos-publicos-panel';
  const STYLE_ID='centinela-espectaculos-publicos-style-v3';

  const LAWS={
    ley13:{
      title:'Ley 13/1999, de 15 de diciembre',
      short:'Ley 13/1999',
      subtitle:'Espectáculos Públicos y Actividades Recreativas de Andalucía',
      source:'https://www.juntadeandalucia.es/boja/1999/152/1',
      official:'https://www.juntadeandalucia.es/boja/1999/152/1'
    },
    decreto155:{
      title:'Decreto 155/2018, de 31 de julio',
      short:'Decreto 155/2018',
      subtitle:'Catálogo de Espectáculos Públicos, Actividades Recreativas y Establecimientos Públicos de Andalucía',
      source:'https://www.juntadeandalucia.es/boja/2018/150/13',
      official:'https://www.juntadeandalucia.es/boja/2018/150/13'
    },
    decreto251:{
      title:'Decreto 251/2023, de 3 de octubre',
      short:'Decreto 251/2023',
      subtitle:'Modifica el Decreto 155/2018',
      source:'https://www.juntadeandalucia.es/boja/2023/193/2',
      official:'https://www.juntadeandalucia.es/boja/2023/193/2'
    }
  };

  const esc=v=>String(v??'')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#039;');

  function getList(){
    return document.getElementById('normativaList')||document.querySelector('#section-normativa .normativa-list');
  }
  function getSection(){return document.getElementById('section-normativa');}

  function injectStyle(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=`
      #${CARD_ID}{cursor:pointer!important;}
      #${CARD_ID} .normativa-icon:before{content:'🎪'!important;font-size:25px!important;color:#66c2ff!important;}
      #${CARD_ID} .normativa-info span{display:block;margin-top:5px;color:var(--cc-blue-bright)!important;font-size:10px!important;font-weight:700!important;}
      #${PANEL_ID}{margin:0 0 18px!important;border:1px solid var(--cc-line)!important;border-radius:18px!important;background:linear-gradient(145deg,#0a1828,#07111d)!important;box-shadow:var(--cc-shadow)!important;overflow:hidden!important;}
      #${PANEL_ID}.is-hidden{display:none!important;}
      #${PANEL_ID} .esp-panel-head{padding:18px 20px;border-bottom:1px solid var(--cc-line);background:#0a1928;}
      #${PANEL_ID} .esp-panel-kicker{color:var(--cc-blue-bright);font-size:10px;font-weight:800;letter-spacing:1px;text-transform:uppercase;}
      #${PANEL_ID} .esp-panel-title{margin:5px 0 0;font-size:22px;line-height:1.15;color:var(--cc-text);font-weight:900;}
      #${PANEL_ID} .esp-panel-sub{margin:6px 0 0;color:var(--cc-muted);font-size:12px;line-height:1.5;}
      #${PANEL_ID} .esp-toolbar{display:flex;gap:8px;flex-wrap:wrap;padding:12px 20px;border-bottom:1px solid var(--cc-line);}
      #${PANEL_ID} .esp-btn{min-height:38px;padding:8px 12px;border:1px solid var(--cc-line);border-radius:10px;background:#0b1a29;color:var(--cc-text-2);font-size:11px;font-weight:800;}
      #${PANEL_ID} .esp-btn:hover{border-color:var(--cc-line-strong);background:#0d253b;}
      #${PANEL_ID} .esp-btn.primary{background:#0d66ac;border-color:#238ed6;color:#fff;}
      #${PANEL_ID} .esp-laws{display:grid;gap:10px;padding:14px 20px 20px;}
      #${PANEL_ID} .esp-law-card{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:12px;align-items:center;padding:14px;border:1px solid var(--cc-line);border-radius:16px;background:linear-gradient(145deg,#0b1b2d,#07121f);}
      #${PANEL_ID} .esp-law-icon{width:42px;height:42px;border:1px solid var(--cc-line-strong);border-radius:11px;background:#0a2033;display:grid;place-items:center;color:var(--cc-blue-bright);font-size:20px;}
      #${PANEL_ID} .esp-law-title{margin:0;color:var(--cc-text);font-size:15px;font-weight:900;line-height:1.25;}
      #${PANEL_ID} .esp-law-sub{margin:4px 0 0;color:var(--cc-muted);font-size:11px;line-height:1.45;}
      #${PANEL_ID} .esp-law-actions{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end;}
      #${PANEL_ID} .esp-view{padding:14px 20px 20px;}
      #${PANEL_ID} .esp-view-top{display:flex;gap:8px;align-items:center;justify-content:space-between;flex-wrap:wrap;padding-bottom:12px;}
      #${PANEL_ID} .esp-view-title{font-size:15px;font-weight:900;color:var(--cc-text);}
      #${PANEL_ID} .esp-status{padding:11px 12px;border:1px solid var(--cc-line);border-radius:12px;background:#07111c;color:var(--cc-muted);font-size:11px;line-height:1.5;}
      #${PANEL_ID} .esp-status.error{border-color:rgba(239,89,104,.3);color:#ffd1d6;background:rgba(95,19,29,.16);}
      #${PANEL_ID} .esp-content{max-height:68vh;overflow:auto;padding:16px;border:1px solid var(--cc-line);border-radius:14px;background:#06101b;color:#d9e5ef;font:400 12px/1.62 system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;white-space:pre-wrap;overflow-wrap:anywhere;}
      #${PANEL_ID} .esp-articles{display:grid;gap:7px;margin-bottom:12px;}
      #${PANEL_ID} .esp-article{padding:10px 11px;border:1px solid var(--cc-line);border-radius:10px;background:#0a1928;}
      #${PANEL_ID} .esp-article strong{display:block;color:var(--cc-blue-bright);font-size:11px;margin-bottom:4px;}
      #${PANEL_ID} .esp-article span{color:var(--cc-muted);font-size:10px;}
      @media(max-width:650px){
        #${PANEL_ID} .esp-law-card{grid-template-columns:auto 1fr;}
        #${PANEL_ID} .esp-law-actions{grid-column:1/-1;justify-content:stretch;}
        #${PANEL_ID} .esp-law-actions .esp-btn{flex:1;}
      }
    `;
    document.head.appendChild(s);
  }

  function removeStandaloneLawCards(root){
    if(!root)return;
    const cards=[...root.querySelectorAll('.normativa-card,.cc-law-card')];
    cards.forEach(card=>{
      if(card.id===CARD_ID)return;
      const text=(card.dataset.law||card.innerText||'').toLowerCase();
      const standalone=(text.includes('ley 13/1999')||text.includes('decreto 155/2018')||text.includes('decreto 251/2023'));
      if(standalone)card.remove();
    });
  }

  function ensureCategoryCard(){
    injectStyle();
    const list=getList();
    if(!list)return;
    removeStandaloneLawCards(list);
    let card=document.getElementById(CARD_ID);
    if(card&&card.parentElement===list){bindCard(card);return;}
    if(card)card.remove();

    card=document.createElement('div');
    card.id=CARD_ID;
    card.className='normativa-card cc-law-card';
    card.dataset.law='Espectáculos Públicos';
    card.setAttribute('role','button');
    card.setAttribute('tabindex','0');
    card.innerHTML=`
      <div class="normativa-icon" aria-hidden="true"></div>
      <div class="normativa-info">
        <h3>Espectáculos Públicos</h3>
        <p>Ley 13/1999 · Decreto 155/2018 · Decreto 251/2023</p>
        <span>3 normas · articulado integrado</span>
      </div>
      <button type="button" class="normativa-open" aria-label="Abrir Espectáculos Públicos">Ver normas</button>`;

    list.appendChild(card);
    bindCard(card);
  }

  function bindCard(card){
    if(!card||card.dataset.espBound==='1')return;
    card.dataset.espBound='1';
    const open=(ev)=>{ev?.preventDefault();ev?.stopPropagation();openCategory();};
    card.addEventListener('click',open);
    card.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){open(ev);}});
    card.querySelector('button')?.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation();openCategory();});
  }

  function createPanel(){
    const section=getSection();
    if(!section)return null;
    let p=document.getElementById(PANEL_ID);
    if(!p){
      p=document.createElement('section');
      p.id=PANEL_ID;
      p.className='is-hidden';
      const list=getList();
      section.insertBefore(p,list||null);
    }
    return p;
  }

  function renderCategory(){
    const p=createPanel();
    if(!p)return;
    p.innerHTML=`
      <div class="esp-panel-head">
        <div class="esp-panel-kicker">Normativa autonómica · Andalucía</div>
        <h2 class="esp-panel-title">Espectáculos Públicos</h2>
        <p class="esp-panel-sub">Consulta conjunta de las normas principales y de su articulado.</p>
      </div>
      <div class="esp-toolbar">
        <button type="button" class="esp-btn" data-esp-close>← Volver a Normativa</button>
      </div>
      <div class="esp-laws">
        ${lawCard('ley13','📜',LAWS.ley13)}
        ${lawCard('decreto155','📘',LAWS.decreto155)}
        ${lawCard('decreto251','📑',LAWS.decreto251)}
      </div>
      <div class="esp-view is-hidden" data-esp-view></div>`;

    p.querySelector('[data-esp-close]')?.addEventListener('click',closeCategory);
    p.querySelectorAll('[data-esp-law]').forEach(btn=>btn.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation();openLaw(btn.dataset.espLaw);}));
    p.querySelectorAll('[data-esp-official]').forEach(a=>a.addEventListener('click',ev=>ev.stopPropagation()));
  }

  function lawCard(id,icon,cfg){
    return `<article class="esp-law-card">
      <div class="esp-law-icon" aria-hidden="true">${icon}</div>
      <div>
        <h3 class="esp-law-title">${esc(cfg.title)}</h3>
        <p class="esp-law-sub">${esc(cfg.subtitle)}</p>
      </div>
      <div class="esp-law-actions">
        <button type="button" class="esp-btn primary" data-esp-law="${id}">Ver articulado</button>
        <a class="esp-btn" data-esp-official href="${cfg.official}" target="_blank" rel="noopener noreferrer">↗ Fuente oficial</a>
      </div>
    </article>`;
  }

  function openCategory(){
    const list=getList(),p=createPanel();
    if(!p)return;
    renderCategory();
    p.classList.remove('is-hidden');
    if(list)list.style.setProperty('display','none','important');
    p.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function closeCategory(){
    const list=getList(),p=document.getElementById(PANEL_ID);
    p?.classList.add('is-hidden');
    if(list)list.style.removeProperty('display');
  }

  async function openLaw(id){
    const cfg=LAWS[id];
    const p=createPanel();
    if(!cfg||!p)return;
    const view=p.querySelector('[data-esp-view]');
    const laws=p.querySelector('.esp-laws');
    if(!view)return;
    laws?.classList.add('is-hidden');
    view.classList.remove('is-hidden');
    view.innerHTML=`
      <div class="esp-view-top">
        <div class="esp-view-title">${esc(cfg.title)}</div>
        <div style="display:flex;gap:7px;flex-wrap:wrap">
          <button type="button" class="esp-btn" data-esp-back>← Volver a las 3 normas</button>
          <a class="esp-btn primary" href="${cfg.official}" target="_blank" rel="noopener noreferrer">↗ Abrir fuente oficial</a>
        </div>
      </div>
      <div class="esp-status">Cargando articulado desde la fuente oficial…</div>`;

    view.querySelector('[data-esp-back]')?.addEventListener('click',()=>{view.classList.add('is-hidden');laws?.classList.remove('is-hidden');});
    const status=view.querySelector('.esp-status');

    try{
      let text='';
      const cacheKey='cc-esp-full-v3-'+id;
      try{text=localStorage.getItem(cacheKey)||'';}catch(_){ }
      if(text.length<500){
        text=await getOfficialText(cfg.source);
        if(text.length>=500){try{localStorage.setItem(cacheKey,text);}catch(_){ }}
      }
      if(text.length<500)throw new Error('No se pudo obtener el texto');

      status?.remove();
      const articles=extractArticles(text);
      const content=document.createElement('div');
      content.className='esp-content';
      if(articles.length){
        const index=document.createElement('div');
        index.className='esp-articles';
        index.innerHTML=articles.map(a=>`<div class="esp-article"><strong>${esc(a.title)}</strong><span>${esc(a.preview)}</span></div>`).join('');
        content.appendChild(index);
      }
      const title=document.createElement('div');
      title.style.cssText='color:#66c2ff;font-weight:900;font-size:12px;margin:6px 0 10px';
      title.textContent='Texto normativo';
      content.appendChild(title);
      const body=document.createElement('div');
      body.textContent=text;
      content.appendChild(body);
      view.appendChild(content);
    }catch(err){
      if(status){
        status.classList.add('error');
        status.innerHTML=`<strong>No se ha podido cargar automáticamente el articulado.</strong><br>La norma sigue disponible mediante el botón «Abrir fuente oficial». No se usa iframe para evitar el cuadro blanco que aparecía en la aplicación.`;
      }
      const link=document.createElement('a');
      link.className='esp-btn primary';
      link.href=cfg.official;
      link.target='_blank';
      link.rel='noopener noreferrer';
      link.textContent='↗ Consultar articulado oficial';
      link.style.marginTop='10px';
      view.appendChild(link);
      console.warn('Centinela — Espectáculos Públicos:',err);
    }
  }

  async function getOfficialText(url){
    const attempts=[
      url,
      'https://r.jina.ai/'+url
    ];
    for(const target of attempts){
      try{
        const res=await fetch(target,{cache:'no-store'});
        if(!res.ok)continue;
        const text=await res.text();
        const cleaned=extractText(text);
        if(cleaned.length>=500)return cleaned;
      }catch(_){ }
    }
    return '';
  }

  function extractText(raw){
    if(!raw)return '';
    if(!/<html|<body|<article|<main/i.test(raw)){
      return String(raw).replace(/\r/g,'').replace(/\n{3,}/g,'\n\n').trim();
    }
    const doc=new DOMParser().parseFromString(raw,'text/html');
    doc.querySelectorAll('script,style,noscript,nav,header,footer,form').forEach(n=>n.remove());
    const root=doc.querySelector('main,article,.contenido,#contenido,#content,body')||doc.body;
    return (root?.innerText||root?.textContent||'')
      .replace(/\u00a0/g,' ')
      .replace(/\r/g,'')
      .split('\n').map(x=>x.trim()).join('\n')
      .replace(/\n{3,}/g,'\n\n').trim();
  }

  function extractArticles(text){
    const lines=String(text||'').split('\n').map(x=>x.trim()).filter(Boolean);
    const out=[];
    for(let i=0;i<lines.length;i++){
      if(/^Artículo\s+\d+[A-Za-z]?\.?\s*/i.test(lines[i])){
        const title=lines[i];
        const preview=[];
        for(let j=i+1;j<lines.length&&preview.length<2;j++){
          if(/^Artículo\s+\d+[A-Za-z]?\.?\s*/i.test(lines[j]))break;
          if(!/^CAP[IÍ]TULO|^SECCI[ÓO]N|^DISPOSICI[ÓO]N/i.test(lines[j]))preview.push(lines[j]);
        }
        out.push({title,preview:preview.join(' ').slice(0,260)});
      }
    }
    return out.slice(0,120);
  }

  function boot(){
    ensureCategoryCard();
    const observer=new MutationObserver(()=>ensureCategoryCard());
    observer.observe(document.body,{childList:true,subtree:true});
    setInterval(ensureCategoryCard,1800);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
