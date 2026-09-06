/* CENTINELA — acceso a los textos consolidados oficiales de la normativa. */
(function(){
  'use strict';
  const URLS={
    'ley organica 2/1986':'https://www.boe.es/eli/es/lo/1986/03/13/2/con',
    'ley 2/1986':'https://www.boe.es/eli/es/lo/1986/03/13/2/con',
    'ley de enjuiciamiento criminal':'https://www.boe.es/eli/es/rd/1882/09/14/(1)/con',
    'lecrim':'https://www.boe.es/eli/es/rd/1882/09/14/(1)/con',
    'reglamento de armas':'https://www.boe.es/eli/es/rd/1993/01/29/137/con',
    'ley 5/2010 de autonomia local de andalucia':'https://www.boe.es/eli/es-an/l/2010/06/11/5/con',
    'ley 5/2010 de autonomía local de andalucía':'https://www.boe.es/eli/es-an/l/2010/06/11/5/con',
    'ley 13/1999 de espectaculos publicos y actividades recreativas de andalucia':'https://ws040.juntadeandalucia.es/sedeboja/lconsolidada/eli/es-an/l/1999/12/15/13/con/20240217/spa/html/LE0000025329_20240217.html',
    'ley 13/1999 de espectáculos públicos y actividades recreativas de andalucía':'https://ws040.juntadeandalucia.es/sedeboja/lconsolidada/eli/es-an/l/1999/12/15/13/con/20240217/spa/html/LE0000025329_20240217.html',
    'decreto 155/2018':'https://ws040.juntadeandalucia.es/sedeboja/lconsolidada/eli/es-an/d/2018/07/31/155/con/20231007/spa/html/LE0000626444_20231007.html',
    'decreto 251/2023':'https://www.juntadeandalucia.es/boja/2023/193/2',
    'lopsc':'https://www.boe.es/eli/es/lo/2015/03/30/4/con',
    'ley organica 4/2015':'https://www.boe.es/eli/es/lo/2015/03/30/4/con',
    'codigo penal':'https://www.boe.es/eli/es/lo/1995/11/23/10/con',
    'ley 39/2015':'https://www.boe.es/eli/es/l/2015/10/01/39/con',
    'ley 7/1985':'https://www.boe.es/eli/es/l/1985/04/02/7/con'
  };
  const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim();
  function urlFor(name){const n=norm(name);if(URLS[n])return URLS[n];for(const k of Object.keys(URLS))if(n.includes(k)||k.includes(n))return URLS[k];return ''}
  function style(){if(document.getElementById('ccNormativaOficialStyle'))return;const s=document.createElement('style');s.id='ccNormativaOficialStyle';s.textContent='.cc-official-link{display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:5px!important;margin-top:8px!important;border:1px solid rgba(49,185,255,.35)!important;background:rgba(7,38,60,.9)!important;color:#bfeaff!important;border-radius:9px!important;padding:7px 9px!important;font-size:8px!important;font-weight:900!important;text-decoration:none!important}.cc-law-actions{display:flex!important;flex-wrap:wrap!important;gap:7px!important;align-items:center!important}';document.head.appendChild(s)}
  function add(){style();document.querySelectorAll('#section-normativa .cc-law-card').forEach(card=>{if(card.querySelector('.cc-official-link'))return;const name=card.dataset.law||card.querySelector('h3')?.textContent||'';const url=urlFor(name);if(!url)return;const a=document.createElement('a');a.className='cc-official-link';a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.textContent='↗ TEXTO OFICIAL';const info=card.querySelector('.normativa-info');(info||card).appendChild(a)})}
  function boot(){add();let q=false;const run=()=>{if(q)return;q=true;requestAnimationFrame(()=>{q=false;add()})};const o=new MutationObserver(run);o.observe(document.getElementById('section-normativa')||document.body,{childList:true,subtree:true})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
