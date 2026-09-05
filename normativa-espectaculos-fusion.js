/* CENTINELA — Fusiona las fuentes sueltas de Espectáculos Públicos con la ficha única de la Ley 13/1999 y su normativa de desarrollo. */
(function(){
  'use strict';
  const SOURCES=['./data/espectaculos_publicos.json','./data/aforo_hosteleria_eventos.json'];
  const norm=s=>String(s??'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim();
  const number=a=>String(a?.articulo??a?.numero??a?.id??'').trim();
  const key=a=>norm(number(a))||norm(JSON.stringify(a));
  function lawFor(record){const n=norm(record?.normativa||'');if(n.includes('13/1999')||n.includes('espectaculos publicos'))return 'Ley 13/1999 de Espectáculos Públicos y Actividades Recreativas de Andalucía';if(n.includes('155/2018'))return 'Decreto 155/2018 de Andalucía';return null;}
  async function run(){
    const api=window.__centinelaNormativaUnificada;
    if(!api) return setTimeout(run,250);
    // Espera a que el catálogo unificado haya terminado su primera carga.
    if(!api.laws().length) return setTimeout(run,300);
    const rs=await Promise.allSettled(SOURCES.map(u=>fetch(u+'?v=20260905-esp-fusion',{cache:'no-store'}).then(r=>r.json())));
    const records=rs.flatMap(r=>r.status==='fulfilled'&&Array.isArray(r.value)?r.value:[]);
    const laws=api.laws(), groups=new Map();
    for(const r of records){const name=lawFor(r);if(!name)continue;if(!groups.has(name))groups.set(name,[]);groups.get(name).push(r);}
    for(const [name,items] of groups){
      let law=laws.find(x=>{const n=norm(x.name);return name.startsWith('Ley 13/1999')?(n.includes('13/1999')||n.includes('espectaculos')):n.includes('155/2018');});
      if(!law){law={name,source:'Fuentes sectoriales',articles:[],sources:new Set()};laws.push(law);}
      if(!(law.sources instanceof Set))law.sources=new Set(Array.isArray(law.sources)?law.sources:[]);
      const map=new Map((law.articles||[]).map(a=>[key(a),a]));
      for(const r of items){law.sources.add('espectaculos_publicos.json + aforo_hosteleria_eventos.json');const k=key(r);if(!k)continue;const candidate={...r,numero:r.articulo??r.numero,titulo:r.titulo??r.concepto,texto:r.descripcion??r.conducta};const old=map.get(k);if(!old||JSON.stringify(candidate).length>JSON.stringify(old).length)map.set(k,candidate);}
      law.articles=[...map.values()].sort((a,b)=>number(a).localeCompare(number(b),'es',{numeric:true}));
    }
    // Provoca el repintado del catálogo ya fusionado sin volver a descargar las fuentes.
    const input=document.getElementById('normativaSearch');
    if(input){const v=input.value;input.value=' ';input.dispatchEvent(new Event('input',{bubbles:true}));input.value=v;input.dispatchEvent(new Event('input',{bubbles:true}));}
    window.__centinelaEspectaculosFusion=true;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
})();
