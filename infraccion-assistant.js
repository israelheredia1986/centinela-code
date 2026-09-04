/* CENTINELA CODE — IDENTIFICADOR DE INFRACCIONES v1.0 */
(function(){
  'use strict';

  const CSS = `
  .cc-infra-modal{position:fixed;inset:0;z-index:10050;display:none;align-items:flex-end;justify-content:center;background:rgba(0,4,12,.72);backdrop-filter:blur(8px);padding:12px;box-sizing:border-box}
  .cc-infra-modal.open{display:flex}
  .cc-infra-panel{width:min(760px,100%);max-height:min(88vh,820px);overflow:auto;border:1px solid rgba(49,185,255,.45);border-radius:24px;background:linear-gradient(160deg,#071a2b,#03101e 62%,#020812);box-shadow:0 24px 70px rgba(0,0,0,.65),inset 0 0 40px rgba(0,157,255,.08);color:#eef8ff;padding:18px;box-sizing:border-box}
  .cc-infra-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}.cc-infra-kicker{font-size:10px;letter-spacing:2px;color:#39d8ff;font-weight:800}.cc-infra-title{font-size:23px;font-weight:900;margin:3px 0 0}.cc-infra-close{width:38px;height:38px;border-radius:12px;border:1px solid #27506e;background:#071624;color:#fff;font-size:20px;cursor:pointer}
  .cc-infra-sub{font-size:12px;color:#a9c7d9;line-height:1.45;margin:0 0 15px}.cc-infra-search{display:flex;gap:8px;margin-bottom:14px}.cc-infra-search input{flex:1;min-width:0;border:1px solid #28617e;background:#020b15;color:#fff;border-radius:13px;padding:13px;font-size:14px;outline:none}.cc-infra-search button{border:0;border-radius:13px;padding:0 15px;background:linear-gradient(135deg,#13cde1,#1687ff);color:#00111d;font-weight:900;cursor:pointer}
  .cc-infra-label{font-size:10px;text-transform:uppercase;letter-spacing:1.2px;color:#7ea5bb;font-weight:800;margin:12px 0 8px}.cc-infra-chips{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.cc-infra-chip{min-height:48px;border:1px solid #214b66;border-radius:13px;background:linear-gradient(145deg,#0a2032,#061321);color:#eaf8ff;font-weight:800;font-size:12px;cursor:pointer;text-align:left;padding:8px 10px}.cc-infra-chip.active{border-color:#24d8e8;background:linear-gradient(145deg,#0d4150,#08243a);box-shadow:0 0 0 1px rgba(36,216,232,.2),0 0 18px rgba(36,216,232,.12)}.cc-infra-chip span{display:block;font-size:20px;margin-bottom:2px}.cc-infra-conducts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.cc-infra-conduct{border:1px solid #24465d;background:#061522;color:#dff4ff;border-radius:11px;padding:10px;text-align:left;font-size:12px;cursor:pointer}.cc-infra-conduct.active{border-color:#ffd34a;background:#2a2410;color:#fff2b0}.cc-infra-results{display:grid;gap:9px;margin-top:12px}.cc-infra-result{border:1px solid #234d66;border-radius:15px;background:linear-gradient(145deg,rgba(10,31,47,.96),rgba(3,14,24,.96));padding:13px}.cc-infra-result-top{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}.cc-infra-result h4{margin:0;font-size:14px;line-height:1.3}.cc-infra-badge{font-size:9px;font-weight:900;padding:5px 7px;border-radius:7px;white-space:nowrap;background:#143d4c;color:#61eaff}.cc-infra-meta{display:flex;flex-wrap:wrap;gap:6px;margin:9px 0}.cc-infra-meta b{font-size:9px;padding:5px 7px;border-radius:7px;background:#071c2b;border:1px solid #1d4055;color:#9ed3eb}.cc-infra-law{font-size:11px;color:#a9c9d9;line-height:1.4}.cc-infra-actions{display:flex;gap:7px;margin-top:10px}.cc-infra-actions button{border:1px solid #2a5974;background:#081a29;color:#dff5ff;border-radius:9px;padding:8px 10px;font-size:10px;font-weight:800;cursor:pointer}.cc-infra-actions .primary{background:linear-gradient(135deg,#18d7df,#158bff);border:0;color:#00111a}.cc-infra-empty{padding:15px;border:1px dashed #28536b;border-radius:13px;color:#8fb1c4;font-size:11px;text-align:center}.cc-infra-note{font-size:9px;color:#7898aa;margin-top:13px;line-height:1.4}
  @media(max-width:520px){.cc-infra-modal{padding:7px}.cc-infra-panel{border-radius:21px;padding:14px;max-height:92vh}.cc-infra-chips{grid-template-columns:repeat(2,minmax(0,1fr))}.cc-infra-title{font-size:20px}.cc-infra-search button{padding:0 11px}.cc-infra-conducts{grid-template-columns:1fr}}
  `;
  const style=document.createElement('style');style.id='cc-infra-assistant-style';style.textContent=CSS;document.head.appendChild(style);

  const categories=[
    ['🚗','Vehículo',['móvil','alcohol','drogas','velocidad','estacionamiento','permiso','seguro','documentación','ITV','cinturón']],
    ['🛴','VMP',['casco','seguro','registro','acera','zona prohibida','pasajero','móvil','alcohol','drogas','alumbrado','menor']],
    ['🚲','Bicicleta',['casco','acera','alumbrado','móvil','alcohol','pasajero','circulación','documentación']],
    ['👤','Persona',['identificación','arma','droga','amenaza','agresión','ruido','desobediencia','mendicidad']],
    ['🏪','Establecimiento',['horario','aforo','ruido','licencia','alcohol','tabaco','seguridad','venta']],
    ['🏙️','Ordenanza',['ruido','limpieza','residuos','animales','ocupación','terrazas','convivencia','vehículos']]
  ];

  let selected=null, query='';
  function getData(){
    const e=window.estado||{}; let arr=Array.isArray(e.infracciones)?e.infracciones:[];
    const extras=[e.infraccionesVmpBicicletas,e.infraccionesTrafico];
    extras.forEach(x=>{if(Array.isArray(x))arr=arr.concat(x)});
    return arr;
  }
  function textOf(x){return [x.titulo,x.nombre,x.descripcion,x.conducta,x.materia,x.categoria,x.articulo,x.norma,x.ley,x.sancion,x.observaciones].filter(Boolean).join(' ').toLowerCase()}
  function norm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
  function findResults(){
    const q=norm(query); const terms=q.split(/\s+/).filter(Boolean); let data=getData();
    if(!terms.length&&!selected)return [];
    const wanted=selected?selected[1].toLowerCase():'';
    const catTerms=selected?selected[2]:[];
    let scored=data.map((x,i)=>{const t=norm(textOf(x));let score=0;terms.forEach(w=>{if(t.includes(w))score+=3});if(wanted&&t.includes(norm(wanted)))score+=1;catTerms.forEach(w=>{if(t.includes(norm(w)))score+=1});return {x,score,i}}).filter(r=>r.score>0).sort((a,b)=>b.score-a.score);
    return scored.slice(0,8).map(r=>r.x);
  }
  function val(x,keys,fallback='—'){for(const k of keys)if(x&&x[k]!==undefined&&x[k]!==null&&x[k]!=='')return x[k];return fallback}
  function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

  function ensureModal(){
    if(document.getElementById('ccInfraModal'))return;
    const m=document.createElement('div');m.id='ccInfraModal';m.className='cc-infra-modal';m.innerHTML=`<div class="cc-infra-panel" role="dialog" aria-modal="true" aria-label="Identificar infracción"><div class="cc-infra-head"><div><div class="cc-infra-kicker">CENTINELA CODE · ASISTENTE POLICIAL</div><div class="cc-infra-title">⚠️ Identificar infracción</div></div><button class="cc-infra-close" id="ccInfraClose" aria-label="Cerrar">×</button></div><p class="cc-infra-sub">Describe lo ocurrido o combina categoría y conducta. Centinela buscará las coincidencias disponibles en la base local.</p><div class="cc-infra-search"><input id="ccInfraInput" placeholder="Ej.: patinete por acera sin casco" autocomplete="off"><button id="ccInfraSearch">IDENTIFICAR</button></div><div class="cc-infra-label">1 · ¿Qué estás controlando?</div><div class="cc-infra-chips" id="ccInfraCats"></div><div class="cc-infra-label">2 · Conducta observada</div><div class="cc-infra-conducts" id="ccInfraConducts"><div class="cc-infra-empty">Selecciona una categoría o escribe directamente la conducta.</div></div><div class="cc-infra-label">3 · Resultado</div><div id="ccInfraResults"><div class="cc-infra-empty">Todavía no hay una identificación. Introduce una conducta para empezar.</div></div><div class="cc-infra-note">La identificación es una ayuda de consulta. Antes de sancionar, verifica la norma vigente, las circunstancias del hecho y la competencia aplicable.</div></div>`;document.body.appendChild(m);
    const cats=document.getElementById('ccInfraCats');categories.forEach((c,i)=>{const b=document.createElement('button');b.className='cc-infra-chip';b.innerHTML=`<span>${c[0]}</span>${c[1]}`;b.onclick=()=>{selected=c;b.classList.toggle('active',true);document.querySelectorAll('.cc-infra-chip').forEach(z=>{if(z!==b)z.classList.remove('active')});renderConducts()};cats.appendChild(b)});
    document.getElementById('ccInfraClose').onclick=close; m.addEventListener('click',e=>{if(e.target===m)close()});
    document.getElementById('ccInfraSearch').onclick=run;
    document.getElementById('ccInfraInput').addEventListener('keydown',e=>{if(e.key==='Enter')run()});
  }
  function renderConducts(){const box=document.getElementById('ccInfraConducts');if(!selected){box.innerHTML='<div class="cc-infra-empty">Selecciona una categoría o escribe directamente la conducta.</div>';return}box.innerHTML=selected[2].map(x=>`<button class="cc-infra-conduct" data-conduct="${esc(x)}">${esc(x)}</button>`).join('');box.querySelectorAll('button').forEach(b=>b.onclick=()=>{query=b.dataset.conduct;document.getElementById('ccInfraInput').value=query;box.querySelectorAll('button').forEach(z=>z.classList.remove('active'));b.classList.add('active');run()})}
  function run(){query=document.getElementById('ccInfraInput').value.trim();const results=findResults();renderResults(results)}
  function renderResults(results){const box=document.getElementById('ccInfraResults');if(!results.length){box.innerHTML='<div class="cc-infra-empty">No he encontrado una coincidencia suficiente en la base local. Prueba con otra descripción, categoría o palabra clave.</div>';return}box.innerHTML='<div class="cc-infra-results">'+results.map((x,i)=>{const title=val(x,['titulo','nombre','descripcion'],'Infracción');const law=val(x,['norma','ley','normativa'],'Normativa no indicada');const art=val(x,['articulo','artículo','article'],'—');const sev=val(x,['gravedad','severity'],'—');const amount=val(x,['importe','sancion','sanción','cuantia'],'—');return `<article class="cc-infra-result"><div class="cc-infra-result-top"><h4>${esc(title)}</h4><span class="cc-infra-badge">${esc(sev)}</span></div><div class="cc-infra-meta"><b>Art. ${esc(art)}</b><b>${esc(amount)}</b></div><div class="cc-infra-law">${esc(law)}</div><div class="cc-infra-actions"><button data-detail="${esc(val(x,['id','codigo','code'],''))}">VER DETALLE</button><button class="primary" data-acta="${esc(val(x,['id','codigo','code'],''))}">📝 CREAR ACTA</button></div></article>`}).join('')+'</div>';box.querySelectorAll('[data-detail]').forEach(b=>b.onclick=()=>{const id=b.dataset.detail;if(id&&typeof window.abrirDetalleInfraccion==='function')window.abrirDetalleInfraccion(id);else if(typeof window.mostrarToast==='function')window.mostrarToast('Consulta el detalle desde la sección de infracciones.')});box.querySelectorAll('[data-acta]').forEach(b=>b.onclick=()=>{if(typeof window.activarSeccion==='function')window.activarSeccion('actas');else document.querySelector('[data-section="actas"],#nav-actas')?.click();if(typeof window.mostrarToast==='function')window.mostrarToast('Completa los datos del acta con la infracción identificada.')})}
  function open(){ensureModal();selected=null;query='';document.getElementById('ccInfraInput').value='';document.querySelectorAll('.cc-infra-chip').forEach(z=>z.classList.remove('active'));renderConducts();document.getElementById('ccInfraResults').innerHTML='<div class="cc-infra-empty">Todavía no hay una identificación. Introduce una conducta para empezar.</div>';document.getElementById('ccInfraModal').classList.add('open');setTimeout(()=>document.getElementById('ccInfraInput')?.focus(),100)}
  function close(){document.getElementById('ccInfraModal')?.classList.remove('open')}
  window.CentinelaInfraccionAssistant={open,close,run};

  function wire(){const btn=document.querySelector('[data-cc-search-mode="infractions"]');if(!btn)return;const fresh=btn.cloneNode(true);fresh.removeAttribute('data-cc-search-mode');fresh.setAttribute('data-cc-infraccion-assistant','true');fresh.title='Identificar una posible infracción a partir de la conducta observada';btn.replaceWith(fresh);fresh.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();open()})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire);else wire();
  setTimeout(wire,800);setTimeout(wire,1800);
})();
