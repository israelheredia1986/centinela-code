/* ============================================================
   CENTINELA IA — RESPUESTA POLICIAL CONVERSACIONAL
   Añade una capa final de presentación para el chat.
   ============================================================ */
(function(){
  "use strict";

  const STYLE_ID = "centinela-respuesta-policial-style";
  const TAG = "data-centinela-respuesta-policial";

  const normalizar = (s) => String(s ?? "")
    .replace(/\r\n?/g,"\n")
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .toLowerCase().trim();

  function valor(obj, nombres){
    if(!obj || typeof obj !== "object") return "";
    const buscadas = nombres.map(n=>normalizar(n).replace(/[^a-z0-9]/g,""));
    for(const [k,v] of Object.entries(obj)){
      const nk=normalizar(k).replace(/[^a-z0-9]/g,"");
      if(buscadas.includes(nk)) return v;
    }
    return "";
  }

  function esc(s){
    return String(s ?? "")
      .replace(/&/g,"&amp;").replace(/</g,"&lt;")
      .replace(/>/g,"&gt;").replace(/\"/g,"&quot;");
  }

  function textoLimpio(s){
    return String(s ?? "")
      .replace(/```(?:json)?/gi,"")
      .replace(/^\s*#{1,6}\s*/gm,"")
      .replace(/\*\*([^*\n]+)\*\*/g,"$1")
      .replace(/__([^_\n]+)__/g,"$1")
      .replace(/^\s*[-*]\s+/gm,"- ")
      .trim();
  }

  function aTexto(v){
    if(v===null || v===undefined) return "";
    if(Array.isArray(v)) return v.map(aTexto).filter(Boolean).join(" ");
    if(typeof v === "object") return "";
    return String(v).trim();
  }

  function aPasos(v){
    if(!v) return [];
    if(Array.isArray(v)) return v.map(aTexto).map(textoLimpio).filter(Boolean);
    return String(v).split(/\n+/).map(x=>x.replace(/^\s*[-•]\s*/,'').trim()).filter(Boolean).map(textoLimpio);
  }

  function formatearJSON(datos){
    const resumen = aTexto(valor(datos,["resumen","respuesta","analisis","analisis_juridico"]));
    const infraccion = aTexto(valor(datos,["infraccion","titulo","concepto","denominacion"]));
    const norma = aTexto(valor(datos,["norma","ley","fuente","legislacion"]));
    const articulo = aTexto(valor(datos,["articulo","precepto"]));
    const apartado = aTexto(valor(datos,["apartado"]));
    const gravedad = aTexto(valor(datos,["gravedad","calificacion","clasificacion"]));
    const cuantiaRaw = valor(datos,["cuantia","sancion","multa","importe"]);
    const cuantia = typeof cuantiaRaw === "object"
      ? aTexto(valor(cuantiaRaw,["texto","cuantia","importe","descripcion"])) || (()=>{
          const min=valor(cuantiaRaw,["min"]), max=valor(cuantiaRaw,["max"]);
          if(min!=="" && max!=="") return `${aTexto(min)} € a ${aTexto(max)} €`;
          if(min!=="") return `Desde ${aTexto(min)} €`;
          if(max!=="") return `Hasta ${aTexto(max)} €`;
          return "";
        })()
      : aTexto(cuantiaRaw);
    const autoridad = aTexto(valor(datos,["autoridad_sancionadora","autoridad","organo_sancionador"]));
    const descripcion = aTexto(valor(datos,["descripcion_juridica","descripcion","conducta","hechos"]));
    const fundamento = aTexto(valor(datos,["fundamento","fundamento_juridico","base_legal"]));
    let actuacion = valor(datos,["actuacion_policial","actuacion","metodo_actuacion_policial","procedimiento","protocolo"]);
    let verificaciones = valor(datos,["verificaciones","comprobaciones","comprobar"]);

    const infracciones = valor(datos,["infracciones","infracciones_detectadas","resultados"]);
    const extras = Array.isArray(infracciones) ? infracciones : [];

    const html=[];
    if(resumen) html.push(`<div class="cp-bloque"><div class="cp-titulo">VALORACIÓN POLICIAL</div><div class="cp-texto">${esc(textoLimpio(resumen))}</div></div>`);

    if(infraccion || norma || articulo || gravedad || cuantia){
      html.push(`<div class="cp-bloque"><div class="cp-titulo">ENCUADRE LEGAL</div>
        ${infraccion?`<div><strong>Infracción:</strong> ${esc(infraccion)}</div>`:""}
        ${norma?`<div><strong>Norma:</strong> ${esc(norma)}</div>`:""}
        ${articulo?`<div><strong>Artículo:</strong> ${esc(articulo)}${apartado?'.'+esc(apartado):''}</div>`:""}
        ${gravedad?`<div><strong>Gravedad:</strong> ${esc(gravedad)}</div>`:""}
        ${cuantia?`<div><strong>Sanción:</strong> ${esc(cuantia)}</div>`:""}
        ${autoridad?`<div><strong>Órgano competente:</strong> ${esc(autoridad)}</div>`:""}
      </div>`);
    }

    if(descripcion) html.push(`<div class="cp-bloque"><div class="cp-titulo">DESCRIPCIÓN</div><div class="cp-texto">${esc(textoLimpio(descripcion))}</div></div>`);
    if(fundamento) html.push(`<div class="cp-bloque"><div class="cp-titulo">FUNDAMENTO JURÍDICO</div><div class="cp-texto">${esc(textoLimpio(fundamento))}</div></div>`);

    if(extras.length){
      extras.slice(0,6).forEach((item,i)=>{
        const inf=aTexto(valor(item,["infraccion","titulo","concepto","denominacion"]));
        const ley=aTexto(valor(item,["norma","ley","fuente"]));
        const art=aTexto(valor(item,["articulo","precepto"]));
        const sev=aTexto(valor(item,["gravedad","calificacion"]));
        const san=valor(item,["cuantia","sancion","multa","importe"]);
        if(!inf && !ley && !art) return;
        html.push(`<div class="cp-bloque"><div class="cp-titulo">ALTERNATIVA ${i+1}</div>
          ${inf?`<div><strong>Infracción:</strong> ${esc(inf)}</div>`:""}
          ${ley?`<div><strong>Norma:</strong> ${esc(ley)}</div>`:""}
          ${art?`<div><strong>Artículo:</strong> ${esc(art)}</div>`:""}
          ${sev?`<div><strong>Gravedad:</strong> ${esc(sev)}</div>`:""}
          ${san?`<div><strong>Sanción:</strong> ${esc(aTexto(san))}</div>`:""}
        </div>`);
      });
    }

    const pasos=aPasos(actuacion);
    if(pasos.length){
      html.push(`<div class="cp-bloque"><div class="cp-titulo">MÉTODO DE ACTUACIÓN POLICIAL</div><ol class="cp-pasos">${pasos.map(p=>`<li>${esc(p)}</li>`).join("")}</ol></div>`);
    }

    const comprobaciones=aPasos(verificaciones);
    if(comprobaciones.length){
      html.push(`<div class="cp-bloque"><div class="cp-titulo">COMPROBACIONES</div><ol class="cp-pasos">${comprobaciones.map(p=>`<li>${esc(p)}</li>`).join("")}</ol></div>`);
    }

    if(!html.length) return "";
    return `<div class="centinela-respuesta-policial">${html.join("")}</div>`;
  }

  function render(burbuja){
    if(!burbuja || !burbuja.classList?.contains("chat-bubble") || !burbuja.classList.contains("ai")) return;
    if(burbuja.getAttribute(TAG)==="1") return;

    let raw=(burbuja.textContent||"").trim();
    raw=raw.replace(/^🤖\s*Centinela IA:\s*/i,"").trim();
    if(!raw) return;

    let data=null;
    try{data=JSON.parse(raw);}catch(_){
      const ini=raw.indexOf("{"); const fin=raw.lastIndexOf("}");
      if(ini>=0 && fin>ini){ try{data=JSON.parse(raw.slice(ini,fin+1));}catch(__){} }
    }
    if(!data || typeof data !== "object") return;

    const html=formatearJSON(data);
    if(!html) return;
    burbuja.setAttribute(TAG,"1");
    burbuja.innerHTML=html;
  }

  function instalar(){
    if(!document.getElementById(STYLE_ID)){
      const style=document.createElement("style");
      style.id=STYLE_ID;
      style.textContent=`
        .centinela-respuesta-policial{line-height:1.48;font-size:.95rem}
        .centinela-respuesta-policial .cp-bloque{margin:0 0 14px;padding-bottom:10px;border-bottom:1px solid rgba(148,163,184,.22)}
        .centinela-respuesta-policial .cp-bloque:last-child{border-bottom:0;margin-bottom:0}
        .centinela-respuesta-policial .cp-titulo{font-weight:900;letter-spacing:.035em;margin-bottom:6px}
        .centinela-respuesta-policial .cp-bloque>div:not(.cp-titulo){margin:3px 0}
        .centinela-respuesta-policial .cp-texto{white-space:pre-wrap}
        .centinela-respuesta-policial .cp-pasos{margin:6px 0 0;padding-left:22px}
        .centinela-respuesta-policial .cp-pasos li{margin:5px 0}
      `;
      document.head.appendChild(style);
    }

    document.querySelectorAll(".chat-bubble.ai").forEach(render);
    if(window.CentinelaRespuestaPolicialObserver) return;
    const obs=new MutationObserver(ms=>ms.forEach(m=>{
      if(m.type!=="childList") return;
      m.addedNodes.forEach(n=>{
        if(n.nodeType!==Node.ELEMENT_NODE) return;
        if(n.matches?.(".chat-bubble.ai")) render(n);
        n.querySelectorAll?.(".chat-bubble.ai").forEach(render);
      });
    }));
    if(document.body) obs.observe(document.body,{childList:true,subtree:true});
    window.CentinelaRespuestaPolicialObserver=obs;
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",instalar,{once:true});
  else instalar();
})();
