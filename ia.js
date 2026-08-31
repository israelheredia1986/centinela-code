// =====================================================
// CENTINELA CODE - IA SUPABASE EDGE FUNCTION
// =====================================================


const CENTINELA_IA_URL = 
"https://okuygqbaliaeavhyezri.supabase.co/functions/v1/centinela-ia";



async function preguntarCentinelaIA(pregunta) {

    try {


        const respuesta = await fetch(
            CENTINELA_IA_URL,
            {

                method: "POST",

                headers: {

                    "Content-Type": "application/json"

                },

                body: JSON.stringify({

                    pregunta: pregunta

                })

            }
        );



        const datos = await respuesta.json();



        if (datos.error) {

            console.error("Error IA:", datos.error);

            return "Error IA: " + datos.error;

        }



        return datos.choices[0].message.content;



    } catch(error) {


        console.error(
            "Error conexión Centinela IA:",
            error
        );


        return "Error conectando con Centinela IA";


    }

}
