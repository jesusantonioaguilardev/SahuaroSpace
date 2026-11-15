# 01 · Conversación (chat por texto y voz) — `CHAT`

**Objetivo:** que el tripulante pueda desahogarse o conversar con su personaje por texto o voz, con respuestas breves, en su idioma, sin repeticiones y aun sin conexión con la IA.

**Pantalla:** T3 Conversación ([`ui/EcoScreen.kt`](../../mobile/composeApp/src/commonMain/kotlin/app/astrohealth/eco/ui/EcoScreen.kt)) · **Servidor:** `POST /api/eco` ([`server/eco.mjs`](../../server/eco.mjs))

## Requisitos

| ID | Requisito | Estado |
|---|---|---|
| CHAT-01 | La conversación DEBE tener dos modos elegibles: **Solo escuchar** (refleja y valida, sin consejos, máximo una pregunta abierta) y **Compañero** (conversa y PUEDE sugerir contramedidas de NASA). Durante una tormenta solar el modo DEBE ser **refugio** (calma, datos concretos, respiración) sin que el tripulante lo elija. | 🟢 |
| CHAT-02 | El tripulante DEBE poder escribir o dictar. Un mensaje dictado DEBE marcarse "por voz" en el chat. | 🟢 |
| CHAT-03 | Las respuestas DEBEN estar en el idioma del tripulante (`es`/`en`), sin markdown, listas ni emojis, y en menos de 60 palabras (30 en modo en vivo, LIVE-05). | 🟢 |
| CHAT-04 | El personaje DEBE usar los datos de salud solo si se los piden o si importan claramente, sin inventar valores ni diagnosticar. | 🟢 |
| CHAT-05 | Cada personaje DEBE tener su propia conversación guardada. Al cambiar de personaje se DEBE mostrar la conversación de ese personaje; una respuesta que llega después de cambiar DEBE guardarse en la conversación de quien la dio. | 🟢 |
| CHAT-06 | La app DEBE enviar el saludo inicial como primer turno del historial, y el servidor DEBE indicar que la conversación ya empezó, para que el personaje NO DEBA presentarse otra vez. | 🟢 |
| CHAT-07 | **Sin ciclos.** El servidor DEBE considerar repetida una respuesta que: (a) comparte ≥ 70 % de sus palabras con una de las 5 últimas respuestas, (b) empieza con las mismas 3 palabras, o (c) repite literalmente un fragmento de ≥ 3 palabras entre signos de puntuación. Si es repetida y no hay riesgo, DEBE pedirla de nuevo hasta 2 veces. | ✅ |
| CHAT-08 | **Modo local.** Si no hay servidor o IA, el personaje DEBE responder con frases de su personalidad, sin repetir ninguna de sus 4 últimas respuestas mientras haya alternativas, y DEBE avisarse en lenguaje humano ("Sin conexión con la IA") sin códigos técnicos. | ✅ |
| CHAT-09 | Borrar la conversación DEBE pedir confirmación y explicar que no se puede recuperar. | 🟢 |
| CHAT-10 | El servidor NO DEBE registrar el contenido de las conversaciones (solo códigos de error). | 🟢 |

## Criterios de aceptación

- **CHAT-05** — *Dado* que hablé con Luma, *cuando* elijo a Nix en Ajustes, *entonces* veo solo el saludo de Nix; *y cuando* vuelvo a Luma, veo mi conversación con ella intacta.
- **CHAT-06** — *Dado* una conversación iniciada, *cuando* escribo "hola", *entonces* la respuesta no dice "Soy Luma" ni repite el saludo.
- **CHAT-07** — *Dado* que respondo "no sé" tres veces seguidas, *cuando* llegan las respuestas, *entonces* ninguna empieza con las mismas 3 palabras que otra ni repite un fragmento literal de ≥ 3 palabras.
- **CHAT-08** — *Dado* que el servidor está apagado, *cuando* envío 4 mensajes en modo escucha, *entonces* las 4 respuestas son distintas y aparece el aviso "Sin conexión con la IA".

## Verificación manual

CHAT-01..06 y 09: abrir T3, probar ambos modos, cambiar de personaje en Ajustes, borrar conversación. Verificado en emulador y teléfono (2026‑11‑14/15).

## Pruebas automáticas

- `server/test/eco.test.mjs` → CHAT-07 (detector de repeticiones), API-02 (recortes).
- `mobile/.../commonTest/.../LocalEcoTest.kt` → CHAT-08.
