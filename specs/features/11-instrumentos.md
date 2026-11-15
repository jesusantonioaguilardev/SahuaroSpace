# 11 · Instrumentos de tamizaje (PHQ‑9 y GAD‑7) — `INST`

**Objetivo:** cuando la conversación sugiere ánimo bajo o ansiedad, el personaje **ofrece** responder un cuestionario validado con botones. La puntuación la calcula el código, el resultado se queda en el teléfono y una respuesta de riesgo activa el protocolo de emergencia.

**Código:** [`data/Instruments.kt`](../../mobile/composeApp/src/commonMain/kotlin/app/astrohealth/eco/data/Instruments.kt) (definiciones, puntuación, detonadores), [`ui/InstrumentScreen.kt`](../../mobile/composeApp/src/commonMain/kotlin/app/astrohealth/eco/ui/InstrumentScreen.kt), `AppModel` (oferta, respuestas, resultados), campo `suggest_instrument` de [`server/eco.mjs`](../../server/eco.mjs).

> **Es un tamizaje, no un diagnóstico.** Los puntos de corte y la respuesta de la app ante cada resultado deben revisarse con un profesional de salud mental antes de cualquier uso real.

## Instrumentos

| Instrumento | Mide | Preguntas | Corto (primero) | Rango |
|---|---|---|---|---|
| PHQ‑9 | Síntomas depresivos | 9 | PHQ‑2 = preguntas 1–2 | 0–27 |
| GAD‑7 | Síntomas de ansiedad | 7 | GAD‑2 = preguntas 1–2 | 0–21 |

- Periodo: **últimas 2 semanas**. Opciones (0–3): Ningún día · Varios días · Más de la mitad de los días · Casi todos los días.
- Licencia: los cuestionarios PHQ y GAD‑7 (Spitzer, Williams, Kroenke y col.) se pueden reproducir, traducir y mostrar sin permiso. ⚠️ **Verificar el texto en español contra la versión oficial** (phqscreeners.com) antes de un uso real: la redacción incluida es para el prototipo.

### Puntos de corte

| PHQ‑9 | Nivel | GAD‑7 | Nivel |
|---|---|---|---|
| 0–4 | Mínimo | 0–4 | Mínimo |
| 5–9 | Leve | 5–9 | Leve |
| 10–14 | Moderado | 10–14 | Moderado |
| 15–19 | Moderadamente grave | 15–21 | Grave |
| 20–27 | Grave | | |

PHQ‑2 o GAD‑2 **≥ 3** = tamizaje positivo → se ofrece la versión completa.

## Requisitos

| ID | Requisito | Estado |
|---|---|---|
| INST-01 | Las preguntas, el encabezado del periodo y las 4 opciones DEBEN mostrarse **textuales** desde la definición fija en el código (español e inglés). La IA NO DEBE redactarlas ni parafrasearlas. | ✅ |
| INST-02 | **Detonador híbrido.** Se sugiere un instrumento si (a) la IA devuelve `suggest_instrument` = `phq` o `gad`, o (b) el mensaje contiene palabras clave de ánimo bajo (→ PHQ) o de ansiedad (→ GAD) en español o inglés. Si hay riesgo (`risk` ≠ `none`) NO DEBE ofrecerse: manda el protocolo de emergencia. | ✅ |
| INST-03 | El cuestionario DEBE **ofrecerse, no imponerse**: tarjeta "¿Quieres responder 2 preguntas rápidas…?" con [Sí] [Ahora no], debajo de la respuesta del personaje, sin bloquear la conversación. | 🟢 |
| INST-04 | **Frecuencia.** No se DEBE ofrecer el mismo instrumento si se completó hace menos de 14 días, ni si se rechazó hace menos de 24 h, ni más de una oferta abierta a la vez. | ✅ |
| INST-05 | **Escalonado.** Primero las 2 preguntas cortas. Si suman ≥ 3, se DEBE ofrecer continuar con el resto (sus respuestas se conservan); si suman < 3, se termina con el resultado corto. | ✅ |
| INST-06 | **Interacción.** Una pregunta a la vez, con 4 botones grandes, barra de avance ("3 de 9"), botón para volver a la pregunta anterior y para salir sin guardar. | 🟢 |
| INST-07 | La **puntuación** y el nivel DEBEN calcularse en el código con la tabla de cortes (nunca por la IA). | ✅ |
| INST-08 | **Seguridad.** En el PHQ‑9, una respuesta distinta de "Ningún día" en la pregunta 9 DEBE activar de inmediato el protocolo de emergencia (`self_harm_risk`, SAFE-02/03), con un mensaje de cuidado del personaje. | ✅ |
| INST-09 | El **resultado** DEBE mostrar el nivel en palabras, decir que es un tamizaje y no un diagnóstico, y con nivel moderado o mayor sugerir hablarlo con el médico de vuelo. NO DEBE usar lenguaje de diagnóstico ("tienes depresión"). | 🟢 |
| INST-10 | Las respuestas y resultados DEBEN guardarse **cifrados en el teléfono** (PRIV-02) y verse en "Salud → Cuestionarios" (fecha, instrumento, puntaje, nivel). Se borran con "Borrar todas mis conversaciones". | 🟢 |
| INST-11 | **Modo en vivo.** La oferta y el cuestionario DEBEN funcionar también ahí (con los mismos botones), y el ciclo de escucha automática DEBE pausarse mientras hay una oferta o un cuestionario abierto. | 🟢 |
| INST-13 | En "Salud → Cuestionarios" DEBE haber un botón **"Borrar historial de cuestionarios"** que, tras confirmar, borre los resultados **y** los registros de frecuencia (INST-04), de modo que los cuestionarios se puedan volver a ofrecer de inmediato (privacidad y demostraciones). | 🟢 |
| INST-12 | Compartir el puntaje con el médico DEBE requerir un permiso nuevo y separado (`screening`). | ⚪ Pendiente (requiere migración en Supabase) |

## Criterios de aceptación

- **INST-02** — *Dado* el mensaje "no he podido dormir y todo me da igual", *entonces* se sugiere PHQ; *dado* "estoy muy ansioso, no puedo dejar de preocuparme", *entonces* GAD; *dado* "hoy fue un buen día", ninguno; *dado* "ya no quiero vivir", ninguno (manda SAFE).
- **INST-04** — *Dado* un PHQ‑9 completado hace 3 días, *cuando* vuelve a detectarse ánimo bajo, *entonces* no se ofrece; *dado* uno completado hace 15 días, sí.
- **INST-05** — *Dado* PHQ‑2 con respuestas (1, 1), *entonces* termina con resultado "negativo"; *con* (2, 1), *entonces* ofrece continuar con 7 preguntas más.
- **INST-07** — *Dado* PHQ‑9 con total 10, *entonces* "Moderado"; total 4 → "Mínimo"; GAD‑7 total 15 → "Grave".
- **INST-08** — *Dado* PHQ‑9 con la pregunta 9 = "Varios días", *entonces* aparece el diálogo de aviso al médico.
- **INST-03/06** — *Dado* el chat, *cuando* digo "estoy muy nervioso y no puedo relajarme", *entonces* aparece la oferta; *cuando* toco Sí, veo "1 de 2" con 4 botones.

## Pruebas automáticas

- `InstrumentsTest.kt` → INST-01, 02, 04, 05, 07, 08.
- `server/test/eco.test.mjs` → `suggest_instrument` en el esquema y en el contrato.
