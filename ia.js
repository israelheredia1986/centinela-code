// =====================================================
// CENTINELA CODE - IA OPENAI (PRUEBA)
// =====================================================

// SOLO PARA PRUEBAS
// Después se moverá a servidor seguro

const OPENAI_API_KEY = "PEGA_AQUI_TU_CLAVE";


async function preguntarCentinelaIA(pregunta) {

    const respuesta = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({

                model: "gpt-4.1-mini",

                messages: [

                    {
                        role: "system",
                        content:
                        `
                        Eres Centinela IA.

                        Eres un asistente especializado
                        para Policía Local.

                        Reglas:
                        - No inventes artículos.
                        - Explica la normativa claramente.
                        - Ayuda a redactar actas.
                        - Usa lenguaje profesional policial.
                        `
                    },

                    {
                        role: "user",
                        content: pregunta
                    }

                ]

            })
        }
    );


    const datos = await respuesta.json();


    if(datos.error){
        console.error(datos.error);
        return "Error conectando con OpenAI";
    }


    return datos.choices[0].message.content;

}
