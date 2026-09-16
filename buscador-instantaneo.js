/* CENTINELA CODE — BUSCADOR INSTANTÁNEO DE SANCIONES
   BÚSQUEDA ESTRICTA: solo muestra infracciones que realmente contienen
   la palabra/concepto buscado. No usa sinónimos amplios que provoquen
   falsos positivos (ej.: «navaja» NO devuelve cualquier infracción de armas).
*/
(function(){
  'use strict';
  if(window.__centinelaInstantSearchInstalled)return;
  window.__centinelaInstantSearchInstalled=true;

  const input=()=>document.getElementById('consultaSearch');
  const box=()=>document.getElementById('consultaResults');
  const count=()=>document.getElementById('consultaResultCount');
  let data=null, loading=null, timer=null, generation=0;

  const norm=s=>String(s??'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9./€]+/g,' ').replace(/\s+/g,' ').trim();
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));

  function codeMatch(r,q){
    const n=norm(q);
    if(!n)return false;
    const codigo=norm(r?.codigo), articulo=norm(r?.articulo), apartado=norm(r?.apartado);
    return codigo===n || `${articulo}.${apartado}`===n || articulo===n;
  }

  // Coincidencia real por palabras. Permite singular/plural simple, pero NO sinónimos.
  function containsTerm(text,q){
    const n=norm(q);
    if(!n)return false;
    if(text===n || text.includes(` ${n} `) || text.startsWith(`${n} `) || text.endsWith(` ${n}`))return true;
    if(!n.includes(' ')){
      const plural=n.endsWith('z')?n.slice(0,-1)+'ces':n.endsWith('s')?n:n+'s';
      if(text===plural || text.includes(` ${plural} `) || text.startsWith(`${plural} `) || text.endsWith(` ${plural}`))return true;
    }
    return false;
  }

  function sanction(v){
    if(v==null)return '';
    if(typeof v!=='object')return String(v);
    const min=v.min??v.minimo??v.importe_min,max=v.max??v.maximo??v.importe_max,q=v.cuantia??v.cuantía;
    if(min!=null&&max!=null)return `${Number(min).toLocaleString('es-ES')} € – ${Number(max).toLocaleString('es-ES')} €`;
    if(min!=null)return `Desde ${Number(min).toLocaleString('es-ES')} €`;
    if(max!=null)return `Hasta ${Number(max).toLocaleString('es-ES')} €`;
    if(q!=null)return `${Number(q).toLocaleString('es-ES')} €`;
    return v.texto?String(v.texto):'';
  }

  async function load(){
    if(data)return data;
    if(loading)return loading;
    loading=fetch('./data/infracciones.json?instant=20260916d',{cache:'no-store'})
      .then(r=>{if(!r.ok)throw new Error('No se pudo cargar infracciones.json');return r.json();})
      .then(j=>Array.isArray(j)?j:(Array.isArray(j?.infracciones)?j.infracciones:[]))
      .catch(()=>[]);
    data=await loading;
    return data;
  }

  function score(r,q){
    const n=norm(q);
    if(!n)return -1;
    if(codeMatch(r,q))return 5000;
    const title=norm(r?.titulo);
    const conducta=norm(r?.conducta);
    const keywords=norm(Array.isArray(r?.palabrasClave)?r.palabrasClave.join(' '):r?.palabrasClave);
    const desc=norm([r?.descripcion,r?.descripcion_corta,r?.materia,r?.objeto].join(' '));
    let s=-1;
    if(containsTerm(title,n))s=Math.max(s,3000);
    if(containsTerm(keywords,n))s=Math.max(s,2800);
    if(containsTerm(conducta,n))s=Math.max(s,2200);
    if(containsTerm(desc,n))s=Math.max(s,1800);
    return s;
  }

  function render(results,q){
    const b=box(); if(!b)return;
    if(count)count.textContent=String(results.length);
    if(!results.length){
      b.innerHTML=`<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Sin resultados</h3><p>No se ha encontrado una coincidencia real con «${esc(q)}».</p></div>`;
      return;
    }
    b.innerHTML=results.map((r,i)=>{
      const sanc=sanction(r.sancion??r.multa);
      const art=r.articulo?(r.apartado?`${r.articulo}.${r.apartado}`:r.articulo):'';
      return `<article class="result-card cc-instant-result" data-result="${i}" style="display:block!important;opacity:1!important;visibility:visible!important;">
        <div class="result-card-header"><div><span class="result-ley">${esc(r.ley||'LO 4/2015')}</span>${art?`<span class="result-code">Art. ${esc(art)}</span>`:''}<h3>${esc(r.titulo||r.codigo||'Infracción')}</h3></div>${r.gravedad?`<span class="severity-badge">${esc(r.gravedad)}</span>`:''}</div>
        <p class="result-conducta">${esc(r.conducta||r.descripcion||'')}</p>
        ${sanc?`<div class="cc-instant-sanction" style="display:block!important;margin-top:10px;padding:10px 12px;border:1px solid rgba(255,211,74,.5);border-radius:10px;background:rgba(255,180,0,.08);"><strong style="display:block;font-size:12px;letter-spacing:.3px;">⚖️ Sanción</strong><span style="display:block;margin-top:4px;font-size:14px;font-weight:800;">${esc(sanc)}</span></div>`:''}
        <div class="result-meta"><span class="result-pill">${esc(r.codigo||r.fuente||'LOPSC')}</span></div>
      </article>`;
    }).join('');
  }

  async function search(q){
    const my=++generation; q=String(q||'').trim();
    if(!q){if(count)count.textContent='0';if(box())box().innerHTML='<div class="empty-state"><div class="empty-icon">🔎</div><h3>Buscar normativa o infracción</h3><p>Introduce una palabra, conducta, artículo o código.</p></div>';return;}
    const rows=await load(); if(my!==generation)return;
    const results=rows.map(r=>({r,s:score(r,q)})).filter(x=>x.s>=0).sort((a,b)=>b.s-a.s).slice(0,20).map(x=>x.r);
    render(results,q);
  }

  function install(){
    const i=input(); if(!i)return false;
    i.removeAttribute('disabled');i.removeAttribute('readonly');
    if(i.dataset.ccInstantInstalled)return true;
    i.dataset.ccInstantInstalled='1';
    i.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(()=>search(i.value),40);},{capture:true,passive:true});
    i.addEventListener('keyup',e=>{if(e.key==='Enter'){clearTimeout(timer);search(i.value);}}, {capture:true});
    if(i.value.trim())search(i.value);
    load();
    return true;
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
  [100,400,900,1800,3000].forEach(ms=>setTimeout(install,ms));
  window.CentinelaInstantSearch={search,install};
})();
