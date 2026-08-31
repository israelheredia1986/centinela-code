// =====================================================
// CENTINELA CODE - IA OPENAI (PRUEBA)
// =====================================================

// SOLO PARA PRUEBAS
// Más adelante se moverá a un servidor seguro

const OPENAI_API_KEY = "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" ;


async function preguntarCentinelaIA(pregunta) {

    try {

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
                            content: `
Eres Centinela IA.

Eres un asistente especializado para Policía Local.

Funciones:
- Ayudar a agentes de Policía Local.
- Explicar normativa.
- Ayudar a redactar actas.
- Orientar sobre procedimientos policiales.

Normas:
- No inventes artículos legales.
- Si no tienes certeza, indícalo.
- Diferencia siempre entre información general y actuación oficial.
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


        if (datos.error) {

            console.error("Error OpenAI:", datos.error);

            return "Error OpenAI: " + datos.error.message;

        }


        return datos.choices[0].message.content;


    } catch (error) {

        console.error("Error conexión IA:", error);

        return "Error de conexión con Centinela IA";

    }

}
