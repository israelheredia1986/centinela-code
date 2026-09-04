/* ============================================================
   CENTINELA IA — FORMATO POLICIAL DEL CHAT
   Convierte respuestas JSON del motor IA en una respuesta legible,
   operativa y orientada a Policía Local. No modifica el JSON usado
   por el módulo de actas.
   ============================================================ */
(function () {
  "use strict";

  const MARCA = "data-centinela-police-formatted";
  const TIMERS = new WeakMap();

  function texto(valor) {
    if (valor === null || valor === undefined) return "";
    if (typeof valor === "object") return Array.isArray(valor) ? valor.map(texto).filter(Boolean).join("; ") : "";
    return String(valor).trim();
  }

  function esc(valor) {
    return texto(valor).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }

  function normalizarClave(valor) {
    return String(valor||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,"");
  }

  function valorClave(obj, claves) {
    if (!obj || typeof obj !== "object") return "";
    const buscadas=claves.map(normalizarClave);
    for(const [clave,valor] of Object.entries(obj)) if(buscadas.includes(normalizarClave(clave))) return valor;
    return "";
  }

  function listaInfracciones(datos) {
    const lista=valorClave(datos,["infracciones","infracciones_detectadas","resultados"]);
    if(Array.isArray(lista)) return lista;
    if(lista&&typeof lista==="object") return [lista];
    const una=valorClave(datos,["infraccion"]);
    return una||valorClave(datos,["articulo","codigo"])?[datos]:[];
  }

  function limpiarMarkdown(valor) {
    return texto(valor).replace(/^\s*#{1,6}\s*/gm,"").replace(/\*\*([^*\n]+)\*\*/g,"$1").replace(/__([^_\n]+)__/g,"$1").replace(/\*([^*\n]+)\*/g,"$1").replace(/_([^_\n]+)_/g,"$1").replace(/^\s*[-*]\s+/gm,"- ").replace(/`/g,"").replace(/\n{3,}/g,"\n\n").trim();
  }

  function formatearInfraccion(item,indice) {
    const articulo=valorClave(item,["articulo","precepto"]), apartado=valorClave(item,["apartado"]), codigo=valorClave(item,["codigo","id"]), norma=valorClave(item,["fuente","norma","ley","legislacion"]), titulo=valorClave(item,["titulo","infraccion","denominacion","concepto"]), descripcion=valorClave(item,["descripcion","descripcion_juridica","conducta","texto"]), gravedad=valorClave(item,["gravedad","calificacion"]), cuantia=valorClave(item,["cuantia","sancion","multa","importe"]), fundamento=valorClave(item,["fundamento","fundamento_juridico","base_legal"]);
    let sancion=cuantia;
    if(sancion&&typeof sancion==="object"){
      const min=valorClave(sancion,["min"]),max=valorClave(sancion,["max"]),cantidad=valorClave(sancion,["cuantia","importe"]),detalle=valorClave(sancion,["texto","descripcion"]);
      if(cantidad)sancion=texto(cantidad);else if(min!==""&&max!=="")sancion=`${texto(min)} € a ${texto(max)} €`;else if(min!=="")sancion=`Desde ${texto(min)} €`;else if(max!=="")sancion=`Hasta ${texto(max)} €`;else sancion=texto(detalle);
    }
    const partes=[],encabezado=[articulo?`Artículo ${texto(articulo)}${apartado?`.${texto(apartado)}`:""}`:"",codigo?`Código ${texto(codigo)}`:""].filter(Boolean).join(" · ");
    if(encabezado)partes.push(`<div class="centinela-police-line"><strong>${esc(encabezado)}</strong></div>`);
    if(norma)partes.push(`<div class="centinela-police-line"><strong>Norma:</strong> ${esc(norma)}</div>`);
    if(titulo)partes.push(`<div class="centinela-police-line"><strong>Infracción:</strong> ${esc(titulo)}</div>`);
    if(gravedad)partes.push(`<div class="centinela-police-line"><strong>Calificación:</strong> ${esc(gravedad)}</div>`);
    if(sancion)partes.push(`<div class="centinela-police-line"><strong>Sanción:</strong> ${esc(sancion)}</div>`);
    if(descripcion)partes.push(`<div class="centinela-police-line"><strong>Descripción:</strong> ${esc(limpiarMarkdown(descripcion))}</div>`);
    if(fundamento)partes.push(`<div class="centinela-police-line"><strong>Fundamento:</strong> ${esc(limpiarMarkdown(fundamento))}</div>`);
    return `<div class="centinela-police-offence"><div class="centinela-police-subtitle">${indice>0?`Infracción ${indice+1}`:"Calificación propuesta"}</div>${partes.join("")}</div>`;
  }

  function formatearJSON(datos) {
    const resumen=valorClave(datos,["resumen","respuesta","analisis","analisis_juridico"]),fundamentoGlobal=valorClave(datos,["fundamento","fundamento_juridico","base_legal"]),actuacion=valorClave(datos,["actuacion_policial","actuacion","metodo_actuacion_policial","procedimiento"]),verificaciones=valorClave(datos,["verificaciones","comprobaciones","comprobar"]),autoridad=valorClave(datos,["autoridad_sancionadora","autoridad"]),gravedad=valorClave(datos,["gravedad","calificacion"]),cuantia=valorClave(datos,["cuantia","sancion","multa","importe"]),articulo=valorClave(datos,["articulo","precepto"]),norma=valorClave(datos,["norma","ley","fuente"]),infraccion=valorClave(datos,["infraccion","titulo","concepto"]),lista=listaInfracciones(datos);
    const bloques=[];
    if(resumen)bloques.push(`<section class="centinela-police-section"><div class="centinela-police-title">Valoración</div><div class="centinela-police-text">${esc(limpiarMarkdown(resumen))}</div></section>`);
    if(infraccion||articulo||norma||gravedad||cuantia)bloques.push(formatearInfraccion({infraccion,articulo,norma,gravedad,cuantia},0));
    if(lista.length)lista.slice(0,8).forEach((item,indice)=>{const esPrincipal=item===datos||(!infraccion&&indice===0);if(esPrincipal&&(infraccion||articulo||norma||gravedad||cuantia))return;bloques.push(formatearInfraccion(item,indice));});
    if(fundamentoGlobal)bloques.push(`<section class="centinela-police-section"><div class="centinela-police-title">Fundamento jurídico</div><div class="centinela-police-text">${esc(limpiarMarkdown(fundamentoGlobal))}</div></section>`);
    if(autoridad)bloques.push(`<section class="centinela-police-section"><div class="centinela-police-title">Autoridad competente</div><div class="centinela-police-text">${esc(limpiarMarkdown(autoridad))}</div></section>`);
    if(actuacion){const pasos=Array.isArray(actuacion)?actuacion:String(actuacion).split(/\n|;(?=\s*[A-ZÁÉÍÓÚÑ])/).filter(Boolean);bloques.push(`<section class="centinela-police-section"><div class="centinela-police-title">Método de actuación policial</div><div class="centinela-police-steps">${pasos.map((paso,i)=>`<div><strong>${i+1}.</strong> ${esc(limpiarMarkdown(paso).replace(/^[-•]\s*/,""))}</div>`).join("")}</div></section>`);}
    if(verificaciones){const pasos=Array.isArray(verificaciones)?verificaciones:[verificaciones];bloques.push(`<section class="centinela-police-section"><div class="centinela-police-title">Comprobaciones antes de denunciar</div><div class="centinela-police-steps">${pasos.map((paso,i)=>`<div><strong>${i+1}.</strong> ${esc(limpiarMarkdown(paso).replace(/^[-•]\s*/,""))}</div>`).join("")}</div></section>`);}
    return bloques.length?`<div class="centinela-police-response">${bloques.join("")}</div>`:"";
  }

  function parsearRespuesta(valor) {
    const bruto=texto(valor);if(!bruto)return"";
    const candidatos=[bruto,bruto.replace(/^```(?:json)?\s*/i,"").replace(/```$/i,"").trim()];
    const inicio=bruto.indexOf("{"),fin=bruto.lastIndexOf("}");
    if(inicio>=0&&fin>inicio)candidatos.push(bruto.slice(inicio,fin+1));
    for(const candidato of candidatos){try{const datos=JSON.parse(candidato);if(datos&&typeof datos==="object")return formatearJSON(datos);}catch(_){} }
    return "";
  }

  function aplicarEstilos(){
    if(document.getElementById("centinela-police-format-style"))return;
    const style=document.createElement("style");style.id="centinela-police-format-style";style.textContent=`
      .chat-bubble.ai .centinela-police-response{display:block;line-height:1.45}
      .chat-bubble.ai .centinela-police-section,.chat-bubble.ai .centinela-police-offence{margin:0 0 14px}
      .chat-bubble.ai .centinela-police-title,.chat-bubble.ai .centinela-police-subtitle{font-weight:800;margin-bottom:6px;letter-spacing:.01em}
      .chat-bubble.ai .centinela-police-line{margin:3px 0}
      .chat-bubble.ai .centinela-police-text{white-space:pre-wrap}
      .chat-bubble.ai .centinela-police-steps>div{margin:4px 0}
      .chat-bubble.ai .centinela-police-offence{padding:0 0 4px;border-bottom:1px solid rgba(148,163,184,.22)}
      .chat-bubble.ai .centinela-police-offence:last-child{border-bottom:0}
    `;document.head.appendChild(style);
  }

  function formatearBurbuja(burbuja){
    if(!burbuja||!burbuja.classList?.contains("chat-bubble")||!burbuja.classList.contains("ai")||burbuja.getAttribute(MARCA)==="1")return false;
    const actual=burbuja.textContent||"";if(!actual.trim())return false;
    const html=parsearRespuesta(actual);if(!html)return false;
    burbuja.setAttribute(MARCA,"1");
    if(TIMERS.has(burbuja))clearTimeout(TIMERS.get(burbuja));
    burbuja.innerHTML=html;
    return true;
  }

  function programar(burbuja, demora=220){
    if(!burbuja||burbuja.getAttribute(MARCA)==="1")return;
    if(TIMERS.has(burbuja))clearTimeout(TIMERS.get(burbuja));
    TIMERS.set(burbuja,setTimeout(()=>{
      TIMERS.delete(burbuja);
      formatearBurbuja(burbuja);
    },demora));
  }

  function buscarBurbuja(nodo){
    if(!nodo)return null;
    if(nodo.nodeType===Node.ELEMENT_NODE){
      if(nodo.matches?.(".chat-bubble.ai"))return nodo;
      return nodo.closest?.(".chat-bubble.ai")||nodo.querySelector?.(".chat-bubble.ai")||null;
    }
    return nodo.parentElement?.closest?.(".chat-bubble.ai")||null;
  }

  function instalar(){
    aplicarEstilos();
    document.querySelectorAll(".chat-bubble.ai").forEach(b=>programar(b,80));
    if(window.CentinelaPoliceFormatObserver)return;

    const observer=new MutationObserver(muts=>{
      muts.forEach(m=>{
        let burbuja=null;
        if(m.type==="characterData") burbuja=buscarBurbuja(m.target);
        if(m.type==="childList"){
          burbuja=buscarBurbuja(m.target);
          m.addedNodes.forEach(n=>{
            const b=buscarBurbuja(n);
            if(b)programar(b,260);
          });
        }
        if(burbuja)programar(burbuja,260);
      });
    });

    if(document.body)observer.observe(document.body,{childList:true,subtree:true,characterData:true});
    window.CentinelaPoliceFormatObserver=observer;

    // Revisión corta adicional para respuestas que el motor inserta por etapas.
    let vueltas=0;
    const revisar=setInterval(()=>{
      vueltas++;
      document.querySelectorAll(".chat-bubble.ai:not([data-centinela-police-formatted])").forEach(b=>programar(b,60));
      if(vueltas>=30)clearInterval(revisar);
    },250);
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",instalar,{once:true});else instalar();
})();
