/* ============================================================
   CENTINELA CODE — CONSTITUCIÓN ESPAÑOLA · TEXTO ÍNTEGRO
   V4 — carga robusta + 169 artículos + Mostrar todo operativo
   ============================================================ */
(function(){
  'use strict';

  const BOE_URL='https://www.boe.es/buscar/act.php?id=BOE-A-1978-31229';
  const REMOTE_MD='https://raw.githubusercontent.com/legalize-dev/legalize-es/main/es/BOE-A-1978-31229.md';
  const API_URL='https://api.github.com/repos/legalize-dev/legalize-es/contents/es/BOE-A-1978-31229.md';
  const CACHE_KEY='centinela-constitucion-es-v2026-05-20-v4';
  const UI_ID='centinela-constitucion-completa';
  const TAB_ID='centinela-tab-constitucion';
  let state={data:null,query:'',allOpen:false};

  const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();

  function ensureStyles(){
    if(document.getElementById('constitucion-completa-style'))return;
    const s=document.createElement('style');
    s.id='constitucion-completa-style';
    s.textContent=`
      #${TAB_ID}{display:flex;align-items:center;gap:9px;width:100%;box-sizing:border-box;margin:10px 0 12px;padding:12px 14px;border:1px solid rgba(62,185,255,.65);border-radius:14px;background:linear-gradient(135deg,rgba(4,42,69,.98),rgba(5,20,34,.98));color:#effaff;font-weight:900;font-size:12px;letter-spacing:.2px;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.32),inset 0 0 18px rgba(0,140,230,.08)}
      #${TAB_ID}.active{background:linear-gradient(135deg,#0a88ed,#0759ac);border-color:#63c9ff}
      .ce-tab-icon{width:27px;height:27px;border-radius:8px;display:grid;place-items:center;background:rgba(255,255,255,.12);font-size:16px;flex:0 0 27px}
      .ce-tab-main{display:flex;flex-direction:column;min-width:0;text-align:left}.ce-tab-main strong{font-size:12px}.ce-tab-main small{margin-top:2px;color:#a8cce5;font-size:8px;font-weight:700}.active .ce-tab-main small{color:#dff3ff}.ce-tab-arrow{margin-left:auto;font-size:18px;color:#62c8ff}
      #${UI_ID}{margin:16px 0 28px;border:1px solid rgba(56,183,255,.52);border-radius:22px;background:linear-gradient(145deg,rgba(2,16,29,.98),rgba(3,28,48,.96));box-shadow:0 16px 42px rgba(0,0,0,.45),inset 0 0 36px rgba(0,134,225,.05);overflow:hidden}
      .ce-head{padding:18px;border-bottom:1px solid rgba(70,172,235,.18);background:linear-gradient(120deg,rgba(13,82,132,.2),rgba(0,0,0,0))}.ce-kicker{color:#5bc2ff;text-transform:uppercase;font-size:10px;font-weight:900;letter-spacing:1.5px}.ce-title{margin:5px 0 4px;font-size:25px;line-height:1.05;font-weight:900;color:#f7fbff}.ce-sub{margin:0;color:#a9c0d4;font-size:11px;line-height:1.45}.ce-meta{display:flex;flex-wrap:wrap;gap:7px;margin-top:11px}.ce-chip{border:1px solid rgba(78,184,243,.35);border-radius:999px;padding:6px 9px;background:rgba(0,0,0,.17);color:#d9efff;font-size:9px;font-weight:800}
      .ce-toolbar{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:8px;padding:12px}.ce-search{min-width:0;width:100%;box-sizing:border-box;border:1px solid #245f8d;border-radius:12px;padding:11px 12px;background:#03111e;color:#eef8ff;outline:none}.ce-search:focus{border-color:#45baff;box-shadow:0 0 0 2px rgba(69,186,255,.12)}.ce-btn{border:1px solid #2a709f;border-radius:11px;padding:10px 12px;background:#061a2b;color:#d9efff;font-size:9px;font-weight:900;cursor:pointer}.ce-btn.primary{background:linear-gradient(180deg,#087fe8,#0757ae);border-color:#46b7ff;color:white}
      .ce-index{padding:0 12px 12px}.ce-statbar{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}.ce-stat{padding:9px 7px;text-align:center;border:1px solid rgba(54,125,172,.3);border-radius:11px;background:rgba(0,0,0,.12)}.ce-stat strong{display:block;color:#5dc5ff;font-size:16px}.ce-stat small{display:block;margin-top:2px;color:#879db0;font-size:8px;text-transform:uppercase}.ce-notice{margin-top:10px;padding:10px 11px;border-left:3px solid #44b8ff;background:rgba(16,105,176,.08);color:#aec4d6;font-size:9px;line-height:1.45}
      .ce-section{padding:0 12px 9px}.ce-section-label{padding:6px 0;color:#6fcaff;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.8px}.ce-results{display:flex;flex-direction:column;gap:7px}.ce-article{border:1px solid rgba(45,113,159,.35);border-radius:13px;background:linear-gradient(145deg,rgba(6,30,49,.82),rgba(2,13,23,.96));overflow:hidden}.ce-article[open]{border-color:rgba(74,178,238,.58);box-shadow:0 8px 20px rgba(0,0,0,.22)}.ce-summary{list-style:none;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px 12px;cursor:pointer;color:#f4fbff}.ce-summary::-webkit-details-marker{display:none}.ce-art-no{color:#5cc4ff;font-weight:900;font-size:10px;min-width:74px}.ce-art-title{flex:1;font-size:11px;font-weight:800;line-height:1.25}.ce-chevron{color:#5dbdff;font-size:14px;transition:transform .2s}.ce-article[open] .ce-chevron{transform:rotate(90deg)}.ce-body{padding:0 12px 13px;border-top:1px solid rgba(54,125,172,.23)}.ce-body-text{margin:11px 0 0;color:#d4e1ec;font-size:11px;line-height:1.58;white-space:pre-wrap}.ce-source-note{margin-top:9px;color:#89a5ba;font-size:8px;line-height:1.45}.ce-disposition{border:1px solid rgba(55,126,173,.28);border-radius:12px;padding:11px 12px;background:rgba(2,14,24,.65)}.ce-disposition strong{display:block;color:#63c6ff;font-size:10px;margin-bottom:5px}.ce-disposition p{margin:0;color:#c9d8e5;font-size:10px;line-height:1.5;white-space:pre-wrap}.ce-empty{padding:26px 12px;text-align:center;color:#8ca6bb;font-size:11px}.ce-status{margin-top:8px;color:#83a7bf;font-size:8px}
      @media(max-width:700px){.ce-toolbar{grid-template-columns:1fr 1fr}.ce-search{grid-column:1/-1}.ce-statbar{grid-template-columns:repeat(2,1fr)}.ce-title{font-size:21px}}
    `;
    document.head.appendChild(s);
  }

  function parseMarkdown(md){
    const lines=String(md||'').replace(/^\uFEFF/,'').replace(/\r/g,'').split('\n');
    const articleIdx=[];
    for(let i=0;i<lines.length;i++){
      const line=lines[i].trim();
      const m=line.match(/^#{2,6}\s*Artículo\s+(\d+)\b/i);
      if(m)articleIdx.push({line:i,num:Number(m[1])});
    }
    const articles=[];
    for(let i=0;i<articleIdx.length;i++){
      const start=articleIdx[i].line+1;
      let end=i+1<articleIdx.length?articleIdx[i+1].line:lines.length;
      for(let j=start;j<end;j++){
        if(/^######\s+Disposición/i.test(lines[j].trim())){end=j;break;}
      }
      let block=lines.slice(start,end);
      while(block.length&&!block[0].trim())block.shift();
      while(block.length&&!block[block.length-1].trim())block.pop();
      const clean=block.map(x=>x.replace(/^>\s*<small>/i,'').replace(/<\/small>$/i,'').replace(/^>\s*/,'').trimEnd());
      articles.push({numero:articleIdx[i].num,titulo:'Artículo '+articleIdx[i].num,texto:clean.join('\n').trim()});
    }
    const first=articleIdx.length?articleIdx[0].line:lines.length;
    const pre=lines.slice(0,first).join('\n').trim();
    const ds=[];
    for(let i=0;i<lines.length;i++)if(/^######\s+Disposición/i.test(lines[i].trim()))ds.push(i);
    const dispositions=[];
    for(let i=0;i<ds.length;i++){
      const st=ds[i],en=i+1<ds.length?ds[i+1]:lines.length;
      let block=lines.slice(st,en).join('\n').trim();
      block=block.replace(/^######\s+/,'');
      dispositions.push({titulo:block.split('\n')[0]||'Disposición',texto:block});
    }
    return {ley:'Constitución Española',identificador:'BOE-A-1978-31229',ultimaActualizacion:'2026-05-20',articulos:articles,disposiciones,preambulo:pre,totalArticulos:articles.length,fuenteOficial:BOE_URL};
  }

  function articleMatches(a){const q=norm(state.query);return !q||norm(`articulo ${a.numero} ${a.titulo} ${a.texto}`).includes(q)}

  function updateCount(n){const el=document.querySelector(`#${UI_ID} .ce-count`);if(el)el.textContent=String(n)}
  function setButtonLabel(){const b=document.querySelector(`#${UI_ID} .ce-clear`);if(b)b.textContent=state.allOpen?'Ocultar todo':'Mostrar todo'}

  function render(){
    const root=document.getElementById(UI_ID);if(!root||!state.data)return;
    const arts=state.data.articulos.filter(articleMatches);
    const results=root.querySelector('.ce-results');
    results.innerHTML=arts.length?arts.map(a=>`<details class="ce-article" ${state.allOpen?'open':''}><summary class="ce-summary"><span class="ce-art-no">ART. ${esc(a.numero)}</span><span class="ce-art-title">${esc(a.titulo)}</span><span class="ce-chevron">›</span></summary><div class="ce-body"><div class="ce-body-text">${esc(a.texto)}</div><div class="ce-source-note">Texto consolidado de consulta. Ver fuente oficial BOE para efectos jurídicos.</div></div></details>`).join(''):`<div class="ce-empty">No hay artículos que coincidan con «${esc(state.query)}».</div>`;
    const d=root.querySelector('.ce-dispositions');
    if(state.query){d.style.display='none'}else{d.style.display='block';d.innerHTML=(state.data.disposiciones||[]).map(x=>`<article class="ce-disposition"><strong>${esc(x.titulo)}</strong><p>${esc(x.texto)}</p></article>`).join('')}
    updateCount(arts.length);
    root.querySelector('.ce-query').textContent=state.query?` · búsqueda: ${esc(state.query)}`:'';
    const total=root.querySelector('.ce-total');if(total)total.textContent=String(state.data.articulos.length);
    const status=root.querySelector('.ce-status');if(status)status.textContent=`${state.data.articulos.length} artículos cargados correctamente`;
    setButtonLabel();
  }

  async function fetchApiMarkdown(){
    const res=await fetch(API_URL,{cache:'no-store',headers:{Accept:'application/vnd.github+json'}});
    if(!res.ok)throw new Error('GitHub API HTTP '+res.status);
    const j=await res.json();
    if(!j.content)throw new Error('GitHub API sin contenido');
    const bin=atob(String(j.content).replace(/\s/g,''));
    const bytes=Uint8Array.from(bin,c=>c.charCodeAt(0));
    return new TextDecoder('utf-8').decode(bytes);
  }

  async function loadData(){
    const cached=localStorage.getItem(CACHE_KEY);
    if(cached){try{const d=JSON.parse(cached);if(d?.articulos?.length>=160){state.data=d;render()}}catch(e){localStorage.removeItem(CACHE_KEY)}}
    let lastError=null;
    const loaders=[
      async()=>{const r=await fetch(API_URL,{cache:'no-store',headers:{Accept:'application/vnd.github+json'}});if(!r.ok)throw new Error('GitHub API HTTP '+r.status);const j=await r.json();if(!j.content)throw new Error('GitHub API sin contenido');const bin=atob(String(j.content).replace(/\s/g,''));const bytes=Uint8Array.from(bin,c=>c.charCodeAt(0));return new TextDecoder('utf-8').decode(bytes)},
      async()=>{const r=await fetch(REMOTE_MD+'?v=20260904', {cache:'no-store',mode:'cors'});if(!r.ok)throw new Error('RAW HTTP '+r.status);return r.text()}
    ];
    for(const loader of loaders){
      try{
        const md=await loader();
        const d=parseMarkdown(md);
        if(d.articulos.length<160)throw new Error('Solo se detectaron '+d.articulos.length+' artículos');
        state.data=d;
        localStorage.setItem(CACHE_KEY,JSON.stringify(d));
        render();
        return;
      }catch(e){lastError=e;}
    }
    if(state.data){render();return;}
    throw lastError||new Error('No se pudo cargar la Constitución');
  }

  function mount(){
    ensureStyles();
    const host=document.getElementById('section-normativa')||document.querySelector('.app-section[id*="normativa"]')||document.querySelector('.main-content');
    if(!host)return setTimeout(mount,700);

    let tab=document.getElementById(TAB_ID);
    if(!tab){
      tab=document.createElement('button');tab.id=TAB_ID;tab.type='button';
      tab.innerHTML=`<span class="ce-tab-icon">🇪🇸</span><span class="ce-tab-main"><strong>Constitución Española</strong><small>Texto íntegro · 169 artículos · actualizado BOE</small></span><span class="ce-tab-arrow">›</span>`;
      host.insertBefore(tab,host.firstElementChild||null);
      tab.addEventListener('click',()=>{const panel=document.getElementById(UI_ID);panel?.scrollIntoView({behavior:'smooth',block:'start'});tab.classList.add('active');setTimeout(()=>tab.classList.remove('active'),700)});
    }

    if(document.getElementById(UI_ID)){loadData().catch(()=>{});return;}
    const wrap=document.createElement('section');wrap.id=UI_ID;
    wrap.innerHTML=`<div class="ce-head"><div class="ce-kicker">Bloque 1 · Texto íntegro</div><h2 class="ce-title">Constitución Española</h2><p class="ce-sub">Consulta artículo por artículo del texto consolidado, con búsqueda completa y copia local para consulta posterior.</p><div class="ce-meta"><span class="ce-chip">BOE-A-1978-31229</span><span class="ce-chip">Actualización: 20/05/2026</span><span class="ce-chip"><span class="ce-total">169</span> artículos</span><span class="ce-chip">Fuente oficial BOE</span></div></div><div class="ce-toolbar"><input class="ce-search" type="search" placeholder="Buscar dentro de los 169 artículos…"/><button class="ce-btn ce-open-boe">BOE ↗</button><button class="ce-btn primary ce-clear">Mostrar todo</button></div><div class="ce-index"><div class="ce-statbar"><div class="ce-stat"><strong class="ce-count">0</strong><small>Artículos visibles</small></div><div class="ce-stat"><strong class="ce-total">169</strong><small>Artículos cargados</small></div><div class="ce-stat"><strong>2026</strong><small>Versión BOE</small></div><div class="ce-stat"><strong>OFFLINE</strong><small>Tras primera carga</small></div></div><div class="ce-notice">La aplicación conserva una copia local del texto cargado. «Mostrar todo» abre todos los artículos; al volver a pulsarlo los cierra. La fuente jurídica de referencia es el BOE.</div><div class="ce-status">Cargando articulado…</div></div><div class="ce-section"><div class="ce-section-label">Articulado <span class="ce-query"></span></div><div class="ce-results"></div></div><div class="ce-section ce-dispositions-wrap"><div class="ce-section-label">Disposiciones</div><div class="ce-dispositions"></div></div>`;
    host.appendChild(wrap);

    wrap.querySelector('.ce-search').addEventListener('input',e=>{state.query=e.target.value.trim();state.allOpen=false;render()});
    wrap.querySelector('.ce-open-boe').addEventListener('click',()=>window.open(BOE_URL,'_blank','noopener'));
    wrap.querySelector('.ce-clear').addEventListener('click',()=>{state.allOpen=!state.allOpen;if(state.query){state.query='';wrap.querySelector('.ce-search').value=''}render();wrap.querySelector('.ce-clear').scrollIntoView({block:'nearest'})});
    loadData().catch(e=>{const status=wrap.querySelector('.ce-status');status.textContent='Error de carga: '+(e?.message||'desconocido')+'. Reintentando…';setTimeout(()=>loadData().catch(()=>{}),1500)});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
  window.addEventListener('load',mount,{once:true});
})();
