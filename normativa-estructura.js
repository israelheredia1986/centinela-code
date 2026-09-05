/* CENTINELA — estructura visual de Normativa por bloques. */
(function(){
  'use strict';
  const ORDENANZAS='./data/ordenanzas.json';
  const norm=s=>String(s??'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim();
  const groups=[
    ['SEGURIDAD CIUDADANA',['LOPSC','ley organica 4/2015']],
    ['TRÁFICO Y MOVILIDAD',['trafico','vmp','bicicleta','circulacion']],
    ['VIOLENCIA DE GÉNERO',['violencia de genero','violencia género']],
    ['MENORES',['menores','menor']],
    ['DERECHO PENAL',['codigo penal','código penal']],
    ['PROCEDIMIENTO POLICIAL',['lecrim','ley de enjuiciamiento criminal','2/1986']],
    ['EXTRANJERÍA',['extranjeria','extranjería']],
    ['SEGURIDAD PRIVADA',['seguridad privada']],
    ['ESPECTÁCULOS Y ACTIVIDADES',['espectaculos','espectáculos','155/2018']],
    ['ANIMALES',['animales']],
    ['ARMAS',['reglamento de armas','armas']],
    ['MEDIO AMBIENTE Y RUIDOS',['medio ambiente','ruidos']],
    ['ADMINISTRACIÓN Y RÉGIMEN LOCAL',['39/2015','7/1985','5/2010','policias locales','policías locales']],
    ['OTRA NORMATIVA',['']]
  ];
  const categoryOf=name=>{const n=norm(name);for(let i=0;i<groups.length-1;i++)if(groups[i][1].some(k=>k&&n.includes(k)))return i;return groups.length-1;};
  function list(){return document.getElementById('normativaList')||document.querySelector('#section-normativa .normativa-list');}
  function addStyles(){
    if(document.getElementById('cc-normativa-estructura-style'))return;
    const s=document.createElement('style');s.id='cc-normativa-estructura-style';s.textContent=`
      #section-normativa .normativa-list{display:block!important;padding-bottom:24px!important}
      .cc-norm-group{display:flex;align-items:center;gap:9px;margin:18px 3px 9px;padding:0 3px;color:#dff5ff;font-size:10px;font-weight:900;letter-spacing:.8px;text-transform:uppercase}
      .cc-norm-group:first-child{margin-top:4px}.cc-norm-group:before{content:"";width:4px;height:18px;border-radius:4px;background:#31b9ff;box-shadow:0 0 10px rgba(49,185,255,.65)}
      .cc-norm-group:after{content:"";height:1px;flex:1;background:linear-gradient(90deg,rgba(49,185,255,.35),transparent)}
      .cc-norm-group span{white-space:nowrap}.cc-norm-group small{color:#7190a3;font-size:8px;font-weight:700;letter-spacing:0}
      .cc-norm-ordinanzas{margin-top:26px!important}.cc-norm-ordinanzas:before{background:#ffd34a;box-shadow:0 0 10px rgba(255,211,74,.55)}
      .cc-law-card{margin-bottom:10px!important;min-height:94px!important;display:grid!important;grid-template-columns:38px minmax(0,1fr) 48px!important;align-items:center!important;gap:8px!important;padding:12px!important;border-radius:16px!important}
      .cc-law-card .normativa-icon{font-size:25px!important}.cc-law-card .normativa-info h3{font-size:12px!important;line-height:1.2!important}.cc-law-card .normativa-info p{font-size:8px!important}.cc-law-card .normativa-open{font-size:9px!important}
      .cc-law-card.cc-ordenanza{border-color:rgba(255,211,74,.28)!important}.cc-law-card.cc-ordenanza .normativa-icon{filter:drop-shadow(0 0 7px rgba(255,211,74,.3))}
    `;document.head.appendChild(s);
  }
  async function loadOrdinances(api){
    if(api.__centinelaOrdenanzasLoaded)return;
    try{
      const r=await fetch(ORDENANZAS+'?v=20260905-ordenanzas',{cache:'no-store'});if(!r.ok)throw Error(r.status);const data=await r.json();
      const laws=api.laws();
      (data.ordenanzas||[]).forEach(o=>{const name='Ordenanza San Roque — '+(o.nombre_corto||o.nombre||o.id);if(!laws.some(l=>norm(l.name)===norm(name)))laws.push({name,abbr:o.codigo||'Ordenanza municipal',source:'ordenanzas.json · San Roque',boe:'',url:o?.fuente?.url||'',articles:Array.isArray(o.articulos)?o.articulos:[],sources:new Set(['ordenanzas.json · San Roque']),raw:o});});
      api.__centinelaOrdenanzasLoaded=true;
    }catch(e){console.warn('Centinela: no se pudieron cargar las ordenanzas',e);}
  }
  function arrange(){
    const l=list();if(!l)return;
    const cards=[...l.querySelectorAll('.cc-law-card')];if(!cards.length)return;
    const constitution=document.getElementById('centinela-normativa-constitucion-card');
    const buckets=Array.from({length:groups.length},()=>[]);
    cards.forEach(c=>{const name=c.dataset.law||c.querySelector('h3')?.textContent||'';const i=name.startsWith('Ordenanza San Roque')?groups.length-1:categoryOf(name);if(i===groups.length-1)c.classList.add('cc-ordenanza');buckets[i].push(c);});
    const frag=document.createDocumentFragment();if(constitution)frag.appendChild(constitution);
    buckets.forEach((bucket,i)=>{if(!bucket.length)return;const h=document.createElement('div');h.className='cc-norm-group'+(i===groups.length-1?' cc-norm-ordinanzas':'');h.innerHTML='<span>'+groups[i][0]+'</span><small>'+bucket.length+'</small>';frag.appendChild(h);bucket.sort((a,b)=>(a.querySelector('h3')?.textContent||'').localeCompare(b.querySelector('h3')?.textContent||'','es'));bucket.forEach(c=>frag.appendChild(c));});
    l.replaceChildren(frag);
  }
  function repaint(){const s=document.getElementById('normativaSearch');if(s)s.dispatchEvent(new Event('input',{bubbles:true}));}
  async function boot(){
    addStyles();
    const api=window.__centinelaNormativaUnificada;if(!api)return setTimeout(boot,250);
    await loadOrdinances(api);
    // Añade ordenanzas también después de cada recarga del catálogo.
    if(!api.__centinelaEstructuraPatched){const original=api.reload;api.reload=async function(){const r=await original();await loadOrdinances(api);repaint();return r;};api.__centinelaEstructuraPatched=true;}
    const observer=new MutationObserver(()=>{if(!window.__centinelaNormativaLawPanel?.style?.display||window.__centinelaNormativaLawPanel.style.display==='none')requestAnimationFrame(arrange);});
    observer.observe(list()||document.getElementById('section-normativa')||document.body,{childList:true,subtree:true});
    repaint();setTimeout(arrange,150);setTimeout(arrange,700);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
