/* ============================================================
   CENTINELA CODE — DECRETO 155/2018
   Integración del texto oficial del BOJA dentro de
   Normativa > Espectáculos Públicos.
   Fuente solicitada: BOJA 2018/150/13.
   ============================================================ */
(function(){
  'use strict';

  const PANEL_ID='centinela-espectaculos-publicos-panel';
  const CACHE_KEY='cc-esp-decreto155-boja-2018-v2';
  const SOURCE='https://www.juntadeandalucia.es/boja/2018/150/13';
  const CONSOLIDATED='https://ws040.juntadeandalucia.es/sedeboja/lconsolidada/eli/es-an/d/2018/07/31/155/con/20231007/spa/html/LE0000626444_20231007.html';

  const INDEX=[
    'Artículo 1. Objeto y ámbito de aplicación.',
    'Artículo 2. Condiciones generales.',
    'Artículo 3. Modalidades de espectáculos públicos, actividades recreativas y tipos de establecimientos públicos.',
    'Artículo 4. Modalidades de espectáculos públicos y actividades recreativas.',
    'Artículo 5. Tipos de establecimientos públicos.',
    'Artículo 6. Aforo de los establecimientos públicos.',
    'Artículo 7. Régimen de apertura o instalación de establecimientos públicos.',
    'Artículo 8. Contenido de las autorizaciones.',
    'Artículo 9. Requisitos de la declaración responsable de apertura de establecimientos públicos.',
    'Artículo 10. Establecimientos dedicados al desarrollo de más de un tipo de espectáculo público o actividad recreativa.',
    'Artículo 11. Terrazas y veladores para el consumo de bebidas y comidas en establecimientos de hostelería.',
    'Artículo 12. Terrazas y veladores para el consumo de bebidas y comidas en establecimientos de ocio y esparcimiento.',
    'Artículo 13. Instalación de equipos de reproducción o amplificación sonora o audiovisuales en el interior de establecimientos de hostelería y de ocio y esparcimiento.',
    'Artículo 14. Actuaciones en directo y actuaciones en directo de pequeño formato en el interior de establecimientos de hostelería y de ocio y esparcimiento.',
    'Artículo 15. Instalación de equipos de reproducción o amplificación sonora o audiovisuales, actuaciones en directo y actuaciones en directo de pequeño formato en terrazas y veladores de establecimientos de hostelería y de ocio y esparcimiento.',
    'Artículo 16. Información de las condiciones de los establecimientos públicos.',
    'Artículo 17. Régimen general de horarios de cierre.',
    'Artículo 18. Régimen general de horarios de apertura.',
    'Artículo 19. Otros horarios de apertura y cierre de establecimientos públicos.',
    'Artículo 20. Otras especificaciones en materia de horarios.',
    'Artículo 21. Desalojo.',
    'Artículo 22. Horarios de las terrazas y veladores de los establecimientos de hostelería y de ocio y esparcimiento.',
    'Artículo 23. Ampliación municipal de horarios generales de cierre.',
    'Artículo 24. Restricción municipal de horarios generales de apertura y cierre.',
    'Artículo 25. Régimen especial de horarios de cierre de establecimientos de hostelería en municipios turísticos y zonas de gran afluencia turística a efectos de horarios comerciales.',
    'Artículo 26. Régimen especial de horarios de cierre de las terrazas y veladores de establecimientos de hostelería en municipios turísticos y zonas de gran afluencia turística a efectos de horarios comerciales.',
    'Artículo 27. Otros regímenes especiales de horarios de establecimientos de hostelería.',
    'Artículo 28. Normas comunes a los establecimientos de hostelería acogidos a horario especial.',
    'Artículo 29. Información del horario de apertura y cierre del establecimiento público.'
  ];

  const ADDITIONAL=[
    '10 disposiciones adicionales',
    '5 disposiciones transitorias',
    '1 disposición derogatoria',
    '3 disposiciones finales',
    'ANEXO — Catálogo de Espectáculos Públicos, Actividades Recreativas y Establecimientos Públicos de la Comunidad Autónoma de Andalucía.'
  ];

  const cssId='cc-esp-155-style-v2';
  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;').replace(/'/g,'&#039;')}

  function installStyle(){
    if(document.getElementById(cssId)) return;
    const s=document.createElement('style');
    s.id=cssId;
    s.textContent=`
      .cc155-sourcebar{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 12px}
      .cc155-sourcebar a,.cc155-sourcebar button{min-height:36px;padding:8px 11px;border-radius:9px;border:1px solid rgba(103,154,204,.22);background:#091827;color:#d7e3ef;font-size:10px;font-weight:800;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;cursor:pointer}
      .cc155-sourcebar a.primary,.cc155-sourcebar button.primary{background:#0d66ac;border-color:#238ed6;color:#fff}
      .cc155-box{border:1px solid rgba(103,154,204,.18);border-radius:14px;background:#050e18;color:#d9e5ef;padding:14px;max-height:70vh;overflow:auto;white-space:pre-wrap;font:400 11px/1.65 Inter,Segoe UI,Roboto,Arial,sans-serif}
      .cc155-box h4{margin:16px 0 7px;color:#66c2ff;font-size:12px}
      .cc155-meta{padding:10px 12px;margin:0 0 12px;border-left:3px solid #2fa7ff;background:rgba(47,167,255,.055);color:#b9cada;font-size:10px;line-height:1.5}
      .cc155-index{display:grid;gap:5px;margin:0 0 12px}
      .cc155-index button{border:1px solid rgba(103,154,204,.16);border-radius:8px;background:#091827;color:#9fd6ff;padding:7px 9px;text-align:left;font-size:9px;cursor:pointer}
      .cc155-status{padding:24px 10px;text-align:center;color:#91a5b9;font-size:10px}
    `;
    document.head.appendChild(s);
  }

  function panel(){return document.getElementById(PANEL_ID)}

  function findLawCard(p){
    return [...p.querySelectorAll('.esp-law')].find(c=>/Decreto 155\/2018/i.test(c.textContent||''));
  }

  function indexHtml(){
    return `<div class="cc155-index">${INDEX.map((x,i)=>`<button type="button" data-cc155-index="${i}">${esc(x)}</button>`).join('')}</div><div class="cc155-meta"><strong>Fuente:</strong> BOJA núm. 150, de 03/08/2018 · disposición 13.<br><strong>Incluye:</strong> 29 artículos, disposiciones adicionales, transitorias y finales, y el Anexo del Catálogo.</div>`;
  }

  function parseOfficial(html){
    const doc=new DOMParser().parseFromString(html,'text/html');
    doc.querySelectorAll('script,style,noscript,nav,header,footer,form').forEach(n=>n.remove());
    const root=doc.querySelector('main,article,#content,.contenido')||doc.body;
    return (root?.innerText||root?.textContent||'')
      .replace(/\u00a0/g,' ')
      .replace(/\r/g,'')
      .split('\n')
      .map(x=>x.trim())
      .join('\n')
      .replace(/\n{3,}/g,'\n\n')
      .trim();
  }

  function decorate(box,text){
    box.innerHTML='';
    const frag=document.createDocumentFragment();
    text.split('\n').forEach(line=>{
      const d=document.createElement('div');
      if(/^Artículo\s+\d+/i.test(line)||/^Disposición\s+(adicional|transitoria|derogatoria|final)/i.test(line)||/^CAPÍTULO\s+/i.test(line)||/^ANEXO$/i.test(line)||/^[IVX]+\.[0-9]+\./.test(line)){
        d.className='cc155-heading';
        d.style.cssText='margin:16px 0 7px;color:#66c2ff;font-weight:900;font-size:12px;';
      }
      d.textContent=line;
      frag.appendChild(d);
    });
    box.appendChild(frag);
  }

  async function open155(){
    const p=panel();
    if(!p) return;
    installStyle();
    const list=p.querySelector('.esp-law-list');
    const view=p.querySelector('#espView');
    if(!view) return;
    if(list) list.classList.add('hidden');
    view.classList.remove('hidden');
    view.innerHTML=`
      <div class="cc155-sourcebar">
        <button type="button" id="cc155Back">← Volver a las 3 normas</button>
        <a class="primary" href="${SOURCE}" target="_blank" rel="noopener noreferrer">↗ BOJA 2018/150/13</a>
        <a href="${CONSOLIDATED}" target="_blank" rel="noopener noreferrer">↗ Texto consolidado</a>
      </div>
      <div class="esp-view-title"><strong>Decreto 155/2018, de 31 de julio</strong><span>Fuente oficial de la Junta de Andalucía</span></div>
      <div class="cc155-status">Cargando el articulado oficial…</div>
    `;
    view.querySelector('#cc155Back')?.addEventListener('click',()=>{view.classList.add('hidden');if(list) list.classList.remove('hidden')});

    try{
      let text='';
      try{text=localStorage.getItem(CACHE_KEY)||''}catch(_){ }
      if(!text||text.length<500){
        const r=await fetch(SOURCE,{cache:'no-store'});
        if(!r.ok) throw new Error('HTTP '+r.status);
        text=parseOfficial(await r.text());
        if(text.length<500) throw new Error('Texto oficial insuficiente');
        try{localStorage.setItem(CACHE_KEY,text)}catch(_){ }
      }
      const old=view.querySelector('.cc155-status');
      old?.remove();
      const index=document.createElement('div');
      index.innerHTML=indexHtml();
      view.appendChild(index.firstElementChild);
      view.appendChild(index.lastElementChild);
      const box=document.createElement('div');box.className='cc155-box';view.appendChild(box);
      decorate(box,text);
      view.querySelectorAll('[data-cc155-index]').forEach((b,i)=>b.addEventListener('click',()=>{
        const target=Array.from(box.children).find(el=>el.textContent.trim().startsWith('Artículo '+(i+1)+'.'));
        if(target) target.scrollIntoView({behavior:'smooth',block:'start'});
        else box.scrollTo({top:0,behavior:'smooth'});
      }));
    }catch(err){
      const st=view.querySelector('.cc155-status');
      if(st) st.outerHTML=`<div class="esp-error"><strong>No se ha podido descargar el texto automáticamente desde BOJA.</strong><br>La fuente oficial sigue disponible arriba. Se muestra además el índice íntegro del Decreto para que la consulta no quede vacía.<br><br><strong>Motivo técnico:</strong> ${esc(err?.message||err)}</div>${indexHtml()}`;
    }
  }

  function bind(){
    const p=panel();
    if(!p) return;
    const law=findLawCard(p);
    if(!law) return;
    const meta=law.querySelector('.esp-law-meta');
    if(meta){
      meta.textContent='Fuente oficial: BOJA núm. 150 · 03/08/2018 · texto íntegro de la disposición';
    }
    const official=law.querySelector('a');
    if(official){official.href=SOURCE;official.textContent='↗ BOJA 2018/150/13';official.target='_blank';official.rel='noopener noreferrer'}
    const btn=law.querySelector('[data-esp-open="decreto155"]');
    if(btn&&btn.dataset.cc155Bound!=='1'){
      const clone=btn.cloneNode(true);
      clone.dataset.cc155Bound='1';
      clone.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();open155()});
      btn.replaceWith(clone);
    }
  }

  const obs=new MutationObserver(()=>bind());
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>{obs.observe(document.body,{childList:true,subtree:true});bind()}, {once:true});
  else {obs.observe(document.body,{childList:true,subtree:true});bind()}
  setInterval(bind,1500);
})();
