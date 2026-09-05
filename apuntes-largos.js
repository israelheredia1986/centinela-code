/* CENTINELA CODE — lector de Apuntes SPPL 2026 integrado en Apoyo operativo. */
(function(){
  "use strict";
  const DATA=[
    "./data/apuntes_sppl_2026_b01.txt","./data/apuntes_sppl_2026_b02.txt",
    "./data/apuntes_sppl_2026_b03.txt","./data/apuntes_sppl_2026_b04.txt",
    "./data/apuntes_sppl_2026_b05.txt","./data/apuntes_sppl_2026_b06.txt",
    "./data/apuntes_sppl_2026_b07.txt","./data/apuntes_sppl_2026_b08.txt"
  ];
  const norm=s=>String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  const esc=s=>String(s??"").replace(/[&<>\"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[m]));
  let cache=null;
  async function load(){
    if(cache) return cache;
    const res=await Promise.all(DATA.map(async u=>{const r=await fetch(u+"?v=20260905",{cache:"no-store"});if(!r.ok) return "";return r.text()}));
    const text=res.join("\n");
    const pages=[]; const re=/=====\s*P[AÁ]GINA\s+(\d+)\s+=====[\s\S]*?(?====={5,}\s*P[AÁ]GINA\s+|$)/gi;
    let m; while((m=re.exec(text))){ const raw=m[0]; pages.push({num:Number(m[1]),text:raw.replace(/^=====\s*P[AÁ]GINA\s+\d+\s+=====\s*/i,"").trim()}); }
    if(!pages.length){ cache={pages:[],text}; return cache; }
    cache={pages,text}; return cache;
  }
  function target(){return document.getElementById("section-apoyo-operativo");}
  function ensure(){
    const s=target(); if(!s||document.getElementById("ccOperModes")) return;
    const anchor=s.querySelector(".cc-oper-search"); if(!anchor) return;
    const bar=document.createElement("div"); bar.id="ccOperModes"; bar.className="cc-oper-modes";
    bar.innerHTML='<button class="active" data-mode="act">Actuaciones operativas</button><button data-mode="apuntes">Apuntes SPPL 2026</button>';
    anchor.parentNode.insertBefore(bar,anchor);
    bar.querySelectorAll("button").forEach(b=>b.onclick=()=>switchMode(b.dataset.mode));
    const source=document.createElement("div"); source.id="ccApuntesSource"; source.className="cc-apuntes-source"; source.innerHTML='<span>Fuente literal integrada · 294 páginas</span>';
    anchor.parentNode.insertBefore(source,anchor.nextSibling);
  }
  function switchMode(mode){
    ensure(); const s=target(); if(!s) return;
    s.dataset.ccMode=mode;
    document.querySelectorAll("#ccOperModes button").forEach(b=>b.classList.toggle("active",b.dataset.mode===mode));
    const title=s.querySelector(".cc-oper-title h2"); const desc=s.querySelector(".cc-oper-title p");
    if(title) title.textContent=mode==="apuntes"?"Apuntes SPPL 2026":"Apoyo operativo";
    if(desc) desc.textContent=mode==="apuntes"?"Consulta literal del texto largo, organizada por páginas.":"Actuaciones y casuística para consulta rápida durante el servicio.";
    const search=s.querySelector("#ccOperSearch"); if(search){search.placeholder=mode==="apuntes"?"Buscar artículo, epígrafe, término o página...":"Buscar actuación o situación..."; search.value="";}
    if(mode==="apuntes") renderApuntes(); else if(window.__ccOperRender) window.__ccOperRender();
  }
  async function renderApuntes(){
    const s=target(), list=document.getElementById("ccOperList"), count=document.getElementById("ccOperCount"), q=norm(document.getElementById("ccOperSearch")?.value||"");
    if(!list) return;
    list.innerHTML='<div class="cc-oper-loading">Cargando apuntes…</div>';
    const d=await load(); let pages=d.pages;
    if(q) pages=pages.filter(p=>norm(p.text).includes(q)||norm("pagina "+p.num).includes(q));
    if(count) count.textContent=`${pages.length} páginas encontradas`;
    list.innerHTML=pages.map(p=>`<article class="cc-apuntes-card"><span class="cc-oper-badge">Página ${p.num}</span><pre>${esc(p.text)}</pre></article>`).join("")||'<div class="cc-oper-empty"><strong>Sin resultados</strong><span>Prueba otra búsqueda.</span></div>';
  }
  function hookSearch(){
    const s=target(); if(!s||s.dataset.ccSearchHooked==="1") return;
    const input=s.querySelector("#ccOperSearch"); if(!input) return;
    s.dataset.ccSearchHooked="1";
    input.addEventListener("input",()=>{ if(s.dataset.ccMode==="apuntes") renderApuntes(); });
  }
  function styles(){
    if(document.getElementById("cc-apuntes-styles")) return;
    const st=document.createElement("style"); st.id="cc-apuntes-styles"; st.textContent=`
      .cc-oper-modes{display:flex;gap:7px;margin:0 0 9px;padding:3px;border:1px solid rgba(49,185,255,.16);background:rgba(3,16,28,.8);border-radius:12px}
      .cc-oper-modes button{flex:1;border:0;background:transparent;color:#91a8b8;border-radius:9px;padding:8px 9px;font-size:8px;font-weight:900;cursor:pointer}
      .cc-oper-modes button.active{background:rgba(49,185,255,.14);color:#dff6ff;box-shadow:inset 0 0 12px rgba(49,185,255,.08)}
      .cc-apuntes-source{font-size:7px;color:#6f8da0;text-transform:uppercase;letter-spacing:.6px;margin:-2px 2px 8px}
      .cc-apuntes-card{background:linear-gradient(145deg,rgba(5,23,40,.98),rgba(3,14,25,.98));border:1px solid rgba(44,112,151,.35);border-radius:15px;padding:12px}
      .cc-apuntes-card pre{white-space:pre-wrap;word-break:break-word;margin:9px 0 0;color:#d4e2ec;font:500 10px/1.5 ui-monospace,SFMono-Regular,Consolas,monospace}
      .cc-oper-loading{padding:24px;text-align:center;color:#7fa4b8;border:1px dashed rgba(49,185,255,.24);border-radius:14px}
    `; document.head.appendChild(st);
  }
  function boot(){
    styles();
    const timer=setInterval(()=>{ensure();hookSearch();if(target() && document.getElementById("ccOperModes")){clearInterval(timer);}},250);
    window.addEventListener("cc-apuntes-switch",()=>switchMode("apuntes"));
    window.ccApuntesSwitch=()=>switchMode("apuntes");
  }
  document.readyState==="loading"?document.addEventListener("DOMContentLoaded",boot,{once:true}):boot();
})();
