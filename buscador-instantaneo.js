/* CENTINELA CODE — BUSCADOR ÚNICO, LITERAL E INSTANTÁNEO
   Regla: una búsqueda solo devuelve una infracción si el término aparece
   realmente en sus datos relevantes. No convierte navaja -> arma -> explosivos.
*/
(function(){
  'use strict';
  const VERSION='20260916e';
  if(window.__centinelaInstantSearchVersion===VERSION)return;
  window.__centinelaInstantSearchVersion=VERSION;

  const $=id=>document.getElementById(id);
  const input=()=>$('consultaSearch');
  const box=()=>$('consultaResults');
  const count=()=>$('consultaResultCount');
  let rows=[];
  let loaded=false;
  let loading=null;
  let timer=0;
  let generation=0;
  let severity='all';

  const SOURCES=[
    ['Infracciones','./data/infracciones.json'],
    ['Tráfico · infracciones','./data/infracciones_trafico.json'],
    ['VMP · infracciones','./data/infracciones_vmp_bicicletas.json'],
    ['LOPSC','./data/lopsc.json'],
    ['Reglamento de Armas','./data/reglamento_armas.json'],
    ['Código Penal','./data/codigo_penal.json'],
    ['Tráfico','./data/normativa_trafico.json'],
    ['Ordenanzas','./data/ordenanzas.json'],
    ['Animales','./data/normativa_animales.json'],
    ['Menores','./data/normativa_menores.json'],
    ['Violencia de género','./data/normativa_violencia_genero.json'],
    ['Ley 2/1986','./data/ley_2_86.json'],
    ['LECrim','./data/lecrim.json'],
    ['Extranjería','./data/extranjeria.json'],
    ['Seguridad privada','./data/seguridad_privada.json'],
    ['Espectáculos públicos','./data/espectaculos_publicos.json'],
    ['Medio ambiente y ruidos','./data/medio_ambiente_ruidos.json'],
    ['Policías Locales Andalucía','./data/policias_locales_andalucia.json'],
    ['Ley 39/2015','./data/ley_39_2015.json'],
    ['Ley 7/1985','./data/ley_7_1985.json'],
    ['Ley 5/2010 Andalucía','./data/ley_5_2010_andalucia.json']
  ];

  const norm=s=>String(s??'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9./€]+/g,' ').replace(/\s+/g,' ').trim();
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const words=s=>norm(s).split(' ').filter(Boolean);
  const field=v=>Array.isArray(v)?v.join(' '):String(v??'');

  function sanction(v){
    if(v==null)return '';
    if(typeof v!=='object')return String(v);
    const min=v.min??v.minimo??v.importe_min;
    const max=v.max??v.maximo??v.importe_max;
    const q=v.cuantia??v.cuantía;
    const f=n=>Number(n).toLocaleString('es-ES');
    if(min!=null&&max!=null)return `${f(min)} € – ${f(max)} €`;
    if(min!=null)return `Desde ${f(min)} €`;
    if(max!=null)return `Hasta ${f(max)} €`;
    if(q!=null)return `${f(q)} €`;
    return v.texto?String(v.texto):'';
  }

  function sourceRows(json,name){
    if(Array.isArray(json))return json.map(x=>({x,name}));
    if(Array.isArray(json?.infracciones))return json.infracciones.map(x=>({x,name}));
    if(Array.isArray(json?.articulos))return json.articulos.map(x=>({x,name}));
    if(Array.isArray(json?.leyes)){
      const out=[];
      json.leyes.forEach(ley=>{
        if(Array.isArray(ley?.articulos))ley.articulos.forEach(a=>out.push({x:{...a,ley:a?.ley||ley?.ley||name},name}));
      });
      return out;
    }
    return [];
  }

  function normalizeRow(x,name){
    if(!x||typeof x!=='object')return null;
    const article=x.articulo??x.artículo??x.numero??x.art??x.precepto??'';
    const apartado=x.apartado??x.parrafo??x.párrafo??'';
    const code=x.codigo??x.código??x.id??'';
    const title=x.titulo??x.título??x.concepto??x.denominacion??x.denominación??x.nombre??'';
    const conduct=x.conducta??x.descripcion??x.descripción??x.texto??x.contenido??x.tipificacion??x.tipificación??x.hechos??x.resumen??'';
    const keywords=field(x.palabrasClave??x.palabras_clave??x.keywords);
    const ley=x.ley??x.normativa??x.fuente??name;
    const sev=x.gravedad??x.severity??x.clasificacion??x.clasificación??'';
    const art=article?(apartado?`${article}.${apartado}`:article):'';
    const sanc=sanction(x.sancion??x.multa);
    return {source:name,code:String(code),ley:String(ley),article:String(art),title:String(title),conduct:String(conduct),keywords:String(keywords),severity:String(sev),sanction:sanc,raw:x};
  }

  async function load(){
    if(loaded)return rows;
    if(loading)return loading;
    loading=(async()=>{
      const chunks=await Promise.all(SOURCES.map(async ([name,url])=>{
        try{
          const r=await fetch(`${url}?search=${VERSION}`,{cache:'no-store',headers:{Accept:'application/json'}});
          if(!r.ok)return [];
          const j=await r.json();
          return sourceRows(j,name).map(({x})=>normalizeRow(x,name)).filter(Boolean);
        }catch(_){return [];}
      }));
      rows=chunks.flat();
      loaded=true;
      return rows;
    })();
    return loading;
  }

  function exactWord(text,q){
    const n=norm(q);
    if(!n)return false;
    const h=` ${norm(text)} `;
    return h.includes(` ${n} `);
  }

  function excludedFalsePositive(r,q){
    const n=norm(q);
    // Consultas sobre objetos concretos: no mostrar una sanción solo porque
    // comparta el término genérico "arma" y trate principalmente de otros objetos.
    if(['navaja','cuchillo','espada','katana','catana','sable','machete'].includes(n)){
      const context=norm(`${r.title} ${r.conduct}`);
      const unrelated=['explosivos','cartucheria','pirotecnia','municion'];
      if(unrelated.some(x=>context.includes(x)) && !exactWord(context,n))return true;
    }
    return false;
  }

  function score(r,q){
    const n=norm(q);
    if(!n)return -1;
    if(excludedFalsePositive(r,q))return -1;
    const code=norm(r.code), article=norm(r.article);
    if(code===n||article===n)return 10000;
    // Para búsquedas literales de una palabra, exige que exista en el contenido
    // de la infracción o en palabras clave explícitas. NO usa sinónimos.
    const inTitle=exactWord(r.title,q);
    const inConduct=exactWord(r.conduct,q);
    const inKeywords=exactWord(r.keywords,q);
    if(!inTitle&&!inConduct&&!inKeywords)return -1;
    let s=0;
    if(inTitle)s+=5000;
    if(inConduct)s+=4000;
    if(inKeywords)s+=2500;
    if(r.source==='Infracciones')s+=300;
    if(r.sanction)s+=100;
    return s;
  }

  function render(list,q){
    const b=box(); if(!b)return;
    if(count)count.textContent=String(list.length);
    if(!list.length){
      b.innerHTML=`<div class="empty-state"><div class="empty-icon">🔎</div><h3>Sin resultados</h3><p>No hay una coincidencia literal con «${esc(q)}».</p></div>`;
      return;
    }
    b.innerHTML=list.slice(0,30).map(r=>{
      const sanc=r.sanction;
      return `<article class="result-card cc-instant-result" style="display:block!important;opacity:1!important;visibility:visible!important;">
        <div class="result-card-header"><div><span class="result-ley">${esc(r.ley||r.source)}</span>${r.article?`<span class="result-code">Art. ${esc(r.article)}</span>`:''}<h3>${esc(r.title||r.code||'Resultado')}</h3></div>${r.severity?`<span class="severity-badge">${esc(r.severity)}</span>`:''}</div>
        <p class="result-conducta">${esc(r.conduct||'')}</p>
        ${sanc?`<div class="cc-instant-sanction" style="display:block!important;margin-top:10px;padding:10px 12px;border:1px solid rgba(98,255,123,.45);border-radius:10px;background:rgba(45,180,90,.08);"><strong style="display:block;font-size:12px;letter-spacing:.3px;">Sanción</strong><span style="display:block;margin-top:4px;font-size:14px;font-weight:800;">${esc(sanc)}</span></div>`:''}
        <div class="result-meta"><span class="result-pill">${esc(r.source)}</span></div>
      </article>`;
    }).join('');
  }

  async function search(q){
    const my=++generation;
    q=String(q||'').trim();
    if(!q){
      if(count)count.textContent='0';
      if(box())box().innerHTML='<div class="empty-state"><div class="empty-icon">🔎</div><h3>Buscar infracción</h3><p>Introduce un código, artículo o palabra clave para comenzar.</p></div>';
      return;
    }
    const all=await load();
    if(my!==generation)return;
    const list=all.map(r=>({r,s:score(r,q)})).filter(x=>x.s>=0);
    list.sort((a,b)=>b.s-a.s||a.r.article.localeCompare(b.r.article,'es'));
    const unique=[]; const seen=new Set();
    for(const item of list){
      const r=item.r; const key=`${r.ley}|${r.article}|${r.title}`;
      if(seen.has(key))continue;
      seen.add(key); unique.push(r);
      if(unique.length>=30)break;
    }
    if(severity!=='all'){
      const wanted=norm(severity);
      render(unique.filter(r=>norm(r.severity)===wanted),q);
    }else render(unique,q);
  }

  function bind(){
    const i=input();
    if(!i)return;
    i.removeAttribute('disabled');
    i.removeAttribute('readonly');
    if(!i.dataset.ccUnifiedSearch){
      i.dataset.ccUnifiedSearch=VERSION;
      i.addEventListener('input',e=>{
        e.stopImmediatePropagation();
        clearTimeout(timer);
        timer=setTimeout(()=>search(i.value),40);
      },{capture:true,passive:true});
      i.addEventListener('keydown',e=>{
        if(e.key!=='Enter')return;
        e.preventDefault();
        e.stopImmediatePropagation();
        clearTimeout(timer);
        search(i.value);
      },{capture:true});
      i.addEventListener('change',e=>e.stopImmediatePropagation(),{capture:true});
    }
    document.querySelectorAll('.filter-chip[data-severity]').forEach(b=>{
      b.dataset.ccUnifiedFilter=VERSION;
      b.addEventListener('click',e=>{
        e.preventDefault();
        e.stopImmediatePropagation();
        document.querySelectorAll('.filter-chip[data-severity]').forEach(x=>x.classList.remove('active'));
        b.classList.add('active');
        severity=b.dataset.severity||'all';
        search(i.value);
      },{capture:true});
    });
    const clear=$('clearConsultaSearch');
    if(clear&&!clear.dataset.ccUnifiedClear){
      clear.dataset.ccUnifiedClear=VERSION;
      clear.addEventListener('click',e=>{
        e.preventDefault();e.stopImmediatePropagation();
        i.value='';severity='all';
        document.querySelectorAll('.filter-chip[data-severity]').forEach(x=>x.classList.remove('active'));
        document.querySelector('.filter-chip[data-severity="all"]')?.classList.add('active');
        search('');
        i.focus();
      },{capture:true});
    }
    load();
    if(i.value.trim())search(i.value);
  }

  function boot(){bind();setTimeout(bind,100);setTimeout(bind,500);setTimeout(bind,1500);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
  window.CentinelaInstantSearch={search,install:bind,load};
})();
