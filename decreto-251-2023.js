/* ============================================================
   CENTINELA CODE — DECRETO 251/2023
   Espectáculos públicos y actividades recreativas
   Añade una ficha independiente al catálogo de Normativa.
   No sustituye ni elimina las fichas existentes de 155/2018 y 13/1999.
   ============================================================ */
(function(){
  'use strict';

  const CARD_ID = 'centinela-normativa-decreto-251-2023-card';
  const PANEL_ID = 'centinela-decreto-251-2023-panel';
  const STYLE_ID = 'centinela-decreto-251-2023-style';
  const OFFICIAL_URL = 'https://www.juntadeandalucia.es/boja/2023/193/2';

  const esc = (v) => String(v ?? '')
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#039;');

  function normalizar(v){
    return String(v ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'')
      .toLowerCase();
  }

  const DATA = {
    titulo: 'Decreto 251/2023, de 3 de octubre',
    subtitulo: 'Modifica el Decreto 155/2018 · Espectáculos Públicos y Actividades Recreativas de Andalucía',
    publicacion: 'BOJA núm. 193 · 06/10/2023',
    entradaVigor: '06/10/2023',
    contenido: [
      {
        tipo: 'articulo',
        titulo: 'Artículo único. Modificación del Decreto 155/2018',
        texto: 'El Decreto 155/2018, de 31 de julio, por el que se aprueba el Catálogo de Espectáculos Públicos, Actividades Recreativas y Establecimientos Públicos de Andalucía y se regulan sus modalidades, régimen de apertura o instalación y horarios de apertura y cierre, queda modificado del siguiente modo.'
      },
      {
        tipo: 'modificacion',
        titulo: 'Uno. Nueva redacción de la disposición adicional tercera',
        texto: 'Disposición adicional tercera. Instalación excepcional de equipos de reproducción o amplificación sonora o audiovisuales y actuaciones en directo de pequeño formato en terrazas y veladores de establecimientos de hostelería.',
        apartados: [
          {
            numero: '1',
            texto: 'Los Ayuntamientos podrán autorizar por periodos iguales o inferiores a cuatro meses dentro del año natural, la instalación y utilización de equipos de reproducción o amplificación sonora o audiovisuales así como el desarrollo de actuaciones en directo de pequeño formato, en terrazas y veladores de establecimientos de hostelería situados preferentemente en áreas no declaradas zonas acústicas especiales y que además sean sectores con predominio de suelo de uso recreativo, de espectáculos, característico turístico o de otro uso terciario no previsto en el anterior, e industrial. La instalación y utilización de equipos de reproducción o amplificación sonora o audiovisuales así como el desarrollo de actuaciones en directo de pequeño formato en terrazas y veladores ubicados en zonas acústicas especiales y en sectores del territorio distintos a los anteriores deberá estar motivada en el cumplimiento de los objetivos de calidad acústica aplicables al espacio interior del artículo 27 del Reglamento de Protección contra la Contaminación Acústica en Andalucía, aprobado mediante Decreto 6/2012, de 17 de enero. La evaluación de su cumplimiento quedará justificada en el estudio acústico mediante la aplicación de la metodología de cálculo que se desarrolle por la Consejería competente en materia de contaminación acústica. No obstante, los municipios costeros, entendiendo por tales aquellos cuyo término municipal límite con el mar y cuenten con dominio público marítimo-terrestre en los términos establecidos en la Ley 22/1988, de 28 de julio, de Costas, que hayan obtenido la declaración de municipio turístico prevista en el Decreto 72/2017, de 13 de junio, de Municipio Turístico de Andalucía, o que hayan obtenido la declaración de zona de gran afluencia turística, a efectos de horarios comerciales, de acuerdo con el Decreto 2/2014, de 14 de enero, por el que se regulan los criterios y el procedimiento para la declaración de zonas de gran afluencia turística, en los términos y límites establecidos en la misma, podrán autorizar la instalación y utilización de equipos de reproducción o amplificación sonora o audiovisuales así como el desarrollo de actuaciones en directo de pequeño formato en los términos descritos en el párrafo anterior, por periodos iguales o inferiores a seis meses dentro del año natural.'
          },
          {
            numero: '2',
            texto: 'Las autorizaciones municipales deberán establecer preceptivamente cuantas restricciones, límites técnicos y condiciones de instalación y funcionamiento sean precisos para garantizar los derechos a la salud y el descanso de los ciudadanos, en función de sus características de emisión acústica y de la tipología y ubicación del establecimiento público.'
          },
          {
            numero: '3',
            texto: 'El horario de funcionamiento de los equipos de reproducción o amplificación sonora o audiovisuales y de las actuaciones en directo de pequeño formato se determinará en la resolución emitida por el Ayuntamiento, considerando las características de emisión acústica, ubicación y condiciones técnicas de la terraza o velador y del establecimiento público del que dependan, sin que en ningún caso pueda iniciarse antes de las 15:00 ni superar las 24:00 horas. En el caso de municipios costeros que, conforme a lo expresado en el segundo párrafo del apartado primero de la presente disposición, hayan obtenido la declaración de municipio turístico o que hayan obtenido la declaración de zona de gran afluencia turística a efectos de horarios comerciales, en los términos y límites establecidos en la correspondiente declaración, podrán ampliar el horario de inicio de la autorización de instalación y utilización de equipos de reproducción o amplificación sonora o audiovisuales así como el desarrollo de actuaciones en directo de pequeño formato desde las 13:00 horas, sin que en ningún caso pueda superar las 24:00 horas.'
          }
        ]
      },
      {
        tipo: 'modificacion',
        titulo: 'Dos. Nueva disposición adicional undécima',
        texto: 'Disposición adicional undécima. Seguros de responsabilidad civil de los establecimientos de hostelería con música y de los establecimientos especiales para festivales.',
        apartados: [
          {
            numero: '1',
            texto: 'Cuando las personas organizadoras de espectáculos públicos y actividades recreativas celebren o desarrollen los mismos en establecimientos de hostelería con música del epígrafe III.2.7.b) del Catálogo de Establecimientos Públicos aprobado en este decreto, las sumas aseguradas previstas en los contratos de seguro de responsabilidad civil serán las establecidas en el punto 4.1 del anexo del Decreto 109/2005, de 26 de abril, por el que se regulan los requisitos de los contratos de seguro obligatorio de responsabilidad civil en materia de Espectáculos Públicos y Actividades Recreativas.'
          },
          {
            numero: '2',
            texto: 'Cuando las personas organizadoras de espectáculos públicos y actividades recreativas celebren o desarrollen los mismos en establecimientos especiales para festivales del epígrafe III.2.9 del Catálogo de Establecimientos Públicos aprobado por el Decreto 155/2018, de 31 de julio, las sumas aseguradas previstas en los contratos de seguro de responsabilidad civil serán las previstas en el punto 4.2 del anexo del Decreto 109/2005, de 26 de abril.'
          }
        ]
      },
      {
        tipo: 'final',
        titulo: 'Disposición derogatoria única. Derogación normativa',
        texto: 'Quedan derogadas cuantas disposiciones de igual o inferior rango se opongan a lo dispuesto en este decreto.'
      },
      {
        tipo: 'final',
        titulo: 'Disposición final primera. Desarrollo y ejecución',
        texto: 'Se autoriza a la persona titular de la Consejería con competencias en materia de espectáculos públicos y actividades recreativas para dictar las disposiciones que, en el ámbito de sus competencias, sean necesarias en desarrollo y ejecución del presente decreto.'
      },
      {
        tipo: 'final',
        titulo: 'Disposición final segunda. Entrada en vigor',
        texto: 'El presente decreto entrará en vigor el día siguiente al de su publicación en el Boletín Oficial de la Junta de Andalucía.'
      }
    ]
  };

  function ensureStyles(){
    if(document.getElementById(STYLE_ID)) return;
    const s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=`
      #${CARD_ID}{cursor:pointer;}
      #${CARD_ID} .normativa-icon{font-size:0!important;color:#61c9ff!important;display:grid!important;place-items:center!important;}
      #${CARD_ID} .normativa-icon:before{content:'251';font-size:17px;font-weight:1000;line-height:1;text-shadow:0 0 12px currentColor;letter-spacing:-1px;}
      #${PANEL_ID}{margin:12px 0 28px;border:1px solid rgba(69,190,255,.58);border-radius:22px;background:linear-gradient(145deg,rgba(2,16,29,.98),rgba(3,31,51,.96));box-shadow:0 16px 42px rgba(0,0,0,.45),inset 0 0 36px rgba(0,134,225,.05);overflow:hidden;}
      #${PANEL_ID}.hidden{display:none!important;}
      .d251-head{padding:18px;border-bottom:1px solid rgba(70,172,235,.18);background:linear-gradient(120deg,rgba(13,82,132,.22),rgba(0,0,0,0));}
      .d251-kicker{color:#5bc2ff;text-transform:uppercase;font-size:9px;font-weight:900;letter-spacing:1.4px;}
      .d251-title{margin:5px 0 5px;font-size:22px;line-height:1.08;color:#f7fbff;font-weight:950;}
      .d251-sub{margin:0;color:#abc3d7;font-size:10px;line-height:1.45;}
      .d251-meta{display:flex;flex-wrap:wrap;gap:7px;margin-top:11px;}
      .d251-chip{border:1px solid rgba(78,184,243,.35);border-radius:999px;padding:6px 9px;background:rgba(0,0,0,.17);color:#d9efff;font-size:8px;font-weight:800;}
      .d251-actions{display:flex;flex-wrap:wrap;gap:8px;padding:12px;border-bottom:1px solid rgba(70,172,235,.12);}
      .d251-btn{border:1px solid #2a709f;border-radius:11px;padding:9px 11px;background:#061a2b;color:#d9efff;font-size:9px;font-weight:900;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:6px;}
      .d251-btn.primary{background:linear-gradient(180deg,#087fe8,#0757ae);border-color:#46b7ff;color:#fff;}
      .d251-note{margin:12px;border-left:3px solid #44b8ff;padding:10px 11px;background:rgba(16,105,176,.08);color:#aec4d6;font-size:9px;line-height:1.5;}
      .d251-section{padding:0 12px 10px;}
      .d251-section-label{padding:8px 0 7px;color:#6fcaff;font-size:10px;font-weight:950;text-transform:uppercase;letter-spacing:.8px;}
      .d251-block{border:1px solid rgba(45,113,159,.35);border-radius:13px;background:linear-gradient(145deg,rgba(6,30,49,.82),rgba(2,13,23,.96));padding:12px;margin-bottom:8px;}
      .d251-block-title{margin:0 0 8px;color:#f4fbff;font-size:11px;line-height:1.35;font-weight:900;}
      .d251-main-text,.d251-paragraph{margin:0;color:#d4e1ec;font-size:10px;line-height:1.58;white-space:pre-wrap;}
      .d251-apartado{margin-top:9px;padding-top:9px;border-top:1px solid rgba(54,125,172,.22);}
      .d251-apartado-head{color:#63c6ff;font-size:9px;font-weight:950;margin-bottom:4px;}
      .d251-footer{padding:0 12px 16px;color:#7f9db3;font-size:8px;line-height:1.45;}
      @media(max-width:560px){.d251-title{font-size:19px}.d251-btn{flex:1;justify-content:center}}
    `;
    document.head.appendChild(s);
  }

  function findList(){
    return document.getElementById('normativaList') || document.querySelector('#section-normativa .normativa-list');
  }

  function cardName(card){
    return normalizar(card?.dataset?.law || card?.querySelector('h3')?.textContent || '');
  }

  function findExistingReferenceCard(){
    const cards=[...document.querySelectorAll('#section-normativa .normativa-card, #section-normativa .cc-law-card')];
    return cards.find(c=>/155\/2018/.test(cardName(c))) || cards.find(c=>/13\/1999|13\/99/.test(cardName(c))) || null;
  }

  function ensurePanel(){
    let panel=document.getElementById(PANEL_ID);
    if(panel) return panel;
    const host=document.getElementById('section-normativa');
    if(!host) return null;
    panel=document.createElement('section');
    panel.id=PANEL_ID;
    panel.className='hidden';
    panel.innerHTML=`
      <div class="d251-head">
        <div class="d251-kicker">Espectáculos públicos · Norma de desarrollo</div>
        <h2 class="d251-title">${esc(DATA.titulo)}</h2>
        <p class="d251-sub">${esc(DATA.subtitulo)}</p>
        <div class="d251-meta">
          <span class="d251-chip">${esc(DATA.publicacion)}</span>
          <span class="d251-chip">Entrada en vigor: ${esc(DATA.entradaVigor)}</span>
          <span class="d251-chip">Modifica Decreto 155/2018</span>
        </div>
      </div>
      <div class="d251-actions">
        <button type="button" class="d251-btn" id="d251Back">← Volver a Normativa</button>
        <a class="d251-btn primary" href="${OFFICIAL_URL}" target="_blank" rel="noopener noreferrer">↗ Texto oficial BOJA</a>
      </div>
      <div class="d251-note"><strong>Aplicación práctica:</strong> la modificación afecta principalmente a la disposición adicional tercera (terrazas y veladores con equipos sonoros/audiovisuales y actuaciones de pequeño formato) y añade una disposición adicional undécima sobre seguros de responsabilidad civil.</div>
      <div class="d251-section">
        <div class="d251-section-label">Articulado</div>
        <div id="d251Content"></div>
      </div>
      <div class="d251-footer">Texto incorporado para consulta dentro de Centinela Code. Fuente oficial: Boletín Oficial de la Junta de Andalucía, núm. 193, de 6 de octubre de 2023.</div>
    `;
    const lista=findList();
    if(lista && lista.parentElement){lista.parentElement.insertBefore(panel, lista.nextSibling);}else{host.appendChild(panel);}
    panel.querySelector('#d251Back')?.addEventListener('click',hidePanel);

    const content=panel.querySelector('#d251Content');
    if(content){
      content.innerHTML=DATA.contenido.map((item)=>{
        if(Array.isArray(item.apartados)){
          return `<article class="d251-block"><h3 class="d251-block-title">${esc(item.titulo)}</h3><p class="d251-main-text">${esc(item.texto)}</p>${item.apartados.map(a=>`<div class="d251-apartado"><div class="d251-apartado-head">Apartado ${esc(a.numero)}</div><p class="d251-paragraph">${esc(a.texto)}</p></div>`).join('')}</article>`;
        }
        return `<article class="d251-block"><h3 class="d251-block-title">${esc(item.titulo)}</h3><p class="d251-main-text">${esc(item.texto)}</p></article>`;
      }).join('');
    }
    return panel;
  }

  function showPanel(){
    const panel=ensurePanel();
    const lista=findList();
    const search=document.querySelector('#section-normativa .search-box');
    if(!panel) return;
    if(lista) lista.style.display='none';
    if(search) search.style.display='none';
    panel.classList.remove('hidden');
    panel.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function hidePanel(){
    const panel=document.getElementById(PANEL_ID);
    const lista=findList();
    const search=document.querySelector('#section-normativa .search-box');
    if(panel) panel.classList.add('hidden');
    if(lista) lista.style.display='grid';
    if(search) search.style.display='';
  }

  function openFromCard(){showPanel();}

  function insertCard(){
    const lista=findList();
    if(!lista) return false;
    ensurePanel();
    let card=document.getElementById(CARD_ID);
    if(card){
      card.onclick=openFromCard;
      return true;
    }
    card=document.createElement('div');
    card.id=CARD_ID;
    card.className='normativa-card';
    card.setAttribute('role','button');
    card.setAttribute('tabindex','0');
    card.innerHTML=`<div class="normativa-icon">251</div><div class="normativa-info"><h3>Decreto 251/2023</h3><p>Modifica el Decreto 155/2018 · terrazas, veladores y seguros RC</p><span>BOJA 193 · 06/10/2023</span></div><button type="button" class="normativa-open" aria-label="Abrir Decreto 251/2023">Ver articulado</button>`;
    const reference=findExistingReferenceCard();
    if(reference && reference.parentElement===lista){
      reference.insertAdjacentElement('afterend',card);
    }else{
      lista.appendChild(card);
    }
    const open=()=>openFromCard();
    card.addEventListener('click',open);
    card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}});
    card.querySelector('.normativa-open')?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();open();});
    return true;
  }

  function boot(){
    ensureStyles();
    let tries=0;
    const timer=setInterval(()=>{
      if(insertCard() || ++tries>60) clearInterval(timer);
    },200);

    const obs=new MutationObserver(()=>{
      if(document.getElementById(PANEL_ID)?.classList.contains('hidden')===false) return;
      insertCard();
    });
    const section=document.getElementById('section-normativa');
    if(section) obs.observe(section,{childList:true,subtree:true});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
