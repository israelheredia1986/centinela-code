/* CENTINELA CODE — FIX BUSCADOR 2026-09-16
   Capa de compatibilidad para asegurar que el buscador de Consulta responde
   aunque otro módulo haya registrado listeners antes o el buscador definitivo
   todavía no haya terminado de cargarse.
*/
(function(){
  'use strict';
  if(window.__centinelaSearchFixInstalled)return;
  window.__centinelaSearchFixInstalled=true;

  const INPUT_ID='consultaSearch';
  const BOX_ID='consultaResults';
  const COUNT_ID='consultaResultCount';
  let timer=null;
  let generation=0;

  function esc(s){return String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));}

  async function ensureEngine(){
    if(window.CentinelaDefinitiveSearch?.search)return true;
    return new Promise(resolve=>{
      const s=document.createElement('script');
      s.src='./buscador-definitivo.js?v=20260916fix';
      s.onload=()=>resolve(!!window.CentinelaDefinitiveSearch?.search);
      s.onerror=()=>resolve(false);
      document.body.appendChild(s);
    });
  }

  function showMessage(title,text,icon){
    const box=document.getElementById(BOX_ID);
    if(!box)return;
    box.innerHTML=`<div class="empty-state"><div class="empty-icon">${icon}</div><h3>${esc(title)}</h3><p>${esc(text)}</p></div>`;
  }

  async function run(value){
    const my=++generation;
    const q=String(value??'').trim();
    const box=document.getElementById(BOX_ID);
    const count=document.getElementById(COUNT_ID);
    if(!box)return;
    if(!q){
      if(count)count.textContent='0';
      showMessage('Buscar normativa o infracción','Introduce una palabra, conducta, artículo o código.','🔎');
      return;
    }
    if(count)count.textContent='…';
    showMessage('Buscando…','Consultando la normativa e infracciones disponibles.','🔎');
    const ok=await ensureEngine();
    if(my!==generation)return;
    if(ok){
      try{
        await window.CentinelaDefinitiveSearch.search(q);
        return;
      }catch(e){console.error('Centinela buscador fix:',e);}
    }
    showMessage('Buscador no disponible','No se ha podido cargar el motor de búsqueda. Recarga la aplicación e inténtalo de nuevo.','⚠️');
    if(count)count.textContent='0';
  }

  function install(){
    const input=document.getElementById(INPUT_ID);
    if(!input)return false;
    if(input.dataset.ccSearchFix==='1')return true;
    input.dataset.ccSearchFix='1';

    input.addEventListener('input',()=>{
      clearTimeout(timer);
      timer=setTimeout(()=>run(input.value),180);
    },true);

    input.addEventListener('keydown',e=>{
      if(e.key==='Enter'){
        e.preventDefault();
        e.stopImmediatePropagation();
        clearTimeout(timer);
        run(input.value);
      }
    },true);

    const clear=document.getElementById('clearConsultaSearch');
    if(clear&&!clear.dataset.ccSearchFix){
      clear.dataset.ccSearchFix='1';
      clear.addEventListener('click',()=>{
        input.value='';
        input.dispatchEvent(new Event('input',{bubbles:true}));
        input.focus();
      },true);
    }
    return true;
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
  let tries=0;
  const poll=setInterval(()=>{if(install()||++tries>100)clearInterval(poll);},150);
  window.CentinelaSearchFix={run,install};
})();
