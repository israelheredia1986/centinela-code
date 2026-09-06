/* ============================================================
   CENTINELA CODE — ESPECTÁCULOS PÚBLICOS
   Categoría única dentro de Normativa.
   - Ley 13/1999: texto del PDF aportado (consolidado 30/04/2014)
     almacenado localmente en 8 fragmentos.
   - Decreto 155/2018 y Decreto 251/2023: acceso y consulta oficial.
   ============================================================ */
(function(){
  'use strict';

  const CATEGORY_ID='centinela-espectaculos-publicos-card';
  const PANEL_ID='centinela-espectaculos-publicos-panel';
  const STYLE_ID='centinela-espectaculos-publicos-style';
  const LEY13_KEY='cc-esp-ley13-2014-v1';

  const LAWS={
    ley13:{
      title:'Ley 13/1999, de 15 de diciembre',
      short:'Ley 13/1999',
      subtitle:'Espectáculos Públicos y Actividades Recreativas de Andalucía',
      meta:'Texto aportado · consolidado con modificación publicada el 30/04/2014',
      official:'https://www.boe.es/eli/es-an/l/1999/12/15/13/con/20140430',
      localParts:Array.from({length:8},(_,i)=>`./data/ley_13_1999_2014_p${i+1}.txt`)
    },
    decreto155:{
      title:'Decreto 155/2018, de 31 de julio',
      short:'Decreto 155/2018',
      subtitle:'Catálogo de Espectáculos Públicos, Actividades Recreativas y Establecimientos Públicos de Andalucía',
      meta:'Texto oficial consolidado',
      source:'https://ws040.juntadeandalucia.es/sedeboja/lconsolidada/eli/es-an/d/2018/07/31/155/con/20231007/spa/html/LE0000626444_20231007.html',
      official:'https://www.juntadeandalucia.es/boja/2018/55/3'
    },
    decreto251:{
      title:'Decreto 251/2023, de 3 de octubre',
      short:'Decreto 251/2023',
      subtitle:'Modifica el Decreto 155/2018',
      meta:'Texto oficial publicado en BOJA',
      source:'https://www.juntadeandalucia.es/boja/2023/193/2',
      official:'https://www.juntadeandalucia.es/boja/2023/193/2'
    }
  };

  const esc=v=>String(v??'')
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/\"/g,'&quot;')
    .replace(/'/g,'&#039;');

  function style(){
    if(document.getElementById(STYLE_ID)) return;
    const s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=`
      #${CATEGORY_ID}{cursor:pointer!important}
      #${CATEGORY_ID} .normativa-icon{font-size:0!important;color:transparent!important}
      #${CATEGORY_ID} .normativa-icon:before{content:'🎪';font-size:28px;line-height:1}
      #${PANEL_ID}{margin:12px 0 28px;border:1px solid var(--cc-line-strong,#4a9de1);border-radius:18px;background:linear-gradient(145deg,#0a1928,#06111d);box-shadow:0 18px 48px rgba(0,0,0,.38);overflow:hidden}
      #${PANEL_ID}.hidden{display:none!important}
      #${PANEL_ID} *{box-sizing:border-box}
      .esp-head{padding:18px 20px;border-bottom:1px solid var(--cc-line,rgba(103,154,204,.18));background:linear-gradient(145deg,rgba(13,45,72,.55),rgba(7,18,30,.85))}
      .esp-kicker{font-size:10px;font-weight:900;letter-spacing:1.2px;text-transform:uppercase;color:#66c2ff}
      .esp-title{margin:6px 0 4px;color:#f4f7fb;font-size:24px;font-weight:900;line-height:1.12}
      .esp-sub{margin:0;color:#91a5b9;font-size:12px;line-height:1.5}
      .esp-toolbar{display:flex;flex-wrap:wrap;gap:8px;padding:12px 20px;border-bottom:1px solid var(--cc-line,rgba(103,154,204,.18))}
      .esp-btn{min-height:38px;border:1px solid var(--cc-line,rgba(103,154,204,.18));border-radius:10px;padding:8px 12px;background:#091827;color:#d7e3ef;font-size:11px;font-weight:800;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;cursor:pointer}
      .esp-btn:hover{border-color:var(--cc-line-strong,#4a9de1);background:#0d2337}
      .esp-btn.primary{background:#0d66ac;border-color:#238ed6;color:#fff}
      .esp-info{margin:12px 20px;padding:10px 12px;border-left:3px solid #2fa7ff;background:rgba(47,167,255,.055);color:#b9cada;font-size:10px;line-height:1.5}
      .esp-law-list{display:grid;gap:10px;padding:0 20px 20px}
      .esp-law{border:1px solid var(--cc-line,rgba(103,154,204,.18));border-radius:14px;background:linear-gradient(145deg,#0b1b2d,#07121f);padding:14px}
      .esp-law h3{margin:0 0 5px;color:#f4f7fb;font-size:15px;font-weight:900}
      .esp-law p{margin:0;color:#91a5b9;font-size:11px;line-height:1.5}
      .esp-law-meta{margin-top:6px;color:#5aaeff;font-size:9px;font-weight:700}
      .esp-law-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
      .esp-view{padding:0 20px 20px}
      .esp-view.hidden{display:none!important}
      .esp-view-title{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;margin:2px 0 10px}
      .esp-view-title strong{color:#66c2ff;font-size:14px}
      .esp-view-title span{color:#91a5b9;font-size:9px}
      .esp-article-tools{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 10px}
      .esp-article-tools button{border:1px solid var(--cc-line,rgba(103,154,204,.18));border-radius:8px;padding:6px 8px;background:#091827;color:#91d1ff;font-size:9px;font-weight:800;cursor:pointer}
      .esp-text{border:1px solid var(--cc-line,rgba(103,154,204,.18));border-radius:14px;background:#050e18;color:#d9e5ef;padding:16px;white-space:pre-wrap;overflow:auto;max-height:70vh;font:400 11px/1.65 Inter,Segoe UI,Roboto,Arial,sans-serif}
      .esp-text .esp-mark{display:block;margin:16px 0 7px;color:#66c2ff;font-weight:900;font-size:12px}
      .esp-status{padding:24px 12px;text-align:center;color:#91a5b9;font-size:11px}
      .esp-error{padding:14px;border:1px solid rgba(239,89,104,.28);border-radius:12px;background:rgba(239,89,104,.05);color:#ffdbe0;font-size:10px;line-height:1.5}
      @media(max-width:640px){
        .esp-title{font-size:20px}
        .esp-law-actions .esp-btn{flex:1;min-width:140px}
        .esp-view{padding-left:12px;padding-right:12px}
        .esp-text{max-height:66vh;font-size:10px}
      }
    `;
    document.head.appendChild(s);
  }

  function host(){return document.getElementById('normativaList')||document.querySelector('#section-normativa .normativa-list')}
  function section(){return document.getElementById('section-normativa')}

  function removeStandalone(){
    const h=host(); if(!h) return;
    [...h.querySelectorAll('.normativa-card,.cc-law-card')].forEach(c=>{
      if(c.id===CATEGORY_ID) return;
      const text=(c.dataset.law||c.querySelector('h3')?.textContent||c.textContent||'').toLowerCase();
      if(text.includes('ley 13/1999')||text.includes('decreto 155/2018')||text.includes('decreto 251/2023')) c.remove();
    });
  }

  function card(){
    const h=host(); if(!h) return null;
    let c=document.getElementById(CATEGORY_ID);
    if(!c){
      c=document.createElement('div');
      c.id=CATEGORY_ID;
      c.className='normativa-card cc-law-card';
      c.dataset.law='Espectáculos Públicos';
      c.setAttribute('role','button');
      c.setAttribute('tabindex','0');
      c.innerHTML=`<div class="normativa-icon">🎪</div><div class="normativa-info"><h3>Espectáculos Públicos</h3><p>Ley 13/1999 · Decreto 155/2018 · Decreto 251/2023</p><span>3 normas · articulado integrado</span></div><button type="button" class="normativa-open" aria-label="Abrir Espectáculos Públicos">Ver normas</button>`;
      const cards=[...h.querySelectorAll('.normativa-card,.cc-law-card')];
      const idx=cards.findIndex(x=>{
        const t=(x.dataset.law||x.querySelector('h3')?.textContent||x.textContent||'').toLowerCase();
        return t.includes('ley 13/1999')||t.includes('decreto 155/2018')||t.includes('decreto 251/2023');
      });
      if(idx>=0) cards[idx].replaceWith(c); else h.appendChild(c);
    }
    bindCard(c);
    return c;
  }

  function bindCard(c){
    if(!c||c.dataset.espBound==='1') return;
    c.dataset.espBound='1';
    c.addEventListener('click',e=>{if(e.target.closest('button,a')){} openCategory()});
    c.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openCategory()}});
  }

  function ensurePanel(){
    let p=document.getElementById(PANEL_ID),s=section();
    if(!s) return null;
    if(!p){p=document.createElement('section');p.id=PANEL_ID;p.className='hidden';const l=host();s.insertBefore(p,l||null)}
    return p;
  }

  function renderCategory(){
    style();
    const p=ensurePanel(); if(!p) return;
    p.innerHTML=`
      <div class="esp-head">
        <div class="esp-kicker">Normativa autonómica · Andalucía</div>
        <h2 class="esp-title">Espectáculos Públicos</h2>
        <p class="esp-sub">Las tres normas principales agrupadas en una sola consulta.</p>
      </div>
      <div class="esp-toolbar">
        <button type="button" class="esp-btn" id="espClose">← Volver a Normativa</button>
      </div>
      <div class="esp-info"><strong>Contenido:</strong> Ley 13/1999, Decreto 155/2018 y Decreto 251/2023. La Ley 13/1999 se consulta íntegramente desde el texto aportado en PDF, consolidado con modificación publicada el 30/04/2014.</div>
      <div class="esp-law-list">
        ${lawCard(LAWS.ley13,'ley13')}
        ${lawCard(LAWS.decreto155,'decreto155')}
        ${lawCard(LAWS.decreto251,'decreto251')}
      </div>
      <div id="espView" class="esp-view hidden"></div>
    `;
    p.querySelector('#espClose')?.addEventListener('click',closeCategory);
    p.querySelectorAll('[data-esp-open]').forEach(b=>b.addEventListener('click',()=>openLaw(b.dataset.espOpen)));
  }

  function lawCard(cfg,id){
    return `<article class="esp-law"><h3>${esc(cfg.title)}</h3><p>${esc(cfg.subtitle)}</p><div class="esp-law-meta">${esc(cfg.meta)}</div><div class="esp-law-actions"><button type="button" class="esp-btn primary" data-esp-open="${esc(id)}">Ver articulado</button><a class="esp-btn" href="${esc(cfg.official)}" target="_blank" rel="noopener noreferrer">↗ Fuente oficial</a></div></article>`;
  }

  async function loadLocalLey13(){
    const cached=localStorage.getItem(LEY13_KEY);
    if(cached&&cached.length>1000) return cached;
    const chunks=[];
    for(const url of LAWS.ley13.localParts){
      const r=await fetch(url,{cache:'no-store'});
      if(!r.ok) throw new Error(`HTTP ${r.status} al cargar ${url}`);
      chunks.push(await r.text());
    }
    const text=chunks.join('\n\n').trim();
    if(text.length<10000) throw new Error('Texto local incompleto');
    try{localStorage.setItem(LEY13_KEY,text)}catch(_){ }
    return text;
  }

  async function loadOfficial(cfg){
    const r=await fetch(cfg.source,{cache:'no-store'});
    if(!r.ok) throw new Error(`HTTP ${r.status}`);
    const html=await r.text();
    const doc=new DOMParser().parseFromString(html,'text/html');
    doc.querySelectorAll('script,style,noscript,nav,header,footer,form').forEach(n=>n.remove());
    const root=doc.querySelector('main,article,#content,.contenido')||doc.body;
    const text=(root?.innerText||root?.textContent||'').replace(/\u00a0/g,' ').replace(/\r/g,'').split('\n').map(x=>x.trim()).join('\n').replace(/\n{3,}/g,'\n\n').trim();
    if(text.length<500) throw new Error('No se ha obtenido texto normativo');
    return text;
  }

  function decorateText(box,text){
    box.innerHTML='';
    const frag=document.createDocumentFragment();
    const lines=text.split('\n');
    for(const line of lines){
      const d=document.createElement('div');
      if(/^Artículo\s+\d+/i.test(line.trim())||/^Disposición\s+/i.test(line.trim())||/^CAPÍTULO\s+/i.test(line.trim())||/^EXPOSICIÓN DE MOTIVOS/i.test(line.trim())) d.className='esp-mark';
      d.textContent=line;
      frag.appendChild(d);
    }
    box.appendChild(frag);
  }

  function articleTools(text,box){
    const tools=document.createElement('div');tools.className='esp-article-tools';
    const articles=text.split('\n').map((x,i)=>({x,i})).filter(o=>/^Artículo\s+\d+/i.test(o.x.trim()));
    articles.slice(0,40).forEach(a=>{
      const b=document.createElement('button');b.type='button';b.textContent=a.x.trim().split('.')[0];
      b.addEventListener('click',()=>{
        const target=Array.from(box.children)[a.i];
        if(target) target.scrollIntoView({behavior:'smooth',block:'start'});
      });
      tools.appendChild(b);
    });
    return tools;
  }

  async function openLaw(id){
    const cfg=LAWS[id],p=ensurePanel(),view=p?.querySelector('#espView');
    if(!cfg||!p||!view) return;
    const list=p.querySelector('.esp-law-list');
    if(list) list.classList.add('hidden');
    view.classList.remove('hidden');
    view.innerHTML=`<div class="esp-toolbar" style="padding-left:0;padding-right:0"><button type="button" class="esp-btn" id="espLawBack">← Volver a las 3 normas</button><a class="esp-btn primary" href="${esc(cfg.official)}" target="_blank" rel="noopener noreferrer">↗ Fuente oficial</a></div><div class="esp-view-title"><strong>${esc(cfg.title)}</strong><span>${esc(cfg.meta)}</span></div><div class="esp-status">Cargando articulado…</div>`;
    view.querySelector('#espLawBack')?.addEventListener('click',()=>{view.classList.add('hidden');if(list) list.classList.remove('hidden')});
    try{
      let text=id==='ley13'?await loadLocalLey13():await loadOfficial(cfg);
      const st=view.querySelector('.esp-status');if(st)st.remove();
      const box=document.createElement('div');box.className='esp-text';decorateText(box,text);view.appendChild(articleTools(text,box));view.appendChild(box);
    }catch(err){
      const st=view.querySelector('.esp-status');
      if(st)st.innerHTML=`<div class="esp-error"><strong>No se ha podido cargar el articulado.</strong><br>${esc(err?.message||'Error desconocido')}<br><br>Utiliza «Fuente oficial» para abrir la norma original.</div>`;
      console.error('Centinela — Espectáculos Públicos:',err);
    }
  }

  function openCategory(){
    const p=ensurePanel(),l=host();if(!p)return;
    renderCategory();
    if(l)l.style.setProperty('display','none','important');
    p.classList.remove('hidden');
    p.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function closeCategory(){
    const p=document.getElementById(PANEL_ID),l=host();
    if(p)p.classList.add('hidden');
    if(l)l.style.removeProperty('display');
  }

  function boot(){
    style();
    removeStandalone();
    card();
    const h=host();
    if(h){
      const mo=new MutationObserver(()=>{removeStandalone();card()});
      mo.observe(h,{childList:true});
    }
    setTimeout(()=>{removeStandalone();card()},250);
    setTimeout(()=>{removeStandalone();card()},900);
    setTimeout(()=>{removeStandalone();card()},1800);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
