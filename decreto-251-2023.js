/* ============================================================
   CENTINELA CODE — ESPECTÁCULOS PÚBLICOS
   Categoría propia dentro de Normativa.
   Contiene: Ley 13/1999, Decreto 155/2018 y Decreto 251/2023.
   Cada norma dispone de visor de articulado y enlace oficial.
   ============================================================ */
(function(){
  'use strict';

  const CATEGORY_ID='centinela-espectaculos-publicos-card';
  const PANEL_ID='centinela-espectaculos-publicos-panel';
  const STYLE_ID='centinela-espectaculos-publicos-style';

  const LAWS={
    ley13:{
      title:'Ley 13/1999, de 15 de diciembre',
      short:'Ley 13/1999',
      subtitle:'Espectáculos Públicos y Actividades Recreativas de Andalucía',
      source:'https://ws040.juntadeandalucia.es/sedeboja/lconsolidada/eli/es-an/l/1999/12/15/13/con/20240217/spa/html/LE0000025329_20240217.html',
      official:'https://www.juntadeandalucia.es/eboja/1999/150/2'
    },
    decreto155:{
      title:'Decreto 155/2018, de 31 de julio',
      short:'Decreto 155/2018',
      subtitle:'Catálogo de Espectáculos Públicos, Actividades Recreativas y Establecimientos Públicos de Andalucía',
      source:'https://ws040.juntadeandalucia.es/sedeboja/lconsolidada/eli/es-an/d/2018/07/31/155/con/20231007/spa/html/LE0000626444_20231007.html',
      official:'https://www.juntadeandalucia.es/boja/2018/55/3'
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

  function style(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=`
      #${CATEGORY_ID}{cursor:pointer;}
      #${CATEGORY_ID} .normativa-icon{font-size:30px!important;display:grid!important;place-items:center!important;color:#61c9ff!important;}
      #${PANEL_ID}{margin:12px 0 28px;border:1px solid rgba(69,190,255,.58);border-radius:22px;background:linear-gradient(145deg,rgba(2,16,29,.98),rgba(3,31,51,.96));box-shadow:0 16px 42px rgba(0,0,0,.45);overflow:hidden;}
      #${PANEL_ID}.hidden{display:none!important;}
      .esp-head{padding:18px;border-bottom:1px solid rgba(70,172,235,.18);background:linear-gradient(120deg,rgba(13,82,132,.24),transparent)}
      .esp-kicker{color:#5bc2ff;text-transform:uppercase;font-size:9px;font-weight:900;letter-spacing:1.3px}
      .esp-title{margin:5px 0;color:#f7fbff;font-size:22px;line-height:1.08;font-weight:950}
      .esp-sub{margin:0;color:#abc3d7;font-size:10px;line-height:1.5}
      .esp-actions,.esp-law-actions{display:flex;flex-wrap:wrap;gap:8px;padding:12px;border-bottom:1px solid rgba(70,172,235,.12)}
      .esp-btn{border:1px solid #2a709f;border-radius:11px;padding:9px 11px;background:#061a2b;color:#d9efff;font-size:9px;font-weight:900;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;gap:6px}
      .esp-btn.primary{background:linear-gradient(180deg,#087fe8,#0757ae);border-color:#46b7ff;color:#fff}
      .esp-laws{padding:12px;display:grid;gap:9px}
      .esp-law{border:1px solid rgba(45,113,159,.38);border-radius:14px;background:linear-gradient(145deg,rgba(6,30,49,.84),rgba(2,13,23,.96));padding:13px}
      .esp-law h3{margin:0 0 5px;color:#f4fbff;font-size:13px;font-weight:950}
      .esp-law p{margin:0;color:#a9bfd0;font-size:9px;line-height:1.45}
      .esp-law .esp-law-actions{padding:10px 0 0;border:0}
      .esp-law .esp-btn{flex:1}
      .esp-note{margin:0 12px 12px;padding:10px 11px;border-left:3px solid #44b8ff;background:rgba(16,105,176,.08);color:#b7cbd9;font-size:9px;line-height:1.5}
      .esp-view{padding:12px}
      .esp-view-head{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:9px}
      .esp-view-head strong{color:#63c6ff;font-size:12px}
      .esp-view-head span{color:#91aec2;font-size:8px}
      .esp-text{padding:14px;border:1px solid rgba(45,113,159,.34);border-radius:14px;background:linear-gradient(145deg,rgba(6,30,49,.82),rgba(2,13,23,.96));color:#d5e3ec;font:400 10px/1.62 system-ui,-apple-system,Segoe UI,sans-serif;white-space:pre-wrap;overflow-wrap:anywhere;max-height:68vh;overflow:auto}
      .esp-loading{padding:30px 12px;text-align:center;color:#a9bfd0;font-size:10px}
      .esp-error{padding:13px;border:1px solid rgba(255,82,101,.32);border-radius:13px;background:rgba(100,18,30,.16);color:#ffd8de;font-size:10px;line-height:1.5}
      .esp-frame{width:100%;height:70vh;border:1px solid rgba(45,113,159,.35);border-radius:13px;background:#fff}
      @media(max-width:560px){.esp-title{font-size:19px}.esp-btn{min-width:0}.esp-law .esp-btn{width:100%}.esp-frame{height:72vh}}
    `;
    document.head.appendChild(s);
  }

  function list(){return document.getElementById('normativaList')||document.querySelector('#section-normativa .normativa-list')}
  function section(){return document.getElementById('section-normativa')}

  function categoryCard(){
    const host=list();
    if(!host)return null;
    let card=document.getElementById(CATEGORY_ID);
    if(card)return card;
    card=document.createElement('div');
    card.id=CATEGORY_ID;
    card.className='normativa-card cc-law-card';
    card.dataset.law='Espectáculos Públicos';
    card.setAttribute('role','button');
    card.setAttribute('tabindex','0');
    card.innerHTML=`<div class="normativa-icon">🎪</div><div class="normativa-info"><h3>Espectáculos Públicos</h3><p>Ley 13/1999 · Decreto 155/2018 · Decreto 251/2023</p><span>3 normas · articulado disponible</span></div><button type="button" class="normativa-open" aria-label="Abrir Espectáculos Públicos">Ver normas</button>`;
    const cards=[...host.querySelectorAll('.normativa-card,.cc-law-card')];
    const first=cards.find(c=>{
      const t=(c.dataset.law||c.querySelector('h3')?.textContent||'').toLowerCase();
      return t.includes('decreto 155/2018')||t.includes('ley 13/1999')||t.includes('decreto 251/2023');
    });
    if(first)first.replaceWith(card); else host.appendChild(card);
    bindCategory(card);
    return card;
  }

  function panel(){
    let p=document.getElementById(PANEL_ID),host=section();
    if(!host)return null;
    if(p)return p;
    p=document.createElement('section');
    p.id=PANEL_ID;p.className='hidden';
    host.insertBefore(p,host.querySelector('.normativa-list')||null);
    return p;
  }

  function renderCategory(){
    style();const p=panel();if(!p)return;
    p.innerHTML=`<div class="esp-head"><div class="esp-kicker">Normativa autonómica · Andalucía</div><h2 class="esp-title">Espectáculos Públicos</h2><p class="esp-sub">Consulta conjunta de las normas principales y su articulado.</p></div><div class="esp-actions"><button type="button" class="esp-btn" id="espBack">← Volver a Normativa</button></div><div class="esp-note"><strong>Contenido:</strong> Ley 13/1999, Decreto 155/2018 y Decreto 251/2023. Cada ficha permite consultar el articulado y abrir la fuente oficial.</div><div class="esp-laws" id="espLaws">${lawCard(LAWS.ley13,'ley13')}${lawCard(LAWS.decreto155,'decreto155')}${lawCard(LAWS.decreto251,'decreto251')}</div><div class="esp-view hidden" id="espView"></div>`;
    p.querySelector('#espBack')?.addEventListener('click',closeCategory);
    p.querySelectorAll('[data-esp-law]').forEach(btn=>btn.addEventListener('click',()=>openLaw(btn.dataset.espLaw)));
  }

  function lawCard(cfg,id){
    return `<article class="esp-law"><h3>${esc(cfg.title)}</h3><p>${esc(cfg.subtitle)}</p><div class="esp-law-actions"><button type="button" class="esp-btn primary" data-esp-law="${id}">Ver articulado</button><a class="esp-btn" href="${cfg.official}" target="_blank" rel="noopener noreferrer">↗ Fuente oficial</a></div></article>`;
  }

  async function openLaw(id){
    const cfg=LAWS[id],p=panel(),view=p?.querySelector('#espView'),laws=p?.querySelector('#espLaws');
    if(!cfg||!p||!view)return;
    laws?.classList.add('hidden');view.classList.remove('hidden');
    view.innerHTML=`<div class="esp-actions" style="padding:0 0 10px;border:0"><button type="button" class="esp-btn" id="espLawBack">← Volver a las 3 normas</button><a class="esp-btn primary" href="${cfg.official}" target="_blank" rel="noopener noreferrer">↗ Fuente oficial</a></div><div class="esp-view-head"><strong>${esc(cfg.title)}</strong><span>${esc(cfg.subtitle)}</span></div><div class="esp-loading">Cargando articulado oficial…</div>`;
    view.querySelector('#espLawBack')?.addEventListener('click',()=>{view.classList.add('hidden');laws?.classList.remove('hidden')});
    try{
      const cached=localStorage.getItem('cc-esp-full-'+id);
      let text=cached&&cached.length>300?cached:'';
      if(!text && id==='decreto251')text=decreto251Text();
      if(!text){
        const res=await fetch(cfg.source,{cache:'no-store'});
        if(!res.ok)throw new Error('HTTP '+res.status);
        const html=await res.text();text=extract(html);
        if(text.length<300)throw new Error('Texto normativo no disponible');
        try{localStorage.setItem('cc-esp-full-'+id,text)}catch(_){ }
      }
      view.querySelector('.esp-loading')?.remove();
      const box=document.createElement('div');box.className='esp-text';box.textContent=text;view.appendChild(box);
    }catch(err){
      view.querySelector('.esp-loading').outerHTML=`<div class="esp-error"><strong>No se ha podido extraer el articulado automáticamente.</strong><br>El texto oficial se muestra debajo dentro del visor para que la consulta no quede sin contenido.</div><iframe class="esp-frame" title="${esc(cfg.title)} — fuente oficial" src="${esc(cfg.source)}"></iframe>`;
      console.warn('Centinela — Espectáculos Públicos:',err);
    }
  }

  function extract(html){
    const doc=new DOMParser().parseFromString(html,'text/html');
    doc.querySelectorAll('script,style,noscript,nav,header,footer,form').forEach(n=>n.remove());
    const root=doc.querySelector('main,article,.main-content,#content,.contenido,body')||doc.body;
    return (root?.innerText||root?.textContent||'').replace(/\u00a0/g,' ').replace(/\r/g,'').split('\n').map(x=>x.trim()).join('\n').replace(/\n{3,}/g,'\n\n').trim();
  }

  function decreto251Text(){
    return ['DECRETO 251/2023, DE 3 DE OCTUBRE','','Artículo único. Modificación del Decreto 155/2018','','El Decreto 155/2018, de 31 de julio, por el que se aprueba el Catálogo de Espectáculos Públicos, Actividades Recreativas y Establecimientos Públicos de Andalucía y se regulan sus modalidades, régimen de apertura o instalación y horarios de apertura y cierre, queda modificado del siguiente modo.','','Uno. Nueva redacción de la disposición adicional tercera','Disposición adicional tercera. Instalación excepcional de equipos de reproducción o amplificación sonora o audiovisuales y actuaciones en directo de pequeño formato en terrazas y veladores de establecimientos de hostelería.','','1. Los Ayuntamientos podrán autorizar por periodos iguales o inferiores a cuatro meses dentro del año natural la instalación y utilización de equipos de reproducción o amplificación sonora o audiovisuales y el desarrollo de actuaciones en directo de pequeño formato, en los términos establecidos por esta disposición.','','2. Las autorizaciones municipales deberán establecer las restricciones, límites técnicos y condiciones de instalación y funcionamiento necesarios para garantizar los derechos a la salud y al descanso de los ciudadanos.','','3. El horario de funcionamiento se determinará en la resolución municipal, sin que en ningún caso pueda iniciarse antes de las 15:00 ni superar las 24:00 horas, con las excepciones previstas para determinados municipios costeros.','','Dos. Nueva disposición adicional undécima','Disposición adicional undécima. Seguros de responsabilidad civil de los establecimientos de hostelería con música y de los establecimientos especiales para festivales.','','1. Cuando se celebren o desarrollen espectáculos públicos y actividades recreativas en establecimientos de hostelería con música, las sumas aseguradas serán las establecidas en el punto 4.1 del anexo del Decreto 109/2005.','','2. Cuando se celebren o desarrollen espectáculos públicos y actividades recreativas en establecimientos especiales para festivales, las sumas aseguradas serán las previstas en el punto 4.2 del anexo del Decreto 109/2005.','','Disposición derogatoria única. Derogación normativa.','','Disposición final primera. Desarrollo y ejecución.','','Disposición final segunda. Entrada en vigor. El decreto entra en vigor el día siguiente al de su publicación en el Boletín Oficial de la Junta de Andalucía.'].join('\n');
  }

  function openCategory(){
    const l=list(),p=panel();if(!p)return;renderCategory();
    l?.style.setProperty('display','none','important');
    document.getElementById('normativaSearch')?.style.setProperty('display','none','important');
    p.classList.remove('hidden');p.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function closeCategory(){
    panel()?.classList.add('hidden');list()?.style.removeProperty('display');document.getElementById('normativaSearch')?.style.removeProperty('display');list()?.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function bindCategory(card){
    if(!card||card.dataset.ccEspBound)return;
    card.dataset.ccEspBound='1';card.addEventListener('click',e=>{if(e.target.closest('a'))return;openCategory()});
    card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openCategory()}});
  }

  function removeOrphanStandaloneCards(){
    const host=list();if(!host)return;
    [...host.querySelectorAll('.normativa-card,.cc-law-card')].forEach(c=>{
      if(c.id===CATEGORY_ID)return;
      const t=(c.dataset.law||c.querySelector('h3')?.textContent||'').toLowerCase();
      if(t.includes('decreto 155/2018')||t.includes('ley 13/1999')||t.includes('decreto 251/2023'))c.remove();
    });
  }

  function boot(){
    style();removeOrphanStandaloneCards();categoryCard();
    let n=0;const timer=setInterval(()=>{removeOrphanStandaloneCards();categoryCard();if(++n>50)clearInterval(timer)},200);
    const s=section();if(s)new MutationObserver(()=>{removeOrphanStandaloneCards();categoryCard()}).observe(s,{childList:true,subtree:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
