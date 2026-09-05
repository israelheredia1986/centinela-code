/* CENTINELA — Fusiona y elimina duplicados de Espectáculos Públicos. */
(function(){
  'use strict';
  const SOURCES=['./data/espectaculos_publicos.json','./data/aforo_hosteleria_eventos.json'];
  const norm=s=>String(s??'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim();
  const number=a=>String(a?.articulo??a?.numero??a?.number??a?.id??'').trim();
  const key=a=>norm(number(a))||norm(JSON.stringify(a));
  const isEspLaw=l=>{const n=norm(l?.name);return n.includes('13/1999')||n==='ley de espectaculos publicos'||(n.includes('ley de espectaculos publicos')&&!n.includes('decreto'));};
  const isDecLaw=l=>norm(l?.name).includes('155/2018');
  function lawFor(r){const n=norm(r?.normativa||r?.ley||r?.nombre||'');if(n.includes('13/1999')||n.includes('ley de espectaculos publicos'))return 'Ley 13/1999 de Espectáculos Públicos y Actividades Recreativas de Andalucía';if(n.includes('155/2018'))return 'Decreto 155/2018 de Andalucía';return null;}
  function mergeInto(target,items){if(!target)return;if(!(target.sources instanceof Set))target.sources=new Set(Array.isArray(target.sources)?target.sources:[]);const map=new Map((target.articles||[]).map(a=>[key(a),a]));for(const r of items){target.sources.add(r.__source||'Fuentes sectoriales');const candidate={...r,numero:r.articulo??r.numero,titulo:r.titulo??r.concepto,texto:r.descripcion??r.conducta};const k=key(candidate);if(!k)continue;const old=map.get(k);if(!old||JSON.stringify(candidate).length>JSON.stringify(old).length)map.set(k,candidate);}target.articles=[...map.values()].sort((a,b)=>number(a).localeCompare(number(b),'es',{numeric:true}));}
  function repaintOnce(){const input=document.getElementById('normativaSearch');if(input)input.dispatchEvent(new Event('input',{bubbles:true}));else if(typeof window.__centinelaNormativaUnificada?.render==='function')window.__centinelaNormativaUnificada.render();}
  async function fuse(api,notify){
    const laws=api.laws();
    const rs=await Promise.allSettled(SOURCES.map(u=>fetch(u+'?v=20260905-esp-fusion-3',{cache:'no-store'}).then(r=>r.json())));
    const records=rs.flatMap(r=>r.status==='fulfilled'&&Array.isArray(r.value)?r.value:[]).map(r=>({...r,__source:'Fuentes sectoriales'}));
    const grouped={'Ley 13/1999 de Espectáculos Públicos y Actividades Recreativas de Andalucía':[],'Decreto 155/2018 de Andalucía':[]};
    for(const r of records){const name=lawFor(r);if(name)grouped[name].push(r);}
    const collapse=(canonical,matcher)=>{const matches=laws.filter(matcher);let target=matches.find(l=>norm(l.name)===norm(canonical));if(!target){target={name:canonical,source:'Fuentes sectoriales',articles:[],sources:new Set()};laws.push(target);}for(const other of matches){if(other!==target)mergeInto(target,(other.articles||[]).map(a=>({...a,__source:other.name})));}mergeInto(target,grouped[canonical]);for(let i=laws.length-1;i>=0;i--)if(laws[i]!==target&&matcher(laws[i]))laws.splice(i,1);};
    collapse('Ley 13/1999 de Espectáculos Públicos y Actividades Recreativas de Andalucía',isEspLaw);
    collapse('Decreto 155/2018 de Andalucía',isDecLaw);
    window.__centinelaEspectaculosFusion=true;
    // IMPORTANTE: solo se provoca un render inicial. Si fuse() se ejecuta desde
    // api.reload(), NO volvemos a lanzar el evento input: eso creaba un ciclo
    // reload -> fuse -> input -> reload y producía el parpadeo.
    if(notify)repaintOnce();
  }
  async function run(){const api=window.__centinelaNormativaUnificada;if(!api)return setTimeout(run,250);if(!api.laws().length)return setTimeout(run,300);if(!api.__espReloadPatched){const originalReload=api.reload;api.reload=async function(){const result=await originalReload();await fuse(api,false);return result;};api.__espReloadPatched=true;}await fuse(api,true);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
})();
