/* CENTINELA CODE — BUSCADOR DEFINITIVO DE INFRACCIONES Y NORMATIVA
   Busca SIEMPRE en todas las fuentes policiales disponibles.
   Prioriza data/infracciones.json para consultas de conductas y sanciones.
   2026-09-15
*/
(function(){
  'use strict';
  if(window.__centinelaDefinitiveSearchInstalled)return;
  window.__centinelaDefinitiveSearchInstalled=true;

  const SOURCES=[
    ['Infracciones','./data/infracciones.json'],
    ['LOPSC','./data/lopsc.json'],
    ['Reglamento de Armas','./data/reglamento_armas.json'],
    ['Código Penal','./data/codigo_penal.json'],
    ['Tráfico · infracciones','./data/infracciones_trafico.json'],
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
    ['Ley 5/2010 Andalucía','./data/ley_5_2010_andalucia.json'],
    ['VMP · infracciones','./data/infracciones_vmp_bicicletas.json'],
    ['VMP','./data/normativa_vmp_bicicletas.json']
  ];

  const ALIAS={
    espada:['espada','espadas','arma','armas','arma blanca','navaja','navajas','cuchillo','cuchillos','katana','sable','machete','daga','puñal','punal','estoque','florete','alfanje'],
    agresion:['agresion','agresiones','agresivo','ataque','atacar','violencia','lesiones','golpear','golpe','agresion fisica'],
    agresiones:['agresion','agresiones','ataque','violencia','lesiones','golpear','golpe'],
    desobediencia:['desobediencia','desobedecer','resistencia','resistirse','negativa','negarse','autoridad','agente'],
    navaja:['navaja','navajas','arma blanca','arma','armas','cuchillo','cuchillos','cuchilla','daga','puñal','punal','espada'],
    cuchillo:['cuchillo','cuchillos','navaja','navajas','arma blanca','arma','armas','espada','daga','puñal','punal'],
    arma:['arma','armas','arma blanca','navaja','navajas','cuchillo','cuchillos','espada','katana','sable','machete','daga','puñal','punal'],
    armas:['arma','armas','arma blanca','navaja','navajas','cuchillo','cuchillos','espada','katana','sable','machete','daga','puñal','punal'],
    droga:['droga','drogas','estupefaciente','estupefacientes','cannabis','hachis','marihuana','cocaina','cocaína'],
    ruido:['ruido','ruidos','molestia','molestias','vibraciones','musica','música','contaminacion acustica'],
    patinete:['patinete','vmp','vehiculo de movilidad personal'],
    vmp:['vmp','patinete','vehiculo de movilidad personal'],
    perro:['perro','perros','can','canino','animal','animales','ppp','potencialmente peligroso'],
    ppp:['ppp','perro potencialmente peligroso','perros potencialmente peligrosos','potencialmente peligroso','perro'],
    alcohol:['alcohol','alcoholemia','embriaguez','bebidas alcoholicas','botellon'],
    multa:['multa','multas','sancion','sanciones','infraccion','infracciones'],
    sancion:['sancion','sanciones','multa','multas','infraccion','infracciones'],
    infraccion:['infraccion','infracciones','sancion','sanciones','multa','multas']
  };

  const STOP=new Set(['a','al','ante','bajo','con','contra','de','del','desde','durante','el','en','entre','hacia','hasta','la','las','lo','los','para','por','segun','sin','sobre','un','una','unos','unas','y','o','que','es','se','su','sus','le','les','esta','este','estas','estos','ese','esa','esos','esas','mas','muy','tambien','como','cuando','donde','porque','pero','si','ya','asi','yo','tu','ella','ellos','ellas','nos','mi','mis','haber','hay','ser','fue','son','era','eran','cual','cuales','quien','quienes','cada','otro','otra','otros','otras','todo','toda','todos','todas']);
  const CACHE=new Map();
  let searchGeneration=0;
  let severity='all';

  const norm=s=>String(s??'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9./]+/g,' ').replace(/\s+/g,' ').trim();
  const tokens=s=>norm(s).split(' ').filter(Boolean).filter(x=>!STOP.has(x));
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));

  function rows(json,source){
    if(Array.isArray(json))return json;
    if(json&&Array.isArray(json.infracciones))return json.infracciones;
    if(json&&Array.isArray(json.articulos))return json.articulos;
    if(json&&Array.isArray(json.leyes)){
      const out=[];
      for(const ley of json.leyes){
        if(!Array.isArray(ley?.articulos))continue;
        for(const art of ley.articulos)out.push({...art,ley:art?.ley||ley?.ley||ley?.abreviatura||source});
      }
      return out;
    }
    return [];
  }

  function sanction(v){
    if(v==null)return '';
    if(typeof v!=='object')return String(v);
    const min=v.min??v.minimo??v.importe_min,max=v.max??v.maximo??v.importe_max,q=v.cuantia??v.cuantía;
    if(min!=null&&max!=null)return `${min} € – ${max} €`;
    if(min!=null)return `Desde ${min} €`;
    if(max!=null)return `Hasta ${max} €`;
    if(q!=null)return `${q} €`;
    return v.texto?String(v.texto):'';
  }

  function make(o,source,index){
    if(!o||typeof o!=='object')return null;
    const article=o.articulo??o.artículo??o.numero??o.art??o.precepto??'';
    const apartado=o.apartado??o.parrafo??o.párrafo??'';
    const title=o.titulo??o.título??o.concepto??o.denominacion??o.denominación??o.nombre??'';
    const description=o.conducta??o.descripcion??o.descripción??o.texto??o.contenido??o.tipificacion??o.tipificación??o.hechos??o.resumen??'';
    const ley=o.ley??o.normativa??o.fuente??source;
    const severity=o.gravedad??o.severity??o.clasificacion??o.clasificación??'';
    const code=o.codigo??o.código??o.id??'';
    const sanc=sanction(o.sancion??o.multa);
    const keywords=Array.isArray(o.palabrasClave)?o.palabrasClave.join(' '):Array.isArray(o.keywords)?o.keywords.join(' '):'';
    const articleText=String(article)+(apartado?'.'+String(apartado):'');
    return {source,index,id:String(o.id??''),code:String(code),ley:String(ley),article:articleText,title:String(title),description:String(description),severity:String(severity),sanction:sanc,keywords:String(keywords),searchable:norm([code,ley,articleText,title,description,severity,sanc,keywords].join(' '))};
  }

  async function load(src){
    const [name,url]=src;
    if(CACHE.has(url))return CACHE.get(url);
    const p=(async()=>{
      try{
        const r=await fetch(`${url}?definitive=20260915`,{cache:'no-store',headers:{Accept:'application/json'}});
        if(!r.ok)throw new Error(String(r.status));
        const data=await r.json();
        return rows(data,name).map((x,i)=>make(x,name,i)).filter(Boolean);
      }catch(e){console.warn('Centinela buscador definitivo:',name,e);return [];}
    })();
    CACHE.set(url,p);return p;
  }

  function expanded(t){return new Set([t,...(ALIAS[t]||[]).map(norm)]);}
  function matchesToken(t,text){for(const x of expanded(t)){if(text.includes(` ${x} `)||text.startsWith(x+' ')||text.endsWith(' '+x)||text===x)return true;}return false;}

  function score(r,qt,full){
    let hits=0,s=0;
    for(const t of qt){
      if(matchesToken(t,r.searchable)){
        hits++;s+=100;
        const ex=expanded(t);
        for(const x of ex){if(norm(r.title).includes(x))s+=160;if(norm(r.keywords).includes(x))s+=130;if(norm(r.description).includes(x))s+=80;}
        if(norm(r.article).includes(t))s+=180;
      }
    }
    if(full&&r.searchable.includes(full))s+=350;
    if(r.source==='Infracciones')s+=500;
    if(r.sanction)s+=1400;
    if(/4\/2015/.test(r.ley))s+=80;
    return {hits,s};
  }

  async function search(q){
    const my=++searchGeneration;
    q=String(q||'');
    const box=document.getElementById('consultaResults'),count=document.getElementById('consultaResultCount');
    if(!box)return;
    if(!q.trim()){if(count)count.textContent='0';box.innerHTML='<div class="empty-state"><div class="empty-icon">🔎</div><h3>Buscar normativa o infracción</h3><p>Introduce una palabra, conducta, artículo o código.</p></div>';return;}
    box.innerHTML='<div class="empty-state cc-loading"><div class="empty-icon">🔎</div><h3>Buscando en normativa e infracciones…</h3><p>Consultando todas las fuentes disponibles.</p></div>';
    const all=(await Promise.all(SOURCES.map(load))).flat();
    if(my!==searchGeneration)return;
    const qt=[...new Set(tokens(q))],full=norm(q),results=[];
    for(const r of all){
      if(severity!=='all'&&norm(r.severity)!==norm(severity))continue;
      const x=score(r,qt,full);
      const needed=qt.length<=1?1:Math.max(1,Math.ceil(qt.length*.6));
      if(x.hits>=needed)results.push({...r,_score:x.s});
    }
    results.sort((a,b)=>b._score-a._score);
    const unique=[],seen=new Set();
    for(const r of results){const key=`${r.ley}|${r.article}|${r.title}`;if(seen.has(key))continue;seen.add(key);unique.push(r);if(unique.length>=20)break;}
    if(count)count.textContent=String(unique.length);
    if(!unique.length){box.innerHTML=`<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Sin resultados</h3><p>No se ha encontrado coincidencia con «${esc(q)}».</p></div>`;return;}
    box.innerHTML=unique.map((r,i)=>`<article class="result-card cc-search-result" data-def-index="${i}"><div class="result-card-header"><div><span class="result-ley">${esc(r.ley||r.source)}</span>${r.article?`<span class="result-code">Art. ${esc(r.article)}</span>`:''}<h3>${esc(r.title||r.code||'Sin título')}</h3></div>${r.severity?`<span class="severity-badge">${esc(r.severity)}</span>`:''}</div><p class="result-conducta">${esc((r.description||'').slice(0,420))}${(r.description||'').length>420?'…':''}</p><div class="result-meta">${r.sanction?`<span class="result-pill result-pill--sancion"><span class="result-pill-label">Sanción</span> ${esc(r.sanction)}</span>`:''}<span class="result-pill">${esc(r.source)}</span></div><button type="button" class="result-detail-button cc-def-detail">Ver detalle</button></article>`).join('');
    box.querySelectorAll('.cc-def-detail').forEach((b,i)=>b.addEventListener('click',()=>detail(unique[i])));
  }

  function detail(r){
    const modal=document.getElementById('appModal'),body=document.getElementById('modalBody'),title=document.getElementById('modalTitle'),actions=document.getElementById('modalActions');
    if(!modal||!body){alert(`${r.ley}\nArt. ${r.article}\n${r.title}\n\n${r.description}\n\nSanción: ${r.sanction||'-'}`);return;}
    if(title)title.textContent=r.article?`Art. ${r.article}`:(r.code||r.source);
    body.innerHTML=`<div class="detail-content"><p><strong>Normativa:</strong> ${esc(r.ley||r.source)}</p><p><strong>Artículo:</strong> ${esc(r.article||'-')}</p><p><strong>Concepto:</strong> ${esc(r.title||'-')}</p><p><strong>Gravedad:</strong> ${esc(r.severity||'-')}</p><h4>Conducta / contenido</h4><p>${esc(r.description||'-')}</p>${r.sanction?`<h4>Sanción / cuantía</h4><p>${esc(r.sanction)}</p>`:''}</div>`;
    if(actions)actions.innerHTML='<button class="secondary-button" type="button" id="ccCloseDetail">Cerrar</button>';
    modal.classList.remove('hidden');document.getElementById('ccCloseDetail')?.addEventListener('click',()=>modal.classList.add('hidden'));
  }

  function install(){
    const input=document.getElementById('consultaSearch');
    if(!input)return false;
    if(!input.dataset.ccDefinitive){
      input.dataset.ccDefinitive='1';
      let timer;
      input.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(()=>search(input.value),250);},{capture:true});
      input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();clearTimeout(timer);search(input.value);}}, {capture:true});
    }
    document.querySelectorAll('.filter-chip[data-severity]').forEach(b=>{
      if(b.dataset.ccDefinitive)return;
      b.dataset.ccDefinitive='1';
      b.addEventListener('click',()=>{severity=b.dataset.severity||'all';search(input.value);},{capture:true});
    });
    return true;
  }

  window.CentinelaDefinitiveSearch={search,loadAll:()=>Promise.all(SOURCES.map(load))};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
  let tries=0;const timer=setInterval(()=>{if(install()||++tries>50)clearInterval(timer);},200);
})();
