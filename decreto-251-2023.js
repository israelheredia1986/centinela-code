/* ============================================================
   CENTINELA CODE — ESPECTÁCULOS PÚBLICOS
   Versión estable: consulta local, sin fetch obligatorio.
   Ley 13/1999 + Decreto 155/2018 + Decreto 251/2023.
   ============================================================ */
(function(){
  'use strict';

  const CARD_ID='centinela-espectaculos-publicos-card';
  const PANEL_ID='centinela-espectaculos-publicos-panel';
  const STYLE_ID='centinela-espectaculos-publicos-style-v5';

  const ARTICLE_INDEX_155=[
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

  const DECRETO_251_TEXT=`Decreto 251/2023, de 3 de octubre, por el que se modifica el Decreto 155/2018, de 31 de julio, por el que se aprueba el Catálogo de Espectáculos Públicos, Actividades Recreativas y Establecimientos Públicos de Andalucía y se regulan sus modalidades, régimen de apertura o instalación y horarios de apertura y cierre.

Artículo único. Modificación del Decreto 155/2018, de 31 de julio.

El Decreto 155/2018 queda modificado del siguiente modo:

Uno. Se modifica la disposición adicional tercera.

Disposición adicional tercera. Instalación excepcional de equipos de reproducción o amplificación sonora o audiovisuales y actuaciones en directo de pequeño formato en terrazas y veladores de establecimientos de hostelería.

1. Los Ayuntamientos podrán autorizar por periodos iguales o inferiores a cuatro meses dentro del año natural la instalación y utilización de equipos de reproducción o amplificación sonora o audiovisuales así como el desarrollo de actuaciones en directo de pequeño formato en terrazas y veladores de establecimientos de hostelería situados preferentemente en áreas no declaradas zonas acústicas especiales y en los sectores de suelo indicados por la norma.

En determinados municipios costeros que tengan la declaración de municipio turístico o de zona de gran afluencia turística, podrán autorizarse por periodos iguales o inferiores a seis meses dentro del año natural.

2. Las autorizaciones municipales deberán establecer las restricciones, límites técnicos y condiciones de instalación y funcionamiento precisos para garantizar los derechos a la salud y al descanso de los ciudadanos.

3. El horario de funcionamiento se determinará en la resolución municipal, sin que pueda iniciarse antes de las 15:00 ni superar las 24:00 horas. En los municipios costeros habilitados podrá ampliarse el inicio hasta las 13:00 horas, sin superar las 24:00 horas.

Dos. Se añade una disposición adicional undécima.

Disposición adicional undécima. Seguros de responsabilidad civil de los establecimientos de hostelería con música y de los establecimientos especiales para festivales.

1. Para los establecimientos de hostelería con música del epígrafe III.2.7.b), las sumas aseguradas serán las establecidas en el punto 4.1 del anexo del Decreto 109/2005.

2. Para los establecimientos especiales para festivales del epígrafe III.2.9), las sumas aseguradas serán las previstas en el punto 4.2 del anexo del Decreto 109/2005.

Disposición derogatoria única. Derogación normativa.

Quedan derogadas cuantas disposiciones de igual o inferior rango se opongan a lo dispuesto en este decreto.

Disposición final primera. Desarrollo y ejecución.

Se autoriza a la persona titular de la Consejería competente para dictar las disposiciones necesarias en desarrollo y ejecución del presente decreto.

Disposición final segunda. Entrada en vigor.

El presente decreto entrará en vigor el día siguiente al de su publicación en el Boletín Oficial de la Junta de Andalucía.

BOJA nº 193, de 6 de octubre de 2023.`;

  const esc=v=>String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;').replace(/'/g,'&#039;');

  function style(){
    if(document.getElementById(STYLE_ID)) return;
    const s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=`
      #${PANEL_ID}{margin:0 0 18px;border:1px solid var(--cc-line,#1c6a9c);border-radius:18px;background:linear-gradient(145deg,#071726,#03101d);overflow:hidden;box-shadow:0 14px 34px rgba(0,0,0,.45)}
      #${PANEL_ID}.cc-hidden{display:none!important}
      #${PANEL_ID} .esp-head{padding:18px 20px;border-bottom:1px solid var(--cc-line,rgba(103,154,204,.18));background:linear-gradient(145deg,#0a2237,#071321)}
      #${PANEL_ID} .esp-kicker{font-size:10px;font-weight:900;letter-spacing:1.1px;text-transform:uppercase;color:#66c2ff}
      #${PANEL_ID} .esp-title{margin:5px 0 3px;color:#f4f7fb;font-size:23px;font-weight:900}
      #${PANEL_ID} .esp-sub{margin:0;color:#9aabba;font-size:12px;line-height:1.5}
      #${PANEL_ID} .esp-toolbar{display:flex;gap:8px;flex-wrap:wrap;padding:12px 20px;border-bottom:1px solid var(--cc-line,rgba(103,154,204,.18))}
      #${PANEL_ID} button,#${PANEL_ID} a{font:inherit}
      #${PANEL_ID} .esp-btn{min-height:37px;padding:8px 11px;border:1px solid var(--cc-line,rgba(103,154,204,.2));border-radius:10px;background:#0a1a29;color:#d9e6f2;font-size:10px;font-weight:800;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;cursor:pointer}
      #${PANEL_ID} .esp-btn.primary{background:#0d66ac;border-color:#238ed6;color:#fff}
      #${PANEL_ID} .esp-laws{display:grid;gap:10px;padding:14px 20px 20px}
      #${PANEL_ID} .esp-law{padding:14px;border:1px solid var(--cc-line,rgba(103,154,204,.18));border-radius:15px;background:linear-gradient(145deg,#0a1928,#07121d)}
      #${PANEL_ID} .esp-law h3{margin:0;color:#f4f7fb;font-size:15px;font-weight:900}
      #${PANEL_ID} .esp-law p{margin:5px 0 0;color:#9aabba;font-size:11px;line-height:1.45}
      #${PANEL_ID} .esp-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:12px}
      #${PANEL_ID} .esp-view{padding:14px 20px 20px}
      #${PANEL_ID} .esp-view.cc-hidden{display:none!important}
      #${PANEL_ID} .esp-view-head{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap;margin-bottom:12px}
      #${PANEL_ID} .esp-view-title{color:#66c2ff;font-size:15px;font-weight:900}
      #${PANEL_ID} .esp-note{padding:10px 12px;margin-bottom:10px;border-left:3px solid #2fa7ff;background:rgba(47,167,255,.055);border-radius:0 9px 9px 0;color:#b9cad9;font-size:10px;line-height:1.5}
      #${PANEL_ID} .esp-index{display:grid;gap:6px;margin-bottom:12px}
      #${PANEL_ID} .esp-index button{border:1px solid var(--cc-line,rgba(103,154,204,.18));border-radius:9px;background:#081827;color:#a8d9ff;padding:8px 10px;text-align:left;font-size:10px;cursor:pointer}
      #${PANEL_ID} .esp-text{max-height:66vh;overflow:auto;padding:16px;border:1px solid var(--cc-line,rgba(103,154,204,.18));border-radius:14px;background:#050d16;color:#d9e5ef;white-space:pre-wrap;font:400 11px/1.65 system-ui,-apple-system,'Segoe UI',sans-serif}
      #${PANEL_ID} .esp-text .cc-heading{display:block;margin:16px 0 7px;color:#66c2ff;font-size:12px;font-weight:900}
      @media(max-width:650px){#${PANEL_ID} .esp-view{padding:12px}.esp-actions .esp-btn{flex:1;min-width:140px}}
    `;
    document.head.appendChild(s);
  }

  function host(){return document.getElementById('normativaList')||document.querySelector('#section-normativa .normativa-list')}
  function section(){return document.getElementById('section-normativa')}

  function removeOldCards(list){
    if(!list)return;
    [...list.querySelectorAll('.normativa-card,.cc-law-card')].forEach(el=>{
      if(el.id===CARD_ID)return;
      const t=(el.innerText||'').toLowerCase();
      if(t.includes('ley 13/1999')||t.includes('decreto 155/2018')||t.includes('decreto 251/2023')) el.remove();
    });
  }

  function ensureCard(){
    style();
    const list=host();
    if(!list)return;
    removeOldCards(list);
    let c=document.getElementById(CARD_ID);
    if(!c){
      c=document.createElement('div');
      c.id=CARD_ID;
      c.className='normativa-card cc-law-card';
      c.innerHTML=`<div class="normativa-icon">🎪</div><div class="normativa-info"><h3>Espectáculos Públicos</h3><p>Ley 13/1999 · Decreto 155/2018 · Decreto 251/2023</p><span>3 normas · articulado integrado</span></div><button type="button" class="normativa-open">Ver normas</button>`;
      list.appendChild(c);
    }
    if(c.dataset.ccBound==='1')return;
    c.dataset.ccBound='1';
    const open=e=>{e.preventDefault();e.stopPropagation();openCategory()};
    c.addEventListener('click',open);
    c.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){open(e)}});
    c.querySelector('button')?.addEventListener('click',open);
  }

  function panel(){
    const s=section();
    if(!s)return null;
    let p=document.getElementById(PANEL_ID);
    if(!p){p=document.createElement('section');p.id=PANEL_ID;p.className='cc-hidden';const list=host();s.insertBefore(p,list||null)}
    return p;
  }

  function renderCategory(p){
    p.innerHTML=`
      <div class="esp-head"><div class="esp-kicker">Normativa autonómica · Andalucía</div><h2 class="esp-title">Espectáculos Públicos</h2><p class="esp-sub">Consulta local de las tres normas principales.</p></div>
      <div class="esp-toolbar"><button type="button" class="esp-btn" data-close>← Volver a Normativa</button></div>
      <div class="esp-laws">
        ${law('ley13','📜','Ley 13/1999, de 15 de diciembre','Espectáculos Públicos y Actividades Recreativas de Andalucía','Texto íntegro incorporado localmente')}
        ${law('decreto155','📘','Decreto 155/2018, de 31 de julio','Catálogo de Espectáculos Públicos, Actividades Recreativas y Establecimientos Públicos de Andalucía','29 artículos · índice completo · fuente BOJA 2018/150/13')}
        ${law('decreto251','📑','Decreto 251/2023, de 3 de octubre','Modifica el Decreto 155/2018','Artículo único · disposiciones adicionales, derogatoria y finales')}
      </div>
      <div class="esp-view cc-hidden" data-view></div>`;
    p.querySelector('[data-close]')?.addEventListener('click',closeCategory);
    p.querySelectorAll('[data-law]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openLaw(b.dataset.law)}));
  }

  function law(id,icon,title,sub,meta){
    const urls={
      ley13:'https://www.boe.es/eli/es-an/l/1999/12/15/13/con/20140430',
      decreto155:'https://www.juntadeandalucia.es/boja/2018/150/13',
      decreto251:'https://www.juntadeandalucia.es/boja/2023/193/2'
    };
    return `<article class="esp-law"><h3>${icon} ${esc(title)}</h3><p>${esc(sub)}</p><div class="esp-note" style="margin:8px 0 0">${esc(meta)}</div><div class="esp-actions"><button type="button" class="esp-btn primary" data-law="${id}">Ver articulado</button><a class="esp-btn" href="${urls[id]}" target="_blank" rel="noopener noreferrer">↗ Fuente oficial</a></div></article>`;
  }

  function openCategory(){
    const p=panel(),list=host();
    if(!p)return;
    renderCategory(p);p.classList.remove('cc-hidden');
    if(list)list.style.setProperty('display','none','important');
    p.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function closeCategory(){
    const p=document.getElementById(PANEL_ID),list=host();
    p?.classList.add('cc-hidden');
    if(list)list.style.removeProperty('display');
  }

  function showText(view,title,text,back){
    view.innerHTML=`<div class="esp-view-head"><div class="esp-view-title">${esc(title)}</div><div><button type="button" class="esp-btn" data-back>← Volver</button></div></div>`;
    view.querySelector('[data-back]')?.addEventListener('click',()=>back());
    const note=document.createElement('div');note.className='esp-note';note.textContent='Texto disponible localmente en Centinela Code. La fuente oficial permanece accesible arriba.';view.appendChild(note);
    const box=document.createElement('div');box.className='esp-text';view.appendChild(box);
    const frag=document.createDocumentFragment();
    String(text).split('\n').forEach(line=>{const d=document.createElement('div');if(/^Artículo\s+\d+|^Artículo único|^Disposición\s+/i.test(line.trim()))d.className='cc-heading';d.textContent=line;frag.appendChild(d)});
    box.appendChild(frag);
  }

  async function openLaw(id){
    const p=panel();if(!p)return;
    const laws=p.querySelector('.esp-laws'),view=p.querySelector('[data-view]');
    if(!view)return;
    laws?.classList.add('cc-hidden');view.classList.remove('cc-hidden');

    if(id==='ley13'){
      try{
        const parts=[];
        for(let i=1;i<=8;i++){
          const r=await fetch(`./data/ley_13_1999_2014_p${i}.txt`,{cache:'no-store'});
          if(!r.ok)throw new Error('No se pudo cargar fragmento local '+i);
          parts.push(await r.text());
        }
        showText(view,'Ley 13/1999, de 15 de diciembre',parts.join('\n\n'),()=>{view.classList.add('cc-hidden');laws?.classList.remove('cc-hidden')});
      }catch(err){
        view.innerHTML=`<div class="esp-view-head"><div class="esp-view-title">Ley 13/1999</div><button type="button" class="esp-btn" data-back>← Volver</button></div><div class="esp-note">El texto local de la Ley 13/1999 no está disponible en este momento. Puedes abrir la fuente oficial.</div><a class="esp-btn primary" href="https://www.boe.es/eli/es-an/l/1999/12/15/13/con/20140430" target="_blank" rel="noopener noreferrer">↗ Abrir texto oficial</a>`;
        view.querySelector('[data-back]')?.addEventListener('click',()=>{view.classList.add('cc-hidden');laws?.classList.remove('cc-hidden')});
      }
      return;
    }

    if(id==='decreto155'){
      const idx=ARTICLE_INDEX_155.map((x,i)=>`<button type="button" data-pos="${i}">${esc(x)}</button>`).join('');
      const body=`DECRETO 155/2018 — ÍNDICE DEL ARTICULADO OFICIAL\n\n${ARTICLE_INDEX_155.join('\n')}\n\nDISPOSICIONES ADICIONALES\n10 disposiciones adicionales\n\nDISPOSICIONES TRANSITORIAS\n5 disposiciones transitorias\n\nDISPOSICIÓN DEROGATORIA\n1 disposición derogatoria\n\nDISPOSICIONES FINALES\n3 disposiciones finales\n\nANEXO\nCatálogo de Espectáculos Públicos, Actividades Recreativas y Establecimientos Públicos de la Comunidad Autónoma de Andalucía.`;
      view.innerHTML=`<div class="esp-view-head"><div class="esp-view-title">Decreto 155/2018, de 31 de julio</div><div><button type="button" class="esp-btn" data-back>← Volver</button><a class="esp-btn primary" href="https://www.juntadeandalucia.es/boja/2018/150/13" target="_blank" rel="noopener noreferrer">↗ BOJA 2018/150/13</a></div></div><div class="esp-note"><strong>Articulado:</strong> 29 artículos y sus disposiciones. El BOJA oficial contiene el texto íntegro. En esta ficha se muestra el índice local para localizar rápidamente el artículo y se ofrece acceso directo al texto oficial.</div><div class="esp-index">${idx}</div><div class="esp-text" id="cc155text"></div>`;
      const box=view.querySelector('#cc155text');
      box.textContent=body;
      view.querySelector('[data-back]')?.addEventListener('click',()=>{view.classList.add('cc-hidden');laws?.classList.remove('cc-hidden')});
      view.querySelectorAll('[data-pos]').forEach(b=>b.addEventListener('click',()=>{const target=Array.from(box.children).find(x=>x.textContent.trim().startsWith('Artículo '+(Number(b.dataset.pos)+1)+'.'));if(target)target.scrollIntoView({behavior:'smooth',block:'start'});else box.scrollTo({top:0,behavior:'smooth'})}));
      return;
    }

    if(id==='decreto251'){
      showText(view,'Decreto 251/2023, de 3 de octubre',DECRETO_251_TEXT,()=>{view.classList.add('cc-hidden');laws?.classList.remove('cc-hidden')});
    }
  }

  function boot(){
    ensureCard();
    let q=false;
    const run=()=>{if(q)return;q=true;requestAnimationFrame(()=>{q=false;ensureCard();})};
    const obs=new MutationObserver(run);
    obs.observe(document.getElementById('section-normativa')||document.body,{childList:true,subtree:true});
    setInterval(ensureCard,2200);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
