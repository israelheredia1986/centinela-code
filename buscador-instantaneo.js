/* CENTINELA CODE — BUSCADOR INSTANTÁNEO DE SANCIONES
   Primera respuesta inmediata desde data/infracciones.json.
   No requiere pulsar filtros ni abrir "Ver detalle" para ver la sanción.
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
  const aliases={
    navaja:['navaja','navajas','arma blanca','arma','armas','cuchillo','cuchillos','cuchilla','cuchillas','daga','puñal','punal','espada','espadas','katana','catana','sable','machete','estilete','objeto cortante','objeto punzante'],
    espada:['espada','espadas','arma','armas','arma blanca','navaja','navajas','cuchillo','cuchillos','katana','catana','sable','machete','daga','puñal','punal','estoque','florete','alfanje'],
    arma:['arma','armas','arma blanca','navaja','navajas','cuchillo','cuchillos','espada','espadas','katana','catana','sable','machete','daga','puñal','punal'],
    desobediencia:['desobediencia','desobedecer','resistencia','resistirse','negativa','identificarse','agente','autoridad'],
    '36.6':['36.6','desobediencia','resistencia','identificacion','identificación','datos falsos','agente','autoridad'],
    patinete:['patinete','vmp','vehiculo de movilidad personal'],
    vmp:['vmp','patinete','vehiculo de movilidad personal'],
    ppp:['ppp','perro potencialmente peligroso','potencialmente peligroso','perro'],
    perro:['perro','perros','can','animal','ppp','potencialmente peligroso'],
    alcohol:['alcohol','alcoholemia','embriaguez','bebidas alcoholicas','botellon'],
    droga:['droga','drogas','estupefaciente','cannabis','hachis','marihuana','cocaina'],
    ruido:['ruido','ruidos','molestia','musica','vibraciones','contaminacion acustica']
  };

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
    loading=fetch('./data/infracciones.json?instant=20260916',{cache:'no-store'})
      .then(r=>r.json())
      .then(j=>Array.isArray(j)?j:(Array.isArray(j?.infracciones)?j.infracciones:[]))
      .catch(()=>[]);
    data=await loading;
    return data;
  }

  function terms(q){
    const n=norm(q), a=aliases[n]||[n];
    return [...new Set(a.map(norm).filter(Boolean))];
  }

  function score(r,q){
    const hay=norm([r.codigo,r.ley,r.articulo,r.apartado,r.gravedad,r.titulo,r.conducta,r.sancion,r.palabrasClave].join(' '));
    const t=terms(q); let s=0, hits=0;
    for(const x of t){if(hay.includes(x)){hits++;s+=x===norm(q)?1000:250;if(norm(r.titulo).includes(x))s+=500;if(norm(r.palabrasClave?.join?.(' ')).includes(x))s+=350;}}
    if(norm(r.codigo)===norm(q)||norm(`${r.articulo}.${r.apartado}`)===norm(q))s+=3000;
    if(r.sancion)s+=500;
    return hits?s:-1;
  }

  function render(results,q){
    const b=box(); if(!b)return;
    if(count)count.textContent=String(results.length);
    if(!results.length){b.innerHTML=`<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Sin resultados</h3><p>No se ha encontrado coincidencia con «${esc(q)}».</p></div>`;return;}
    b.innerHTML=results.map((r,i)=>{
      const sanc=sanction(r.sancion??r.multa);
      const art=r.articulo?(r.apartado?`${r.articulo}.${r.apartado}`:r.articulo):'';
      return `<article class="result-card cc-instant-result" data-result="${i}" style="display:block!important;opacity:1!important;visibility:visible!important;">
        <div class="result-card-header"><div><span class="result-ley">${esc(r.ley||'LO 4/2015')}</span>${art?`<span class="result-code">Art. ${esc(art)}</span>`:''}<h3>${esc(r.titulo||r.codigo||'Infracción')}</h3></div>${r.gravedad?`<span class="severity-badge">${esc(r.gravedad)}</span>`:''}</div>
        <p class="result-conducta">${esc(r.conducta||'')}</p>
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
    i.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(()=>search(i.value),80);},{capture:true,passive:true});
    i.addEventListener('keyup',e=>{if(e.key==='Enter'){clearTimeout(timer);search(i.value);}}, {capture:true});
    if(i.value.trim())search(i.value);
    return true;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
  [100,400,900,1800,3000].forEach(ms=>setTimeout(install,ms));
  window.CentinelaInstantSearch={search,install};
})();
