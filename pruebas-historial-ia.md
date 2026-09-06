# Historial IA — comprobación

Implementación V2 en `historial-ia.js`.

Comprobaciones estáticas realizadas:
- El módulo se carga desde `buscadores.js`.
- Guarda conversaciones en `localStorage`.
- Recupera la conversación actual mediante su identificador.
- Reconstruye las burbujas en `#chatMessages` al recuperar una conversación.
- `Nueva conversación` limpia el chat y crea un contexto nuevo.
- El wrapper conserva la función `preguntarCentinelaIA` existente y guarda la respuesta después de cada consulta.

Nota: la ejecución interactiva final depende del navegador donde se despliegue la PWA; el código queda preparado para esa comprobación con el chat real.