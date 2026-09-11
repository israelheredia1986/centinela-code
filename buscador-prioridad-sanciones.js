/* CENTINELA CODE — RELEVANCIA REAL DE ARMAS + SANCIONES V2 */
(function(){
  "use strict";
  const WEAPON={
    navaja:["navaja","navajas","arma blanca","cuchillo","cuchillos","cuchilla","daga","puñal","punal","espada","espadas","katana","katanas","sable","sables","machete","machetes","estoque","florete","alfanje","bayoneta","hacha","hachas"],
    cuchillo:["cuchillo","cuchillos","navaja","navajas","arma blanca","daga","puñal","punal","espada","katana","sable","machete"],
    espada:["espada","espadas","arma blanca","arma","armas","katana","sable","machete","daga","puñal","punal","estoque","florete"],
    katana:["katana","katanas","espada","espadas","arma blanca","arma","armas","sable"],
    sable:["sable","sables","espada","espadas","arma blanca","arma","armas","katana"],
    machete:["machete","machetes","arma blanca","arma","armas","cuchillo","cuchillos"],
    daga:["daga","dagas","puñal","punal","navaja","arma blanca","arma","armas"],
    puñal:["puñal","punal","daga","navaja","arma blanca","arma","armas"],
    punal:["puñal","punal","daga","navaja","arma blanca","arma","armas"],
    arma:["arma","armas","arma blanca","navaja","cuchillo","espada","katana","sable","machete","daga","puñal","punal"]
  };
  const BAD={
    navaja:["cartucheria","cartuchería","municion","munición","explosivos","pirotecnia","articulos pirotecnicos","artículos pirotécnicos"],
    cuchillo:["cartucheria","cartuchería","municion","munición","explosivos","pirotecnia"],
    espada:["cartucheria","cartuchería","municion","munición","explosivos","pirotecnia"],
    katana:["cartucheria","cartuchería","municion","munición","explosivos","pirotecnia"],
    sable:["cartucheria","cartuchería","municion","munición","explosivos","pirotecnia"]
  };
  const norm=s=>String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  function queryKey(q){const n=norm(q).trim(); if(WEAPON[n])return n; for(const k of Object.keys(WEAPON)){if(WEAPON[k].includes(n))return k;} return null;}
  function cardScore(card,q){
    const text=norm(card.innerText||card.textContent||"");
    const n=norm(q).trim(); const key=queryKey(q);
    let s=0;
    if(n && text.includes(n))s+=12000;
    if(key){
      for(const t of WEAPON[key]){const x=norm(t); if(text.includes(x))s+=(x===n?7000:1800);}
      for(const b of (BAD[key]||[])){if(text.includes(norm(b)))s-=10000;}
      if(text.includes("sanción")||text.includes("sancion"))s+=1800;
      if(text.includes("€"))s+=1200;
    }
    return s;
  }
  function reorder(){
    const box=document.getElementById("consultaResults"),input=document.getElementById("consultaSearch");
    if(!box||!input)return;
    const q=input.value||""; const key=queryKey(q); if(!key)return;
    const cards=[...box.querySelectorAll("article.result-card,article.cc-search-result")];
    if(cards.length<2)return;
    cards.sort((a,b)=>cardScore(b,q)-cardScore(a,q));
    const frag=document.createDocumentFragment(); cards.forEach(c=>frag.appendChild(c)); box.appendChild(frag);
  }
  function install(){
    const box=document.getElementById("consultaResults"),input=document.getElementById("consultaSearch");
    if(!box||!input)return;
    if(box.dataset.ccWeaponPriority)return; box.dataset.ccWeaponPriority="1";
    const run=()=>requestAnimationFrame(reorder);
    new MutationObserver(run).observe(box,{childList:true,subtree:true});
    input.addEventListener("input",run,{passive:true});
    input.addEventListener("change",run,{passive:true});
    run();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true}); else install();
  setTimeout(install,300); setTimeout(install,1000); setTimeout(install,2500);
})();
