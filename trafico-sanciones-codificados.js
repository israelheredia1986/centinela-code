/* ============================================================
   CENTINELA CODE — SANCIONES DE LOS CODIFICADOS DE TRÁFICO V1
   Normaliza la consecuencia administrativa de los codificados
   de tráfico conforme al RDL 6/2015 (texto consolidado BOE).
   No sustituye el cuadro específico del Anexo IV para velocidad:
   el importe depende del límite y del exceso constatado.
   ============================================================ */
(function(){
  "use strict";

  const TRAFICO="Tráfico";
  const norm=v=>String(v??"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9.]+/g," ").replace(/\s+/g," ").trim();

  function letter(article){
    const m=String(article||"").toLowerCase().match(/^77\s*([a-zñ0-9]+)?/);
    return m&&m[1]?m[1]:"";
  }

  function consequence(article,title,description){
    const a=String(article||"").toLowerCase().replace(/\s+/g,"");
    const text=norm(`${title} ${description}`);
    const out={amount:"",points:"",note:""};

    // Exceso de velocidad: importe y puntos únicamente pueden fijarse
    // correctamente con límite y velocidad denunciada (Anexo IV).
    if(a.startsWith("76a")||a.startsWith("77a")||text.includes("exceso de velocidad")){
      out.amount="Según Anexo IV: 100 €, 300 €, 400 €, 500 € o 600 €, según límite y exceso";
      out.points="2, 4 o 6 puntos, según el tramo del Anexo IV";
      out.note="El buscador debe pedir/usar el límite y la velocidad denunciada para determinar el importe exacto.";
      return out;
    }

    if(a.startsWith("75")) out.amount="Hasta 100 €";
    else if(a.startsWith("76")) out.amount="200 €";
    else if(a.startsWith("77")) out.amount="500 €";

    if(a.startsWith("77c")){
      out.amount="1.000 €";
      out.points=text.includes("alcohol")?"4 o 6 puntos, según tasa y supuesto":"6 puntos";
      out.note="Alcohol: 1.000 € cuando concurra reincidencia en el año anterior o la tasa supere el doble de la permitida; drogas: 1.000 € y 6 puntos.";
    } else if(a.startsWith("77d")){
      out.amount="1.000 €";
      out.points="6 puntos";
    } else if(a.startsWith("77h")){
      out.amount="6.000 €";
      out.points="6 puntos";
    } else if(a.startsWith("77j")){
      out.amount="El doble de la multa originaria si era leve; el triple si era grave o muy grave";
    } else if(/77[n-t]/.test(a)){
      out.amount="3.000 € a 20.000 €";
    } else if(a.startsWith("77u")){
      out.amount="500 €";
      out.note="Además, el aspirante no podrá presentarse a pruebas para obtener/recuperar permiso o licencia durante 6 meses.";
    }

    // Baremo de puntos de las infracciones más relevantes del Anexo II.
    if(!out.points){
      if(text.includes("temeraria")||text.includes("sentido contrario")||text.includes("competicion")||text.includes("competición")||text.includes("inhibidor")||text.includes("drogas")||text.includes("negarse a")||text.includes("incendios")) out.points="6 puntos";
      else if(text.includes("alcohol")) out.points="4 o 6 puntos, según tasa y supuesto";
      else if(text.includes("telefono movil")||text.includes("teléfono móvil")||text.includes("telefono")) out.points=text.includes("sujetando con la mano")||text.includes("manteniendolo ajustado")?"6 puntos":"3 puntos";
      else if(text.includes("cinturon")||text.includes("cinturón")||text.includes("casco")||text.includes("retencion infantil")||text.includes("retención infantil")) out.points="4 puntos";
      else if(text.includes("stop")||text.includes("semaforo")||text.includes("semáforo")||text.includes("prioridad")||text.includes("agente")||text.includes("distancia de seguridad")||text.includes("adelantamiento")) out.points="4 puntos";
      else if(text.includes("cambio de sentido")) out.points="3 puntos";
      else if(text.includes("marcha atras")||text.includes("marcha atrás")||text.includes("autopista")||text.includes("autovia")||text.includes("autovía")) out.points="4 puntos";
      else if(text.includes("permiso")&&text.includes("suspend")) out.points="4 puntos";
      else if(text.includes("permiso")&&text.includes("careciendo")) out.points="4 puntos";
      else if(text.includes("tiempos de conduccion")||text.includes("tiempos de conducción")||text.includes("tacografo")||text.includes("tacógrafo")) out.points="6 puntos";
    }
    return out;
  }

  function enhance(){
    document.querySelectorAll(".cc-legal-consequence-result").forEach(card=>{
      const source=card.querySelector(".result-ley")?.textContent||"";
      if(norm(source)!==norm(TRAFICO))return;
      const article=card.querySelector(".result-code")?.textContent?.replace(/^Art\.\s*/i,"")||"";
      const title=card.querySelector("h3")?.textContent||"";
      const desc=card.querySelector(".result-conducta")?.textContent||"";
      const c=consequence(article,title,desc);
      const meta=card.querySelector(".result-meta");
      if(!meta)return;
      const parts=[];
      if(c.amount)parts.push(`<span class="result-pill result-pill--sancion"><strong>Sanción</strong>: ${c.amount}</span>`);
      if(c.points)parts.push(`<span class="result-pill"><strong>Puntos</strong>: ${c.points}</span>`);
      if(c.note)parts.push(`<span class="result-pill"><strong>Nota</strong>: ${c.note}</span>`);
      if(parts.length)meta.innerHTML=parts.join("");
    });
  }

  const observer=new MutationObserver(()=>enhance());
  observer.observe(document.documentElement,{subtree:true,childList:true});
  setTimeout(enhance,500);
  window.CentinelaTrafficSanctions={enhance,consequence};
})();
