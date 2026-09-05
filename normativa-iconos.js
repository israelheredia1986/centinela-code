/* CENTINELA — iconos temáticos para tarjetas de Normativa. */
(function(){
  'use strict';
  const norm=s=>String(s??'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
  const icons=[
    [['lopsc','seguridad ciudadana'],'🛡️'],
    [['trafico','vmp','bicicleta','circulacion','tráfico'],'🚗'],
    [['violencia de genero','violencia género'],'💜'],
    [['menores','menor'],'👨‍👩‍👧'],
    [['codigo penal','código penal'],'⚖️'],
    [['lecrim','enjuiciamiento criminal','2/1986'],'📋'],
    [['extranjeria','extranjería'],'🌍'],
    [['seguridad privada'],'🔐'],
    [['espectaculos','espectáculos','155/2018'],'🎪'],
    [['animales'],'🐾'],
    [['reglamento de armas','armas'],'🔫'],
    [['medio ambiente','ruidos'],'🌿'],
    [['39/2015','7/1985','5/2010','policias locales','policías locales'],'🏛️'],
    [['ordenanza san roque'],'📍']
  ];
  function iconFor(name){const n=norm(name);for(const [keys,icon] of icons)if(keys.some(k=>n.includes(norm(k))))return icon;return '📘';}
  function paint(){document.querySelectorAll('#section-normativa .cc-law-card').forEach(card=>{const name=card.dataset.law||card.querySelector('h3')?.textContent||'';const icon=card.querySelector('.normativa-icon');if(icon){icon.textContent=iconFor(name);icon.setAttribute('aria-hidden','true');icon.classList.add('cc-norm-theme-icon');}});}
  function boot(){
    if(document.getElementById('cc-norm-icon-style'))return;
    const s=document.createElement('style');s.id='cc-norm-icon-style';s.textContent=`.cc-norm-theme-icon{font-size:28px!important;width:38px;min-width:38px;text-align:center;line-height:1;filter:drop-shadow(0 0 6px rgba(49,185,255,.28));}.cc-law-card.cc-ordenanza .cc-norm-theme-icon{filter:drop-shadow(0 0 7px rgba(255,211,74,.45));}`;document.head.appendChild(s);
    paint();
    const target=document.getElementById('section-normativa')||document.body;
    new MutationObserver(()=>requestAnimationFrame(paint)).observe(target,{childList:true,subtree:true});
    setInterval(paint,1200);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
