/* ============================================================
   CENTINELA CODE — BLOQUE 1 JURÍDICO
   Constitucional, institucional y régimen administrativo.
   Módulo autocontenido: no sustituye los buscadores existentes.
   ============================================================ */
(function(){
  'use strict';

  const DATA_URL='./data/bloque1_juridico.json';
  const INF_URL='./data/infracciones_bloque1.json';
  const state={data:null,infracciones:null,filtro:'todas',busqueda:''};

  const esc=(v)=>String(v??'')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#039;');

  const norm=(v)=>String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');

  function host(){
    return document.getElementById('section-normativa') ||
           document.querySelector('.app-section[id*="normativa"]') ||
           document.querySelector('.normativa-list')?.parentElement ||
           document.querySelector('.main-content');
  }

  function ensureStyles(){
    if(document.getElementById('bloque1-juridico-style')) return;
    const s=document.createElement('style');
    s.id='bloque1-juridico-style';
    s.textContent=`
      .b1-shell{margin:14px 0 24px;border:1px solid rgba(55,176,255,.48);border-radius:22px;background:linear-gradient(145deg,rgba(2,17,31,.98),rgba(3,29,50,.94));box-shadow:0 15px 45px rgba(0,0,0,.42),inset 0 0 34px rgba(19,143,230,.055);overflow:hidden}
      .b1-head{padding:18px 18px 14px;border-bottom:1px solid rgba(55,176,255,.2);background:linear-gradient(120deg,rgba(12,77,128,.18),rgba(0,0,0,0))}
      .b1-kicker{font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#56bcff;font-weight:900;margin-bottom:6px}
      .b1-title{margin:0;font-size:25px;line-height:1.05;font-weight:900;color:#f5fbff;text-shadow:0 2px 8px #000}
      .b1-sub{margin:7px 0 0;color:#abc0d3;font-size:12px;line-height:1.4}
      .b1-meta{display:flex;flex-wrap:wrap;gap:7px;margin-top:11px}
      .b1-chip{display:inline-flex;align-items:center;gap:5px;border:1px solid rgba(92,191,255,.35);border-radius:999px;padding:6px 9px;background:rgba(0,0,0,.18);color:#dff2ff;font-size:10px;font-weight:800}
      .b1-toolbar{padding:12px;display:grid;grid-template-columns:1.6fr .8fr;gap:8px;background:rgba(1,10,18,.35)}
      .b1-search,.b1-select{width:100%;border:1px solid #215e89;border-radius:12px;padding:11px 12px;background:#03111f;color:#eff8ff;outline:none}
      .b1-search:focus,.b1-select:focus{border-color:#45b8ff;box-shadow:0 0 0 2px rgba(69,184,255,.12)}
      .b1-filters{display:flex;gap:7px;overflow:auto;padding:0 12px 12px}
      .b1-filter{white-space:nowrap;border:1px solid rgba(73,150,207,.35);border-radius:999px;padding:7px 10px;color:#b7ccdf;background:#041321;font-size:10px;font-weight:800}
      .b1-filter.active{background:linear-gradient(180deg,#087be7,#0754a4);color:#fff;border-color:#3eb0ff;box-shadow:0 0 18px rgba(29,145,255,.24)}
      .b1-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:0 12px 12px}
      .b1-stat{padding:10px;border:1px solid rgba(52,123,174,.35);border-radius:12px;background:rgba(0,0,0,.16);text-align:center}
      .b1-stat strong{display:block;color:#5bc0ff;font-size:18px}.b1-stat small{color:#94a9bd;font-size:9px;text-transform:uppercase}
      .b1-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;padding:12px}
      .b1-card{border:1px solid rgba(51,125,177,.42);border-radius:16px;background:linear-gradient(150deg,rgba(6,31,51,.88),rgba(2,13,24,.96));padding:14px;box-shadow:inset 0 0 22px rgba(36,131,203,.035);min-height:190px}
      .b1-card-top{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.b1-type{font-size:9px;color:#63c8ff;text-transform:uppercase;font-weight:900;letter-spacing:.5px}.b1-upd{font-size:9px;color:#91a7bb;white-space:nowrap}
      .b1-card h3{margin:8px 0 6px;font-size:16px;color:#f5fbff;line-height:1.15}.b1-ref{font-size:10px;color:#9fc1da}.b1-desc{font-size:11px;line-height:1.45;color:#c2d2e0;margin:8px 0}.b1-tags{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px}.b1-tag{font-size:8px;padding:4px 6px;border-radius:6px;background:rgba(18,124,208,.16);border:1px solid rgba(45,151,226,.22);color:#a9d8f7}
      .b1-actions{display:flex;gap:7px;margin-top:11px;flex-wrap:wrap}.b1-btn{display:inline-flex;align-items:center;justify-content:center;text-decoration:none;border-radius:9px;padding:7px 9px;font-size:9px;font-weight:900}.b1-btn.primary{background:#087ce8;color:#fff}.b1-btn.secondary{border:1px solid #245e8a;color:#bfe4ff;background:rgba(0,0,0,.12)}
      .b1-infra{border-color:rgba(255,188,40,.4);background:linear-gradient(150deg,rgba(59,44,5,.35),rgba(16,14,6,.95))}.b1-severity{font-size:8px;font-weight:900;padding:4px 6px;border-radius:999px;border:1px solid #d4a900;color:#ffd84b;background:rgba(255,197,0,.08)}
      .b1-detail{margin:0 12px 12px;padding:14px;border:1px solid rgba(56,160,229,.28);border-radius:15px;background:rgba(0,0,0,.15)}.b1-detail h4{margin:0 0 8px;color:#fff;font-size:13px}.b1-detail p{margin:6px 0;color:#b9ccdc;font-size:11px;line-height:1.5}.b1-detail ul{margin:8px 0 0 18px;padding:0;color:#c9d8e5;font-size:10px;line-height:1.55}
      .b1-notice{margin:0 12px 12px;padding:11px 12px;border-left:3px solid #40b8ff;background:rgba(11,103,176,.08);color:#abc4d7;font-size:10px;line-height:1.45}
      .b1-empty{padding:30px 12px;text-align:center;color:#8ea5ba;font-size:12px}
      @media(max-width:680px){.b1-toolbar{grid-template-columns:1fr}.b1-grid{grid-template-columns:1fr}.b1-stats{grid-template-columns:repeat(3,1fr)}.b1-title{font-size:22px}}
    `;
    document.head.appendChild(s);
  }

  function classify(n){
    if(!n) return 'todas';
    const t=String(n.tipo||'').toLowerCase();
    if(t.includes('constitucion')) return 'constitucion';
    if(n.ambito==='Andalucía') return 'andalucia';
    if(t.includes('real decreto legislativo')) return 'empleo';
    if(String(n.numero||'').includes('2568')) return 'local';
    if(String(n.numero||'').includes('39') || String(n.numero||'').includes('40')) return 'administrativo';
    return 'todas';
  }

  function matches(n){
    const f=state.filtro;
    const q=norm(state.busqueda);
    if(f!=='todas' && classify(n)!==f) return false;
    if(!q) return true;
    const hay=[n.titulo,n.numero,n.referencia,n.ambito,(n.materias||[]).join(' '),(n.temas||[]).join(' '),(n.articulosClave||[]).map(a=>`${a.numero} ${a.titulo} ${a.resumen}`).join(' ')].join(' ');
    return norm(hay).includes(q);
  }

  function render(){
    const root=document.getElementById('centinela-bloque1');
    if(!root||!state.data) return;
    const normas=state.data.normas.filter(matches);
    const inf=state.infracciones?.infracciones||[];
    const infFiltered=state.filtro==='infracciones' || (state.busqueda && norm('infracciones').includes(norm(state.busqueda)))
      ? inf.filter(i=>!state.busqueda || norm(`${i.titulo} ${i.articulo} ${i.descripcion} ${i.norma}`).includes(norm(state.busqueda))) : [];
    const totalNormas=state.data.normas.length;
    root.innerHTML=`
      <div class="b1-head"><div class="b1-kicker">Bloque 1 · Base jurídica</div><h2 class="b1-title">Constitucional, institucional y régimen administrativo</h2><p class="b1-sub">Consulta rápida de normativa del temario, artículos clave, fuentes oficiales e infracciones disciplinarias relacionadas.</p><div class="b1-meta"><span class="b1-chip">📚 Temas ${state.data.temas.join(', ')}</span><span class="b1-chip">⚖️ ${totalNormas} normas indexadas</span><span class="b1-chip">🚨 ${(state.infracciones?.infracciones||[]).length} infracciones</span></div></div>
      <div class="b1-toolbar"><input id="b1-search" class="b1-search" placeholder="Buscar ley, artículo, concepto o infracción…" value="${esc(state.busqueda)}"/><select id="b1-select" class="b1-select"><option value="todas">Todas las normas</option><option value="constitucion">Constitución</option><option value="andalucia">Andalucía</option><option value="administrativo">Administrativo</option><option value="local">Régimen local</option><option value="empleo">Empleo público</option><option value="infracciones">Infracciones</option></select></div>
      <div class="b1-filters"><button class="b1-filter ${state.filtro==='todas'?'active':''}" data-f="todas">Normas</button><button class="b1-filter ${state.filtro==='constitucion'?'active':''}" data-f="constitucion">Constitución</button><button class="b1-filter ${state.filtro==='andalucia'?'active':''}" data-f="andalucia">Andalucía</button><button class="b1-filter ${state.filtro==='administrativo'?'active':''}" data-f="administrativo">Administrativo</button><button class="b1-filter ${state.filtro==='local'?'active':''}" data-f="local">Local</button><button class="b1-filter ${state.filtro==='empleo'?'active':''}" data-f="empleo">Empleo público</button><button class="b1-filter ${state.filtro==='infracciones'?'active':''}" data-f="infracciones">Infracciones</button></div>
      <div class="b1-stats"><div class="b1-stat"><strong>${normas.length}</strong><small>Resultados</small></div><div class="b1-stat"><strong>${state.data.normas.filter(n=>classify(n)==='andalucia').length}</strong><small>Andalucía</small></div><div class="b1-stat"><strong>${inf.length}</strong><small>Infracciones</small></div></div>
      <div class="b1-notice">La información consolidada se ofrece con finalidad informativa. La fuente oficial debe consultarse para efectos jurídicos. La fecha de actualización mostrada corresponde a la referencia utilizada en el módulo.</div>
      ${state.filtro==='infracciones' ? `<div class="b1-grid">${infFiltered.length?infFiltered.map(infraccionCard).join(''):`<div class="b1-empty">No hay infracciones que coincidan con la búsqueda.</div>`}</div>` : `<div class="b1-grid">${normas.length?normas.map(normCard).join(''):`<div class="b1-empty">No hay resultados. Prueba con otra búsqueda.</div>`}</div>`}
      ${detailPanel()}
    `;
    root.querySelector('#b1-select').value=state.filtro;
    root.querySelector('#b1-search').addEventListener('input',e=>{state.busqueda=e.target.value;render();bindStable();});
    root.querySelector('#b1-select').addEventListener('change',e=>{state.filtro=e.target.value;render();bindStable();});
    bindStable();
  }

  function bindStable(){
    const root=document.getElementById('centinela-bloque1'); if(!root)return;
    root.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{state.filtro=b.dataset.f;render();});
    root.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>showDetail(b.dataset.open));
  }

  function normCard(n){
    const arts=(n.articulosClave||[]).slice(0,4);
    const tags=(n.materias||[]).slice(0,4);
    return `<article class="b1-card"><div class="b1-card-top"><span class="b1-type">${esc(n.tipo)} · ${esc(n.ambito)}</span><span class="b1-upd">Act.: ${esc(n.ultimaActualizacion||'—')}</span></div><h3>${esc(n.titulo)}</h3><div class="b1-ref">${esc(n.numero)} · ${esc(n.referencia)}</div><p class="b1-desc">Temas: ${(n.temas||[]).join(', ')} · ${(arts.length?arts.map(a=>`art. ${esc(a.numero)}`).join(' · '):'consulta por materia')}</p><div class="b1-tags">${tags.map(t=>`<span class="b1-tag">${esc(t)}</span>`).join('')}</div><div class="b1-actions"><button class="b1-btn primary" data-open="${esc(n.id)}">Ver contenido clave</button><a class="b1-btn secondary" target="_blank" rel="noopener" href="${esc(n.fuenteOficial)}">Fuente oficial ↗</a></div></article>`;
  }

  function infraccionCard(i){
    return `<article class="b1-card b1-infra"><div class="b1-card-top"><span class="b1-type">${esc(i.norma)}</span><span class="b1-severity">${esc(i.gravedad)}</span></div><h3>${esc(i.titulo)}</h3><div class="b1-ref">Art. ${esc(i.articulo)} · Prescripción: ${esc(i.prescripcion||'—')}</div><p class="b1-desc">${esc(i.descripcion)}</p><div class="b1-actions"><button class="b1-btn primary" data-open="${esc(i.id)}">Ficha de infracción</button><a class="b1-btn secondary" target="_blank" rel="noopener" href="${esc(i.fuente)}">Fuente oficial ↗</a></div></article>`;
  }

  function detailPanel(){ return `<div id="b1-detail" class="b1-detail" style="display:none"></div>`; }

  function showDetail(id){
    const d=document.getElementById('b1-detail'); if(!d)return;
    let n=state.data.normas.find(x=>x.id===id);
    if(n){
      d.style.display='block';
      d.innerHTML=`<h4>${esc(n.titulo)}</h4><p><strong>Referencia:</strong> ${esc(n.numero)} · ${esc(n.referencia)} · ${esc(n.ambito)}</p><p><strong>Actualización:</strong> ${esc(n.ultimaActualizacion||'—')}</p><p><strong>Temas:</strong> ${(n.temas||[]).join(', ')}</p><p><strong>Artículos / bloques clave:</strong></p><ul>${(n.articulosClave||[]).map(a=>`<li><strong>Art. ${esc(a.numero)} — ${esc(a.titulo)}:</strong> ${esc(a.resumen)}</li>`).join('')}</ul><div class="b1-actions"><a class="b1-btn primary" target="_blank" rel="noopener" href="${esc(n.fuenteOficial)}">Abrir fuente oficial ↗</a>${n.archivoExistente?`<span class="b1-btn secondary">Archivo local: ${esc(n.archivoExistente)}</span>`:''}</div>`;
      d.scrollIntoView({behavior:'smooth',block:'nearest'});return;
    }
    const inf=(state.infracciones?.infracciones||[]).find(x=>x.id===id);
    if(inf){
      d.style.display='block';
      d.innerHTML=`<h4>${esc(inf.titulo)}</h4><p><strong>${esc(inf.norma)} · Art. ${esc(inf.articulo)} · ${esc(inf.gravedad)}</strong></p><p>${esc(inf.descripcion)}</p><p><strong>Sanciones relacionadas:</strong> ${esc(inf.sancionesRelacionadas||'Consultar norma')}</p><p><strong>Prescripción:</strong> ${esc(inf.prescripcion||'—')}</p><div class="b1-actions"><a class="b1-btn primary" target="_blank" rel="noopener" href="${esc(inf.fuente)}">Abrir fuente oficial ↗</a></div>`;
      d.scrollIntoView({behavior:'smooth',block:'nearest'});
    }
  }

  async function load(){
    ensureStyles();
    let h=host(); if(!h)return setTimeout(load,600);
    if(document.getElementById('centinela-bloque1')) return;
    const wrap=document.createElement('section');
    wrap.id='centinela-bloque1';wrap.className='b1-shell';
    h.appendChild(wrap);
    try{
      const [a,b]=await Promise.all([fetch(DATA_URL,{cache:'no-cache'}),fetch(INF_URL,{cache:'no-cache'})]);
      if(!a.ok||!b.ok) throw new Error('No se pudieron cargar los datos del Bloque 1');
      state.data=await a.json();state.infracciones=await b.json();render();
      window.CENTINELA_BLOQUE1={data:state.data,infracciones:state.infracciones,search:(q)=>{state.busqueda=q||'';render()}};
    }catch(e){wrap.innerHTML=`<div class="b1-empty">No se ha podido cargar el Bloque 1 jurídico. ${esc(e.message)}</div>`;console.warn('Centinela Bloque 1',e);}
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',load); else load();
  window.addEventListener('load',load);
})();
